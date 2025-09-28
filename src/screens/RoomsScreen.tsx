import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useStore } from '@/state/store';

export default function RoomsScreen(){
  // Placeholder toggles to represent room bonuses
  const r = useStore(s=>s.resource);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>房間加成（示意）</Text>
      <Row label="臥室遮光" />
      <Row label="臥室溫度 22-26°C" />
      <Row label="臥室整潔" />
      <Row label="書桌清理" />
      <Row label="書桌番茄鐘" />
      <Row label="健身裝備就緒" />
      <Row label="廚房備餐完成" />
      <Text style={styles.tip}>達成越多，睡眠/日記/運動效率越高。</Text>
    </View>
  );
}

function Row({label}:{label:string}){
  const [v,setV] = React.useState(false);
  return (
    <View style={styles.row}><Text style={styles.label}>{label}</Text><Switch value={v} onValueChange={setV}/></View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f1a', padding:16 },
  title:{ color:'#e5e7eb', fontSize:20, fontWeight:'600', marginBottom:12 },
  row:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 },
  label:{ color:'#e5e7eb' },
  tip:{ color:'#9ca3af', marginTop:16 }
});
