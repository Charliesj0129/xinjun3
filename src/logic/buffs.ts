import { Resource, StatusEffect } from '@/types';
import { listEffects, upsertEffectRecord, expireEffectsBefore } from '@/db/db';
import { ResourceMetricKey, DeltaCaps } from '@/config/balance';
import { resolveBalance } from '@/config/remote';
import { applyDelta, getMetricLimits, getMetricKeys } from '@/logic/delta';

const METRIC_LIMITS = getMetricLimits();
const METRIC_KEYS = getMetricKeys();

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

export function applyEffects(base: Resource, effects: StatusEffect[], guardrailsOverride?: DeltaCaps): Resource {
  if (!effects.length) return base;
  const balance = resolveBalance();
  const guardrails = guardrailsOverride ?? balance.guardrails;

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
      const next = applyDelta(working[key] as number, key, delta, { guardrails, limits: METRIC_LIMITS });
      (working as any)[key] = next;
    }
  }

  for (const key of METRIC_KEYS) {
    const factor = multiplicative[key];
    if (typeof factor === 'number' && factor !== 1) {
      const before = working[key] as number;
      const multiplied = Math.min(METRIC_LIMITS[key].max, Math.max(METRIC_LIMITS[key].min, before * factor));
      const delta = multiplied - before;
      const next = applyDelta(before, key, delta, { guardrails, limits: METRIC_LIMITS });
      (working as any)[key] = next;
    }
  }

  return working;
}
