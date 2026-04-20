import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import HomeScreen from './screens/HomeScreen';
import BookingScreen from './screens/BookingScreen';
import ConfirmScreen from './screens/ConfirmScreen';
import AdminScreen from './screens/AdminScreen';
import StatsScreen from './screens/StatsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a1a' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}
