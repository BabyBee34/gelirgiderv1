// FinanceFlow - Profile Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { testUser } from '../../utils/testData';
import { formatCurrency } from '../../utils/formatters';
import { dataExport } from '../../utils/dataExport';
import { notificationSystem } from '../../utils/notificationSystem';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(testUser.user.preferences.notifications);
  const [darkModeEnabled, setDarkModeEnabled] = useState(testUser.user.preferences.darkMode);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(true);
  const [showAccountSummary, setShowAccountSummary] = useState(true);
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



  const getTotalBalance = () => {
    return testUser.accounts.reduce((total, account) => total + account.balance, 0);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navigation will be handled by AppNavigator
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesap Silme',
      'Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecek.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Hesap silindi', 'Hesabınız başarıyla silindi.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const renderProfileHeader = () => (
    <Animated.View style={[styles.profileHeader, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.profileGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileTopSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {testUser.user.firstName[0]}{testUser.user.lastName[0]}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarEditButton}>
              <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfoSection}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>
                {testUser.user.firstName} {testUser.user.lastName}
              </Text>
              <View style={styles.membershipBadge}>
                <MaterialIcons name="workspace-premium" size={14} color="#FFE66D" />
                <Text style={styles.membershipText}>Premium</Text>
              </View>
            </View>
            <Text style={styles.userEmail}>{testUser.user.email}</Text>
            
            <View style={styles.memberSince}>
              <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.memberSinceText}>
                {new Date(testUser.user.createdAt).toLocaleDateString('tr-TR')} tarihinden beri üye
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => Alert.alert('Ayarlar', 'Profil ayarları sayfası geliştiriliyor...')}
          >
            <MaterialIcons name="settings" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.accountSummary}>
          <View style={styles.summaryToggle}>
            <Text style={styles.summaryTitle}>Hesap Özeti</Text>
            <TouchableOpacity 
              onPress={() => setShowAccountSummary(!showAccountSummary)}
              style={styles.toggleButton}
            >
              <MaterialIcons 
                name={showAccountSummary ? "visibility" : "visibility-off"} 
                size={16} 
                color="rgba(255,255,255,0.8)" 
              />
            </TouchableOpacity>
          </View>
          
          {showAccountSummary && (
            <>
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Toplam Net Değer</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(getTotalBalance())}</Text>
              </View>
              
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="account-balance-wallet" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statValue}>{testUser.accounts.length}</Text>
                  <Text style={styles.statLabel}>Hesap</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <MaterialIcons name="receipt-long" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statValue}>{testUser.transactions.length}</Text>
                  <Text style={styles.statLabel}>İşlem</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <MaterialIcons name="track-changes" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statValue}>{testUser.goals.length}</Text>
                  <Text style={styles.statLabel}>Hedef</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderStatsCard = () => (
    <Animated.View style={[styles.statsCard, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <MaterialIcons name="account-balance-wallet" size={24} color={theme.colors.primary} />
          <Text style={styles.statValue}>{formatCurrency(getTotalBalance())}</Text>
          <Text style={styles.statLabel}>Toplam Bakiye</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialIcons name="trending-up" size={24} color="#48BB78" />
          <Text style={styles.statValue}>{testUser.transactions.length}</Text>
          <Text style={styles.statLabel}>Toplam İşlem</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialIcons name="flag" size={24} color="#FFE66D" />
          <Text style={styles.statValue}>{testUser.goals.length}</Text>
          <Text style={styles.statLabel}>Aktif Hedef</Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialIcons name="credit-card" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>{testUser.accounts.length}</Text>
          <Text style={styles.statLabel}>Hesap Sayısı</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderMenuItem = (icon, title, subtitle, onPress, rightElement = null, iconColor = theme.colors.textPrimary) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: `${iconColor}15` }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="edit" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        {renderProfileHeader()}

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Account Section */}
        {renderSection('Hesap', [
          renderMenuItem(
            'person', 
            'Kişisel Bilgiler', 
            'Ad, soyad ve iletişim bilgileri',
            () => {},
            null,
            '#6C63FF'
          ),
          renderMenuItem(
            'security', 
            'Güvenlik', 
            'Şifre ve güvenlik ayarları',
            () => {},
            null,
            '#F56565'
          ),
          renderMenuItem(
            'verified-user', 
            'Kimlik Doğrulama', 
            'Hesap doğrulama durumu',
            () => {},
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Doğrulandı</Text>
            </View>,
            '#48BB78'
          ),
        ])}

        {/* Preferences Section */}
        {renderSection('Tercihler & Güvenlik', [
          renderMenuItem(
            'notifications', 
            'Bildirimler', 
            'Push bildirimleri yönet',
            () => setNotificationsEnabled(!notificationsEnabled),
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E2E8F0', true: theme.colors.primary }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />,
            '#FFE66D'
          ),
          renderMenuItem(
            'campaign',
            'Bütçe Uyarıları',
            'Harcama limitlerinde uyar',
            () => setBudgetAlertsEnabled(!budgetAlertsEnabled),
            <Switch
              value={budgetAlertsEnabled}
              onValueChange={setBudgetAlertsEnabled}
              trackColor={{ false: '#E2E8F0', true: theme.colors.primary }}
              thumbColor={budgetAlertsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />,
            '#ED8936'
          ),
          renderMenuItem(
            'fingerprint',
            'Biyometrik Giriş',
            'Parmak izi veya yüz tanıma',
            () => {
              Alert.alert(
                'Biyometrik Giriş',
                'Bu özellik henüz geliştiriliyor. Yakında kullanılabilir olacak!',
                [{ text: 'Tamam' }]
              );
              setBiometricEnabled(!biometricEnabled);
            },
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E2E8F0', true: theme.colors.primary }}
              thumbColor={biometricEnabled ? '#FFFFFF' : '#FFFFFF'}
            />,
            '#48BB78'
          ),
          renderMenuItem(
            'backup',
            'Otomatik Yedekleme',
            'Verilerinizi güvenli tutun',
            () => setAutoBackupEnabled(!autoBackupEnabled),
            <Switch
              value={autoBackupEnabled}
              onValueChange={setAutoBackupEnabled}
              trackColor={{ false: '#E2E8F0', true: theme.colors.primary }}
              thumbColor={autoBackupEnabled ? '#FFFFFF' : '#FFFFFF'}
            />,
            '#9F7AEA'
          ),
          renderMenuItem(
            'dark-mode', 
            'Koyu Tema', 
            'Arayüz temasını değiştir',
            () => {
              Alert.alert(
                'Koyu Tema',
                'Bu özellik yakında eklenecek!',
                [{ text: 'Tamam' }]
              );
              setDarkModeEnabled(!darkModeEnabled);
            },
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#E2E8F0', true: theme.colors.primary }}
              thumbColor={darkModeEnabled ? '#FFFFFF' : '#FFFFFF'}
            />,
            '#2D3748'
          ),
          renderMenuItem(
            'language', 
            'Dil', 
            'Türkçe',
            () => {},
            null,
            '#4ECDC4'
          ),
          renderMenuItem(
            'attach-money', 
            'Para Birimi', 
            'TRY (Türk Lirası)',
            () => {},
            null,
            '#48BB78'
          ),
        ])}

        {/* Financial Section */}
        {renderSection('Finansal', [
          renderMenuItem(
            'account-balance', 
            'Hesaplarım', 
            `${testUser.accounts.length} hesap bağlı`,
            () => navigation.navigate('Cards'),
            null,
            '#6C63FF'
          ),
          renderMenuItem(
            'credit-card', 
            'Kart Yönetimi', 
            'Kredi kartı ve banka kartları',
            () => navigation.navigate('Cards'),
            null,
            '#F56565'
          ),
          renderMenuItem(
            'savings', 
            'Bütçe & Hedefler', 
            'Tasarruf hedefleri ve bütçe',
            () => {},
            null,
            '#FFE66D'
          ),
          renderMenuItem(
            'file-download', 
            'Rapor İndir', 
            'PDF veya Excel formatında',
            () => {},
            null,
            '#4ECDC4'
          ),
        ])}

        {/* Support Section */}
        {renderSection('Destek', [
          renderMenuItem(
            'help', 
            'Yardım Merkezi', 
            'SSS ve rehberler',
            () => {},
            null,
            '#6C63FF'
          ),
          renderMenuItem(
            'feedback', 
            'Geri Bildirim', 
            'Öneri ve şikayetleriniz',
            () => {},
            null,
            '#4ECDC4'
          ),
          renderMenuItem(
            'info', 
            'Hakkında', 
            'Uygulama bilgisi ve sürüm',
            () => {},
            <Text style={styles.versionText}>v1.0.0</Text>,
            '#718096'
          ),
        ])}

        {/* Legal Section */}
        {renderSection('Yasal', [
          renderMenuItem(
            'description', 
            'Kullanım Şartları', 
            'Hizmet şartları ve koşullar',
            () => {},
            null,
            '#718096'
          ),
          renderMenuItem(
            'privacy-tip', 
            'Gizlilik Politikası', 
            'Veri koruma ve gizlilik',
            () => {},
            null,
            '#718096'
          ),
          renderMenuItem(
            'gavel', 
            'KVKK', 
            'Kişisel verilerin korunması',
            () => {},
            null,
            '#718096'
          ),
        ])}

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Tehlikeli Bölge</Text>
          
          {/* Data Management Buttons */}
          <TouchableOpacity 
            style={styles.utilityButton}
            onPress={() => {
              Alert.alert(
                'Veri Yedekleme',
                'Verilerinizi yedeklemek istediğinizden emin misiniz?',
                [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'Yedekle', onPress: () => dataExport.backupData() }
                ]
              );
            }}
          >
            <MaterialIcons name="backup" size={20} color="#4ECDC4" />
            <Text style={styles.utilityButtonText}>Veri Yedekleme</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.utilityButton}
            onPress={() => {
              Alert.alert(
                'Veri Dışa Aktarma',
                'Hangi verileri dışa aktarmak istiyorsunuz?',
                [
                  { text: 'İptal', style: 'cancel' },
                  { text: 'İşlemler (CSV)', onPress: () => dataExport.exportTransactionsCSV() },
                  { text: 'Mali Rapor', onPress: () => dataExport.exportFinancialReport() },
                  { text: 'Tüm Veriler', onPress: () => dataExport.exportAllData() }
                ]
              );
            }}
          >
            <MaterialIcons name="download" size={20} color="#FFE66D" />
            <Text style={styles.utilityButtonText}>Veri Dışa Aktarma</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.utilityButton}
            onPress={() => {
              const notifications = notificationSystem.getAllNotifications();
              if (notifications.length > 0) {
                const message = notifications.slice(0, 3).map(n => `• ${n.title}`).join('\n');
                Alert.alert(
                  `Bildirimler (${notifications.length})`,
                  message,
                  [
                    { text: 'Tamam' },
                    { text: 'Test Bildirimi', onPress: () => notificationSystem.showDailySummary() }
                  ]
                );
              } else {
                Alert.alert('Bildirimler', 'Şu anda hiç bildirim yok.\n\nTest bildirimi göndermek ister misiniz?', [
                  { text: 'Hayır' },
                  { text: 'Evet', onPress: () => notificationSystem.showDailySummary() }
                ]);
              }
            }}
          >
            <MaterialIcons name="notifications" size={20} color="#6C63FF" />
            <Text style={styles.utilityButtonText}>Bildirimler</Text>
          </TouchableOpacity>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  headerTitle: {
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  headerButton: {
    padding: theme.spacing.sm,
  },

  profileHeader: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  profileGradient: {
    borderRadius: theme.borderRadius.lg,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  avatarText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  userName: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },

  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.md,
  },

  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  memberSinceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: theme.spacing.xs,
  },

  statsCard: {
    backgroundColor: theme.colors.cards,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },

  statValue: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  section: {
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  sectionContent: {
    backgroundColor: theme.colors.cards,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },

  menuSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  verifiedBadge: {
    backgroundColor: '#48BB7815',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },

  verifiedText: {
    fontSize: 12,
    color: '#48BB78',
    fontWeight: '600',
  },

  versionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  dangerZone: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },

  dangerTitle: {
    fontSize: 16,
    color: '#F56565',
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },

  utilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  utilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },

  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },

  deleteButton: {
    backgroundColor: '#FED7D7',
  },

  dangerButtonText: {
    fontSize: 16,
    color: '#F56565',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  bottomPadding: {
    height: 80,
  },
  
  // Enhanced Profile Header Styles
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  
  userInfoSection: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 230, 109, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  
  membershipText: {
    fontSize: 10,
    color: '#FFE66D',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  
  settingsButton: {
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.md,
  },
  
  accountSummary: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  
  summaryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  
  toggleButton: {
    padding: theme.spacing.xs,
  },
  
  balanceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.xs,
  },
  
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: theme.spacing.xs,
  },
  
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: theme.spacing.xs,
  },
  
  statSeparator: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: theme.spacing.sm,
  },
});

export default ProfileScreen;