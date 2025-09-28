import { useStore } from '@/state/store';

export function evaluateWeeklyDifficulty(nowIso: string) {
  useStore.getState().evaluateDifficulty(nowIso);
}
