// FinanceFlow - Add Transaction Modal
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { testUser, testFunctions } from '../../utils/testData';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');

const AddTransactionModal = ({ visible, onClose, transactionType = 'expense', onTransactionAdded }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(testUser.accounts[0]);
  const [date, setDate] = useState(new Date());
  const [showCategories, setShowCategories] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    } else {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setSelectedAccount(testUser.accounts[0]);
    setDate(new Date());
    setShowCategories(false);
    setShowAccounts(false);
    setLoading(false);
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

  const getCategories = () => {
    return transactionType === 'income' 
      ? testUser.categories.income 
      : testUser.categories.expense;
  };

  const handleAmountChange = (text) => {
    const formatted = formatCurrencyInput(text);
    setAmount(formatted);
  };

  const getQuickAmounts = () => {
    if (transactionType === 'income') {
      return [100, 500, 1000, 2500, 5000];
    } else {
      return [25, 50, 100, 250, 500];
    }
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(formatCurrencyInput(quickAmount.toString()));
  };

  const handleSave = async () => {
    if (!amount || !selectedCategory || !description.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    const numericAmount = parseCurrency(amount);
    if (numericAmount <= 0) {
      Alert.alert('Geçersiz Tutar', 'Lütfen geçerli bir tutar girin.');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newTransaction = testFunctions.addTestTransaction(
        transactionType,
        numericAmount,
        selectedCategory.id,
        description.trim()
      );

      // Update account balance
      const balanceChange = transactionType === 'income' ? numericAmount : -numericAmount;
      testFunctions.updateAccountBalance(selectedAccount.id, balanceChange);

      if (onTransactionAdded) {
        onTransactionAdded(newTransaction);
      }

      Alert.alert(
        'Başarılı',
        `${transactionType === 'income' ? 'Gelir' : 'Gider'} başarıyla eklendi.`,
        [{ text: 'Tamam', onPress: handleClose }]
      );

    } catch (error) {
      Alert.alert('Hata', 'İşlem eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategorySelector = () => (
    <Modal visible={showCategories} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Kategori Seçin</Text>
          <TouchableOpacity onPress={() => setShowCategories(false)}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.categoriesGrid}>
          {getCategories().map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory?.id === category.id && styles.categoryItemSelected
              ]}
              onPress={() => {
                setSelectedCategory(category);
                setShowCategories(false);
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                <MaterialIcons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              {selectedCategory?.id === category.id && (
                <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderAccountSelector = () => (
    <Modal visible={showAccounts} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Hesap Seçin</Text>
          <TouchableOpacity onPress={() => setShowAccounts(false)}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.accountsList}>
          {testUser.accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.accountItem,
                selectedAccount?.id === account.id && styles.accountItemSelected
              ]}
              onPress={() => {
                setSelectedAccount(account);
                setShowAccounts(false);
              }}
            >
              <View style={[styles.accountIcon, { backgroundColor: `${account.color}15` }]}>
                <MaterialIcons 
                  name={account.type === 'credit' ? 'credit-card' : 'account-balance-wallet'} 
                  size={24} 
                  color={account.color} 
                />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountBalance}>{formatCurrency(account.balance)}</Text>
              </View>
              {selectedAccount?.id === account.id && (
                <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={transactionType === 'income' ? ['#48BB78', '#38A169'] : ['#F56565', '#E53E3E']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>
                {transactionType === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
              </Text>
              
              <TouchableOpacity 
                onPress={handleSave} 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                disabled={loading}
              >
                {loading ? (
                  <MaterialIcons name="hourglass-empty" size={20} color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="check" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Amount Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tutar</Text>
                <View style={styles.amountContainer}>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0,00"
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <Text style={styles.currencySymbol}>₺</Text>
                </View>
                
                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                  {getQuickAmounts().map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      style={styles.quickAmountButton}
                      onPress={() => handleQuickAmount(quickAmount)}
                    >
                      <Text style={styles.quickAmountText}>{quickAmount}₺</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kategori</Text>
                <TouchableOpacity 
                  style={styles.selector}
                  onPress={() => setShowCategories(true)}
                >
                  {selectedCategory ? (
                    <View style={styles.selectedItem}>
                      <View style={[styles.selectedIcon, { backgroundColor: `${selectedCategory.color}15` }]}>
                        <MaterialIcons name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                      </View>
                      <Text style={styles.selectedText}>{selectedCategory.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.placeholderText}>Kategori seçin</Text>
                  )}
                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Account Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hesap</Text>
                <TouchableOpacity 
                  style={styles.selector}
                  onPress={() => setShowAccounts(true)}
                >
                  <View style={styles.selectedItem}>
                    <View style={[styles.selectedIcon, { backgroundColor: `${selectedAccount.color}15` }]}>
                      <MaterialIcons 
                        name={selectedAccount.type === 'credit' ? 'credit-card' : 'account-balance-wallet'} 
                        size={20} 
                        color={selectedAccount.color} 
                      />
                    </View>
                    <Text style={styles.selectedText}>{selectedAccount.name}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Description Input */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Açıklama</Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="İşlem açıklaması..."
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Date Display */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tarih</Text>
                <View style={styles.dateDisplay}>
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>

        {renderCategorySelector()}
        {renderAccountSelector()}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  backdrop: {
    flex: 1,
  },

  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },

  header: {
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.lg,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },

  closeButton: {
    padding: theme.spacing.sm,
  },

  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  saveButton: {
    padding: theme.spacing.sm,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },

  section: {
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },

  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  amountInput: {
    flex: 1,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  currencySymbol: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
  },

  quickAmountButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  quickAmountText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  selectedText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  placeholderText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  descriptionInput: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  dateText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginLeft: theme.spacing.md,
  },

  // Modal styles
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
    borderBottomColor: '#E2E8F0',
  },

  modalTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  categoriesGrid: {
    padding: theme.spacing.lg,
  },

  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },

  categoryItemSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },

  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  categoryName: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  accountsList: {
    padding: theme.spacing.lg,
  },

  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },

  accountItemSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },

  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  accountDetails: {
    flex: 1,
  },

  accountName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },

  accountBalance: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});

export default AddTransactionModal;
