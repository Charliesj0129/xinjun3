import { PluginDefinition } from '@/plugins/types';
import { usePluginStore } from '@/state/pluginStore';

class PluginRegistryClass {
  private plugins: Map<string, PluginDefinition> = new Map();

  register(plugin: PluginDefinition) {
    this.plugins.set(plugin.manifest.id, plugin);
  }

  unregister(id: string) {
    this.plugins.delete(id);
  }

  get(id: string) {
    return this.plugins.get(id);
  }

  list() {
    return Array.from(this.plugins.values());
  }

  enabled() {
    const enabledIds = usePluginStore.getState().enabledIds;
    return enabledIds.map(id => this.plugins.get(id)).filter(Boolean) as PluginDefinition[];
  }
}

export const PluginRegistry = new PluginRegistryClass();
