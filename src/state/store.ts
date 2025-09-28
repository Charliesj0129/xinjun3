import { create } from 'zustand';
import { Resource, ActionLog, Rule, HabitKey, BuildId, PrestigeState } from '@/types';
import { upsertResource, insertAction, listActions, getResource } from '@/db/db';
import { touchHabit } from '@/logic/habits';

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
  setResource: (r: Partial<Resource>) => void;
  addAction: (a: ActionLog) => Promise<void>;
  loadDay: (date: string) => Promise<void>;
  setBuild: (id: BuildId) => void;
  setPrestige: (updater: (prev: PrestigeState) => PrestigeState) => void;
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
  caps: {
    energy: 100,
    focus: 100,
    stress: 100,
    health: 100,
  }
});

export const useStore = create<State>((set, get) => ({
  today: todayStr(),
  resource: defaultResource(todayStr()),
  actions: [],
  rules: [],
  buildId: 'scholar',
  prestige: defaultPrestige(),
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
  setPrestige: (updater) => set(s => ({ prestige: updater(s.prestige) }))
}));
