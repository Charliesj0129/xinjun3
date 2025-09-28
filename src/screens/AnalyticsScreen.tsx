import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AnalyticsScreen(){
  return (
    <View style={styles.container}>
      <Text style={styles.title}>分析（MVP 佔位）</Text>
      <Text style={styles.tip}>之後顯示四模組達標率、崩潰事件觸發率、規則觸發熱區與週/月趨勢圖。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f1a', padding:16 },
  title:{ color:'#e5e7eb', fontSize:20, fontWeight:'600', marginBottom:12 },
  tip:{ color:'#9ca3af' }
});
