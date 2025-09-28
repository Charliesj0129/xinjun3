export type Resource = {
  date: string; // YYYY-MM-DD
  energy: number; stress: number; focus: number; health: number;
  sleepDebt: number; nutritionScore: number; mood: number; clarity: number;
};

export type ActionLog = {
  id: string; date: string;
  type: 'exercise'|'sleep'|'meal'|'journal';
  payload: any;
};

export type RoomState = {
  date: string;
  bedroom:{dark:boolean; tempOk:boolean; tidy:boolean};
  desk:{declutter:boolean; timer:boolean};
  gym:{prepared:boolean};
  kitchen:{prep:boolean};
};

export type Rule = {
  id: string;
  enabled: boolean;
  if: { field: keyof Resource; op: '>=' | '<' | '<=' | '='; value: number };
  then: {
    action:'insertTask'|'limitIntensity'|'blockApp'|'forceMealTag';
    params: Record<string,any>;
  };
  priority?: number;
  cooldownSec?: number;
  lastFiredAt?: string;
  logic?: 'AND'|'OR';
};

export type Badge = { id:string; name:string; unlockedAt?:string; progress?:number };
export type Tech = { id:string; name:string; unlocked:boolean; effect:Record<string,any> };

export type EventChoice = {
  id:string;
  label:string;
  effects: Partial<Resource> & { addDebuff?:string; addBuff?:string };
};

export type EventRequirement = {
  field: keyof Resource;
  op: '>='|'>'|'<='|'<'|'=';
  value: number;
};

export type EventChainId = string;

export type EventChainMeta = {
  chainId: EventChainId;
  stage: number;
  nextId?: string;
};

export type EventCrisisMeta = {
  rescueIds: string[];
};

export type EventCard = {
  id:string;
  name:string;
  text:string;
  rarity?: 'common'|'uncommon'|'rare';
  weekday?: number[];
  requires?: EventRequirement[];
  chain?: EventChainMeta;
  crisis?: EventCrisisMeta;
  choices: EventChoice[];
};

export type HabitKey = 'sleep'|'journal'|'exercise'|'meal';

export type HabitStats = {
  habit: HabitKey;
  date: string;
  streak: number;
  momentumStacks: number;
  lastActiveAt: string;
  decayGraceDays: number;
};

export type UpkeepRule = {
  effectId: string;
  minConditions: Partial<{ sleepDebtMax:number; nutritionMin:number; dailyActions:number }>;
  downgradeTo?: string;
};

export type EffectMath = 'add'|'mul';
export type EffectTarget = 'energy'|'stress'|'focus'|'health'|'sleepDebt'|'nutritionScore'|'mood'|'clarity';

export type StatusEffect = {
  id: string;
  kind: 'buff'|'debuff';
  name: string;
  stacks: number;
  maxStacks?: number;
  expiresAt?: string;
  effects: {
    target: EffectTarget;
    math: EffectMath;
    value: number;
  }[];
  source?: string;
};

export type RoomBonus = {
  bedroomQuality: number;
  deskQuality: number;
  gymReady: boolean;
  kitchenPrep: boolean;
};

export type GameEvent = {
  id: string;
  createdAt: string;
  type: string;
  payload: Record<string, any>;
};

type ResourceMetrics = keyof Pick<Resource, 'energy'|'stress'|'focus'|'health'|'sleepDebt'|'nutritionScore'|'mood'|'clarity'>;

export type TimelineDelta = Partial<Record<ResourceMetrics, number>>;

export type TimelineEntry = {
  id: string;
  at: string;
  kind: 'action'|'event'|'buffOn'|'buffOff';
  refId: string;
  actionType?: ActionLog['type'];
  choiceId?: string;
  delta?: TimelineDelta;
};
