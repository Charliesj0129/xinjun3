import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function ResourceBar({label, value}:{label:string; value:number}){
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill,{width: `${Math.min(100, Math.max(0,value))}%`}]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:{ marginVertical:6 },
  row:{ flexDirection:'row', justifyContent:'space-between' },
  label:{ color:'#c9d1d9', fontSize:14 },
  value:{ color:'#8b949e' },
  track:{ height:10, backgroundColor:'#1f2937', borderRadius:8, overflow:'hidden' },
  fill:{ height:'100%', backgroundColor:'#8ab4f8' }
});
