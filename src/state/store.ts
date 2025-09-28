import { create } from 'zustand';
import { Resource, ActionLog, Rule, HabitKey, BuildId, PrestigeState, ShardType, DifficultyMode, PrestigeReward } from '@/types';
import { upsertResource, insertAction, listActions, getResource } from '@/db/db';
import { touchHabit } from '@/logic/habits';
import { calculateCaps } from '@/logic/prestige';
import { getRitual } from '@/config/rituals';
import { upsertEffectRecord } from '@/db/db';

const ACTION_HABIT: Partial<Record<ActionLog['type'], HabitKey>> = {
  exercise: 'exercise',
  sleep: 'sleep',
  meal: 'meal',
  journal: 'journal',
};

type State = {
  today: string;
  resource: Resource;
  actions: ActionLog[];
  rules: Rule[];
  buildId: BuildId;
  prestige: PrestigeState;
  shards: Record<ShardType, number>;
  ritualCooldowns: Record<string, string>;
  difficultyMode: DifficultyMode;
  perfectDayHistory: { date: string; perfect: boolean }[];
  pendingPrestigeReward?: PrestigeReward;
  setResource: (r: Partial<Resource>) => void;
  addAction: (a: ActionLog) => Promise<void>;
  loadDay: (date: string) => Promise<void>;
  setBuild: (id: BuildId) => void;
  setPrestige: (updater: (prev: PrestigeState) => PrestigeState) => void;
  addShard: (type: ShardType, amount: number) => void;
  spendShards: (requirements: ShardType[]) => boolean;
  setRitualCooldown: (id: string, expiresAt: string) => void;
  performRitual: (id: string, dateIso: string) => Promise<boolean>;
  recordPerfectDay: (dateIso: string, perfect: boolean) => void;
  evaluateDifficulty: (dateIso: string) => void;
  setPendingPrestigeReward: (reward?: PrestigeReward) => void;
};

function todayStr() {
  return new Date().toISOString().slice(0,10);
}

const defaultResource = (date:string): Resource => ({
  date, energy: 60, stress: 30, focus: 50, health: 70,
  sleepDebt: 0, nutritionScore: 6, mood: 0, clarity: 1
});

const defaultPrestige = (): PrestigeState => ({
  level: 0,
  keystones: [],
  perfectDays: 0,
  caps: calculateCaps(0)
});

export const useStore = create<State>((set, get) => ({
  today: todayStr(),
  resource: defaultResource(todayStr()),
  actions: [],
  rules: [],
  buildId: 'scholar',
  prestige: defaultPrestige(),
  shards: { focusShard: 0, clarityShard: 0 },
  ritualCooldowns: {},
  difficultyMode: 'normal',
  perfectDayHistory: [],
  pendingPrestigeReward: undefined,
  setResource: (r) => set(s => ({ resource: { ...s.resource, ...r } })),
  addAction: async (a) => {
    await insertAction(a);
    const habit = ACTION_HABIT[a.type];
    if (habit) {
      await touchHabit(habit, a.date, { now: new Date().toISOString() });
    }
    set(s => ({ actions: [...s.actions, a] }));
  },
  loadDay: async (date) => {
    const res = await getResource(date) || defaultResource(date);
    const acts = await listActions(date);
    set({ today: date, resource: res, actions: acts });
    const [year, month, day] = date.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)).getUTCDay();
    if (weekday === 1) {
      get().evaluateDifficulty(`${date}T00:00:00+08:00`);
    }
  },
  setBuild: (id) => set({ buildId: id }),
  setPrestige: (updater) => set(s => ({ prestige: updater(s.prestige) })),
  addShard: (type, amount) => set(s => ({ shards: { ...s.shards, [type]: (s.shards[type] ?? 0) + amount } })),
  spendShards: (requirements) => {
    const current = get().shards;
    const cost: Record<ShardType, number> = { focusShard: 0, clarityShard: 0 };
    requirements.forEach(req => { cost[req] = (cost[req] ?? 0) + 1; });
    for (const key of Object.keys(cost) as ShardType[]) {
      if ((current[key] ?? 0) < cost[key]) return false;
    }
    set(s => ({
      shards: {
        focusShard: s.shards.focusShard - (cost.focusShard ?? 0),
        clarityShard: s.shards.clarityShard - (cost.clarityShard ?? 0),
      }
    }));
    return true;
  },
  setRitualCooldown: (id, expiresAt) => set(s => ({ ritualCooldowns: { ...s.ritualCooldowns, [id]: expiresAt } })),
  performRitual: async (id, dateIso) => {
    const recipe = getRitual(id);
    if (!recipe) return false;
    const cooldown = get().ritualCooldowns[id];
    if (cooldown && Date.parse(cooldown) > Date.parse(dateIso)) {
      return false;
    }
    if (recipe.window) {
      const hour = new Date(dateIso).getHours();
      const windowMatch = (recipe.window === 'am' && hour < 12)
        || (recipe.window === 'pm' && hour >= 12 && hour < 18)
        || (recipe.window === 'evening' && hour >= 18 && hour < 24);
      if (!windowMatch) return false;
    }
    const success = get().spendShards(recipe.inputs);
    if (!success) return false;
    const effect = { ...recipe.effect, id: `${recipe.effect.id}_${Date.now()}` };
    const expires = new Date(Date.parse(dateIso) + recipe.cooldownHours * 60 * 60 * 1000).toISOString();
    effect.expiresAt = new Date(Date.parse(dateIso) + 24 * 60 * 60 * 1000).toISOString();
    await upsertEffectRecord(dateIso.slice(0, 10), effect);
    set(s => ({ ritualCooldowns: { ...s.ritualCooldowns, [id]: expires } }));
    return true;
  },
  recordPerfectDay: (dateIso, perfect) => set(s => {
    const trimmed = s.perfectDayHistory.filter(entry => Date.parse(dateIso) - Date.parse(entry.date) <= 14 * 24 * 60 * 60 * 1000);
    return { perfectDayHistory: [...trimmed, { date: dateIso, perfect }] };
  }),
  evaluateDifficulty: (dateIso) => {
    const history = get().perfectDayHistory.filter(entry => {
      const diff = (Date.parse(dateIso) - Date.parse(entry.date)) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    });
    const rate = history.length === 0 ? 0 : history.filter(h => h.perfect).length / history.length;
    let mode: DifficultyMode = 'normal';
    if (rate < 0.5) mode = 'ease';
    else if (rate >= 0.85) mode = 'elite';
    set({ difficultyMode: mode, perfectDayHistory: history });
  },
  setPendingPrestigeReward: (reward) => set({ pendingPrestigeReward: reward })
}));
