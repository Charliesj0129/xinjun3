import { ResourceMetricKey } from '@/config/balance';
import { resolveBalance } from '@/config/remote';

export type MetricLimits = Record<ResourceMetricKey, { min: number; max: number }>;

const DEFAULT_LIMITS: MetricLimits = {
  energy: { min: 0, max: 100 },
  stress: { min: 0, max: 100 },
  focus: { min: 0, max: 100 },
  health: { min: 0, max: 100 },
  sleepDebt: { min: 0, max: 20 },
  nutritionScore: { min: 0, max: 10 },
  mood: { min: -5, max: 5 },
  clarity: { min: 0, max: 5 },
};

const METRIC_KEYS: ResourceMetricKey[] = Object.keys(DEFAULT_LIMITS) as ResourceMetricKey[];

export type ApplyDeltaOptions = {
  guardrails?: Record<ResourceMetricKey, number>;
  limits?: MetricLimits;
};

function clampValue(metric: ResourceMetricKey, value: number, limits: MetricLimits = DEFAULT_LIMITS): number {
  const bound = limits[metric];
  return Math.min(bound.max, Math.max(bound.min, value));
}

export function applyDelta(current: number, metric: ResourceMetricKey, rawDelta: number, options: ApplyDeltaOptions = {}): number {
  const { guardrails, limits } = options;
  const resolved = guardrails ?? resolveBalance().guardrails;
  const caps = resolved[metric] ?? Number.POSITIVE_INFINITY;
  const clampedDelta = Math.max(-caps, Math.min(caps, rawDelta));
  return clampValue(metric, current + clampedDelta, limits ?? DEFAULT_LIMITS);
}

export function getMetricLimits(): MetricLimits {
  return DEFAULT_LIMITS;
}

export function getMetricKeys(): ResourceMetricKey[] {
  return METRIC_KEYS;
}
*** End of File
