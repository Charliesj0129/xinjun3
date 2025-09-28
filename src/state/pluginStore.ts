import { create } from 'zustand';

interface PluginState {
  installedIds: string[];
  enabledIds: string[];
  install: (id: string) => void;
  uninstall: (id: string) => void;
  enable: (id: string) => void;
  disable: (id: string) => void;
}

export const usePluginStore = create<PluginState>((set) => ({
  installedIds: [],
  enabledIds: [],
  install: (id) => set(s => ({ installedIds: s.installedIds.includes(id) ? s.installedIds : [...s.installedIds, id] })),
  uninstall: (id) => set(s => ({
    installedIds: s.installedIds.filter(x => x !== id),
    enabledIds: s.enabledIds.filter(x => x !== id),
  })),
  enable: (id) => set(s => ({ enabledIds: s.enabledIds.includes(id) ? s.enabledIds : [...s.enabledIds, id] })),
  disable: (id) => set(s => ({ enabledIds: s.enabledIds.filter(x => x !== id) })),
}));
