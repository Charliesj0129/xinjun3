import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useStore } from '@/state/store';
import { useTimelineStore } from '@/state/timelineStore';
import { settleDay, roomBonus, SettleOptions, finalizeSettlement } from '@/logic/calc';
import { listActiveEffects } from '@/logic/buffs';
import { RoomBonus as RoomBonusType, StatusEffect, Resource } from '@/types';
import { upsertResource } from '@/db/db';

const METRICS: Array<keyof Pick<Resource, 'energy'|'stress'|'focus'|'health'|'sleepDebt'|'nutritionScore'|'mood'|'clarity'>> = [
  'energy',
  'stress',
  'focus',
  'health',
  'sleepDebt',
  'nutritionScore',
  'mood',
  'clarity',
];

const DEFAULT_ROOM_BONUS: RoomBonusType = {
  bedroomQuality: 0,
  deskQuality: 0,
  gymReady: false,
  kitchenPrep: false,
};

export default function EndOfDayScreen() {
  const resource = useStore(s => s.resource);
  const actions = useStore(s => s.actions);
  const setResource = useStore(s => s.setResource);
  const buildId = useStore(s => s.buildId);
  const prestigeCaps = useStore(s => s.prestige.caps);
  const loadTimeline = useTimelineStore(s => s.loadTimeline);

  const [roomBonusState, setRoomBonusState] = useState<RoomBonusType>(DEFAULT_ROOM_BONUS);
  const [effects, setEffects] = useState<StatusEffect[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadContext() {
      const [bonus, fx] = await Promise.all([
        roomBonus(resource.date),
        listActiveEffects(resource.date),
      ]);
      if (!mounted) return;
      setRoomBonusState(bonus);
      setEffects(fx);
    }
    loadContext();
    return () => { mounted = false; };
  }, [resource.date]);

  const preview = useMemo(() => {
    const options: SettleOptions = { effects, roomBonus: roomBonusState, buildId, caps: prestigeCaps };
    return settleDay(resource, actions, options);
  }, [resource, actions, effects, roomBonusState, buildId, prestigeCaps]);

  const deltas = useMemo(() => {
    const diff: Record<string, number> = {};
    METRICS.forEach(key => {
      diff[key] = (preview[key] as number) - (resource[key] as number);
    });
    return diff;
  }, [preview, resource]);

  async function handleSettle() {
    if (loading) return;
    setLoading(true);
    try {
      const settled = await finalizeSettlement(resource, actions, {
        effects,
        roomBonus: roomBonusState,
        actionsCount: actions.length,
        buildId,
        caps: prestigeCaps,
      });
      await upsertResource(settled);
      setResource(settled);
      await loadTimeline(settled.date);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>今日結算預覽</Text>
        <View style={styles.card}>
          {METRICS.map(key => (
            <View key={key} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{key}</Text>
              <View style={styles.metricValues}>
                <Text style={styles.metricValue}>{resource[key]}</Text>
                <Text style={[styles.metricDelta, deltas[key] >= 0 ? styles.up : styles.down]}>
                  {deltas[key] >= 0 ? `+${deltas[key]}` : deltas[key]}
                </Text>
                <Text style={styles.metricValue}>{preview[key]}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>房間加成</Text>
          <Text style={styles.body}>臥室品質：{roomBonusState.bedroomQuality}/3</Text>
          <Text style={styles.body}>書桌品質：{roomBonusState.deskQuality}/2</Text>
          <Text style={styles.body}>健身備妥：{roomBonusState.gymReady ? '是' : '否'}</Text>
          <Text style={styles.body}>廚房備料：{roomBonusState.kitchenPrep ? '是' : '否'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>當前 Buff / Debuff</Text>
          {effects.length === 0 ? (
            <Text style={styles.body}>今日無狀態效果。</Text>
          ) : effects.map(effect => (
            <View key={effect.id} style={styles.effectRow}>
              <Text style={[styles.effectName, effect.kind === 'buff' ? styles.buff : styles.debuff]}>{effect.name}</Text>
              <Text style={styles.body}>x{effect.stacks}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity onPress={handleSettle} style={styles.cta} disabled={loading}>
        {loading ? <ActivityIndicator color="#0b0f1a"/> : <Text style={styles.ctaText}>結算今日</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070f' },
  scroll: { padding: 16, paddingBottom: 120 },
  title: { color: '#e2e8f0', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#111827', padding: 16, borderRadius: 14, marginBottom: 16 },
  sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  body: { color: '#cbd5f5', marginBottom: 4 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLabel: { color: '#e2e8f0', fontSize: 14, textTransform: 'capitalize' },
  metricValues: { flexDirection: 'row', alignItems: 'center' },
  metricValue: { color: '#94a3b8', width: 40, textAlign: 'right', marginHorizontal: 4 },
  metricDelta: { width: 60, textAlign: 'center', fontWeight: '600', marginHorizontal: 4 },
  up: { color: '#4ade80' },
  down: { color: '#f87171' },
  effectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  effectName: { fontSize: 15, fontWeight: '600' },
  buff: { color: '#4ade80' },
  debuff: { color: '#f87171' },
  cta: { position: 'absolute', left: 16, right: 16, bottom: 24, backgroundColor: '#38bdf8', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  ctaText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
});
