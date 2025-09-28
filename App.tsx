import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/HomeScreen';
import ActionsScreen from '@/screens/ActionsScreen';
import RoomsScreen from '@/screens/RoomsScreen';
import RulesScreen from '@/screens/RulesScreen';
import BadgesScreen from '@/screens/BadgesScreen';
import AnalyticsScreen from '@/screens/AnalyticsScreen';
import EndOfDayScreen from '@/screens/EndOfDayScreen';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function App(){
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown:false,
        tabBarStyle:{ backgroundColor:'#0b0f1a', borderTopColor:'#111827' },
        tabBarActiveTintColor:'#e5e7eb', tabBarInactiveTintColor:'#6b7280'
      }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '總覽' }} />
        <Tab.Screen name="Actions" component={ActionsScreen} options={{ tabBarLabel: '行動' }} />
        <Tab.Screen name="EndOfDay" component={EndOfDayScreen} options={{ tabBarLabel: '收尾' }} />
        <Tab.Screen name="Rooms" component={RoomsScreen} options={{ tabBarLabel: '房間' }} />
        <Tab.Screen name="Rules" component={RulesScreen} options={{ tabBarLabel: '規則' }} />
        <Tab.Screen name="Badges" component={BadgesScreen} options={{ tabBarLabel: '成就' }} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: '分析' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
