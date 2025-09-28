import { Balance, Momentum, DeltaCaps } from './balance';
import { UpkeepRule } from '@/types';

type RemoteMomentum = Partial<Omit<typeof Momentum, 'gainThresholdPerModule' | 'decayGraceDays' | 'addPerStack'>> & {
  gainThresholdPerModule?: Partial<typeof Momentum.gainThresholdPerModule>;
  decayGraceDays?: Partial<typeof Momentum.decayGraceDays>;
  addPerStack?: Partial<typeof Momentum.addPerStack>;
};

type RemotePayload = {
  guardrails?: Partial<DeltaCaps>;
  momentum?: RemoteMomentum;
  upkeepRules?: UpkeepRule[];
  expiresAt?: string;
  version?: string;
};

export type RemoteBalanceConfig = {
  fetchedAt: string;
  payload: RemotePayload;
};

let cache: RemoteBalanceConfig | null = null;

export async function fetchRemoteBalanceConfig(): Promise<RemoteBalanceConfig | null> {
  // Placeholder for future remote config fetching (e.g., CDN JSON or EAS Update resource).
  return cache;
}

export function setRemoteBalanceConfig(config: RemoteBalanceConfig | null): void {
  cache = config;
}

function mergeMomentum(remote?: RemoteMomentum) {
  if (!remote) return Balance.momentum;
  return {
    ...Balance.momentum,
    ...remote,
    gainThresholdPerModule: {
      ...Balance.momentum.gainThresholdPerModule,
      ...(remote.gainThresholdPerModule ?? {}),
    },
    decayGraceDays: {
      ...Balance.momentum.decayGraceDays,
      ...(remote.decayGraceDays ?? {}),
    },
    addPerStack: {
      ...Balance.momentum.addPerStack,
      ...(remote.addPerStack ?? {}),
    },
  };
}

function mergeGuardrails(remote?: Partial<DeltaCaps>) {
  if (!remote) return Balance.guardrails;
  return {
    ...Balance.guardrails,
    ...remote,
  };
}

export function resolveBalance() {
  const remote = cache?.payload ?? {};
  return {
    guardrails: mergeGuardrails(remote.guardrails),
    momentum: mergeMomentum(remote.momentum),
    upkeepRules: remote.upkeepRules ?? Balance.upkeepRules,
  };
}
