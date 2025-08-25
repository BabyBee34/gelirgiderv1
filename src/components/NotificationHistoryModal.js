// FinanceFlow - Professional Notification History Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import serviceManager from '../services/serviceManager';

const NotificationHistoryModal = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (visible) {
      loadNotificationData();
    }
  }, [visible]);

  const loadNotificationData = async () => {
    setRefreshing(true);
    try {
      const notificationService = serviceManager.getService('notification');
      if (notificationService) {
        // Get notification settings
        const serviceSettings = notificationService.getSettings();
        setSettings(serviceSettings);
        
        // Mock notification history - in real app this would come from service
        const mockNotifications = [
          {
            id: 1,
            title: '💰 Bütçe Uyarısı',
            message: 'Market kategorisinde bütçenizin %80\'i tükendi',
            category: 'budget',
            timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
            read: false,
            type: 'warning',
            data: { category: 'market', spent: 800, limit: 1000 }
          },
          {
            id: 2,
            title: '🎯 Hedef İlerlemesi',
            message: 'Tatil hedefinizin %75\'ine ulaştınız!',
            category: 'goals',
            timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            read: true,
            type: 'success',
            data: { goalName: 'Tatil', progress: 75 }
          },
          {
            id: 3,
            title: '🔒 Güvenlik Uyarısı',
            message: 'Yeni cihazdan giriş tespit edildi',
            category: 'security',
            timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
            read: true,
            type: 'security',
            data: { device: 'Android Device' }
          },
          {
            id: 4,
            title: '💳 Ödeme Hatırlatması',
            message: 'Kredi kartı ödemeniz 2 gün içinde',
            category: 'payments',
            timestamp: Date.now() - 1000 * 60 * 60 * 8, // 8 hours ago
            read: false,
            type: 'reminder',
            data: { cardName: 'İş Bankası', amount: 1250, daysLeft: 2 }
          },
          {
            id: 5,
            title: '📊 Günlük Özet',
            message: 'Bugün 3 gelir, 7 gider işlemi yapıldı',
            category: 'transactions',
            timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
            read: true,
            type: 'info',
            data: { income: 3, expense: 7 }
          }
        ];
        
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Failed to load notification data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getFilteredNotifications = () => {
    if (selectedCategory === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.category === selectedCategory);
  };

  const getNotificationIcon = (type, category) => {
    const icons = {
      budget: 'account-balance-wallet',
      goals: 'flag',
      security: 'security',
      payments: 'credit-card',
      transactions: 'receipt',
      general: 'notifications'
    };
    return icons[category] || 'notifications';
  };

  const getNotificationColor = (type) => {
    const colors = {
      success: '#48BB78',
      warning: '#FFE66D',
      error: '#F56565',
      security: '#9F7AEA',
      reminder: '#4ECDC4',
      info: '#6C63FF'
    };
    return colors[type] || '#9CA3AF';
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Şimdi';
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      '🗑️ Bildirimleri Temizle',
      'Tüm bildirimleri silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => setNotifications([])
        }
      ]
    );
  };

  const sendTestNotification = async () => {
    const notificationService = serviceManager.getService('notification');
    if (notificationService) {
      await notificationService.sendTestNotification();
      Alert.alert('✅ Test Bildirimi', 'Test bildirimi gönderildi!');
    }
  };

  const categories = [
    { id: 'all', name: 'Tümü', icon: 'notifications' },
    { id: 'budget', name: 'Bütçe', icon: 'account-balance-wallet' },
    { id: 'goals', name: 'Hedefler', icon: 'flag' },
    { id: 'security', name: 'Güvenlik', icon: 'security' },
    { id: 'payments', name: 'Ödemeler', icon: 'credit-card' },
    { id: 'transactions', name: 'İşlemler', icon: 'receipt' },
  ];

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Bildirimler</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={clearAllNotifications} style={styles.clearButton}>
            <MaterialIcons name="delete-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <MaterialIcons 
                name={category.icon} 
                size={16} 
                color={selectedCategory === category.id ? '#FFFFFF' : theme.colors.textSecondary} 
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.selectedCategoryButtonText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications List */}
        <ScrollView 
          style={styles.notificationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadNotificationData} />
          }
        >
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.unreadNotification
                ]}
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationIcon}>
                  <MaterialIcons 
                    name={getNotificationIcon(notification.type, notification.category)} 
                    size={24} 
                    color={getNotificationColor(notification.type)} 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <Text style={styles.notificationTime}>{formatTime(notification.timestamp)}</Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="notifications-none" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>Bildirim Yok</Text>
              <Text style={styles.emptySubtitle}>
                {selectedCategory === 'all' 
                  ? 'Henüz hiç bildiriminiz yok'
                  : `${categories.find(c => c.id === selectedCategory)?.name} kategorisinde bildirim yok`
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
            <MaterialIcons name="science" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Bildirimi Gönder</Text>
          </TouchableOpacity>
        </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: '#F56565',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  categoryFilter: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryFilterContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  selectedCategoryButton: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xs,
  },
  unreadNotification: {
    backgroundColor: theme.colors.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationIcon: {
    marginRight: theme.spacing.md,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});

export default NotificationHistoryModal;