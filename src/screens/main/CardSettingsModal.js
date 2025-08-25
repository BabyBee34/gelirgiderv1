// FinanceFlow - Card Settings Modal
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';
import { formatCurrency } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');

const CardSettingsModal = ({ visible, onClose, selectedAccount, onUpdateAccount, onDeleteAccount }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editedAccount, setEditedAccount] = useState(selectedAccount || {});
  const [showStatementPicker, setShowStatementPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [statementTempDate, setStatementTempDate] = useState(new Date());
  const [dueTempDate, setDueTempDate] = useState(new Date());

  // Reset edited account when selectedAccount changes
  useEffect(() => {
    if (selectedAccount) {
      setEditedAccount(selectedAccount);
      setEditMode(false);
    }
  }, [selectedAccount]);

  // Early return must come AFTER all hooks
  if (!selectedAccount) return null;

  const isCredit = selectedAccount.type === 'credit';
  const creditLimit = selectedAccount.creditLimit || 20000;
  const usedCredit = isCredit ? Math.abs(selectedAccount.balance) : 0;
  const availableCredit = isCredit ? creditLimit - usedCredit : 0;
  const utilizationRate = isCredit ? Math.min((usedCredit / creditLimit) * 100, 100) : 0;

  const formatDateTR = (date) => {
    try {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleSaveChanges = () => {
    if (onUpdateAccount) {
      onUpdateAccount(editedAccount);
    }
    setEditMode(false);
    Alert.alert('Başarılı', 'Kart bilgileri güncellendi!');
  };

  const handleDeleteCard = () => {
    Alert.alert(
      'Kartı Sil',
      `${selectedAccount.name} kartını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            if (onDeleteAccount) {
              onDeleteAccount(selectedAccount.id);
            }
            onClose();
            Alert.alert('Başarılı', 'Kart silindi!');
          },
        },
      ]
    );
  };

  const handleCancelEdit = () => {
    setEditedAccount(selectedAccount);
    setEditMode(false);
  };

  const renderEditTab = () => (
    <View style={styles.tabContent}>
      {/* Edit Card Info */}
      <View style={styles.editCard}>
        <View style={styles.editHeader}>
          <Text style={styles.editTitle}>Kart Bilgilerini Düzenle</Text>
          {!editMode ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditMode(true)}
            >
              <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
              <Text style={styles.editButtonText}>Düzenle</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveChanges}
              >
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Card Name */}
        <View style={styles.editField}>
          <Text style={styles.editLabel}>Kart Adı</Text>
          <TextInput
            style={[styles.editInput, !editMode && styles.editInputDisabled]}
            value={editedAccount.name}
            onChangeText={(text) => setEditedAccount({...editedAccount, name: text})}
            editable={editMode}
            placeholder="Kart adını girin"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Bank Name */}
        <View style={styles.editField}>
          <Text style={styles.editLabel}>Banka Adı</Text>
          <TextInput
            style={[styles.editInput, !editMode && styles.editInputDisabled]}
            value={editedAccount.bankName}
            onChangeText={(text) => setEditedAccount({...editedAccount, bankName: text})}
            editable={editMode}
            placeholder="Banka adını girin"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Credit Limit (only for credit cards) */}
        {isCredit && (
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Kredi Limiti</Text>
            <TextInput
              style={[styles.editInput, !editMode && styles.editInputDisabled]}
              value={editedAccount.creditLimit?.toString()}
              onChangeText={(text) => setEditedAccount({...editedAccount, creditLimit: parseFloat(text) || 0})}
              editable={editMode}
              placeholder="Kredi limitini girin"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Interest Rate (only for credit cards) */}
        {isCredit && (
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Aylık Faiz Oranı (%)</Text>
            <TextInput
              style={[styles.editInput, !editMode && styles.editInputDisabled]}
              value={editedAccount.interestRate?.toString()}
              onChangeText={(text) => setEditedAccount({...editedAccount, interestRate: parseFloat(text) || 0})}
              editable={editMode}
              placeholder="Faiz oranını girin"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Statement Date (only for credit cards) */}
        {isCredit && (
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Hesap Kesim Tarihi</Text>
            <TouchableOpacity
              style={[styles.editInput, !editMode && styles.editInputDisabled, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              disabled={!editMode}
              onPress={() => setShowStatementPicker(true)}
            >
              <Text style={{ fontSize: 16, color: theme.colors.textPrimary }}>
                {editedAccount.statementDate || 'Tarih seçin'}
              </Text>
              {editMode && <MaterialIcons name="date-range" size={20} color={theme.colors.textSecondary} />}
            </TouchableOpacity>
            {showStatementPicker && (
              <DateTimePicker
                value={statementTempDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowStatementPicker(false);
                  if (date) {
                    setStatementTempDate(date);
                    setEditedAccount({ ...editedAccount, statementDate: formatDateTR(date) });
                  }
                }}
              />
            )}
          </View>
        )}

        {/* Due Date (only for credit cards) */}
        {isCredit && (
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Son Ödeme Tarihi</Text>
            <TouchableOpacity
              style={[styles.editInput, !editMode && styles.editInputDisabled, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              disabled={!editMode}
              onPress={() => setShowDuePicker(true)}
            >
              <Text style={{ fontSize: 16, color: theme.colors.textPrimary }}>
                {editedAccount.dueDate || 'Tarih seçin'}
              </Text>
              {editMode && <MaterialIcons name="date-range" size={20} color={theme.colors.textSecondary} />}
            </TouchableOpacity>
            {showDuePicker && (
              <DateTimePicker
                value={dueTempDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setShowDuePicker(false);
                  if (date) {
                    setDueTempDate(date);
                    setEditedAccount({ ...editedAccount, dueDate: formatDateTR(date) });
                  }
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* Card Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Kart İşlemleri</Text>
        
        <TouchableOpacity style={styles.actionItem}>
          <MaterialIcons name="copy" size={24} color={theme.colors.primary} />
          <View style={styles.actionContent}>
            <Text style={styles.actionLabel}>Kartı Kopyala</Text>
            <Text style={styles.actionDescription}>Bu kartın bir kopyasını oluştur</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <MaterialIcons name="archive" size={24} color={theme.colors.warning} />
          <View style={styles.actionContent}>
            <Text style={styles.actionLabel}>Kartı Arşivle</Text>
            <Text style={styles.actionDescription}>Kartı gizle, kullanımdan kaldır</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={handleDeleteCard}
        >
          <MaterialIcons name="delete" size={24} color={theme.colors.error} />
          <View style={styles.actionContent}>
            <Text style={[styles.actionLabel, { color: theme.colors.error }]}>Kartı Sil</Text>
            <Text style={styles.actionDescription}>Kartı kalıcı olarak sil</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Export Options */}
      <View style={styles.exportCard}>
        <Text style={styles.exportTitle}>Dışa Aktarma</Text>
        
        <TouchableOpacity style={styles.exportItem}>
          <MaterialIcons name="file-download" size={24} color={theme.colors.primary} />
          <View style={styles.exportContent}>
            <Text style={styles.exportLabel}>İşlemleri Dışa Aktar</Text>
            <Text style={styles.exportDescription}>Bu kartın tüm işlemlerini Excel olarak indir</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.exportItem}>
          <MaterialIcons name="picture-as-pdf" size={24} color={theme.colors.primary} />
          <View style={styles.exportContent}>
            <Text style={styles.exportLabel}>PDF Rapor</Text>
            <Text style={styles.exportDescription}>Detaylı kart raporu oluştur</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Account Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Hesap Özeti</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Hesap Türü</Text>
            <Text style={styles.summaryValue}>
              {selectedAccount.type === 'credit' ? 'Kredi Kartı' : 
               selectedAccount.type === 'savings' ? 'Tasarruf Hesabı' : 'Vadesiz Hesap'}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Banka</Text>
            <Text style={styles.summaryValue}>{selectedAccount.bankName || 'Banka'}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              {isCredit ? 'Kredi Limiti' : 'Bakiye'}
            </Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(isCredit ? creditLimit : selectedAccount.balance)}
            </Text>
          </View>
          {isCredit && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Kullanılan Kredi</Text>
              <Text style={styles.summaryValue}>{formatCurrency(usedCredit)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Credit Details */}
      {isCredit && (
        <View style={styles.creditCard}>
          <Text style={styles.creditTitle}>Kredi Detayları</Text>
          <View style={styles.creditGrid}>
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>Kullanım Oranı</Text>
              <Text style={styles.creditValue}>%{utilizationRate.toFixed(1)}</Text>
            </View>
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>Kullanılabilir</Text>
              <Text style={styles.creditValue}>{formatCurrency(availableCredit)}</Text>
            </View>
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>Faiz Oranı</Text>
              <Text style={styles.creditValue}>%{selectedAccount.interestRate || 3.99}/ay</Text>
            </View>
            <View style={styles.creditItem}>
              <Text style={styles.creditLabel}>Son Ekstre</Text>
              <Text style={styles.creditValue}>
                {selectedAccount.lastStatement?.date ? 
                  new Date(selectedAccount.lastStatement.date).toLocaleDateString('tr-TR') : 
                  'Bilgi Yok'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Payment Info */}
      {isCredit && (
        <View style={styles.paymentCard}>
          <Text style={styles.paymentTitle}>Ödeme Bilgileri</Text>
          <View style={styles.paymentGrid}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Hesap Kesim</Text>
              <Text style={styles.paymentValue}>{selectedAccount.statementDate || '20 Şubat 2024'}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Son Ödeme</Text>
              <Text style={styles.paymentValue}>{selectedAccount.dueDate || '15 Mart 2024'}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Asgari Ödeme</Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(selectedAccount.previousPeriodDebt ? 
                  selectedAccount.previousPeriodDebt * 0.05 : 
                  creditLimit * 0.05)}
              </Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Mevcut Dönem</Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(selectedAccount.currentPeriodSpending || 0)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      {/* Card Security */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Güvenlik Ayarları</Text>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="lock" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Kartı Dondur</Text>
            <Text style={styles.settingDescription}>Kartı geçici olarak devre dışı bırak</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="credit-card" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Kart Numarasını Göster</Text>
            <Text style={styles.settingDescription}>Kart numarasını gizle/göster</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="security" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Güvenlik Ayarları</Text>
            <Text style={styles.settingDescription}>PIN, şifre ve güvenlik seçenekleri</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Bildirim Ayarları</Text>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="notifications" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>İşlem Bildirimleri</Text>
            <Text style={styles.settingDescription}>Her işlem için anlık bildirim</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="payment" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Ödeme Hatırlatıcıları</Text>
            <Text style={styles.settingDescription}>Son ödeme tarihi yaklaşınca uyarı</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="trending-up" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Limit Uyarıları</Text>
            <Text style={styles.settingDescription}>Kredi limiti yaklaşınca uyarı</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Limits */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Limit Ayarları</Text>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="account-balance-wallet" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Günlük İşlem Limiti</Text>
            <Text style={styles.settingDescription}>Günlük maksimum harcama limiti</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <MaterialIcons name="shopping-cart" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Online Alışveriş Limiti</Text>
            <Text style={styles.settingDescription}>İnternet alışveriş limiti</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransactionsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.transactionsCard}>
        <Text style={styles.transactionsTitle}>Son İşlemler</Text>
        <View style={styles.transactionList}>
          {selectedAccount.recentTransactions ? (
            selectedAccount.recentTransactions.map((transaction, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <MaterialIcons 
                    name={transaction.type === 'income' ? 'trending-up' : 'trending-down'} 
                    size={20} 
                    color={transaction.type === 'income' ? '#48BB78' : '#F56565'} 
                  />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionTitle}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'income' ? '#48BB78' : '#F56565' }
                ]}>
                  {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noTransactions}>Henüz işlem bulunmuyor</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
      >
        <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedAccount.name} Ayarları</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Genel Bakış
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'edit' && styles.activeTab]}
            onPress={() => setActiveTab('edit')}
          >
            <Text style={[styles.tabText, activeTab === 'edit' && styles.activeTabText]}>
              Düzenle
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              Ayarlar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
              İşlemler
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'edit' && renderEditTab()}
          {activeTab === 'settings' && renderSettingsTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  
  placeholder: {
    width: 40,
  },
  
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.xs,
  },
  
  activeTab: {
    backgroundColor: theme.colors.primary + '15',
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  
  activeTabText: {
    color: theme.colors.primary,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  
  tabContent: {
    paddingVertical: theme.spacing.lg,
  },
  
  summaryCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  summaryItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  
  creditCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  creditTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  
  creditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  creditItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  
  creditLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  
  creditValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  
  paymentCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  paymentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  paymentItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  
  paymentLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  
  settingsCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  settingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  
  settingContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  
  transactionsCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  
  transactionList: {
    gap: theme.spacing.md,
  },
  
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  transactionContent: {
    flex: 1,
  },
  
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  
  transactionDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  noTransactions: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: theme.spacing.xl,
  },

  // Edit Tab Styles
  editCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },

  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },

  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  cancelButton: {
    backgroundColor: theme.colors.textSecondary + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },

  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  editField: {
    marginBottom: theme.spacing.lg,
  },

  editLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },

  editInput: {
    borderWidth: 1,
    borderColor: theme.colors.textSecondary + '30',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },

  editInputDisabled: {
    backgroundColor: theme.colors.textSecondary + '10',
    color: theme.colors.textSecondary,
  },

  // Actions Card Styles
  actionsCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },

  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },

  actionContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },

  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },

  actionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Export Card Styles
  exportCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  exportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },

  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },

  exportContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },

  exportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },

  exportDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default CardSettingsModal;
