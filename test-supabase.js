// FinanceFlow - Supabase Connection Test
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://avmbdnosncemwpppgkac.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bWJkbm9zbmNlbXdwcHBna2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTczMTYsImV4cCI6MjA3MTUzMzMxNn0.HJ0m7isD9wbfsSIIlll7JjZqW4EUafKrK30h2dAqvHM'
);

async function fullConnectionTest() {
  console.log('🔍 FinanceFlow Supabase Connection Test');
  console.log('=====================================');
  
  const tables = [
    'users', 'categories', 'accounts', 'transactions', 
    'budgets', 'goals', 'credit_cards', 'recurring_transactions'
  ];
  
  let successCount = 0;
  let totalCount = tables.length;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log('❌', table.padEnd(20), '- Error:', error.message);
      } else {
        console.log('✅', table.padEnd(20), '- OK');
        successCount++;
      }
    } catch (err) {
      console.log('❌', table.padEnd(20), '- Exception:', err.message);
    }
  }
  
  console.log('=====================================');
  console.log('Test Result:', successCount + '/' + totalCount, 'tables accessible');
  
  if (successCount === totalCount) {
    console.log('🎉 All core tables are working! Supabase connection is healthy.');
  } else {
    console.log('⚠️  Some tables have issues. Check the errors above.');
  }
}

fullConnectionTest().catch(console.error);