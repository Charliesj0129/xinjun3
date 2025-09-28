import { EventCard, EventChainMeta } from '@/types';

export type QueuedEvent = {
  id: string;
  expiresAt: string;
  reason: 'chain'|'crisis';
  chainId?: string;
  stage?: number;
};

type EventQueueState = {
  entries: QueuedEvent[];
  chainProgress: Record<string, number>;
};

const state: EventQueueState = { entries: [], chainProgress: {} };

export function enqueueEvent(entry: QueuedEvent) {
  state.entries.push(entry);
}

export function dequeueExpired(nowIso: string) {
  const now = Date.parse(nowIso);
  state.entries = state.entries.filter(entry => {
    const exp = Date.parse(entry.expiresAt);
    return !Number.isFinite(exp) || exp > now;
  });
}

export function takeQueued(nowIso: string): QueuedEvent | undefined {
  dequeueExpired(nowIso);
  const next = state.entries.shift();
  return next;
}

export function queueChain(chain: EventChainMeta, nowIso: string) {
  if (!chain.nextId) return;
  state.chainProgress[chain.chainId] = chain.stage;
  enqueueEvent({
    id: chain.nextId,
    expiresAt: nowIso,
    reason: 'chain',
    chainId: chain.chainId,
    stage: chain.stage + 1,
  });
}

export function queueCrisis(rescueIds: string[], nowIso: string) {
  const expires = new Date(Date.parse(nowIso) + 48 * 60 * 60 * 1000).toISOString();
  rescueIds.forEach(id => enqueueEvent({ id, expiresAt: expires, reason: 'crisis' }));
}

export function clearQueue() {
  state.entries = [];
  state.chainProgress = {};
}

export function getQueue() {
  return [...state.entries];
}

export function getChainStage(chainId: string) {
  return state.chainProgress[chainId] ?? 0;
}
