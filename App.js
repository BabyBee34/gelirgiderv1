// FinanceFlow - Main App Component with Professional Services Integration
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, Text, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { FeedbackProvider } from './src/context/FeedbackContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { IntegrationProvider } from './src/context/IntegrationContext';
import AppNavigator from './src/navigation/AppNavigator';
import serviceManager from './src/services/serviceManager';
import { theme } from './src/styles/theme';

// Professional Services Wrapper
const ServicesWrapper = ({ children }) => {
  const [servicesReady, setServicesReady] = useState(false);
  const [initializationError, setInitializationError] = useState(null);

  useEffect(() => {
    initializeProfessionalServices();
    setupAppStateHandling();

    return () => {
      // Cleanup on app unmount
      serviceManager.shutdown();
    };
  }, []);

  const initializeProfessionalServices = async () => {
    try {
      console.log('🚀 Initializing FinanceFlow Professional Services...');
      
      const success = await serviceManager.initializeServices();
      
      if (success) {
        setServicesReady(true);
        console.log('✅ Professional Services Ready');
        
        // Optional: Run system health check after initialization
        setTimeout(async () => {
          const healthStatus = await serviceManager.getHealthStatus();
          console.log('🏥 System Health:', healthStatus);
        }, 3000);
      } else {
        throw new Error('Service initialization failed');
      }
    } catch (error) {
      console.error('❌ Professional Services Initialization Failed:', error);
      setInitializationError(error.message);
      
      // Try to restart failed services
      setTimeout(async () => {
        console.log('🔄 Attempting to restart failed services...');
        const restartSuccess = await serviceManager.restartFailedServices();
        if (restartSuccess) {
          setServicesReady(true);
          setInitializationError(null);
          console.log('✅ Services successfully restarted');
        }
      }, 5000);
    }
  };

  const setupAppStateHandling = () => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'background') {
        // App going to background
        const monitoringService = serviceManager.getService('monitoring');
        if (monitoringService) {
          await monitoringService.trackEvent('app_background', {
            timestamp: Date.now()
          });
        }
      } else if (nextAppState === 'active') {
        // App coming to foreground
        const monitoringService = serviceManager.getService('monitoring');
        if (monitoringService) {
          await monitoringService.trackEvent('app_foreground', {
            timestamp: Date.now()
          });
        }
        
        // Check service health when app becomes active
        const healthStatus = await serviceManager.getHealthStatus();
        if (healthStatus.overall !== 'healthy') {
          console.warn('⚠️ Services need attention:', healthStatus);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  };

  // Show loading screen while services initialize
  if (!servicesReady && !initializationError) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: theme.colors.textPrimary,
          textAlign: 'center'
        }}>
          Professional Services Starting...
        </Text>
        <Text style={{
          marginTop: 8,
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: 'center'
        }}>
          Security • Notifications • Monitoring • Testing
        </Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (initializationError) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: 20
      }}>
        <Text style={{
          fontSize: 18,
          color: theme.colors.error,
          textAlign: 'center',
          marginBottom: 8
        }}>
          Service Initialization Error
        </Text>
        <Text style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: 16
        }}>
          {initializationError}
        </Text>
        <Text style={{
          fontSize: 12,
          color: theme.colors.textSecondary,
          textAlign: 'center'
        }}>
          Retrying automatically...
        </Text>
      </View>
    );
  }

  return children;
};

export default function App() {
  return (
    <ServicesWrapper>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <FeedbackProvider>
              <IntegrationProvider>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <AppNavigator />
                </NavigationContainer>
              </IntegrationProvider>
            </FeedbackProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ServicesWrapper>
  );
}
