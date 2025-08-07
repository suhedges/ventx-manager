import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { SyncProvider } from '@/context/SyncContext';
import { SyncHookProvider } from '@/context/SyncHook';
import { WarehouseProvider } from '@/context/WarehouseContext';

LogBox.ignoreLogs(['Possible Unhandled Promise Rejection']);

export default function App() {
  return (
    <AuthProvider>
      <SyncHookProvider>
        <WarehouseProvider>
          <SyncProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="item/[id]" options={{ title: 'Item Details' }} />
              <Stack.Screen name="scanner" options={{ title: 'Scanner', presentation: 'modal' }} />
              <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
              <Stack.Screen name="conflicts" options={{ title: 'Conflict Resolution' }} />
              <Stack.Screen name="import" options={{ title: 'Import Data' }} />
            </Stack>
          </SyncProvider>
        </WarehouseProvider>
      </SyncHookProvider>
    </AuthProvider>
  );
}
