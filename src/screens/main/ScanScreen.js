// FinanceFlow - Scan Screen (Camera + Gallery + OCR)
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  Animated,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { globalStyles } from '../../styles/globalStyles';
import CustomButton from '../../components/ui/CustomButton';
import ReceiptScannerModal from '../modals/ReceiptScannerModal';

const { width, height } = Dimensions.get('window');

const ScanScreen = ({ navigation }) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'gallery'
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCameraScan = () => {
    setScanMode('camera');
    setScannerVisible(true);
  };

  const handleGalleryScan = () => {
    setScanMode('gallery');
    setScannerVisible(true);
  };

  const handleScanResult = async (result) => {
    setIsProcessing(true);
    try {
      // OCR sonuçlarını işle
      console.log('Scan result:', result);
      
      // Transaction ekleme ekranına yönlendir
      navigation.navigate('Home');
      
      Alert.alert(
        'Tarama Başarılı',
        'Fiş başarıyla tarandı ve işlem eklendi.',
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      console.error('Scan processing error:', error);
      Alert.alert(
        'Hata',
        'Fiş işlenirken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsProcessing(false);
      setScannerVisible(false);
    }
  };

  const renderScanOption = (title, subtitle, icon, color, onPress) => (
    <TouchableOpacity
      style={styles.scanOption}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={styles.scanOptionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.scanOptionIcon}>
          <MaterialIcons name={icon} size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.scanOptionTitle}>{title}</Text>
        <Text style={styles.scanOptionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fiş Tarama</Text>
        <View style={styles.headerRight} />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="document-scanner" size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Fiş Tarama</Text>
          <Text style={styles.heroSubtitle}>
            Fişlerinizi tarayarak otomatik olarak işlem ekleyin
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {renderScanOption(
            'Kamera ile Tara',
            'Fişi kamera ile çekip otomatik ekle',
            'camera-alt',
            '#6C63FF',
            handleCameraScan
          )}

          {renderScanOption(
            'Galeriden Seç',
            'Daha önce çekilmiş fişi seç',
            'photo-library',
            '#4ECDC4',
            handleGalleryScan
          )}
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tarama İpuçları</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Fişi düz bir yüzeye yerleştirin</Text>
            <Text style={styles.tipItem}>• İyi ışıklandırma sağlayın</Text>
            <Text style={styles.tipItem}>• Fişin tamamının görünür olduğundan emin olun</Text>
            <Text style={styles.tipItem}>• Bulanık olmayan net görüntü çekin</Text>
          </View>
        </View>
      </Animated.View>

      {/* Receipt Scanner Modal */}
      <ReceiptScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onReceiptScanned={handleScanResult}
        mode={scanMode}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <Modal transparent visible={isProcessing}>
          <View style={styles.processingOverlay}>
            <View style={styles.processingContainer}>
              <Text style={styles.processingText}>Fiş işleniyor...</Text>
            </View>
          </View>
        </Modal>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    marginVertical: theme.spacing.xxl,
  },
  scanOption: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scanOptionGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  scanOptionIcon: {
    marginBottom: theme.spacing.md,
  },
  scanOptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  scanOptionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  tipsList: {
    gap: theme.spacing.sm,
  },
  tipItem: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
});

export default ScanScreen;