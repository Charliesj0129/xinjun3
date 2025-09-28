import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { BuiltinPlugins } from "@/plugins";
import { usePluginStore } from "@/state/pluginStore";

export default function PluginsManagerScreen() {
  const installed = usePluginStore(s => s.installedIds);
  const enabled = usePluginStore(s => s.enabledIds);
  const install = usePluginStore(s => s.install);
  const uninstall = usePluginStore(s => s.uninstall);
  const enable = usePluginStore(s => s.enable);
  const disable = usePluginStore(s => s.disable);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>插件管理</Text>
      <Text style={styles.subtitle}>外掛僅能透過官方 API 影響遊戲，啟用前請確認權限。</Text>
      {BuiltinPlugins.map(plugin => {
        const id = plugin.manifest.id;
        const isInstalled = installed.includes(id);
        const isEnabled = enabled.includes(id);
        return (
          <View key={id} style={styles.card}>
            <Text style={styles.cardTitle}>{plugin.manifest.name}</Text>
            <Text style={styles.body}>{plugin.manifest.description}</Text>
            <Text style={styles.meta}>版本：{plugin.manifest.version}</Text>
            <Text style={styles.meta}>權限：{(plugin.manifest.permissions ?? []).join(', ') || '無'}</Text>
            <View style={styles.row}>
              {!isInstalled ? (
                <TouchableOpacity style={styles.button} onPress={() => install(id)}>
                  <Text style={styles.buttonText}>安裝</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => uninstall(id)}>
                  <Text style={styles.secondaryText}>移除</Text>
                </TouchableOpacity>
              )}
              {isInstalled && (
                <TouchableOpacity
                  style={[styles.button, isEnabled && styles.buttonActive]}
                  onPress={() => (isEnabled ? disable(id) : enable(id))}
                >
                  <Text style={styles.buttonText}>{isEnabled ? '停用' : '啟用'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#cbd5f5', marginBottom: 16, marginTop: 6 },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '600' },
  body: { color: '#cbd5f5', marginTop: 8, marginBottom: 8 },
  meta: { color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { backgroundColor: '#38bdf8', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  buttonActive: { backgroundColor: '#f97316' },
  buttonText: { color: '#0f172a', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  secondaryText: { color: '#e2e8f0' },
});
