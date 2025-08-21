// FinanceFlow - Main App Navigator
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Transactions':
              iconName = 'receipt';
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

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.cards,
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingVertical: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
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

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
          animationEnabled: true,
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
          // Auth Flow
          <Stack.Screen name="Auth" component={AuthStack} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
