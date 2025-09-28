import { Resource, ActionLog, StatusEffect, RoomBonus } from '@/types';
import { resolveBalance } from '@/config/remote';
import { applyEffects } from '@/logic/buffs';
import { getRoomState } from '@/db/db';
import { applyDelta, getMetricLimits } from '@/logic/delta';
import { applyEntropy, enforceUpkeep } from '@/logic/habits';
import { DeltaCaps, ResourceMetricKey } from '@/config/balance';

export type SettleOptions = {
  effects?: StatusEffect[];
  roomBonus?: RoomBonus;
  guardrailsOverride?: DeltaCaps;
};

export type FinalizeOptions = SettleOptions & {
  now?: string;
  actionsCount?: number;
};

const clamp = (v:number, lo=0, hi=100)=>Math.min(hi, Math.max(lo, v));
const METRIC_LIMITS = getMetricLimits();
const ZERO_BONUS: RoomBonus = { bedroomQuality: 0, deskQuality: 0, gymReady: false, kitchenPrep: false };

function applyPenalty(metric: ResourceMetricKey, current: number, target: number, guardrails: DeltaCaps): number {
  const delta = target - current;
  return applyDelta(current, metric, delta, { guardrails, limits: METRIC_LIMITS });
}

export function settleDay(current: Resource, actions: ActionLog[], options: SettleOptions = {}): Resource {
  const balance = resolveBalance();
  const guardrails = options.guardrailsOverride ?? balance.guardrails;
  const bonus = options.roomBonus ?? ZERO_BONUS;

  let energy = current.energy;
  let stress = current.stress;
  let focus = current.focus;
  let health = current.health;
  let sleepDebt = current.sleepDebt;
  let nutritionScore = current.nutritionScore;
  let mood = current.mood;
  let clarity = current.clarity;

  for (const a of actions) {
    if (a.type === 'exercise') {
      const mins = a.payload.mins ?? 20;
      const intensity = a.payload.intensity ?? 'low';
      const mult = intensity==='high'?1.0:intensity==='medium'?0.7:0.4;
      let deltaEnergy = -mins * 0.2 * mult;
      let deltaStress = -6 * mult;
      let deltaHealth = 2 * mult;
      if (bonus.gymReady) {
        deltaEnergy *= 0.9;
        deltaStress *= 1.1;
        deltaHealth *= 1.1;
      }
      energy = applyDelta(energy, 'energy', Math.round(deltaEnergy), { guardrails, limits: METRIC_LIMITS });
      stress = applyDelta(stress, 'stress', Math.round(deltaStress), { guardrails, limits: METRIC_LIMITS });
      health = applyDelta(health, 'health', Math.round(deltaHealth), { guardrails, limits: METRIC_LIMITS });
    }
    if (a.type === 'meal') {
      const score = (['protein','fiber','carb','water'] as const)
        .map(k => a.payload[k]?1:0).reduce((acc,b)=>acc+b,0);
      const deltaNutrition = score - 2;
      nutritionScore = applyDelta(nutritionScore, 'nutritionScore', deltaNutrition, { guardrails, limits: METRIC_LIMITS });
      const baseEnergyGain = score * 2;
      const kitchenBoost = bonus.kitchenPrep ? Math.round(baseEnergyGain * 0.1) : 0;
      energy = applyDelta(energy, 'energy', baseEnergyGain + kitchenBoost, { guardrails, limits: METRIC_LIMITS });
    }
    if (a.type === 'journal') {
      stress = applyDelta(stress, 'stress', -4, { guardrails, limits: METRIC_LIMITS });
      focus = applyDelta(focus, 'focus', 6, { guardrails, limits: METRIC_LIMITS });
      clarity = applyDelta(clarity, 'clarity', 1, { guardrails, limits: METRIC_LIMITS });
      if (bonus.deskQuality) {
        focus = applyDelta(focus, 'focus', bonus.deskQuality, { guardrails, limits: METRIC_LIMITS });
        if (bonus.deskQuality >= 1) {
          clarity = applyDelta(clarity, 'clarity', 1, { guardrails, limits: METRIC_LIMITS });
        }
      }
    }
    if (a.type === 'sleep') {
      const hours = a.payload.hours ?? 7.5;
      const sleptBefore0030 = !!a.payload.before0030;
      const wokeBefore0830 = !!a.payload.before0830;
      const debtDelta = Math.max(0, 8 - hours);
      sleepDebt = applyDelta(sleepDebt, 'sleepDebt', debtDelta, { guardrails, limits: METRIC_LIMITS });
      let energyGain = hours * 4;
      if (bonus.bedroomQuality) {
        const mult = 1 + 0.05 * bonus.bedroomQuality + (bonus.bedroomQuality === 3 ? 0.1 : 0);
        energyGain *= mult;
      }
      energy = applyDelta(energy, 'energy', Math.round(energyGain), { guardrails, limits: METRIC_LIMITS });
      const deltaFocus = (sleptBefore0030?3:0) + (wokeBefore0830?3:0);
      focus = applyDelta(focus, 'focus', deltaFocus, { guardrails, limits: METRIC_LIMITS });
      stress = applyDelta(stress, 'stress', -5, { guardrails, limits: METRIC_LIMITS });
    }
  }

  if (sleepDebt >= 6) {
    const fatigueEnergy = Math.round(energy * 0.9);
    energy = applyPenalty('energy', energy, fatigueEnergy, guardrails);
    const fatigueFocus = Math.round(focus * 0.9);
    focus = applyPenalty('focus', focus, fatigueFocus, guardrails);
  }
  if (nutritionScore <= 4) {
    stress = applyDelta(stress, 'stress', 3, { guardrails, limits: METRIC_LIMITS });
  }

  const settled: Resource = {
    ...current,
    energy: clamp(energy),
    stress: clamp(stress),
    focus: clamp(focus),
    health: clamp(health),
    sleepDebt: clamp(sleepDebt, 0, 20),
    nutritionScore: clamp(nutritionScore, 0, 10),
    mood: clamp(mood, -5, 5),
    clarity: clamp(clarity, 0, 5)
  };

  if (options.effects && options.effects.length) {
    return applyEffects(settled, options.effects, guardrails);
  }

  return settled;
}

export async function finalizeSettlement(current: Resource, actions: ActionLog[], options: FinalizeOptions = {}): Promise<Resource> {
  const settled = settleDay(current, actions, options);
  const nowIso = options.now ?? new Date().toISOString();
  // pipeline marker: settleDay() -> applyEntropy() -> enforceUpkeep()
  await applyEntropy({ date: current.date, now: nowIso });
  await enforceUpkeep({ date: current.date, resource: settled, actionsCount: options.actionsCount ?? actions.length, now: nowIso });
  return settled;
}

export async function roomBonus(date: string): Promise<RoomBonus> {
  const roomState = await getRoomState(date);
  if (!roomState) {
    return { ...ZERO_BONUS };
  }
  const bedroomQuality = Number(roomState.bedroom.dark) + Number(roomState.bedroom.tempOk) + Number(roomState.bedroom.tidy);
  const deskQuality = Number(roomState.desk.declutter) + Number(roomState.desk.timer);
  return {
    bedroomQuality,
    deskQuality,
    gymReady: !!roomState.gym.prepared,
    kitchenPrep: !!roomState.kitchen.prep,
  };
}
