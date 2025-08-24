# 💰 FinanceFlow - Gelir Gider Takip Uygulaması Tasarım Promptu

## 🎯 PROJE GENEL BİLGİLERİ
**Platform:** React Native + Expo  
**Hedef:** Android İşletim Sistemi  
**Odak:** Öncelik tamamen tasarım ve kullanıcı deneyimi

## 🎨 TASARIM FELSEFESİ

### Ana Tema
- **Modern Minimalist:** Temiz, düzenli ve profesyonel görünüm
- **Soft Color Palette:** Pastel tonlar ve yumuşak geçişler
- **Profesyonel ama Sıcak:** Ciddi finans uygulaması hissi veren ama kullanıcı dostu
- **Micro-interactions:** Butona basma, sayfa geçişi gibi küçük animasyonlar

### Renk Paleti
```
Primary: #6C63FF (Soft Purple)
Secondary: #4ECDC4 (Mint Green)
Accent: #FFE66D (Soft Yellow)
Background: #F8F9FA (Light Gray)
Cards: #FFFFFF (Pure White)
Text Primary: #2D3748 (Dark Gray)
Text Secondary: #718096 (Medium Gray)
Success: #48BB78 (Green)
Warning: #ED8936 (Orange)
Error: #F56565 (Red)
```

### Tipografi
- **Headers:** Inter Bold/SemiBold
- **Body:** Inter Regular/Medium
- **Numbers:** SF Mono (para miktarları için)

## 📱 EKRAN TASARIMLARI

### 1. ONBOARDING (3-4 Sayfa)

**Sayfa 1:** "Hoş Geldiniz"
- Hero illustration (finansal özgürlük teması)
- "FinanceFlow ile Mali Geleceğinizi Kontrol Edin"
- Gradient background (soft purple to mint)

**Sayfa 2:** "Akıllı Takip"
- Fiş tarama görseli
- "Fişlerinizi tarayın, otomatik kategorilendirin"
- Card-based layout

**Sayfa 3:** "Detaylı Analiz"
- Grafik ve chart görselleri
- "Harcama alışkanlıklarınızı analiz edin"
- Smooth animations

**Sayfa 4:** "Aile Desteği"
- Multiple device illustration
- "Ailenizle birlikte kullanın"
- Call-to-action button

### 2. AUTH EKRANLARI

**Giriş Ekranı:**
- Logo (merkezi, elegant)
- Floating label input fields
- Gradient submit button
- "Şifremi Unuttum" link (subtle)
- Social media style bottom navigation

**Kayıt Ekranı:**
- Step-by-step progress indicator
- Form validation (real-time)
- Success micro-animations
- Terms & conditions checkbox

**Şifre Sıfırlama:**
- Email confirmation illustration
- Clear instructions
- Countdown timer for resend

### 3. ANA SAYFA (DASHBOARD)

**Header Section:**
- Kişiselleştirilmiş karşılama
- Toplam bakiye (büyük, bold)
- Bu ayın gelir/gider özeti (cards)

**Quick Actions:**
- Floating Action Button (FAB) - merkezi
- Gelir/Gider ekleme shortcuts
- Fiş tarama butonu (prominent)

**Overview Cards:**
- Bu ayın en çok harcama kategorisi
- Yaklaşan sabit ödemeler
- Altın/döviz özeti (eğer varsa)
- Customizable widgets

**Bottom Section:**
- Mini grafik (aylık trend)
- Quick stats
- Navigation hints

### 4. GELİR/GİDER EKLEME

**Floating Modal Design:**
- Bottom sheet style
- Smooth slide-up animation
- Quick amount selector (common amounts)
- Category picker (icon + color coded)
- Date picker (calendar widget)
- Note field (expandable)
- Save button (large, prominent)

**Kategori Seçimi:**
- Grid layout (3x4)
- Icon + name + color
- Custom kategori ekleme
- Search functionality

### 5. FİŞ TARAMA

**Camera Interface:**
- Full screen camera
- Guide overlay (fiş konumu)
- Capture button (large, pulsing)
- Gallery access (corner)

**Sonuç Ekranı:**
- Taranmış bilgiler (editable cards)
- Confidence indicators
- Düzenleme seçenekleri
- Bulk save functionality

### 6. KREDİ KARTI YÖNETİMİ

**Kart Listesi:**
- Card carousel design
- 3D card effects
- Bank logos
- Limit/kullanım progress bars

**Kart Detayı:**
- Visual card representation
- Payment calculator
- Payment history
- Alert settings

### 7. DÖVİZ/ALTIN

**Exchange Rates:**
- Live rate cards
- Trend indicators (up/down arrows)
- Currency converter
- Rate alerts

**Altın Portföyü:**
- Gram/adet calculator
- Current value display
- Portfolio pie chart

### 8. ANALİZ VE RAPORLAR

**Dashboard Görünümü:**
- Interactive charts (donut, line, bar)
- Date range selector
- Category breakdowns
- Trend analysis

**AI-Powered Insights:** (Kod tabanlı)
- Spending pattern detection
- Budget recommendations
- Saving opportunities
- Risk alerts

### 9. AİLE PLANI

**Family Dashboard:**
- Member avatars
- Shared expenses
- Individual budgets
- Permission settings

**Member Management:**
- Invite system
- Role assignments
- Activity feed

### 10. TASARRUF FONLARI

**Fon Listesi:**
- Goal-based cards
- Progress rings
- Target dates
- Quick add buttons

**Fon Detayı:**
- Visual progress
- Contribution history
- Goal timeline
- Milestone celebrations

## 🎭 UI COMPONENT LİBRARİSİ

### Buttonlar
- **Primary:** Gradient background, rounded corners (12px)
- **Secondary:** Outline style, hover effects
- **FAB:** Circular, shadow, subtle bounce animation
- **Icon Buttons:** Circular background, icon centering

### Cards
- **Standard:** White background, subtle shadow, 16px radius
- **Interactive:** Hover effects, press animations
- **Data Cards:** Number emphasis, trend indicators

### Inputs
- **Floating Labels:** Material Design style
- **Currency Input:** Large, formatted display
- **Date Picker:** Calendar modal
- **Search:** Magnifying glass icon, rounded

### Navigation
- **Bottom Tab:** 5 tabs maximum, icons + labels
- **Drawer:** Hidden menu for advanced features
- **Header:** Back button, title, action buttons

### Charts & Graphs
- **Library:** React Native Chart Kit
- **Colors:** Brand palette consistency
- **Animations:** Smooth data transitions
- **Interactive:** Touch gestures

## 📦 ICON KAYNAKLARI
- **Expo Vector Icons:** @expo/vector-icons (ücretsiz)
- **Lucide React Native:** @lucide/react-native
- **React Native Elements:** react-native-elements

## 🚀 ANIMATIONS & TRANSITIONS

### Sayfa Geçişleri
- **Slide Transitions:** Horizontal slides
- **Modal Presentations:** Bottom-up slides
- **Loading States:** Skeleton screens

### Micro-Animations
- **Button Press:** Scale + haptic feedback
- **Card Tap:** Subtle elevation change
- **Success Actions:** Checkmark animation
- **Data Updates:** Number counting animations

## 📱 RESPONSIVE DESIGN

### Ekran Boyutları
- **Small Phones:** 5" screens optimize
- **Large Phones:** 6.5"+ screens leverage
- **Tablet:** Landscape mode support

### Accessibility
- **Font Scaling:** System font size respect
- **High Contrast:** Alternative color schemes
- **Screen Readers:** Proper labels
- **Touch Targets:** Minimum 44px

## 🎪 ÖZEL ÖZELLİKLER

### Onboarding Experience
- **Lottie Animations:** JSON-based smooth animations
- **Progressive Disclosure:** Feature introduction
- **Interactive Tutorial:** Hands-on learning

### Empty States
- **Illustration-Based:** Custom graphics
- **Call-to-Action:** Clear next steps
- **Motivational:** Positive messaging

### Error Handling
- **Friendly Messages:** Human-like communication
- **Retry Mechanisms:** Easy recovery
- **Offline Support:** Graceful degradation

## 💡 CURSOR AI İÇİN ÖZELİKLER

### Kod Organizasyonu
```
/components
  /ui (reusable components)
  /screens (page components)
  /navigation
/styles
  /colors.js
  /typography.js
  /spacing.js
/utils
/assets
```

### Styling Approach
- **Styled Components** veya **StyleSheet** kullan
- **Theme Provider** implement et
- **Dark Mode** desteği hazırla (gelecek için)

### State Management
- **React Context** (basit state için)
- **AsyncStorage** (local data için)
- **React Query** (data fetching için)

## 📋 İLK ADIM TALİMATLARI

1. **Setup:** Expo CLI ile proje oluştur
2. **Dependencies:** Gerekli UI libraries install et
3. **Theme:** Color palette ve typography setup
4. **Navigation:** React Navigation configure et
5. **Components:** Base UI components oluştur
6. **Screens:** Onboarding sequence başlat

### İlk Sprint (Sadece Tasarım)
- [ ] Onboarding screens
- [ ] Auth screens (login/register/forgot)
- [ ] Main dashboard mockup
- [ ] Navigation structure
- [ ] Component library basics

### Design System Checklist
- [ ] Color constants
- [ ] Typography scale
- [ ] Spacing system
- [ ] Icon mapping
- [ ] Animation timings

## 🎨 İNSPİRASYON REFERANSLARİ

**Benzer Uygulamalar:** Mint, YNAB, PocketGuard (UI referansı için)
**Design Inspiration:** Dribbble, Figma Community
**Color Harmony:** Adobe Color, Coolors.co

---

