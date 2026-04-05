import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { EmployeeProfileScreen } from '../screens/EmployeeProfileScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PayrollReviewScreen } from '../screens/PayrollReviewScreen';
import { PayrollConfirmScreen } from '../screens/PayrollConfirmScreen';
import { QuoteBuilderScreen } from '../screens/QuoteBuilderScreen';
import { QuoteDetailScreen } from '../screens/QuoteDetailScreen';
import { InvoiceBuilderScreen } from '../screens/InvoiceBuilderScreen';
import { InvoiceDetailScreen } from '../screens/InvoiceDetailScreen';
import { ClientPortalScreen } from '../screens/ClientPortalScreen';
import { VoiceToQuoteScreen } from '../screens/VoiceToQuoteScreen';
import { AssistantScreen } from '../screens/AssistantScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Main tabs */}
      <Stack.Screen name="Main" component={BottomTabs} />

      {/* Stack screens (push navigation) */}
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="EmployeeProfile" component={EmployeeProfileScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PayrollReview" component={PayrollReviewScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="PayrollConfirm" component={PayrollConfirmScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="QuoteBuilder" component={QuoteBuilderScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="QuoteDetail" component={QuoteDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="InvoiceBuilder" component={InvoiceBuilderScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ClientPortal" component={ClientPortalScreen} options={{ animation: 'slide_from_right' }} />

      {/* Modal screens (slide up) */}
      <Stack.Screen name="VoiceToQuote" component={VoiceToQuoteScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Assistant" component={AssistantScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}
