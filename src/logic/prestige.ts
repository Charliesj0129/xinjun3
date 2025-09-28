import { PrestigeState } from '@/types';
import { Keystone, KEYSTONES, nextKeystone } from '@/config/keystones';

export function calculateCaps(level: number) {
  const base = 100;
  const bonus = level * 5;
  return {
    energy: base + bonus,
    focus: base + bonus,
    stress: base + bonus,
    health: base + bonus,
  };
}

export function aggregateKeystoneModifiers(ids: string[] = []) {
  return ids.reduce((acc, id) => {
    const keystone = KEYSTONES.find(k => k.id === id);
    if (!keystone) return acc;
    const mods = keystone.modifiers;
    acc.focusGainMult *= mods.focusGainMult ?? 1;
    acc.stressIncreaseMult *= mods.stressIncreaseMult ?? 1;
    acc.sleepGainMult *= mods.sleepGainMult ?? 1;
    acc.nutritionGainMult *= mods.nutritionGainMult ?? 1;
    acc.journalClarityGain *= mods.journalClarityGain ?? 1;
    return acc;
  }, {
    focusGainMult: 1,
    stressIncreaseMult: 1,
    sleepGainMult: 1,
    nutritionGainMult: 1,
    journalClarityGain: 1,
  });
}

export function processPerfectDay(prestige: PrestigeState): { next: PrestigeState; unlocked?: Keystone } {
  let nextPrestige = { ...prestige, perfectDays: prestige.perfectDays + 1 };
  const threshold = (prestige.level + 1) * 5;
  let unlocked: Keystone | undefined;
  if (nextPrestige.perfectDays >= threshold) {
    nextPrestige.level += 1;
    nextPrestige.perfectDays = nextPrestige.perfectDays - threshold;
    const keystone = nextKeystone(nextPrestige.keystones);
    if (keystone) {
      nextPrestige.keystones = [...nextPrestige.keystones, keystone.id];
      unlocked = keystone;
    }
    nextPrestige.caps = calculateCaps(nextPrestige.level);
  }
  return { next: nextPrestige, unlocked };
}
