# 🧪 FinanceFlow Test Kullanıcısı

## 👤 Test Kullanıcı Bilgileri

### Giriş Bilgileri
- **E-posta:** `test@financeflow.app`
- **Şifre:** `123456`
- **Ad:** Test Kullanıcısı

### 💰 Test Hesapları
1. **Ana Hesap** - 15,650.50 TL
2. **Tasarruf Hesabı** - 25,000.00 TL  
3. **Kredi Kartı** - -3,250.75 TL (Limit: 20,000 TL)

### 📊 Test Verileri
- **10 adet** gerçekçi işlem (son 15 gün)
- **13 adet** gelir kategorisi
- **8 adet** gider kategorisi
- **2 adet** bütçe hedefi
- **2 adet** finansal hedef

### 🏷️ Kategoriler

#### Gelir Kategorileri:
- Maaş (8,500 TL)
- Freelance (1,500 TL)
- Yatırım
- Kira Geliri (500 TL)
- Diğer

#### Gider Kategorileri:
- Market (750.25 TL harcanmış)
- Ulaşım (130.50 TL)
- Faturalar (320 TL)
- Eğlence (150 TL)
- Sağlık (180 TL)
- Kira (1,250 TL)
- Eğitim
- Giyim

### 🎯 Hedefler
1. **Acil Durum Fonu**: 25,000/50,000 TL (%50)
2. **Tatil Fonu**: 8,500/15,000 TL (%57)

### 📈 İstatistikler
- **Aylık Gelir:** 10,500 TL
- **Aylık Gider:** 6,250 TL
- **Aylık Tasarruf:** 4,250 TL
- **Tasarruf Oranı:** %40.5

## 🧪 Test Senaryoları

### 1. Giriş Testi
```javascript
Email: test@financeflow.app
Password: 123456
```

### 2. İşlem Ekleme Testi
- Market alışverişi: -250 TL
- Freelance gelir: +1,500 TL
- Ulaşım gideri: -85 TL

### 3. Hesap Yönetimi
- 3 farklı hesap tipi
- Pozitif ve negatif bakiyeler
- Kredi kartı limit kontrolü

### 4. Kategori Testleri
- Renkli kategoriler
- Icon'lı görünüm
- Gelir/gider ayrımı

### 5. Bütçe Kontrolü
- Market bütçesi: 750/1000 TL (%75)
- Ulaşım bütçesi: 130/300 TL (%43)

## 🔧 Geliştirici Notları

### Test Verileri Kullanımı
```javascript
import { testUser, testFunctions } from '../utils/testData';

// Login test
const loginResult = testFunctions.loginTestUser();

// Kullanıcı verileri
const userData = testFunctions.getUserData();

// Yeni işlem ekle
const newTransaction = testFunctions.addTestTransaction(
  'expense', 
  150, 
  'exp-001', 
  'Test alışverişi'
);
```

### Veri Yapısı
- **Gerçekçi finansal veriler**
- **Türkçe açıklamalar**
- **Tarih bazlı işlemler**
- **Recurring transactions**
- **Geolocation verisi**
- **Receipt referansları**

### Test Coverage
- ✅ Authentication flow
- ✅ Transaction management
- ✅ Account balances
- ✅ Category system
- ✅ Budget tracking
- ✅ Goal management
- ✅ Statistics calculation

## 🎨 UI Test Örnekleri

### Dashboard
- Toplam bakiye: **37,399.75 TL**
- Bu ay tasarruf: **4,250 TL**
- Son işlemler görünür

### İşlem Listesi
- Tarih sıralı
- Kategori renkli
- Amount formatting
- Açıklama metinleri

### Analiz Ekranı
- Chart data ready
- Category breakdown
- Monthly trends
- Expense patterns

Bu test kullanıcısı ile uygulamanın tüm özelliklerini test edebilirsiniz! 🚀
