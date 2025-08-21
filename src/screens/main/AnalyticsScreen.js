// FinanceFlow - Kapsamlı Analiz Ekranı
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, PieChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { theme } from '../../styles/theme';
import { testUser } from '../../utils/testData';
import { formatCurrency } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');
const CHART_WIDTH = Math.min(width - theme.spacing.lg * 2, 350);
const CHART_HEIGHT = 220;

const chartConfig = {
  backgroundColor: theme.colors.primary,
  backgroundGradientFrom: theme.colors.primary,
  backgroundGradientTo: theme.colors.secondary,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: "#ffffff"
  },
  formatYLabel: (value) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  },
  paddingLeft: 15,
  paddingRight: 15,
};

const AnalyticsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChart, setSelectedChart] = useState('overview');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedPeriod1, setSelectedPeriod1] = useState('Bu Ay');
  const [selectedPeriod2, setSelectedPeriod2] = useState('Geçen Ay');
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const chartOptions = [
    { id: 'overview', name: 'Genel Bakış', icon: 'dashboard', description: 'Aylık trend ve kategoriler' },
    { id: 'categories', name: 'Kategori Analizi', icon: 'pie-chart', description: 'Harcama kategorileri dağılımı' },
    { id: 'daily', name: 'Günlük Dağılım', icon: 'bar-chart', description: 'Haftalık harcama dağılımı' },
    { id: 'trends', name: 'Trend Analizi', icon: 'trending-up', description: '6 aylık trend analizi' },
    { id: 'income-expense', name: 'Gelir vs Gider', icon: 'compare-arrows', description: 'Aylık karşılaştırma' },
    { id: 'savings', name: 'Tasarruf Analizi', icon: 'savings', description: 'Tasarruf oranları' },
    { id: 'budget', name: 'Bütçe Analizi', icon: 'account-balance-wallet', description: 'Bütçe performansı' },
    { id: 'goals', name: 'Hedef Analizi', icon: 'flag', description: 'Hedef ilerleme durumu' },
  ];

  const periodOptions = [
    'Bu Hafta', 'Geçen Hafta', 'Bu Ay', 'Geçen Ay', 
    'Bu Yıl', 'Geçen Yıl', 'Son 3 Ay', 'Son 6 Ay'
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Analiz verileri
  const getAnalyticsData = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Bu ayın işlemleri
    const currentMonthTransactions = testUser.transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Gelir ve gider hesaplama
    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Kategori bazında harcama
    const categoryExpenses = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = testUser.categories.expense.find(c => c.id === t.categoryId);
        if (category) {
          categoryExpenses[category.name] = (categoryExpenses[category.name] || 0) + Math.abs(t.amount);
        }
      });

    // Günlük harcama dağılımı (son 7 gün)
    const dailyExpenses = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTransactions = currentMonthTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.toDateString() === date.toDateString() && t.type === 'expense';
      });
      const dayTotal = dayTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      dailyExpenses.push({
        day: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
        amount: dayTotal
      });
    }

    return {
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income * 100) : 0,
      categoryExpenses,
      dailyExpenses,
      transactionCount: currentMonthTransactions.length,
      avgTransactionAmount: currentMonthTransactions.length > 0 
        ? currentMonthTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / currentMonthTransactions.length 
        : 0
    };
  };

  // Akıllı öneriler
  const getSmartInsights = () => {
    const data = getAnalyticsData();
    const insights = [];

    // Tasarruf oranı analizi
    if (data.savingsRate < 20) {
      insights.push({
        type: 'warning',
        icon: 'warning',
        color: '#ED8936',
        title: 'Düşük Tasarruf Oranı',
        description: `Tasarruf oranınız %${data.savingsRate.toFixed(1)}. %20'nin altında.`,
        suggestion: 'Gereksiz harcamaları azaltın, bütçe planı yapın.',
        action: 'Bütçe Planı Oluştur'
      });
    } else if (data.savingsRate > 40) {
      insights.push({
        type: 'success',
        icon: 'check-circle',
        color: '#48BB78',
        title: 'Mükemmel Tasarruf!',
        description: `Tasarruf oranınız %${data.savingsRate.toFixed(1)}. Harika!`,
        suggestion: 'Bu oranı koruyun, yatırım yapmayı düşünün.',
        action: 'Yatırım Seçenekleri'
      });
    }

    // Kategori analizi
    const topCategory = Object.entries(data.categoryExpenses)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      const [categoryName, amount] = topCategory;
      const percentage = (amount / data.expenses * 100).toFixed(1);
      
      if (percentage > 30) {
        insights.push({
          type: 'info',
          icon: 'info',
          color: '#4299E1',
          title: 'Yüksek Kategori Konsantrasyonu',
          description: `${categoryName} harcamalarınız toplam harcamanızın %${percentage}'ini oluşturuyor.`,
          suggestion: 'Bu kategoride alternatif seçenekler arayın.',
          action: 'Alternatif Öneriler'
        });
      }
    }

    // Ortalama işlem tutarı analizi
    if (data.avgTransactionAmount > 500) {
      insights.push({
        type: 'info',
        icon: 'trending-up',
        color: '#9F7AEA',
        title: 'Yüksek Ortalama İşlem',
        description: `Ortalama işlem tutarınız ${formatCurrency(data.avgTransactionAmount)}.`,
        suggestion: 'Küçük işlemleri birleştirerek komisyon tasarrufu yapabilirsiniz.',
        action: 'İşlem Analizi'
      });
    }

    // Gelir-gider dengesi
    if (data.expenses > data.income * 0.9) {
      insights.push({
        type: 'danger',
        icon: 'error',
        color: '#F56565',
        title: 'Kritik Harcama Seviyesi',
        description: 'Harcamalarınız gelirlerinizin %90\'ından fazla.',
        suggestion: 'Acil bütçe düzenlemesi yapın, gereksiz harcamaları kesin.',
        action: 'Acil Bütçe'
      });
    }

    return insights;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod('week')}
      >
        <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
          Hafta
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod('month')}
      >
        <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
          Ay
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'quarter' && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod('quarter')}
      >
        <Text style={[styles.periodText, selectedPeriod === 'quarter' && styles.periodTextActive]}>
          3 Ay
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod('year')}
      >
        <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>
          Yıl
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChartTypeSelector = () => (
    <View style={styles.chartTypeSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {chartOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.chartTypeButton,
              selectedChart === option.id && styles.chartTypeButtonActive
            ]}
            onPress={() => setSelectedChart(option.id)}
          >
            <MaterialIcons 
              name={option.icon} 
              size={20} 
              color={selectedChart === option.id ? '#FFFFFF' : theme.colors.textSecondary} 
            />
            <Text style={[
              styles.chartTypeText,
              selectedChart === option.id && styles.chartTypeTextActive
            ]}>
              {option.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSummaryCards = () => {
    const data = getAnalyticsData();
    
    return (
      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#48BB78', '#38A169']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
            <Text style={styles.summaryAmount}>{formatCurrency(data.income)}</Text>
            <Text style={styles.summaryLabel}>Toplam Gelir</Text>
          </LinearGradient>
        </View>

        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#F56565', '#E53E3E']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="trending-down" size={24} color="#FFFFFF" />
            <Text style={styles.summaryAmount}>{formatCurrency(data.expenses)}</Text>
            <Text style={styles.summaryLabel}>Toplam Gider</Text>
          </LinearGradient>
        </View>

        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#6C63FF', '#5A67D8']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="savings" size={24} color="#FFFFFF" />
            <Text style={styles.summaryAmount}>{formatCurrency(data.savings)}</Text>
            <Text style={styles.summaryLabel}>Tasarruf</Text>
          </LinearGradient>
        </View>

        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#4ECDC4', '#38B2AC']}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="percent" size={24} color="#FFFFFF" />
            <Text style={styles.summaryAmount}>%{data.savingsRate.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Tasarruf Oranı</Text>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const renderMainChart = () => {
    const data = getAnalyticsData();
    
    switch (selectedChart) {
      case 'overview':
        return renderOverviewChart(data);
      case 'categories':
        return renderCategoriesChart(data);
      case 'daily':
        return renderDailyChart(data);
      case 'trends':
        return renderTrendsChart(data);
      case 'income-expense':
        return renderIncomeExpenseChart(data);
      case 'savings':
        return renderSavingsChart(data);
      case 'budget':
        return renderBudgetChart(data);
      case 'goals':
        return renderGoalsChart(data);
      default:
        return renderOverviewChart(data);
    }
  };

  const renderOverviewChart = (data) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Aylık Genel Bakış</Text>
      <View style={styles.chartRow}>
        <View style={styles.chartColumn}>
          <Text style={styles.chartSubtitle}>Gelir vs Gider</Text>
          <BarChart
            data={{
              labels: ['Gelir', 'Gider', 'Tasarruf'],
              datasets: [{
                data: [data.income, data.expenses, data.savings]
              }]
            }}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
          />
        </View>
      </View>
    </View>
  );

  const renderCategoriesChart = (data) => {
    // Gelir kategorileri
    const incomeCategories = {};
    testUser.categories.income.forEach(cat => {
      incomeCategories[cat.name] = 0;
    });
    
    // Gider kategorileri
    const expenseCategories = {};
    testUser.categories.expense.forEach(cat => {
      expenseCategories[cat.name] = 0;
    });
    
    // İşlemlerden kategori bazında toplamları hesapla
    testUser.transactions.forEach(transaction => {
      const category = testUser.categories[transaction.type === 'income' ? 'income' : 'expense']
        .find(cat => cat.id === transaction.categoryId);
      
      if (category) {
        if (transaction.type === 'income') {
          incomeCategories[category.name] += Math.abs(transaction.amount);
        } else {
          expenseCategories[category.name] += Math.abs(transaction.amount);
        }
      }
    });

    // Toplam gelir ve gider
    const totalIncome = Object.values(incomeCategories).reduce((sum, amount) => sum + amount, 0);
    const totalExpenses = Object.values(expenseCategories).reduce((sum, amount) => sum + amount, 0);

    // Gelir kategorileri (sadece pozitif olanlar)
    const incomeData = Object.entries(incomeCategories)
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount], index) => ({
        name: name,
        amount: amount,
        color: ['#48BB78', '#4ECDC4', '#9F7AEA', '#ED8936', '#718096'][index % 5],
        type: 'income'
      }));

    // Gider kategorileri (sadece pozitif olanlar)
    const expenseData = Object.entries(expenseCategories)
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6) // En fazla 6 kategori
      .map(([name, amount], index) => ({
        name: name,
        amount: amount,
        color: ['#F56565', '#ED8936', '#ECC94B', '#9F7AEA', '#38B2AC', '#ED64A6'][index % 6],
        type: 'expense'
      }));

    // Tüm veriyi birleştir
    const allData = [...incomeData, ...expenseData];

    // Tooltip render fonksiyonu
    const renderTooltip = () => {
      if (!selectedSlice) return null;

      const item = allData[selectedSlice];
      const total = item.type === 'income' ? totalIncome : totalExpenses;
      const percentage = ((item.amount / total) * 100).toFixed(1);

      return (
        <View style={[
          styles.tooltip,
          {
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }
        ]}>
          <View style={styles.tooltipHeader}>
            <View style={[styles.tooltipColor, { backgroundColor: item.color }]} />
            <Text style={styles.tooltipTitle}>{item.name}</Text>
          </View>
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipPercentage}>{percentage}%</Text>
            <Text style={styles.tooltipAmount}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            <Text style={styles.tooltipType}>
              {item.type === 'income' ? 'Gelir' : 'Gider'}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
        
        {/* Toplam Özet */}
        <View style={styles.totalSummary}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Toplam Gelir</Text>
            <Text style={[styles.totalAmount, { color: '#48BB78' }]}>
              +{formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Toplam Gider</Text>
            <Text style={[styles.totalAmount, { color: '#F56565' }]}>
              -{formatCurrency(totalExpenses)}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Net Durum</Text>
            <Text style={[styles.totalAmount, { 
              color: (totalIncome - totalExpenses) >= 0 ? '#48BB78' : '#F56565' 
            }]}>
              {(totalIncome - totalExpenses) >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpenses)}
            </Text>
          </View>
        </View>

        {/* Pie Chart - Üstte tam genişlik */}
        <View style={styles.pieChartContainer}>
          <View style={styles.chartWrapper}>
            <PieChart
              data={allData.map(item => ({
                name: item.name,
                population: item.amount,
                color: item.color,
                legendFontColor: theme.colors.textPrimary,
                legendFontSize: 10
              }))}
              width={CHART_WIDTH}
              height={CHART_HEIGHT * 0.8}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
            
            {/* Dokunmatik overlay */}
            <View style={styles.touchOverlay}>
              {allData.map((item, index) => {
                // Chart merkez koordinatları
                const centerX = CHART_WIDTH / 2;
                const centerY = (CHART_HEIGHT * 0.8) / 2;
                
                // Her dilimin açısını hesapla
                const totalAmount = allData.reduce((sum, d) => sum + d.amount, 0);
                let startAngle = 0;
                
                // Önceki dilimlerin toplam açısını hesapla
                for (let i = 0; i < index; i++) {
                  startAngle += (allData[i].amount / totalAmount) * 2 * Math.PI;
                }
                
                // Bu dilimin açısını hesapla
                const sliceAngle = (item.amount / totalAmount) * 2 * Math.PI;
                const centerAngle = startAngle + sliceAngle / 2;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sliceTouchArea,
                      {
                        position: 'absolute',
                        width: Math.min(centerX, centerY) * 1.2,
                        height: Math.min(centerX, centerY) * 1.2,
                        left: centerX - Math.min(centerX, centerY) * 0.6,
                        top: centerY - Math.min(centerX, centerY) * 0.6,
                        transform: [
                          { rotate: `${centerAngle}rad` }
                        ]
                      }
                    ]}
                    onPressIn={() => {
                      setSelectedSlice(index);
                      // Tooltip pozisyonunu hesapla
                      const radius = Math.min(centerX, centerY) * 0.6;
                      const x = centerX + radius * Math.cos(centerAngle);
                      const y = centerY + radius * Math.sin(centerAngle);
                      setTooltipPosition({ x: x - 75, y: y - 60 });
                    }}
                    onPressOut={() => setSelectedSlice(null)}
                    activeOpacity={0.8}
                  />
                );
              })}
            </View>
            
            {/* Tooltip */}
            {renderTooltip()}
          </View>
        </View>

        {/* Legend - Altta düzenli liste */}
        <View style={styles.legendContainer}>
          {/* Gelir Kategorileri */}
          {incomeData.length > 0 && (
            <View style={styles.legendSection}>
              <Text style={styles.legendSectionTitle}>Gelir Kategorileri</Text>
              <View style={styles.legendGrid}>
                {incomeData.map((item, index) => {
                  const percentage = ((item.amount / totalIncome) * 100).toFixed(1);
                  return (
                    <View key={`income-${index}`} style={styles.legendGridItem}>
                      <View style={styles.legendItemHeader}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={styles.legendPercentage}>{percentage}%</Text>
                      </View>
                      <Text style={styles.legendName}>{item.name}</Text>
                      <Text style={[styles.legendAmount, { color: '#48BB78' }]}>
                        +{formatCurrency(item.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Gider Kategorileri */}
          {expenseData.length > 0 && (
            <View style={styles.legendSection}>
              <Text style={styles.legendSectionTitle}>Gider Kategorileri</Text>
              <View style={styles.legendGrid}>
                {expenseData.map((item, index) => {
                  const percentage = ((item.amount / totalExpenses) * 100).toFixed(1);
                  return (
                    <View key={`expense-${index}`} style={styles.legendGridItem}>
                      <View style={styles.legendItemHeader}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={styles.legendPercentage}>{percentage}%</Text>
                      </View>
                      <Text style={styles.legendName}>{item.name}</Text>
                      <Text style={[styles.legendAmount, { color: '#F56565' }]}>
                        -{formatCurrency(item.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDailyChart = (data) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Günlük Harcama Dağılımı</Text>
      <View style={styles.chartRow}>
        <View style={styles.chartColumn}>
          <BarChart
            data={{
              labels: data.dailyExpenses.map(d => d.day),
              datasets: [{
                data: data.dailyExpenses.map(d => d.amount)
              }]
            }}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
          />
        </View>
      </View>
    </View>
  );

  const renderTrendsChart = (data) => {
    // 6 aylık trend verisi (örnek)
    const trendData = [
      { month: 'Eyl', income: 12000, expenses: 8500 },
      { month: 'Eki', income: 12500, expenses: 9000 },
      { month: 'Kas', income: 11800, expenses: 8200 },
      { month: 'Ara', income: 13000, expenses: 9500 },
      { month: 'Oca', income: 12200, expenses: 8800 },
      { month: 'Şub', income: 15000, expenses: 13050 }
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>6 Aylık Trend Analizi</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartColumn}>
            <LineChart
              data={{
                labels: trendData.map(d => d.month),
                datasets: [
                  {
                    data: trendData.map(d => d.income),
                    color: (opacity = 1) => `rgba(72, 187, 120, ${opacity})`,
                    strokeWidth: 3
                  },
                  {
                    data: trendData.map(d => d.expenses),
                    color: (opacity = 1) => `rgba(245, 101, 101, ${opacity})`,
                    strokeWidth: 3
                  }
                ]
              }}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
              }}
              style={styles.chart}
              bezier
            />
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#48BB78' }]} />
              <Text style={styles.legendText}>Gelir</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F56565' }]} />
              <Text style={styles.legendText}>Gider</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderIncomeExpenseChart = (data) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Gelir vs Gider Karşılaştırması</Text>
      <View style={styles.chartRow}>
        <View style={styles.chartColumn}>
          <BarChart
            data={{
              labels: ['Gelir', 'Gider'],
              datasets: [{
                data: [data.income, data.expenses]
              }]
            }}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
            }}
            style={styles.chart}
            showValuesOnTopOfBars={true}
          />
        </View>
      </View>
    </View>
  );

  const renderSavingsChart = (data) => {
    const savingsData = [data.savingsRate / 100];
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Tasarruf Oranı</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartColumn}>
            <ProgressChart
              data={{
                data: savingsData
              }}
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(72, 187, 120, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
              }}
              style={styles.chart}
            />
            <Text style={styles.progressText}>%{data.savingsRate.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBudgetChart = (data) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Bütçe Performansı</Text>
      <View style={styles.budgetContainer}>
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Gelir</Text>
          <View style={styles.budgetBar}>
            <View style={[styles.budgetFill, { width: '100%', backgroundColor: '#48BB78' }]} />
          </View>
          <Text style={styles.budgetAmount}>{formatCurrency(data.income)}</Text>
        </View>
        
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Gider</Text>
          <View style={styles.budgetBar}>
            <View style={[styles.budgetFill, { width: `${(data.expenses / data.income * 100)}%`, backgroundColor: '#F56565' }]} />
          </View>
          <Text style={styles.budgetAmount}>{formatCurrency(data.expenses)}</Text>
        </View>
        
        <View style={styles.budgetItem}>
          <Text style={styles.budgetLabel}>Tasarruf</Text>
          <View style={styles.budgetBar}>
            <View style={[styles.budgetFill, { width: `${(data.savings / data.income * 100)}%`, backgroundColor: '#6C63FF' }]} />
          </View>
          <Text style={styles.budgetAmount}>{formatCurrency(data.savings)}</Text>
        </View>
      </View>
    </View>
  );

  const renderGoalsChart = (data) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Hedef İlerleme Durumu</Text>
      <View style={styles.goalsContainer}>
        {testUser.goals.map((goal, index) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          return (
            <View key={goal.id} style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <MaterialIcons name={goal.icon} size={20} color={goal.color} />
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalProgress}>{progress.toFixed(1)}%</Text>
              </View>
              <View style={styles.goalBar}>
                <View style={[styles.goalFill, { width: `${progress}%`, backgroundColor: goal.color }]} />
              </View>
              <View style={styles.goalAmounts}>
                <Text style={styles.goalCurrent}>{formatCurrency(goal.currentAmount)}</Text>
                <Text style={styles.goalTarget}>/ {formatCurrency(goal.targetAmount)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderInsightsSection = () => {
    const insights = getSmartInsights();
    
    return (
      <View style={styles.insightsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Akıllı Öneriler & Analizler</Text>
          <TouchableOpacity onPress={() => setShowInsightsModal(true)}>
            <Text style={styles.seeAllButton}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        
        {insights.slice(0, 3).map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={styles.insightCard}
            onPress={() => {
              setSelectedInsight(insight);
              setShowInsightsModal(true);
            }}
          >
            <View style={[styles.insightIcon, { backgroundColor: `${insight.color}15` }]}>
              <MaterialIcons name={insight.icon} size={24} color={insight.color} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              <Text style={styles.insightSuggestion}>{insight.suggestion}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderInsightsModal = () => (
    <Modal visible={showInsightsModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tüm Öneriler & Analizler</Text>
          <TouchableOpacity onPress={() => setShowInsightsModal(false)}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {getSmartInsights().map((insight, index) => (
            <View key={index} style={styles.modalInsightCard}>
              <View style={styles.modalInsightHeader}>
                <View style={[styles.modalInsightIcon, { backgroundColor: `${insight.color}15` }]}>
                  <MaterialIcons name={insight.icon} size={24} color={insight.color} />
                </View>
                <View style={styles.modalInsightInfo}>
                  <Text style={styles.modalInsightTitle}>{insight.title}</Text>
                  <Text style={styles.modalInsightType}>
                    {insight.type === 'success' ? 'Başarı' : 
                     insight.type === 'warning' ? 'Uyarı' : 
                     insight.type === 'danger' ? 'Kritik' : 'Bilgi'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.modalInsightDescription}>{insight.description}</Text>
              <Text style={styles.modalInsightSuggestion}>{insight.suggestion}</Text>
              
              <TouchableOpacity style={styles.modalInsightAction}>
                <Text style={styles.modalInsightActionText}>{insight.action}</Text>
                <MaterialIcons name="arrow-forward" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Finansal Analiz</Text>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="file-download" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        {renderPeriodSelector()}

        {/* Chart Type Selector */}
        {renderChartTypeSelector()}

        {/* Summary Cards */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {renderSummaryCards()}
        </Animated.View>

        {/* Main Chart */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderMainChart()}
        </Animated.View>

        {/* Smart Insights */}
        {renderInsightsSection()}

        {/* Insights Modal */}
        {renderInsightsModal()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  headerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.cards,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  periodTextActive: {
    color: '#ffffff',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexWrap: 'wrap',
  },
  summaryCard: {
    width: '48%', // İki kart yan yana
    height: 120,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  summaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  chartTypeSelector: {
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  chartTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.cards,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTypeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
    elevation: 6,
  },
  chartTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.xs,
  },
  chartTypeTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartLegend: {
    flex: 1,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    maxWidth: '45%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: theme.spacing.sm,
    flexShrink: 0,
    marginTop: 2,
  },
  legendContent: {
    flex: 1,
    flexDirection: 'column',
  },
  legendPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  legendName: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  insightsSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seeAllButton: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  insightContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  insightSuggestion: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  modalInsightCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modalInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  modalInsightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  modalInsightInfo: {
    flex: 1,
  },
  modalInsightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  modalInsightType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  modalInsightDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  modalInsightSuggestion: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    opacity: 0.8,
    marginBottom: theme.spacing.sm,
  },
  modalInsightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalInsightActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  budgetContainer: {
    marginTop: theme.spacing.md,
  },
  budgetItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  budgetLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  budgetBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  budgetFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  goalsContainer: {
    marginTop: theme.spacing.md,
  },
  goalItem: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  goalProgress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  goalBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  goalCurrent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  goalTarget: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    opacity: 0.8,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  bottomPadding: {
    height: 40,
  },
  totalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  legendSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendGridItem: {
    width: '48%',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  legendItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  legendName: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  legendAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  pieChartContainer: {
    marginBottom: theme.spacing.md,
  },
  legendContainer: {
    marginTop: theme.spacing.md,
  },
  legendSection: {
    marginBottom: theme.spacing.md,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    marginLeft: theme.spacing.sm,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(51, 51, 51, 0.95)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  tooltipColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  tooltipContent: {
    alignItems: 'center',
  },
  tooltipPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  tooltipAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  tooltipType: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  sliceTouchArea: {
    flex: 1,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
});

export default AnalyticsScreen;