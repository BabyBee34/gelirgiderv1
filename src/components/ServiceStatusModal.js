// FinanceFlow - Professional Service Status Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import serviceManager from '../services/serviceManager';

const ServiceStatusModal = ({ visible, onClose }) => {
  const [serviceHealth, setServiceHealth] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadServiceHealth();
    }
  }, [visible]);

  const loadServiceHealth = async () => {
    setRefreshing(true);
    try {
      const health = await serviceManager.getHealthStatus();
      setServiceHealth(health);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load service health:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#48BB78';
      case 'degraded': return '#FFE66D';
      case 'error': return '#F56565';
      default: return '#9CA3AF';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return 'check-circle';
      case 'degraded': return 'warning';
      case 'error': return 'error';
      default: return 'help';
    }
  };

  const runSystemTest = async () => {
    Alert.alert(
      '🧪 Sistem Testi',
      'Kapsamlı sistem testi çalıştırılsın mı? Bu işlem birkaç dakika sürebilir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Başlat',
          onPress: async () => {
            setRefreshing(true);
            try {
              const testResults = await serviceManager.runSystemTest();
              if (testResults) {
                Alert.alert(
                  '✅ Test Tamamlandı',
                  `Sonuç: ${testResults.passed}/${testResults.total} test geçti (${testResults.passRate}%)\n\nSüre: ${testResults.duration}ms`,
                  [{ text: 'Tamam', onPress: loadServiceHealth }]
                );
              } else {
                Alert.alert('❌ Test Başarısız', 'Test servisi çalışmıyor.');
              }
            } catch (error) {
              Alert.alert('❌ Test Hatası', error.message);
            } finally {
              setRefreshing(false);
            }
          }
        }
      ]
    );
  };

  const restartFailedServices = async () => {
    Alert.alert(
      '🔄 Servis Yeniden Başlatma',
      'Başarısız servisleri yeniden başlatmak istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yeniden Başlat',
          onPress: async () => {
            setRefreshing(true);
            try {
              const success = await serviceManager.restartFailedServices();
              if (success) {
                Alert.alert('✅ Başarılı', 'Tüm servisler başarıyla yeniden başlatıldı.');
              } else {
                Alert.alert('⚠️ Kısmi Başarı', 'Bazı servisler yeniden başlatılamadı.');
              }
              await loadServiceHealth();
            } catch (error) {
              Alert.alert('❌ Hata', 'Servisler yeniden başlatılamadı.');
            } finally {
              setRefreshing(false);
            }
          }
        }
      ]
    );
  };

  const renderServiceStatus = (serviceName, status) => {
    const serviceStatus = status?.status || status || 'unknown';
    const isHealthy = serviceStatus === 'healthy' || status?.isInitialized;
    
    return (
      <View key={serviceName} style={styles.serviceItem}>
        <View style={styles.serviceInfo}>
          <MaterialIcons 
            name={getStatusIcon(isHealthy ? 'healthy' : 'error')} 
            size={20} 
            color={getStatusColor(isHealthy ? 'healthy' : 'error')} 
          />
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceName}>{getServiceDisplayName(serviceName)}</Text>
            <Text style={styles.serviceStatus}>
              {isHealthy ? 'Çalışıyor' : 'Sorun var'}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusDot, 
          { backgroundColor: getStatusColor(isHealthy ? 'healthy' : 'error') }
        ]} />
      </View>
    );
  };

  const getServiceDisplayName = (serviceName) => {
    const names = {
      errorHandling: 'Hata Yönetimi',
      security: 'Güvenlik',
      monitoring: 'İzleme',
      notification: 'Bildirimler',
      testing: 'Test Sistemi'
    };
    return names[serviceName] || serviceName;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Profesyonel Servisler</Text>
          <TouchableOpacity onPress={loadServiceHealth} style={styles.refreshButton}>
            <MaterialIcons 
              name="refresh" 
              size={24} 
              color={refreshing ? '#9CA3AF' : theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Overall Status */}
          <View style={styles.overallStatus}>
            <MaterialIcons 
              name={getStatusIcon(serviceHealth?.overall)} 
              size={32} 
              color={getStatusColor(serviceHealth?.overall)} 
            />
            <Text style={styles.overallText}>
              Sistem Durumu: {serviceHealth?.overall === 'healthy' ? 'Sağlıklı' : 'Dikkat Gerekli'}
            </Text>
            {lastUpdate && (
              <Text style={styles.lastUpdate}>
                Son Güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
              </Text>
            )}
          </View>

          {/* Service List */}
          <View style={styles.servicesList}>
            <Text style={styles.sectionTitle}>Aktif Servisler</Text>
            {serviceHealth?.services ? (
              Object.entries(serviceHealth.services).map(([serviceName, status]) =>
                renderServiceStatus(serviceName, status)
              )
            ) : (
              <Text style={styles.loadingText}>Servis durumu yükleniyor...</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.testButton]} 
              onPress={runSystemTest}
              disabled={refreshing}
            >
              <MaterialIcons name="science" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Kapsamlı Test Çalıştır</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.restartButton]} 
              onPress={restartFailedServices}
              disabled={refreshing}
            >
              <MaterialIcons name="restart-alt" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Servisleri Yeniden Başlat</Text>
            </TouchableOpacity>
          </View>

          {/* Service Manager Info */}
          <View style={styles.info}>
            <Text style={styles.infoTitle}>Profesyonel Özellikler</Text>
            <Text style={styles.infoText}>
              • Gerçek zamanlı güvenlik izleme{'\n'}
              • Otomatik hata yakalama ve raporlama{'\n'}
              • Akıllı bildirim sistemi{'\n'}
              • Performans analizi{'\n'}
              • Kapsamlı test süiti
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  refreshButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  overallStatus: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  overallText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  lastUpdate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  servicesList: {
    paddingVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceDetails: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  serviceStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: theme.spacing.lg,
  },
  actions: {
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  testButton: {
    backgroundColor: '#6C63FF',
  },
  restartButton: {
    backgroundColor: '#ED8936',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  info: {
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default ServiceStatusModal;