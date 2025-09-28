import { Rule, Resource } from '@/types';

type EvaluateOptions = {
  now?: string;
};

function inCooldown(rule: Rule, nowMs: number): boolean {
  if (!rule.cooldownSec || !rule.lastFiredAt) return false;
  const lastMs = Date.parse(rule.lastFiredAt);
  if (Number.isNaN(lastMs)) return false;
  return nowMs - lastMs < rule.cooldownSec * 1000;
}

function checkCondition(rule: Rule, res: Resource): boolean {
  const fieldVal = (res as any)[rule.if.field] as number;
  switch (rule.if.op) {
    case '>=': return fieldVal >= rule.if.value;
    case '<=': return fieldVal <= rule.if.value;
    case '<': return fieldVal < rule.if.value;
    case '=': return fieldVal === rule.if.value;
    default: return false;
  }
}

export function evaluateRules(rules: Rule[], res: Resource, options: EvaluateOptions = {}): string[] {
  const fired: string[] = [];
  const nowMs = options.now ? Date.parse(options.now) : Date.now();
  const sorted = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  for (const rule of sorted) {
    if (!rule.enabled) continue;
    if (inCooldown(rule, nowMs)) continue;
    if (checkCondition(rule, res)) {
      fired.push(rule.id);
    }
  }
  return fired;
}
