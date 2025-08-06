import React from 'react';
import { LogBox } from 'react-native';
import RootLayout from './app/_layout';

// Ignore specific warnings if needed
LogBox.ignoreLogs(['Possible Unhandled Promise Rejection']);

export default function App() {
  return <RootLayout />;
}
