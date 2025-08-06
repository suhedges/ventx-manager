import '@/utils/polyfills';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        
        // Skip secure token initialization to prevent bundling issues
        console.log('Skipping secure token initialization');
        console.log('App initialization completed successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
        // Still set as initialized to allow app to continue
        setIsInitialized(true);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.error('Failed to hide splash screen:', splashError);
        }
      }
    };
    
    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a3a6a' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Initializing app...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SyncHookProvider>
          <AuthProvider>
            <WarehouseProvider>
              <SyncProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <StatusBar style="light" />
                  {initError && (
                    <View style={{ backgroundColor: '#ff6b6b', padding: 8 }}>
                      <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
                        Init Warning: {initError}
                      </Text>
                    </View>
                  )}
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </SyncProvider>
            </WarehouseProvider>
          </AuthProvider>
        </SyncHookProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}