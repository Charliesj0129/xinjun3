import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useStore } from "@/state/store";
import { settleDay } from "@/logic/calc";
import { usePluginStore } from "@/state/pluginStore";
import { PluginRegistry } from "@/plugins/registry";

function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn}>
      <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function ActionsScreen() {
  const r = useStore(s => s.resource);
  const setResource = useStore(s => s.setResource);
  const addAction = useStore(s => s.addAction);
  const enabledIds = usePluginStore(s => s.enabledIds);
  const [mins, setMins] = useState('20');

  const pluginActions = useMemo(() => {
    return enabledIds
      .map(id => PluginRegistry.get(id))
      .filter(Boolean)
      .flatMap(plugin => plugin?.actions ?? []);
  }, [enabledIds]);

  async function logExercise(intensity: 'low'|'medium'|'high') {
    await addAction({ id: String(Date.now()), date: r.date, type:'exercise',
      payload:{ mins: Number(mins)||20, intensity } });
  }
  async function logMeal(tags:string[]){
    await addAction({ id: String(Date.now()), date: r.date, type:'meal',
      payload: Object.fromEntries(tags.map(k=>[k,true])) });
  }
  async function logJournal(){
    await addAction({ id: String(Date.now()), date: r.date, type:'journal', payload:{} });
  }
  async function logSleep(opts:{hours:number; before0030:boolean; before0830:boolean}){
    await addAction({ id: String(Date.now()), date: r.date, type:'sleep', payload:opts });
  }
  function simulateSettle(){
    setResource(settleDay(r, useStore.getState().actions));
  }

  async function runPluginAction(actionId: string) {
    const action = pluginActions.find(a => a.id === actionId);
    if (!action) return;
    await action.run({
      resource: r,
      date: r.date,
      applyAction: async (log) => {
        if (!log.date) log.date = r.date;
        await addAction(log);
      }
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>行動面板</Text>
      <Text style={styles.label}>運動分鐘</Text>
      <TextInput value={mins} onChangeText={setMins} keyboardType='numeric' style={styles.input} placeholder='20' placeholderTextColor='#6b7280' />
      <View style={styles.row}>
        <Button title='低強度' onPress={()=>logExercise('low')} />
        <Button title='中強度' onPress={()=>logExercise('medium')} />
        <Button title='高強度' onPress={()=>logExercise('high')} />
      </View>
      <Text style={styles.label}>飲食四象限</Text>
      <View style={styles.row}>
        <Button title='蛋白+纖維' onPress={()=>logMeal(['protein','fiber'])} />
        <Button title='良碳+水分' onPress={()=>logMeal(['carb','water'])} />
      </View>
      <View style={styles.row}>
        <Button title='寫日記' onPress={logJournal} />
        <Button title='睡 8h' onPress={()=>logSleep({hours:8,before0030:true,before0830:true})} />
      </View>
      {pluginActions.length > 0 && (
        <View style={styles.pluginSection}>
          <Text style={styles.label}>插件行動</Text>
          <View style={styles.row}>
            {pluginActions.map(action => (
              <Button key={action.id} title={action.label} onPress={() => runPluginAction(action.id)} />
            ))}
          </View>
        </View>
      )}
      <View style={{height:10}} />
      <Button title='結算今日（MVP 模擬）' onPress={simulateSettle} />
      <Text style={styles.hint}>* 結算邏輯於 src/logic/calc.ts，可依你的規則調整。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#0b0f1a', padding:16 },
  title:{ color:'#e5e7eb', fontSize:20, fontWeight:'600', marginBottom:12 },
  label:{ color:'#e5e7eb', marginTop:12 },
  row:{ flexDirection:'row', gap:10, marginVertical:8, flexWrap:'wrap' },
  btn:{ backgroundColor:'#1f2937', paddingVertical:10, paddingHorizontal:14, borderRadius:10 },
  btnText:{ color:'#e5e7eb' },
  input:{ borderWidth:1, borderColor:'#374151', color:'#e5e7eb', padding:10, borderRadius:8, marginTop:6 },
  hint:{ color:'#9ca3af', marginTop:12 },
  pluginSection:{ marginTop:8 },
});
