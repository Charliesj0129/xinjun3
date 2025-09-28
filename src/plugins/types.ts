import type { ComponentType } from 'react';
import type { Resource, ActionLog } from '@/types';

export type PluginPermission = 'calendar'|'health';

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  description?: string;
  safe: boolean;
  permissions?: PluginPermission[];
};

export type PluginScreen = {
  route: string;
  label: string;
  component: ComponentType<any>;
};

export type PluginAction = {
  id: string;
  label: string;
  description?: string;
  run: (context: { resource: Resource; date: string; applyAction: (log: ActionLog) => Promise<void>; }) => Promise<void>;
};

export type PluginHooks = {
  onActionLogged?: (log: ActionLog) => void;
  onSettleDay?: (context: { date: string; resource: Resource }) => void;
};

export type PluginDefinition = {
  manifest: PluginManifest;
  screens?: PluginScreen[];
  actions?: PluginAction[];
  hooks?: PluginHooks;
};
