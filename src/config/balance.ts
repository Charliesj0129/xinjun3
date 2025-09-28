import { Resource, UpkeepRule } from '@/types';

export type ResourceMetricKey = keyof Pick<Resource, 'energy'|'stress'|'focus'|'health'|'sleepDebt'|'nutritionScore'|'mood'|'clarity'>;

export type DeltaCaps = Record<ResourceMetricKey, number>;

type MomentumConfig = {
  maxStacks: number;
  gainThresholdPerModule: Record<'sleep'|'journal'|'exercise'|'meal', number>;
  decayGraceDays: Record<'sleep'|'journal'|'exercise'|'meal', number>;
  addPerStack: Partial<Record<ResourceMetricKey, number>>;
};

type BalanceConfig = {
  guardrails: DeltaCaps;
  momentum: MomentumConfig;
  upkeepRules: UpkeepRule[];
};

export const Guardrails: DeltaCaps = {
  energy: 30,
  stress: 30,
  focus: 30,
  health: 20,
  sleepDebt: 3,
  nutritionScore: 3,
  mood: 3,
  clarity: 1,
};

export const Momentum: MomentumConfig = {
  maxStacks: 5,
  gainThresholdPerModule: {
    sleep: 3,
    journal: 3,
    exercise: 3,
    meal: 4,
  },
  decayGraceDays: {
    sleep: 2,
    journal: 2,
    exercise: 3,
    meal: 2,
  },
  addPerStack: {
    focus: 1,
    stress: -1,
  },
};

export const Upkeep: UpkeepRule[] = [
  {
    effectId: 'buff_momentum',
    minConditions: { sleepDebtMax: 3, dailyActions: 2 },
    downgradeTo: 'buff_momentum_t1',
  },
];

export const Balance: BalanceConfig = {
  guardrails: Guardrails,
  momentum: Momentum,
  upkeepRules: Upkeep,
};
