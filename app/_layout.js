import { Stack } from 'expo-router';
import React from 'react';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { theme } from '../src/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: theme.colors.textOnPrimary,
              headerTitleStyle: {
                fontWeight: '600',
              },
              headerBackTitleVisible: false,
              animation: 'slide_from_right',
              animationDuration: 300,
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{ 
                title: 'IoT Kit Rental',
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="admin" 
              options={{ 
                title: 'Admin Portal',
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="leader" 
              options={{ 
                title: 'Leader Portal',
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="lecturer" 
              options={{ 
                title: 'Lecturer Portal',
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="member" 
              options={{ 
                title: 'Member Portal',
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="academic" 
              options={{ 
                title: 'Academic Portal',
                presentation: 'card',
              }} 
            />
            <Stack.Screen 
              name="rental-request" 
              options={{ 
                title: 'Rental Request',
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="admin-rental-approval" 
              options={{ 
                title: 'Rental Approval',
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="admin-refund-approval" 
              options={{ 
                title: 'Refund Approval',
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="top-up" 
              options={{ 
                title: 'Top Up',
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="penalty-payment" 
              options={{ 
                title: 'Penalty Payment',
                presentation: 'modal',
              }} 
            />
            <Stack.Screen 
              name="demo" 
              options={{ 
                title: 'UI Demo',
                presentation: 'modal',
              }} 
            />
          </Stack>
          <FlashMessage position="top" />
          <Toast />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
