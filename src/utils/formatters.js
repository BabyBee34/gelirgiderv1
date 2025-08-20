// FinanceFlow - Utility Formatters

/**
 * Currency formatting utilities for Turkish Lira
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = 'TRY',
    locale = 'tr-TR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = false,
    showSymbol = true,
  } = options;

  const absAmount = Math.abs(amount);
  
  if (!showSymbol) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(absAmount);
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(absAmount);

  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return formatted;
};

/**
 * Compact currency format for large numbers
 */
export const formatCompactCurrency = (amount, options = {}) => {
  const {
    currency = 'TRY',
    locale = 'tr-TR',
  } = options;

  const absAmount = Math.abs(amount);

  if (absAmount >= 1000000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(amount);
  }

  return formatCurrency(amount, options);
};

/**
 * Format number as percentage
 */
export const formatPercentage = (value, options = {}) => {
  const {
    locale = 'tr-TR',
    minimumFractionDigits = 1,
    maximumFractionDigits = 1,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (currencyString) => {
  if (typeof currencyString !== 'string') return 0;
  
  // Remove currency symbols and spaces
  const cleanString = currencyString
    .replace(/[₺$€£]/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format currency input while typing
 */
export const formatCurrencyInput = (value) => {
  // Remove non-numeric characters except comma and period
  let cleanValue = value.replace(/[^0-9,.]/g, '');
  
  // Handle empty input
  if (!cleanValue) return '';
  
  // Handle multiple decimal separators - keep only the last one
  let hasDecimal = false;
  let decimalChar = '';
  
  // Find the rightmost decimal separator
  const lastCommaIndex = cleanValue.lastIndexOf(',');
  const lastDotIndex = cleanValue.lastIndexOf('.');
  
  if (lastCommaIndex > lastDotIndex && lastCommaIndex !== -1) {
    hasDecimal = true;
    decimalChar = ',';
  } else if (lastDotIndex > lastCommaIndex && lastDotIndex !== -1) {
    hasDecimal = true;
    decimalChar = '.';
  }
  
  let integerPart = '';
  let decimalPart = '';
  
  if (hasDecimal) {
    const lastSeparatorIndex = cleanValue.lastIndexOf(decimalChar);
    integerPart = cleanValue.substring(0, lastSeparatorIndex).replace(/[.,]/g, '');
    decimalPart = cleanValue.substring(lastSeparatorIndex + 1).replace(/[.,]/g, '');
    
    // Limit decimal to 2 digits
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }
  } else {
    integerPart = cleanValue.replace(/[.,]/g, '');
  }
  
  // Add thousand separators to integer part
  if (integerPart.length > 3) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  // Combine parts
  if (hasDecimal) {
    return integerPart + ',' + decimalPart;
  }
  
  return integerPart;
};

/**
 * Auto-format currency on TextInput change
 */
export const handleCurrencyInput = (text, callback) => {
  const formatted = formatCurrencyInput(text);
  callback(formatted);
};

/**
 * Convert formatted currency string to number
 */
export const currencyToNumber = (formattedCurrency) => {
  if (!formattedCurrency) return 0;
  
  // Remove thousand separators and convert comma to period
  const numericString = formattedCurrency
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(numericString) || 0;
};

/**
 * Date formatting utilities
 */
export const formatDate = (date, options = {}) => {
  const {
    locale = 'tr-TR',
    style = 'short', // short, medium, long, full
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formats = {
    short: { day: 'numeric', month: 'numeric', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  };

  return dateObj.toLocaleDateString(locale, formats[style]);
};

/**
 * Relative date formatting (Today, Yesterday, etc.)
 */
export const formatRelativeDate = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = dateObj.toDateString() === today.toDateString();
  const isYesterday = dateObj.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return 'Bugün';
  } else if (isYesterday) {
    return 'Dün';
  } else {
    const diffTime = today - dateObj;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} hafta önce`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ay önce`;
    } else {
      return formatDate(dateObj, { style: 'medium' });
    }
  }
};

/**
 * Time formatting
 */
export const formatTime = (date, options = {}) => {
  const {
    locale = 'tr-TR',
    hour12 = false,
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  });
};

/**
 * DateTime formatting
 */
export const formatDateTime = (date, options = {}) => {
  const {
    dateStyle = 'medium',
    timeStyle = true,
  } = options;

  const formattedDate = formatDate(date, { style: dateStyle });
  
  if (timeStyle) {
    const formattedTime = formatTime(date);
    return `${formattedDate} ${formattedTime}`;
  }

  return formattedDate;
};

/**
 * Number formatting utilities
 */
export const formatNumber = (number, options = {}) => {
  const {
    locale = 'tr-TR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(number);
};

/**
 * Compact number format
 */
export const formatCompactNumber = (number, options = {}) => {
  const {
    locale = 'tr-TR',
  } = options;

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(number);
};

/**
 * Phone number formatting
 */
export const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Turkish phone number format: +90 (555) 123 45 67
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    const countryCode = cleaned.substring(0, 2);
    const areaCode = cleaned.substring(2, 5);
    const firstPart = cleaned.substring(5, 8);
    const secondPart = cleaned.substring(8, 10);
    const thirdPart = cleaned.substring(10, 12);
    
    return `+${countryCode} (${areaCode}) ${firstPart} ${secondPart} ${thirdPart}`;
  }
  
  // If it doesn't match Turkish format, return as is
  return phoneNumber;
};

/**
 * IBAN formatting
 */
export const formatIBAN = (iban) => {
  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  
  // Add spaces every 4 characters
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Card number formatting
 */
export const formatCardNumber = (cardNumber, masked = false) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (masked && cleaned.length > 4) {
    const lastFour = cleaned.slice(-4);
    const maskedPart = '•'.repeat(cleaned.length - 4);
    return (maskedPart + lastFour).replace(/(.{4})/g, '$1 ').trim();
  }
  
  // Add spaces every 4 digits
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Account balance utilities
 */
export const getTotalBalance = (accounts = []) => {
  return accounts.reduce((total, account) => total + account.balance, 0);
};

export const getAccountBalance = (accountId, accounts = []) => {
  const account = accounts.find(acc => acc.id === accountId);
  return account ? account.balance : 0;
};

/**
 * Transaction amount formatting with color
 */
export const formatTransactionAmount = (transaction) => {
  const isIncome = transaction.type === 'income';
  const sign = isIncome ? '+' : '';
  const color = isIncome ? '#48BB78' : '#F56565';
  
  return {
    text: sign + formatCurrency(transaction.amount),
    color,
    isPositive: isIncome,
  };
};

/**
 * Progress percentage calculator
 */
export const calculateProgress = (current, target) => {
  if (target <= 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

/**
 * Budget utilization formatting
 */
export const formatBudgetUtilization = (spent, budget) => {
  const utilization = (spent / budget) * 100;
  
  let status = 'healthy';
  let color = '#48BB78';
  
  if (utilization > 100) {
    status = 'exceeded';
    color = '#F56565';
  } else if (utilization > 80) {
    status = 'warning';
    color = '#ED8936';
  }
  
  return {
    percentage: Math.round(utilization),
    status,
    color,
    remainingAmount: Math.max(budget - spent, 0),
  };
};

/**
 * Month names in Turkish
 */
export const getMonthName = (monthIndex, short = false) => {
  const months = short 
    ? ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
    : ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  
  return months[monthIndex] || '';
};

/**
 * Day names in Turkish
 */
export const getDayName = (dayIndex, short = false) => {
  const days = short
    ? ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    : ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  
  return days[dayIndex] || '';
};

export default {
  formatCurrency,
  formatCompactCurrency,
  formatPercentage,
  parseCurrency,
  formatCurrencyInput,
  formatDate,
  formatRelativeDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCompactNumber,
  formatPhoneNumber,
  formatIBAN,
  formatCardNumber,
  getTotalBalance,
  getAccountBalance,
  formatTransactionAmount,
  calculateProgress,
  formatBudgetUtilization,
  getMonthName,
  getDayName,
};
