import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet, Platform } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { TimesheetScreen } from '../screens/TimesheetScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { colors, fontSize } from '../theme';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', icon: '🏠', component: HomeScreen },
  { name: 'Schedule', icon: '📅', component: ScheduleScreen },
  { name: 'Timesheet', icon: '⏱', component: TimesheetScreen },
  { name: 'Search', icon: '🔍', component: SearchScreen },
  { name: 'More', icon: '☰', component: MoreScreen },
] as const;

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.greenDark,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
                {tab.icon}
              </Text>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
});
