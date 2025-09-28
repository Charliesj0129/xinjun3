import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

const slides = [
  {
    title: '歡迎進入基地',
    body: '每天照顧能量、壓力、專注與健康，讓你不再被追著跑。',
  },
  {
    title: '四大模組',
    body: '睡眠、運動、飲食、心智建構你的日常核心。完成行動會影響日結資源。',
  },
  {
    title: '每日結算',
    body: '晚上一次結算，整理 Buff 與指標，隔天從更好的狀態出發。',
  },
  {
    title: '儀式與天賦',
    body: '透過儀式打造流程、透過 Prestige 解鎖 Keystone，讓你的風格越來越鮮明。',
  }
];

interface Props {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.tag}>Onboarding</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.button}
          onPress={() => {
            if (isLast) onFinish();
            else setIndex(i => i + 1);
          }}
        >
          <Text style={styles.buttonText}>{isLast ? '開始體驗' : '下一步'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a', padding: 24, paddingBottom: 36, justifyContent: 'space-between' },
  content: { flexGrow: 1, justifyContent: 'center' },
  tag: { color: '#38bdf8', fontWeight: '600', marginBottom: 12 },
  title: { color: '#f8fafc', fontSize: 26, fontWeight: '700', marginBottom: 16 },
  body: { color: '#cbd5f5', fontSize: 16, lineHeight: 24 },
  footer: { },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1e293b' },
  dotActive: { backgroundColor: '#38bdf8' },
  button: { backgroundColor: '#38bdf8', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#0f172a', fontWeight: '700' },
});
