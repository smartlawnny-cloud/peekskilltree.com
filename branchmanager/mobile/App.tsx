import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { useAuthState, AuthContext } from './src/hooks/useAuth';
import { registerForPushNotifications, addResponseListener } from './src/api/notifications';
import { colors } from './src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60 * 1000,
    },
  },
});

function AppContent() {
  const auth = useAuthState();

  // Register for push notifications once logged in
  useEffect(() => {
    if (auth.user) {
      registerForPushNotifications().catch(() => {});
    }
  }, [auth.user]);

  // Handle notification taps
  useEffect(() => {
    const sub = addResponseListener(response => {
      const data = response.notification.request.content.data;
      // Navigation based on notification type handled here
      console.log('[Notification tap]', data);
    });
    return () => sub.remove();
  }, []);

  if (auth.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.greenDark} />
      </View>
    );
  }

  if (!auth.user) {
    return <LoginScreen onLogin={auth.login} onDemoLogin={auth.demoLogin} />;
  }

  return (
    <AuthContext.Provider value={auth}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
