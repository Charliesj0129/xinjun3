import { Resource, StatusEffect } from '@/types';
import { listEffects, upsertEffectRecord, expireEffectsBefore } from '@/db/db';
import { clampDelta, ResourceMetricKey } from '@/config/balance';
import { resolveBalance } from '@/config/remote';

const METRIC_BOUNDS: Record<ResourceMetricKey, { min:number; max:number }> = {
  energy: { min: 0, max: 100 },
  stress: { min: 0, max: 100 },
  focus: { min: 0, max: 100 },
  health: { min: 0, max: 100 },
  sleepDebt: { min: 0, max: 20 },
  nutritionScore: { min: 0, max: 10 },
  mood: { min: -5, max: 5 },
  clarity: { min: 0, max: 5 },
};

const METRIC_KEYS: ResourceMetricKey[] = Object.keys(METRIC_BOUNDS) as ResourceMetricKey[];

function clampMetric(key: ResourceMetricKey, value: number): number {
  const bounds = METRIC_BOUNDS[key];
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

function parseDateToMs(date: string | undefined, fallback: number | null = null): number | null {
  if (!date) return fallback;
  const iso = date.length === 10 ? `${date}T00:00:00Z` : date;
  const time = Date.parse(iso);
  return Number.isNaN(time) ? fallback : time;
}

export async function listActiveEffects(date: string): Promise<StatusEffect[]> {
  const all = await listEffects();
  const targetMs = parseDateToMs(date, Date.now());
  const dayEnd = targetMs !== null ? targetMs + 24 * 60 * 60 * 1000 : null;
  return all
    .filter(({ date: startDate }) => {
      const startMs = parseDateToMs(startDate, targetMs);
      return startMs === null || (targetMs !== null && startMs <= targetMs);
    })
    .filter(({ effect }) => {
      if (!effect.expiresAt) return true;
      const expiresMs = parseDateToMs(effect.expiresAt, null);
      if (expiresMs === null) return true;
      if (dayEnd === null) return expiresMs >= Date.now();
      return expiresMs >= dayEnd;
    })
    .map(entry => entry.effect);
}

export async function upsertEffect(effect: StatusEffect, date?: string): Promise<void> {
  const effectiveDate = date ?? new Date().toISOString().slice(0, 10);
  await upsertEffectRecord(effectiveDate, effect);
}

export async function expireEffects(nowISO: string): Promise<void> {
  await expireEffectsBefore(nowISO);
}

export function applyEffects(base: Resource, effects: StatusEffect[]): Resource {
  if (!effects.length) return base;
  const balance = resolveBalance();
  const guardrails = balance.guardrails;

  let working: Resource = { ...base };
  const additive: Partial<Record<ResourceMetricKey, number>> = {};
  const multiplicative: Partial<Record<ResourceMetricKey, number>> = {};

  for (const effect of effects) {
    const stacks = Math.max(1, effect.stacks || 1);
    for (const mod of effect.effects) {
      const { target, math, value } = mod;
      const key = target as ResourceMetricKey;
      if (math === 'add') {
        additive[key] = (additive[key] ?? 0) + value * stacks;
      } else if (math === 'mul') {
        const factor = Math.pow(1 + value, stacks);
        multiplicative[key] = (multiplicative[key] ?? 1) * factor;
      }
    }
  }

  for (const key of METRIC_KEYS) {
    const delta = additive[key];
    if (typeof delta === 'number' && delta !== 0) {
      const clampedDelta = clampDelta(key, delta, guardrails);
      const next = clampMetric(key, (working[key] as number) + clampedDelta);
      (working as any)[key] = next;
    }
  }

  for (const key of METRIC_KEYS) {
    const factor = multiplicative[key];
    if (typeof factor === 'number' && factor !== 1) {
      const before = working[key] as number;
      const multiplied = clampMetric(key, before * factor);
      const delta = multiplied - before;
      const clampedDelta = clampDelta(key, delta, guardrails);
      const next = clampMetric(key, before + clampedDelta);
      (working as any)[key] = next;
    }
  }

  return working;
}
