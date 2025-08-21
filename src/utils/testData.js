// FinanceFlow - Test User Data
export const testUser = {
  // Test kullanıcı bilgileri
  user: {
    id: 'test-user-001',
    firstName: 'Test',
    lastName: 'Kullanıcısı',
    email: 'test@financeflow.app',
    password: '123456',
    profilePicture: null,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isVerified: true,
    preferences: {
      currency: 'TRY',
      language: 'tr',
      notifications: true,
      darkMode: false,
    }
  },

  // Test finansal veriler
  accounts: [
    {
      id: 'acc-001',
      name: 'Ana Hesap',
      type: 'checking',
      balance: 15650.50,
      currency: 'TRY',
      icon: 'account-balance-wallet',
      color: '#6C63FF',
      isDefault: true,
      bankName: 'Garanti BBVA',
    },
    {
      id: 'acc-002', 
      name: 'Tasarruf Hesabı',
      type: 'savings',
      balance: 25000.00,
      currency: 'TRY',
      icon: 'savings',
      color: '#4ECDC4',
      isDefault: false,
      bankName: 'İş Bankası',
    },
    {
      id: 'acc-003',
      name: 'Kredi Kartı',
      type: 'credit',
      balance: -4250.75, // Negatif değer = borç
      creditLimit: 20000.00,
      availableCredit: 15749.25,
      minimumPayment: 212.54,
      dueDate: '15 Mart 2024',
      statementDate: '20 Şubat 2024', // Hesap kesim tarihi
      currency: 'TRY',
      icon: 'credit-card',
      color: '#F56565',
      isDefault: false,
      interestRate: 3.99, // Aylık faiz oranı %
      bankName: 'Yapı Kredi',
      lastStatement: {
        date: '2024-01-20', // Son kesim tarihi
        amount: 4250.75,
        dueDate: '2024-02-15',
        nextStatementDate: '2024-02-20' // Bir sonraki kesim tarihi
      },
      currentPeriodSpending: 1250.30, // Mevcut dönem harcama (henüz kesilmemiş)
      previousPeriodDebt: 3000.45, // Önceki dönem borcu (kesilmiş, ödenmesi gereken)
      recentTransactions: [
        { id: 't1', description: 'Market Alışverişi', amount: 125.50, type: 'expense', date: '2024-02-18' },
        { id: 't2', description: 'Benzin', amount: 250.00, type: 'expense', date: '2024-02-17' },
        { id: 't3', description: 'Restoran', amount: 180.75, type: 'expense', date: '2024-02-16' }
      ]
    },

  ],

  // Test kategoriler
  categories: {
    income: [
      { id: 'inc-001', name: 'Maaş', icon: 'work', color: '#48BB78', tags: ['maaş', 'iş', 'çalışan'] },
      { id: 'inc-002', name: 'Freelance', icon: 'computer', color: '#4ECDC4', tags: ['freelance', 'serbest', 'proje'] },
      { id: 'inc-003', name: 'Yatırım', icon: 'trending-up', color: '#ED8936', tags: ['yatırım', 'hisse', 'borsa', 'kripto'] },
      { id: 'inc-004', name: 'Kira Geliri', icon: 'home', color: '#9F7AEA', tags: ['kira', 'gelir', 'ev', 'dükkan'] },
      { id: 'inc-005', name: 'Diğer', icon: 'more-horiz', color: '#718096', tags: ['diğer', 'çeşitli'] },
      { id: 'inc-006', name: 'Ek İş', icon: 'business-center', color: '#38B2AC', tags: ['ek iş', 'part time', 'ek gelir'] },
      { id: 'inc-007', name: 'Bonus', icon: 'stars', color: '#ECC94B', tags: ['bonus', 'prim', 'ikramiye'] },
      { id: 'inc-008', name: 'Faiz Geliri', icon: 'account-balance', color: '#4299E1', tags: ['faiz', 'banka', 'mevduat'] },
      { id: 'inc-009', name: 'Kupon Geliri', icon: 'card-giftcard', color: '#ED64A6', tags: ['kupon', 'indirim', 'promosyon'] },
      { id: 'inc-010', name: 'Satış Geliri', icon: 'store', color: '#F56565', tags: ['satış', 'ticaret', 'ürün'] },
      { id: 'inc-011', name: 'Danışmanlık', icon: 'psychology', color: '#805AD5', tags: ['danışmanlık', 'uzmanlık', 'bilgi'] },
      { id: 'inc-012', name: 'Eğitim Geliri', icon: 'school', color: '#319795', tags: ['eğitim', 'kurs', 'özel ders'] },
      { id: 'inc-013', name: 'Sağlık Geliri', icon: 'local-hospital', color: '#2F855A', tags: ['sağlık', 'doktor', 'tedavi'] },
      { id: 'inc-014', name: 'Spor Geliri', icon: 'fitness-center', color: '#C53030', tags: ['spor', 'antrenör', 'fitness'] },
      { id: 'inc-015', name: 'Sanat Geliri', icon: 'brush', color: '#D69E2E', tags: ['sanat', 'resim', 'müzik', 'tasarım'] },
      
      // Daha Fazla Gelir Kategorileri
      { id: 'inc-016', name: 'Kira Geliri', icon: 'home', color: '#9F7AEA', tags: ['kira', 'gelir', 'ev', 'dükkan', 'ofis'] },
      { id: 'inc-017', name: 'Garaj Kira', icon: 'garage', color: '#4A5568', tags: ['garaj', 'kira', 'gelir', 'park'] },
      { id: 'inc-018', name: 'Depo Kira', icon: 'warehouse', color: '#2F855A', tags: ['depo', 'kira', 'gelir', 'eşya'] },
      { id: 'inc-019', name: 'Ofis Kira', icon: 'business', color: '#38B2AC', tags: ['ofis', 'kira', 'gelir', 'iş'] },
      { id: 'inc-020', name: 'Dükkan Kira', icon: 'store', color: '#805AD5', tags: ['dükkan', 'kira', 'gelir', 'ticaret'] },
      { id: 'inc-021', name: 'Tarla Kira', icon: 'agriculture', color: '#D69E2E', tags: ['tarla', 'kira', 'gelir', 'tarım'] },
      { id: 'inc-022', name: 'Bahçe Kira', icon: 'yard', color: '#4A5568', tags: ['bahçe', 'kira', 'gelir', 'yeşil'] },
      { id: 'inc-023', name: 'Park Yeri Kira', icon: 'local-parking', color: '#2F855A', tags: ['park', 'kira', 'gelir', 'araba'] },
      { id: 'inc-024', name: 'Tekne Kira', icon: 'directions-boat', color: '#38B2AC', tags: ['tekne', 'kira', 'gelir', 'deniz'] },
      { id: 'inc-025', name: 'Araba Kira', icon: 'directions-car', color: '#805AD5', tags: ['araba', 'kira', 'gelir', 'ulaşım'] },
      
      // Hizmet Gelirleri
      { id: 'inc-026', name: 'Temizlik Hizmeti', icon: 'cleaning-services', color: '#D69E2E', tags: ['temizlik', 'hizmet', 'gelir', 'ev'] },
      { id: 'inc-027', name: 'Bakım Hizmeti', icon: 'build', color: '#4A5568', tags: ['bakım', 'hizmet', 'gelir', 'tamir'] },
      { id: 'inc-028', name: 'Güvenlik Hizmeti', icon: 'security', color: '#2F855A', tags: ['güvenlik', 'hizmet', 'gelir', 'koruma'] },
      { id: 'inc-029', name: 'Çeviri Hizmeti', icon: 'translate', color: '#38B2AC', tags: ['çeviri', 'hizmet', 'gelir', 'dil'] },
      { id: 'inc-030', name: 'Tasarım Hizmeti', icon: 'design-services', color: '#805AD5', tags: ['tasarım', 'hizmet', 'gelir', 'grafik'] },
      { id: 'inc-031', name: 'Yazılım Hizmeti', icon: 'code', color: '#D69E2E', tags: ['yazılım', 'hizmet', 'gelir', 'program'] },
      { id: 'inc-032', name: 'Web Tasarım', icon: 'web', color: '#4A5568', tags: ['web', 'tasarım', 'hizmet', 'gelir'] },
      { id: 'inc-033', name: 'Sosyal Medya', icon: 'share', color: '#2F855A', tags: ['sosyal medya', 'hizmet', 'gelir', 'marketing'] },
      { id: 'inc-034', name: 'SEO Hizmeti', icon: 'search', color: '#38B2AC', tags: ['seo', 'hizmet', 'gelir', 'optimizasyon'] },
      { id: 'inc-035', name: 'Dijital Pazarlama', icon: 'trending-up', color: '#805AD5', tags: ['dijital', 'pazarlama', 'hizmet', 'gelir'] },
      
      // Eğitim & Öğretim Gelirleri
      { id: 'inc-036', name: 'Özel Ders', icon: 'school', color: '#D69E2E', tags: ['özel ders', 'eğitim', 'gelir', 'öğretim'] },
      { id: 'inc-037', name: 'Online Kurs', icon: 'computer', color: '#4A5568', tags: ['online', 'kurs', 'eğitim', 'gelir'] },
      { id: 'inc-038', name: 'Workshop', icon: 'groups', color: '#2F855A', tags: ['workshop', 'eğitim', 'gelir', 'atölye'] },
      { id: 'inc-039', name: 'Seminer', icon: 'event', color: '#38B2AC', tags: ['seminer', 'eğitim', 'gelir', 'konferans'] },
      { id: 'inc-040', name: 'Mentorluk', icon: 'psychology', color: '#805AD5', tags: ['mentorluk', 'eğitim', 'gelir', 'danışmanlık'] },
      { id: 'inc-041', name: 'Koçluk', icon: 'fitness-center', color: '#D69E2E', tags: ['koçluk', 'eğitim', 'gelir', 'spor'] },
      { id: 'inc-042', name: 'Yoga Dersi', icon: 'self-improvement', color: '#4A5568', tags: ['yoga', 'ders', 'eğitim', 'gelir'] },
      { id: 'inc-043', name: 'Pilates Dersi', icon: 'fitness-center', color: '#2F855A', tags: ['pilates', 'ders', 'eğitim', 'gelir'] },
      { id: 'inc-044', name: 'Dans Dersi', icon: 'music-note', color: '#38B2AC', tags: ['dans', 'ders', 'eğitim', 'gelir'] },
      { id: 'inc-045', name: 'Müzik Dersi', icon: 'music-note', color: '#805AD5', tags: ['müzik', 'ders', 'eğitim', 'gelir'] },
      
      // Sağlık & Bakım Gelirleri
      { id: 'inc-046', name: 'Masaj Hizmeti', icon: 'spa', color: '#D69E2E', tags: ['masaj', 'hizmet', 'gelir', 'sağlık'] },
      { id: 'inc-047', name: 'Cilt Bakımı', icon: 'face', color: '#4A5568', tags: ['cilt', 'bakım', 'hizmet', 'gelir'] },
      { id: 'inc-048', name: 'Saç Bakımı', icon: 'content-cut', color: '#2F855A', tags: ['saç', 'bakım', 'hizmet', 'gelir'] },
      { id: 'inc-049', name: 'Manikür', icon: 'brush', color: '#38B2AC', tags: ['manikür', 'hizmet', 'gelir', 'bakım'] },
      { id: 'inc-050', name: 'Pedikür', icon: 'brush', color: '#805AD5', tags: ['pedikür', 'hizmet', 'gelir', 'bakım'] },
      
      // Sanat & Yaratıcılık Gelirleri
      { id: 'inc-051', name: 'Resim Satışı', icon: 'brush', color: '#D69E2E', tags: ['resim', 'satış', 'sanat', 'gelir'] },
      { id: 'inc-052', name: 'Fotoğraf Çekimi', icon: 'camera-alt', color: '#4A5568', tags: ['fotoğraf', 'çekim', 'hizmet', 'gelir'] },
      { id: 'inc-053', name: 'Video Çekimi', icon: 'videocam', color: '#2F855A', tags: ['video', 'çekim', 'hizmet', 'gelir'] },
      { id: 'inc-054', name: 'Müzik Performansı', icon: 'music-note', color: '#38B2AC', tags: ['müzik', 'performans', 'sanat', 'gelir'] },
      { id: 'inc-055', name: 'Tiyatro Oyunu', icon: 'theater-comedy', color: '#805AD5', tags: ['tiyatro', 'oyun', 'sanat', 'gelir'] },
      
      // Ticaret & Satış Gelirleri
      { id: 'inc-056', name: 'Online Satış', icon: 'shopping-cart', color: '#D69E2E', tags: ['online', 'satış', 'ticaret', 'gelir'] },
      { id: 'inc-057', name: 'Pazaryeri', icon: 'store', color: '#4A5568', tags: ['pazaryeri', 'satış', 'ticaret', 'gelir'] },
      { id: 'inc-058', name: 'Dropshipping', icon: 'local-shipping', color: '#2F855A', tags: ['dropshipping', 'satış', 'ticaret', 'gelir'] },
      { id: 'inc-059', name: 'Affiliate', icon: 'link', color: '#38B2AC', tags: ['affiliate', 'satış', 'ticaret', 'gelir'] },
      { id: 'inc-060', name: 'Dijital Ürün', icon: 'cloud-download', color: '#805AD5', tags: ['dijital', 'ürün', 'satış', 'gelir'] }
    ],
    expense: [
      { id: 'exp-001', name: 'Market', icon: 'shopping-cart', color: '#F56565', tags: ['market', 'gıda', 'yiyecek', 'içecek'] },
      { id: 'exp-002', name: 'Ulaşım', icon: 'directions-car', color: '#ED8936', tags: ['ulaşım', 'araba', 'otobüs', 'metro', 'taksi'] },
      { id: 'exp-003', name: 'Faturalar', icon: 'receipt', color: '#ECC94B', tags: ['fatura', 'elektrik', 'su', 'doğalgaz', 'internet'] },
      { id: 'exp-004', name: 'Eğlence', icon: 'movie', color: '#9F7AEA', tags: ['eğlence', 'sinema', 'konser', 'tiyatro', 'oyun'] },
      { id: 'exp-005', name: 'Sağlık', icon: 'local-hospital', color: '#38B2AC', tags: ['sağlık', 'doktor', 'ilaç', 'tedavi', 'muayene'] },
      { id: 'exp-006', name: 'Kira', icon: 'home', color: '#6C63FF', tags: ['kira', 'ev', 'dükkan', 'ofis'] },
      { id: 'exp-007', name: 'Eğitim', icon: 'school', color: '#4299E1', tags: ['eğitim', 'kurs', 'kitap', 'okul', 'üniversite'] },
      { id: 'exp-008', name: 'Giyim', icon: 'shopping-bag', color: '#ED64A6', tags: ['giyim', 'ayakkabı', 'aksesuar', 'moda'] },
      
      // Platformlar & Abonelikler
      { id: 'exp-009', name: 'Netflix', icon: 'play-circle-filled', color: '#E50914', isPlatform: true, monthlyFee: 63.99, tags: ['netflix', 'streaming', 'abonelik', 'eğlence'] },
      { id: 'exp-010', name: 'Amazon Prime', icon: 'local-shipping', color: '#FF9900', isPlatform: true, monthlyFee: 7.90, tags: ['amazon', 'prime', 'abonelik', 'alışveriş'] },
      { id: 'exp-011', name: 'YouTube Premium', icon: 'play-circle-outline', color: '#FF0000', isPlatform: true, monthlyFee: 29.99, tags: ['youtube', 'premium', 'abonelik', 'video'] },
      { id: 'exp-012', name: 'Spotify Premium', icon: 'music-note', color: '#1DB954', isPlatform: true, monthlyFee: 19.99, tags: ['spotify', 'premium', 'abonelik', 'müzik'] },
      { id: 'exp-013', name: 'Disney+', icon: 'movie', color: '#0063E1', isPlatform: true, monthlyFee: 39.99, tags: ['disney', 'streaming', 'abonelik', 'çocuk'] },
      { id: 'exp-014', name: 'HBO Max', icon: 'tv', color: '#B535F6', isPlatform: true, monthlyFee: 49.99, tags: ['hbo', 'max', 'streaming', 'abonelik'] },
      { id: 'exp-015', name: 'Apple Music', icon: 'music-note', color: '#FA243C', isPlatform: true, monthlyFee: 24.99, tags: ['apple', 'music', 'abonelik', 'müzik'] },
      { id: 'exp-016', name: 'Microsoft 365', icon: 'computer', color: '#0078D4', isPlatform: true, monthlyFee: 89.99, tags: ['microsoft', '365', 'office', 'abonelik'] },
      { id: 'exp-017', name: 'Adobe Creative Cloud', icon: 'brush', color: '#FF0000', isPlatform: true, monthlyFee: 199.99, tags: ['adobe', 'creative', 'cloud', 'abonelik'] },
      { id: 'exp-018', name: 'LinkedIn Premium', icon: 'business', color: '#0077B5', isPlatform: true, monthlyFee: 79.99, tags: ['linkedin', 'premium', 'abonelik', 'iş'] },
      { id: 'exp-019', name: 'Udemy', icon: 'school', color: '#EC5252', isPlatform: true, monthlyFee: 19.99, tags: ['udemy', 'kurs', 'eğitim', 'abonelik'] },
      { id: 'exp-020', name: 'Coursera', icon: 'library-books', color: '#0056D2', isPlatform: true, monthlyFee: 39.99, tags: ['coursera', 'kurs', 'eğitim', 'abonelik'] },
      
      // Günlük Yaşam
      { id: 'exp-021', name: 'Restoran', icon: 'restaurant', color: '#E53E3E', tags: ['restoran', 'yemek', 'dışarı', 'cafe'] },
      { id: 'exp-022', name: 'Kahve', icon: 'local-cafe', color: '#8B4513', tags: ['kahve', 'cafe', 'içecek', 'dışarı'] },
      { id: 'exp-023', name: 'Spor Salonu', icon: 'fitness-center', color: '#2F855A', tags: ['spor', 'gym', 'fitness', 'egzersiz'] },
      { id: 'exp-024', name: 'Kozmetik', icon: 'face', color: '#D69E2E', tags: ['kozmetik', 'makyaj', 'bakım', 'güzellik'] },
      { id: 'exp-025', name: 'Seyahat', icon: 'flight', color: '#3182CE', tags: ['seyahat', 'uçak', 'otel', 'tatil'] },
      { id: 'exp-026', name: 'Sigorta', icon: 'security', color: '#38A169', tags: ['sigorta', 'sağlık', 'hayat', 'araba'] },
      { id: 'exp-027', name: 'Vergi', icon: 'account-balance', color: '#E53E3E', tags: ['vergi', 'gelir', 'kdv', 'devlet'] },
      { id: 'exp-028', name: 'Kredi', icon: 'credit-card', color: '#805AD5', tags: ['kredi', 'borç', 'taksit', 'banka'] },
      { id: 'exp-029', name: 'Benzin', icon: 'local-gas-station', color: '#D69E2E', tags: ['benzin', 'yakıt', 'araba', 'ulaşım'] },
      { id: 'exp-030', name: 'Park', icon: 'local-parking', color: '#4A5568', tags: ['park', 'otopark', 'ulaşım', 'araba'] },
      
      // Teknoloji & İletişim
      { id: 'exp-031', name: 'Telefon', icon: 'phone', color: '#3182CE', tags: ['telefon', 'gsm', 'mobil', 'iletişim'] },
      { id: 'exp-032', name: 'Bilgisayar', icon: 'laptop', color: '#2D3748', tags: ['bilgisayar', 'laptop', 'teknoloji', 'donanım'] },
      { id: 'exp-033', name: 'Yazılım', icon: 'code', color: '#805AD5', tags: ['yazılım', 'program', 'app', 'teknoloji'] },
      { id: 'exp-034', name: 'Oyun', icon: 'sports-esports', color: '#E53E3E', tags: ['oyun', 'game', 'eğlence', 'hobi'] },
      { id: 'exp-035', name: 'Kamera', icon: 'camera-alt', color: '#2F855A', tags: ['kamera', 'fotoğraf', 'video', 'hobi'] },
      
      // Ev & Yaşam
      { id: 'exp-036', name: 'Mobilya', icon: 'chair', color: '#8B4513', tags: ['mobilya', 'ev', 'dekorasyon', 'eşya'] },
      { id: 'exp-037', name: 'Ev Aletleri', icon: 'kitchen', color: '#4A5568', tags: ['ev aletleri', 'beyaz eşya', 'mutfak'] },
      { id: 'exp-038', name: 'Temizlik', icon: 'cleaning-services', color: '#38B2AC', tags: ['temizlik', 'deterjan', 'ev', 'bakım'] },
      { id: 'exp-039', name: 'Bahçe', icon: 'yard', color: '#2F855A', tags: ['bahçe', 'çiçek', 'bitki', 'hobi'] },
      { id: 'exp-040', name: 'Tamir', icon: 'build', color: '#D69E2E', tags: ['tamir', 'bakım', 'onarım', 'ev'] },
      
      // Daha Fazla Gider Kategorileri
      { id: 'exp-041', name: 'Kırtasiye', icon: 'edit', color: '#805AD5', tags: ['kırtasiye', 'kalem', 'defter', 'okul'] },
      { id: 'exp-042', name: 'Kitap', icon: 'book', color: '#2F855A', tags: ['kitap', 'okuma', 'eğitim', 'hobi'] },
      { id: 'exp-043', name: 'Dergi', icon: 'article', color: '#E53E3E', tags: ['dergi', 'magazin', 'okuma'] },
      { id: 'exp-044', name: 'Gazete', icon: 'newspaper', color: '#4A5568', tags: ['gazete', 'haber', 'güncel'] },
      { id: 'exp-045', name: 'Müzik Aleti', icon: 'music-note', color: '#D69E2E', tags: ['müzik', 'alet', 'enstrüman', 'hobi'] },
      { id: 'exp-046', name: 'Spor Ekipmanı', icon: 'sports-soccer', color: '#38A169', tags: ['spor', 'ekipman', 'top', 'raket'] },
      { id: 'exp-047', name: 'Bisiklet', icon: 'directions-bike', color: '#3182CE', tags: ['bisiklet', 'ulaşım', 'spor', 'hobi'] },
      { id: 'exp-048', name: 'Kayak', icon: 'ac-unit', color: '#2B6CB0', tags: ['kayak', 'kış', 'spor', 'tatil'] },
      { id: 'exp-049', name: 'Yüzme', icon: 'pool', color: '#00B5D8', tags: ['yüzme', 'spor', 'havuz', 'deniz'] },
      { id: 'exp-050', name: 'Tenis', icon: 'sports-tennis', color: '#38A169', tags: ['tenis', 'spor', 'raket', 'top'] },
      
      // Ev & Yaşam Devamı
      { id: 'exp-051', name: 'Halı', icon: 'carpet', color: '#8B4513', tags: ['halı', 'ev', 'dekorasyon', 'zemin'] },
      { id: 'exp-052', name: 'Perde', icon: 'curtains', color: '#D69E2E', tags: ['perde', 'ev', 'dekorasyon', 'pencere'] },
      { id: 'exp-053', name: 'Yastık', icon: 'bed', color: '#4A5568', tags: ['yastık', 'yatak', 'ev', 'uyku'] },
      { id: 'exp-054', name: 'Çarşaf', icon: 'bed', color: '#2F855A', tags: ['çarşaf', 'yatak', 'ev', 'uyku'] },
      { id: 'exp-055', name: 'Havlu', icon: 'hot-tub', color: '#38B2AC', tags: ['havlu', 'banyo', 'ev', 'kişisel'] },
      { id: 'exp-056', name: 'Banyo Malzemesi', icon: 'bathroom', color: '#805AD5', tags: ['banyo', 'malzeme', 'ev', 'temizlik'] },
      { id: 'exp-057', name: 'Mutfak Malzemesi', icon: 'kitchen', color: '#D69E2E', tags: ['mutfak', 'malzeme', 'ev', 'yemek'] },
      { id: 'exp-058', name: 'Çatal Bıçak', icon: 'restaurant', color: '#4A5568', tags: ['çatal', 'bıçak', 'mutfak', 'ev'] },
      { id: 'exp-059', name: 'Tabak', icon: 'restaurant', color: '#2F855A', tags: ['tabak', 'mutfak', 'ev', 'yemek'] },
      { id: 'exp-060', name: 'Bardak', icon: 'local-cafe', color: '#38B2AC', tags: ['bardak', 'mutfak', 'ev', 'içecek'] },
      
      // Teknoloji & İletişim Devamı
      { id: 'exp-061', name: 'Kulaklık', icon: 'headphones', color: '#805AD5', tags: ['kulaklık', 'müzik', 'teknoloji', 'ses'] },
      { id: 'exp-062', name: 'Hoparlör', icon: 'speaker', color: '#D69E2E', tags: ['hoparlör', 'ses', 'müzik', 'teknoloji'] },
      { id: 'exp-063', name: 'Mikrofon', icon: 'mic', color: '#4A5568', tags: ['mikrofon', 'ses', 'kayıt', 'teknoloji'] },
      { id: 'exp-064', name: 'Webcam', icon: 'videocam', color: '#2F855A', tags: ['webcam', 'kamera', 'video', 'teknoloji'] },
      { id: 'exp-065', name: 'Tablet', icon: 'tablet', color: '#38B2AC', tags: ['tablet', 'teknoloji', 'bilgisayar', 'mobil'] },
      { id: 'exp-066', name: 'Akıllı Saat', icon: 'watch', color: '#805AD5', tags: ['akıllı saat', 'teknoloji', 'giyilebilir', 'fitness'] },
      { id: 'exp-067', name: 'Akıllı Ev', icon: 'home', color: '#D69E2E', tags: ['akıllı ev', 'teknoloji', 'otomasyon', 'ev'] },
      { id: 'exp-068', name: 'Güvenlik Kamerası', icon: 'security', color: '#4A5568', tags: ['güvenlik', 'kamera', 'ev', 'güvenlik'] },
      { id: 'exp-069', name: 'Router', icon: 'wifi', color: '#2F855A', tags: ['router', 'internet', 'wifi', 'teknoloji'] },
      { id: 'exp-070', name: 'USB Kablo', icon: 'usb', color: '#38B2AC', tags: ['usb', 'kablo', 'teknoloji', 'bağlantı'] },
      
      // Sağlık & Kişisel Bakım Devamı
      { id: 'exp-071', name: 'Vitamin', icon: 'healing', color: '#805AD5', tags: ['vitamin', 'sağlık', 'ilaç', 'beslenme'] },
      { id: 'exp-072', name: 'Protein', icon: 'fitness-center', color: '#D69E2E', tags: ['protein', 'spor', 'beslenme', 'fitness'] },
      { id: 'exp-073', name: 'Kreatin', icon: 'fitness-center', color: '#4A5568', tags: ['kreatin', 'spor', 'beslenme', 'fitness'] },
      { id: 'exp-074', name: 'BCAA', icon: 'fitness-center', color: '#2F855A', tags: ['bcaa', 'spor', 'beslenme', 'amino asit'] },
      { id: 'exp-075', name: 'Omega 3', icon: 'healing', color: '#38B2AC', tags: ['omega 3', 'sağlık', 'vitamin', 'balık yağı'] },
      { id: 'exp-076', name: 'D Vitamini', icon: 'wb-sunny', color: '#805AD5', tags: ['d vitamini', 'sağlık', 'vitamin', 'güneş'] },
      { id: 'exp-077', name: 'C Vitamini', icon: 'healing', color: '#D69E2E', tags: ['c vitamini', 'sağlık', 'vitamin', 'bağışıklık'] },
      { id: 'exp-078', name: 'B12 Vitamini', icon: 'healing', color: '#4A5568', tags: ['b12', 'vitamin', 'sağlık', 'enerji'] },
      { id: 'exp-079', name: 'Magnezyum', icon: 'healing', color: '#2F855A', tags: ['magnezyum', 'mineral', 'sağlık', 'kas'] },
      { id: 'exp-080', name: 'Çinko', icon: 'healing', color: '#38B2AC', tags: ['çinko', 'mineral', 'sağlık', 'bağışıklık'] },
      
      // Hobi & Eğlence Devamı
      { id: 'exp-081', name: 'Puzzle', icon: 'extension', color: '#805AD5', tags: ['puzzle', 'hobi', 'oyun', 'eğlence'] },
      { id: 'exp-082', name: 'Lego', icon: 'toys', color: '#D69E2E', tags: ['lego', 'oyun', 'hobi', 'çocuk'] },
      { id: 'exp-083', name: 'Model Uçak', icon: 'flight', color: '#4A5568', tags: ['model uçak', 'hobi', 'koleksiyon', 'uçak'] },
      { id: 'exp-084', name: 'Model Araba', icon: 'directions-car', color: '#2F855A', tags: ['model araba', 'hobi', 'koleksiyon', 'araba'] },
      { id: 'exp-085', name: 'Koleksiyon', icon: 'collections', color: '#38B2AC', tags: ['koleksiyon', 'hobi', 'toplama', 'değerli'] },
      { id: 'exp-086', name: 'Pul', icon: 'mail', color: '#805AD5', tags: ['pul', 'koleksiyon', 'hobi', 'posta'] },
      { id: 'exp-087', name: 'Para', icon: 'monetization-on', color: '#D69E2E', tags: ['para', 'koleksiyon', 'hobi', 'eski para'] },
      { id: 'exp-088', name: 'Madeni Para', icon: 'monetization-on', color: '#4A5568', tags: ['madeni para', 'koleksiyon', 'hobi', 'eski'] },
      { id: 'exp-089', name: 'Antika', icon: 'museum', color: '#2F855A', tags: ['antika', 'koleksiyon', 'hobi', 'eski', 'değerli'] },
      { id: 'exp-090', name: 'Sanat Eseri', icon: 'brush', color: '#38B2AC', tags: ['sanat', 'eser', 'resim', 'heykel', 'hobi'] },
      
      // Seyahat & Tatil Devamı
      { id: 'exp-091', name: 'Uçak Bileti', icon: 'flight', color: '#805AD5', tags: ['uçak', 'bilet', 'seyahat', 'tatil'] },
      { id: 'exp-092', name: 'Otel', icon: 'hotel', color: '#D69E2E', tags: ['otel', 'konaklama', 'tatil', 'seyahat'] },
      { id: 'exp-093', name: 'Tren Bileti', icon: 'train', color: '#4A5568', tags: ['tren', 'bilet', 'seyahat', 'ulaşım'] },
      { id: 'exp-094', name: 'Otobüs Bileti', icon: 'directions-bus', color: '#2F855A', tags: ['otobüs', 'bilet', 'seyahat', 'ulaşım'] },
      { id: 'exp-095', name: 'Gemi Bileti', icon: 'directions-boat', color: '#38B2AC', tags: ['gemi', 'bilet', 'seyahat', 'tatil'] },
      { id: 'exp-096', name: 'Tur Rehberi', icon: 'person', color: '#805AD5', tags: ['tur', 'rehber', 'seyahat', 'tatil'] },
      { id: 'exp-097', name: 'Vize', icon: 'passport', color: '#D69E2E', tags: ['vize', 'pasaport', 'seyahat', 'yurtdışı'] },
      { id: 'exp-098', name: 'Seyahat Sigortası', icon: 'security', color: '#4A5568', tags: ['sigorta', 'seyahat', 'tatil', 'güvenlik'] },
      { id: 'exp-099', name: 'Bagaj', icon: 'luggage', color: '#2F855A', tags: ['bagaj', 'seyahat', 'tatil', 'eşya'] },
      { id: 'exp-100', name: 'Souvenir', icon: 'card-giftcard', color: '#38B2AC', tags: ['souvenir', 'hediye', 'tatil', 'anı'] }
    ]
  },

  // Backward compatibility for components expecting these names
  incomeCategories: [
    { id: 'inc-001', name: 'Maaş', icon: 'work', color: '#48BB78' },
    { id: 'inc-002', name: 'Freelance', icon: 'computer', color: '#4ECDC4' },
    { id: 'inc-003', name: 'Yatırım', icon: 'trending-up', color: '#ED8936' },
    { id: 'inc-004', name: 'Kira Geliri', icon: 'home', color: '#9F7AEA' },
    { id: 'inc-005', name: 'Diğer', icon: 'more-horiz', color: '#718096' },
  ],

  expenseCategories: [
    { id: 'exp-001', name: 'Market', icon: 'shopping-cart', color: '#F56565' },
    { id: 'exp-002', name: 'Ulaşım', icon: 'directions-car', color: '#ED8936' },
    { id: 'exp-003', name: 'Faturalar', icon: 'receipt', color: '#ECC94B' },
    { id: 'exp-004', name: 'Eğlence', icon: 'movie', color: '#9F7AEA' },
    { id: 'exp-005', name: 'Sağlık', icon: 'local-hospital', color: '#38B2AC' },
    { id: 'exp-006', name: 'Kira', icon: 'home', color: '#6C63FF' },
    { id: 'exp-007', name: 'Eğitim', icon: 'school', color: '#4299E1' },
    { id: 'exp-008', name: 'Giyim', icon: 'shopping-bag', color: '#ED64A6' },
    
    // Dijital Platformlar & Abonelikler
    { id: 'exp-009', name: 'Netflix', icon: 'play-circle-filled', color: '#E50914', isPlatform: true, monthlyFee: 63.99, type: 'subscription' },
    { id: 'exp-010', name: 'Amazon Prime', icon: 'local-shipping', color: '#FF9900', isPlatform: true, monthlyFee: 7.90, type: 'subscription' },
    { id: 'exp-011', name: 'YouTube Premium', icon: 'play-arrow', color: '#FF0000', isPlatform: true, monthlyFee: 29.99, type: 'subscription' },
    { id: 'exp-012', name: 'Spotify', icon: 'music-note', color: '#1DB954', isPlatform: true, monthlyFee: 17.99, type: 'subscription' },
    { id: 'exp-013', name: 'Disney+', icon: 'stars', color: '#113CCF', isPlatform: true, monthlyFee: 34.99, type: 'subscription' },
    { id: 'exp-014', name: 'Apple Music', icon: 'library-music', color: '#FC3C44', isPlatform: true, monthlyFee: 19.99, type: 'subscription' },
    { id: 'exp-015', name: 'Adobe Creative', icon: 'brush', color: '#FF0000', isPlatform: true, monthlyFee: 169.00, type: 'subscription' },
    { id: 'exp-016', name: 'Microsoft 365', icon: 'computer', color: '#0078D4', isPlatform: true, monthlyFee: 69.00, type: 'subscription' },
    { id: 'exp-017', name: 'iCloud', icon: 'cloud', color: '#007AFF', isPlatform: true, monthlyFee: 2.99, type: 'subscription' },
    { id: 'exp-018', name: 'Twitch', icon: 'videogame-asset', color: '#9146FF', isPlatform: true, monthlyFee: 34.99, type: 'subscription' },
    { id: 'exp-019', name: 'LinkedIn Premium', icon: 'work', color: '#0077B5', isPlatform: true, monthlyFee: 129.99, type: 'subscription' },
    { id: 'exp-020', name: 'Canva Pro', icon: 'palette', color: '#00C4CC', isPlatform: true, monthlyFee: 54.99, type: 'subscription' },
    { id: 'exp-021', name: 'GitHub Pro', icon: 'code', color: '#24292F', isPlatform: true, monthlyFee: 24.00, type: 'subscription' },
    { id: 'exp-022', name: 'Dropbox Plus', icon: 'cloud-download', color: '#0061FF', isPlatform: true, monthlyFee: 44.99, type: 'subscription' },
  ],

  // Son 30 gün test işlemleri
  transactions: [
    {
      id: 'trx-001',
      type: 'income',
      amount: 8500.00,
      categoryId: 'inc-001',
      accountId: 'acc-001',
      description: 'Maaş ödemesi',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: true,
      tags: ['maaş', 'işyeri'],
    },
    {
      id: 'trx-002',
      type: 'expense',
      amount: -250.75,
      categoryId: 'exp-001',
      accountId: 'acc-001',
      description: 'Haftalık market alışverişi',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      receipt: 'receipt-001.jpg',
      location: 'Migros AVM',
    },
    {
      id: 'trx-003',
      type: 'expense',
      amount: -85.50,
      categoryId: 'exp-002',
      accountId: 'acc-003',
      description: 'Uber yolculukları',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['ulaşım', 'uber'],
    },
    {
      id: 'trx-004',
      type: 'expense',
      amount: -1250.00,
      categoryId: 'exp-006',
      accountId: 'acc-001',
      description: 'Aylık kira ödemesi',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: true,
      tags: ['kira', 'ev'],
    },
    {
      id: 'trx-005',
      type: 'income',
      amount: 1500.00,
      categoryId: 'inc-002',
      accountId: 'acc-001',
      description: 'Web sitesi projesu',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['freelance', 'web'],
    },
    {
      id: 'trx-006',
      type: 'expense',
      amount: -320.00,
      categoryId: 'exp-003',
      accountId: 'acc-001',
      description: 'Elektrik faturası',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['fatura', 'elektrik'],
    },
    {
      id: 'trx-007',
      type: 'expense',
      amount: -150.00,
      categoryId: 'exp-004',
      accountId: 'acc-003',
      description: 'Sinema ve yemek',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Akasya AVM',
      tags: ['eğlence', 'sinema'],
    },
    {
      id: 'trx-008',
      type: 'expense',
      amount: -45.00,
      categoryId: 'exp-002',
      accountId: 'acc-001',
      description: 'Otobüs kart yükleme',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['ulaşım', 'otobüs'],
    },
    {
      id: 'trx-009',
      type: 'income',
      amount: 500.00,
      categoryId: 'inc-004',
      accountId: 'acc-002',
      description: 'Dükkan kira geliri',
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      isRecurring: true,
      tags: ['kira', 'gelir'],
    },
    {
      id: 'trx-010',
      type: 'expense',
      amount: -180.00,
      categoryId: 'exp-005',
      accountId: 'acc-001',
      description: 'Doktor muayenesi',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['sağlık', 'doktor'],
    },
    {
      id: 'trx-011',
      type: 'expense',
      amount: -450.00,
      categoryId: 'exp-007',
      accountId: 'acc-001',
      description: 'Online kurs satın alma',
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['eğitim', 'kurs'],
    },
    {
      id: 'trx-012',
      type: 'expense',
      amount: -320.00,
      categoryId: 'exp-008',
      accountId: 'acc-001',
      description: 'Giyim alışverişi',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['giyim', 'alışveriş'],
    },
    {
      id: 'trx-013',
      type: 'expense',
      amount: -95.00,
      categoryId: 'exp-001',
      accountId: 'acc-001',
      description: 'Market alışverişi',
      date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['market', 'gıda'],
    },
    {
      id: 'trx-014',
      type: 'expense',
      amount: -280.00,
      categoryId: 'exp-003',
      accountId: 'acc-001',
      description: 'Su ve doğalgaz faturası',
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['fatura', 'su', 'doğalgaz'],
    },
    {
      id: 'trx-015',
      type: 'expense',
      amount: -160.00,
      categoryId: 'exp-002',
      accountId: 'acc-001',
      description: 'Benzin',
      date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['ulaşım', 'benzin'],
    },
    {
      id: 'trx-016',
      type: 'income',
      amount: 2000.00,
      categoryId: 'inc-003',
      accountId: 'acc-001',
      description: 'Hisse senedi karı',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['yatırım', 'hisse'],
    },
    {
      id: 'trx-017',
      type: 'expense',
      amount: -75.00,
      categoryId: 'exp-004',
      accountId: 'acc-001',
      description: 'Restoran',
      date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['eğlence', 'yemek'],
    },
    {
      id: 'trx-018',
      type: 'expense',
      amount: -120.00,
      categoryId: 'exp-005',
      accountId: 'acc-001',
      description: 'İlaç',
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['sağlık', 'ilaç'],
    },
    {
      id: 'trx-019',
      type: 'expense',
      amount: -200.00,
      categoryId: 'exp-007',
      accountId: 'acc-001',
      description: 'Kitap alışverişi',
      date: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['eğitim', 'kitap'],
    },
    {
      id: 'trx-020',
      type: 'expense',
      amount: -350.00,
      categoryId: 'exp-008',
      accountId: 'acc-001',
      description: 'Ayakkabı alışverişi',
      date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['giyim', 'ayakkabı'],
    }
  ],

  // Bütçe hedefleri
  budgets: [
    {
      id: 'budget-001',
      categoryId: 'exp-001',
      name: 'Market Bütçesi',
      amount: 1000,
      spent: 750.25,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    },
    {
      id: 'budget-002',
      categoryId: 'exp-002',
      name: 'Ulaşım Bütçesi',
      amount: 300,
      spent: 130.50,
      period: 'monthly',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    }
  ],

  // Finansal hedefler
  goals: [
    {
      id: 'goal-001',
      name: 'Araba Alımı',
      targetAmount: 150000,
      currentAmount: 45000,
      icon: 'directions-car',
      color: '#6C63FF',
      deadline: '2025-12-31',
      monthlyContribution: 5000,
      category: 'savings',
      priority: 'high',
      description: 'Yeni araba alımı için tasarruf',
      createdAt: '2024-01-01',
      lastContribution: '2024-02-01',
      contributions: [
        { date: '2024-01-01', amount: 5000, type: 'manual' },
        { date: '2024-02-01', amount: 5000, type: 'automatic' }
      ]
    },
    {
      id: 'goal-002',
      name: 'Ev Kredisi',
      targetAmount: 500000,
      currentAmount: 75000,
      icon: 'home',
      color: '#48BB78',
      deadline: '2026-06-30',
      monthlyContribution: 8000,
      category: 'investment',
      priority: 'high',
      description: 'Ev kredisi için peşinat',
      createdAt: '2023-06-01',
      lastContribution: '2024-02-01',
      contributions: [
        { date: '2023-06-01', amount: 10000, type: 'manual' },
        { date: '2023-07-01', amount: 8000, type: 'automatic' },
        { date: '2023-08-01', amount: 8000, type: 'automatic' },
        { date: '2023-09-01', amount: 8000, type: 'automatic' },
        { date: '2023-10-01', amount: 8000, type: 'automatic' },
        { date: '2023-11-01', amount: 8000, type: 'automatic' },
        { date: '2023-12-01', amount: 8000, type: 'automatic' },
        { date: '2024-01-01', amount: 8000, type: 'automatic' },
        { date: '2024-02-01', amount: 8000, type: 'automatic' }
      ]
    },
    {
      id: 'goal-003',
      name: 'Acil Durum Fonu',
      targetAmount: 50000,
      currentAmount: 25000,
      icon: 'security',
      color: '#ED8936',
      deadline: '2024-12-31',
      monthlyContribution: 2500,
      category: 'emergency',
      priority: 'medium',
      description: '6 aylık acil durum fonu',
      createdAt: '2023-01-01',
      lastContribution: '2024-02-01',
      contributions: [
        { date: '2023-01-01', amount: 5000, type: 'manual' },
        { date: '2023-02-01', amount: 2500, type: 'automatic' },
        { date: '2023-03-01', amount: 2500, type: 'automatic' },
        { date: '2023-04-01', amount: 2500, type: 'automatic' },
        { date: '2023-05-01', amount: 2500, type: 'automatic' },
        { date: '2023-06-01', amount: 2500, type: 'automatic' },
        { date: '2023-07-01', amount: 2500, type: 'automatic' },
        { date: '2023-08-01', amount: 2500, type: 'automatic' },
        { date: '2023-09-01', amount: 2500, type: 'automatic' },
        { date: '2023-10-01', amount: 2500, type: 'automatic' },
        { date: '2023-11-01', amount: 2500, type: 'automatic' },
        { date: '2023-12-01', amount: 2500, type: 'automatic' },
        { date: '2024-01-01', amount: 2500, type: 'automatic' },
        { date: '2024-02-01', amount: 2500, type: 'automatic' }
      ]
    }
  ],

  // Sabit Gelir ve Giderler
  recurringTransactions: {
    income: [
      {
        id: 'rec-inc-001',
        description: 'Maaş',
        amount: 15000,
        categoryId: 'inc-001',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'work',
        color: '#48BB78'
      },
      {
        id: 'rec-inc-002',
        description: 'Kira Geliri',
        amount: 8000,
        categoryId: 'inc-004',
        accountId: 'acc-002',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'home',
        color: '#9F7AEA'
      }
    ],
    expenses: [
      {
        id: 'rec-exp-001',
        description: 'Netflix',
        amount: 63.99,
        categoryId: 'exp-009',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'play-circle-filled',
        color: '#E50914',
        isPlatform: true,
        platformName: 'Netflix'
      },
      {
        id: 'rec-exp-002',
        description: 'Amazon Prime',
        amount: 7.90,
        categoryId: 'exp-010',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'local-shipping',
        color: '#FF9900',
        isPlatform: true,
        platformName: 'Amazon Prime'
      },
      {
        id: 'rec-exp-003',
        description: 'YouTube Premium',
        amount: 29.99,
        categoryId: 'exp-011',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'play-circle-outline',
        color: '#FF0000',
        isPlatform: true,
        platformName: 'YouTube Premium'
      },
      {
        id: 'rec-exp-004',
        description: 'Spotify Premium',
        amount: 19.99,
        categoryId: 'exp-012',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'music-note',
        color: '#1DB954',
        isPlatform: true,
        platformName: 'Spotify Premium'
      },
      {
        id: 'rec-exp-005',
        description: 'Kira',
        amount: 12000,
        categoryId: 'exp-006',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'home',
        color: '#6C63FF'
      },
      {
        id: 'rec-exp-006',
        description: 'Elektrik Faturası',
        amount: 450,
        categoryId: 'exp-003',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'receipt',
        color: '#ECC94B'
      },
      {
        id: 'rec-exp-007',
        description: 'Su Faturası',
        amount: 180,
        categoryId: 'exp-003',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'receipt',
        color: '#ECC94B'
      },
      {
        id: 'rec-exp-008',
        description: 'İnternet Faturası',
        amount: 299,
        categoryId: 'exp-003',
        accountId: 'acc-001',
        frequency: 'monthly',
        nextDate: '2024-03-01',
        isActive: true,
        startDate: '2023-01-01',
        endDate: null,
        lastProcessed: '2024-02-01',
        icon: 'receipt',
        color: '#ECC94B'
      }
    ]
  },

  // İstatistikler
  statistics: {
    monthlyIncome: 10500,
    monthlyExpenses: 6250,
    monthlySavings: 4250,
    savingsRate: 40.5,
    topExpenseCategory: 'Market',
    transactionCount: 45,
    avgTransactionAmount: 275.50,
  }
};

// Test fonksiyonları
export const testFunctions = {
  // Login test kullanıcısı
  loginTestUser: () => {
    return {
      success: true,
      user: testUser.user,
      token: 'test-jwt-token-123456789',
      expiresIn: '7d',
    };
  },

  // Kullanıcı verilerini getir
  getUserData: () => {
    return {
      ...testUser,
      lastSync: new Date().toISOString(),
    };
  },

  // Test işlemi ekle
  addTestTransaction: (type, amount, categoryId, description) => {
    const newTransaction = {
      id: `trx-${Date.now()}`,
      type,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      categoryId,
      accountId: testUser.accounts[0].id,
      description,
      date: new Date().toISOString(),
      tags: [],
    };
    
    testUser.transactions.unshift(newTransaction);
    return newTransaction;
  },

  // Test hesap güncelle
  updateAccountBalance: (accountId, amount) => {
    const account = testUser.accounts.find(acc => acc.id === accountId);
    if (account) {
      account.balance += amount;
      return account;
    }
    return null;
  },

  // Test kategorisi ekle
  addTestCategory: (type, name, icon, color) => {
    const newCategory = {
      id: `${type === 'income' ? 'inc' : 'exp'}-${Date.now()}`,
      name,
      icon,
      color,
    };
    
    testUser.categories[type].push(newCategory);
    return newCategory;
  },
};

export default testUser;
