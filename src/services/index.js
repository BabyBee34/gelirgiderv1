// FinanceFlow - Services Index
// Tüm servisleri tek yerden export eder

// Temel servisler - her birini ayrı ayrı import et
import transactionService from './transactionService';
import accountService from './accountService';
import categoryService from './categoryService';
import budgetService from './budgetService';
import goalService from './goalService';
import creditCardService from './creditCardService';
import analyticsService from './analyticsService';

// Test: Import'ların çalışıp çalışmadığını kontrol et
console.log('🔍 Services Index - Import Test:', {
  transactionService: !!transactionService,
  accountService: !!accountService,
  categoryService: !!categoryService,
  budgetService: !!budgetService,
  goalService: !!goalService,
  creditCardService: !!creditCardService,
  analyticsService: !!analyticsService
});

// Named exports
export { transactionService, accountService, categoryService, budgetService, goalService, creditCardService, analyticsService };

// Default export
export default {
  transactionService,
  accountService,
  categoryService,
  budgetService,
  goalService,
  creditCardService,
  analyticsService
};

