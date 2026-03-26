import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import MapScreen from '../screens/MapScreen';
import ReportScreen from '../screens/ReportScreen';
import HistoryScreen from '../screens/HistoryScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TABS = [
  { name: 'Map', component: MapScreen, icon: '🗺️' },
  { name: 'History', component: HistoryScreen, icon: '📋' },
  { name: 'Emergency', component: EmergencyScreen, icon: '🆘' },
  { name: 'Profile', component: ProfileScreen, icon: '👤' },
];

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#16213e', borderTopColor: '#0f3460', height: 60 },
        tabBarActiveTintColor: '#f5a623',
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#f5a623',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {TABS.map(({ name, component, icon }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
            ),
            title: name === 'Emergency' ? '🆘 Emergency' : name,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Report"
          component={ReportScreen}
          options={{
            headerShown: true,
            title: 'Report Issue',
            headerStyle: { backgroundColor: '#1a1a2e' },
            headerTintColor: '#f5a623',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
