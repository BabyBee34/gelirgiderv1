// FinanceFlow - Professional Security Service
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import notificationService from './notificationService';

class SecurityService {
  constructor() {
    this.encryptionKey = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.securityEvents = [];
    this.isInitialized = false;
  }

  /**
   * Initialize security service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Generate or retrieve encryption key
      await this.initializeEncryption();
      
      // Load security settings
      await this.loadSecuritySettings();
      
      // Start session monitoring
      this.startSessionMonitoring();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Security initialization error:', error);
      return false;
    }
  }

  /**
   * Initialize encryption
   */
  async initializeEncryption() {
    try {
      // Try to get existing key
      let key = await SecureStore.getItemAsync('encryptionKey');
      
      if (!key) {
        // Generate new key
        key = this.generateSecureKey();
        await SecureStore.setItemAsync('encryptionKey', key);
      }
      
      this.encryptionKey = key;
      return true;
    } catch (error) {
      console.error('Encryption initialization error:', error);
      // Fallback to less secure method
      this.encryptionKey = 'fallback_key_' + Date.now();
      return false;
    }
  }

  /**
   * Generate secure encryption key
   */
  generateSecureKey() {
    try {
      // Try to use crypto-js for secure random generation
      const randomBytes = CryptoJS.lib.WordArray.random(256/8);
      return randomBytes.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.warn('Crypto-js random generation failed, using fallback:', error);
      // Fallback to time-based random generation
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2);
      return CryptoJS.SHA256(timestamp + random).toString(CryptoJS.enc.Hex);
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data) {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }
      
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data), 
        this.encryptionKey
      ).toString();
      
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData) {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not initialized');
      }
      
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData, 
        this.encryptionKey
      ).toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Hash password with salt
   */
  hashPassword(password, salt = null) {
    try {
      if (!salt) {
        // Use time-based salt generation as fallback
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2);
        salt = CryptoJS.SHA256(timestamp + random).toString(CryptoJS.enc.Hex).substring(0, 32);
      }
      
      const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      }).toString();
      
      return { hash, salt };
    } catch (error) {
      console.error('Password hashing error:', error);
      // Simple fallback hash
      const simpleHash = CryptoJS.SHA256(password + (salt || 'default_salt')).toString();
      return { hash: simpleHash, salt: salt || 'default_salt' };
    }
  }

  /**
   * Verify password
   */
  verifyPassword(password, hash, salt) {
    const { hash: newHash } = this.hashPassword(password, salt);
    return newHash === hash;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].reduce((sum, condition) => sum + (condition ? 1 : 0), 0);
    
    let strength = 'weak';
    let message = 'Şifreniz çok zayıf';
    
    if (score >= 5) {
      strength = 'very_strong';
      message = 'Şifreniz çok güçlü';
    } else if (score >= 4) {
      strength = 'strong';
      message = 'Şifreniz güçlü';
    } else if (score >= 3) {
      strength = 'medium';
      message = 'Şifreniz orta seviyede';
    } else if (score >= 2) {
      strength = 'weak';
      message = 'Şifreniz zayıf';
    }
    
    const requirements = [];
    if (password.length < minLength) requirements.push(`En az ${minLength} karakter`);
    if (!hasUpperCase) requirements.push('Büyük harf');
    if (!hasLowerCase) requirements.push('Küçük harf');
    if (!hasNumbers) requirements.push('Rakam');
    if (!hasSpecialChar) requirements.push('Özel karakter');
    
    return {
      strength,
      score,
      message,
      requirements,
      isValid: score >= 3
    };
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;&|`$]/g, '') // Remove potential command injection chars
      .trim();
  }

  /**
   * Validate financial data
   */
  validateFinancialData(data) {
    const errors = [];
    
    // Amount validation
    if (data.amount !== undefined) {
      const amount = parseFloat(data.amount);
      if (isNaN(amount)) {
        errors.push('Geçersiz tutar formatı');
      } else if (amount < 0) {
        errors.push('Tutar negatif olamaz');
      } else if (amount > 999999999) {
        errors.push('Tutar çok büyük');
      }
    }
    
    // Description validation
    if (data.description) {
      if (data.description.length < 2) {
        errors.push('Açıklama çok kısa');
      } else if (data.description.length > 200) {
        errors.push('Açıklama çok uzun');
      }
    }
    
    // Date validation
    if (data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('Geçersiz tarih formatı');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for suspicious activity
   */
  async checkSuspiciousActivity(activityData) {
    const {
      action,
      amount,
      timestamp = Date.now(),
      location,
      deviceInfo
    } = activityData;
    
    const suspiciousIndicators = [];
    
    // Large transaction check
    if (amount && amount > 50000) {
      suspiciousIndicators.push('Büyük miktarlı işlem');
    }
    
    // Unusual time check (late night transactions)
    const hour = new Date(timestamp).getHours();
    if (hour < 6 || hour > 23) {
      suspiciousIndicators.push('Olağandışı saat');
    }
    
    // Rapid consecutive transactions
    const recentActivities = await this.getRecentSecurityEvents();
    const recentTransactions = recentActivities.filter(
      event => event.action === 'transaction' && 
      timestamp - event.timestamp < 5 * 60 * 1000 // 5 minutes
    );
    
    if (recentTransactions.length > 5) {
      suspiciousIndicators.push('Ardışık hızlı işlemler');
    }
    
    const isSuspicious = suspiciousIndicators.length > 0;
    
    if (isSuspicious) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        action,
        amount,
        indicators: suspiciousIndicators,
        timestamp,
        severity: 'high'
      });
      
      await notificationService.sendSecurityAlert('suspicious', {
        indicators: suspiciousIndicators,
        action,
        amount
      });
    }
    
    return {
      isSuspicious,
      indicators: suspiciousIndicators,
      riskLevel: isSuspicious ? 'high' : 'low'
    };
  }

  /**
   * Rate limiting for login attempts
   */
  async checkLoginAttempts(identifier) {
    try {
      const key = `login_attempts_${identifier}`;
      const stored = await AsyncStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : { attempts: 0, lastAttempt: 0 };
      
      const now = Date.now();
      
      // Reset if lockout period has passed
      if (data.attempts >= this.maxLoginAttempts) {
        if (now - data.lastAttempt > this.lockoutDuration) {
          data.attempts = 0;
        } else {
          const timeLeft = this.lockoutDuration - (now - data.lastAttempt);
          return {
            allowed: false,
            timeLeft: Math.ceil(timeLeft / 1000 / 60), // minutes
            attempts: data.attempts
          };
        }
      }
      
      return {
        allowed: true,
        attempts: data.attempts,
        remaining: this.maxLoginAttempts - data.attempts
      };
    } catch (error) {
      console.error('Check login attempts error:', error);
      return { allowed: true, attempts: 0, remaining: this.maxLoginAttempts };
    }
  }

  /**
   * Record login attempt
   */
  async recordLoginAttempt(identifier, success) {
    try {
      const key = `login_attempts_${identifier}`;
      const stored = await AsyncStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : { attempts: 0, lastAttempt: 0 };
      
      if (success) {
        // Reset on successful login
        await AsyncStorage.removeItem(key);
        
        await this.logSecurityEvent({
          type: 'login_success',
          identifier,
          timestamp: Date.now(),
          severity: 'info'
        });
        
        await notificationService.sendSecurityAlert('login');
      } else {
        // Increment failed attempts
        data.attempts += 1;
        data.lastAttempt = Date.now();
        await AsyncStorage.setItem(key, JSON.stringify(data));
        
        await this.logSecurityEvent({
          type: 'login_failure',
          identifier,
          attempts: data.attempts,
          timestamp: Date.now(),
          severity: data.attempts >= this.maxLoginAttempts ? 'high' : 'medium'
        });
        
        if (data.attempts >= this.maxLoginAttempts) {
          await notificationService.sendSecurityAlert('suspicious', {
            reason: 'Çok fazla başarısız giriş denemesi'
          });
        }
      }
    } catch (error) {
      console.error('Record login attempt error:', error);
    }
  }

  /**
   * Check biometric authentication availability
   */
  async checkBiometricAvailability() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        available: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        supportedTypes
      };
    } catch (error) {
      console.error('Biometric check error:', error);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: []
      };
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometrics(reason = 'Kimlik doğrulaması için') {
    try {
      const { available } = await this.checkBiometricAvailability();
      
      if (!available) {
        throw new Error('Biyometrik kimlik doğrulama kullanılamıyor');
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'İptal',
        fallbackLabel: 'Şifre kullan'
      });
      
      if (result.success) {
        await this.logSecurityEvent({
          type: 'biometric_success',
          timestamp: Date.now(),
          severity: 'info'
        });
      } else {
        await this.logSecurityEvent({
          type: 'biometric_failure',
          error: result.error,
          timestamp: Date.now(),
          severity: 'medium'
        });
      }
      
      return result;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Session management
   */
  async createSession(userId) {
    const sessionData = {
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout
    };
    
    const encryptedSession = this.encrypt(sessionData);
    await SecureStore.setItemAsync('userSession', encryptedSession);
    
    return sessionData;
  }

  /**
   * Validate session
   */
  async validateSession() {
    try {
      const encryptedSession = await SecureStore.getItemAsync('userSession');
      if (!encryptedSession) return null;
      
      const sessionData = this.decrypt(encryptedSession);
      
      if (Date.now() > sessionData.expiresAt) {
        await this.clearSession();
        return null;
      }
      
      // Update last activity
      sessionData.lastActivity = Date.now();
      const updatedSession = this.encrypt(sessionData);
      await SecureStore.setItemAsync('userSession', updatedSession);
      
      return sessionData;
    } catch (error) {
      console.error('Session validation error:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Clear session
   */
  async clearSession() {
    try {
      await SecureStore.deleteItemAsync('userSession');
      return true;
    } catch (error) {
      console.error('Clear session error:', error);
      return false;
    }
  }

  /**
   * Start session monitoring
   */
  startSessionMonitoring() {
    setInterval(async () => {
      const session = await this.validateSession();
      if (!session) {
        // Session expired, handle logout
        console.log('Session expired');
      }
    }, 60000); // Check every minute
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event) {
    try {
      const securityEvent = {
        id: Date.now() + Math.random(),
        ...event,
        timestamp: event.timestamp || Date.now()
      };
      
      this.securityEvents.unshift(securityEvent);
      
      // Keep only last 100 events
      if (this.securityEvents.length > 100) {
        this.securityEvents.splice(100);
      }
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('securityEvents', JSON.stringify(this.securityEvents));
      
      // Log high severity events
      if (event.severity === 'high') {
        console.warn('High severity security event:', event);
      }
      
      return securityEvent;
    } catch (error) {
      console.error('Log security event error:', error);
    }
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(limit = 20) {
    try {
      const stored = await AsyncStorage.getItem('securityEvents');
      const events = stored ? JSON.parse(stored) : [];
      return events.slice(0, limit);
    } catch (error) {
      console.error('Get security events error:', error);
      return [];
    }
  }

  /**
   * Load security settings
   */
  async loadSecuritySettings() {
    try {
      const stored = await AsyncStorage.getItem('securitySettings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.sessionTimeout = settings.sessionTimeout || this.sessionTimeout;
        this.maxLoginAttempts = settings.maxLoginAttempts || this.maxLoginAttempts;
        this.lockoutDuration = settings.lockoutDuration || this.lockoutDuration;
      }
    } catch (error) {
      console.error('Load security settings error:', error);
    }
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(settings) {
    try {
      const currentSettings = {
        sessionTimeout: this.sessionTimeout,
        maxLoginAttempts: this.maxLoginAttempts,
        lockoutDuration: this.lockoutDuration
      };
      
      const newSettings = { ...currentSettings, ...settings };
      
      this.sessionTimeout = newSettings.sessionTimeout;
      this.maxLoginAttempts = newSettings.maxLoginAttempts;
      this.lockoutDuration = newSettings.lockoutDuration;
      
      await AsyncStorage.setItem('securitySettings', JSON.stringify(newSettings));
      
      return true;
    } catch (error) {
      console.error('Update security settings error:', error);
      return false;
    }
  }

  /**
   * Generate secure PIN
   */
  generateSecurePIN(length = 6) {
    let pin = '';
    for (let i = 0; i < length; i++) {
      pin += Math.floor(Math.random() * 10);
    }
    return pin;
  }

  /**
   * Validate input against common attacks
   */
  validateAgainstAttacks(input) {
    const attacks = {
      sql_injection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|WHERE)\b)/i,
      xss: /(<script|javascript:|on\w+\s*=)/i,
      command_injection: /[;&|`$\(\)]/,
      path_traversal: /\.\.\//
    };
    
    const threats = [];
    
    for (const [attackType, pattern] of Object.entries(attacks)) {
      if (pattern.test(input)) {
        threats.push(attackType);
      }
    }
    
    return {
      isSafe: threats.length === 0,
      threats
    };
  }

  /**
   * Clear all security data
   */
  async clearAllSecurityData() {
    try {
      await AsyncStorage.multiRemove([
        'securityEvents',
        'securitySettings'
      ]);
      
      await SecureStore.deleteItemAsync('userSession');
      await SecureStore.deleteItemAsync('encryptionKey');
      
      this.securityEvents = [];
      this.encryptionKey = null;
      
      return true;
    } catch (error) {
      console.error('Clear security data error:', error);
      return false;
    }
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      isInitialized: this.isInitialized,
      hasEncryption: !!this.encryptionKey,
      sessionTimeout: this.sessionTimeout,
      maxLoginAttempts: this.maxLoginAttempts,
      eventCount: this.securityEvents.length
    };
  }
}

// Create singleton instance
const securityService = new SecurityService();

export default securityService;