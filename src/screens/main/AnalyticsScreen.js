// FinanceFlow - Simplified Professional Analytics Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
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
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const chartOptions = [
    { id: 'overview', name: 'Genel Bakış', icon: 'dashboard', description: 'Aylık trend ve kategoriler' },
    { id: 'categories', name: 'Kategori Analizi', icon: 'pie-chart', description: 'Harcama kategorileri dağılımı' },
    { id: 'daily', name: 'Günlük Dağılım', icon: 'bar-chart', description: 'Haftalık harcama dağılımı' },
    { id: 'trends', name: 'Trend Analizi', icon: 'trending-up', description: '6 aylık trend analizi' },
    { id: 'income-expense', name: 'Gelir vs Gider', icon: 'compare-arrows', description: 'Aylık karşılaştırma' },
    { id: 'savings', name: 'Tasarruf Analizi', icon: 'savings', description: 'Tasarruf oranları' },
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

  const periodOptions = [
    'Bu Hafta', 'Geçen Hafta', 'Bu Ay', 'Geçen Ay', 
    'Bu Yıl', 'Geçen Yıl', 'Son 3 Ay', 'Son 6 Ay'
  ];

  const clearSelection = () => {
    setSelectedPeriod1('Bu Ay');
    setSelectedPeriod2('Geçen Ay');
    setComparisonMode(false);
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartTypesScroll}>
        {chartOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.chartTypeCard,
              selectedChart === option.id && styles.chartTypeCardActive
            ]}
            onPress={() => setSelectedChart(option.id)}
          >
            <View style={[
              styles.chartTypeIcon,
              selectedChart === option.id && styles.chartTypeIconActive
            ]}>
              <MaterialIcons 
                name={option.icon} 
                size={24} 
                color={selectedChart === option.id ? '#ffffff' : theme.colors.primary} 
              />
            </View>
            <Text style={[
              styles.chartTypeName,
              selectedChart === option.id && styles.chartTypeNameActive
            ]}>
              {option.name}
            </Text>
            <Text style={styles.chartTypeDescription}>{option.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderComparisonSection = () => (
    <View style={styles.comparisonSection}>
      <View style={styles.comparisonHeader}>
        <Text style={styles.sectionTitle}>Dönem Karşılaştırması</Text>
        <View style={styles.comparisonActions}>
          {comparisonMode && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
              <MaterialIcons name="clear" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.compareToggle, comparisonMode && styles.compareToggleActive]}
            onPress={() => setComparisonMode(!comparisonMode)}
          >
            <MaterialIcons name="compare-arrows" size={16} color={comparisonMode ? '#ffffff' : theme.colors.primary} />
            <Text style={[styles.compareToggleText, comparisonMode && styles.compareToggleTextActive]}>
              Karşılaştır
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {comparisonMode && (
        <View style={styles.comparisonSelectors}>
          <View style={styles.periodSelectorContainer}>
            <Text style={styles.periodSelectorLabel}>1. Dönem:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodOptionsScroll}>
              {periodOptions.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodOption, selectedPeriod1 === period && styles.periodOptionSelected]}
                  onPress={() => setSelectedPeriod1(period)}
                >
                  <Text style={[styles.periodOptionText, selectedPeriod1 === period && styles.periodOptionTextSelected]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.periodSelectorContainer}>
            <Text style={styles.periodSelectorLabel}>2. Dönem:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodOptionsScroll}>
              {periodOptions.map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodOption, selectedPeriod2 === period && styles.periodOptionSelected]}
                  onPress={() => setSelectedPeriod2(period)}
                >
                  <Text style={[styles.periodOptionText, selectedPeriod2 === period && styles.periodOptionTextSelected]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.comparisonResults}>
            <Text style={styles.comparisonResultsTitle}>
              {selectedPeriod1} vs {selectedPeriod2}
            </Text>
            <View style={styles.comparisonStats}>
              <View style={styles.comparisonStat}>
                <Text style={styles.comparisonStatLabel}>Gelir Farkı</Text>
                <Text style={[styles.comparisonStatValue, { color: '#48BB78' }]}>+{formatCurrency(1250)}</Text>
              </View>
              <View style={styles.comparisonStat}>
                <Text style={styles.comparisonStatLabel}>Gider Farkı</Text>
                <Text style={[styles.comparisonStatValue, { color: '#F56565' }]}>+{formatCurrency(890)}</Text>
              </View>
              <View style={styles.comparisonStat}>
                <Text style={styles.comparisonStatLabel}>Net Fark</Text>
                <Text style={[styles.comparisonStatValue, { color: '#48BB78' }]}>+{formatCurrency(360)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderSummaryCards = () => {
    const totalIncome = 15500;
    const totalExpense = 8200;
    const netSavings = totalIncome - totalExpense;
    const savingsRate = (netSavings / totalIncome) * 100;
    
    return (
      <View style={styles.summaryCardsContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryCardContent}>
            <Text style={styles.summaryCardTitle}>Net Tasarruf</Text>
            <Text style={styles.summaryCardAmount}>{formatCurrency(netSavings)}</Text>
            <View style={styles.summaryCardSubInfo}>
              <MaterialIcons name="trending-up" size={16} color="#ffffff" />
              <Text style={styles.summaryCardSubText}>
                Tasarruf Oranı: %{savingsRate.toFixed(1)}
              </Text>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.summaryMiniCards}>
          <View style={styles.summaryMiniCard}>
            <MaterialIcons name="arrow-upward" size={24} color="#48BB78" />
            <Text style={styles.miniCardTitle}>Gelir</Text>
            <Text style={styles.miniCardAmount}>{formatCurrency(totalIncome)}</Text>
          </View>
          
          <View style={styles.summaryMiniCard}>
            <MaterialIcons name="arrow-downward" size={24} color="#F56565" />
            <Text style={styles.miniCardTitle}>Gider</Text>
            <Text style={styles.miniCardAmount}>{formatCurrency(totalExpense)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderChartTabs = () => (
    <View style={styles.chartTabs}>
      <TouchableOpacity 
        style={[styles.chartTab, selectedChart === 'overview' && styles.chartTabActive]}
        onPress={() => setSelectedChart('overview')}
      >
        <MaterialIcons name="show-chart" size={20} color={selectedChart === 'overview' ? theme.colors.primary : theme.colors.textSecondary} />
        <Text style={[styles.chartTabText, selectedChart === 'overview' && styles.chartTabTextActive]}>
          Trend
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.chartTab, selectedChart === 'category' && styles.chartTabActive]}
        onPress={() => setSelectedChart('category')}
      >
        <MaterialIcons name="pie-chart" size={20} color={selectedChart === 'category' ? theme.colors.primary : theme.colors.textSecondary} />
        <Text style={[styles.chartTabText, selectedChart === 'category' && styles.chartTabTextActive]}>
          Kategori
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.chartTab, selectedChart === 'daily' && styles.chartTabActive]}
        onPress={() => setSelectedChart('daily')}
      >
        <MaterialIcons name="bar-chart" size={20} color={selectedChart === 'daily' ? theme.colors.primary : theme.colors.textSecondary} />
        <Text style={[styles.chartTabText, selectedChart === 'daily' && styles.chartTabTextActive]}>
          Günlük
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMainChart = () => {
    switch (selectedChart) {
      case 'overview':
        return renderTrendChart();
      case 'category':
        return renderCategoryChart();
      case 'daily':
        return renderDailyChart();
      default:
        return renderTrendChart();
    }
  };

  const renderTrendChart = () => {
    const data = {
      labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'],
      datasets: [
        {
          data: [6500, 7200, 8100, 7800, 8500, 9200],
          color: (opacity = 1) => `rgba(72, 187, 120, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: [4200, 4800, 5100, 4900, 5300, 5800],
          color: (opacity = 1) => `rgba(245, 101, 101, ${opacity})`,
          strokeWidth: 3,
        }
      ],
      legend: ["Gelir", "Gider"]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Gelir vs Gider Trendi</Text>
        <LineChart
          data={data}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderCategoryChart = () => {
    const categoryData = [
      { name: 'Market', amount: 2800, color: '#F56565', legendFontColor: theme.colors.textPrimary, legendFontSize: 12 },
      { name: 'Ulaşım', amount: 1200, color: '#ED8936', legendFontColor: theme.colors.textPrimary, legendFontSize: 12 },
      { name: 'Eğlence', amount: 900, color: '#9F7AEA', legendFontColor: theme.colors.textPrimary, legendFontSize: 12 },
      { name: 'Faturalar', amount: 800, color: '#ECC94B', legendFontColor: theme.colors.textPrimary, legendFontSize: 12 },
      { name: 'Diğer', amount: 600, color: '#38B2AC', legendFontColor: theme.colors.textPrimary, legendFontSize: 12 },
    ];

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Kategori Dağılımı</Text>
        <PieChart
          data={categoryData}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>
    );
  };

  const renderDailyChart = () => {
    const dailyData = {
      labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
      datasets: [{
        data: [450, 320, 680, 240, 890, 380, 720],
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Günlük Harcama Dağılımı</Text>
        <BarChart
          data={dailyData}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars={true}
        />
      </View>
    );
  };

  const renderInsightsSection = () => (
    <View style={styles.insightsSection}>
      <Text style={styles.sectionTitle}>Öneriler & Analizler</Text>
      
      <View style={styles.insightCard}>
        <MaterialIcons name="trending-up" size={24} color="#48BB78" />
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>Bu Ay Performansınız</Text>
          <Text style={styles.insightDescription}>
            Geçen aya göre %12 daha az harcama yaptınız. Harika!
          </Text>
        </View>
      </View>
      
      <View style={styles.insightCard}>
        <MaterialIcons name="lightbulb" size={24} color="#ED8936" />
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>Tasarruf Önerisi</Text>
          <Text style={styles.insightDescription}>
            Market harcamalarınızı %10 azaltarak aylık {formatCurrency(280)} tasarruf edebilirsiniz.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analiz</Text>
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

        {/* Comparison Section */}
        {renderComparisonSection()}

        {/* Chart Tabs */}
        {renderChartTabs()}

        {/* Main Chart */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderMainChart()}
        </Animated.View>

        {/* AI Insights */}
        {renderInsightsSection()}

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
  summaryCardsContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  summaryCardContent: {
    padding: theme.spacing.lg,
  },
  summaryCardTitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: theme.spacing.xs,
  },
  summaryCardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: theme.spacing.sm,
  },
  summaryCardSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCardSubText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: theme.spacing.xs,
    opacity: 0.9,
  },
  summaryMiniCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMiniCard: {
    flex: 1,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  miniCardTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  miniCardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  comparisonSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  comparisonActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  clearButtonText: {
    marginLeft: theme.spacing.xs,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  compareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  compareToggleActive: {
    backgroundColor: theme.colors.primary,
  },
  compareToggleText: {
    marginLeft: theme.spacing.xs,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  compareToggleTextActive: {
    color: '#ffffff',
  },
  comparisonSelectors: {
    marginTop: theme.spacing.md,
  },
  periodSelectorContainer: {
    marginBottom: theme.spacing.md,
  },
  periodSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  periodOptionsScroll: {
    flexDirection: 'row',
  },
  periodOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.sm,
  },
  periodOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  periodOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  periodOptionTextSelected: {
    color: '#ffffff',
  },
  comparisonResults: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  comparisonResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  comparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonStat: {
    alignItems: 'center',
  },
  comparisonStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  comparisonStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartTabs: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
  },
  chartTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  chartTabActive: {
    backgroundColor: theme.colors.background,
  },
  chartTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  chartTabTextActive: {
    color: theme.colors.primary,
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
  insightCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  insightContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
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
  },
  bottomPadding: {
    height: 40,
  },

  // Chart Type Selector Styles
  chartTypeSelector: {
    marginVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },

  chartTypesScroll: {
    flexGrow: 0,
  },

  chartTypeCard: {
    width: 140,
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  chartTypeCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
    elevation: 6,
  },

  chartTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },

  chartTypeIconActive: {
    backgroundColor: theme.colors.primary,
  },

  chartTypeName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },

  chartTypeNameActive: {
    color: theme.colors.primary,
  },

  chartTypeDescription: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default AnalyticsScreen;