import { DailyEvents } from "@/data/events";
import { createSeededRng, hashSeed } from "@/utils/prng";
import type { Resource } from "@/types";

export type MCParams = {
  days: number;
  trials: number;
  seed?: string;
};

export type MCResult = {
  perfectRate: number;
  averageSleepDebt: number;
  averageStress: number;
  distribution: number[];
};

const METRIC_LIMITS = {
  energy: { min: 0, max: 100 },
  stress: { min: 0, max: 100 },
  focus: { min: 0, max: 100 },
  health: { min: 0, max: 100 },
  sleepDebt: { min: 0, max: 20 },
  nutritionScore: { min: 0, max: 10 },
  mood: { min: -5, max: 5 },
  clarity: { min: 0, max: 5 },
} as const;

function baseResource(): Resource {
  return {
    date: "sim",
    energy: 70,
    stress: 35,
    focus: 55,
    health: 70,
    sleepDebt: 1,
    nutritionScore: 7,
    mood: 0,
    clarity: 1,
  };
}

function clamp(metric: keyof typeof METRIC_LIMITS, value: number) {
  const limit = METRIC_LIMITS[metric];
  return Math.max(limit.min, Math.min(limit.max, value));
}

function applyChoice(resource: Resource, effects: Partial<Resource>) {
  const next = { ...resource };
  (Object.keys(effects) as (keyof Resource)[]).forEach(key => {
    if (key === "date") return;
    const metric = key as keyof typeof METRIC_LIMITS;
    const current = (next[key] as number) ?? 0;
    const delta = (effects[key] as number) ?? 0;
    next[key] = clamp(metric, current + delta) as any;
  });
  return next;
}

function isPerfect(resource: Resource) {
  return resource.energy >= 80 && resource.focus >= 80 && resource.stress <= 40 && resource.sleepDebt <= 2 && resource.nutritionScore >= 7;
}

export function runMonteCarlo({ days, trials, seed }: MCParams): MCResult {
  const rng = createSeededRng(hashSeed(seed ?? "mc"));
  let perfectCount = 0;
  let totalSleep = 0;
  let totalStress = 0;
  const distribution: number[] = new Array(days + 1).fill(0);

  for (let t = 0; t < trials; t++) {
    let resource = baseResource();
    let streak = 0;
    for (let d = 0; d < days; d++) {
      const card = weightedPick(rng, resource);
      const choice = card.choices[Math.floor(rng() * card.choices.length)] ?? card.choices[0];
      resource = applyChoice(resource, choice.effects ?? {});
      const perfect = isPerfect(resource);
      if (perfect) {
        streak += 1;
        perfectCount += 1;
      }
    }
    totalSleep += resource.sleepDebt;
    totalStress += resource.stress;
    distribution[streak] = (distribution[streak] ?? 0) + 1;
  }

  return {
    perfectRate: perfectCount / (trials * days),
    averageSleepDebt: totalSleep / trials,
    averageStress: totalStress / trials,
    distribution,
  };
}

function weightedPick(rng: () => number, resource: Resource) {
  const candidates = DailyEvents.filter(event => (event.requires ?? []).every(req => {
    const value = (resource as any)[req.field] as number;
    switch (req.op) {
      case ">=": return value >= req.value;
      case ">": return value > req.value;
      case "<=": return value <= req.value;
      case "<": return value < req.value;
      case "=": return value === req.value;
      default: return true;
    }
  }));
  if (candidates.length === 0) return DailyEvents[0];
  const weights = candidates.map(c => 1 - (c.rarity === "rare" ? 0.6 : c.rarity === "uncommon" ? 0.3 : 0));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
