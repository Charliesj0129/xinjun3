import { EventCard, EventChoice, EventRequirement, Resource } from '@/types';
import { resolveBalance } from '@/config/remote';
import { applyDelta, getMetricKeys, getMetricLimits } from '@/logic/delta';

const METRIC_KEYS = getMetricKeys();
const METRIC_LIMITS = getMetricLimits();

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
      const current = next[key] as number;
      const updated = applyDelta(current, key, rawDelta, { guardrails, limits: METRIC_LIMITS });
      next[key] = updated as Resource[typeof key];
    }
  });

  return next;
}
