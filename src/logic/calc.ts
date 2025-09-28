import { Resource, ActionLog, StatusEffect, RoomBonus, TimelineDelta, BuildId } from '@/types';
import { resolveBalance } from '@/config/remote';
import { applyEffects } from '@/logic/buffs';
import { getRoomState } from '@/db/db';
import { applyDelta, getMetricLimits } from '@/logic/delta';
import { applyEntropy, enforceUpkeep } from '@/logic/habits';
import { DeltaCaps, ResourceMetricKey } from '@/config/balance';
import { createDeltaTracker, TimelineContext, logTimeline } from '@/logic/timeline';
import { getBuild } from '@/config/builds';

export type SettleOptions = {
  effects?: StatusEffect[];
  roomBonus?: RoomBonus;
  guardrailsOverride?: DeltaCaps;
  onTimeline?: (ctx: TimelineContext) => void;
  buildId?: BuildId;
  caps?: Partial<Record<'energy'|'focus'|'stress'|'health', number>>;
};

export type FinalizeOptions = SettleOptions & {
  now?: string;
  actionsCount?: number;
};

const METRIC_LIMITS = getMetricLimits();
const ZERO_BONUS: RoomBonus = { bedroomQuality: 0, deskQuality: 0, gymReady: false, kitchenPrep: false };

function applyPenalty(
  metric: ResourceMetricKey,
  current: number,
  target: number,
  guardrails: DeltaCaps,
  limits: typeof METRIC_LIMITS,
  onApplied?: (delta: number) => void,
): number {
  const delta = target - current;
  return applyDelta(current, metric, delta, { guardrails, limits, onApplied });
}

export function settleDay(current: Resource, actions: ActionLog[], options: SettleOptions = {}): Resource {
  const balance = resolveBalance();
  const guardrails = options.guardrailsOverride ?? balance.guardrails;
  const bonus = options.roomBonus ?? ZERO_BONUS;
  const emitTimeline = options.onTimeline;
  const build = getBuild(options.buildId ?? 'scholar');
  const modifiers = build.modifiers;

  const limits = Object.fromEntries(
    Object.entries(METRIC_LIMITS).map(([k, bounds]) => [k, { ...bounds }])
  ) as typeof METRIC_LIMITS;

  if (options.caps?.energy) limits.energy.max = options.caps.energy;
  if (options.caps?.focus) limits.focus.max = options.caps.focus;
  if (options.caps?.stress) limits.stress.max = options.caps.stress;
  if (options.caps?.health) limits.health.max = options.caps.health;

  let energy = current.energy;
  let stress = current.stress;
  let focus = current.focus;
  let health = current.health;
  let sleepDebt = current.sleepDebt;
  let nutritionScore = current.nutritionScore;
  let mood = current.mood;
  let clarity = current.clarity;

  for (const a of actions) {
    const tracker = createDeltaTracker();
    const emitDelta = (metric: keyof TimelineDelta, amount: number) => {
      tracker.add(metric, amount);
    };

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
      energy = applyDelta(energy, 'energy', Math.round(deltaEnergy), { guardrails, limits, onApplied: amt => emitDelta('energy', amt) });
      const adjustedStress = deltaStress > 0 ? deltaStress * modifiers.stressIncreaseMult : deltaStress;
      stress = applyDelta(stress, 'stress', Math.round(adjustedStress), { guardrails, limits, onApplied: amt => emitDelta('stress', amt) });
      health = applyDelta(health, 'health', Math.round(deltaHealth), { guardrails, limits, onApplied: amt => emitDelta('health', amt) });
    } else if (a.type === 'meal') {
      const score = (['protein','fiber','carb','water'] as const)
        .map(k => a.payload[k]?1:0).reduce((acc,b)=>acc+b,0);
      const deltaNutrition = score - 2;
      nutritionScore = applyDelta(nutritionScore, 'nutritionScore', Math.round(deltaNutrition * modifiers.nutritionGainMult), { guardrails, limits, onApplied: amt => emitDelta('nutritionScore', amt) });
      const baseEnergyGain = score * 2 * modifiers.nutritionGainMult;
      const kitchenBoost = bonus.kitchenPrep ? Math.round(baseEnergyGain * 0.1) : 0;
      energy = applyDelta(energy, 'energy', Math.round(baseEnergyGain) + kitchenBoost, { guardrails, limits, onApplied: amt => emitDelta('energy', amt) });
    } else if (a.type === 'journal') {
      stress = applyDelta(stress, 'stress', -4, { guardrails, limits, onApplied: amt => emitDelta('stress', amt) });
      focus = applyDelta(focus, 'focus', Math.round(6 * modifiers.focusGainMult), { guardrails, limits, onApplied: amt => emitDelta('focus', amt) });
      clarity = applyDelta(clarity, 'clarity', Math.max(1, Math.round(1 * modifiers.journalClarityGain)), { guardrails, limits, onApplied: amt => emitDelta('clarity', amt) });
      if (bonus.deskQuality) {
        focus = applyDelta(focus, 'focus', Math.round(bonus.deskQuality * modifiers.focusGainMult), { guardrails, limits, onApplied: amt => emitDelta('focus', amt) });
        if (bonus.deskQuality >= 1) {
          clarity = applyDelta(clarity, 'clarity', Math.max(1, Math.round(modifiers.journalClarityGain)), { guardrails, limits, onApplied: amt => emitDelta('clarity', amt) });
        }
      }
    } else if (a.type === 'sleep') {
      const hours = a.payload.hours ?? 7.5;
      const sleptBefore0030 = !!a.payload.before0030;
      const wokeBefore0830 = !!a.payload.before0830;
      const debtDelta = Math.max(0, 8 - hours);
      sleepDebt = applyDelta(sleepDebt, 'sleepDebt', debtDelta, { guardrails, limits, onApplied: amt => emitDelta('sleepDebt', amt) });
      let energyGain = hours * 4 * modifiers.sleepGainMult;
      if (bonus.bedroomQuality) {
        const mult = 1 + 0.05 * bonus.bedroomQuality + (bonus.bedroomQuality === 3 ? 0.1 : 0);
        energyGain *= mult;
      }
      energy = applyDelta(energy, 'energy', Math.round(energyGain), { guardrails, limits, onApplied: amt => emitDelta('energy', amt) });
      const deltaFocus = (sleptBefore0030?3:0) + (wokeBefore0830?3:0);
      focus = applyDelta(focus, 'focus', Math.round(deltaFocus * modifiers.focusGainMult), { guardrails, limits, onApplied: amt => emitDelta('focus', amt) });
      stress = applyDelta(stress, 'stress', -5, { guardrails, limits, onApplied: amt => emitDelta('stress', amt) });
    }

    const snapshot = tracker.snapshot();
    if (Object.keys(snapshot).length) {
      emitTimeline?.({ kind: 'action', refId: a.id, actionType: a.type, delta: snapshot, at: new Date().toISOString() });
    }
  }

  if (sleepDebt >= 6) {
    const tracker = createDeltaTracker();
    const fatigueEnergy = Math.round(energy * 0.9);
    energy = applyPenalty('energy', energy, fatigueEnergy, guardrails, limits, amt => tracker.add('energy', amt));
    const fatigueFocus = Math.round(focus * 0.9);
    focus = applyPenalty('focus', focus, fatigueFocus, guardrails, limits, amt => tracker.add('focus', amt));
    const snapshot = tracker.snapshot();
    if (Object.keys(snapshot).length) {
      emitTimeline?.({ kind: 'event', refId: 'fatigue_penalty', delta: snapshot, at: new Date().toISOString() });
    }
  }
  if (nutritionScore <= 4) {
    const tracker = createDeltaTracker();
    stress = applyDelta(stress, 'stress', Math.round(3 * modifiers.stressIncreaseMult), { guardrails, limits, onApplied: amt => tracker.add('stress', amt) });
    const snapshot = tracker.snapshot();
    if (Object.keys(snapshot).length) {
      emitTimeline?.({ kind: 'event', refId: 'nutrition_penalty', delta: snapshot, at: new Date().toISOString() });
    }
  }

  const settled: Resource = {
    ...current,
    energy: Math.min(limits.energy.max, Math.max(limits.energy.min, energy)),
    stress: Math.min(limits.stress.max, Math.max(limits.stress.min, stress)),
    focus: Math.min(limits.focus.max, Math.max(limits.focus.min, focus)),
    health: Math.min(limits.health.max, Math.max(limits.health.min, health)),
    sleepDebt: Math.min(limits.sleepDebt.max, Math.max(limits.sleepDebt.min, sleepDebt)),
    nutritionScore: Math.min(limits.nutritionScore.max, Math.max(limits.nutritionScore.min, nutritionScore)),
    mood: Math.min(limits.mood.max, Math.max(limits.mood.min, mood)),
    clarity: Math.min(limits.clarity.max, Math.max(limits.clarity.min, clarity))
  };

  if (options.effects && options.effects.length) {
    return applyEffects(settled, options.effects, guardrails);
  }

  return settled;
}

export async function finalizeSettlement(current: Resource, actions: ActionLog[], options: FinalizeOptions = {}): Promise<Resource> {
  const buffer: TimelineContext[] = [];
  const settled = settleDay(current, actions, { ...options, onTimeline: ctx => buffer.push(ctx) });
  const nowIso = options.now ?? new Date().toISOString();
  // pipeline marker: settleDay() -> applyEntropy() -> enforceUpkeep()
  await applyEntropy({ date: current.date, now: nowIso });
  await enforceUpkeep({ date: current.date, resource: settled, actionsCount: options.actionsCount ?? actions.length, now: nowIso });
  for (const entry of buffer) {
    await logTimeline({ ...entry, at: entry.at ?? nowIso });
  }
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
