import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RulesScreen(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>自動化規則（MVP）</Text>
      <Text style={styles.tip}>未來在此新增 If–Then 規則，例如：SleepDebt≥6 → 限制運動強度（低）。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f1a', padding:16 },
  title:{ color:'#e5e7eb', fontSize:20, fontWeight:'600', marginBottom:12 },
  tip:{ color:'#9ca3af' }
});
