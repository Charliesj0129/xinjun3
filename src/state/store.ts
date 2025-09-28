import { create } from 'zustand';
import { Resource, ActionLog, Rule } from '@/types';
import { upsertResource, insertAction, listActions, getResource } from '@/db/db';

type State = {
  today: string;
  resource: Resource;
  actions: ActionLog[];
  rules: Rule[];
  setResource: (r: Partial<Resource>) => void;
  addAction: (a: ActionLog) => Promise<void>;
  loadDay: (date: string) => Promise<void>;
};

function todayStr() {
  return new Date().toISOString().slice(0,10);
}

const defaultResource = (date:string): Resource => ({
  date, energy: 60, stress: 30, focus: 50, health: 70,
  sleepDebt: 0, nutritionScore: 6, mood: 0, clarity: 1
});

export const useStore = create<State>((set, get) => ({
  today: todayStr(),
  resource: defaultResource(todayStr()),
  actions: [],
  rules: [],
  setResource: (r) => set(s => ({ resource: { ...s.resource, ...r } })),
  addAction: async (a) => {
    await insertAction(a);
    set(s => ({ actions: [...s.actions, a] }));
  },
  loadDay: async (date) => {
    const res = await getResource(date) || defaultResource(date);
    const acts = await listActions(date);
    set({ today: date, resource: res, actions: acts });
  }
}));
