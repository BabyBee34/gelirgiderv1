// FinanceFlow - Gold and Currency Data
export const goldCurrencyData = {
  // Döviz kurları (mock data)
  currencies: [
    {
      id: 'usd',
      code: 'USD',
      name: 'ABD Doları',
      symbol: '$',
      buying: 30.25,
      selling: 30.35,
      change: 0.15,
      changePercent: 0.50,
      trend: 'up',
      icon: 'attach-money',
      color: '#48BB78',
    },
    {
      id: 'eur',
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      buying: 32.85,
      selling: 32.95,
      change: -0.08,
      changePercent: -0.24,
      trend: 'down',
      icon: 'euro-symbol',
      color: '#4ECDC4',
    },
    {
      id: 'gbp',
      code: 'GBP',
      name: 'İngiliz Sterlini',
      symbol: '£',
      buying: 38.45,
      selling: 38.55,
      change: 0.25,
      changePercent: 0.65,
      trend: 'up',
      icon: 'currency-pound',
      color: '#6C63FF',
    },
    {
      id: 'chf',
      code: 'CHF',
      name: 'İsviçre Frangı',
      symbol: 'CHF',
      buying: 33.75,
      selling: 33.85,
      change: -0.12,
      changePercent: -0.35,
      trend: 'down',
      icon: 'monetization-on',
      color: '#ED8936',
    },
  ],

  // Altın fiyatları (mock data)
  gold: [
    {
      id: 'gold-gram',
      name: 'Gram Altın',
      type: 'gram',
      buying: 1850.45,
      selling: 1865.30,
      change: 15.75,
      changePercent: 0.86,
      trend: 'up',
      icon: 'star',
      color: '#FFE66D',
      unit: 'gr',
    },
    {
      id: 'gold-quarter',
      name: 'Çeyrek Altın',
      type: 'quarter',
      buying: 3025.80,
      selling: 3055.20,
      change: 28.40,
      changePercent: 0.94,
      trend: 'up',
      icon: 'fiber-manual-record',
      color: '#FFE66D',
      unit: 'adet',
    },
    {
      id: 'gold-half',
      name: 'Yarım Altın',
      type: 'half',
      buying: 6080.25,
      selling: 6125.15,
      change: 52.35,
      changePercent: 0.87,
      trend: 'up',
      icon: 'circle',
      color: '#FFE66D',
      unit: 'adet',
    },
    {
      id: 'gold-full',
      name: 'Tam Altın',
      type: 'full',
      buying: 12180.50,
      selling: 12245.80,
      change: 105.20,
      changePercent: 0.87,
      trend: 'up',
      icon: 'radio-button-checked',
      color: '#FFE66D',
      unit: 'adet',
    },
  ],

  // Kullanıcının altın portföyü
  userGoldPortfolio: [
    {
      id: 'portfolio-1',
      goldId: 'gold-gram',
      quantity: 25.5,
      avgBuyPrice: 1825.20,
      totalValue: 47264.65,
      purchaseDate: '2024-01-15',
      currentPrice: 1850.45,
      profitLoss: 643.375,
      profitLossPercent: 1.38,
    },
    {
      id: 'portfolio-2',
      goldId: 'gold-quarter',
      quantity: 4,
      avgBuyPrice: 2980.50,
      totalValue: 12101.60,
      purchaseDate: '2024-02-01',
      currentPrice: 3025.80,
      profitLoss: 181.2,
      profitLossPercent: 1.52,
    },
    {
      id: 'portfolio-3',
      goldId: 'gold-half',
      quantity: 2,
      avgBuyPrice: 6020.00,
      totalValue: 12160.50,
      purchaseDate: '2024-01-28',
      currentPrice: 6080.25,
      profitLoss: 120.5,
      profitLossPercent: 1.00,
    },
  ],

  // Geçmiş fiyat verileri (chart için)
  priceHistory: {
    usd: {
      daily: [29.85, 29.92, 30.05, 29.98, 30.15, 30.08, 30.25],
      weekly: [29.25, 29.45, 29.85, 30.05, 30.25],
      monthly: [28.95, 29.15, 29.45, 29.85, 30.25],
    },
    eur: {
      daily: [32.65, 32.75, 32.88, 32.82, 32.95, 32.91, 32.85],
      weekly: [32.45, 32.65, 32.85, 32.95, 32.85],
      monthly: [32.15, 32.35, 32.65, 32.85, 32.85],
    },
    goldGram: {
      daily: [1835.20, 1842.15, 1848.30, 1845.75, 1852.40, 1849.85, 1850.45],
      weekly: [1825.50, 1835.20, 1845.30, 1852.40, 1850.45],
      monthly: [1795.30, 1815.60, 1835.20, 1845.30, 1850.45],
    },
  },

  // Pazar durumu
  marketStatus: {
    isOpen: true,
    lastUpdate: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 dakika sonra
    source: 'TCMB / Borsa İstanbul',
  },
};

export const goldCurrencyFunctions = {
  // Toplam altın portföy değerini hesapla
  getTotalGoldValue: () => {
    return goldCurrencyData.userGoldPortfolio.reduce((total, item) => {
      const currentGold = goldCurrencyData.gold.find(g => g.id === item.goldId);
      return total + (item.quantity * currentGold.buying);
    }, 0);
  },

  // Toplam kar/zarar hesapla
  getTotalGoldProfitLoss: () => {
    return goldCurrencyData.userGoldPortfolio.reduce((total, item) => {
      return total + item.profitLoss;
    }, 0);
  },

  // Altın ekleme
  addGoldToPortfolio: (goldId, quantity, buyPrice) => {
    const newItem = {
      id: `portfolio-${Date.now()}`,
      goldId,
      quantity,
      avgBuyPrice: buyPrice,
      totalValue: quantity * buyPrice,
      purchaseDate: new Date().toISOString(),
      currentPrice: goldCurrencyData.gold.find(g => g.id === goldId).buying,
      profitLoss: 0,
      profitLossPercent: 0,
    };
    
    goldCurrencyData.userGoldPortfolio.push(newItem);
    return newItem;
  },

  // Altın satma
  removeGoldFromPortfolio: (portfolioId) => {
    const index = goldCurrencyData.userGoldPortfolio.findIndex(item => item.id === portfolioId);
    if (index > -1) {
      return goldCurrencyData.userGoldPortfolio.splice(index, 1)[0];
    }
    return null;
  },

  // Fiyat güncellemesi simülasyonu
  updatePrices: () => {
    // Döviz kurları güncelle
    goldCurrencyData.currencies.forEach(currency => {
      const change = (Math.random() - 0.5) * 0.5; // -0.25 ile +0.25 arası
      currency.buying += change;
      currency.selling += change;
      currency.change = change;
      currency.changePercent = (change / currency.buying) * 100;
      currency.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    });

    // Altın fiyatları güncelle
    goldCurrencyData.gold.forEach(gold => {
      const change = (Math.random() - 0.5) * 20; // -10 ile +10 TL arası
      gold.buying += change;
      gold.selling += change;
      gold.change = change;
      gold.changePercent = (change / gold.buying) * 100;
      gold.trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
    });

    // Portföy kar/zarar güncelle
    goldCurrencyData.userGoldPortfolio.forEach(item => {
      const currentGold = goldCurrencyData.gold.find(g => g.id === item.goldId);
      const currentValue = item.quantity * currentGold.buying;
      const purchaseValue = item.quantity * item.avgBuyPrice;
      item.currentPrice = currentGold.buying;
      item.totalValue = currentValue;
      item.profitLoss = currentValue - purchaseValue;
      item.profitLossPercent = ((currentValue - purchaseValue) / purchaseValue) * 100;
    });

    goldCurrencyData.marketStatus.lastUpdate = new Date().toISOString();
    goldCurrencyData.marketStatus.nextUpdate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  },

  // Döviz çevirici
  convertCurrency: (amount, fromCurrency, toCurrency = 'TRY') => {
    if (fromCurrency === 'TRY') {
      const currency = goldCurrencyData.currencies.find(c => c.code === toCurrency);
      return currency ? amount / currency.selling : amount;
    } else if (toCurrency === 'TRY') {
      const currency = goldCurrencyData.currencies.find(c => c.code === fromCurrency);
      return currency ? amount * currency.buying : amount;
    }
    return amount;
  },

  // Altın fiyat hesaplayıcı
  calculateGoldValue: (goldType, quantity) => {
    const gold = goldCurrencyData.gold.find(g => g.type === goldType);
    return gold ? quantity * gold.buying : 0;
  },
};

export default goldCurrencyData;
