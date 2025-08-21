// FinanceFlow - Modern Cards Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, FlatList, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { testUser } from '../../utils/testData';
import { formatCurrency } from '../../utils/formatters';
import CardSettingsModal from './CardSettingsModal';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - theme.spacing.lg * 2;
const CARD_HEIGHT = 240;

// Güvenli tarih formatlayıcı: sayı (gün) gelirse "Her ay X" yazar, geçersizse "Belirtilmemiş"
const formatDateDisplay = (value) => {
  if (!value && value !== 0) return 'Belirtilmemiş';
  if (typeof value === 'number') {
    if (value >= 1 && value <= 31) return `Her ay ${value}`;
  }
  if (typeof value === 'string') {
    if (/^\d{1,2}$/.test(value)) return `Her ay ${value}`;
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('tr-TR');
    return 'Belirtilmemiş';
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toLocaleDateString('tr-TR');
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('tr-TR');
  return 'Belirtilmemiş';
};

const parseDateMaybe = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const CardsScreen = ({ navigation }) => {
  const [selectedCard, setSelectedCard] = useState(0);
  const [accounts, setAccounts] = useState(testUser.accounts);
  const [selectedAccount, setSelectedAccount] = useState(testUser.accounts[0]);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [cardTypeModalVisible, setCardTypeModalVisible] = useState(false);
  const [addCardModalVisible, setAddCardModalVisible] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [newCardName, setNewCardName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [newInterestRate, setNewInterestRate] = useState('');
  const [newInitialBalance, setNewInitialBalance] = useState('');
  const [newParentCard, setNewParentCard] = useState('');
  const [newMonthlyLimit, setNewMonthlyLimit] = useState('');
  const [newDefaultCurrency, setNewDefaultCurrency] = useState('TRY');
  const [balanceUpdateModalVisible, setBalanceUpdateModalVisible] = useState(false);
  const [paymentReminderModalVisible, setPaymentReminderModalVisible] = useState(false);
  const [updateAmount, setUpdateAmount] = useState('');
  const [updateType, setUpdateType] = useState(''); // 'add' or 'subtract'
  const [paymentAmount, setPaymentAmount] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    setSelectedAccount(testUser.accounts[0]);
  }, []);

  const handleUpdateAccount = (updatedAccount) => {
    console.log('Account updated:', updatedAccount);
    setSelectedAccount(updatedAccount);
  };

  const handleDeleteAccount = (accountId) => {
    console.log('Account deleted:', accountId);
    setSettingsModalVisible(false);
  };

  // Expanded gradients for new types
  const getCardGradient = (type) => {
    switch (type) {
      case 'debit':
        return ['#667eea', '#764ba2'];
      case 'savings':
        return ['#4facfe', '#00f2fe'];
      case 'credit':
      case 'virtual':
      case 'supplementary':
      case 'business':
        return ['#f093fb', '#f5576c'];
      case 'prepaid':
      case 'gift':
        return ['#ff9966', '#ff5e62'];
      case 'multicurrency':
        return ['#36d1dc', '#5b86e5'];
      case 'fuel':
        return ['#43cea2', '#185a9d'];
      default:
        return ['#6C63FF', '#4ECDC4'];
    }
  };

  const getCardIcon = (type) => {
    switch (type) {
      case 'debit':
        return 'account-balance-wallet';
      case 'savings':
        return 'savings';
      case 'credit':
        return 'credit-card';
      case 'virtual':
        return 'phonelink';
      case 'supplementary':
        return 'person-add-alt';
      case 'business':
        return 'business-center';
      case 'prepaid':
      case 'gift':
        return 'card-giftcard';
      case 'multicurrency':
        return 'public';
      case 'fuel':
        return 'local-gas-station';
      default:
        return 'account-balance';
    }
  };

  const getCardType = (type) => {
    switch (type) {
      case 'debit':
        return 'Banka Kartı';
      case 'savings':
        return 'Tasarruf Hesabı';
      case 'credit':
        return 'Kredi Kartı';
      case 'virtual':
        return 'Sanal Kart';
      case 'supplementary':
        return 'Ek Kart';
      case 'business':
        return 'Kurumsal Kart';
      case 'prepaid':
        return 'Ön Ödemeli Kart';
      case 'gift':
        return 'Hediye Kartı';
      case 'multicurrency':
        return 'Çok Para Birimli Kart';
      case 'fuel':
        return 'Akaryakıt Kartı';
      default:
        return 'Hesap';
    }
  };

  const isCreditType = (type) => ['credit', 'virtual', 'supplementary', 'business'].includes(type);

  const getRecentTransactionsForCard = (accountId) => {
    return testUser.transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  };

  const renderCard = (item, index) => {
    const isCredit = isCreditType(item.type);
    const creditLimit = item.creditLimit || 20000;
    const usedCredit = isCredit ? Math.abs(item.balance) : 0;
    const availableCredit = isCredit ? creditLimit - usedCredit : 0;
    
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => {
          setSelectedCard(index);
          setSelectedAccount(item);
          scrollViewRef.current?.scrollTo({ x: index * (CARD_WIDTH + theme.spacing.md), animated: true });
        }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={getCardGradient(item.type)}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardType}>
              <MaterialIcons name={getCardIcon(item.type)} size={28} color="rgba(255,255,255,0.9)" />
              <Text style={styles.cardTypeText}>{getCardType(item.type)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setSettingsModalVisible(true)}
            >
              <MaterialIcons name="more-vert" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>

          <View style={styles.bankNameContainer}>
            <Text style={styles.bankNameLarge}>
              {item.bankName || 'Banka'}
            </Text>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>
              {isCredit ? 'Kullanılabilir Limit' : 'Bakiye'}
            </Text>
            <Text style={styles.balanceAmount}>
              {isCredit ? formatCurrency(availableCredit) : formatCurrency(item.balance)}
            </Text>
            {isCredit && (
              <View style={styles.limitInfoContainer}>
                <Text style={styles.cardLimit}>
                  Toplam Limit: {formatCurrency(creditLimit)}
                </Text>
                <Text style={styles.usedCredit}>
                  Kullanılan: {formatCurrency(usedCredit)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statusBadge}>
            <MaterialIcons 
              name={getCardIcon(item.type)} 
              size={16} 
              color="rgba(255,255,255,0.8)" 
            />
            <Text style={styles.statusText}>
              {getCardType(item.type)}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderTransactionItem = (transaction) => {
    const categoryName = getCategoryName(transaction.categoryId);
    
    return (
      <View key={transaction.id} style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <MaterialIcons 
            name={transaction.type === 'income' ? 'trending-up' : 'trending-down'} 
            size={20} 
            color={transaction.type === 'income' ? '#48BB78' : '#F56565'} 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{transaction.description}</Text>
          <Text style={styles.transactionCategory}>{categoryName}</Text>
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
    );
  };

  const getCategoryName = (categoryId) => {
    const allCategories = [...testUser.incomeCategories, ...testUser.expenseCategories];
    const category = allCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Kategori';
  };

  const recentTransactions = getRecentTransactionsForCard(selectedAccount?.id);

  const handleCreateCard = () => {
    if (!selectedCardType) return;
    const id = `acc-${Date.now()}`;
    const base = {
      id,
      name: newCardName || getCardType(selectedCardType),
      bankName: newBankName || 'Banka',
      type: selectedCardType,
      currency: newDefaultCurrency || 'TRY',
      color: '#6C63FF',
      icon: getCardIcon(selectedCardType),
      isDefault: false,
    };
    let newAcc;
    if (isCreditType(selectedCardType)) {
      const limit = parseFloat(newCreditLimit) || 0;
      newAcc = {
        ...base,
        balance: 0,
        creditLimit: limit,
        availableCredit: limit,
        interestRate: parseFloat(newInterestRate) || 0,
      };
    } else if (selectedCardType === 'prepaid' || selectedCardType === 'gift') {
      newAcc = {
        ...base,
        balance: parseFloat(newInitialBalance) || 0,
      };
    } else if (selectedCardType === 'multicurrency') {
      newAcc = {
        ...base,
        balance: 0,
        defaultCurrency: newDefaultCurrency || 'TRY',
      };
    } else if (selectedCardType === 'fuel') {
      newAcc = {
        ...base,
        balance: 0,
        monthlyLimit: parseFloat(newMonthlyLimit) || 0,
      };
    } else if (selectedCardType === 'debit') {
      newAcc = {
        ...base,
        balance: parseFloat(newInitialBalance) || 0,
      };
    } else {
      newAcc = { ...base, balance: 0 };
    }

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    setAddCardModalVisible(false);
    setSelectedCard(updated.length - 1);
    setSelectedAccount(newAcc);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: (updated.length - 1) * (CARD_WIDTH + theme.spacing.md), animated: true });
    }, 50);
    setNewCardName('');
    setNewBankName('');
    setNewCreditLimit('');
    setNewInterestRate('');
    setNewInitialBalance('');
    setNewParentCard('');
    setNewMonthlyLimit('');
    setNewDefaultCurrency('TRY');
    Alert.alert('Başarılı', 'Kart eklendi');
  };

  // Bakiye güncelleme fonksiyonu
  const handleBalanceUpdate = () => {
    if (!updateAmount || !updateType) return;
    
    const amount = parseFloat(updateAmount);
    if (isNaN(amount)) return;

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === selectedAccount.id) {
        if (isCreditType(acc.type)) {
          // Kredi kartı için kullanılabilir limit güncelleme
          const newAvailableCredit = updateType === 'add' 
            ? acc.availableCredit + amount 
            : acc.availableCredit - amount;
          
          return {
            ...acc,
            availableCredit: Math.max(0, newAvailableCredit),
            balance: acc.creditLimit - newAvailableCredit
          };
        } else {
          // Diğer kart türleri için bakiye güncelleme
          const newBalance = updateType === 'add' 
            ? acc.balance + amount 
            : acc.balance - amount;
          
          return { ...acc, balance: newBalance };
        }
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setSelectedAccount(updatedAccounts.find(acc => acc.id === selectedAccount.id));
    setBalanceUpdateModalVisible(false);
    setUpdateAmount('');
    setUpdateType('');
    
    Alert.alert('Başarılı', 'Kart bakiyesi güncellendi');
  };

  // Ödeme hatırlatması kontrolü
  const checkPaymentReminder = () => {
    if (!selectedAccount || !isCreditType(selectedAccount.type)) return;
    const due = parseDateMaybe(selectedAccount.dueDate);
    if (!due) return;
    const today = new Date();
    if (today > due && (selectedAccount.balance || 0) < 0) {
      setPaymentReminderModalVisible(true);
    }
  };

  // Ödeme işlemi
  const handlePayment = () => {
    if (!paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount)) return;

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === selectedAccount.id) {
        const newBalance = acc.balance + amount; // Ödeme yapıldığında balance artar
        const newAvailableCredit = acc.creditLimit + newBalance; // Kullanılabilir limit artar
        
        return {
          ...acc,
          balance: newBalance,
          availableCredit: newAvailableCredit,
          lastPaymentDate: new Date().toISOString(),
          lastPaymentAmount: amount
        };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setSelectedAccount(updatedAccounts.find(acc => acc.id === selectedAccount.id));
    setPaymentReminderModalVisible(false);
    setPaymentAmount('');
    
    Alert.alert('Başarılı', `Ödeme kaydedildi: ${formatCurrency(amount)}`);
  };

  // Kart seçildiğinde ödeme hatırlatması kontrol et
  useEffect(() => {
    if (selectedAccount) {
      checkPaymentReminder();
    }
  }, [selectedAccount]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Kartlarım</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setCardTypeModalVisible(true)}
          >
            <MaterialIcons name="add" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Cards Carousel */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + theme.spacing.md}
            decelerationRate="fast"
            contentContainerStyle={styles.cardsContainer}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + theme.spacing.md));
              setSelectedCard(index);
              setSelectedAccount(testUser.accounts[index]);
            }}
            onScrollEndDrag={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + theme.spacing.md));
              setSelectedCard(index);
              setSelectedAccount(testUser.accounts[index]);
            }}
          >
            {testUser.accounts.map((item, index) => (
              <View key={item.id}>
                {renderCard(item, index)}
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Card Indicators */}
        <View style={styles.indicators}>
          {testUser.accounts.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                selectedCard === index && styles.indicatorActive
              ]}
            />
          ))}
        </View>

        {/* Selected Card Details */}
        {selectedAccount && (
          <View style={styles.cardDetailsContainer}>
            <Text style={styles.sectionTitle}>{selectedAccount.name} Detayları</Text>
            
            {/* Account Summary */}
            <View style={styles.accountSummary}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Hesap Türü</Text>
                  <Text style={styles.summaryValue}>{getCardType(selectedAccount.type)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Banka</Text>
                  <Text style={styles.summaryValue}>{selectedAccount.bankName || 'Banka'}</Text>
                </View>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    {selectedAccount.type === 'credit' ? 'Kredi Limiti' : 'Bakiye'}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(selectedAccount.type === 'credit' ? (selectedAccount.creditLimit || 20000) : selectedAccount.balance)}
                  </Text>
                </View>
                {selectedAccount.type === 'credit' && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Kullanılan Kredi</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(Math.abs(selectedAccount.balance))}
                    </Text>
                  </View>
                )}
              </View>
              
              {selectedAccount.type === 'credit' && (
                <View style={styles.creditDetails}>
                  <View style={styles.creditProgressContainer}>
                    <View style={styles.creditProgressHeader}>
                      <Text style={styles.creditProgressLabel}>Kredi Kullanım Oranı</Text>
                      <Text style={styles.creditProgressPercentage}>
                        %{Math.min((Math.abs(selectedAccount.balance) / (selectedAccount.creditLimit || 20000)) * 100, 100).toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.creditProgressBar}>
                      <View style={[
                        styles.creditProgressFill,
                        {
                          width: `${Math.min((Math.abs(selectedAccount.balance) / (selectedAccount.creditLimit || 20000)) * 100, 100)}%`,
                          backgroundColor: Math.abs(selectedAccount.balance) / (selectedAccount.creditLimit || 20000) > 0.8 ? '#F56565' :
                                         Math.abs(selectedAccount.balance) / (selectedAccount.creditLimit || 20000) > 0.6 ? '#ED8936' : '#48BB78'
                        }
                      ]} />
                    </View>
                  </View>
                  
                  <View style={styles.creditInfoGrid}>
                    <View style={styles.creditInfoItem}>
                      <Text style={styles.creditInfoLabel}>Hesap Kesim</Text>
                      <Text style={styles.creditInfoValue}>
                        {selectedAccount.statementDate || '20 Şubat 2024'}
                      </Text>
                    </View>
                    <View style={styles.creditInfoItem}>
                      <Text style={styles.creditInfoLabel}>Son Ödeme</Text>
                      <Text style={styles.creditInfoValue}>
                        {selectedAccount.dueDate || '15 Mart 2024'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.creditInfoGrid}>
                    <View style={styles.creditInfoItem}>
                      <Text style={styles.creditInfoLabel}>Asgari Ödeme</Text>
                      <Text style={styles.creditInfoValue}>
                        {formatCurrency(selectedAccount.previousPeriodDebt ? selectedAccount.previousPeriodDebt * 0.05 : (selectedAccount.creditLimit || 20000) * 0.05)}
                      </Text>
                    </View>
                    <View style={styles.creditInfoItem}>
                      <Text style={styles.creditInfoLabel}>Mevcut Dönem</Text>
                      <Text style={styles.creditInfoValue}>
                        {formatCurrency(selectedAccount.currentPeriodSpending || 0)}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Dönem Açıklaması */}
                  <View style={styles.periodExplanation}>
                    <MaterialIcons name="info" size={16} color={theme.colors.primary} />
                    <Text style={styles.periodExplanationText}>
                      Hesap kesim tarihinden sonraki harcamalar bir sonraki döneme ait olup, 
                      asgari ödeme sadece önceki dönem borcundan hesaplanır.
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.cardDetailsSection}>
              <Text style={styles.sectionTitle}>Kart Detayları</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Kart Türü:</Text>
                <Text style={styles.detailValue}>{getCardType(selectedAccount.type)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Banka:</Text>
                <Text style={styles.detailValue}>{selectedAccount.bankName}</Text>
              </View>

              {isCreditType(selectedAccount.type) ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Kredi Limiti:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(selectedAccount.creditLimit)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Kullanılabilir Limit:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(selectedAccount.availableCredit)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Kullanılan Limit:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(Math.abs(selectedAccount.balance))}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Faiz Oranı:</Text>
                    <Text style={styles.detailValue}>%{selectedAccount.interestRate}</Text>
                  </View>
                  {selectedAccount.statementDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hesap Kesim:</Text>
                      <Text style={styles.detailValue}>
                        {formatDateDisplay(selectedAccount.statementDate)}
                      </Text>
                    </View>
                  )}
                  {selectedAccount.dueDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Son Ödeme:</Text>
                      <Text style={styles.detailValue}>
                        {formatDateDisplay(selectedAccount.dueDate)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Asgari Ödeme:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(selectedAccount.minimumPayment)}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bakiye:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedAccount.balance)}</Text>
                </View>
              )}

              {/* Bakiye Güncelleme Butonu */}
              <TouchableOpacity 
                style={styles.updateBalanceButton}
                onPress={() => setBalanceUpdateModalVisible(true)}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.updateBalanceGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="update" size={20} color="#FFFFFF" />
                  <Text style={styles.updateBalanceText}>Bakiye Güncelle</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.transactionsContainer}>
            <Text style={styles.sectionTitle}>Son İşlemler</Text>
            <View style={styles.transactionsList}>
              {recentTransactions.map(renderTransactionItem)}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <MaterialIcons name="receipt" size={24} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Fiş Tara</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <MaterialIcons name="add-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>İşlem Ekle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <MaterialIcons name="history" size={24} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Geçmiş</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <MaterialIcons name="settings" size={24} color={theme.colors.primary} />
              <Text style={styles.quickActionText}>Ayarlar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Card Settings Modal */}
      <CardSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        selectedAccount={selectedAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Card Type Selection Modal */}
      <Modal
        visible={cardTypeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCardTypeModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setCardTypeModalVisible(false)} 
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Kart Türü Seçin</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.cardTypeOptions}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardTypeScrollContent}>
              {[
                { key: 'credit', title: 'Kredi Kartı', icon: 'credit-card', colors: ['#f093fb', '#f5576c'], desc: 'Kredi limiti ve ödeme bilgileriyle' },
                { key: 'debit', title: 'Banka Kartı (Debit)', icon: 'account-balance-wallet', colors: ['#667eea', '#764ba2'], desc: 'Vadesiz hesap bakiyesi ile harcama' },
                { key: 'savings', title: 'Tasarruf Hesabı', icon: 'savings', colors: ['#4facfe', '#00f2fe'], desc: 'Faiz kazancı için' },
                { key: 'virtual', title: 'Sanal Kart', icon: 'phonelink', colors: ['#f093fb', '#f5576c'], desc: 'Çevrimiçi ödemeler için limitli kart' },
                { key: 'supplementary', title: 'Ek Kart', icon: 'person-add-alt', colors: ['#f093fb', '#f5576c'], desc: 'Ana kredi kartına bağlı' },
                { key: 'business', title: 'Kurumsal Kart', icon: 'business-center', colors: ['#f093fb', '#f5576c'], desc: 'Şirket harcamaları için' },
                { key: 'prepaid', title: 'Ön Ödemeli Kart', icon: 'card-giftcard', colors: ['#ff9966', '#ff5e62'], desc: 'Yükledikçe harca' },
                { key: 'gift', title: 'Hediye Kartı', icon: 'card-giftcard', colors: ['#ff9966', '#ff5e62'], desc: 'Hediye amaçlı bakiye' },
                { key: 'multicurrency', title: 'Çok Para Birimli Kart', icon: 'public', colors: ['#36d1dc', '#5b86e5'], desc: 'Birden fazla para birimi desteği' },
                { key: 'fuel', title: 'Akaryakıt Kartı', icon: 'local-gas-station', colors: ['#43cea2', '#185a9d'], desc: 'Akaryakıt harcamaları için' },
              ].map((t) => (
                <TouchableOpacity 
                  key={t.key}
                  style={styles.cardTypeOption}
                  onPress={() => {
                    setSelectedCardType(t.key);
                    setCardTypeModalVisible(false);
                    setAddCardModalVisible(true);
                  }}
                >
                  <LinearGradient colors={t.colors} style={styles.cardTypeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <MaterialIcons name={t.icon} size={48} color="#FFFFFF" />
                    <Text style={styles.cardTypeTitle}>{t.title}</Text>
                    <Text style={styles.cardTypeDescription}>{t.desc}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Card Modal */}
      <Modal
        visible={addCardModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddCardModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
        >
          <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setAddCardModalVisible(false)} 
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedCardType === 'credit' ? 'Kredi Kartı Ekle' :
               selectedCardType === 'savings' ? 'Tasarruf Hesabı Ekle' : 'Vadesiz Hesap Ekle'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.addCardForm} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Kart/Hesap Adı</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Örn: Ana Kart"
                placeholderTextColor={theme.colors.textSecondary}
                value={newCardName}
                onChangeText={setNewCardName}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Banka Adı</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Örn: Yapı Kredi"
                placeholderTextColor={theme.colors.textSecondary}
                value={newBankName}
                onChangeText={setNewBankName}
              />
            </View>

            {isCreditType(selectedCardType) && (
              <>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Kredi Limiti</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={newCreditLimit}
                    onChangeText={setNewCreditLimit}
                  />
                </View>
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Aylık Faiz Oranı (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="3.99"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    value={newInterestRate}
                    onChangeText={setNewInterestRate}
                  />
                </View>
              </>
            )}

            {(selectedCardType === 'debit' || selectedCardType === 'savings' || selectedCardType === 'prepaid' || selectedCardType === 'gift') && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Başlangıç Bakiyesi</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={newInitialBalance}
                  onChangeText={setNewInitialBalance}
                />
              </View>
            )}

            {selectedCardType === 'multicurrency' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Varsayılan Para Birimi</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="TRY, USD, EUR..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newDefaultCurrency}
                  onChangeText={setNewDefaultCurrency}
                />
              </View>
            )}

            {selectedCardType === 'fuel' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Aylık Limit</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={newMonthlyLimit}
                  onChangeText={setNewMonthlyLimit}
                />
              </View>
            )}

            <TouchableOpacity style={styles.addButton} onPress={handleCreateCard}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.addButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.addButtonText}>Kartı Ekle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Balance Update Modal */}
      <Modal
        visible={balanceUpdateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBalanceUpdateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
        >
          <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setBalanceUpdateModalVisible(false)} 
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Bakiye Güncelle</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.addCardForm} showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Mevcut Bakiye</Text>
              <Text style={[styles.formInput, styles.formInputDisabled]}>{formatCurrency(selectedAccount.balance)}</Text>
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Güncellenecek Miktar</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={updateAmount}
                onChangeText={setUpdateAmount}
              />
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>İşlem Tipi</Text>
              <TouchableOpacity 
                style={styles.formInput}
                onPress={() => setUpdateType(updateType === 'add' ? 'subtract' : 'add')}
              >
                <Text style={styles.formInputText}>
                  {updateType === 'add' ? 'Bakiyeye Ekle' : 'Bakiyeden Çıkar'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleBalanceUpdate}>
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.addButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.addButtonText}>Bakiye Güncelle</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Reminder Modal */}
      <Modal
        visible={paymentReminderModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPaymentReminderModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
        >
          <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setPaymentReminderModalVisible(false)} 
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ödeme Hatırlatması</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.paymentReminderContent}>
            <View style={styles.reminderIcon}>
              <MaterialIcons name="payment" size={64} color={theme.colors.warning} />
            </View>
            
            <Text style={styles.reminderTitle}>
              {selectedAccount?.name} kartınızın ödeme tarihi geçti!
            </Text>
            
            <Text style={styles.reminderDescription}>
              Son ödeme tarihi: {formatDateDisplay(selectedAccount?.dueDate)}
            </Text>
            
            <Text style={styles.reminderAmount}>
              Ödenecek tutar: {formatCurrency(Math.abs(selectedAccount?.balance || 0))}
            </Text>

            <View style={styles.paymentForm}>
              <Text style={styles.formLabel}>Ödediğiniz Miktar</Text>
              <TextInput
                style={styles.formInput}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
            </View>

            <View style={styles.paymentActions}>
              <TouchableOpacity 
                style={styles.paymentButton}
                onPress={handlePayment}
              >
                <LinearGradient
                  colors={[theme.colors.success, '#38A169']}
                  style={styles.paymentButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.paymentButtonText}>Ödeme Yapıldı</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.remindLaterButton}
                onPress={() => setPaymentReminderModalVisible(false)}
              >
                <Text style={styles.remindLaterText}>Daha Sonra Hatırlat</Text>
              </TouchableOpacity>
            </View>
          </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: theme.spacing.lg,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: theme.spacing.md,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  
  card: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'space-between',
    borderRadius: 25,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },

  cardType: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardTypeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // New styles for the new card layout
  bankNameContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },

  bankNameLarge: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },

  balanceContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },

  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },

  balanceAmount: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },

  limitInfoContainer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  cardLimit: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  usedCredit: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },


  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textSecondary,
    marginHorizontal: 4,
  },
  
  indicatorActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  
  featuresContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  featureCard: {
    width: '48%',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  featureGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
  },
  
  featureTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  transactionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  
  transactionsList: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
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
  
  transactionDetails: {
    flex: 1,
  },
  
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  
  transactionCategory: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  
  transactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  quickActionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  quickActionCard: {
    width: '48%',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },

  // Card Details Styles
  cardDetailsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },

  accountSummary: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  summaryValue: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  creditDetails: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },

  creditProgressContainer: {
    marginBottom: theme.spacing.lg,
  },

  creditProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  creditProgressLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  creditProgressPercentage: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  creditProgressBar: {
    height: 10,
    backgroundColor: theme.colors.background,
    borderRadius: 5,
    overflow: 'hidden',
  },

  creditProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  creditInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  creditInfoItem: {
    flex: 1,
    alignItems: 'center',
  },

  creditInfoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  creditInfoValue: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Period Explanation Styles
  periodExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '08',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },

  periodExplanationText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
    marginLeft: theme.spacing.sm,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.cards,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },

  placeholder: {
    width: 44,
  },

  cardTypeOptions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  cardTypeScrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  cardTypeOption: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  cardTypeGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
  },

  cardTypeTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },

  cardTypeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Add Card Modal Styles
  addCardForm: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  formSection: {
    marginBottom: theme.spacing.md,
  },

  formLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },

  formInput: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  addButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },

  addButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },

  addButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // New styles for balance update modal
  updateBalanceButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },

  updateBalanceGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },

  updateBalanceText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // New styles for detail rows in card details section
  cardDetailsSection: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginTop: theme.spacing.lg,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  detailLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  detailValue: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  // Payment Reminder Modal Styles
  paymentReminderContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },

  reminderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  reminderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },

  reminderDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },

  reminderAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.warning,
    marginBottom: theme.spacing.md,
  },

  paymentForm: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },

  paymentActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing.md,
  },

  paymentButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },

  paymentButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },

  paymentButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  remindLaterButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },

  remindLaterText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // New styles for disabled input in balance update modal
  formInputDisabled: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textSecondary,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    textAlign: 'center',
  },

  formInputText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});

export default CardsScreen;