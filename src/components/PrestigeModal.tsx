import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PrestigeReward } from '@/types';

interface Props {
  visible: boolean;
  reward?: PrestigeReward;
  onClose: () => void;
}

export function PrestigeModal({ visible, reward, onClose }: Props) {
  if (!reward) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>等級提升！</Text>
          <Text style={styles.subtitle}>做得太好了！你把上限拉高了。</Text>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>新等級</Text>
            <Text style={styles.body}>Lv. {reward.level}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>資源上限</Text>
            <Text style={styles.body}>Energy {reward.caps.energy}、Focus {reward.caps.focus}</Text>
            <Text style={styles.body}>Stress {reward.caps.stress}、Health {reward.caps.health}</Text>
          </View>
          {reward.keystoneName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>新 Keystone</Text>
              <Text style={styles.body}>{reward.keystoneName}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.button} onPress={onClose} accessibilityLabel="關閉">
            <Text style={styles.buttonText}>明天再戰</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '82%',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#cbd5f5',
    marginTop: 8,
    marginBottom: 12,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    color: '#38bdf8',
    fontWeight: '600',
    marginBottom: 4,
  },
  body: {
    color: '#e2e8f0',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
