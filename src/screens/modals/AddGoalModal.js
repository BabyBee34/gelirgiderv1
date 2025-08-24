// FinanceFlow - Add Goal Modal
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
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';
// Mock data import kaldırıldı
import { formatCurrency } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');

const AddGoalModal = ({ visible, onClose, goal = null }) => {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [selectedColor, setSelectedColor] = useState('#6C63FF');
  const [description, setDescription] = useState('');

  const slideAnim = useRef(new Animated.Value(height)).current;

  const iconOptions = [
    'star', 'home', 'directions-car', 'flight', 'school', 'favorite',
    'savings', 'shopping-cart', 'beach-access', 'fitness-center',
    'work', 'phone-android', 'computer', 'motorcycle'
  ];

  const colorOptions = [
    '#6C63FF', '#4ECDC4', '#FFE66D', '#48BB78', '#F56565', 
    '#ED8936', '#9F7AEA', '#38B2AC', '#ECC94B', '#FC8181'
  ];

  const quickTargets = [5000, 10000, 25000, 50000, 100000];

  useEffect(() => {
    if (visible) {
      if (goal) {
        setGoalName(goal.name);
        setTargetAmount(goal.targetAmount.toString());
        setCurrentAmount(goal.currentAmount.toString());
        setTargetDate(new Date(goal.targetDate));
        setSelectedIcon(goal.icon);
        setSelectedColor(goal.color);
        setDescription(goal.description || '');
      } else {
        resetForm();
      }

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, goal]);

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate(new Date());
    setSelectedIcon('star');
    setSelectedColor('#6C63FF');
    setDescription('');
  };

  const handleSave = () => {
    if (!goalName.trim() || !targetAmount) {
      Alert.alert('Hata', 'Lütfen hedef adını ve tutarını girin.');
      return;
    }

    const goalData = {
      id: goal?.id || Date.now().toString(),
      name: goalName.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: targetDate.toISOString(),
      icon: selectedIcon,
      color: selectedColor,
      description: description.trim(),
      createdAt: goal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (goal) {
      // Update existing goal
      const index = testUser.goals.findIndex(g => g.id === goal.id);
      if (index > -1) {
        testUser.goals[index] = goalData;
      }
      Alert.alert('Başarılı', 'Hedef güncellendi.');
    } else {
      // Add new goal
      testUser.goals.push(goalData);
      Alert.alert('Başarılı', 'Yeni hedef eklendi.');
    }

    handleClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setTargetDate(date);
    }
  };

  const renderQuickTarget = (amount) => (
    <TouchableOpacity
      key={amount}
      style={styles.quickTargetButton}
      onPress={() => setTargetAmount(amount.toString())}
    >
      <Text style={styles.quickTargetText}>{formatCurrency(amount)}</Text>
    </TouchableOpacity>
  );

  const renderIconOption = (icon) => (
    <TouchableOpacity
      key={icon}
      style={[
        styles.iconOption,
        selectedIcon === icon && { backgroundColor: selectedColor, borderColor: selectedColor }
      ]}
      onPress={() => setSelectedIcon(icon)}
    >
      <MaterialIcons 
        name={icon} 
        size={24} 
        color={selectedIcon === icon ? '#FFFFFF' : theme.colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  const renderColorOption = (color) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        selectedColor === color && styles.colorOptionSelected
      ]}
      onPress={() => setSelectedColor(color)}
    />
  );

  const calculateProgress = () => {
    if (!targetAmount || parseFloat(targetAmount) === 0) return 0;
    return Math.min((parseFloat(currentAmount) / parseFloat(targetAmount)) * 100, 100);
  };

  return (
    <>
      <Modal visible={visible} animationType="none" presentationStyle="pageSheet">
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
        >
          <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}>
              {/* Header */}
              <LinearGradient
                colors={[selectedColor, selectedColor + '80']}
                style={styles.header}
              >
                <TouchableOpacity onPress={handleClose}>
                  <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                  {goal ? 'Hedefi Düzenle' : 'Yeni Hedef'}
                </Text>
                <TouchableOpacity onPress={handleSave}>
                  <Text style={styles.saveText}>Kaydet</Text>
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
              {/* Preview */}
              <View style={styles.previewSection}>
                <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}15` }]}>
                  <MaterialIcons name={selectedIcon} size={32} color={selectedColor} />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>
                    {goalName || 'Hedef Adı'}
                  </Text>
                  <Text style={styles.previewProgress}>
                    {formatCurrency(parseFloat(currentAmount) || 0)} / {formatCurrency(parseFloat(targetAmount) || 0)}
                  </Text>
                  <View style={styles.previewProgressBar}>
                    <View style={[
                      styles.previewProgressFill, 
                      { width: `${calculateProgress()}%`, backgroundColor: selectedColor }
                    ]} />
                  </View>
                </View>
              </View>

              {/* Name Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hedef Adı</Text>
                <TextInput
                  style={styles.input}
                  value={goalName}
                  onChangeText={setGoalName}
                  placeholder="Örnek: Ev alımı, Tatil, Araba..."
                  maxLength={30}
                />
              </View>

              {/* Target Amount Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hedef Tutar</Text>
                <View style={styles.amountContainer}>
                  <TextInput
                    style={styles.amountInput}
                    value={targetAmount}
                    onChangeText={setTargetAmount}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencySymbol}>₺</Text>
                </View>
                
                <Text style={styles.quickTargetLabel}>Hızlı Seçim</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickTargetsScroll}>
                  {quickTargets.map(renderQuickTarget)}
                </ScrollView>
              </View>

              {/* Current Amount Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mevcut Tutar</Text>
                <View style={styles.amountContainer}>
                  <TextInput
                    style={styles.amountInput}
                    value={currentAmount}
                    onChangeText={setCurrentAmount}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  <Text style={styles.currencySymbol}>₺</Text>
                </View>
              </View>

              {/* Target Date Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hedef Tarih</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.dateText}>
                    {targetDate.toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Icon Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>İkon Seçin</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
                  {iconOptions.map(renderIconOption)}
                </ScrollView>
              </View>

              {/* Color Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Renk Seçin</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                  {colorOptions.map(renderColorOption)}
                </ScrollView>
              </View>

              {/* Description Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Açıklama (Opsiyonel)</Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Hedef hakkında ek bilgiler..."
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              <View style={styles.bottomPadding} />
              </ScrollView>
            </Animated.View>

            {showDatePicker && (
              <DateTimePicker
                value={targetDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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

  previewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },

  previewInfo: {
    flex: 1,
  },

  previewName: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },

  previewProgress: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },

  previewProgressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },

  previewProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  section: {
    marginBottom: theme.spacing.xl,
  },

  sectionTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },

  input: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.textPrimary,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
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
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  currencySymbol: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  quickTargetLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },

  quickTargetsScroll: {
    paddingVertical: theme.spacing.sm,
  },

  quickTargetButton: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },

  quickTargetText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
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

  iconScroll: {
    paddingVertical: theme.spacing.sm,
  },

  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  colorScroll: {
    paddingVertical: theme.spacing.sm,
  },

  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.sm,
    borderWidth: 3,
    borderColor: 'transparent',
  },

  colorOptionSelected: {
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  descriptionInput: {
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

  bottomPadding: {
    height: 40,
  },
});

export default AddGoalModal;
