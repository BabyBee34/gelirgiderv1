// FinanceFlow - Receipt Scanner Modal
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Modal, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');

const ReceiptScannerModal = ({ visible, onClose, onReceiptScanned }) => {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [step, setStep] = useState('camera'); // camera, preview, result

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation for capture button
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      resetScanner();
    }
  }, [visible]);

  const resetScanner = () => {
    setScanning(false);
    setScannedData(null);
    setStep('camera');
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const simulateReceiptScan = async () => {
    setScanning(true);
    
    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock scanned receipt data
    const mockReceiptData = {
      storeName: 'Migros AVM',
      date: new Date().toISOString(),
      total: 156.75,
      items: [
        { name: 'Ekmek', price: 3.50, quantity: 2 },
        { name: 'Süt', price: 8.25, quantity: 1 },
        { name: 'Peynir', price: 24.90, quantity: 1 },
        { name: 'Domates', price: 12.80, quantity: 1 },
        { name: 'Tavuk Eti', price: 45.30, quantity: 1 },
        { name: 'Yoğurt', price: 6.50, quantity: 4 },
        { name: 'Makarna', price: 4.75, quantity: 2 },
        { name: 'Deterjan', price: 28.95, quantity: 1 },
      ],
      category: 'Market',
      confidence: 0.95,
    };

    setScannedData(mockReceiptData);
    setScanning(false);
    setStep('result');
  };

  const handleCapture = () => {
    if (scanning) return;
    simulateReceiptScan();
  };

  const handleRetake = () => {
    setStep('camera');
    setScannedData(null);
  };

  const handleConfirm = () => {
    if (onReceiptScanned) {
      onReceiptScanned(scannedData);
    }
    
    Alert.alert(
      'Başarılı',
      'Fiş başarıyla tarandı ve işlem eklendi.',
      [{ text: 'Tamam', onPress: handleClose }]
    );
  };

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      {/* Mock Camera View */}
      <View style={styles.cameraView}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.cameraGradient}
        >
          <MaterialIcons name="camera-enhance" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={styles.cameraText}>Fiş Tarama</Text>
        </LinearGradient>
        
        {/* Camera Overlay */}
        <View style={styles.cameraOverlay}>
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              Fişi çerçeve içine yerleştirin
            </Text>
          </View>
        </View>
      </View>

      {/* Camera Controls */}
      <View style={styles.cameraControls}>
        <TouchableOpacity style={styles.galleryButton}>
          <MaterialIcons name="photo-library" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity 
            style={[styles.captureButton, scanning && styles.captureButtonScanning]}
            onPress={handleCapture}
            disabled={scanning}
          >
            {scanning ? (
              <MaterialIcons name="hourglass-empty" size={32} color="#FFFFFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.flashButton}>
          <MaterialIcons name="flash-off" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {scanning && (
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningContent}>
            <MaterialIcons name="document-scanner" size={48} color="#FFFFFF" />
            <Text style={styles.scanningText}>Fiş taranıyor...</Text>
            <Text style={styles.scanningSubtext}>Lütfen bekleyin</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderResultView = () => (
    <View style={styles.resultContainer}>
      {/* Confidence Indicator */}
      <View style={styles.confidenceContainer}>
        <LinearGradient
          colors={['#48BB78', '#38A169']}
          style={styles.confidenceGradient}
        >
          <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
          <Text style={styles.confidenceText}>
            %{Math.round(scannedData.confidence * 100)} Güvenilir
          </Text>
        </LinearGradient>
      </View>

      {/* Store Info */}
      <View style={styles.storeInfo}>
        <MaterialIcons name="store" size={24} color={theme.colors.primary} />
        <View style={styles.storeDetails}>
          <Text style={styles.storeName}>{scannedData.storeName}</Text>
          <Text style={styles.storeDate}>
            {new Date(scannedData.date).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>

      {/* Total Amount */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Toplam Tutar</Text>
        <Text style={styles.totalAmount}>{formatCurrency(scannedData.total)}</Text>
      </View>

      {/* Items List */}
      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>Ürünler ({scannedData.items.length})</Text>
        <View style={styles.itemsList}>
          {scannedData.items.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.quantity > 1 && (
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</Text>
            </View>
          ))}
          
          {scannedData.items.length > 5 && (
            <View style={styles.moreItems}>
              <Text style={styles.moreItemsText}>
                +{scannedData.items.length - 5} ürün daha
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Suggested Category */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryLabel}>Önerilen Kategori</Text>
        <View style={styles.categoryTag}>
          <MaterialIcons name="shopping-cart" size={16} color="#FFFFFF" />
          <Text style={styles.categoryText}>{scannedData.category}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
          <MaterialIcons name="camera-enhance" size={20} color={theme.colors.primary} />
          <Text style={styles.retakeText}>Yeniden Tara</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <MaterialIcons name="check" size={20} color="#FFFFFF" />
          <Text style={styles.confirmText}>Onayla & Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>
              {step === 'camera' ? 'Fiş Tara' : 'Tarama Sonucu'}
            </Text>
            
            <View style={styles.headerRight} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {step === 'camera' && renderCameraView()}
            {step === 'result' && scannedData && renderResultView()}
          </View>

          {/* Instructions */}
          {step === 'camera' && !scanning && (
            <View style={styles.instructions}>
              <View style={styles.instructionItem}>
                <MaterialIcons name="lightbulb-outline" size={20} color={theme.colors.accent} />
                <Text style={styles.instructionItemText}>
                  Fişi düz bir yüzeye yerleştirin
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <MaterialIcons name="visibility" size={20} color={theme.colors.accent} />
                <Text style={styles.instructionItemText}>
                  Tüm yazıların net görünmesini sağlayın
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <MaterialIcons name="flash-on" size={20} color={theme.colors.accent} />
                <Text style={styles.instructionItemText}>
                  Yeterli ışık olduğundan emin olun
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },

  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  closeButton: {
    padding: theme.spacing.sm,
  },

  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  headerRight: {
    width: 40,
  },

  content: {
    flex: 1,
  },

  // Camera View Styles
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },

  cameraView: {
    flex: 1,
    position: 'relative',
  },

  cameraGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cameraText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },

  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  viewfinderContainer: {
    alignItems: 'center',
  },

  viewfinder: {
    width: width * 0.8,
    height: height * 0.4,
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },

  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },

  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },

  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  captureButtonScanning: {
    backgroundColor: theme.colors.primary,
  },

  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scanningContent: {
    alignItems: 'center',
  },

  scanningText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: theme.spacing.lg,
  },

  scanningSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: theme.spacing.sm,
  },

  // Result View Styles
  resultContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },

  confidenceContainer: {
    marginBottom: theme.spacing.lg,
  },

  confidenceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },

  confidenceText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  storeDetails: {
    marginLeft: theme.spacing.md,
  },

  storeName: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  storeDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  totalContainer: {
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },

  totalAmount: {
    fontSize: 32,
    color: theme.colors.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
  },

  itemsContainer: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  itemsTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },

  itemsList: {},

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },

  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemName: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },

  itemQuantity: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },

  itemPrice: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  moreItems: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },

  moreItemsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },

  categoryContainer: {
    marginBottom: theme.spacing.lg,
  },

  categoryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },

  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },

  categoryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },

  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },

  retakeText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },

  confirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  // Instructions Styles
  instructions: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },

  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  instructionItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: theme.spacing.md,
    flex: 1,
  },
});

export default ReceiptScannerModal;
