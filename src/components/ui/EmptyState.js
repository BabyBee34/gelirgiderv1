// FinanceFlow - Empty State Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const EMPTY_STATES = {
  transactions: {
    icon: 'receipt-long',
    title: 'Henüz İşlem Yok',
    subtitle: 'İlk finansal işleminizi ekleyerek başlayın',
    actionText: 'İşlem Ekle',
    actionIcon: 'add',
    color: theme.colors.primary,
  },
  accounts: {
    icon: 'account-balance-wallet',
    title: 'Hesap Bulunamadı',
    subtitle: 'Finansal hesaplarınızı ekleyerek bakiye takibi yapın',
    actionText: 'Hesap Ekle',
    actionIcon: 'add',
    color: theme.colors.secondary,
  },
  categories: {
    icon: 'category',
    title: 'Kategori Yok',
    subtitle: 'Harcama kategorilerinizi oluşturun',
    actionText: 'Kategori Ekle',
    actionIcon: 'add',
    color: theme.colors.accent,
  },
  budgets: {
    icon: 'pie-chart',
    title: 'Bütçe Planlanmamış',
    subtitle: 'Aylık bütçe hedeflerinizi belirleyin',
    actionText: 'Bütçe Oluştur',
    actionIcon: 'add',
    color: theme.colors.success,
  },
  goals: {
    icon: 'flag',
    title: 'Hedef Belirlenmemiş',
    subtitle: 'Finansal hedeflerinizi tanımlayın',
    actionText: 'Hedef Ekle',
    actionIcon: 'add',
    color: theme.colors.warning,
  },
  analytics: {
    icon: 'analytics',
    title: 'Analiz Verisi Yok',
    subtitle: 'İşlem ekleyerek analiz raporlarını görüntüleyin',
    actionText: 'İşlem Ekle',
    actionIcon: 'add',
    color: theme.colors.info,
  },
  search: {
    icon: 'search',
    title: 'Sonuç Bulunamadı',
    subtitle: 'Farklı arama kriterleri deneyin',
    actionText: 'Yeniden Ara',
    actionIcon: 'refresh',
    color: theme.colors.textSecondary,
  },
  network: {
    icon: 'wifi-off',
    title: 'Bağlantı Yok',
    subtitle: 'İnternet bağlantınızı kontrol edin',
    actionText: 'Tekrar Dene',
    actionIcon: 'refresh',
    color: theme.colors.error,
  },
  general: {
    icon: 'inbox',
    title: 'Veri Yok',
    subtitle: 'Henüz içerik eklenmemiş',
    actionText: 'Ekle',
    actionIcon: 'add',
    color: theme.colors.primary,
  },
};

const EmptyState = ({
  type = 'general',
  title,
  subtitle,
  actionText,
  actionIcon,
  onAction,
  showAction = true,
  customIcon,
  customColor,
  size = 'medium',
}) => {
  const config = EMPTY_STATES[type] || EMPTY_STATES.general;
  
  const finalTitle = title || config.title;
  const finalSubtitle = subtitle || config.subtitle;
  const finalActionText = actionText || config.actionText;
  const finalActionIcon = actionIcon || config.actionIcon;
  const finalColor = customColor || config.color;
  const finalIcon = customIcon || config.icon;

  const iconSize = size === 'small' ? 48 : size === 'large' ? 80 : 64;
  const titleSize = size === 'small' ? 18 : size === 'large' ? 24 : 20;
  const subtitleSize = size === 'small' ? 14 : size === 'large' ? 16 : 15;

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={[styles.iconContainer, { marginBottom: size === 'small' ? theme.spacing.md : theme.spacing.lg }]}>
        <MaterialIcons
          name={finalIcon}
          size={iconSize}
          color={finalColor}
        />
      </View>

      {/* Title */}
      <Text style={[
        styles.title,
        { fontSize: titleSize, marginBottom: size === 'small' ? theme.spacing.sm : theme.spacing.md }
      ]}>
        {finalTitle}
      </Text>

      {/* Subtitle */}
      <Text style={[
        styles.subtitle,
        { fontSize: subtitleSize, marginBottom: showAction ? theme.spacing.lg : 0 }
      ]}>
        {finalSubtitle}
      </Text>

      {/* Action Button */}
      {showAction && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: finalColor }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={finalActionIcon}
            size={20}
            color={finalColor}
            style={styles.actionIcon}
          />
          <Text style={[styles.actionText, { color: finalColor }]}>
            {finalActionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  actionIcon: {
    marginRight: theme.spacing.sm,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmptyState;
