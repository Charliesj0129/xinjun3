import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { RITUALS } from "@/config/rituals";
import { useStore } from "@/state/store";
import type { RitualRecipe, ShardType } from "@/types";

function formatCooldown(expiresAt?: string) {
  if (!expiresAt) return null;
  const ms = Date.parse(expiresAt) - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return hours + " 小時 " + minutes + " 分";
  return minutes + " 分";
}

function ritualAvailable(_recipe: RitualRecipe, cooldown?: string) {
  if (!cooldown) return true;
  return Date.parse(cooldown) <= Date.now();
}

export default function RitualsScreen() {
  const shards = useStore(s => s.shards);
  const cooldowns = useStore(s => s.ritualCooldowns);
  const performRitual = useStore(s => s.performRitual);
  const [pending, setPending] = useState<string | null>(null);

  async function handlePerform(recipe: RitualRecipe) {
    if (pending) return;
    setPending(recipe.id);
    const ok = await performRitual(recipe.id, new Date().toISOString());
    setPending(null);
    if (!ok) {
      Alert.alert("儀式不可執行", "可能是時段不符、冷卻尚未結束或碎片不足。");
    } else {
      Alert.alert("儀式完成", "感謝投入這份儀式，效果已啟動。");
    }
  }

  function shardsEnough(inputs: ShardType[]) {
    const cost: Record<ShardType, number> = { focusShard: 0, clarityShard: 0 };
    inputs.forEach(input => { cost[input] = (cost[input] ?? 0) + 1; });
    return Object.entries(cost).every(([key, value]) => (shards as any)[key] >= (value ?? 0));
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>儀式工坊</Text>
      <Text style={styles.subtitle}>專注碎片：{shards.focusShard} ｜ 洞察碎片：{shards.clarityShard}</Text>
      {RITUALS.map(recipe => {
        const cooldown = cooldowns[recipe.id];
        const available = ritualAvailable(recipe, cooldown);
        const enough = shardsEnough(recipe.inputs);
        const remaining = formatCooldown(cooldown);
        return (
          <View key={recipe.id} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.cardTitle}>{recipe.name}</Text>
              <Text style={styles.duration}>{recipe.durationMinutes} 分 · {windowLabel(recipe.window)}</Text>
            </View>
            <Text style={styles.description}>{recipe.description}</Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>步驟</Text>
              {recipe.steps.map(step => (
                <Text key={step} style={styles.body}>• {step}</Text>
              ))}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>好處</Text>
              {recipe.benefits.map(benefit => (
                <Text key={benefit} style={styles.body}>• {benefit}</Text>
              ))}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>消耗碎片</Text>
              <Text style={styles.body}>{recipe.inputs.map(labelShard).join(" + ") || "無"}</Text>
            </View>
            {remaining && (
              <Text style={styles.cooldown}>冷卻剩餘：{remaining}</Text>
            )}
            <TouchableOpacity
              accessibilityRole="button"
              disabled={!available || !enough || pending === recipe.id}
              style={[styles.button, (!available || !enough) && styles.buttonDisabled]}
              onPress={() => handlePerform(recipe)}
            >
              <Text style={styles.buttonText}>
                {!available ? "冷卻中" : !enough ? "碎片不足" : "施行儀式"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

function labelShard(shard: ShardType) {
  return shard === "focusShard" ? "Focus Shard" : "Clarity Shard";
}

function windowLabel(window?: 'am'|'pm'|'evening') {
  switch (window) {
    case 'am':
      return '上午窗口';
    case 'pm':
      return '下午窗口';
    case 'evening':
      return '晚間窗口';
    default:
      return '任意時段';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#cbd5f5', marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1e293b' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '600' },
  duration: { color: '#94a3b8', fontSize: 12 },
  description: { color: '#cbd5f5', marginTop: 8 },
  section: { marginTop: 12 },
  sectionTitle: { color: '#38bdf8', fontWeight: '600', marginBottom: 4 },
  body: { color: '#e2e8f0', lineHeight: 20 },
  cooldown: { color: '#fbbf24', marginTop: 8 },
  button: { marginTop: 16, backgroundColor: '#38bdf8', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#1e293b' },
  buttonText: { color: '#0f172a', fontWeight: '700' },
});
