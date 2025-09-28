import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useStore } from '@/state/store';
import { ResourceBar } from '@/components/ResourceBar';
import { initDb, upsertResource } from '@/db/db';

export default function HomeScreen(){
  const r = useStore(s=>s.resource);
  const today = useStore(s=>s.today);
  const loadDay = useStore(s=>s.loadDay);

  useEffect(()=>{ initDb(); loadDay(today); },[]);

  useEffect(()=>{ upsertResource(r); },[r]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{padding:16}}>
      <Text style={styles.title}>基地總覽 · {today}</Text>
      <ResourceBar label="Energy" value={r.energy} />
      <ResourceBar label="Stress" value={r.stress} />
      <ResourceBar label="Focus" value={r.focus} />
      <ResourceBar label="Health" value={r.health} />
      <View style={{height:12}}/>
      <ResourceBar label="SleepDebt" value={r.sleepDebt*5} />
      <ResourceBar label="Nutrition" value={r.nutritionScore*10} />
      <ResourceBar label="Clarity" value={r.clarity*20} />
      <View style={{height:24}}/>
      <Text style={styles.subtitle}>今日提示</Text>
      <Text style={styles.tip}>
        睡債≥6 會限制運動強度。Nutrition≤4 會提高渴食與壓力上升率。
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f1a' },
  title:{ color:'#e5e7eb', fontSize:20, fontWeight:'600' },
  subtitle:{ color:'#e5e7eb', fontSize:16, marginBottom:6 },
  tip:{ color:'#9ca3af', lineHeight:20 }
});
