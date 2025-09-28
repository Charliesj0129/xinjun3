import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { BUILDS } from "@/config/builds";
import { KEYSTONES } from "@/config/keystones";
import { aggregateKeystoneModifiers } from "@/logic/prestige";
import { useStore } from "@/state/store";

export default function BuildsScreen() {
  const buildId = useStore(s => s.buildId);
  const setBuild = useStore(s => s.setBuild);
  const keystones = useStore(s => s.prestige.keystones);

  const keystoneDetails = useMemo(() => KEYSTONES.map(k => ({
    ...k,
    unlocked: keystones.includes(k.id),
  })), [keystones]);

  const aggregated = useMemo(() => aggregateKeystoneModifiers(keystones), [keystones]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>流派與天賦</Text>
      <Text style={styles.subtitle}>選擇適合今天節奏的 Build，並檢視已解鎖的 Keystone。</Text>

      {Object.values(BUILDS).map(build => (
        <View key={build.id} style={[styles.card, buildId === build.id && styles.cardActive]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{build.name}</Text>
            {buildId === build.id && <Text style={styles.badge}>使用中</Text>}
          </View>
          <Text style={styles.body}>{build.description}</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>核心加成</Text>
            <Text style={styles.body}>專注獲得 ×{build.modifiers.focusGainMult}</Text>
            <Text style={styles.body}>壓力增幅 ×{build.modifiers.stressIncreaseMult}</Text>
            <Text style={styles.body}>睡眠回補 ×{build.modifiers.sleepGainMult}</Text>
            <Text style={styles.body}>飲食放大 ×{build.modifiers.nutritionGainMult}</Text>
            <Text style={styles.body}>日記清明 ×{build.modifiers.journalClarityGain}</Text>
          </View>
          {buildId !== build.id && (
            <TouchableOpacity style={styles.button} accessibilityRole="button" onPress={() => setBuild(build.id)}>
              <Text style={styles.buttonText}>切換至此流派</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Keystones</Text>
        <Text style={styles.body}>掌握的天賦會與 Build 相乘，加深專屬風格。</Text>
        {keystoneDetails.map(keystone => (
          <View key={keystone.id} style={styles.keystoneRow}>
            <View style={styles.keystoneText}>
              <Text style={styles.keystoneTitle}>{keystone.name}</Text>
              <Text style={styles.keystoneDesc}>{keystone.description}</Text>
            </View>
            <Text style={[styles.keystoneBadge, keystone.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
              {keystone.unlocked ? '已解鎖' : '未解鎖'}
            </Text>
          </View>
        ))}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>總加成（乘算）</Text>
          <Text style={styles.body}>專注 ×{aggregated.focusGainMult.toFixed(2)}</Text>
          <Text style={styles.body}>壓力增幅 ×{aggregated.stressIncreaseMult.toFixed(2)}</Text>
          <Text style={styles.body}>睡眠回補 ×{aggregated.sleepGainMult.toFixed(2)}</Text>
          <Text style={styles.body}>飲食放大 ×{aggregated.nutritionGainMult.toFixed(2)}</Text>
          <Text style={styles.body}>日記清明 ×{aggregated.journalClarityGain.toFixed(2)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#cbd5f5', marginBottom: 16, marginTop: 6 },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  cardActive: { borderColor: '#38bdf8' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '600' },
  badge: { color: '#38bdf8', fontWeight: '600' },
  body: { color: '#e2e8f0', lineHeight: 20, marginTop: 4 },
  section: { marginTop: 12 },
  sectionTitle: { color: '#38bdf8', fontWeight: '600', marginBottom: 4 },
  button: { marginTop: 16, backgroundColor: '#38bdf8', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: '700' },
  keystoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  keystoneText: { flex: 1, marginRight: 12 },
  keystoneTitle: { color: '#f8fafc', fontWeight: '600' },
  keystoneDesc: { color: '#cbd5f5', marginTop: 2 },
  keystoneBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 12 },
  badgeUnlocked: { backgroundColor: '#1d4ed8', color: '#e0f2fe' },
  badgeLocked: { backgroundColor: '#1f2937', color: '#94a3b8' },
});
