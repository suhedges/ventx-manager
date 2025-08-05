import '@/utils/polyfills';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import { WarehouseProvider } from "@/context/WarehouseContext";
import { SyncHookProvider } from "@/context/SyncHook";
import { StatusBar } from "expo-status-bar";
import { initializeSecureToken } from "@/utils/secureToken";


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerStyle: { backgroundColor: '#1a3a6a' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ presentation: 'modal', title: 'Barcode Scanner' }} />
      <Stack.Screen name="item/[id]" options={{ title: 'Item Details' }} />
      <Stack.Screen name="conflicts" options={{ title: 'Resolve Conflicts' }} />
      <Stack.Screen name="import" options={{ title: 'Import Items' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize secure GitHub token
        await initializeSecureToken();
        console.log('App initialization completed');
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SyncHookProvider>
        <AuthProvider>
          <WarehouseProvider>
            <SyncProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style="light" />
                <RootLayoutNav />
              </GestureHandlerRootView>
            </SyncProvider>
          </WarehouseProvider>
        </AuthProvider>
      </SyncHookProvider>
    </QueryClientProvider>
  );
}