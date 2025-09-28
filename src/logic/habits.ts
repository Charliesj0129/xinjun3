import { HabitKey, HabitStats, Resource, StatusEffect } from '@/types';
import { getHabitStat, setHabitStat, listHabitStats, listEffects, upsertEffectRecord, deleteEffect } from '@/db/db';
import { appendEvent } from '@/db/events';
import { resolveBalance } from '@/config/remote';

const MOMENTUM_EFFECT_ID = 'buff_momentum';

type TouchHabitOptions = {
  now?: string;
};

type EntropyOptions = {
  date: string;
  now?: string;
};

type UpkeepOptions = {
  date: string;
  resource: Resource;
  actionsCount: number;
  now?: string;
};

function toIso(date: string): string {
  if (!date) return new Date().toISOString();
  if (date.length === 10) return `${date}T00:00:00.000Z`;
  return date;
}

function diffInDays(laterIso: string, earlierIso: string): number {
  const later = Date.parse(laterIso);
  const earlier = Date.parse(earlierIso);
  if (Number.isNaN(later) || Number.isNaN(earlier)) return 0;
  const ms = later - earlier;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function buildMomentumEffect(stacks: number, date: string): StatusEffect {
  const balance = resolveBalance();
  const perStack = balance.momentum.addPerStack;
  return {
    id: MOMENTUM_EFFECT_ID,
    kind: 'buff' as const,
    name: 'Momentum',
    stacks,
    maxStacks: balance.momentum.maxStacks,
    effects: Object.entries(perStack).map(([target, value]) => ({
      target: target as any,
      math: 'add' as const,
      value,
    })),
    source: 'habit:momentum',
    expiresAt: undefined,
  };
}

async function syncMomentumEffect(date: string): Promise<void> {
  const stats = await listHabitStats();
  const balance = resolveBalance();
  const totalStacks = Math.min(
    balance.momentum.maxStacks,
    stats.reduce((sum, stat) => sum + Math.max(0, stat.momentumStacks), 0)
  );

  const allEffects = await listEffects();
  const current = allEffects.find(entry => entry.effect.id === MOMENTUM_EFFECT_ID);

  if (totalStacks <= 0) {
    if (current) {
      await deleteEffect(MOMENTUM_EFFECT_ID);
      await appendEvent('effect.remove', { effectId: MOMENTUM_EFFECT_ID, date });
    }
    return;
  }

  const nextEffect = buildMomentumEffect(totalStacks, date);
  const hasChanged = !current || current.effect.stacks !== nextEffect.stacks;
  if (hasChanged) {
    await upsertEffectRecord(date, nextEffect);
    await appendEvent('effect.upsert', { effectId: MOMENTUM_EFFECT_ID, stacks: totalStacks, date });
  }
}

function emptyStats(habit: HabitKey, date: string, nowIso: string, decay: number): HabitStats {
  return {
    habit,
    date: '',
    streak: 0,
    momentumStacks: 0,
    lastActiveAt: nowIso,
    decayGraceDays: decay,
  };
}

export async function touchHabit(habit: HabitKey, date: string, options: TouchHabitOptions = {}): Promise<HabitStats> {
  const nowIso = options.now ?? new Date().toISOString();
  const balance = resolveBalance();
  const thresholds = balance.momentum.gainThresholdPerModule;
  const decayGrace = balance.momentum.decayGraceDays[habit] ?? 2;

  const existing = await getHabitStat(habit);
  const current = existing ?? emptyStats(habit, date, nowIso, decayGrace);

  if (!existing) {
    current.decayGraceDays = decayGrace;
  }

  const prevDate = current.date;
  const sameDay = prevDate === date;
  if (sameDay) {
    current.lastActiveAt = nowIso;
    await setHabitStat(current);
    await appendEvent('habit.touch', { habit, date, streak: current.streak, momentumStacks: current.momentumStacks });
    return current;
  }

  const prevStreak = current.streak;
  const dayDiff = prevDate ? diffInDays(toIso(date), toIso(prevDate)) : 0;
  const newStreak = dayDiff === 1 ? prevStreak + 1 : 1;
  const threshold = thresholds[habit] ?? 3;
  const prevTier = threshold > 0 ? Math.floor(prevStreak / threshold) : 0;
  const newTier = threshold > 0 ? Math.floor(newStreak / threshold) : 0;
  let stacks = current.momentumStacks;
  if (newTier > prevTier) {
    stacks = Math.min(balance.momentum.maxStacks, stacks + (newTier - prevTier));
  }

  const updated: HabitStats = {
    habit,
    date,
    streak: newStreak,
    momentumStacks: stacks,
    lastActiveAt: nowIso,
    decayGraceDays: decayGrace,
  };

  await setHabitStat(updated);
  await appendEvent('habit.touch', { habit, date, streak: newStreak, momentumStacks: stacks });
  await syncMomentumEffect(date);
  return updated;
}

export async function applyEntropy(options: EntropyOptions): Promise<void> {
  const stats = await listHabitStats();
  if (!stats.length) return;
  const balance = resolveBalance();
  const nowIso = options.now ?? new Date().toISOString();
  let changed = false;

  for (const stat of stats) {
    if (stat.momentumStacks <= 0) continue;
    const grace = balance.momentum.decayGraceDays[stat.habit] ?? stat.decayGraceDays;
    const lastActive = stat.lastActiveAt || stat.date;
    if (!lastActive) continue;
    const silence = diffInDays(nowIso, toIso(lastActive));
    if (silence > grace) {
      const nextStacks = Math.max(0, stat.momentumStacks - 1);
      const updated: HabitStats = {
        ...stat,
        date: options.date,
        streak: Math.max(0, stat.streak - 1),
        momentumStacks: nextStacks,
      };
      await setHabitStat(updated);
      await appendEvent('habit.entropy', { habit: stat.habit, date: options.date, previousStacks: stat.momentumStacks, stacks: nextStacks });
      changed = true;
    }
  }

  if (changed) {
    await syncMomentumEffect(options.date);
  }
}

export async function enforceUpkeep(options: UpkeepOptions): Promise<void> {
  const balance = resolveBalance();
  const rules = balance.upkeepRules;
  if (!rules.length) return;
  const stats = await listHabitStats();
  if (!stats.length) return;

  let downgraded = false;

  for (const rule of rules) {
    if (downgraded) break;
    const conditions = rule.minConditions ?? {};
    let ok = true;
    if (conditions.sleepDebtMax !== undefined) {
      ok = ok && options.resource.sleepDebt <= conditions.sleepDebtMax;
    }
    if (conditions.nutritionMin !== undefined) {
      ok = ok && options.resource.nutritionScore >= conditions.nutritionMin;
    }
    if (conditions.dailyActions !== undefined) {
      ok = ok && options.actionsCount >= conditions.dailyActions;
    }
    if (ok) continue;

    const richest = [...stats].sort((a, b) => b.momentumStacks - a.momentumStacks).find(item => item.momentumStacks > 0);
    if (!richest) continue;

    const updated: HabitStats = {
      ...richest,
      date: options.date,
      momentumStacks: Math.max(0, richest.momentumStacks - 1),
      streak: Math.max(0, richest.streak - 1),
    };

    await setHabitStat(updated);
    await appendEvent('habit.upkeep.downgrade', {
      habit: richest.habit,
      date: options.date,
      rule: rule.effectId,
      stacks: updated.momentumStacks,
    });
    downgraded = true;
  }

  if (downgraded) {
    await syncMomentumEffect(options.date);
  }
}
