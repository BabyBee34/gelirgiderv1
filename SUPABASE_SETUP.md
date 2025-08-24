# 🚀 FinanceFlow - Supabase Kurulum Rehberi

Bu rehber, FinanceFlow projesi için Supabase veritabanı kurulumunu adım adım açıklar.

## 📋 Gereksinimler

- [Supabase](https://supabase.com) hesabı
- Node.js ve npm kurulu
- Expo CLI kurulu

## 🔧 Adım 1: Supabase Projesi Oluşturma

### 1.1 Supabase'e Giriş
1. [supabase.com](https://supabase.com) adresine gidin
2. GitHub ile giriş yapın
3. "New Project" butonuna tıklayın

### 1.2 Proje Ayarları
- **Organization**: Kendi organizasyonunuzu seçin
- **Project Name**: `financeflow-prod` (veya istediğiniz isim)
- **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
- **Region**: En yakın bölgeyi seçin (örn: West Europe)
- **Pricing Plan**: Free tier ile başlayın

### 1.3 Proje Oluşturma
- "Create new project" butonuna tıklayın
- Kurulum tamamlanana kadar bekleyin (2-3 dakika)

## 🗄️ Adım 2: Veritabanı Şeması Kurulumu

### 2.1 SQL Editor'a Erişim
1. Proje dashboard'unda "SQL Editor" sekmesine tıklayın
2. "New query" butonuna tıklayın

### 2.2 Şema Dosyasını Çalıştırma
1. `database/schema.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'a yapıştırın
3. "Run" butonuna tıklayın

### 2.3 Kurulum Kontrolü
Şema başarıyla kurulduktan sonra:
- **Tables** sekmesinde tüm tablolar görünmelidir
- **Policies** sekmesinde RLS politikaları aktif olmalıdır

## 🔑 Adım 3: API Anahtarlarını Alma

### 3.1 Project Settings
1. Dashboard'da "Settings" sekmesine tıklayın
2. "API" alt sekmesine tıklayın

### 3.2 Anahtarları Kopyalama
- **Project URL**: `https://your-project-id.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ⚙️ Adım 4: Proje Konfigürasyonu

### 4.1 Environment Variables
`.env` dosyası oluşturun (root dizinde):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Supabase Config Güncelleme
`src/config/supabase.js` dosyasında:

```javascript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

## 🔐 Adım 5: Authentication Ayarları

### 5.1 Auth Settings
1. Dashboard'da "Authentication" sekmesine tıklayın
2. "Settings" alt sekmesine tıklayın

### 5.2 Site URL Ayarları
- **Site URL**: `exp://localhost:8081` (development için)
- **Redirect URLs**: 
  - `exp://localhost:8081/*`
  - `financeflow://*` (production için)

### 5.3 Email Templates
- **Confirm signup**: Türkçe template oluşturun
- **Reset password**: Türkçe template oluşturun

## 📱 Adım 6: Mobile App Konfigürasyonu

### 6.1 Deep Linking
`app.json` dosyasında:

```json
{
  "expo": {
    "scheme": "financeflow",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "financeflow"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 6.2 App Configuration
`App.js` dosyasında AuthProvider'ı ekleyin:

```javascript
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* App content */}
    </AuthProvider>
  );
}
```

## 🧪 Adım 7: Test Etme

### 7.1 Test Kullanıcısı Oluşturma
1. "Authentication" > "Users" sekmesine gidin
2. "Add user" butonuna tıklayın
3. Test kullanıcısı oluşturun

### 7.2 API Test
SQL Editor'da test sorgusu:

```sql
SELECT * FROM users LIMIT 1;
```

## 🚨 Güvenlik Ayarları

### 7.1 Row Level Security (RLS)
- Tüm tablolarda RLS aktif olmalı
- Kullanıcı sadece kendi verilerini görebilmeli

### 7.2 API Policies
- `users_own_data`: Kullanıcı sadece kendi profilini görebilmeli
- `transactions_own_data`: Kullanıcı sadece kendi işlemlerini görebilmeli

## 📊 Adım 8: Veri Yönetimi

### 8.1 Backup
- **Automatic backups**: Supabase otomatik olarak yapar
- **Manual backup**: SQL export ile manuel yedek alabilirsiniz

### 8.2 Monitoring
- **Database logs**: SQL Editor'da logları görüntüleyin
- **Performance**: Dashboard'da performans metriklerini takip edin

## 🔧 Sorun Giderme

### Yaygın Hatalar

#### 1. Connection Error
```
Error: fetch failed
```
**Çözüm**: URL ve API key'in doğru olduğundan emin olun

#### 2. RLS Policy Error
```
Error: new row violates row-level security policy
```
**Çözüm**: RLS politikalarının doğru kurulduğundan emin olun

#### 3. Auth Error
```
Error: Invalid login credentials
```
**Çözüm**: Kullanıcı hesabının doğru oluşturulduğundan emin olun

### Debug Modu
Development'ta debug loglarını aktif edin:

```javascript
const supabase = createClient(url, key, {
  auth: {
    debug: __DEV__
  }
});
```

## 📱 Production Deployment

### 1. Environment Variables
Production ortamında environment variables'ları ayarlayın

### 2. Deep Links
Production deep link'lerini yapılandırın

### 3. SSL
Supabase otomatik olarak SSL sağlar

## 🔗 Faydalı Linkler

- [Supabase Documentation](https://supabase.com/docs)
- [React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Auth Helpers](https://supabase.com/docs/reference/javascript/auth-helpers)
- [Database API](https://supabase.com/docs/reference/javascript/select)

## 📞 Destek

- **Supabase Support**: [Discord](https://discord.supabase.com)
- **Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **GitHub Issues**: [github.com/supabase/supabase](https://github.com/supabase/supabase)

---

## ✅ Kurulum Tamamlandı!

Artık FinanceFlow uygulamanız gerçek bir veritabanı ile çalışıyor! 

**Sonraki adımlar:**
1. Test kullanıcısı ile giriş yapın
2. İlk işlem kaydını oluşturun
3. Veritabanında verilerin göründüğünü kontrol edin
4. Real-time updates'i test edin

Herhangi bir sorun yaşarsanız, yukarıdaki destek kanallarını kullanabilirsiniz.
