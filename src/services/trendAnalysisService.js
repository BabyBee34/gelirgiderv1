// FinanceFlow - Trend Analysis Service
import analyticsService from './analyticsService';

class TrendAnalysisService {
  constructor() {
    this.analysisCache = new Map();
  }

  // Ana trend analizi fonksiyonu
  async analyzeFinancialTrends(userId, dateRange = 'year', options = {}) {
    try {
      const {
        includePredictions = true,
        includeSeasonality = true,
        includeAnomalies = true,
        confidenceLevel = 0.95
      } = options;

      // Veri topla
      const [expenseTrends, incomeTrends, transactions] = await Promise.all([
        analyticsService.getTrendAnalysis(userId, dateRange, 'expense'),
        analyticsService.getTrendAnalysis(userId, dateRange, 'income'),
        this.getTransactionDataForTrends(userId, dateRange)
      ]);

      if (!expenseTrends.success || !incomeTrends.success) {
        throw new Error('Trend verileri alınamadı');
      }

      const analysis = {
        expenseTrends: this.analyzeExpenseTrends(expenseTrends.data),
        incomeTrends: this.analyzeIncomeTrends(incomeTrends.data),
        overallTrends: this.analyzeOverallTrends(expenseTrends.data, incomeTrends.data),
        seasonality: includeSeasonality ? this.analyzeSeasonality(transactions) : null,
        anomalies: includeAnomalies ? this.detectAnomalies(transactions) : null,
        predictions: includePredictions ? this.generatePredictions(expenseTrends.data, incomeTrends.data, confidenceLevel) : null,
        insights: this.generateTrendInsights(expenseTrends.data, incomeTrends.data),
        metadata: {
          analyzedAt: new Date().toISOString(),
          dateRange,
          userId,
          options
        }
      };

      // Cache'e kaydet
      this.analysisCache.set(`${userId}_${dateRange}`, {
        data: analysis,
        timestamp: Date.now()
      });

      return { success: true, data: analysis };
    } catch (error) {
      console.error('Analyze financial trends error:', error);
      return { success: false, error: 'Trend analizi hatası' };
    }
  }

  // Harcama trendlerini analiz et
  analyzeExpenseTrends(expenseData) {
    if (!expenseData || expenseData.length === 0) {
      return { trend: 'stable', slope: 0, volatility: 0, confidence: 0 };
    }

    const sortedData = expenseData.sort((a, b) => new Date(a.period) - new Date(b.period));
    const amounts = sortedData.map(d => d.amount);
    const periods = sortedData.map((d, i) => i); // Numeric periods for calculation

    // Linear regression
    const regression = this.calculateLinearRegression(periods, amounts);
    
    // Trend classification
    const trend = this.classifyTrend(regression.slope, regression.rSquared);
    
    // Volatility calculation
    const volatility = this.calculateVolatility(amounts);
    
    // Confidence calculation
    const confidence = this.calculateConfidence(regression.rSquared, amounts.length);

    return {
      trend,
      slope: regression.slope,
      intercept: regression.intercept,
      rSquared: regression.rSquared,
      volatility,
      confidence,
      dataPoints: amounts.length,
      trendStrength: this.calculateTrendStrength(regression.slope, regression.rSquared),
      seasonalPattern: this.detectSeasonalPattern(amounts),
      breakpoints: this.detectBreakpoints(amounts)
    };
  }

  // Gelir trendlerini analiz et
  analyzeIncomeTrends(incomeData) {
    if (!incomeData || incomeData.length === 0) {
      return { trend: 'stable', slope: 0, volatility: 0, confidence: 0 };
    }

    const sortedData = incomeData.sort((a, b) => new Date(a.period) - new Date(b.period));
    const amounts = sortedData.map(d => d.amount);
    const periods = sortedData.map((d, i) => i);

    // Linear regression
    const regression = this.calculateLinearRegression(periods, amounts);
    
    // Trend classification
    const trend = this.classifyTrend(regression.slope, regression.rSquared);
    
    // Volatility calculation
    const volatility = this.calculateVolatility(amounts);
    
    // Confidence calculation
    const confidence = this.calculateConfidence(regression.rSquared, amounts.length);

    return {
      trend,
      slope: regression.slope,
      intercept: regression.intercept,
      rSquared: regression.rSquared,
      volatility,
      confidence,
      dataPoints: amounts.length,
      trendStrength: this.calculateTrendStrength(regression.slope, regression.rSquared),
      seasonalPattern: this.detectSeasonalPattern(amounts),
      breakpoints: this.detectBreakpoints(amounts)
    };
  }

  // Genel trendleri analiz et
  analyzeOverallTrends(expenseData, incomeData) {
    const expenseAnalysis = this.analyzeExpenseTrends(expenseData);
    const incomeAnalysis = this.analyzeIncomeTrends(incomeData);

    // Net cash flow trend
    const netTrends = this.calculateNetCashFlowTrends(expenseData, incomeData);
    
    // Financial health score
    const healthScore = this.calculateFinancialHealthScore(expenseAnalysis, incomeAnalysis, netTrends);
    
    // Risk assessment
    const riskAssessment = this.assessFinancialRisk(expenseAnalysis, incomeAnalysis);

    return {
      netCashFlow: netTrends,
      financialHealth: healthScore,
      riskLevel: riskAssessment.riskLevel,
      riskFactors: riskAssessment.riskFactors,
      sustainability: this.assessTrendSustainability(expenseAnalysis, incomeAnalysis),
      recommendations: this.generateTrendRecommendations(expenseAnalysis, incomeAnalysis, netTrends)
    };
  }

  // Mevsimsellik analizi
  analyzeSeasonality(transactions) {
    if (!transactions || transactions.length === 0) return null;

    const monthlyData = this.groupByMonth(transactions);
    const seasonalIndex = this.calculateSeasonalIndex(monthlyData);
    const seasonalStrength = this.calculateSeasonalStrength(seasonalIndex);

    return {
      seasonalIndex,
      seasonalStrength,
      peakMonths: this.findPeakMonths(seasonalIndex),
      lowMonths: this.findLowMonths(seasonalIndex),
      pattern: this.classifySeasonalPattern(seasonalIndex)
    };
  }

  // Anomali tespiti
  detectAnomalies(transactions) {
    if (!transactions || transactions.length === 0) return [];

    const amounts = transactions.map(t => parseFloat(t.amount));
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);
    
    const anomalies = [];
    const threshold = 2.5; // Standard deviation threshold

    transactions.forEach((transaction, index) => {
      const amount = parseFloat(transaction.amount);
      const zScore = Math.abs((amount - mean) / stdDev);
      
      if (zScore > threshold) {
        anomalies.push({
          transaction,
          zScore,
          severity: this.classifyAnomalySeverity(zScore),
          type: amount > mean ? 'spike' : 'drop',
          explanation: this.explainAnomaly(amount, mean, stdDev, zScore)
        });
      }
    });

    return anomalies.sort((a, b) => b.zScore - a.zScore);
  }

  // Gelecek tahminleri
  generatePredictions(expenseData, incomeData, confidenceLevel = 0.95) {
    if (!expenseData || !incomeData) return null;

    const expensePrediction = this.predictFutureValues(expenseData, 3, confidenceLevel); // 3 periods ahead
    const incomePrediction = this.predictFutureValues(incomeData, 3, confidenceLevel);
    
    // Net cash flow prediction
    const netPrediction = this.predictNetCashFlow(expensePrediction, incomePrediction, confidenceLevel);

    return {
      expenses: expensePrediction,
      income: incomePrediction,
      netCashFlow: netPrediction,
      confidence: confidenceLevel,
      assumptions: this.generatePredictionAssumptions(expenseData, incomeData),
      scenarios: this.generateScenarioAnalysis(expensePrediction, incomePrediction)
    };
  }

  // Trend öngörüleri oluştur
  generateTrendInsights(expenseData, incomeData) {
    const insights = [];
    
    // Expense trend insights
    if (expenseData && expenseData.length > 0) {
      const expenseTrend = this.analyzeExpenseTrends(expenseData);
      
      if (expenseTrend.trend === 'increasing') {
        insights.push({
          type: 'warning',
          title: 'Harcama Trendi Artıyor',
          message: 'Harcamalarınız sürekli artış gösteriyor. Bu trend sürerse finansal durumunuz etkilenebilir.',
          priority: 'medium',
          trend: expenseTrend
        });
      } else if (expenseTrend.trend === 'decreasing') {
        insights.push({
          type: 'success',
          title: 'Harcama Trendi Azalıyor',
          message: 'Harcamalarınız azalma trendinde. Bu iyi bir finansal yönetim göstergesi.',
          priority: 'low',
          trend: expenseTrend
        });
      }
    }

    // Income trend insights
    if (incomeData && incomeData.length > 0) {
      const incomeTrend = this.analyzeIncomeTrends(incomeData);
      
      if (incomeTrend.trend === 'increasing') {
        insights.push({
          type: 'success',
          title: 'Gelir Trendi Artıyor',
          message: 'Gelirleriniz artış trendinde. Bu pozitif bir finansal gelişme.',
          priority: 'low',
          trend: incomeTrend
        });
      } else if (incomeTrend.trend === 'decreasing') {
        insights.push({
          type: 'danger',
          title: 'Gelir Trendi Azalıyor',
          message: 'Gelirleriniz azalma trendinde. Gelir kaynaklarınızı gözden geçirmenizi öneririz.',
          priority: 'high',
          trend: incomeTrend
        });
      }
    }

    // Volatility insights
    if (expenseData && expenseData.length > 0) {
      const expenseTrend = this.analyzeExpenseTrends(expenseData);
      
      if (expenseTrend.volatility > 0.5) {
        insights.push({
          type: 'warning',
          title: 'Yüksek Harcama Volatilitesi',
          message: 'Harcamalarınızda yüksek dalgalanma var. Bu, bütçe planlamanızı zorlaştırabilir.',
          priority: 'medium',
          volatility: expenseTrend.volatility
        });
      }
    }

    return insights;
  }

  // Helper methods

  // Linear regression hesaplama
  calculateLinearRegression(x, y) {
    const n = x.length;
    if (n !== y.length || n < 2) {
      return { slope: 0, intercept: 0, rSquared: 0 };
    }

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared calculation
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => sum + Math.pow(val - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    return { slope, intercept, rSquared };
  }

  // Trend sınıflandırma
  classifyTrend(slope, rSquared) {
    if (rSquared < 0.1) return 'stable';
    
    const threshold = 0.05;
    if (Math.abs(slope) < threshold) return 'stable';
    if (slope > threshold) return 'increasing';
    return 'decreasing';
  }

  // Volatilite hesaplama
  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean; // Coefficient of variation
  }

  // Güven hesaplama
  calculateConfidence(rSquared, sampleSize) {
    // Adjusted R-squared with sample size consideration
    if (sampleSize < 3) return 0;
    
    const adjustedRSquared = 1 - ((1 - rSquared) * (sampleSize - 1)) / (sampleSize - 2);
    return Math.max(0, Math.min(1, adjustedRSquared));
  }

  // Trend gücü hesaplama
  calculateTrendStrength(slope, rSquared) {
    const slopeStrength = Math.min(1, Math.abs(slope) / 0.1); // Normalize slope
    const fitStrength = rSquared;
    
    return (slopeStrength + fitStrength) / 2;
  }

  // Mevsimsel pattern tespiti
  detectSeasonalPattern(values) {
    if (values.length < 12) return 'insufficient_data';
    
    // Simple seasonality detection using autocorrelation
    const autocorr = this.calculateAutocorrelation(values, 12);
    const seasonalStrength = Math.max(...autocorr.slice(1));
    
    if (seasonalStrength > 0.7) return 'strong_seasonal';
    if (seasonalStrength > 0.4) return 'moderate_seasonal';
    return 'no_seasonal';
  }

  // Breakpoint tespiti
  detectBreakpoints(values) {
    if (values.length < 10) return [];
    
    const breakpoints = [];
    const windowSize = Math.floor(values.length / 4);
    
    for (let i = windowSize; i < values.length - windowSize; i++) {
      const before = values.slice(i - windowSize, i);
      const after = values.slice(i, i + windowSize);
      
      const beforeMean = before.reduce((sum, val) => sum + val, 0) / before.length;
      const afterMean = after.reduce((sum, val) => sum + val, 0) / after.length;
      
      const change = Math.abs(afterMean - beforeMean) / beforeMean;
      
      if (change > 0.3) { // 30% change threshold
        breakpoints.push({
          index: i,
          change: change,
          beforeMean,
          afterMean,
          significance: this.calculateBreakpointSignificance(change, before, after)
        });
      }
    }
    
    return breakpoints;
  }

  // Net cash flow trend hesaplama
  calculateNetCashFlowTrends(expenseData, incomeData) {
    if (!expenseData || !incomeData) return null;
    
    // Align data by period
    const periods = new Set([
      ...expenseData.map(d => d.period),
      ...incomeData.map(d => d.period)
    ]);
    
    const netCashFlow = Array.from(periods).map(period => {
      const expense = expenseData.find(d => d.period === period)?.amount || 0;
      const income = incomeData.find(d => d.period === period)?.amount || 0;
      return {
        period,
        net: income - expense,
        income,
        expense
      };
    }).sort((a, b) => new Date(a.period) - new Date(b.period));
    
    const netAmounts = netCashFlow.map(d => d.net);
    const regression = this.calculateLinearRegression(
      netCashFlow.map((d, i) => i),
      netAmounts
    );
    
    return {
      data: netCashFlow,
      trend: this.classifyTrend(regression.slope, regression.rSquared),
      slope: regression.slope,
      rSquared: regression.rSquared,
      averageNet: netAmounts.reduce((sum, val) => sum + val, 0) / netAmounts.length
    };
  }

  // Finansal sağlık skoru
  calculateFinancialHealthScore(expenseAnalysis, incomeAnalysis, netTrends) {
    let score = 50; // Base score
    
    // Trend factors
    if (expenseAnalysis.trend === 'decreasing') score += 15;
    if (expenseAnalysis.trend === 'increasing') score -= 15;
    if (incomeAnalysis.trend === 'increasing') score += 15;
    if (incomeAnalysis.trend === 'decreasing') score -= 15;
    
    // Volatility factors
    if (expenseAnalysis.volatility < 0.3) score += 10;
    if (expenseAnalysis.volatility > 0.7) score -= 10;
    
    // Net cash flow factors
    if (netTrends && netTrends.trend === 'increasing') score += 10;
    if (netTrends && netTrends.trend === 'decreasing') score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Finansal risk değerlendirmesi
  assessFinancialRisk(expenseAnalysis, incomeAnalysis) {
    const riskFactors = [];
    let riskLevel = 'low';
    
    // High volatility risk
    if (expenseAnalysis.volatility > 0.7) {
      riskFactors.push('Yüksek harcama volatilitesi');
      riskLevel = 'high';
    }
    
    // Decreasing income risk
    if (incomeAnalysis.trend === 'decreasing') {
      riskFactors.push('Gelir azalma trendi');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }
    
    // Increasing expenses risk
    if (expenseAnalysis.trend === 'increasing') {
      riskFactors.push('Harcama artış trendi');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }
    
    // Low confidence risk
    if (expenseAnalysis.confidence < 0.5 || incomeAnalysis.confidence < 0.5) {
      riskFactors.push('Düşük trend güvenilirliği');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }
    
    return { riskLevel, riskFactors };
  }

  // Trend sürdürülebilirliği
  assessTrendSustainability(expenseAnalysis, incomeAnalysis) {
    const factors = [];
    let sustainability = 'sustainable';
    
    // Expense sustainability
    if (expenseAnalysis.trend === 'increasing' && expenseAnalysis.slope > 0.1) {
      factors.push('Harcama artış hızı yüksek');
      sustainability = 'unsustainable';
    }
    
    // Income sustainability
    if (incomeAnalysis.trend === 'decreasing' && incomeAnalysis.slope < -0.1) {
      factors.push('Gelir azalma hızı yüksek');
      sustainability = 'unsustainable';
    }
    
    // Volatility sustainability
    if (expenseAnalysis.volatility > 0.8 || incomeAnalysis.volatility > 0.8) {
      factors.push('Yüksek volatilite');
      sustainability = 'risky';
    }
    
    return { sustainability, factors };
  }

  // Trend önerileri
  generateTrendRecommendations(expenseAnalysis, incomeAnalysis, netTrends) {
    const recommendations = [];
    
    // Expense recommendations
    if (expenseAnalysis.trend === 'increasing') {
      recommendations.push({
        type: 'warning',
        title: 'Harcama Kontrolü',
        description: 'Harcamalarınız artış trendinde. Bütçe planlamanızı gözden geçirin.',
        priority: 'high'
      });
    }
    
    // Income recommendations
    if (incomeAnalysis.trend === 'decreasing') {
      recommendations.push({
        type: 'danger',
        title: 'Gelir Artırımı',
        description: 'Gelirleriniz azalma trendinde. Yeni gelir kaynakları arayın.',
        priority: 'critical'
      });
    }
    
    // Volatility recommendations
    if (expenseAnalysis.volatility > 0.6) {
      recommendations.push({
        type: 'warning',
        title: 'Harcama Stabilizasyonu',
        description: 'Harcamalarınızda yüksek dalgalanma var. Düzenli harcama planı oluşturun.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  // Gelecek değer tahmini
  predictFutureValues(data, periodsAhead, confidenceLevel) {
    if (!data || data.length < 3) return null;
    
    const sortedData = data.sort((a, b) => new Date(a.period) - new Date(b.period));
    const amounts = sortedData.map(d => d.amount);
    const periods = sortedData.map((d, i) => i);
    
    const regression = this.calculateLinearRegression(periods, amounts);
    
    const predictions = [];
    for (let i = 1; i <= periodsAhead; i++) {
      const predictedValue = regression.slope * (periods.length + i) + regression.intercept;
      const confidenceInterval = this.calculateConfidenceInterval(regression, amounts, periods.length + i, confidenceLevel);
      
      predictions.push({
        period: `future_${i}`,
        predictedValue: Math.max(0, predictedValue), // Ensure non-negative
        confidenceInterval,
        confidence: confidenceLevel
      });
    }
    
    return {
      predictions,
      model: {
        slope: regression.slope,
        intercept: regression.intercept,
        rSquared: regression.rSquared
      }
    };
  }

  // Net cash flow tahmini
  predictNetCashFlow(expensePrediction, incomePrediction, confidenceLevel) {
    if (!expensePrediction || !incomePrediction) return null;
    
    const netPredictions = expensePrediction.predictions.map((expense, i) => {
      const income = incomePrediction.predictions[i];
      const net = income.predictedValue - expense.predictedValue;
      
      return {
        period: expense.period,
        predictedNet: net,
        predictedIncome: income.predictedValue,
        predictedExpense: expense.predictedValue,
        confidence: confidenceLevel
      };
    });
    
    return {
      predictions: netPredictions,
      averageNet: netPredictions.reduce((sum, p) => sum + p.predictedNet, 0) / netPredictions.length
    };
  }

  // Tahmin varsayımları
  generatePredictionAssumptions(expenseData, incomeData) {
    const assumptions = [];
    
    if (expenseData && expenseData.length > 0) {
      const expenseTrend = this.analyzeExpenseTrends(expenseData);
      assumptions.push({
        type: 'expense',
        assumption: `Harcama trendi ${expenseTrend.trend} olarak devam edecek`,
        confidence: expenseTrend.confidence
      });
    }
    
    if (incomeData && incomeData.length > 0) {
      const incomeTrend = this.analyzeIncomeTrends(incomeData);
      assumptions.push({
        type: 'income',
        assumption: `Gelir trendi ${incomeTrend.trend} olarak devam edecek`,
        confidence: incomeTrend.confidence
      });
    }
    
    return assumptions;
  }

  // Senaryo analizi
  generateScenarioAnalysis(expensePrediction, incomePrediction) {
    if (!expensePrediction || !incomePrediction) return null;
    
    const scenarios = {
      optimistic: {
        description: 'İyimser senaryo - Gelirler artar, harcamalar azalır',
        expenseMultiplier: 0.9,
        incomeMultiplier: 1.1
      },
      realistic: {
        description: 'Gerçekçi senaryo - Mevcut trendler devam eder',
        expenseMultiplier: 1.0,
        incomeMultiplier: 1.0
      },
      pessimistic: {
        description: 'Kötümser senaryo - Gelirler azalır, harcamalar artar',
        expenseMultiplier: 1.1,
        incomeMultiplier: 0.9
      }
    };
    
    return scenarios;
  }

  // Yardımcı metodlar
  calculateAutocorrelation(values, lag) {
    const autocorr = [];
    const n = values.length;
    
    for (let l = 0; l <= lag; l++) {
      let sum = 0;
      for (let i = 0; i < n - l; i++) {
        sum += values[i] * values[i + l];
      }
      autocorr.push(sum / (n - l));
    }
    
    return autocorr;
  }

  calculateConfidenceInterval(regression, values, x, confidenceLevel) {
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const residualVariance = values.reduce((sum, val, i) => {
      const predicted = regression.slope * i + regression.intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0) / (n - 2);
    
    const standardError = Math.sqrt(residualVariance * (1 + 1/n + Math.pow(x - n/2, 2) / (n * (n*n - 1) / 12)));
    const tValue = 1.96; // Approximate for 95% confidence
    
    return {
      lower: Math.max(0, (regression.slope * x + regression.intercept) - tValue * standardError),
      upper: (regression.slope * x + regression.intercept) + tValue * standardError
    };
  }

  groupByMonth(transactions) {
    const monthlyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      monthlyData[monthKey].push(transaction);
    });
    
    return monthlyData;
  }

  calculateSeasonalIndex(monthlyData) {
    const seasonalIndex = {};
    const months = Object.keys(monthlyData).sort();
    
    months.forEach(month => {
      const monthTransactions = monthlyData[month];
      const totalAmount = monthTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      seasonalIndex[month] = totalAmount;
    });
    
    return seasonalIndex;
  }

  calculateSeasonalStrength(seasonalIndex) {
    const values = Object.values(seasonalIndex);
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  findPeakMonths(seasonalIndex) {
    const entries = Object.entries(seasonalIndex);
    const sorted = entries.sort(([,a], [,b]) => b - a);
    return sorted.slice(0, 3).map(([month]) => month);
  }

  findLowMonths(seasonalIndex) {
    const entries = Object.entries(seasonalIndex);
    const sorted = entries.sort(([,a], [,b]) => a - b);
    return sorted.slice(0, 3).map(([month]) => month);
  }

  classifySeasonalPattern(seasonalIndex) {
    const strength = this.calculateSeasonalStrength(seasonalIndex);
    
    if (strength > 0.5) return 'strong';
    if (strength > 0.2) return 'moderate';
    return 'weak';
  }

  classifyAnomalySeverity(zScore) {
    if (zScore > 4) return 'critical';
    if (zScore > 3) return 'high';
    if (zScore > 2.5) return 'medium';
    return 'low';
  }

  explainAnomaly(amount, mean, stdDev, zScore) {
    const deviation = amount - mean;
    const percentage = Math.abs(deviation / mean) * 100;
    
    if (deviation > 0) {
      return `${percentage.toFixed(1)}% ortalamanın üzerinde (${zScore.toFixed(2)} standart sapma)`;
    } else {
      return `${percentage.toFixed(1)}% ortalamanın altında (${zScore.toFixed(2)} standart sapma)`;
    }
  }

  calculateBreakpointSignificance(change, before, after) {
    // Simple significance calculation based on change magnitude and data consistency
    const beforeStd = Math.sqrt(before.reduce((sum, val) => sum + Math.pow(val - (before.reduce((s, v) => s + v, 0) / before.length), 2), 0) / before.length);
    const afterStd = Math.sqrt(after.reduce((sum, val) => sum + Math.pow(val - (after.reduce((s, v) => s + v, 0) / after.length), 2), 0) / after.length);
    
    const avgStd = (beforeStd + afterStd) / 2;
    return change / avgStd;
  }

  async getTransactionDataForTrends(userId, dateRange) {
    // This would typically fetch from transaction service
    // For now, return empty array
    return [];
  }
}

export default new TrendAnalysisService();
