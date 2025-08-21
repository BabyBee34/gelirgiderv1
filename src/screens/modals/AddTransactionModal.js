// FinanceFlow - Add Transaction Modal
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { testUser, testFunctions } from '../../utils/testData';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../utils/formatters';
import { transactionStorage } from '../../utils/storage';
import { formValidation, VALIDATION_SCHEMAS } from '../../utils/validation';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

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
    return transactionType === 'income' ? [100, 500, 1000, 5000] : [10, 25, 50, 100];
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(formatCurrencyInput(quickAmount.toString()));
  };

  const handleSave = async () => {
    if (!amount || !selectedCategory || !selectedAccount) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    const validation = formValidation.validate(VALIDATION_SCHEMAS.TRANSACTION, {
      amount: parseCurrency(amount),
      description,
      categoryId: selectedCategory.id,
      accountId: selectedAccount.id,
      date: date.toISOString()
    });

    if (!validation.isValid) {
      Alert.alert('Hata', validation.errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const transaction = {
        id: `trx-${Date.now()}`,
        type: transactionType,
        amount: parseCurrency(amount),
        description: description.trim() || selectedCategory.name,
        categoryId: selectedCategory.id,
        accountId: selectedAccount.id,
        date: date.toISOString(),
        createdAt: new Date().toISOString()
      };

      await transactionStorage.addTransaction(transaction);
      
      Alert.alert(
        'Başarılı', 
        `${transactionType === 'income' ? 'Gelir' : 'Gider'} başarıyla eklendi`,
        [{ text: 'Tamam', onPress: () => {
          onTransactionAdded?.(transaction);
          handleClose();
        }}]
      );
    } catch (error) {
      Alert.alert('Hata', 'İşlem eklenirken bir hata oluştu');
      console.error('Transaction save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategorySelector = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const categories = getCategories();
    
    // Arama filtreleme
    const filteredCategories = categories.filter(category => {
      const query = searchQuery.toLowerCase();
      return (
        category.name.toLowerCase().includes(query) ||
        (category.tags && category.tags.some(tag => tag.toLowerCase().includes(query))) ||
        (category.isPlatform && category.platformName && category.platformName.toLowerCase().includes(query))
      );
    });

    const platformCategories = filteredCategories.filter(cat => cat.isPlatform);
    const regularCategories = filteredCategories.filter(cat => !cat.isPlatform);

    return (
      <Modal visible={showCategories} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kategori Seçin</Text>
            <TouchableOpacity onPress={() => setShowCategories(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          {/* Arama Çubuğu */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Kategori ara..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="clear" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <ScrollView style={styles.categoriesGrid}>
            {/* Genel Kategoriler */}
            {regularCategories.length > 0 && (
              <>
                <Text style={styles.categoryGroupTitle}>Genel Kategoriler</Text>
                {regularCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory?.id === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      // Platform seçildiğinde aylık ücreti otomatik doldur
                      if (category.isPlatform && category.monthlyFee) {
                        setAmount(formatCurrencyInput(category.monthlyFee.toString()));
                      }
                      setShowCategories(false);
                    }}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                      <MaterialIcons name={category.icon} size={24} color={category.color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      {category.tags && (
                        <Text style={styles.categoryTags}>
                          {category.tags.slice(0, 3).join(' • ')}
                        </Text>
                      )}
                    </View>
                    {selectedCategory?.id === category.id && (
                      <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Sosyal Medya & Abonelikler */}
            {transactionType === 'expense' && platformCategories.length > 0 && (
              <>
                <Text style={styles.categoryGroupTitle}>Sosyal Medya & Abonelikler</Text>
                {platformCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      styles.platformCategoryItem,
                      selectedCategory?.id === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => {
                      setSelectedCategory(category);
                      // Platform seçildiğinde aylık ücreti otomatik doldur
                      if (category.isPlatform && category.monthlyFee) {
                        setAmount(formatCurrencyInput(category.monthlyFee.toString()));
                      }
                      setShowCategories(false);
                    }}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                      <MaterialIcons name={category.icon} size={24} color={category.color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryTags}>
                        {category.platformName || category.name} • Abonelik
                      </Text>
                      {category.monthlyFee && (
                        <Text style={styles.categoryFee}>
                          Aylık: {formatCurrency(category.monthlyFee)}
                        </Text>
                      )}
                    </View>
                    {selectedCategory?.id === category.id && (
                      <MaterialIcons name="check-circle" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Arama sonucu yoksa */}
            {filteredCategories.length === 0 && searchQuery.length > 0 && (
              <View style={styles.noResultsContainer}>
                <MaterialIcons name="search-off" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.noResultsText}>"{searchQuery}" için sonuç bulunamadı</Text>
                <Text style={styles.noResultsSubtext}>Farklı anahtar kelimeler deneyin</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

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
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
            style={styles.content}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
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
    borderBottomColor: theme.colors.border,
  },

  modalTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  categoriesGrid: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },

  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.md,
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
    backgroundColor: `${theme.colors.primary}10`,
  },

  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  categoryTags: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  categoryFee: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },

  categoryGroupTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },

  platformCategoryItem: {
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },

  platformInfo: {
    flex: 1,
  },

  platformFee: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
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

  // Search styles
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
    paddingHorizontal: theme.spacing.md,
  },

  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },

  noResultsText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },

  noResultsSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default AddTransactionModal;
