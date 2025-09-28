import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function StudyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>番茄學習板</Text>
      <Text style={styles.body}>透過番茄時鐘安排 25 分鐘深度專注，加上 5 分鐘休息。</Text>
      <Text style={styles.hint}>行動可回到面板執行「番茄 25+5」，並於日結算中看到影響。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a', padding: 16 },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  body: { color: '#cbd5f5', lineHeight: 20 },
  hint: { color: '#8b5cf6', marginTop: 12 }
});
