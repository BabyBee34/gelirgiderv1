// FinanceFlow - Gold & Currency Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../../styles/theme';
import { goldCurrencyData, goldCurrencyFunctions } from '../../utils/goldCurrencyData';
import { formatCurrency } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const GoldCurrencyScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('rates'); // rates, gold, portfolio
  const [refreshing, setRefreshing] = useState(false);
  const [addGoldModalVisible, setAddGoldModalVisible] = useState(false);
  const [selectedGoldType, setSelectedGoldType] = useState(null);
  const [goldQuantity, setGoldQuantity] = useState('');
  const [goldPrice, setGoldPrice] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    goldCurrencyFunctions.updatePrices();
    setTimeout(() => setRefreshing(false), 1500);
  };

  const renderTabButton = (tab, label, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <MaterialIcons 
        name={icon} 
        size={20} 
        color={selectedTab === tab ? '#FFFFFF' : theme.colors.textSecondary} 
      />
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab && styles.tabButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCurrencyCard = (currency) => (
    <TouchableOpacity key={currency.id} style={styles.currencyCard}>
      <View style={styles.currencyHeader}>
        <View style={styles.currencyInfo}>
          <View style={[styles.currencyIcon, { backgroundColor: `${currency.color}15` }]}>
            <MaterialIcons name={currency.icon} size={24} color={currency.color} />
          </View>
          <View style={styles.currencyDetails}>
            <Text style={styles.currencyCode}>{currency.code}</Text>
            <Text style={styles.currencyName}>{currency.name}</Text>
          </View>
        </View>
        <View style={[styles.trendIndicator, { backgroundColor: currency.trend === 'up' ? '#48BB7815' : '#F5656515' }]}>
          <MaterialIcons 
            name={currency.trend === 'up' ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={currency.trend === 'up' ? '#48BB78' : '#F56565'} 
          />
          <Text style={[
            styles.trendText,
            { color: currency.trend === 'up' ? '#48BB78' : '#F56565' }
          ]}>
            %{Math.abs(currency.changePercent).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.currencyRates}>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Alış</Text>
          <Text style={styles.rateValue}>{currency.buying.toFixed(4)}₺</Text>
        </View>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Satış</Text>
          <Text style={styles.rateValue}>{currency.selling.toFixed(4)}₺</Text>
        </View>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Değişim</Text>
          <Text style={[
            styles.rateValue,
            { color: currency.change > 0 ? '#48BB78' : '#F56565' }
          ]}>
            {currency.change > 0 ? '+' : ''}{currency.change.toFixed(4)}₺
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGoldCard = (gold) => (
    <TouchableOpacity key={gold.id} style={styles.goldCard}>
      <View style={styles.goldHeader}>
        <View style={styles.goldInfo}>
          <View style={[styles.goldIcon, { backgroundColor: `${gold.color}15` }]}>
            <MaterialIcons name={gold.icon} size={24} color={gold.color} />
          </View>
          <View style={styles.goldDetails}>
            <Text style={styles.goldName}>{gold.name}</Text>
            <Text style={styles.goldUnit}>Birim: {gold.unit}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addGoldButton}
          onPress={() => {
            setSelectedGoldType(gold);
            setGoldPrice(gold.buying.toString());
            setAddGoldModalVisible(true);
          }}
        >
          <MaterialIcons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.goldRates}>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Alış</Text>
          <Text style={styles.rateValue}>{formatCurrency(gold.buying)}</Text>
        </View>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Satış</Text>
          <Text style={styles.rateValue}>{formatCurrency(gold.selling)}</Text>
        </View>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Değişim</Text>
          <Text style={[
            styles.rateValue,
            { color: gold.change > 0 ? '#48BB78' : '#F56565' }
          ]}>
            {gold.change > 0 ? '+' : ''}{formatCurrency(gold.change)}
          </Text>
        </View>
      </View>

      <View style={styles.goldTrend}>
        <MaterialIcons 
          name={gold.trend === 'up' ? 'trending-up' : 'trending-down'} 
          size={16} 
          color={gold.trend === 'up' ? '#48BB78' : '#F56565'} 
        />
        <Text style={[
          styles.goldTrendText,
          { color: gold.trend === 'up' ? '#48BB78' : '#F56565' }
        ]}>
          %{Math.abs(gold.changePercent).toFixed(2)} {gold.trend === 'up' ? 'yükseldi' : 'düştü'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPortfolioCard = (portfolioItem) => {
    const gold = goldCurrencyData.gold.find(g => g.id === portfolioItem.goldId);
    
    return (
      <TouchableOpacity key={portfolioItem.id} style={styles.portfolioCard}>
        <View style={styles.portfolioHeader}>
          <View style={styles.portfolioInfo}>
            <View style={[styles.portfolioIcon, { backgroundColor: `${gold.color}15` }]}>
              <MaterialIcons name={gold.icon} size={24} color={gold.color} />
            </View>
            <View style={styles.portfolioDetails}>
              <Text style={styles.portfolioName}>{gold.name}</Text>
              <Text style={styles.portfolioQuantity}>{portfolioItem.quantity} {gold.unit}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.portfolioMenuButton}>
            <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.portfolioValues}>
          <View style={styles.portfolioValueItem}>
            <Text style={styles.portfolioValueLabel}>Güncel Değer</Text>
            <Text style={styles.portfolioValueAmount}>
              {formatCurrency(portfolioItem.totalValue)}
            </Text>
          </View>
          <View style={styles.portfolioValueItem}>
            <Text style={styles.portfolioValueLabel}>Alış Ortalaması</Text>
            <Text style={styles.portfolioValueAmount}>
              {formatCurrency(portfolioItem.avgBuyPrice)}
            </Text>
          </View>
        </View>

        <View style={styles.portfolioProfitLoss}>
          <MaterialIcons 
            name={portfolioItem.profitLoss > 0 ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={portfolioItem.profitLoss > 0 ? '#48BB78' : '#F56565'} 
          />
          <Text style={[
            styles.portfolioProfitLossText,
            { color: portfolioItem.profitLoss > 0 ? '#48BB78' : '#F56565' }
          ]}>
            {portfolioItem.profitLoss > 0 ? '+' : ''}{formatCurrency(portfolioItem.profitLoss)} 
            ({portfolioItem.profitLossPercent > 0 ? '+' : ''}{portfolioItem.profitLossPercent.toFixed(2)}%)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleAddGold = () => {
    if (!goldQuantity || !goldPrice || parseFloat(goldQuantity) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli miktar ve fiyat girin.');
      return;
    }

    const quantity = parseFloat(goldQuantity);
    const price = parseFloat(goldPrice);

    goldCurrencyFunctions.addGoldToPortfolio(selectedGoldType.id, quantity, price);
    
    Alert.alert('Başarılı', 'Altın portföyünüze eklendi.');
    setAddGoldModalVisible(false);
    setGoldQuantity('');
    setGoldPrice('');
    setSelectedGoldType(null);
  };

  const renderRatesTab = () => (
    <View>
      {/* Market Status */}
      <View style={styles.marketStatus}>
        <View style={styles.marketStatusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: goldCurrencyData.marketStatus.isOpen ? '#48BB78' : '#F56565' }]} />
          <Text style={styles.marketStatusText}>
            Piyasa {goldCurrencyData.marketStatus.isOpen ? 'Açık' : 'Kapalı'}
          </Text>
        </View>
        <Text style={styles.lastUpdateText}>
          Son güncelleme: {new Date(goldCurrencyData.marketStatus.lastUpdate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Currency Rates */}
      <Text style={styles.sectionTitle}>Döviz Kurları</Text>
      <View style={styles.currencyList}>
        {goldCurrencyData.currencies.map(renderCurrencyCard)}
      </View>
    </View>
  );

  const renderGoldTab = () => (
    <View>
      {/* Gold Summary */}
      <LinearGradient
        colors={['#FFE66D', '#ED8936']}
        style={styles.goldSummaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialIcons name="star" size={32} color="#FFFFFF" />
        <Text style={styles.goldSummaryTitle}>Toplam Altın Değeri</Text>
        <Text style={styles.goldSummaryAmount}>
          {formatCurrency(goldCurrencyFunctions.getTotalGoldValue())}
        </Text>
        <Text style={styles.goldSummarySubtitle}>
          Kar/Zarar: {formatCurrency(goldCurrencyFunctions.getTotalGoldProfitLoss())}
        </Text>
      </LinearGradient>

      {/* Gold Rates */}
      <Text style={styles.sectionTitle}>Altın Fiyatları</Text>
      <View style={styles.goldList}>
        {goldCurrencyData.gold.map(renderGoldCard)}
      </View>
    </View>
  );

  const renderPortfolioTab = () => (
    <View>
      {/* Portfolio Summary */}
      <View style={styles.portfolioSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Toplam Değer</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(goldCurrencyFunctions.getTotalGoldValue())}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Toplam Kar/Zarar</Text>
          <Text style={[
            styles.summaryValue,
            { color: goldCurrencyFunctions.getTotalGoldProfitLoss() > 0 ? '#48BB78' : '#F56565' }
          ]}>
            {goldCurrencyFunctions.getTotalGoldProfitLoss() > 0 ? '+' : ''}{formatCurrency(goldCurrencyFunctions.getTotalGoldProfitLoss())}
          </Text>
        </View>
      </View>

      {/* Portfolio Items */}
      <Text style={styles.sectionTitle}>Altın Portföyüm</Text>
      <View style={styles.portfolioList}>
        {goldCurrencyData.userGoldPortfolio.length > 0 ? (
          goldCurrencyData.userGoldPortfolio.map(renderPortfolioCard)
        ) : (
          <View style={styles.emptyPortfolio}>
            <MaterialIcons name="star-border" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyPortfolioTitle}>Portföyünüz boş</Text>
            <Text style={styles.emptyPortfolioSubtitle}>
              Altın sekmesinden altın ekleyerek başlayın
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderAddGoldModal = () => (
    <Modal visible={addGoldModalVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Altın Ekle</Text>
          <TouchableOpacity onPress={() => setAddGoldModalVisible(false)}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedGoldType && (
            <View>
              <View style={styles.selectedGoldInfo}>
                <View style={[styles.selectedGoldIcon, { backgroundColor: `${selectedGoldType.color}15` }]}>
                  <MaterialIcons name={selectedGoldType.icon} size={32} color={selectedGoldType.color} />
                </View>
                <Text style={styles.selectedGoldName}>{selectedGoldType.name}</Text>
                <Text style={styles.selectedGoldPrice}>
                  Güncel Fiyat: {formatCurrency(selectedGoldType.buying)}
                </Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Miktar ({selectedGoldType.unit})</Text>
                <TextInput
                  style={styles.modalInput}
                  value={goldQuantity}
                  onChangeText={setGoldQuantity}
                  placeholder={`${selectedGoldType.unit} cinsinden miktar`}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Alış Fiyatı (₺)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={goldPrice}
                  onChangeText={setGoldPrice}
                  placeholder="Alış fiyatı"
                  keyboardType="numeric"
                />
              </View>

              {goldQuantity && goldPrice && (
                <View style={styles.calculationResult}>
                  <Text style={styles.calculationLabel}>Toplam Tutar</Text>
                  <Text style={styles.calculationValue}>
                    {formatCurrency(parseFloat(goldQuantity) * parseFloat(goldPrice))}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.addButton} onPress={handleAddGold}>
                <Text style={styles.addButtonText}>Portföye Ekle</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Altın & Döviz</Text>
        <TouchableOpacity onPress={onRefresh}>
          <MaterialIcons name="refresh" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('rates', 'Kurlar', 'show-chart')}
        {renderTabButton('gold', 'Altın', 'star')}
        {renderTabButton('portfolio', 'Portföy', 'account-balance-wallet')}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {selectedTab === 'rates' && renderRatesTab()}
          {selectedTab === 'gold' && renderGoldTab()}
          {selectedTab === 'portfolio' && renderPortfolioTab()}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </Animated.View>

      {renderAddGoldModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },

  headerTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cards,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },

  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },

  tabButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },

  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  content: {
    flex: 1,
  },

  marketStatus: {
    backgroundColor: theme.colors.cards,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  marketStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },

  marketStatusText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  lastUpdateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  sectionTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },

  currencyList: {
    paddingHorizontal: theme.spacing.lg,
  },

  currencyCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  currencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  currencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  currencyDetails: {},

  currencyCode: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  currencyName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },

  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  currencyRates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  rateItem: {
    alignItems: 'center',
  },

  rateLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },

  rateValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  goldSummaryCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  goldSummaryTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },

  goldSummaryAmount: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },

  goldSummarySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  goldList: {
    paddingHorizontal: theme.spacing.lg,
  },

  goldCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  goldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  goldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  goldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  goldDetails: {},

  goldName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  goldUnit: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  addGoldButton: {
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  goldRates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },

  goldTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goldTrendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  portfolioSummary: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cards,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  portfolioList: {
    paddingHorizontal: theme.spacing.lg,
  },

  portfolioCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  portfolioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  portfolioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },

  portfolioDetails: {},

  portfolioName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  portfolioQuantity: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  portfolioMenuButton: {
    padding: theme.spacing.sm,
  },

  portfolioValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },

  portfolioValueItem: {
    alignItems: 'center',
  },

  portfolioValueLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },

  portfolioValueAmount: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  portfolioProfitLoss: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  portfolioProfitLossText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },

  emptyPortfolio: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },

  emptyPortfolioTitle: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  emptyPortfolioSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  modalTitle: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },

  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  selectedGoldInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  selectedGoldIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  selectedGoldName: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },

  selectedGoldPrice: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },

  inputSection: {
    marginBottom: theme.spacing.lg,
  },

  inputLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },

  modalInput: {
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

  calculationResult: {
    backgroundColor: theme.colors.primary + '15',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },

  calculationLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },

  calculationValue: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: '700',
  },

  addButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },

  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  bottomPadding: {
    height: 80,
  },
});

export default GoldCurrencyScreen;
