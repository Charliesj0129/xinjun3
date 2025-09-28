import { Balance } from './balance';

type RemotePayload = {
  guardrails?: Partial<typeof Balance.guardrails>;
  momentum?: Partial<typeof Balance.momentum>;
  upkeepRules?: typeof Balance.upkeepRules;
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

export function resolveBalance() {
  const remote = cache?.payload ?? {};
  return {
    guardrails: { ...Balance.guardrails, ...(remote.guardrails ?? {}) },
    momentum: { ...Balance.momentum, ...(remote.momentum ?? {}) },
    upkeepRules: remote.upkeepRules ?? Balance.upkeepRules,
  };
}
