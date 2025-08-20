// FinanceFlow - Terms & Privacy Modal
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const TermsModal = ({ visible, onClose, type = 'terms' }) => {
  const getContent = () => {
    if (type === 'terms') {
      return {
        title: 'Kullanım Şartları',
        content: `FinanceFlow Kullanım Şartları

Son Güncelleme: ${new Date().toLocaleDateString('tr-TR')}

1. GENEL HÜKÜMLER
FinanceFlow uygulamasını kullanarak bu şartları kabul etmiş sayılırsınız. Bu şartlar değişebilir ve güncellemeler uygulama üzerinden bildirilir.

2. UYGULAMA KULLANIMI
• FinanceFlow kişisel finans yönetimi için tasarlanmıştır
• Uygulamayı yalnızca yasal amaçlar için kullanabilirsiniz
• Hesap bilgilerinizin güvenliğinden siz sorumlusunuz
• Hatalı veya sahte bilgi girişi yasaktır

3. GİZLİLİK VE VERİ KORUMA
• Kişisel verileriniz KVKK kapsamında korunur
• Finansal verileriniz şifrelenerek saklanır
• Üçüncü taraflarla veri paylaşımı yapılmaz
• Verilerinizi istediğiniz zaman silebilirsiniz

4. FİNANSAL VERİLER
• Girdiğiniz tüm finansal veriler cihazınızda güvenle saklanır
• Banka hesap bilgileriniz talep edilmez
• Uygulama sadece kişisel takip amaçlıdır
• Vergi beyannamesi veya resmi belge niteliği taşımaz

5. SORUMLULUK SINIRI
• FinanceFlow sadece takip aracıdır, finansal tavsiye vermez
• Yatırım kararlarınızdan sorumlu değiliz
• Teknik arızalardan kaynaklanan veri kayıpları için sigortalıyız
• Kullanıcı hatalarından kaynaklanan sorunlardan sorumlu değiliz

6. HESAP YÖNETİMİ
• Bir kullanıcı birden fazla hesap açamaz
• Hesap paylaşımı yasaktır
• Şüpheli aktivite durumunda hesap askıya alınabilir
• Hesap silme talepleri 30 gün içinde işleme alınır

7. AILE PLANI
• Aile üyeleri davet sistemi ile eklenebilir
• Her üyenin kendi gizlilik ayarları vardır
• Paylaşılan bütçe verilerine tüm üyeler erişebilir
• Aile planı yöneticisi tüm yetkiye sahiptir

8. ÖDEME VE ABONELIK
• Uygulama temel özellikleri ücretsizdir
• Premium özellikler için aylık abonelik gereklidir
• Abonelik iptal edilebilir, veri kaybı olmaz
• İade politikası uygulama mağazası kurallarına tabidir

9. FİKRİ MÜLKİYET
• FinanceFlow markası ve kodları korunmaktadır
• Uygulama içerikleri izinsiz kopyalanamaz
• Kullanıcı verileri kullanıcının mülkiyetindedir
• Geri bildirimler geliştirme için kullanılabilir

10. DESTEK VE İLETİŞİM
• 7/24 teknik destek sağlanır
• Geri bildirimleriniz değerlidir
• Şikayet ve öneriler için: support@financeflow.app
• Acil durumlar için telefon desteği mevcuttur

Bu şartları kabul ederek FinanceFlow ile güvenli finansal yolculuğunuza başlayabilirsiniz.`
      };
    } else {
      return {
        title: 'Gizlilik Politikası',
        content: `FinanceFlow Gizlilik Politikası

Son Güncelleme: ${new Date().toLocaleDateString('tr-TR')}

1. VERİ TOPLAMA
FinanceFlow olarak gizliliğinizi korumak en büyük önceliğimizdir. Topladığımız veriler:

• Hesap Bilgileri: Ad, soyad, e-posta adresi
• Finansal Veriler: Gelir, gider, kategori bilgileri
• Kullanım Verileri: Uygulama kullanım istatistikleri
• Cihaz Bilgileri: İşletim sistemi, uygulama versiyonu

2. VERİ KULLANIMI
Verilerinizi şu amaçlarla kullanırız:

• Kişisel finans takibi ve analizi sağlamak
• Uygulama performansını iyileştirmek
• Güvenlik ve dolandırıcılık önleme
• Müşteri desteği sunmak
• Yasal yükümlülükleri yerine getirmek

3. VERİ KORUMA
Verilerinizin güvenliği için aldığımız önlemler:

• 256-bit SSL şifreleme
• İki faktörlü kimlik doğrulama
• Düzenli güvenlik denetimleri
• Sınırlı personel erişimi
• Otomatik yedekleme sistemleri

4. VERİ PAYLAŞIMI
Verilerinizi şu durumlar dışında paylaşmayız:

• Yasal zorunluluklar (mahkeme kararı, kolluk kuvveti talebi)
• Güvenlik tehditleri (dolandırıcılık tespiti)
• Kullanıcı onayı ile (aile planı paylaşımı)
• Anonim istatistiksel analiz (kişisel bilgi içermez)

5. ÇEREZLER VE TAKİP
Uygulama deneyiminizi iyileştirmek için:

• Oturum çerezleri kullanırız
• Analitik veriler toplarız
• Kişiselleştirilmiş içerik sunarız
• Çerez ayarlarını kontrol edebilirsiniz

6. KULLANICI HAKLARI
KVKK kapsamında haklarınız:

• Verilerinizi görme hakkı
• Düzeltme ve güncelleme hakkı
• Silme hakkı (unutulma hakkı)
• Veri taşınabilirlik hakkı
• İşlemeye itiraz etme hakkı

7. VERİ SAKLAMA SÜRESİ
• Aktif hesaplar: Süresiz (kullanıcı kontrolünde)
• Silinen hesaplar: 90 gün sonra kalıcı silme
• Yedek veriler: 1 yıl
• Log kayıtları: 6 ay
• Yasal gereklilik varsa: İlgili süre kadar

8. ÇOCUKLARIN GİZLİLİĞİ
• 13 yaş altı kullanıcı kabul edilmez
• Ebeveyn onayı gereklidir (13-18 yaş)
• Özel koruma önlemleri uygulanır
• Eğitim içerikleri yaş uygunluğu kontrol edilir

9. ULUSLARARASI VERİ TRANSFERİ
• Veriler Türkiye'de saklanır
• Uluslararası transfer KVKK uyumludur
• Yeterli koruma seviyesi garantilidir
• Kullanıcı onayı alınır

10. POLİTİKA DEĞİŞİKLİKLERİ
• Değişiklikler uygulama üzerinden bildirilir
• 30 gün önceden duyuru yapılır
• E-posta ile bilgilendirme gönderilir
• Büyük değişiklikler için onay istenir

İletişim:
E-posta: privacy@financeflow.app
Telefon: +90 212 XXX XX XX
Adres: İstanbul, Türkiye

Gizliliğiniz bizim için değerlidir!`
      };
    }
  };

  const content = getContent();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{content.title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={styles.content}>{content.content}</Text>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.acceptButton}>
            <Text style={styles.acceptButtonText}>Anladım</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  
  closeButton: {
    padding: theme.spacing.sm,
  },
  
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  
  content: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    paddingVertical: theme.spacing.lg,
  },
  
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  
  acceptButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  
  acceptButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
  },
});

export default TermsModal;
