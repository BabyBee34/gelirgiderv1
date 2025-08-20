// FinanceFlow - Transactions Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Animated, RefreshControl, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';
import { testUser } from '../../utils/testData';
import { formatCurrency } from '../../utils/formatters';
import DetailedAddTransactionModal from '../modals/DetailedAddTransactionModal';

const { width } = Dimensions.get('window');

const TransactionsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addTransactionVisible, setAddTransactionVisible] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [transactionType, setTransactionType] = useState('expense');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };



  const getCategoryInfo = (categoryId) => {
    if (!testUser.categories) {
      return { name: 'Kategori', icon: 'category', color: '#718096' };
    }
    
    const allCategories = [
      ...(testUser.categories.income || []), 
      ...(testUser.categories.expense || [])
    ];
    const category = allCategories.find(cat => cat.id === categoryId);
    return category || { name: 'Kategori', icon: 'category', color: '#718096' };
  };

  const getFilteredTransactions = () => {
    let filtered = [...testUser.transactions];
    
    // Filter by type
    if (selectedFilter === 'income') {
      filtered = filtered.filter(t => t.type === 'income');
    } else if (selectedFilter === 'expense') {
      filtered = filtered.filter(t => t.type === 'expense');
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(transaction => {
        const category = getCategoryInfo(transaction.categoryId);
        return (
          transaction.description.toLowerCase().includes(query) ||
          category.name.toLowerCase().includes(query) ||
          (transaction.tags && transaction.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      });
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const start = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
        const end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : null;
        
        if (start && end) {
          return transactionDate >= start && transactionDate <= end;
        } else if (start) {
          return transactionDate >= start;
        } else if (end) {
          return transactionDate <= end;
        }
        
        return true;
      });
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const groupTransactionsByDate = (transactions) => {
    const grouped = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });
    
    return Object.entries(grouped).map(([date, transactions]) => ({
      date,
      transactions,
      totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    }));
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderFilterButton = (filter, label) => {
    const isActive = selectedFilter === filter;
    
    // Icon mappings
    const iconMap = {
      'all': 'apps',
      'income': 'trending-up', 
      'expense': 'trending-down'
    };
    
    const colorMap = {
      'all': theme.colors.primary,
      'income': '#48BB78',
      'expense': '#F56565'
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.modernFilterButton,
          isActive && [styles.modernFilterButtonActive, { backgroundColor: colorMap[filter] }]
        ]}
        onPress={() => setSelectedFilter(filter)}
      >
        <MaterialIcons 
          name={iconMap[filter]} 
          size={18} 
          color={isActive ? '#ffffff' : colorMap[filter]} 
        />
        <Text style={[
          styles.modernFilterButtonText,
          isActive && styles.modernFilterButtonTextActive
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTransactionItem = ({ item }) => {
    const category = getCategoryInfo(item.categoryId);
    const account = testUser.accounts.find(acc => acc.id === item.accountId);
    
    return (
      <TouchableOpacity style={styles.transactionItem}>
        <View style={[styles.transactionIcon, { backgroundColor: `${category.color}15` }]}>
          <MaterialIcons 
            name={category.icon} 
            size={24} 
            color={category.color} 
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.description}</Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionCategory}>{category.name}</Text>
            {account && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.transactionAccount}>{account.name}</Text>
              </>
            )}
          </View>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'income' ? theme.colors.success : theme.colors.error }
          ]}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
          <Text style={styles.transactionTime}>
            {new Date(item.date).toLocaleTimeString('tr-TR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({ item }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formatRelativeDate(item.date)}</Text>
        <View style={styles.dateSummary}>
          {item.totalIncome > 0 && (
            <Text style={styles.dateIncome}>+{formatCurrency(item.totalIncome)}</Text>
          )}
          {item.totalExpense > 0 && (
            <Text style={styles.dateExpense}>-{formatCurrency(item.totalExpense)}</Text>
          )}
        </View>
      </View>
      {item.transactions.map((transaction, index) => (
        <View key={transaction.id}>
          {renderTransactionItem({ item: transaction })}
        </View>
      ))}
    </View>
  );

  const filteredTransactions = getFilteredTransactions();
  const groupedTransactions = groupTransactionsByDate(filteredTransactions);
  
  // Sayfalama için grup sayısını hesapla
  const totalPages = Math.ceil(groupedTransactions.length / itemsPerPage);
  const paginatedGroups = groupedTransactions.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const getTotalStats = () => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return { income, expenses };
  };

  const totalStats = getTotalStats();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>İşlemler</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setSearchVisible(!searchVisible)}
          >
            <MaterialIcons name="search" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              setTransactionType('expense');
              setAddTransactionVisible(true);
            }}
          >
            <MaterialIcons name="add" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="İşlem, kategori veya etiket ara..."
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Summary Stats */}
      <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.summaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="trending-up" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.summaryLabel}>Toplam Gelir</Text>
              <Text style={styles.summaryAmount}>+{formatCurrency(totalStats.income)}</Text>
            </View>
            <View style={styles.summarySeparator} />
            <View style={styles.summaryItem}>
              <MaterialIcons name="trending-down" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.summaryLabel}>Toplam Gider</Text>
              <Text style={styles.summaryAmount}>-{formatCurrency(totalStats.expenses)}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Tümü')}
        {renderFilterButton('income', 'Gelir')}
        {renderFilterButton('expense', 'Gider')}
        
        {/* Date Filter Button */}
        <TouchableOpacity 
          style={[
            styles.modernFilterButton, 
            (startDate || endDate) && [styles.modernFilterButtonActive, { backgroundColor: '#ED8936' }]
          ]}
          onPress={() => setShowDateFilter(true)}
        >
          <MaterialIcons 
            name="date-range" 
            size={18} 
            color={(startDate || endDate) ? '#ffffff' : '#ED8936'} 
          />
          <Text style={[
            styles.modernFilterButtonText,
            (startDate || endDate) && styles.modernFilterButtonTextActive
          ]}>
            Tarih
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Active Date Filter Display */}
      {(startDate || endDate) && (
        <View style={styles.activeDateFilter}>
          <View style={styles.dateFilterInfo}>
            <MaterialIcons name="filter-list" size={16} color={theme.colors.primary} />
            <Text style={styles.dateFilterText}>
              {startDate && endDate 
                ? `${startDate.toLocaleDateString('tr-TR')} - ${endDate.toLocaleDateString('tr-TR')}`
                : startDate 
                ? `${startDate.toLocaleDateString('tr-TR')} sonrası`
                : `${endDate.toLocaleDateString('tr-TR')} öncesi`
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.clearDateFilter}
            onPress={() => {
              setStartDate(null);
              setEndDate(null);
            }}
          >
            <MaterialIcons name="clear" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Action Buttons */}
      <View style={styles.quickActionContainer}>
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: '#48BB78' }]}
          onPress={() => {
            setTransactionType('income');
            setAddTransactionVisible(true);
          }}
        >
          <MaterialIcons name="trending-up" size={20} color="#FFFFFF" />
          <Text style={styles.quickActionText}>Gelir Ekle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: '#F56565' }]}
          onPress={() => {
            setTransactionType('expense');
            setAddTransactionVisible(true);
          }}
        >
          <MaterialIcons name="trending-down" size={20} color="#FFFFFF" />
          <Text style={styles.quickActionText}>Gider Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={paginatedGroups}
        renderItem={renderDateGroup}
        keyExtractor={(item) => item.date}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={() => (
          totalPages > 1 ? (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? theme.colors.textSecondary : theme.colors.primary} />
              </TouchableOpacity>
              
              <View style={styles.paginationInfo}>
                <Text style={styles.paginationText}>
                  {currentPage} / {totalPages}
                </Text>
                <Text style={styles.paginationSubText}>
                  {filteredTransactions.length} işlem
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <MaterialIcons name="chevron-right" size={20} color={currentPage === totalPages ? theme.colors.textSecondary : theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons 
              name={searchQuery ? "search-off" : "receipt-long"} 
              size={64} 
              color={theme.colors.textSecondary} 
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz işlem yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Farklı anahtar kelimeler deneyin' 
                : 'İlk işleminizi ekleyerek başlayın'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => {
                  setTransactionType('expense');
                  setAddTransactionVisible(true);
                }}
              >
                <Text style={styles.emptyButtonText}>İşlem Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Detailed Add Transaction Modal */}
      <DetailedAddTransactionModal
        visible={addTransactionVisible}
        onClose={() => setAddTransactionVisible(false)}
        type={transactionType}
      />
      
      {/* Date Filter Modal */}
      <Modal
        visible={showDateFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateFilterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tarih Filtreleme</Text>
              <TouchableOpacity onPress={() => setShowDateFilter(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateFilterContent}>
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerLabel}>Başlangıç Tarihi</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <MaterialIcons name="event" size={20} color={theme.colors.primary} />
                  <Text style={styles.datePickerText}>
                    {startDate ? startDate.toLocaleDateString('tr-TR') : 'Tarih seçin'}
                  </Text>
                </TouchableOpacity>
                {startDate && (
                  <TouchableOpacity 
                    style={styles.clearDateButton}
                    onPress={() => setStartDate(null)}
                  >
                    <Text style={styles.clearDateText}>Temizle</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerLabel}>Bitiş Tarihi</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <MaterialIcons name="event" size={20} color={theme.colors.primary} />
                  <Text style={styles.datePickerText}>
                    {endDate ? endDate.toLocaleDateString('tr-TR') : 'Tarih seçin'}
                  </Text>
                </TouchableOpacity>
                {endDate && (
                  <TouchableOpacity 
                    style={styles.clearDateButton}
                    onPress={() => setEndDate(null)}
                  >
                    <Text style={styles.clearDateText}>Temizle</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Quick Date Options */}
              <View style={styles.quickDateOptions}>
                <Text style={styles.quickDateTitle}>Hızlı Seçim</Text>
                <View style={styles.quickDateGrid}>
                  <TouchableOpacity 
                    style={styles.quickDateButton}
                    onPress={() => {
                      const today = new Date();
                      setStartDate(today);
                      setEndDate(today);
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Bugün</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickDateButton}
                    onPress={() => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      setStartDate(yesterday);
                      setEndDate(yesterday);
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Dün</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickDateButton}
                    onPress={() => {
                      const today = new Date();
                      const weekStart = new Date(today);
                      weekStart.setDate(today.getDate() - 7);
                      setStartDate(weekStart);
                      setEndDate(today);
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Son 7 Gün</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.quickDateButton}
                    onPress={() => {
                      const today = new Date();
                      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                      setStartDate(monthStart);
                      setEndDate(today);
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Bu Ay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setShowDateFilter(false);
                }}
              >
                <Text style={styles.modalCancelText}>Temizle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={() => {
                  setCurrentPage(1); // Reset sayfa
                  setShowDateFilter(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
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

  headerActions: {
    flexDirection: 'row',
  },

  headerButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },

  searchContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },

  summaryCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  summaryGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },

  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  summaryAmount: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  summarySeparator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: theme.spacing.lg,
  },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },

  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },

  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  filterButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  quickActionContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  quickActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },

  listContainer: {
    paddingBottom: theme.spacing.xl,
  },

  dateGroup: {
    marginBottom: theme.spacing.lg,
  },

  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },

  dateText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  dateSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateIncome: {
    fontSize: 14,
    color: theme.colors.success,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },

  dateExpense: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '600',
  },

  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },

  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  transactionDetails: {
    flex: 1,
  },

  transactionTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },

  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  transactionCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  metaSeparator: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },

  transactionAccount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  tagsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },

  tag: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
  },

  tagText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  transactionRight: {
    alignItems: 'flex-end',
  },

  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  transactionTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },

  emptyTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },

  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },

  emptyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Date Filter Styles
  activeDateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary + '10',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  
  dateFilterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  dateFilterText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  
  clearDateFilter: {
    padding: theme.spacing.xs,
  },
  
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cards,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  
  paginationButtonDisabled: {
    opacity: 0.3,
  },
  
  paginationInfo: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  
  paginationText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  
  paginationSubText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  dateFilterModal: {
    backgroundColor: theme.colors.cards,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
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
  
  dateFilterContent: {
    padding: theme.spacing.lg,
  },
  
  datePickerSection: {
    marginBottom: theme.spacing.lg,
  },
  
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  datePickerText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  
  clearDateText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  
  quickDateOptions: {
    marginTop: theme.spacing.md,
  },
  
  quickDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  
  quickDateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  quickDateButton: {
    width: '48%',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  
  quickDateButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  
  modalCancelText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  
  modalConfirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  
  modalConfirmText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Modern filter styles
  modernFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.cards,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 85,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  modernFilterButtonActive: {
    borderWidth: 0,
    shadowOpacity: 0.2,
    elevation: 6,
  },

  modernFilterButtonText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },

  modernFilterButtonTextActive: {
    color: '#ffffff',
  },
});

export default TransactionsScreen;