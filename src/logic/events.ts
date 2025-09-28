import { EventCard, EventChoice, EventRequirement, Resource, TimelineDelta } from '@/types';
import { resolveBalance } from '@/config/remote';
import { applyDelta, getMetricKeys, getMetricLimits } from '@/logic/delta';
import { DailyEvents } from '@/data/events';
import { takeQueued, queueChain, queueCrisis, getChainStage } from '@/logic/eventQueue';
import { createSeededRng, hashSeed } from '@/utils/prng';

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

function weekdayMatches(card: EventCard, weekday: number) {
  if (!card.weekday || card.weekday.length === 0) return true;
  return card.weekday.includes(weekday);
}

const RARITY_WEIGHT: Record<NonNullable<EventCard['rarity']>, number> = {
  common: 0.7,
  uncommon: 0.25,
  rare: 0.05,
};

function weightFor(card: EventCard) {
  if (!card.rarity) return 0.7;
  return RARITY_WEIGHT[card.rarity] ?? 0.7;
}

export type EventSelection = {
  card: EventCard;
  source: 'queue'|'random';
};

export function selectEventCard(
  date: string,
  resource: Resource,
  deck: EventCard[] = DailyEvents,
  seed: string = date,
  difficultyMode: 'ease'|'normal'|'elite' = 'normal',
): EventSelection | null {
  const nowIso = new Date().toISOString();
  const dayId = date;
  let queued = takeQueued(nowIso, dayId);
  while (queued) {
    const card = deck.find(c => c.id === queued.id);
    if (card && matchesRequirements(card, resource)) {
      if (card.chain) {
        queueChain(card.chain, nowIso);
      }
      if (card.crisis) {
        queueCrisis(card.crisis.rescueIds, nowIso);
      }
      return { card, source: 'queue' };
    }
    queued = takeQueued(nowIso, dayId);
  }

  const weekday = new Date(date).getDay();
  const filtered = deck.filter(card => {
    if (!weekdayMatches(card, weekday)) return false;
    if (!matchesRequirements(card, resource)) return false;
    if (card.chain) {
      const stage = getChainStage(card.chain.chainId);
      if (card.chain.stage && card.chain.stage > stage + 1) return false;
    }
    return true;
  });

  if (filtered.length === 0) return null;

  const rng = createSeededRng(hashSeed(seed));
  const totalWeight = filtered.reduce((sum, card) => {
    let weight = weightFor(card);
    if (difficultyMode === 'ease') {
      if (card.crisis) weight *= 0.8;
      if (card.rescue) weight *= 1.2;
    }
    return sum + weight;
  }, 0);
  let roll = rng() * totalWeight;
  for (const card of filtered) {
    let weight = weightFor(card);
    if (difficultyMode === 'ease') {
      if (card.crisis) weight *= 0.8;
      if (card.rescue) weight *= 1.2;
    }
    roll -= weight;
    if (roll <= 0) {
      if (card.chain) {
        queueChain(card.chain, nowIso);
      }
      if (card.crisis) {
        queueCrisis(card.crisis.rescueIds, nowIso);
      }
      return { card, source: 'random' };
    }
  }

  const fallback = filtered[filtered.length - 1];
  if (fallback.chain) {
    queueChain(fallback.chain, nowIso);
  }
  if (fallback.crisis) {
    queueCrisis(fallback.crisis.rescueIds, nowIso);
  }
  return { card: fallback, source: 'random' };
}
