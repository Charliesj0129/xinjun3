import { Resource, ActionLog, StatusEffect, RoomBonus } from '@/types';
import { clampDelta } from '@/config/balance';
import { resolveBalance } from '@/config/remote';
import { applyEffects } from '@/logic/buffs';
import { getRoomState } from '@/db/db';

export type SettleOptions = {
  effects?: StatusEffect[];
  roomBonus?: RoomBonus;
};

const clamp = (v:number, lo=0, hi=100)=>Math.min(hi, Math.max(lo, v));

export function settleDay(current: Resource, actions: ActionLog[], options: SettleOptions = {}): Resource {
  // simple MVP: aggregate action effects
  const balance = resolveBalance();
  const guardrails = balance.guardrails;
  const bonus = options.roomBonus;

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
      if (bonus?.gymReady) {
        deltaEnergy *= 0.9;
        deltaStress *= 1.1;
        deltaHealth *= 1.1;
      }
      deltaEnergy = Math.round(deltaEnergy);
      deltaStress = Math.round(deltaStress);
      deltaHealth = Math.round(deltaHealth);
      energy += clampDelta('energy', deltaEnergy, guardrails);
      stress += clampDelta('stress', deltaStress, guardrails);
      health += clampDelta('health', deltaHealth, guardrails);
    }
    if (a.type === 'meal') {
      const score = (['protein','fiber','carb','water'] as const)
        .map(k => a.payload[k]?1:0).reduce((a,b)=>a+b,0);
      const deltaNutrition = score - 2;
      nutritionScore = clamp(
        nutritionScore + clampDelta('nutritionScore', deltaNutrition, guardrails),
        0,
        10
      );
      const baseEnergyGain = score * 2;
      const kitchenBoost = bonus?.kitchenPrep ? Math.round(baseEnergyGain * 0.1) : 0;
      energy += clampDelta('energy', baseEnergyGain + kitchenBoost, guardrails);
    }
    if (a.type === 'journal') {
      stress += clampDelta('stress', -4, guardrails);
      focus += clampDelta('focus', 6, guardrails);
      clarity = clamp(
        clarity + clampDelta('clarity', 1, guardrails),
        0,
        5
      );
      if (bonus?.deskQuality) {
        focus += clampDelta('focus', bonus.deskQuality, guardrails);
        if (bonus.deskQuality >= 1) {
          clarity = clamp(
            clarity + clampDelta('clarity', 1, guardrails),
            0,
            5
          );
        }
      }
    }
    if (a.type === 'sleep') {
      const hours = a.payload.hours ?? 7.5;
      const sleptBefore0030 = !!a.payload.before0030;
      const wokeBefore0830 = !!a.payload.before0830;
      const debtDelta = 8 - hours;
      const rawDebtIncrease = Math.max(0, debtDelta);
      const cappedDebt = clampDelta('sleepDebt', rawDebtIncrease, guardrails);
      sleepDebt = clamp(sleepDebt + cappedDebt, 0, 20);
      let energyGain = hours * 4;
      if (bonus?.bedroomQuality) {
        const mult = 1 + 0.05 * bonus.bedroomQuality + (bonus.bedroomQuality === 3 ? 0.1 : 0);
        energyGain *= mult;
      }
      const deltaEnergy = Math.round(energyGain);
      energy += clampDelta('energy', deltaEnergy, guardrails);
      const deltaFocus = (sleptBefore0030?3:0) + (wokeBefore0830?3:0);
      focus += clampDelta('focus', deltaFocus, guardrails);
      stress += clampDelta('stress', -5, guardrails);
    }
  }

  // derived penalties/bonuses
  if (sleepDebt >= 6) {
    // fatigue
    const fatigueEnergy = Math.round(energy * 0.9);
    const energyDelta = fatigueEnergy - energy;
    energy += clampDelta('energy', energyDelta, guardrails);
    const fatigueFocus = Math.round(focus * 0.9);
    const focusDelta = fatigueFocus - focus;
    focus += clampDelta('focus', focusDelta, guardrails);
  }
  if (nutritionScore <= 4) {
    stress += clampDelta('stress', 3, guardrails);
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
    return applyEffects(settled, options.effects);
  }

  return settled;
}

export async function roomBonus(date: string): Promise<RoomBonus> {
  const roomState = await getRoomState(date);
  if (!roomState) {
    return {
      bedroomQuality: 0,
      deskQuality: 0,
      gymReady: false,
      kitchenPrep: false,
    };
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
