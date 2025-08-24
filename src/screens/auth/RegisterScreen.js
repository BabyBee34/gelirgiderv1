// FinanceFlow - Modern Register Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomButton from '../../components/ui/CustomButton';
import TermsModal from '../../components/ui/TermsModal';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  
  // Input refs
  const firstNameInputRef = useRef(null);
  const lastNameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

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

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: (currentStep / 3) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);



  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.firstName.trim() && formData.lastName.trim();
      case 2:
        return formData.email.trim() && formData.password.length >= 6;
      case 3:
        return formData.password === formData.confirmPassword && formData.agreeToTerms;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleRegister();
      }
    } else {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    if (!validateStep(3)) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun ve şartları kabul edin');
      return;
    }

    setLoading(true);
    
    try {
      const result = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      if (result.success) {
        Alert.alert('Başarılı', 'Hesabınız başarıyla oluşturuldu!', [
          { text: 'Tamam', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Kayıt Hatası', result.error);
      }
    } catch (error) {
      Alert.alert('Hata', 'Kayıt olurken bir hata oluştu');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const toggleTerms = () => {
    setAcceptTerms(!acceptTerms);
  };

  const renderStep1 = () => (
    <>
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
              ref={firstNameInputRef}
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Adınız"
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.directInput}
              autoCapitalize="words"

              returnKeyType="next"
              onSubmitEditing={() => lastNameInputRef.current?.focus()}
            />
          </View>
        </View>

        <View style={[styles.inputContainer, styles.halfInput]}>
          <View style={styles.glassInputWrapper}>
            <TextInput
              ref={lastNameInputRef}
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Soyadınız"
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.directInput}
              autoCapitalize="words"

              returnKeyType="next"
              onSubmitEditing={() => nextStep()}
            />
          </View>
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
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
            ref={emailInputRef}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
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
            ref={passwordInputRef}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="Şifreniz (en az 6 karakter)"
            placeholderTextColor="rgba(255,255,255,0.6)"
            secureTextEntry={!showPassword}
            style={styles.directInput}
            autoCapitalize="none"
            autoCorrect={false}

            returnKeyType="next"
            onSubmitEditing={() => nextStep()}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <MaterialIcons 
              name={showPassword ? "visibility" : "visibility-off"} 
              size={20} 
              color="rgba(255,255,255,0.8)" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
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
            ref={confirmPasswordInputRef}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Şifrenizi tekrar girin"
            placeholderTextColor="rgba(255,255,255,0.6)"
            secureTextEntry={!showConfirmPassword}
            style={styles.directInput}
            autoCapitalize="none"
            autoCorrect={false}

            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <MaterialIcons 
              name={showConfirmPassword ? "visibility" : "visibility-off"} 
              size={20} 
              color="rgba(255,255,255,0.8)" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Terms Agreement */}
      <View style={styles.termsContainer}>
        <TouchableOpacity 
          style={styles.termsCheckbox}
          onPress={() => handleInputChange('agreeToTerms', !formData.agreeToTerms)}
        >
          <View style={[styles.checkbox, formData.agreeToTerms && styles.checkboxChecked]}>
            {formData.agreeToTerms && (
              <MaterialIcons name="check" size={16} color="#ffffff" />
            )}
          </View>
          <Text style={styles.termsText}>
            <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
              <Text style={styles.termsLink}>Kullanım şartları</Text>
            </TouchableOpacity> ve{' '}
            <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
              <Text style={styles.termsLink}>Gizlilik politikası</Text>
            </TouchableOpacity>'nı kabul ediyorum
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
    >
      <LinearGradient 
        colors={['#f093fb', '#f5576c']} 
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

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: progressAnim }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>Adım {currentStep}/3</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <View style={styles.navigationButtons}>
                {currentStep > 1 && (
                  <TouchableOpacity
                    style={styles.prevButton}
                    onPress={prevStep}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>Geri</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={nextStep}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <Text style={styles.buttonText}>Kayıt olunuyor...</Text>
                    ) : (
                      <Text style={styles.buttonText}>
                        {currentStep === 3 ? 'Kayıt Ol' : 'Devam'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.modernFooter}>
              <View style={styles.footerGlass}>
                <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Giriş yapın</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
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

  // New styles for multi-step form
  progressContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  prevButton: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  nextButton: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eyeIcon: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
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
  checkboxChecked: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(255,255,255,0.8)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  footerText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default RegisterScreen;
