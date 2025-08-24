// FinanceFlow - Modern Forgot Password Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, KeyboardAvoidingView, Platform, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomButton from '../../components/ui/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { validation } from '../../utils/validation';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState({ email: false });
  
  // Input ref
  const emailInputRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

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



  // Validation functions
  const validateEmail = (value) => {
    const error = validation.email(value);
    setEmailError(error || '');
    return !error;
  };

  const validateForm = () => {
    return validateEmail(email);
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await resetPassword(email.trim());
      
      if (result.success) {
        setEmailSent(true);
        
        // Success animation
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
        Alert.alert('Başarılı', result.message);
      } else {
        Alert.alert('Hata', result.error);
      }
    } catch (error) {
      Alert.alert('Hata', 'Şifre sıfırlama işlemi başarısız oldu');
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (touched.email) {
      validateEmail(value);
    }
  };

  const handleInputBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      validateEmail(email);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setEmail('');
    setEmailError('');
    setTouched({ email: false });
    emailInputRef.current?.focus();
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Background Shapes */}
            <View style={styles.backgroundShapes}>
              <View style={[styles.shape, styles.shape1]} />
              <View style={[styles.shape, styles.shape2]} />
              <View style={[styles.shape, styles.shape3]} />
            </View>

            {/* Success Content */}
            <Animated.View 
              style={[
                styles.successContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Animated.View 
                style={[
                  styles.successIcon,
                  {
                    transform: [{ scale: successAnim }]
                  }
                ]}
              >
                <MaterialIcons 
                  name="check-circle" 
                  size={80} 
                  color="#48BB78" 
                />
              </Animated.View>
              
              <Text style={styles.successTitle}>E-posta Gönderildi!</Text>
              <Text style={styles.successMessage}>
                Şifre sıfırlama bağlantısı {email} adresine gönderildi. 
                Lütfen e-postanızı kontrol edin ve bağlantıya tıklayın.
              </Text>
              
              <View style={styles.successActions}>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendEmail}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>Tekrar Gönder</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackToLogin}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>Giriş'e Dön</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

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
            {/* Background Shapes */}
            <View style={styles.backgroundShapes}>
              <View style={[styles.shape, styles.shape1]} />
              <View style={[styles.shape, styles.shape2]} />
              <View style={[styles.shape, styles.shape3]} />
            </View>

            {/* Header */}
            <Animated.View 
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons 
                  name="arrow-back" 
                  size={24} 
                  color="rgba(255,255,255,0.9)" 
                />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <MaterialIcons 
                    name="lock-reset" 
                    size={40} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.logoText}>Şifremi Unuttum</Text>
              </View>
              
              <Text style={styles.welcomeText}>Endişelenmeyin!</Text>
              <Text style={styles.subtitleText}>Şifrenizi sıfırlayalım</Text>
            </Animated.View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.instructionText}>
                E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
              </Text>

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
                    onChangeText={handleEmailChange}
                    placeholder="E-posta adresiniz"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="email-address"
                    style={[styles.directInput, emailError && styles.inputError]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                    onBlur={() => handleInputBlur('email')}
                  />
                  {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading}
                style={styles.resetButtonContainer}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                  style={styles.resetButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <Text style={styles.resetButtonText}>Gönderiliyor...</Text>
                  ) : (
                    <Text style={styles.resetButtonText}>Şifre Sıfırlama Bağlantısı Gönder</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.modernFooter}>
                <View style={styles.footerGlass}>
                  <Text style={styles.footerText}>Şifrenizi hatırladınız mı? </Text>
                  <TouchableOpacity onPress={handleBackToLogin}>
                    <Text style={styles.footerLink}>Giriş yapın</Text>
                  </TouchableOpacity>
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
    top: 200,
    left: width * 0.7,
    borderRadius: 50,
  },
  
  header: {
    alignItems: 'center',
    paddingTop: height * 0.05,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  
  backButton: {
    position: 'absolute',
    top: height * 0.05,
    left: theme.spacing.xl,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
  },
  
  welcomeText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: height * 0.1,
  },
  
  scrollContent: {
    flexGrow: 1,
  },

  instructionText: {
    ...theme.typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  inputContainer: {
    marginBottom: theme.spacing.xxl,
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

  inputError: {
    borderColor: '#F56565',
    borderWidth: 1,
  },

  errorText: {
    color: '#F56565',
    fontSize: 12,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.lg,
    fontWeight: '500',
  },
  
  resetButtonContainer: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  resetButtonGradient: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  resetButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  buttonDisabled: {
    opacity: 0.6,
  },
  
  modernFooter: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  
  footerGlass: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  
  illustration: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.small,
  },
  
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },

  successIcon: {
    marginBottom: theme.spacing.md,
  },

  successTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },

  successMessage: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },

  successActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: theme.spacing.lg,
  },

  resendButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },

  buttonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },

  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  footer: {
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  
  footerGlass: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  
  footerText: {
    ...theme.typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  footerLink: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ForgotPasswordScreen;
