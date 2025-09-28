import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, AccessibilityInfo, Animated } from 'react-native';
import { useStore } from '@/state/store';
import { useTimelineStore } from '@/state/timelineStore';
import { settleDay, roomBonus, SettleOptions, finalizeSettlement } from '@/logic/calc';
import { listActiveEffects } from '@/logic/buffs';
import { RoomBonus as RoomBonusType, StatusEffect, Resource } from '@/types';
import { upsertResource } from '@/db/db';
import { processPerfectDay } from '@/logic/prestige';
import { PrestigeModal } from '@/components/PrestigeModal';

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
  const keystones = useStore(s => s.prestige.keystones);
  const prestige = useStore(s => s.prestige);
  const setPrestige = useStore(s => s.setPrestige);
  const recordPerfectDay = useStore(s => s.recordPerfectDay);
  const addShard = useStore(s => s.addShard);
  const pendingPrestigeReward = useStore(s => s.pendingPrestigeReward);
  const setPendingPrestigeReward = useStore(s => s.setPendingPrestigeReward);
  const loadTimeline = useTimelineStore(s => s.loadTimeline);

  const [roomBonusState, setRoomBonusState] = useState<RoomBonusType>(DEFAULT_ROOM_BONUS);
  const [effects, setEffects] = useState<StatusEffect[]>([]);
  const [loading, setLoading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);

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

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      setReduceMotion(value);
      if (value) {
        animation.setValue(1);
      }
    });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      subscription?.remove?.();
    };
  }, [animation]);

  useEffect(() => {
    if (!reduceMotion) {
      animation.setValue(1);
    }
  }, [animation, reduceMotion]);

  useEffect(() => {
    if (pendingPrestigeReward) {
      setShowPrestigeModal(true);
    }
  }, [pendingPrestigeReward]);

  const preview = useMemo(() => {
    const options: SettleOptions = { effects, roomBonus: roomBonusState, buildId, caps: prestigeCaps, keystones };
    return settleDay(resource, actions, options);
  }, [resource, actions, effects, roomBonusState, buildId, prestigeCaps, keystones]);

  const deltas = useMemo(() => {
    const diff: Record<string, number> = {};
    METRICS.forEach(key => {
      diff[key] = (preview[key] as number) - (resource[key] as number);
    });
    return diff;
  }, [preview, resource]);

  const isPerfectDay = (res: Resource) => {
    return res.energy >= 80 && res.focus >= 80 && res.stress <= 40 && res.sleepDebt <= 2 && res.nutritionScore >= 7;
  };

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
        keystones,
      });
      await upsertResource(settled);
      setResource(settled);
      await loadTimeline(settled.date);
      if (settled.focus >= 85) addShard('focusShard', 1);
      if (settled.clarity >= 3) addShard('clarityShard', 1);
      const perfect = isPerfectDay(settled);
      recordPerfectDay(`${resource.date}T00:00:00+08:00`, perfect);
      if (perfect) {
        const result = processPerfectDay(prestige);
        setPrestige(() => result.next);
        if (result.next.level > prestige.level || result.unlocked) {
          setPendingPrestigeReward({
            level: result.next.level,
            caps: result.next.caps,
            keystoneId: result.unlocked?.id,
            keystoneName: result.unlocked?.name,
          });
        }
      }
      if (!reduceMotion) {
        animation.setValue(0);
        Animated.timing(animation, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>今日結算預覽</Text>
        <Animated.View style={[styles.card, !reduceMotion && { transform: [{ scale: animation.interpolate({ inputRange:[0,1], outputRange:[0.98,1] }) }], opacity: reduceMotion ? 1 : animation.interpolate({ inputRange:[0,1], outputRange:[0.6,1] }) }] }>
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
        </Animated.View>

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
      <PrestigeModal
        visible={showPrestigeModal}
        reward={pendingPrestigeReward}
        onClose={() => {
          setShowPrestigeModal(false);
          setPendingPrestigeReward(undefined);
        }}
      />
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
