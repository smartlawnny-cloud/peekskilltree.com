import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { EmployeeProfileScreen } from '../screens/EmployeeProfileScreen';
import { PayrollReviewScreen } from '../screens/PayrollReviewScreen';
import { VoiceToQuoteScreen } from '../screens/VoiceToQuoteScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen
        name="EmployeeProfile"
        component={EmployeeProfileScreen}
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PayrollReview"
        component={PayrollReviewScreen}
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="VoiceToQuote"
        component={VoiceToQuoteScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
