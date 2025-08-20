// FinanceFlow - Detailed Add Transaction Modal
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Dimensions,
  Animated,
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';
import { testUser } from '../../utils/testData';
import { formatCurrency, handleCurrencyInput, currencyToNumber } from '../../utils/formatters';
import { categoryIcons, categoryColors, getIconsByCategory } from '../../utils/iconColorData';

const { width, height } = Dimensions.get('window');

const DetailedAddTransactionModal = ({ visible, onClose, type = 'expense' }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(testUser.accounts[0]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [iconSelectorVisible, setIconSelectorVisible] = useState(false);
  const [colorSelectorVisible, setColorSelectorVisible] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('category');
  const [selectedColor, setSelectedColor] = useState('#6C63FF');
  const [recurringType, setRecurringType] = useState('none');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('category');
  const [customCategoryColor, setCustomCategoryColor] = useState('#6C63FF');
  const [showCustomCategoryForm, setShowCustomCategoryForm] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const categories = type === 'income' ? testUser.incomeCategories : testUser.expenseCategories;
  const platformCategories = categories.filter(cat => cat.isPlatform);
  const regularCategories = categories.filter(cat => !cat.isPlatform);
  const quickAmounts = type === 'income' ? [1000, 2500, 5000, 10000] : [50, 100, 250, 500];

  const recurringOptions = [
    { value: 'daily', label: 'Günlük' },
    { value: 'weekly', label: 'Haftalık' },
    { value: 'monthly', label: 'Aylık' },
    { value: 'yearly', label: 'Yıllık' },
  ];

  const colorOptions = [
    '#6C63FF', '#4ECDC4', '#FFE66D', '#48BB78', '#F56565', 
    '#ED8936', '#9F7AEA', '#38B2AC', '#ECC94B', '#FC8181'
  ];

  const iconOptions = [
    'category', 'shopping-cart', 'local-dining', 'directions-car',
    'home', 'fitness-center', 'school', 'local-hospital',
    'movie', 'flight', 'pets', 'work'
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const handleSave = () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Hata', 'Lütfen miktar ve kategori seçin.');
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      description: description || selectedCategory.name,
      category: selectedCategory,
      account: selectedAccount,
      date: selectedDate.toISOString(),
      notes,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
      createdAt: new Date().toISOString(),
    };

    // Transaction added successfully
    Alert.alert('Başarılı', `${type === 'income' ? 'Gelir' : 'Gider'} başarıyla eklendi.`);
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setSelectedDate(new Date());
    setNotes('');
    setIsRecurring(false);
    setRecurringFrequency('monthly');
    onClose();
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) {
      Alert.alert('Hata', 'Lütfen kategori adını girin.');
      return;
    }

    const newCategory = {
      id: Date.now().toString(),
      name: customCategoryName,
      icon: customCategoryIcon,
      color: customCategoryColor,
      isCustom: true,
    };

    if (type === 'income') {
      testUser.incomeCategories.push(newCategory);
    } else {
      testUser.expenseCategories.push(newCategory);
    }

    setSelectedCategory(newCategory);
    setCustomCategoryName('');
    setCustomCategoryIcon('category');
    setCustomCategoryColor('#6C63FF');
    setShowCustomCategoryForm(false);
    setShowCategoryModal(false);
    Alert.alert('Başarılı', 'Yeni kategori eklendi.');
  };

  const renderQuickAmount = (quickAmount) => (
    <TouchableOpacity
      key={quickAmount}
      style={styles.quickAmountButton}
      onPress={() => setAmount(quickAmount.toString())}
    >
      <Text style={styles.quickAmountText}>{formatCurrency(quickAmount)}</Text>
    </TouchableOpacity>
  );

  const renderCategoryOption = (category) => {
    const isSelected = multiSelectMode 
      ? selectedCategories.some(cat => cat.id === category.id)
      : selectedCategory?.id === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryOption,
          isSelected && styles.categoryOptionSelected
        ]}
        onPress={() => {
          if (multiSelectMode) {
            if (selectedCategories.some(cat => cat.id === category.id)) {
              // Remove from selection
              setSelectedCategories(selectedCategories.filter(cat => cat.id !== category.id));
            } else {
              // Add to selection
              setSelectedCategories([...selectedCategories, category]);
            }
          } else {
            setSelectedCategory(category);
            setShowCategoryModal(false);
          }
        }}
      >
        <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
          <MaterialIcons name={category.icon} size={24} color={category.color} />
        </View>
        <Text style={styles.categoryName}>{category.name}</Text>
        {category.isCustom && (
          <MaterialIcons name="star" size={16} color="#FFE66D" />
        )}
        
        {multiSelectMode && (
          <View style={styles.categoryCheckbox}>
            <MaterialIcons 
              name={isSelected ? "check-circle" : "radio-button-unchecked"} 
              size={20} 
              color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderCustomCategoryForm = () => (
    <View style={styles.customCategoryForm}>
      <Text style={styles.customCategoryTitle}>Yeni Kategori Oluştur</Text>
      
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Kategori Adı</Text>
        <TextInput
          style={styles.customCategoryInput}
          value={customCategoryName}
          onChangeText={setCustomCategoryName}
          placeholder="Kategori adı girin"
          maxLength={20}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>İkon Seçin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
          {iconOptions.map(icon => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconOption,
                customCategoryIcon === icon && styles.iconOptionSelected
              ]}
              onPress={() => setCustomCategoryIcon(icon)}
            >
              <MaterialIcons name={icon} size={24} color={customCategoryIcon === icon ? '#FFFFFF' : theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Renk Seçin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
          {colorOptions.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                customCategoryColor === color && styles.colorOptionSelected
              ]}
              onPress={() => setCustomCategoryColor(color)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.customCategoryActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowCustomCategoryForm(false)}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleAddCustomCategory}
        >
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderIconSelector = () => (
    <Modal
      visible={iconSelectorVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIconSelectorVisible(false)}
    >
      <View style={styles.iconSelectorOverlay}>
        <View style={styles.iconSelectorModal}>
          <View style={styles.iconSelectorHeader}>
            <Text style={styles.iconSelectorTitle}>İkon Seçin</Text>
            <TouchableOpacity onPress={() => setIconSelectorVisible(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.iconSelectorContent}>
            <View style={styles.iconGrid}>
              {(showAllIcons ? categoryIcons : categoryIcons.slice(0, 17)).map((iconName, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    selectedIcon === iconName && styles.iconOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedIcon(iconName);
                    setCustomCategoryIcon(iconName);
                  }}
                >
                  <MaterialIcons name={iconName} size={24} color={
                    selectedIcon === iconName ? theme.colors.primary : theme.colors.textSecondary
                  } />
                </TouchableOpacity>
              ))}
              
              {!showAllIcons && (
                <TouchableOpacity
                  style={styles.moreOptionsButton}
                  onPress={() => setShowAllIcons(true)}
                >
                  <MaterialIcons name="more-horiz" size={24} color={theme.colors.primary} />
                  <Text style={styles.moreOptionsText}>Daha Fazla</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {showAllIcons && (
              <TouchableOpacity
                style={styles.showLessButton}
                onPress={() => setShowAllIcons(false)}
              >
                <MaterialIcons name="expand-less" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.showLessText}>Daha Az Göster</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.iconSelectorConfirm}
            onPress={() => setIconSelectorVisible(false)}
          >
            <Text style={styles.iconSelectorConfirmText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderColorSelector = () => (
    <Modal
      visible={colorSelectorVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setColorSelectorVisible(false)}
    >
      <View style={styles.colorSelectorOverlay}>
        <View style={styles.colorSelectorModal}>
          <View style={styles.colorSelectorHeader}>
            <Text style={styles.colorSelectorTitle}>Renk Seçin</Text>
            <TouchableOpacity onPress={() => setColorSelectorVisible(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.colorSelectorContent}>
            <View style={styles.colorGrid}>
              {(showAllColors ? categoryColors : categoryColors.slice(0, 23)).map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    setCustomCategoryColor(color);
                  }}
                >
                  {selectedColor === color && (
                    <MaterialIcons name="check" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              ))}
              
              {!showAllColors && (
                <TouchableOpacity
                  style={[styles.moreOptionsButton, { backgroundColor: theme.colors.background }]}
                  onPress={() => setShowAllColors(true)}
                >
                  <MaterialIcons name="more-horiz" size={20} color={theme.colors.primary} />
                  <Text style={[styles.moreOptionsText, { fontSize: 10 }]}>Daha Fazla</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {showAllColors && (
              <TouchableOpacity
                style={styles.showLessButton}
                onPress={() => setShowAllColors(false)}
              >
                <MaterialIcons name="expand-less" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.showLessText}>Daha Az Göster</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.colorSelectorConfirm}
            onPress={() => setColorSelectorVisible(false)}
          >
            <Text style={styles.colorSelectorConfirmText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCategoryModal = () => (
    <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.categoryModalContainer}>
        <View style={styles.categoryModalHeader}>
          <Text style={styles.categoryModalTitle}>
            {multiSelectMode ? 'Kategoriler Seçin' : 'Kategori Seçin'}
          </Text>
          <View style={styles.categoryModalHeaderActions}>
            {multiSelectMode && selectedCategories.length > 0 && (
              <TouchableOpacity 
                style={styles.clearSelectionButton}
                onPress={() => setSelectedCategories([])}
              >
                <Text style={styles.clearSelectionText}>Temizle</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.categoryModalContent}>
          {!showCustomCategoryForm && (
            <>
              <TouchableOpacity
                style={styles.addCategoryButton}
                onPress={() => setShowCustomCategoryForm(true)}
              >
                <MaterialIcons name="add" size={24} color={theme.colors.primary} />
                <Text style={styles.addCategoryText}>Yeni Kategori Ekle</Text>
              </TouchableOpacity>

              <View style={styles.categoryGrid}>
                {categories.map(renderCategoryOption)}
              </View>
            </>
          )}

          {showCustomCategoryForm && renderCustomCategoryForm()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <>
      <Modal visible={visible} animationType="none" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
            {/* Header */}
            <LinearGradient
              colors={type === 'income' ? ['#48BB78', '#38A169'] : ['#F56565', '#E53E3E']}
              style={styles.header}
            >
              <TouchableOpacity onPress={handleClose}>
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {type === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>Kaydet</Text>
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Amount Section */}
              <Animated.View style={[styles.section, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.sectionTitle}>Miktar</Text>
                <View style={styles.amountContainer}>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={(text) => handleCurrencyInput(text, setAmount)}
                    placeholder="0,00"
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={styles.currencySymbol}>₺</Text>
                </View>
                
                <Text style={styles.quickAmountLabel}>Hızlı Miktar Seçimi</Text>
                <View style={styles.quickAmounts}>
                  {quickAmounts.map(renderQuickAmount)}
                </View>
              </Animated.View>

              {/* Category Section */}
              <View style={styles.section}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.sectionTitle}>Kategori</Text>
                  <TouchableOpacity 
                    style={styles.multiSelectToggle}
                    onPress={() => {
                      setMultiSelectMode(!multiSelectMode);
                      if (!multiSelectMode) {
                        setSelectedCategories(selectedCategory ? [selectedCategory] : []);
                      } else {
                        setSelectedCategory(selectedCategories[0] || null);
                        setSelectedCategories([]);
                      }
                    }}
                  >
                    <MaterialIcons 
                      name={multiSelectMode ? "check-box" : "check-box-outline-blank"} 
                      size={20} 
                      color={multiSelectMode ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <Text style={[styles.multiSelectText, multiSelectMode && styles.multiSelectTextActive]}>
                      Çoklu Seçim
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => setShowCategoryModal(true)}
                >
                  {(multiSelectMode && selectedCategories.length > 0) ? (
                    <View style={styles.selectedCategoriesView}>
                      <View style={styles.selectedCategoriesContainer}>
                        {selectedCategories.slice(0, 3).map((category, index) => (
                          <View key={category.id} style={[styles.selectedCategoryChip, { backgroundColor: category.color }]}>
                            <MaterialIcons name={category.icon} size={14} color="#ffffff" />
                            <Text style={styles.selectedCategoryChipText}>{category.name}</Text>
                          </View>
                        ))}
                        {selectedCategories.length > 3 && (
                          <View style={styles.moreCategoriesChip}>
                            <Text style={styles.moreCategoriesText}>+{selectedCategories.length - 3}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : selectedCategory ? (
                    <View style={styles.selectedCategoryView}>
                      <View style={[styles.selectedCategoryIcon, { backgroundColor: `${selectedCategory.color}15` }]}>
                        <MaterialIcons name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                      </View>
                      <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.categorySelectorPlaceholder}>
                      {multiSelectMode ? 'Kategoriler seçin' : 'Kategori seçin'}
                    </Text>
                  )}
                  <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Description Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Açıklama</Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="İşlem açıklaması (opsiyonel)"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Account Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hesap</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
                  {testUser.accounts.map(account => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        selectedAccount.id === account.id && styles.accountOptionSelected
                      ]}
                      onPress={() => setSelectedAccount(account)}
                    >
                      <Text style={[
                        styles.accountOptionText,
                        selectedAccount.id === account.id && styles.accountOptionTextSelected
                      ]}>
                        {account.name}
                      </Text>
                      <Text style={[
                        styles.accountBalance,
                        selectedAccount.id === account.id && styles.accountBalanceSelected
                      ]}>
                        {formatCurrency(account.balance)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Date Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tarih</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.dateText}>
                    {selectedDate.toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Recurring Section */}
              <View style={styles.section}>
                <View style={styles.recurringHeader}>
                  <MaterialIcons name="repeat" size={24} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Düzenli İşlem</Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: '#E2E8F0', true: `${theme.colors.primary}50` }}
                    thumbColor={isRecurring ? theme.colors.primary : '#FFFFFF'}
                  />
                </View>
                
                <Text style={styles.sectionDescription}>
                  Bu işlem düzenli olarak tekrarlansın mı?
                </Text>
                
                {isRecurring && (
                  <View style={styles.recurringOptionsContainer}>
                    <Text style={styles.recurringLabel}>Tekrar Sıklığı</Text>
                    <View style={styles.recurringFrequencyGrid}>
                      {recurringOptions.map(option => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.modernRecurringOption,
                            recurringFrequency === option.value && styles.modernRecurringOptionSelected
                          ]}
                          onPress={() => setRecurringFrequency(option.value)}
                        >
                          <View style={[
                            styles.recurringIconContainer,
                            recurringFrequency === option.value && styles.recurringIconContainerSelected
                          ]}>
                            <MaterialIcons 
                              name={
                                option.value === 'daily' ? 'today' :
                                option.value === 'weekly' ? 'date-range' :
                                option.value === 'monthly' ? 'calendar-month' :
                                'event'
                              } 
                              size={20} 
                              color={recurringFrequency === option.value ? '#ffffff' : theme.colors.primary} 
                            />
                          </View>
                          <Text style={[
                            styles.modernRecurringOptionText,
                            recurringFrequency === option.value && styles.modernRecurringOptionTextSelected
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    
                    <View style={styles.recurringInfo}>
                      <MaterialIcons name="info-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.recurringInfoText}>
                        Bu işlem {
                          recurringFrequency === 'daily' ? 'her gün' : 
                          recurringFrequency === 'weekly' ? 'her hafta' :
                          recurringFrequency === 'monthly' ? 'her ay' : 'her yıl'
                        } otomatik olarak tekrarlanacaktır.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Notes Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notlar</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ek notlar (opsiyonel)"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>
          </Animated.View>
        </SafeAreaView>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </Modal>

      {renderCategoryModal()}
      {renderIconSelector()}
      {renderColorSelector()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: height * 0.9,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  saveText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  section: {
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },

  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  amountInput: {
    flex: 1,
    fontSize: 32,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  currencySymbol: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  quickAmountLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },

  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  quickAmountButton: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },

  quickAmountText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  selectedCategoryView: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  selectedCategoryText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  categorySelectorPlaceholder: {
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

  accountScroll: {
    paddingVertical: theme.spacing.sm,
  },

  accountOption: {
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  accountOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },

  accountOptionText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },

  accountOptionTextSelected: {
    color: theme.colors.primary,
  },

  accountBalance: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  accountBalanceSelected: {
    color: theme.colors.primary,
  },

  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
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

  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },

  recurringOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  recurringOption: {
    backgroundColor: theme.colors.cards,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  recurringOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },

  recurringOptionText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  recurringOptionTextSelected: {
    color: theme.colors.primary,
  },

  notesInput: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 80,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Category Modal Styles
  categoryModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  categoryModalTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  categoryModalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '15',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
    borderStyle: 'dashed',
  },

  addCategoryText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  categoryOption: {
    width: (width - 64) / 3,
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  categoryOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },

  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  categoryName: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Custom Category Form Styles
  customCategoryForm: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  customCategoryTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },

  inputSection: {
    marginBottom: theme.spacing.lg,
  },

  inputLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },

  customCategoryInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  iconScroll: {
    paddingVertical: theme.spacing.sm,
  },

  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  iconOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  colorScroll: {
    paddingVertical: theme.spacing.sm,
  },

  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
    borderWidth: 3,
    borderColor: 'transparent',
  },

  colorOptionSelected: {
    borderColor: '#FFFFFF',
  },

  customCategoryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.textSecondary + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
    alignItems: 'center',
  },

  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  bottomPadding: {
    height: 40,
  },
  // Icon Selector Styles
  iconSelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iconSelectorModal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: height * 0.8,
  },
  iconSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  iconSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  iconSelectorContent: {
    padding: theme.spacing.lg,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconOption: {
    width: (width - theme.spacing.lg * 3) / 6,
    height: 50,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  iconSelectorConfirm: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  iconSelectorConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Color Selector Styles
  colorSelectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  colorSelectorModal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: height * 0.6,
  },
  colorSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  colorSelectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  colorSelectorContent: {
    padding: theme.spacing.lg,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: (width - theme.spacing.lg * 3) / 8,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  colorSelectorConfirm: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  colorSelectorConfirmText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Multi-select styles
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  multiSelectToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  multiSelectText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },

  multiSelectTextActive: {
    color: theme.colors.primary,
  },

  selectedCategoriesView: {
    flex: 1,
  },

  selectedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },

  selectedCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },

  selectedCategoryChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },

  moreCategoriesChip: {
    backgroundColor: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  moreCategoriesText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  categoryModalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  clearSelectionButton: {
    marginRight: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },

  clearSelectionText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  categoryCheckbox: {
    marginLeft: 'auto',
  },
  
  moreOptionsButton: {
    width: (width - theme.spacing.lg * 3) / 6,
    height: 50,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  
  moreOptionsText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  
  showLessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  
  showLessText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },

  // Modern Recurring Styles
  recurringOptionsContainer: {
    marginTop: theme.spacing.md,
  },

  recurringFrequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },

  modernRecurringOption: {
    width: '48%',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  modernRecurringOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
    elevation: 6,
  },

  recurringIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },

  recurringIconContainerSelected: {
    backgroundColor: theme.colors.primary,
  },

  modernRecurringOptionText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },

  modernRecurringOptionTextSelected: {
    color: theme.colors.primary,
  },

  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '08',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },

  recurringInfoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },

  // Platform Subscription Styles
  platformSection: {
    marginBottom: theme.spacing.lg,
  },

  platformSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },

  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  platformCard: {
    width: '48%',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },

  platformCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },

  platformIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },

  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },

  platformFee: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  platformCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  regularCategoriesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});

export default DetailedAddTransactionModal;
