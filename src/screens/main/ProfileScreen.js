// FinanceFlow - Modern Profile Screen
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Switch, 
  Alert,
  Image,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import transactionService from '../../services/transactionService';
import accountService from '../../services/accountService';
import goalService from '../../services/goalService';
import { formatCurrency } from '../../utils/formatters';
import { dataExport } from '../../utils/dataExport';
import { notificationSystem } from '../../utils/notificationSystem';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useToastContext } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeSettingsComponent from '../../components/ui/ThemeSettingsComponent';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, userProfile, updateProfile, signOut } = useAuth();
  const { reportBug, requestFeature, suggestImprovement, giveFeedback } = useFeedback();
  const { showSuccess, showInfo } = useToastContext();
  const { theme: currentTheme } = useTheme();
  
  // Logout fonksiyonu
  const logout = async () => {
    try {
      setLoading(true);
      const result = await signOut();
      
      if (result.success) {
        showSuccess('Başarıyla çıkış yapıldı');
        // Navigation'ı Auth stack'e yönlendir
        navigation.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        });
      } else {
        Alert.alert('Hata', result.error?.message || 'Çıkış yapılırken bir hata oluştu');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // State variables for real user data
  const [userStats, setUserStats] = useState({
    transactionsCount: 0,
    accountsCount: 0,
    goalsCount: 0,
    totalBalance: 0,
    totalAssets: 0
  });
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  
  // State variables
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(true);
  
  // Advanced notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    budgetAlerts: {
      enabled: true,
      threshold: 80, // percentage
      frequency: 'daily'
    },
    transactionAlerts: {
      enabled: true,
      largeTransactions: true,
      threshold: 1000, // amount
      realTime: true
    },
    weeklyReports: {
      enabled: true,
      day: 'sunday',
      time: '09:00'
    },
    monthlyReports: {
      enabled: true,
      day: 1, // day of month
      time: '09:00'
    },
    goalProgress: {
      enabled: true,
      milestones: true,
      completion: true
    },
    securityAlerts: {
      enabled: true,
      loginAlerts: true,
      suspiciousActivity: true
    },
    reminderSettings: {
      billReminders: true,
      recurringTransactions: true,
      savingGoals: true,
      advanceDays: 3
    },
    marketingPromotions: false,
    appUpdates: true,
    quietHours: {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00'
    }
  });
  const [showAccountSummary, setShowAccountSummary] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Türkçe');
  const [selectedCurrency, setSelectedCurrency] = useState('TRY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerHeight = useRef(new Animated.Value(200)).current;

  // Profile data from real user
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: null
  });

  // Load real user data
  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('📋 Loading profile data for user:', user.id);
      
      // Load transactions, accounts, and goals in parallel
      const [transactionsResult, accountsResult, goalsResult] = await Promise.all([
        transactionService.getTransactions(user.id),
        accountService.getAccounts(user.id),
        goalService.getGoals(user.id)
      ]);
      
      // Update transactions
      if (transactionsResult.success) {
        setTransactions(transactionsResult.data || []);
      }
      
      // Update accounts
      if (accountsResult.success) {
        setAccounts(accountsResult.data || []);
      }
      
      // Update goals
      if (goalsResult.success) {
        setGoals(goalsResult.data || []);
      }
      
      // Calculate user stats
      const stats = {
        transactionsCount: transactionsResult.data?.length || 0,
        accountsCount: accountsResult.data?.length || 0,
        goalsCount: goalsResult.data?.length || 0,
        totalBalance: calculateTotalBalance(accountsResult.data || []),
        totalAssets: calculateTotalAssets(accountsResult.data || [])
      };
      
      setUserStats(stats);
      console.log('✅ Profile data loaded:', stats);
      
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
      setError('Profil verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate total balance from accounts
  const calculateTotalBalance = (accountsData) => {
    if (!Array.isArray(accountsData)) return 0;
    return accountsData.reduce((total, account) => {
      return total + (parseFloat(account.balance) || 0);
    }, 0);
  };
  
  // Calculate total assets (savings and investments)
  const calculateTotalAssets = (accountsData) => {
    if (!Array.isArray(accountsData)) return 0;
    return accountsData.reduce((total, account) => {
      if (account?.type === 'savings' || account?.type === 'investment') {
        return total + (parseFloat(account.balance) || 0);
      }
      return total;
    }, 0);
  };

  useEffect(() => {
    // Initialize profile data from user context
    if (user) {
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı';
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ');
      
      setProfileData({
        firstName: firstName || 'Kullanıcı',
        lastName: lastName || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        avatar: user.user_metadata?.avatar || null
      });
      
      // Load user data
      loadUserData();
    }
    
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerHeight, {
        toValue: 220,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [user]);

  const getTotalBalance = () => {
    if (!userStats?.totalBalance) return 0;
    return userStats.totalBalance;
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => await logout(),
        },
      ]
    );
  };

  const getTotalAssets = () => {
    if (!userStats?.totalAssets) return 0;
    return userStats.totalAssets;
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesap Silme',
      'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Hesap silindi', 'Hesabınız başarıyla silindi.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'AuthStack' }],
            });
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı oturum açmamış');
        return;
      }

      const updates = {
        full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.email,
        phone: profileData.phone
      };

      const result = await updateProfile(updates);
      
      if (result.success) {
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi!');
        setIsEditingProfile(false);
      } else {
        Alert.alert('Hata', result.error || 'Profil güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    }
  };

  const handleBiometricToggle = () => {
    if (!biometricEnabled) {
      Alert.alert(
        'Biyometrik Giriş',
        'Parmak izi veya yüz tanıma ile giriş yapmak istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Etkinleştir', 
            onPress: () => {
              setBiometricEnabled(true);
              Alert.alert('Başarılı', 'Biyometrik giriş etkinleştirildi!');
            }
          }
        ]
      );
    } else {
      setBiometricEnabled(false);
      Alert.alert('Bilgi', 'Biyometrik giriş devre dışı bırakıldı.');
    }
  };

  const handleBackupData = () => {
    setShowBackupModal(false);
    Alert.alert(
      'Yedekleme Başladı',
      'Verileriniz yedekleniyor...',
      [{ text: 'Tamam' }]
    );
    
    // Simulate backup process
    setTimeout(() => {
      dataExport.backupData();
      Alert.alert('Başarılı', 'Verileriniz başarıyla yedeklendi!');
    }, 2000);
  };

  const handleExportData = (type) => {
    setShowBackupModal(false);
    let message = '';
    
    switch(type) {
      case 'transactions':
        dataExport.exportTransactionsCSV();
        message = 'İşlemler CSV formatında dışa aktarıldı!';
        break;
      case 'financial':
        dataExport.exportFinancialReport();
        message = 'Mali rapor PDF formatında dışa aktarıldı!';
        break;
      case 'all':
        dataExport.exportAllData();
        message = 'Tüm veriler dışa aktarıldı!';
        break;
    }
    
    Alert.alert('Başarılı', message);
  };

  const handleNotificationTest = () => {
    notificationSystem.showDailySummary();
    Alert.alert('Test Bildirimi', 'Test bildirimi gönderildi!');
  };

  const renderProfileHeader = () => {
    // Use real user stats data
    const transactionsCount = userStats?.transactionsCount || 0;
    const goalsCount = userStats?.goalsCount || 0;
    const accountsCount = userStats?.accountsCount || 0;

    return (
      <Animated.View style={[styles.profileHeader, { height: headerHeight }]}>
        <LinearGradient
          colors={[currentTheme.colors.primary, currentTheme.colors.secondary, '#667eea']}
          style={styles.profileGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            {profileData.avatar ? (
              <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => setIsEditingProfile(true)}
            >
              <MaterialIcons name="edit" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profileData.firstName} {profileData.lastName}
            </Text>
            <Text style={styles.profileEmail}>{profileData.email}</Text>
            <Text style={styles.profilePhone}>{profileData.phone}</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{transactionsCount}</Text>
              <Text style={styles.statLabel}>İşlem</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{goalsCount}</Text>
              <Text style={styles.statLabel}>Hedef</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{accountsCount}</Text>
              <Text style={styles.statLabel}>Hesap</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderFinancialOverview = () => (
    <Animated.View style={[styles.financialOverview, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.sectionTitle}>Finansal Özet</Text>
      
      <View style={styles.financialCards}>
        <TouchableOpacity 
          style={styles.financialCard}
          onPress={() => navigation.navigate('Home')}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="account-balance" size={24} color="#fff" />
              <Text style={styles.cardTitle}>Toplam Bakiye</Text>
            </View>
            <Text style={styles.cardAmount}>{formatCurrency(getTotalBalance())}</Text>
            <Text style={styles.cardSubtitle}>Tüm hesaplarınız</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.financialCard}
          onPress={() => navigation.navigate('Analytics')}
        >
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="trending-up" size={24} color="#fff" />
              <Text style={styles.cardTitle}>Varlıklarım</Text>
            </View>
            <Text style={styles.cardAmount}>{formatCurrency(getTotalAssets())}</Text>
            <Text style={styles.cardSubtitle}>Tasarruf & Yatırım</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderMenuItem = (icon, title, subtitle, onPress, rightElement = null, iconColor = theme.colors.primary, badge = null) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: `${iconColor}15` }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {rightElement || <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />}
    </TouchableOpacity>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderEditProfileModal = () => (
    <Modal
      visible={isEditingProfile}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsEditingProfile(false)}>
            <Text style={styles.modalCancelButton}>İptal</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Profili Düzenle</Text>
          <TouchableOpacity onPress={handleSaveProfile}>
            <Text style={styles.modalSaveButton}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ad</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.firstName}
              onChangeText={(text) => setProfileData({...profileData, firstName: text})}
              placeholder="Adınız"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Soyad</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.lastName}
              onChangeText={(text) => setProfileData({...profileData, lastName: text})}
              placeholder="Soyadınız"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.email}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              placeholder="E-posta adresiniz"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.phone}
              onChangeText={(text) => setProfileData({...profileData, phone: text})}
              placeholder="Telefon numaranız"
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderBackupModal = () => (
    <Modal
      visible={showBackupModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalCardTitle}>Veri Yönetimi</Text>
          
          <TouchableOpacity style={styles.modalButton} onPress={handleBackupData}>
            <MaterialIcons name="backup" size={24} color="#4ECDC4" />
            <Text style={styles.modalButtonText}>Veri Yedekleme</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => handleExportData('transactions')}>
            <MaterialIcons name="file-download" size={24} color="#FFE66D" />
            <Text style={styles.modalButtonText}>İşlemleri Dışa Aktar (CSV)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => handleExportData('financial')}>
            <MaterialIcons name="assessment" size={24} color="#4ECDC4" />
            <Text style={styles.modalButtonText}>Mali Rapor (PDF)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => handleExportData('all')}>
            <MaterialIcons name="archive" size={24} color="#9F7AEA" />
            <Text style={styles.modalButtonText}>Tüm Veriler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowBackupModal(false)}
          >
            <Text style={styles.cancelButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSecurityModal = () => (
    <Modal
      visible={showSecurityModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalCardTitle}>Güvenlik Ayarları</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Biyometrik Giriş</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#E2E8F0', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            Alert.alert('Şifre Değiştir', 'Şifre değiştirme özelliği yakında eklenecek!');
          }}>
            <MaterialIcons name="lock" size={24} color="#F56565" />
            <Text style={styles.modalButtonText}>Şifre Değiştir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            Alert.alert('İki Faktörlü Doğrulama', '2FA özelliği yakında eklenecek!');
          }}>
            <MaterialIcons name="security" size={24} color="#48BB78" />
            <Text style={styles.modalButtonText}>İki Faktörlü Doğrulama</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowSecurityModal(false)}
          >
            <Text style={styles.cancelButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderLanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalCardTitle}>Dil Seçimi</Text>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            setSelectedLanguage('Türkçe');
            setShowLanguageModal(false);
            Alert.alert('Başarılı', 'Dil Türkçe olarak ayarlandı!');
          }}>
            <MaterialIcons name="language" size={24} color="#4ECDC4" />
            <Text style={styles.modalButtonText}>Türkçe</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            setSelectedLanguage('English');
            setShowLanguageModal(false);
            Alert.alert('Başarılı', 'Language set to English!');
          }}>
            <MaterialIcons name="language" size={24} color="#4ECDC4" />
            <Text style={styles.modalButtonText}>English</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowLanguageModal(false)}
          >
            <Text style={styles.cancelButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCurrencyModal = () => (
    <Modal
      visible={showCurrencyModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalCardTitle}>Para Birimi Seçimi</Text>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            setSelectedCurrency('TRY');
            setShowCurrencyModal(false);
            Alert.alert('Başarılı', 'Para birimi TRY olarak ayarlandı!');
          }}>
            <MaterialIcons name="attach-money" size={24} color="#48BB78" />
            <Text style={styles.modalButtonText}>TRY (Türk Lirası)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            setSelectedCurrency('USD');
            setShowCurrencyModal(false);
            Alert.alert('Başarılı', 'Currency set to USD!');
          }}>
            <MaterialIcons name="attach-money" size={24} color="#48BB78" />
            <Text style={styles.modalButtonText}>USD (US Dollar)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.modalButton} onPress={() => {
            setSelectedCurrency('EUR');
            setShowCurrencyModal(false);
            Alert.alert('Başarılı', 'Currency set to EUR!');
          }}>
            <MaterialIcons name="attach-money" size={24} color="#48BB78" />
            <Text style={styles.modalButtonText}>EUR (Euro)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowCurrencyModal(false)}
          >
            <Text style={styles.cancelButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const updateNotificationSetting = (category, setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' 
        ? { ...prev[category], [setting]: value }
        : value
    }));
  };

  const renderNotificationSection = (title, icon, children) => (
    <View style={styles.notificationSection}>
      <View style={styles.notificationSectionHeader}>
        <MaterialIcons name={icon} size={20} color={currentTheme.colors.primary} />
        <Text style={styles.notificationSectionTitle}>{title}</Text>
      </View>
      <View style={styles.notificationSectionContent}>
        {children}
      </View>
    </View>
  );

  const renderNotificationToggle = (label, description, value, onValueChange, testable = false) => (
    <View style={styles.notificationToggleContainer}>
      <View style={styles.notificationToggleInfo}>
        <Text style={styles.notificationToggleLabel}>{label}</Text>
        {description && (
          <Text style={styles.notificationToggleDescription}>{description}</Text>
        )}
      </View>
      <View style={styles.notificationToggleControls}>
        {testable && (
          <TouchableOpacity 
            style={styles.testNotificationButton}
            onPress={() => {
              Alert.alert('Test Bildirimi', `${label} için test bildirimi gönderildi!`);
            }}
          >
            <MaterialIcons name="send" size={16} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        )}
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E2E8F0', true: currentTheme.colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  const renderTimeSelector = (label, value, onValueChange) => (
    <TouchableOpacity 
      style={styles.timeSelectorButton}
      onPress={() => {
        // For demo purposes, show alert. In real app, would show time picker
        Alert.alert('Zaman Seçici', `${label} için zaman seçici açılacak. Mevcut: ${value}`);
      }}
    >
      <Text style={styles.timeSelectorLabel}>{label}</Text>
      <View style={styles.timeSelectorValue}>
        <Text style={styles.timeSelectorValueText}>{value}</Text>
        <MaterialIcons name="access-time" size={16} color={currentTheme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderNotificationsModal = () => (
    <Modal
      visible={showNotificationsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowNotificationsModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowNotificationsModal(false)} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={currentTheme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: currentTheme.colors.textPrimary }]}>Bildirim Ayarları</Text>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert('Ayarlar Kaydedildi', 'Bildirim tercihleriniz başarıyla güncellendi!');
              setShowNotificationsModal(false);
            }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.notificationModalContent} showsVerticalScrollIndicator={false}>
          {/* Master Toggle */}
          <View style={styles.masterToggleContainer}>
            <LinearGradient
              colors={[currentTheme.colors.primary + '20', currentTheme.colors.secondary + '20']}
              style={styles.masterToggleGradient}
            >
              <View style={styles.masterToggleContent}>
                <View style={styles.masterToggleInfo}>
                  <MaterialIcons name="notifications" size={24} color={currentTheme.colors.primary} />
                  <View style={styles.masterToggleTextContainer}>
                    <Text style={styles.masterToggleTitle}>Bildirimleri Etkinleştir</Text>
                    <Text style={styles.masterToggleSubtitle}>Tüm bildirim türlerini kontrol eder</Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.pushNotifications}
                  onValueChange={(value) => updateNotificationSetting('pushNotifications', null, value)}
                  trackColor={{ false: '#E2E8F0', true: currentTheme.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </LinearGradient>
          </View>

          {/* Notification Types */}
          {renderNotificationSection('Bildirim Türleri', 'campaign', [
            <View key="notification-types">
              {renderNotificationToggle(
                'E-posta Bildirimleri',
                'Önemli güncellemeler e-posta ile gönderilir',
                notificationSettings.emailNotifications,
                (value) => updateNotificationSetting('emailNotifications', null, value)
              )}
              {renderNotificationToggle(
                'SMS Bildirimleri',
                'Acil durumlar için SMS gönderilir',
                notificationSettings.smsNotifications,
                (value) => updateNotificationSetting('smsNotifications', null, value)
              )}
            </View>
          ])}

          {/* Budget Alerts */}
          {renderNotificationSection('Bütçe Uyarıları', 'account-balance-wallet', [
            <View key="budget-alerts">
              {renderNotificationToggle(
                'Bütçe Aşım Uyarıları',
                `Bütçenizin %${notificationSettings.budgetAlerts.threshold}'ini aştığınızda uyarı alın`,
                notificationSettings.budgetAlerts.enabled,
                (value) => updateNotificationSetting('budgetAlerts', 'enabled', value),
                true
              )}
              
              <TouchableOpacity 
                style={styles.thresholdSelector}
                onPress={() => {
                  Alert.alert(
                    'Uyarı Eşiği',
                    'Bütçe uyarı eşiğini seçin',
                    [
                      { text: '%50', onPress: () => updateNotificationSetting('budgetAlerts', 'threshold', 50) },
                      { text: '%75', onPress: () => updateNotificationSetting('budgetAlerts', 'threshold', 75) },
                      { text: '%80', onPress: () => updateNotificationSetting('budgetAlerts', 'threshold', 80) },
                      { text: '%90', onPress: () => updateNotificationSetting('budgetAlerts', 'threshold', 90) },
                      { text: 'İptal', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.thresholdSelectorLabel}>Uyarı Eşiği</Text>
                <View style={styles.thresholdSelectorValue}>
                  <Text style={styles.thresholdSelectorValueText}>%{notificationSettings.budgetAlerts.threshold}</Text>
                  <MaterialIcons name="tune" size={16} color={currentTheme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          ])}

          {/* Transaction Alerts */}
          {renderNotificationSection('İşlem Uyarıları', 'receipt', [
            <View key="transaction-alerts">
              {renderNotificationToggle(
                'Gerçek Zamanlı İşlem Bildirimleri',
                'Her işlemde anında bildirim alın',
                notificationSettings.transactionAlerts.realTime,
                (value) => updateNotificationSetting('transactionAlerts', 'realTime', value),
                true
              )}
              {renderNotificationToggle(
                'Büyük İşlem Uyarıları',
                `${formatCurrency(notificationSettings.transactionAlerts.threshold)} üzeri işlemler için uyarı`,
                notificationSettings.transactionAlerts.largeTransactions,
                (value) => updateNotificationSetting('transactionAlerts', 'largeTransactions', value)
              )}
              
              <TouchableOpacity 
                style={styles.thresholdSelector}
                onPress={() => {
                  Alert.alert(
                    'Büyük İşlem Eşiği',
                    'Büyük işlem uyarı tutarını seçin',
                    [
                      { text: '₺500', onPress: () => updateNotificationSetting('transactionAlerts', 'threshold', 500) },
                      { text: '₺1.000', onPress: () => updateNotificationSetting('transactionAlerts', 'threshold', 1000) },
                      { text: '₺2.500', onPress: () => updateNotificationSetting('transactionAlerts', 'threshold', 2500) },
                      { text: '₺5.000', onPress: () => updateNotificationSetting('transactionAlerts', 'threshold', 5000) },
                      { text: 'İptal', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.thresholdSelectorLabel}>Büyük İşlem Eşiği</Text>
                <View style={styles.thresholdSelectorValue}>
                  <Text style={styles.thresholdSelectorValueText}>{formatCurrency(notificationSettings.transactionAlerts.threshold)}</Text>
                  <MaterialIcons name="tune" size={16} color={currentTheme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          ])}

          {/* Periodic Reports */}
          {renderNotificationSection('Periyodik Raporlar', 'assessment', [
            <View key="periodic-reports">
              {renderNotificationToggle(
                'Haftalık Rapor',
                `Her ${notificationSettings.weeklyReports.day === 'sunday' ? 'Pazar' : 'Pazartesi'} saat ${notificationSettings.weeklyReports.time}`,
                notificationSettings.weeklyReports.enabled,
                (value) => updateNotificationSetting('weeklyReports', 'enabled', value)
              )}
              
              {renderTimeSelector(
                'Haftalık Rapor Zamanı',
                notificationSettings.weeklyReports.time,
                (value) => updateNotificationSetting('weeklyReports', 'time', value)
              )}
              
              {renderNotificationToggle(
                'Aylık Rapor',
                `Her ayın ${notificationSettings.monthlyReports.day}. günü saat ${notificationSettings.monthlyReports.time}`,
                notificationSettings.monthlyReports.enabled,
                (value) => updateNotificationSetting('monthlyReports', 'enabled', value)
              )}
              
              {renderTimeSelector(
                'Aylık Rapor Zamanı',
                notificationSettings.monthlyReports.time,
                (value) => updateNotificationSetting('monthlyReports', 'time', value)
              )}
            </View>
          ])}

          {/* Goal Progress */}
          {renderNotificationSection('Hedef İlerlemesi', 'flag', [
            <View key="goal-progress">
              {renderNotificationToggle(
                'Hedef Kilometre Taşları',
                'Hedeflerinizin %25, %50, %75 tamamlandığında bildirim',
                notificationSettings.goalProgress.milestones,
                (value) => updateNotificationSetting('goalProgress', 'milestones', value)
              )}
              {renderNotificationToggle(
                'Hedef Tamamlanması',
                'Hedefleriniz tamamlandığında kutlama bildirimi',
                notificationSettings.goalProgress.completion,
                (value) => updateNotificationSetting('goalProgress', 'completion', value),
                true
              )}
            </View>
          ])}

          {/* Security Alerts */}
          {renderNotificationSection('Güvenlik Uyarıları', 'security', [
            <View key="security-alerts">
              {renderNotificationToggle(
                'Giriş Bildirimleri',
                'Hesabınıza her girişte bildirim alın',
                notificationSettings.securityAlerts.loginAlerts,
                (value) => updateNotificationSetting('securityAlerts', 'loginAlerts', value)
              )}
              {renderNotificationToggle(
                'Şüpheli Aktivite',
                'Olağandışı hesap aktivitesi tespit edildiğinde uyarı',
                notificationSettings.securityAlerts.suspiciousActivity,
                (value) => updateNotificationSetting('securityAlerts', 'suspiciousActivity', value)
              )}
            </View>
          ])}

          {/* Reminders */}
          {renderNotificationSection('Hatırlatmalar', 'schedule', [
            <View key="reminders">
              {renderNotificationToggle(
                'Fatura Hatırlatmaları',
                `Son ödeme tarihinden ${notificationSettings.reminderSettings.advanceDays} gün önce hatırlatma`,
                notificationSettings.reminderSettings.billReminders,
                (value) => updateNotificationSetting('reminderSettings', 'billReminders', value)
              )}
              {renderNotificationToggle(
                'Tekrarlayan İşlem Hatırlatmaları',
                'Düzenli ödemeleriniz için hatırlatma',
                notificationSettings.reminderSettings.recurringTransactions,
                (value) => updateNotificationSetting('reminderSettings', 'recurringTransactions', value)
              )}
              {renderNotificationToggle(
                'Tasarruf Hedefi Hatırlatmaları',
                'Hedeflerinize katkı yapmayı unutmayın',
                notificationSettings.reminderSettings.savingGoals,
                (value) => updateNotificationSetting('reminderSettings', 'savingGoals', value)
              )}
            </View>
          ])}

          {/* Quiet Hours */}
          {renderNotificationSection('Sessiz Saatler', 'do-not-disturb', [
            <View key="quiet-hours">
              {renderNotificationToggle(
                'Sessiz Saatleri Etkinleştir',
                `${notificationSettings.quietHours.startTime} - ${notificationSettings.quietHours.endTime} arası bildirim yok`,
                notificationSettings.quietHours.enabled,
                (value) => updateNotificationSetting('quietHours', 'enabled', value)
              )}
              
              <View style={styles.quietHoursContainer}>
                {renderTimeSelector(
                  'Başlangıç Saati',
                  notificationSettings.quietHours.startTime,
                  (value) => updateNotificationSetting('quietHours', 'startTime', value)
                )}
                {renderTimeSelector(
                  'Bitiş Saati',
                  notificationSettings.quietHours.endTime,
                  (value) => updateNotificationSetting('quietHours', 'endTime', value)
                )}
              </View>
            </View>
          ])}

          {/* Additional Settings */}
          {renderNotificationSection('Diğer', 'settings', [
            <View key="other-settings">
              {renderNotificationToggle(
                'Pazarlama ve Promosyonlar',
                'Özel teklifler ve yeni özellik duyuruları',
                notificationSettings.marketingPromotions,
                (value) => updateNotificationSetting('marketingPromotions', null, value)
              )}
              {renderNotificationToggle(
                'Uygulama Güncellemeleri',
                'Yeni sürüm ve özellik bildirimleri',
                notificationSettings.appUpdates,
                (value) => updateNotificationSetting('appUpdates', null, value)
              )}
            </View>
          ])}

          {/* Test All Notifications */}
          <View style={styles.testNotificationsContainer}>
            <TouchableOpacity 
              style={styles.testAllButton}
              onPress={() => {
                Alert.alert(
                  'Test Bildirimleri Gönderildi',
                  'Etkin olan tüm bildirim türleri için test bildirimleri gönderildi. Bildirimleri göremiyorsanız cihaz ayarlarınızı kontrol edin.',
                  [{ text: 'Tamam' }]
                );
              }}
            >
              <MaterialIcons name="send" size={20} color="#fff" />
              <Text style={styles.testAllButtonText}>Tüm Bildirimleri Test Et</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notificationModalBottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Profil bilgileri yükleniyor...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={64} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Hata Oluştu</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setError(null);
              // TODO: Implement retry logic
            }}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Header */}
        {!loading && !error && renderProfileHeader()}

        {/* Financial Overview */}
        {!loading && !error && renderFinancialOverview()}

        {/* Account Section */}
        {renderSection('Hesap & Güvenlik', [
          <View key="account-personal">
            {renderMenuItem(
              'person', 
              'Kişisel Bilgiler', 
              'Ad, soyad ve iletişim bilgileri',
              () => setIsEditingProfile(true),
              null,
              '#6C63FF'
            )}
          </View>,
          <View key="account-security">
            {renderMenuItem(
              'security', 
              'Güvenlik Ayarları', 
              'Şifre, biyometrik giriş ve güvenlik',
              () => setShowSecurityModal(true),
              null,
              '#F56565'
            )}
          </View>,
          <View key="account-verification">
            {renderMenuItem(
              'verified-user', 
              'Kimlik Doğrulama', 
              'Hesap doğrulama durumu',
              () => {},
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Doğrulandı</Text>
              </View>,
              '#48BB78'
            )}
          </View>,
        ])}

        {/* Preferences Section */}
        {renderSection('Tercihler', [
          <View key="pref-notifications">
            {renderMenuItem(
              'notifications', 
              'Bildirimler', 
              'Push bildirimleri ve uyarılar',
              () => setShowNotificationsModal(true),
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E2E8F0', true: currentTheme.colors.primary }}
                thumbColor="#FFFFFF"
              />,
              '#FFE66D'
            )}
          </View>,
          <View key="pref-biometric">
            {renderMenuItem(
              'fingerprint',
              'Biyometrik Giriş',
              'Parmak izi veya yüz tanıma',
              handleBiometricToggle,
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#E2E8F0', true: currentTheme.colors.primary }}
                thumbColor="#FFFFFF"
              />,
              '#48BB78'
            )}
          </View>,
          <View key="pref-backup">
            {renderMenuItem(
              'backup',
              'Otomatik Yedekleme',
              'Verilerinizi güvenli tutun',
              () => setAutoBackupEnabled(!autoBackupEnabled),
              <Switch
                value={autoBackupEnabled}
                onValueChange={setAutoBackupEnabled}
                trackColor={{ false: '#E2E8F0', true: currentTheme.colors.primary }}
                thumbColor="#FFFFFF"
              />,
              '#9F7AEA'
            )}
          </View>,
          <View key="pref-language">
            {renderMenuItem(
              'language', 
              'Dil', 
              selectedLanguage,
              () => setShowLanguageModal(true),
              null,
              '#4ECDC4'
            )}
          </View>,
          <View key="pref-currency">
            {renderMenuItem(
              'attach-money', 
              'Para Birimi', 
              `${selectedCurrency} (Türk Lirası)`,
              () => setShowCurrencyModal(true),
              null,
              '#48BB78'
            )}
          </View>,
          <View key="pref-theme">
            {renderMenuItem(
              'palette', 
              'Tema Ayarları', 
              'Açık/Koyu tema seçenekleri',
              () => setShowThemeModal(true),
              null,
              '#9C27B0'
            )}
          </View>,
        ])}

        {/* Financial Section */}
        {renderSection('Finansal Yönetim', [
          <View key="financial-accounts">
            {renderMenuItem(
              'account-balance', 
              'Hesaplarım', 
              `${userStats?.accountsCount || 0} hesap bağlı`,
              () => navigation.navigate('Cards'),
              null,
              '#6C63FF'
            )}
          </View>,
          <View key="financial-cards">
            {renderMenuItem(
              'credit-card', 
              'Kart Yönetimi', 
              'Kredi kartı ve banka kartları',
              () => navigation.navigate('Cards'),
              null,
              '#F56565'
            )}
          </View>,
                                <View key="financial-budget">
                        {renderMenuItem(
                          'savings', 
                          'Bütçe & Hedefler', 
                          'Tasarruf hedefleri ve bütçe',
                                                     () => navigation.navigate('Budget'),
                          null,
                          '#FFE66D'
                        )}
                      </View>,
                      <View key="financial-analytics">
                        {renderMenuItem(
                          'analytics', 
                          'Analiz & Raporlar', 
                          'Detaylı finansal analiz',
                                                     () => navigation.navigate('Analytics'),
                          null,
                          '#4ECDC4'
                        )}
                      </View>,
        ])}

        {/* Support Section */}
        {renderSection('Destek & Yardım', [
          <View key="support-help">
            {renderMenuItem(
              'help', 
              'Yardım Merkezi', 
              'SSS ve rehberler',
              () => showInfo('Yardım merkezi geliştiriliyor...'),
              null,
              '#6C63FF'
            )}
          </View>,
          <View key="support-feedback">
            {renderMenuItem(
              'feedback', 
              'Geri Bildirim Gönder', 
              'Öneri ve şikayetleriniz',
              giveFeedback,
              null,
              '#4ECDC4'
            )}
          </View>,
          <View key="support-bug">
            {renderMenuItem(
              'bug-report', 
              'Hata Bildir', 
              'Karşılaştığınız hataları bildirin',
              reportBug,
              null,
              '#F56565'
            )}
          </View>,
          <View key="support-feature">
            {renderMenuItem(
              'lightbulb-outline', 
              'Özellik İste', 
              'Yeni özellik önerileriniz',
              requestFeature,
              null,
              '#FFD700'
            )}
          </View>,
          <View key="support-improve">
            {renderMenuItem(
              'trending-up', 
              'İyileştirme Öner', 
              'Mevcut özellikleri iyileştirin',
              suggestImprovement,
              null,
              '#9F7AEA'
            )}
          </View>,
          <View key="support-about">
            {renderMenuItem(
              'info', 
              'Hakkında', 
              'Uygulama bilgisi ve sürüm',
              () => showInfo('FinanceFlow v1.1.0\nFinansal yönetim uygulaması'),
              <Text style={styles.versionText}>v1.1.0</Text>,
              '#718096'
            )}
          </View>,
        ])}

        {/* Data Management */}
        <View style={styles.dataManagementSection}>
          <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
          
          <TouchableOpacity 
            style={styles.utilityButton}
            onPress={() => setShowBackupModal(true)}
          >
            <MaterialIcons name="backup" size={20} color="#4ECDC4" />
            <Text style={styles.utilityButtonText}>Veri Yedekleme & Dışa Aktarma</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.utilityButton}
            onPress={() => setShowNotificationsModal(true)}
          >
            <MaterialIcons name="notifications" size={20} color="#6C63FF" />
            <Text style={styles.utilityButtonText}>Bildirim Ayarları</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Tehlikeli Bölge</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#F56565" />
            <Text style={styles.dangerButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.dangerButton, styles.deleteButton]} onPress={handleDeleteAccount}>
            <MaterialIcons name="delete-forever" size={20} color="#F56565" />
            <Text style={styles.dangerButtonText}>Hesabı Sil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modals */}
      {renderEditProfileModal()}
      {renderBackupModal()}
      {renderNotificationsModal()}
      {renderSecurityModal()}
      {renderLanguageModal()}
      {renderCurrencyModal()}
      
      {/* Theme Settings Modal */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowThemeModal(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={currentTheme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: currentTheme.colors.textPrimary }]}>Tema Ayarları</Text>
            <View style={{ width: 40 }} />
          </View>
          <ThemeSettingsComponent />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContent: {
    paddingBottom: 100,
  },

  // Profile Header
  profileHeader: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },

  profileGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },

  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  profileInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: theme.spacing.xs,
  },

  profileEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: theme.spacing.xs,
  },

  profilePhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statItem: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },

  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: theme.spacing.sm,
  },

  // Financial Overview
  financialOverview: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  financialCards: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },

  financialCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },

  cardGradient: {
    padding: theme.spacing.lg,
    minHeight: 120,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: theme.spacing.sm,
  },

  cardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: theme.spacing.xs,
  },

  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Sections
  section: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },

  sectionContent: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.lg,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },

  menuSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: theme.spacing.sm,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },

  verifiedBadge: {
    backgroundColor: '#48BB78',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },

  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },

  versionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },

  // Data Management
  dataManagementSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  utilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  utilityButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },

  // Danger Zone
  dangerZone: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F56565',
    marginBottom: theme.spacing.md,
  },

  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F56565',
    marginLeft: theme.spacing.sm,
  },

  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },

  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },

  modalCancelButton: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  inputGroup: {
    marginBottom: theme.spacing.lg,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },

  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },

  // Overlay Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  modalCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },

  cancelButton: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
  },

  cancelButtonText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },

  bottomPadding: {
    height: 100,
  },

  // Loading and error styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Notification Modal Styles
  notificationModalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  masterToggleContainer: {
    marginBottom: theme.spacing.xl,
  },

  masterToggleGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },

  masterToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  masterToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  masterToggleTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },

  masterToggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },

  masterToggleSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  notificationSection: {
    marginBottom: theme.spacing.xl,
  },

  notificationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary + '20',
  },

  notificationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },

  notificationSectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  notificationToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },

  notificationToggleInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },

  notificationToggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },

  notificationToggleDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  notificationToggleControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  testNotificationButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '15',
  },

  thresholdSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  thresholdSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },

  thresholdSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  thresholdSelectorValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },

  timeSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  timeSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },

  timeSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timeSelectorValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },

  quietHoursContainer: {
    marginTop: theme.spacing.sm,
  },

  testNotificationsContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },

  testAllButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 3,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  testAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  notificationModalBottomPadding: {
    height: 50,
  },

  closeButton: {
    padding: theme.spacing.sm,
  },

  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen;
