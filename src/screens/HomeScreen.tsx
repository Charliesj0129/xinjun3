import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, AccessibilityInfo, Pressable, ActivityIndicator } from 'react-native';
import { useStore } from '@/state/store';
import { ResourceBar } from '@/components/ResourceBar';
import { initDb, upsertResource } from '@/db/db';
import { PrestigeModal } from '@/components/PrestigeModal';
import { useTimelineStore } from '@/state/timelineStore';
import type { TimelineDelta, TimelineEntry } from '@/types';

export default function HomeScreen(){
  const r = useStore(s=>s.resource);
  const today = useStore(s=>s.today);
  const loadDay = useStore(s=>s.loadDay);
  const timelineEntries = useTimelineStore(s => s.entries);
  const loadTimeline = useTimelineStore(s => s.loadTimeline);
  const loadingTimeline = useTimelineStore(s => s.loading);
  const pendingPrestigeReward = useStore(s => s.pendingPrestigeReward);
  const setPendingPrestigeReward = useStore(s => s.setPendingPrestigeReward);
  const [metric, setMetric] = useState<'energy'|'stress'|'focus'|'sleepDebt'|'nutritionScore'>('energy');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);

  useEffect(()=>{
    initDb();
    loadDay(today);
  },[]);

  useEffect(()=>{ upsertResource(r); },[r]);

  useEffect(() => {
    loadTimeline(today);
  }, [today, loadTimeline]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (pendingPrestigeReward) {
      setShowPrestigeModal(true);
    }
  }, [pendingPrestigeReward]);

  const metricOptions: { key: typeof metric; label: string }[] = [
    { key: 'energy', label: 'Energy' },
    { key: 'stress', label: 'Stress' },
    { key: 'focus', label: 'Focus' },
    { key: 'sleepDebt', label: 'Sleep' },
    { key: 'nutritionScore', label: 'Nutrition' },
  ];

  const contributions = useMemo(() => computeContributions(timelineEntries, metric), [timelineEntries, metric]);

  const timelineList = useMemo(() => formatTimeline(timelineEntries), [timelineEntries]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>基地總覽 · {today}</Text>
      {pendingPrestigeReward && (
        <Pressable style={styles.prestigeBanner} accessibilityRole="button" onPress={() => setShowPrestigeModal(true)}>
          <View>
            <Text style={styles.bannerTitle}>等級提升！</Text>
            <Text style={styles.bannerBody}>Lv. {pendingPrestigeReward.level}，新上限已生效。</Text>
          </View>
        </Pressable>
      )}
      <ResourceBar label="Energy" value={r.energy} />
      <ResourceBar label="Stress" value={r.stress} />
      <ResourceBar label="Focus" value={r.focus} />
      <ResourceBar label="Health" value={r.health} />
      <View style={styles.spacerSmall} />
      <ResourceBar label="Sleep Debt" value={r.sleepDebt*5} />
      <ResourceBar label="Nutrition" value={r.nutritionScore*10} />
      <ResourceBar label="Clarity" value={r.clarity*20} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>資源影響熱區</Text>
        <View style={styles.metricToggleRow}>
          {metricOptions.map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setMetric(opt.key)}
              accessibilityRole="button"
              style={[styles.metricButton, metric === opt.key && styles.metricButtonActive]}
            >
              <Text style={[styles.metricButtonText, metric === opt.key && styles.metricButtonTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        {loadingTimeline ? (
          <ActivityIndicator color="#38bdf8" />
        ) : (
          <View style={styles.overlayCard}>
            {contributions.length === 0 ? (
              <Text style={styles.overlayEmpty}>今日尚無顯著變化。</Text>
            ) : contributions.map(item => (
              <View key={item.label} style={styles.contributionRow}>
                <Text style={styles.contributionLabel}>{item.label}</Text>
                <Text style={[styles.contributionValue, item.value >= 0 ? styles.positive : styles.negative]}>
                  {item.value > 0 ? `+${item.value}` : item.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日時間軸</Text>
        {loadingTimeline ? (
          <ActivityIndicator color="#38bdf8" />
        ) : timelineList.length === 0 ? (
          <Text style={styles.overlayEmpty}>暫無紀錄，開始你的一天吧。</Text>
        ) : (
          timelineList.map(item => (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineTimeBlock}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <Text style={styles.timelineKind}>{item.kindLabel}</Text>
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                {item.delta && (
                  <Text style={styles.timelineDelta}>{item.delta}</Text>
                )}
              </View>
            </View>
          ))
        )}
        {!reduceMotion && <View style={styles.timelineHint}><Text style={styles.tip}>提示：長按時間軸條目可做詳細回顧（即將推出）。</Text></View>}
      </View>
      <PrestigeModal
        visible={showPrestigeModal}
        reward={pendingPrestigeReward}
        onClose={() => {
          setShowPrestigeModal(false);
          setPendingPrestigeReward(undefined);
        }}
      />
    </ScrollView>
  );
}

function computeContributions(entries: TimelineEntry[], metric: keyof TimelineDelta) {
  const buckets: Record<string, number> = {};
  for (const entry of entries) {
    const delta = entry.delta?.[metric];
    if (!delta || delta === 0) continue;
    const label = entry.kind === 'action' ? (entry.actionType ?? entry.refId) : entry.refId;
    buckets[label] = (buckets[label] ?? 0) + Math.round(delta);
  }
  return Object.entries(buckets)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3)
    .map(([label, value]) => ({ label, value }));
}

function formatTimeline(entries: TimelineEntry[]) {
  return entries.map(entry => {
    const date = new Date(entry.at);
    const time = isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const kindLabel = entry.kind === 'action' ? '行為' : entry.kind === 'event' ? '事件' : entry.kind === 'buffOn' ? 'Buff +' : 'Buff -';
    const title = entry.kind === 'action'
      ? `執行 ${entry.actionType ?? entry.refId}`
      : entry.kind === 'event'
        ? `事件 ${entry.refId}`
        : `狀態 ${entry.refId}`;
    const deltaText = entry.delta
      ? Object.entries(entry.delta)
          .map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${Math.round(v ?? 0)}`)
          .join('·')
      : undefined;
    return { id: entry.id, time, kindLabel, title, delta: deltaText };
  });
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f1a' },
  content:{ padding:16, paddingBottom:32 },
  title:{ color:'#e5e7eb', fontSize:20, fontWeight:'600' },
  spacerSmall:{ height:12 },
  section:{ marginTop:24 },
  sectionTitle:{ color:'#e2e8f0', fontSize:16, fontWeight:'600', marginBottom:12 },
  tip:{ color:'#9ca3af', lineHeight:20 },
  metricToggleRow:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 },
  metricButton:{ paddingVertical:8, paddingHorizontal:12, borderRadius:999, borderWidth:1, borderColor:'#334155', backgroundColor:'#0f172a' },
  metricButtonActive:{ backgroundColor:'#38bdf8', borderColor:'#38bdf8' },
  metricButtonText:{ color:'#e2e8f0', fontSize:14 },
  metricButtonTextActive:{ color:'#0f172a', fontWeight:'600' },
  overlayCard:{ backgroundColor:'#111827', borderRadius:12, padding:12 },
  overlayEmpty:{ color:'#94a3b8' },
  contributionRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:6 },
  contributionLabel:{ color:'#e2e8f0', fontSize:15, flex:1 },
  contributionValue:{ fontWeight:'700', minWidth:60, textAlign:'right' },
  positive:{ color:'#4ade80' },
  negative:{ color:'#f87171' },
  timelineRow:{ flexDirection:'row', paddingVertical:10, borderBottomWidth:1, borderColor:'#1f2937' },
  timelineTimeBlock:{ width:80, alignItems:'flex-start' },
  timelineTime:{ color:'#38bdf8', fontWeight:'600' },
  timelineKind:{ color:'#94a3b8', fontSize:12 },
  timelineBody:{ flex:1 },
  timelineTitle:{ color:'#e2e8f0', fontSize:15, marginBottom:4 },
  timelineDelta:{ color:'#cbd5f5', fontSize:13 },
  timelineHint:{ marginTop:8 },
  subtitle:{ color:'#e2e8f0', fontSize:16, marginBottom:6 },
  prestigeBanner:{ backgroundColor:'#1d4ed8', borderRadius:12, padding:12, marginBottom:16, borderWidth:1, borderColor:'#3b82f6' },
  bannerTitle:{ color:'#f8fafc', fontWeight:'700', fontSize:16 },
  bannerBody:{ color:'#e0f2fe', marginTop:4 }
});
