import { EventCard, EventChoice, EventRequirement, Resource } from '@/types';
import { clampDelta, ResourceMetricKey } from '@/config/balance';
import { resolveBalance } from '@/config/remote';

const RESOURCE_LIMITS: Record<ResourceMetricKey, { min:number; max:number }> = {
  energy: { min: 0, max: 100 },
  stress: { min: 0, max: 100 },
  focus: { min: 0, max: 100 },
  health: { min: 0, max: 100 },
  sleepDebt: { min: 0, max: 20 },
  nutritionScore: { min: 0, max: 10 },
  mood: { min: -5, max: 5 },
  clarity: { min: 0, max: 5 },
};

const METRIC_KEYS: ResourceMetricKey[] = [
  'energy',
  'stress',
  'focus',
  'health',
  'sleepDebt',
  'nutritionScore',
  'mood',
  'clarity',
];

function clampMetric(key: ResourceMetricKey, value: number): number {
  const bounds = RESOURCE_LIMITS[key];
  if (!bounds) return value;
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

export function matchesRequirements(card: EventCard, resource: Resource): boolean {
  if (!card.requires) return true;
  return card.requires.every((req: EventRequirement) => {
    const val = resource[req.field];
    switch (req.op) {
      case '>=': return val >= req.value;
      case '>': return val > req.value;
      case '<=': return val <= req.value;
      case '<': return val < req.value;
      case '=': return val === req.value;
      default: return true;
    }
  });
}

export function applyEventChoice(base: Resource, choice: EventChoice): Resource {
  const balance = resolveBalance();
  const guardrails = balance.guardrails;
  const next: Resource = { ...base };

  METRIC_KEYS.forEach((key) => {
    const rawDelta = choice.effects[key];
    if (typeof rawDelta === 'number') {
      const delta = clampDelta(key, rawDelta, guardrails);
      const current = next[key] as number;
      const updated = clampMetric(key, current + delta);
      next[key] = updated as Resource[typeof key];
    }
  });

  return next;
}
