import { EventCard, EventChoice, EventRequirement, Resource, TimelineDelta } from '@/types';
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

export function applyEventChoice(base: Resource, choice: EventChoice, onApplied?: (delta: TimelineDelta) => void): Resource {
  const balance = resolveBalance();
  const guardrails = balance.guardrails;
  const next: Resource = { ...base };
  const deltaAccumulator: TimelineDelta = {};

  METRIC_KEYS.forEach((key) => {
    const rawDelta = choice.effects[key];
    if (typeof rawDelta === 'number') {
      const current = next[key] as number;
      const updated = applyDelta(current, key, rawDelta, {
        guardrails,
        limits: METRIC_LIMITS,
        onApplied: amt => {
          deltaAccumulator[key] = (deltaAccumulator[key] ?? 0) + amt;
        }
      });
      next[key] = updated as Resource[typeof key];
    }
  });

  if (onApplied && Object.keys(deltaAccumulator).length) {
    onApplied(deltaAccumulator);
  }

  return next;
}
