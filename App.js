// FinanceFlow - Main App Component
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Keyboard, Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/styles/theme';

export default function App() {
  useEffect(() => {
    // Klavye event listener'ları
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Klavye açıldığında yapılacak işlemler
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Klavye kapandığında yapılacak işlemler
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <AppNavigator />
    </AuthProvider>
  );
}
