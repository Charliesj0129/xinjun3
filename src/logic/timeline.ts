import { TimelineDelta, TimelineEntry } from '@/types';
import { insertTimelineEntry } from '@/db/db';

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export type TimelineContext = {
  kind: TimelineEntry['kind'];
  refId: string;
  actionType?: TimelineEntry['actionType'];
  choiceId?: string;
  at?: string;
  delta?: TimelineDelta;
};

export async function logTimeline(context: TimelineContext): Promise<void> {
  const entry: TimelineEntry = {
    id: makeId(context.kind),
    at: context.at ?? new Date().toISOString(),
    kind: context.kind,
    refId: context.refId,
    actionType: context.actionType,
    choiceId: context.choiceId,
    delta: context.delta && Object.keys(context.delta).length ? context.delta : undefined,
  };
  await insertTimelineEntry(entry);
}

export function createDeltaTracker() {
  const delta: TimelineDelta = {};
  return {
    add(metric: keyof TimelineDelta, amount: number) {
      if (!amount) return;
      delta[metric] = (delta[metric] ?? 0) + amount;
    },
    snapshot(): TimelineDelta {
      return { ...delta };
    }
  };
}
