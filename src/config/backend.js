// FinanceFlow - Backend Configuration
// Backend API endpoints ve configuration ayarları

// Environment detection
const isDevelopment = __DEV__;
const isProduction = !isDevelopment;
const isTesting = process.env.NODE_ENV === 'test';

// Backend Configuration
export const BACKEND_CONFIG = {
  // Environment settings
  ENVIRONMENT: {
    isDevelopment,
    isProduction,
    isTesting,
    name: isDevelopment ? 'development' : isProduction ? 'production' : 'testing',
  },

  // API Configuration
  API: {
    // Base URLs
    BASE_URL: isDevelopment 
      ? 'http://localhost:3000' 
      : 'https://api.financeflow.app',
    
    // API Version
    VERSION: 'v1',
    
    // Timeout settings
    TIMEOUT: {
      REQUEST: 10000, // 10 seconds
      UPLOAD: 30000,  // 30 seconds
      DOWNLOAD: 60000, // 60 seconds
    },
    
    // Retry settings
    RETRY: {
      MAX_ATTEMPTS: 3,
      DELAY: 1000, // 1 second
      BACKOFF_MULTIPLIER: 2,
    },
    
    // Rate limiting
    RATE_LIMIT: {
      REQUESTS_PER_MINUTE: 60,
      REQUESTS_PER_HOUR: 1000,
    },
  },

  // Authentication Configuration
  AUTH: {
    // Token settings
    TOKEN: {
      ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
      REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
      REMEMBER_ME_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
    
    // Password requirements
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SPECIAL_CHARS: true,
    },
    
    // Session settings
    SESSION: {
      MAX_CONCURRENT_SESSIONS: 5,
      INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    },
  },

  // Database Configuration
  DATABASE: {
    // Connection settings
    CONNECTION: {
      MAX_CONNECTIONS: 20,
      IDLE_TIMEOUT: 30000, // 30 seconds
      CONNECTION_TIMEOUT: 10000, // 10 seconds
    },
    
    // Query settings
    QUERY: {
      TIMEOUT: 30000, // 30 seconds
      MAX_ROWS: 10000,
    },
  },

  // File Upload Configuration
  UPLOAD: {
    // Image settings
    IMAGE: {
      MAX_SIZE: 5 * 1024 * 1024, // 5MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
      MAX_DIMENSIONS: { width: 2048, height: 2048 },
      COMPRESSION_QUALITY: 0.8,
    },
    
    // Document settings
    DOCUMENT: {
      MAX_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_TYPES: ['application/pdf', 'text/csv', 'application/json'],
    },
    
    // Receipt settings
    RECEIPT: {
      MAX_SIZE: 2 * 1024 * 1024, // 2MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
    },
  },

  // Notification Configuration
  NOTIFICATIONS: {
    // Push notifications
    PUSH: {
      ENABLED: true,
      PROVIDER: 'expo', // or 'firebase', 'onesignal'
      BATCH_SIZE: 100,
    },
    
    // Email notifications
    EMAIL: {
      ENABLED: true,
      PROVIDER: 'sendgrid', // or 'mailgun', 'ses'
      FROM_EMAIL: 'noreply@financeflow.app',
      REPLY_TO: 'support@financeflow.app',
    },
    
    // SMS notifications
    SMS: {
      ENABLED: false,
      PROVIDER: 'twilio', // or 'aws-sns', 'messagebird'
    },
  },

  // Security Configuration
  SECURITY: {
    // Encryption
    ENCRYPTION: {
      ALGORITHM: 'AES-256-GCM',
      KEY_LENGTH: 32,
      IV_LENGTH: 16,
    },
    
    // Hashing
    HASHING: {
      ALGORITHM: 'bcrypt',
      SALT_ROUNDS: 12,
    },
    
    // CORS settings
    CORS: {
      ALLOWED_ORIGINS: [
        'http://localhost:3000',
        'http://localhost:19006',
        'https://financeflow.app',
        'https://app.financeflow.app',
      ],
      ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  },

  // Cache Configuration
  CACHE: {
    // Redis settings
    REDIS: {
      ENABLED: isProduction,
      HOST: isDevelopment ? 'localhost' : 'redis.financeflow.app',
      PORT: 6379,
      TTL: 3600, // 1 hour
    },
    
    // Memory cache
    MEMORY: {
      ENABLED: true,
      MAX_SIZE: 1000,
      TTL: 300, // 5 minutes
    },
  },

  // Logging Configuration
  LOGGING: {
    // Log levels
    LEVEL: isDevelopment ? 'debug' : 'info',
    
    // Log destinations
    DESTINATIONS: {
      CONSOLE: isDevelopment,
      FILE: isProduction,
      DATABASE: isProduction,
      EXTERNAL: isProduction,
    },
    
    // External logging services
    EXTERNAL: {
      SENTRY: {
        ENABLED: isProduction,
        DSN: process.env.SENTRY_DSN,
      },
      LOGGLY: {
        ENABLED: isProduction,
        TOKEN: process.env.LOGGLY_TOKEN,
      },
    },
  },

  // Monitoring Configuration
  MONITORING: {
    // Health checks
    HEALTH_CHECK: {
      ENABLED: true,
      INTERVAL: 30000, // 30 seconds
      TIMEOUT: 5000, // 5 seconds
    },
    
    // Metrics
    METRICS: {
      ENABLED: isProduction,
      PROVIDER: 'prometheus', // or 'datadog', 'newrelic'
      INTERVAL: 60000, // 1 minute
    },
    
    // Performance monitoring
    PERFORMANCE: {
      ENABLED: isProduction,
      PROVIDER: 'newrelic', // or 'datadog', 'appdynamics'
      SLOW_QUERY_THRESHOLD: 1000, // 1 second
    },
  },

  // Feature Flags
  FEATURES: {
    // Core features
    CORE: {
      AUTHENTICATION: true,
      TRANSACTIONS: true,
      ACCOUNTS: true,
      BUDGETS: true,
      ANALYTICS: true,
    },
    
    // Advanced features
    ADVANCED: {
      RECEIPT_SCANNING: isProduction,
      AI_INSIGHTS: isProduction,
      BANK_INTEGRATION: isProduction,
      CRYPTO_TRACKING: false,
      INVESTMENT_TRACKING: false,
    },
    
    // Social features
    SOCIAL: {
      FAMILY_PLAN: false,
      SHARING: false,
      COLLABORATION: false,
    },
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VALIDATE: '/auth/validate',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // Transaction endpoints
  TRANSACTIONS: {
    BASE: '/transactions',
    BY_ID: (id) => `/transactions/${id}`,
    CATEGORIES: '/transactions/categories',
    SEARCH: '/transactions/search',
    STATS: '/transactions/stats',
    BULK: '/transactions/bulk',
    EXPORT: '/transactions/export',
  },

  // Account endpoints
  ACCOUNTS: {
    BASE: '/accounts',
    BY_ID: (id) => `/accounts/${id}`,
    BALANCE: (id) => `/accounts/${id}/balance`,
    TRANSACTIONS: (id) => `/accounts/${id}/transactions`,
    TRANSFER: '/accounts/transfer',
    CREDIT_CARDS: '/accounts/credit-cards',
    CREDIT_CARD_BY_ID: (id) => `/accounts/credit-cards/${id}`,
    CREDIT_CARD_STATEMENT: (id) => `/accounts/credit-cards/${id}/statement`,
    CREDIT_CARD_PAYMENT: (id) => `/accounts/credit-cards/${id}/calculate-payment`,
    SUMMARY: '/accounts/summary',
    ANALYTICS: '/accounts/analytics',
  },

  // Budget endpoints
  BUDGETS: {
    BASE: '/budgets',
    BY_ID: (id) => `/budgets/${id}`,
    PROGRESS: (id) => `/budgets/${id}/progress`,
    VS_ACTUAL: (id) => `/budgets/${id}/vs-actual`,
    RECOMMENDATIONS: '/budgets/recommendations',
    ALERTS: '/budgets/alerts',
    ALERT_BY_ID: (id) => `/budgets/alerts/${id}`,
    GOALS: '/budgets/goals',
    GOAL_BY_ID: (id) => `/budgets/goals/${id}`,
    GOAL_PROGRESS: (id) => `/budgets/goals/${id}/progress`,
    GOAL_CONTRIBUTE: (id) => `/budgets/goals/${id}/contribute`,
    CATEGORIES: '/budgets/categories',
    SUMMARY: '/budgets/summary',
    HISTORY: (id) => `/budgets/${id}/history`,
  },

  // Analytics endpoints
  ANALYTICS: {
    SPENDING: '/analytics/spending',
    INCOME: '/analytics/income',
    CATEGORIES: '/analytics/categories',
    TRENDS: '/analytics/trends',
    MONTHLY: '/analytics/monthly',
    YEARLY: '/analytics/yearly',
    CHARTS: (type) => `/analytics/charts/${type}`,
    INSIGHTS: '/analytics/insights',
    PATTERNS: '/analytics/patterns',
    BUDGET_VS_ACTUAL: '/analytics/budget-vs-actual',
    SAVINGS: '/analytics/savings',
    DEBT: '/analytics/debt',
    REPORTS_CUSTOM: '/analytics/reports/custom',
    EXPORT: '/analytics/export',
    SUMMARY: '/analytics/summary',
  },

  // Utility endpoints
  UTILS: {
    HEALTH: '/health',
    STATUS: '/status',
    VERSION: '/version',
    CONFIG: '/config',
  },
};

// Development overrides
if (isDevelopment) {
  BACKEND_CONFIG.API.BASE_URL = 'http://localhost:3000';
  BACKEND_CONFIG.FEATURES.ADVANCED.RECEIPT_SCANNING = true;
  BACKEND_CONFIG.FEATURES.ADVANCED.AI_INSIGHTS = true;
  BACKEND_CONFIG.LOGGING.LEVEL = 'debug';
  BACKEND_CONFIG.CACHE.REDIS.ENABLED = false;
}

// Testing overrides
if (isTesting) {
  BACKEND_CONFIG.API.BASE_URL = 'http://localhost:3001';
  BACKEND_CONFIG.DATABASE.CONNECTION.MAX_CONNECTIONS = 5;
  BACKEND_CONFIG.LOGGING.LEVEL = 'error';
  BACKEND_CONFIG.CACHE.REDIS.ENABLED = false;
  BACKEND_CONFIG.CACHE.MEMORY.ENABLED = false;
}

// Export configuration
export default BACKEND_CONFIG;

