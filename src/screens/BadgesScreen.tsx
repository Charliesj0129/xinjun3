import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BadgesScreen(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>成就與科技樹（示意）</Text>
      <Text style={styles.tip}>連 3 天全勤 → Momentum；連 7 天準時作息 → 睡眠加成；Clarity 達 5 → 決策疲勞 -10%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f1a', padding:16 },
  title:{ color:'#e5e7eb', fontSize:20, fontWeight:'600', marginBottom:12 },
  tip:{ color:'#9ca3af' }
});
