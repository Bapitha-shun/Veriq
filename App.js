import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LiveCaseProvider } from './src/context/LiveCaseContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LiveCaseProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </LiveCaseProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
