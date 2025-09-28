import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '@/screens/HomeScreen';
import ActionsScreen from '@/screens/ActionsScreen';
import RoomsScreen from '@/screens/RoomsScreen';
import RulesScreen from '@/screens/RulesScreen';
import BadgesScreen from '@/screens/BadgesScreen';
import AnalyticsScreen from '@/screens/AnalyticsScreen';
import EndOfDayScreen from '@/screens/EndOfDayScreen';
import RitualsScreen from '@/screens/RitualsScreen';
import BuildsScreen from '@/screens/BuildsScreen';
import JournalScreen from '@/screens/JournalScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

export default function App(){
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('onboarding.completed').then(value => {
      setOnboarded(value === 'done');
      setLoading(false);
    });
  }, []);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('onboarding.completed', 'done');
    setOnboarded(true);
  };

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:'#0b0f1a', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  if (!onboarded) {
    return <OnboardingScreen onFinish={finishOnboarding} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown:false,
        tabBarStyle:{ backgroundColor:'#0b0f1a', borderTopColor:'#111827' },
        tabBarActiveTintColor:'#e5e7eb', tabBarInactiveTintColor:'#6b7280'
      }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '總覽' }} />
        <Tab.Screen name="Actions" component={ActionsScreen} options={{ tabBarLabel: '行動' }} />
        <Tab.Screen name="Journal" component={JournalScreen} options={{ tabBarLabel: '日記' }} />
        <Tab.Screen name="Rituals" component={RitualsScreen} options={{ tabBarLabel: '儀式' }} />
        <Tab.Screen name="Builds" component={BuildsScreen} options={{ tabBarLabel: 'Builds' }} />
        <Tab.Screen name="EndOfDay" component={EndOfDayScreen} options={{ tabBarLabel: '收尾' }} />
        <Tab.Screen name="Rooms" component={RoomsScreen} options={{ tabBarLabel: '房間' }} />
        <Tab.Screen name="Rules" component={RulesScreen} options={{ tabBarLabel: '規則' }} />
        <Tab.Screen name="Badges" component={BadgesScreen} options={{ tabBarLabel: '成就' }} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: '分析' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
