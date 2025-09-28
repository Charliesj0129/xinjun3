import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useStore } from "@/state/store";
import { ActionLog } from "@/types";

export default function JournalScreen() {
  const resource = useStore(s => s.resource);
  const actions = useStore(s => s.actions);
  const addAction = useStore(s => s.addAction);
  const [text, setText] = useState("");

  const journalEntries = useMemo(() => actions.filter(a => a.type === 'journal' && a.date === resource.date), [actions, resource.date]);

  async function handleSave() {
    if (!text.trim()) return;
    const entry: ActionLog = {
      id: `${Date.now()}`,
      date: resource.date,
      type: 'journal',
      payload: { text: text.trim() },
    };
    await addAction(entry);
    setText("");
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>日記輸入</Text>
        <Text style={styles.subtitle}>寫下一段今日的想法，僅留在本機。</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="寫下你今天的觀察或感受..."
          multiline
          placeholderTextColor="#64748b"
          accessibilityLabel="日記內容"
        />
        <TouchableOpacity style={[styles.button, !text.trim() && styles.buttonDisabled]} onPress={handleSave} disabled={!text.trim()}>
          <Text style={styles.buttonText}>寫入日記並計入行動</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日已寫</Text>
          {journalEntries.length === 0 ? (
            <Text style={styles.empty}>尚未寫日記。</Text>
          ) : journalEntries.map(entry => (
            <View key={entry.id} style={styles.entryCard}>
              <Text style={styles.entryTime}>{formatTime(entry.id)}</Text>
              <Text style={styles.entryText}>{entry.payload?.text ?? ''}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function formatTime(id: string) {
  const ts = Number(id);
  if (!Number.isFinite(ts)) return '--:--';
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f1a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { color: '#f8fafc', fontSize: 22, fontWeight: '700' },
  subtitle: { color: '#cbd5f5', marginTop: 4, marginBottom: 16 },
  input: { backgroundColor: '#111827', color: '#f1f5f9', minHeight: 160, borderRadius: 12, padding: 16, textAlignVertical: 'top' },
  button: { marginTop: 16, backgroundColor: '#38bdf8', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#1e293b' },
  buttonText: { color: '#0f172a', fontWeight: '700' },
  section: { marginTop: 24 },
  sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#94a3b8' },
  entryCard: { backgroundColor: '#111827', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#1f2937' },
  entryTime: { color: '#38bdf8', marginBottom: 6 },
  entryText: { color: '#e2e8f0', lineHeight: 20 },
});
