// FinanceFlow - Form Validation Utility
import { Alert } from 'react-native';
import { useState } from 'react';

// Validation patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^[0-9]{10,11}$/,
  CURRENCY: /^[0-9]+(\.[0-9]{1,2})?$/,
  IBAN: /^TR[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{2}$/,
  CARD_NUMBER: /^[0-9]{16}$/,
  CVV: /^[0-9]{3,4}$/,
  EXPIRY_DATE: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
};

// Validation error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'Bu alan zorunludur',
  EMAIL_INVALID: 'Geçerli bir e-posta adresi girin',
  PASSWORD_WEAK: 'Şifre en az 8 karakter olmalı ve büyük/küçük harf, rakam ve özel karakter içermelidir',
  PASSWORD_MISMATCH: 'Şifreler eşleşmiyor',
  PHONE_INVALID: 'Geçerli bir telefon numarası girin',
  AMOUNT_INVALID: 'Geçerli bir tutar girin',
  AMOUNT_TOO_LARGE: 'Tutar çok büyük',
  AMOUNT_NEGATIVE: 'Tutar negatif olamaz',
  DATE_INVALID: 'Geçerli bir tarih girin',
  DATE_FUTURE: 'Gelecek tarih seçilemez',
  DATE_PAST: 'Geçmiş tarih seçilemez',
  IBAN_INVALID: 'Geçerli bir IBAN girin',
  CARD_NUMBER_INVALID: 'Geçerli bir kart numarası girin',
  CVV_INVALID: 'Geçerli bir CVV girin',
  EXPIRY_INVALID: 'Geçerli bir son kullanma tarihi girin',
  MIN_LENGTH: (field, min) => `${field} en az ${min} karakter olmalıdır`,
  MAX_LENGTH: (field, max) => `${field} en fazla ${max} karakter olabilir`,
  MIN_VALUE: (field, min) => `${field} en az ${min} olmalıdır`,
  MAX_VALUE: (field, max) => `${field} en fazla ${max} olabilir`,
};

// Generic validation functions
export const validation = {
  // Required field validation
  required(value, fieldName = 'Alan') {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return ERROR_MESSAGES.REQUIRED;
    }
    return null;
  },

  // Email validation
  email(value) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    if (!PATTERNS.EMAIL.test(value)) {
      return ERROR_MESSAGES.EMAIL_INVALID;
    }
    return null;
  },

  // Password validation
  password(value, options = {}) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    
    const { minLength = 6, requireSpecial = false } = options;
    
    if (value.length < minLength) {
      return ERROR_MESSAGES.MIN_LENGTH('Şifre', minLength);
    }
    
    if (requireSpecial && !PATTERNS.PASSWORD.test(value)) {
      return ERROR_MESSAGES.PASSWORD_WEAK;
    }
    
    return null;
  },

  // Password confirmation validation
  passwordConfirm(password, confirmPassword) {
    if (!confirmPassword) return ERROR_MESSAGES.REQUIRED;
    if (password !== confirmPassword) {
      return ERROR_MESSAGES.PASSWORD_MISMATCH;
    }
    return null;
  },

  // Phone number validation
  phone(value) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    if (!PATTERNS.PHONE.test(value.replace(/\s/g, ''))) {
      return ERROR_MESSAGES.PHONE_INVALID;
    }
    return null;
  },

  // Amount validation
  amount(value, options = {}) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    
    const { maxAmount = 999999999, allowNegative = false } = options;
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return ERROR_MESSAGES.AMOUNT_INVALID;
    }
    
    if (!allowNegative && numValue < 0) {
      return ERROR_MESSAGES.AMOUNT_NEGATIVE;
    }
    
    if (numValue > maxAmount) {
      return ERROR_MESSAGES.AMOUNT_TOO_LARGE;
    }
    
    return null;
  },

  // Currency validation
  currency(value) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    if (!PATTERNS.CURRENCY.test(value)) {
      return ERROR_MESSAGES.AMOUNT_INVALID;
    }
    return null;
  },

  // Date validation
  date(value, options = {}) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    
    const { allowFuture = true, allowPast = true } = options;
    const dateValue = new Date(value);
    const now = new Date();
    
    if (isNaN(dateValue.getTime())) {
      return ERROR_MESSAGES.DATE_INVALID;
    }
    
    if (!allowFuture && dateValue > now) {
      return ERROR_MESSAGES.DATE_FUTURE;
    }
    
    if (!allowPast && dateValue < now) {
      return ERROR_MESSAGES.DATE_PAST;
    }
    
    return null;
  },

  // IBAN validation
  iban(value) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    if (!PATTERNS.IBAN.test(value.replace(/\s/g, ''))) {
      return ERROR_MESSAGES.IBAN_INVALID;
    }
    return null;
  },

  // Card number validation
  cardNumber(value) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    if (!PATTERNS.CARD_NUMBER.test(value.replace(/\s/g, ''))) {
      return ERROR_MESSAGES.CARD_NUMBER_INVALID;
    }
    return null;
  },

  // CVV validation
  cvv(value) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    if (!PATTERNS.CVV.test(value)) {
      return ERROR_MESSAGES.CVV_INVALID;
    }
    return null;
  },

  // Expiry date validation
  expiryDate(value) {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    if (!PATTERNS.EXPIRY_DATE.test(value)) {
      return ERROR_MESSAGES.EXPIRY_INVALID;
    }
    
    const [month, year] = value.split('/');
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const now = new Date();
    
    if (expiryDate < now) {
      return 'Kart süresi dolmuş';
    }
    
    return null;
  },

  // String length validation
  length(value, min, max, fieldName = 'Alan') {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    
    if (min && value.length < min) {
      return ERROR_MESSAGES.MIN_LENGTH(fieldName, min);
    }
    
    if (max && value.length > max) {
      return ERROR_MESSAGES.MAX_LENGTH(fieldName, max);
    }
    
    return null;
  },

  // Number range validation
  range(value, min, max, fieldName = 'Değer') {
    if (!value) return ERROR_MESSAGES.REQUIRED;
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return 'Geçerli bir sayı girin';
    }
    
    if (min !== undefined && numValue < min) {
      return ERROR_MESSAGES.MIN_VALUE(fieldName, min);
    }
    
    if (max !== undefined && numValue > max) {
      return ERROR_MESSAGES.MAX_VALUE(fieldName, max);
    }
    
    return null;
  },
};

// Form validation helper
export const formValidation = {
  // Validate single field
  validateField(value, rules, fieldName) {
    for (const rule of rules) {
      const error = rule(value, fieldName);
      if (error) return error;
    }
    return null;
  },

  // Validate form data
  validateForm(formData, validationSchema) {
    const errors = {};
    
    for (const [fieldName, rules] of Object.entries(validationSchema)) {
      const value = formData[fieldName];
      const error = this.validateField(value, rules, fieldName);
      if (error) {
        errors[fieldName] = error;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Show validation errors as alerts
  showValidationErrors(errors) {
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      Alert.alert('Doğrulama Hatası', errorMessages[0]);
    }
  },

  // Validate and show errors
  validateAndShow(formData, validationSchema) {
    const { isValid, errors } = this.validateForm(formData, validationSchema);
    
    if (!isValid) {
      this.showValidationErrors(errors);
    }
    
    return isValid;
  },
};

// Predefined validation schemas
export const VALIDATION_SCHEMAS = {
  // Login form
  LOGIN: {
    email: [validation.required, validation.email],
    password: [validation.required, validation.password],
  },

  // Registration form
  REGISTER: {
    firstName: [validation.required, (value) => validation.length(value, 2, 50, 'Ad')],
    lastName: [validation.required, (value) => validation.length(value, 2, 50, 'Soyad')],
    email: [validation.required, validation.email],
    password: [validation.required, validation.password],
    confirmPassword: [validation.required],
  },

  // Transaction form
  TRANSACTION: {
    amount: [validation.required, validation.amount],
    category: [validation.required],
    date: [validation.required, validation.date],
    description: [(value) => validation.length(value, 0, 200, 'Açıklama')],
  },

  // Account form
  ACCOUNT: {
    name: [validation.required, (value) => validation.length(value, 2, 100, 'Hesap adı')],
    balance: [validation.required, validation.amount],
    type: [validation.required],
  },

  // Budget form
  BUDGET: {
    name: [validation.required, (value) => validation.length(value, 2, 100, 'Bütçe adı')],
    amount: [validation.required, validation.amount],
    category: [validation.required],
    period: [validation.required],
  },

  // Goal form
  GOAL: {
    name: [validation.required, (value) => validation.length(value, 2, 100, 'Hedef adı')],
    targetAmount: [validation.required, validation.amount],
    targetDate: [validation.required, (value) => validation.date(value, { allowPast: false })],
  },

  // Profile form
  PROFILE: {
    firstName: [validation.required, (value) => validation.length(value, 2, 50, 'Ad')],
    lastName: [validation.required, (value) => validation.length(value, 2, 50, 'Soyad')],
    email: [validation.required, validation.email],
    phone: [validation.phone],
  },

  // Password change form
  PASSWORD_CHANGE: {
    currentPassword: [validation.required],
    newPassword: [validation.required, validation.password],
    confirmPassword: [validation.required],
  },

  // Card form
  CARD: {
    cardNumber: [validation.required, validation.cardNumber],
    cardholderName: [validation.required, (value) => validation.length(value, 2, 100, 'Kart sahibi')],
    expiryDate: [validation.required, validation.expiryDate],
    cvv: [validation.required, validation.cvv],
  },
};

// Real-time validation hook helper
export const useValidation = (initialData, validationSchema) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (fieldName, value) => {
    const rules = validationSchema[fieldName];
    if (!rules) return null;
    
    return formValidation.validateField(value, rules, fieldName);
  };

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const value = formData[fieldName];
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    for (const fieldName of Object.keys(validationSchema)) {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFormData,
  };
};

// Export all validation utilities
export default {
  validation,
  formValidation,
  VALIDATION_SCHEMAS,
  useValidation,
  PATTERNS,
  ERROR_MESSAGES,
};
