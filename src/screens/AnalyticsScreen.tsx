import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { listResourcesInRange } from '@/db/db';
import { useStore } from '@/state/store';
import type { Resource, DifficultyMode } from '@/types';

type PerfectEntry = { date: string; perfect: boolean };

function toISO(date: string) {
  return ${date}T00:00:00+08:00;
}

function addDays(date: string, delta: number) {
  const base = new Date(toISO(date));
  base.setDate(base.getDate() + delta);
  return base.toISOString().slice(0, 10);
}

const METRICS: Array<keyof Pick<Resource, 'sleepDebt'|'stress'|'focus'|'nutritionScore'>> = ['sleepDebt', 'stress', 'focus', 'nutritionScore'];

export default function AnalyticsScreen() {
  const today = useStore(s => s.today);
  const perfectHistory = useStore(s => s.perfectDayHistory);
  const difficultyMode = useStore(s => s.difficultyMode);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const start = addDays(today, -6);
      const data = await listResourcesInRange(start, today);
      if (!mounted) return;
      setResources(data);
      setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [today]);

  const suggestion = useMemo(() => buildSuggestion(resources, perfectHistory), [resources, perfectHistory]);
  const perfectCount = useMemo(() => perfectHistory.filter(h => withinDays(today, h.date, 7) && h.perfect).length, [perfectHistory, today]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>週報概況</Text>
      <Text style={styles.subtitle}>模式：{modeLabel(difficultyMode)}</Text>

      {loading ? (
        <ActivityIndicator color="#38bdf8" />
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>資源趨勢</Text>
          {METRICS.map(metric => {
            const trend = metricTrend(resources, metric);
            return (
              <View key={metric} style={styles.trendRow}>
                <Text style={styles.metricLabel}>{metricLabel(metric)}</Text>
                <Text style={[styles.trendValue, trend.delta >= 0 ? styles.up : styles.down]}>
                  {trend.delta > 0 ? + : trend.delta}
                </Text>
                <Text style={styles.trendDetail}>{trend.summary}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>成就摘要</Text>
        <Text style={styles.body}>本週 Perfect Day：{perfectCount}</Text>
        <Text style={styles.body}>近 7 日完成率：{rateLabel(perfectHistory, today)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>本週建議</Text>
        <Text style={styles.tip}>{suggestion}</Text>
      </View>
    </ScrollView>
  );
}

function withinDays(ref: string, date: string, days: number) {
  const diff = (Date.parse(toISO(ref)) - Date.parse(date)) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff < days;
}

function metricTrend(resources: Resource[], metric: keyof Resource) {
  if (!resources.length) return { delta: 0, summary: '暫無資料' };
  const first = resources[0][metric] as number;
  const last = resources[resources.length - 1][metric] as number;
  const delta = Math.round(last - first);
  return {
    delta,
    summary: 首日  → 今日 ,
  };
}

function metricLabel(metric: keyof Resource) {
  switch (metric) {
    case 'sleepDebt': return '睡眠負債';
    case 'stress': return '壓力';
    case 'focus': return '專注';
    case 'nutritionScore': return '營養';
    default: return metric;
  }
}

function rateLabel(history: PerfectEntry[], today: string) {
  const recent = history.filter(entry => withinDays(today, entry.date, 7));
  if (!recent.length) return '0%';
  const rate = recent.filter(r => r.perfect).length / recent.length;
  return ${Math.round(rate * 100)}%;
}

function modeLabel(mode: DifficultyMode) {
  if (mode === 'ease') return 'Ease（調整中）';
  if (mode === 'elite') return 'Elite（挑戰週）';
  return 'Normal';
}

function buildSuggestion(resources: Resource[], history: PerfectEntry[]) {
  if (resources.length < 2) {
    return '持續記錄今日行為，我們會為你提供更貼近的建議。';
  }
  const latest = resources[resources.length - 1];
  const prev = resources[resources.length - 2];
  if (latest.sleepDebt > 3 && latest.sleepDebt >= prev.sleepDebt) {
    return '今晚 30 分鐘無手機，讓入睡更順。';
  }
  if (latest.stress > 60) {
    return '午休 20 分鐘 + 伸展 3 分鐘，下午會更清醒。';
  }
  const recent = history.filter(entry => (Date.now() - Date.parse(entry.date)) / (1000 * 60 * 60 * 24) < 7);
  const rate = recent.length ? recent.filter(r => r.perfect).length / recent.length : 0;
  if (latest.focus >= 80 && rate >= 0.6) {
    return '明天安排 90 分鐘深度任務，衝一波最高手感。';
  }
  return '保持節奏已經很棒，挑一個小習慣再強化一次。';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { color: '#e5e7eb', fontSize: 20, fontWeight: '600', marginBottom: 6 },
  subtitle: { color: '#94a3b8', marginBottom: 16 },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metricLabel: { color: '#e2e8f0', width: 96 },
  trendValue: { width: 60, textAlign: 'right', fontWeight: '700' },
  trendDetail: { color: '#cbd5f5', flex: 1, marginLeft: 12 },
  tip: { color: '#e0f2fe', lineHeight: 20 },
  body: { color: '#cbd5f5', marginBottom: 4 },
  up: { color: '#4ade80' },
  down: { color: '#f87171' },
});
