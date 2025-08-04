import { Tabs } from "expo-router";
import { Clipboard, Package, Settings, User } from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1a3a6a",
        headerShown: true,
        headerStyle: { backgroundColor: '#1a3a6a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color }) => <Package color={color} />,
        }}
      />
      <Tabs.Screen
        name="import-export"
        options={{
          title: "Import/Export",
          tabBarIcon: ({ color }) => <Clipboard color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings color={color} />,
        }}
      />
    </Tabs>
  );
}