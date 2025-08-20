// FinanceFlow - Modern Forgot Password Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomButton from '../../components/ui/CustomButton';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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
    ]).start();
  }, []);

  const handleResetPassword = async () => {
    setLoading(true);
    // TODO: Implement password reset logic
    setTimeout(() => {
      setLoading(false);
      setEmailSent(true);
      // Password reset email sent
    }, 2000);
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (emailSent) {
    return (
      <SafeAreaView style={[globalStyles.safeArea, styles.container]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons 
              name="arrow-back" 
              size={24} 
              color={theme.colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.illustration}>
            <MaterialIcons 
              name="mark-email-read" 
              size={80} 
              color={theme.colors.success} 
            />
          </View>

          <Text style={styles.successTitle}>E-posta Gönderildi!</Text>
          <Text style={styles.successText}>
            Şifre sıfırlama bağlantısını {email} adresine gönderdik.
            E-postanızı kontrol edin ve talimatları takip edin.
          </Text>

          <CustomButton
            title="Giriş Ekranına Dön"
            onPress={handleBackToLogin}
            variant="primary"
            size="large"
            style={styles.button}
          />

          <TouchableOpacity 
            style={styles.resendButton}
            onPress={() => setEmailSent(false)}
          >
            <Text style={styles.resendText}>E-postayı tekrar gönder</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
            <LinearGradient 
        colors={['#4facfe', '#00f2fe']} 
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Background Shapes */}
            <View style={styles.backgroundShapes}>
              <View style={[styles.shape, styles.shape1]} />
              <View style={[styles.shape, styles.shape2]} />
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
                <Text style={styles.logoText}>Şifre Sıfırla</Text>
              </View>
              
              <Text style={styles.welcomeText}>Şifrenizi mi unuttunuz?</Text>
              <Text style={styles.subtitleText}>E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim</Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View 
              style={[
                styles.formSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.inputContainer}>
                <View style={styles.glassInputWrapper}>
                  <MaterialIcons 
                    name="email" 
                    size={22} 
                    color="rgba(255,255,255,0.8)" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-posta adresiniz"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="email-address"
                    style={styles.directInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading || !email.trim()}
                style={[styles.resetButtonContainer, (!email.trim() || loading) && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                  style={styles.resetButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.resetButtonText}>
                    {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <View style={styles.modernFooter}>
              <View style={styles.footerGlass}>
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Şifrenizi hatırladınız mı? </Text>
                  <TouchableOpacity onPress={handleBackToLogin}>
                    <Text style={styles.loginLink}>Giriş yapın</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  gradientBackground: {
    flex: 1,
  },
  
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  safeArea: {
    flex: 1,
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
  
  successTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  
  successText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
  },
  
  button: {
    marginBottom: theme.spacing.lg,
  },
  
  resendButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  
  resendText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  footer: {
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  loginText: {
    ...theme.typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  loginLink: {
    ...theme.typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ForgotPasswordScreen;
