// FinanceFlow - User Feedback Modal System
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

const FEEDBACK_TYPES = {
  bug: {
    title: 'Hata Bildirimi',
    icon: 'bug-report',
    color: theme.colors.error,
    placeholder: 'Karşılaştığınız hatayı detaylı olarak açıklayın...',
    fields: ['description', 'steps', 'expected', 'actual'],
  },
  feature: {
    title: 'Özellik İsteği',
    icon: 'lightbulb-outline',
    color: '#FFD700',
    placeholder: 'İstediğiniz yeni özelliği açıklayın...',
    fields: ['description', 'benefit'],
  },
  improvement: {
    title: 'İyileştirme Önerisi',
    icon: 'trending-up',
    color: theme.colors.primary,
    placeholder: 'Mevcut özelliklerde nasıl iyileştirme yapabiliriz?',
    fields: ['description', 'current', 'suggested'],
  },
  general: {
    title: 'Genel Geri Bildirim',
    icon: 'feedback',
    color: theme.colors.secondary,
    placeholder: 'Genel görüşlerinizi paylaşın...',
    fields: ['description'],
  },
};

const RATING_LABELS = {
  1: 'Çok Kötü',
  2: 'Kötü',
  3: 'Orta',
  4: 'İyi',
  5: 'Mükemmel',
};

const FeedbackModal = ({ visible, onClose, onSubmit, initialType = 'general' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [feedbackType, setFeedbackType] = useState(initialType);
  const [rating, setRating] = useState(0);
  const [formData, setFormData] = useState({
    description: '',
    steps: '',
    expected: '',
    actual: '',
    benefit: '',
    current: '',
    suggested: '',
    email: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      setRating(0);
      setFormData({
        description: '',
        steps: '',
        expected: '',
        actual: '',
        benefit: '',
        current: '',
        suggested: '',
        email: '',
        name: '',
      });
      setIsSubmitting(false);

      // Entry animation
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
    }
  }, [visible]);

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const feedbackData = {
      type: feedbackType,
      rating,
      ...formData,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      appVersion: '1.0.0', // You can get this from app.json
    };

    try {
      await onSubmit(feedbackData);
      handleClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return feedbackType !== null;
      case 2:
        return rating > 0 && formData.description.trim().length > 0;
      case 3:
        return true; // Contact info is optional
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: step <= currentStep ? theme.colors.primary : '#E2E8F0',
              },
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                { color: step <= currentStep ? '#FFFFFF' : '#718096' },
              ]}
            >
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor: step < currentStep ? theme.colors.primary : '#E2E8F0',
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Geri bildirim türünü seçin</Text>
      <Text style={styles.stepSubtitle}>
        Hangi konuda geri bildirim vermek istiyorsunuz?
      </Text>

      <View style={styles.typeGrid}>
        {Object.entries(FEEDBACK_TYPES).map(([key, type]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.typeCard,
              {
                borderColor: feedbackType === key ? type.color : '#E2E8F0',
                backgroundColor: feedbackType === key ? `${type.color}15` : '#FFFFFF',
              },
            ]}
            onPress={() => setFeedbackType(key)}
          >
            <MaterialIcons name={type.icon} size={32} color={type.color} />
            <Text style={styles.typeTitle}>{type.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRatingAndDescription = () => {
    const currentType = FEEDBACK_TYPES[feedbackType];
    
    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Değerlendirmeniz</Text>
        <Text style={styles.stepSubtitle}>
          Genel deneyiminizi değerlendirin ve detayları paylaşın
        </Text>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <Text style={styles.fieldLabel}>Genel Memnuniyet</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <MaterialIcons
                  name={star <= rating ? 'star' : 'star-border'}
                  size={32}
                  color={star <= rating ? '#FFD700' : '#E2E8F0'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Açıklama *</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder={currentType.placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={formData.description}
            onChangeText={(text) => updateFormData('description', text)}
          />
        </View>

        {/* Type-specific fields */}
        {currentType.fields.includes('steps') && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Hatayı Tekrarlama Adımları</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="1. Adım birini yapın&#10;2. Adım ikiyi yapın&#10;3. Hata oluşur"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.steps}
              onChangeText={(text) => updateFormData('steps', text)}
            />
          </View>
        )}

        {currentType.fields.includes('expected') && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Beklenen Sonuç</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ne olmasını bekliyordunuz?"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.expected}
              onChangeText={(text) => updateFormData('expected', text)}
            />
          </View>
        )}

        {currentType.fields.includes('actual') && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Gerçek Sonuç</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Gerçekte ne oldu?"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.actual}
              onChangeText={(text) => updateFormData('actual', text)}
            />
          </View>
        )}

        {currentType.fields.includes('benefit') && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bu Özelliğin Faydası</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="Bu özellik nasıl faydalı olacak?"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.benefit}
              onChangeText={(text) => updateFormData('benefit', text)}
            />
          </View>
        )}

        {currentType.fields.includes('current') && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Mevcut Durum</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Şu anda nasıl çalışıyor?"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.current}
              onChangeText={(text) => updateFormData('current', text)}
            />
          </View>
        )}

        {currentType.fields.includes('suggested') && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Önerilen İyileştirme</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              placeholder="Nasıl iyileştirilebilir?"
              placeholderTextColor={theme.colors.textSecondary}
              value={formData.suggested}
              onChangeText={(text) => updateFormData('suggested', text)}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  const renderContactInfo = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>İletişim Bilgileri</Text>
      <Text style={styles.stepSubtitle}>
        Geri bildiriminiz hakkında sizinle iletişime geçebilmemiz için (opsiyonel)
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Ad Soyad</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Adınız ve soyadınız"
          placeholderTextColor={theme.colors.textSecondary}
          value={formData.name}
          onChangeText={(text) => updateFormData('name', text)}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>E-posta</Text>
        <TextInput
          style={styles.textInput}
          placeholder="ornek@email.com"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
        />
      </View>

      <View style={styles.noteContainer}>
        <MaterialIcons name="info" size={20} color={theme.colors.primary} />
        <Text style={styles.noteText}>
          İletişim bilgileriniz sadece bu geri bildirim için kullanılacak ve üçüncü taraflarla paylaşılmayacaktır.
        </Text>
      </View>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderTypeSelection();
      case 2:
        return renderRatingAndDescription();
      case 3:
        return renderContactInfo();
      default:
        return null;
    }
  };

  const renderButtons = () => (
    <View style={styles.buttonContainer}>
      {currentStep > 1 && (
        <TouchableOpacity style={styles.secondaryButton} onPress={handlePrevious}>
          <MaterialIcons name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={styles.secondaryButtonText}>Geri</Text>
        </TouchableOpacity>
      )}

      {currentStep < 3 ? (
        <TouchableOpacity
          style={[styles.primaryButton, !isStepValid() && styles.disabledButton]}
          onPress={handleNext}
          disabled={!isStepValid()}
        >
          <Text style={styles.primaryButtonText}>İleri</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.primaryButtonText}>Gönderiliyor...</Text>
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Gönder</Text>
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View
            style={[
              styles.modal,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Geri Bildirim</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Content */}
            <View style={styles.content}>
              {renderStepContent()}
            </View>

            {/* Buttons */}
            {renderButtons()}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: theme.spacing.md,
  },
  starButton: {
    paddingHorizontal: 4,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  textArea: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: `${theme.colors.primary}15`,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: theme.spacing.md,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default FeedbackModal;

