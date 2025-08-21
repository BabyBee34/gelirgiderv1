// FinanceFlow - Modern Login Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, KeyboardAvoidingView, Platform, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomButton from '../../components/ui/CustomButton';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('test@financeflow.app');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // Input refs
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifre alanlarını doldurun');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(email.trim(), password, rememberMe);
      
      if (result.success) {
        // Login successful - navigation will be handled by AppNavigator
        console.log('Login successful:', result.user);
      } else {
        Alert.alert('Giriş Hatası', result.error);
      }
    } catch (error) {
      Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
    >
      <LinearGradient 
        colors={['#667eea', '#764ba2']} 
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={styles.scrollView}
          >
            {/* Background Decorations */}
            <View style={styles.backgroundShapes}>
              <View style={[styles.shape, styles.shape1]} />
              <View style={[styles.shape, styles.shape2]} />
              <View style={[styles.shape, styles.shape3]} />
            </View>

            {/* Header Section */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <MaterialIcons 
                    name="account-balance-wallet" 
                    size={40} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.logoText}>FinanceFlow</Text>
              </View>
              
              <Text style={styles.welcomeText}>Tekrar hoş geldiniz!</Text>
              <Text style={styles.subtitleText}>Hesabınıza giriş yapın</Text>
            </Animated.View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.glassInputWrapper}>
                  <MaterialIcons 
                    name="email" 
                    size={22} 
                    color="rgba(255,255,255,0.8)" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={emailInputRef}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-posta adresiniz"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="email-address"
                    style={styles.directInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.glassInputWrapper}>
                  <MaterialIcons 
                    name="lock" 
                    size={22} 
                    color="rgba(255,255,255,0.8)" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={passwordInputRef}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Şifreniz"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry={!showPassword}
                    style={styles.directInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={22} 
                      color="rgba(255,255,255,0.8)" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && (
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Beni hatırla</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Şifremi unuttum</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={styles.loginButtonContainer}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <Text style={styles.loginButtonText}>Giriş yapılıyor...</Text>
                  ) : (
                    <Text style={styles.loginButtonText}>Giriş Yap</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.modernFooter}>
                <View style={styles.footerGlass}>
                  <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>Hesabınız yok mu? </Text>
                    <TouchableOpacity onPress={handleRegister}>
                      <Text style={styles.registerLink}>Kayıt olun</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  gradientBackground: {
    flex: 1,
  },
  
  safeArea: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
    paddingBottom: 100,
  },
  
  backgroundShapes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  shape: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
  },
  
  shape1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
    borderRadius: 100,
  },
  
  shape2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -75,
    borderRadius: 75,
  },
  
  shape3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    right: 30,
    borderRadius: 50,
  },
  
  header: {
    alignItems: 'center',
    paddingTop: height * 0.06,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  logoText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
  },
  
  welcomeText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  
  formSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
    // Klavye açıldığında daha iyi görünüm için
    minHeight: 400,
  },
  
  formContainer: {
    flex: 1,
    marginTop: theme.spacing.lg,
  },
  
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  
  glassInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(20px)',
  },
  
  inputIcon: {
    marginRight: theme.spacing.md,
  },
  
  directInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: theme.spacing.lg,
    fontWeight: '500',
  },
  
  eyeIcon: {
    padding: theme.spacing.xs,
  },
  
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.xxl,
    paddingVertical: theme.spacing.sm,
  },
  
  forgotPasswordText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  loginButtonContainer: {
    marginBottom: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  loginButtonGradient: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loginButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  modernFooter: {
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  
  footerGlass: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)',
    alignItems: 'center',
  },
  
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  registerText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  registerLink: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  rememberMeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default LoginScreen;
