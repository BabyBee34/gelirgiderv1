// FinanceFlow - Main App Navigator
import React from 'react';
// NavigationContainer App.js'de kullanılıyor
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, ActivityIndicator, Animated } from 'react-native';

// Import screens
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/main/HomeScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import CardsScreen from '../screens/main/CardsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ScanScreen from '../screens/main/ScanScreen';
import GoldCurrencyScreen from '../screens/main/GoldCurrencyScreen';
import BudgetScreen from '../screens/main/BudgetScreen';

// Import context
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
        animationEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animationEnabled: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Transactions':
              iconName = 'receipt';
              break;
            case 'Scan':
              iconName = 'camera-alt';
              break;
            case 'Analytics':
              iconName = 'analytics';
              break;
            case 'Cards':
              iconName = 'credit-card';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          // Scan button için özel görüntü
          if (route.name === 'Scan') {
            return (
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: focused ? theme.colors.primary : theme.colors.secondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}>
                <MaterialIcons name={iconName} size={28} color="#FFFFFF" />
              </View>
            );
          }

          return (
            <View style={{
              transform: [{ scale: focused ? 1.2 : 1 }],
              opacity: focused ? 1 : 0.7,
            }}>
              <MaterialIcons name={iconName} size={size} color={color} />
            </View>
          );
        },
        tabBarStyle: {
          backgroundColor: theme.colors.cards,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingVertical: 8,
          height: 80,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarLabel: 'Ana Sayfa' }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{ tabBarLabel: 'İşlemler' }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen}
        options={{ 
          tabBarLabel: 'Tarama',
          tabBarIconStyle: { marginBottom: 0 }
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ tabBarLabel: 'Analiz' }}
      />
      <Tab.Screen 
        name="Cards" 
        component={CardsScreen}
        options={{ tabBarLabel: 'Kartlar' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

// Loading Screen Component
const LoadingScreen = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: theme.colors.background 
  }}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();

  console.log('Navigation State:', { isAuthenticated, isLoading, hasCompletedOnboarding });

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
        animationEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 300,
            },
          },
        },
      }}
    >
      {!hasCompletedOnboarding ? (
        // Onboarding Flow
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{
            gestureEnabled: false,
          }}
        />
      ) : !isAuthenticated ? (
        // Auth Flow - AuthStack component'ini doğrudan kullan
        <Stack.Screen 
          name="AuthStack" 
          component={AuthStack}
          options={{
            gestureEnabled: false,
          }}
        />
      ) : (
        // Main App Flow
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="GoldCurrency" component={GoldCurrencyScreen} />
          <Stack.Screen name="Budget" component={BudgetScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
