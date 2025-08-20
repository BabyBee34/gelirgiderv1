// FinanceFlow - Modern Register Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomButton from '../../components/ui/CustomButton';
import TermsModal from '../../components/ui/TermsModal';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    setLoading(true);
    // TODO: Implement real registration logic
    setTimeout(() => {
      setLoading(false);
      // Registration successful
      // Navigate to main app after successful registration
      navigation.replace('Main');
    }, 2000);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const toggleTerms = () => {
    setAcceptTerms(!acceptTerms);
  };

  return (
    <View style={styles.container}>
            <LinearGradient 
        colors={['#f093fb', '#f5576c']} 
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
                    name="person-add" 
                    size={40} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text style={styles.logoText}>Hesap Oluştur</Text>
              </View>
              
              <Text style={styles.welcomeText}>FinanceFlow ailesine katılın!</Text>
              <Text style={styles.subtitleText}>Bilgilerinizi girin</Text>
            </Animated.View>

            {/* Form Section */}
            <ScrollView 
              style={styles.formSection}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Name Fields Row */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <View style={styles.glassInputWrapper}>
                    <MaterialIcons 
                      name="person" 
                      size={20} 
                      color="rgba(255,255,255,0.8)" 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      value={formData.firstName}
                      onChangeText={(value) => handleInputChange('firstName', value)}
                      placeholder="Adınız"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={styles.directInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={[styles.inputContainer, styles.halfInput]}>
                  <View style={styles.glassInputWrapper}>
                    <TextInput
                      value={formData.lastName}
                      onChangeText={(value) => handleInputChange('lastName', value)}
                      placeholder="Soyadınız"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={styles.directInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <View style={styles.glassInputWrapper}>
                  <MaterialIcons 
                    name="email" 
                    size={20} 
                    color="rgba(255,255,255,0.8)" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="E-posta adresiniz"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="email-address"
                    style={styles.directInput}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <View style={styles.glassInputWrapper}>
                  <MaterialIcons 
                    name="lock" 
                    size={20} 
                    color="rgba(255,255,255,0.8)" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Güçlü bir şifre oluşturun"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry={true}
                    style={styles.directInput}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <View style={styles.glassInputWrapper}>
                  <MaterialIcons 
                    name="lock" 
                    size={20} 
                    color="rgba(255,255,255,0.8)" 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Şifrenizi tekrar girin"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry={true}
                    style={styles.directInput}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Terms */}
              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={toggleTerms}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
                  {acceptTerms && (
                    <MaterialIcons 
                      name="check" 
                      size={16} 
                      color="#FFFFFF" 
                    />
                  )}
                </View>
                <Text style={styles.termsText}>
                  <Text 
                    style={styles.termsLink}
                    onPress={() => setTermsModalVisible(true)}
                  >
                    Kullanım Şartları
                  </Text> ve{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => setPrivacyModalVisible(true)}
                  >
                    Gizlilik Politikası
                  </Text>'nı kabul ediyorum
                </Text>
              </TouchableOpacity>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading || !acceptTerms}
                style={[styles.registerButtonContainer, (!acceptTerms || loading) && styles.buttonDisabled]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                  style={styles.registerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modernFooter}>
              <View style={styles.footerGlass}>
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                  <TouchableOpacity onPress={handleLogin}>
                    <Text style={styles.loginLink}>Giriş yapın</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
      
      {/* Terms & Privacy Modals */}
      <TermsModal 
        visible={termsModalVisible} 
        onClose={() => setTermsModalVisible(false)}
        type="terms"
      />
      <TermsModal 
        visible={privacyModalVisible} 
        onClose={() => setPrivacyModalVisible(false)}
        type="privacy"
      />
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
  
  shape3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    right: 30,
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
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  
  formSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  
  halfInput: {
    width: '48%',
    marginBottom: 0,
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
  
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xs,
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 6,
    marginRight: theme.spacing.md,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  checkboxActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.8)',
  },
  
  termsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
    lineHeight: 18,
  },
  
  termsLink: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  registerButtonContainer: {
    marginBottom: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  registerButtonGradient: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  registerButtonText: {
    fontSize: 18,
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
  
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  loginText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  loginLink: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default RegisterScreen;
