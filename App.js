// FinanceFlow - Main App Component
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/styles/theme';

export default function App() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <AppNavigator />
    </>
  );
}
