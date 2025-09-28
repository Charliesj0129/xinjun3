import { create } from 'zustand';
import { Resource, ActionLog, Rule, HabitKey, BuildId, PrestigeState, ShardType } from '@/types';
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
  setResource: (r: Partial<Resource>) => void;
  addAction: (a: ActionLog) => Promise<void>;
  loadDay: (date: string) => Promise<void>;
  setBuild: (id: BuildId) => void;
  setPrestige: (updater: (prev: PrestigeState) => PrestigeState) => void;
  addShard: (type: ShardType, amount: number) => void;
  spendShards: (requirements: ShardType[]) => boolean;
  setRitualCooldown: (id: string, expiresAt: string) => void;
  performRitual: (id: string, dateIso: string) => Promise<boolean>;
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
    const success = get().spendShards(recipe.inputs);
    if (!success) return false;
    const effect = { ...recipe.effect, id: `${recipe.effect.id}_${Date.now()}` };
    const expires = new Date(Date.parse(dateIso) + recipe.cooldownHours * 60 * 60 * 1000).toISOString();
    effect.expiresAt = new Date(Date.parse(dateIso) + 24 * 60 * 60 * 1000).toISOString();
    await upsertEffectRecord(dateIso.slice(0, 10), effect);
    set(s => ({ ritualCooldowns: { ...s.ritualCooldowns, [id]: expires } }));
    return true;
  }
}));
