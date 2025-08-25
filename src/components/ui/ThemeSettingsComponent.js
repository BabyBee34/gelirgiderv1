// FinanceFlow - Theme Settings Component
// Tema seçenekleri için professional bileşen
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const ThemeSettingsComponent = () => {
  const { theme, themeType, setTheme, isDark, isSystem, THEME_TYPES, systemColorScheme } = useTheme();

  const themeOptions = [
    {
      type: THEME_TYPES.LIGHT,
      title: 'Açık Tema',
      subtitle: 'Açık renkli arayüz',
      icon: 'light-mode',
      colors: ['#6C63FF', '#4ECDC4', '#FFFFFF']
    },
    {
      type: THEME_TYPES.DARK,
      title: 'Koyu Tema',
      subtitle: 'Koyu renkli arayüz',
      icon: 'dark-mode',
      colors: ['#7C6AFF', '#5EDCD4', '#1E1E1E']
    },
    {
      type: THEME_TYPES.SYSTEM,
      title: 'Sistem Ayarı',
      subtitle: `Sistem ayarını takip et (${systemColorScheme === 'dark' ? 'Koyu' : 'Açık'})`,
      icon: 'settings-suggest',
      colors: systemColorScheme === 'dark' ? ['#7C6AFF', '#5EDCD4', '#1E1E1E'] : ['#6C63FF', '#4ECDC4', '#FFFFFF']
    }
  ];

  const handleThemeSelect = async (newThemeType) => {
    await setTheme(newThemeType);
  };

  const renderThemeOption = (option) => {
    const isSelected = themeType === option.type;
    
    return (
      <TouchableOpacity
        key={option.type}
        style={[
          styles.themeOption,
          { 
            backgroundColor: theme.colors.cards,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleThemeSelect(option.type)}
        activeOpacity={0.7}
      >
        <View style={styles.themeOptionLeft}>
          <View style={[
            styles.themeIconContainer,
            { backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.background }
          ]}>
            <MaterialIcons 
              name={option.icon} 
              size={24} 
              color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
          
          <View style={styles.themeTextContainer}>
            <Text style={[
              styles.themeTitle,
              { color: theme.colors.textPrimary }
            ]}>
              {option.title}
            </Text>
            <Text style={[
              styles.themeSubtitle,
              { color: theme.colors.textSecondary }
            ]}>
              {option.subtitle}
            </Text>
          </View>
        </View>

        <View style={styles.themeOptionRight}>
          {/* Theme Preview */}
          <View style={styles.themePreview}>
            {option.colors.map((color, index) => (
              <View
                key={index}
                style={[
                  styles.themePreviewColor,
                  { 
                    backgroundColor: color,
                    marginLeft: index > 0 ? -6 : 0,
                    zIndex: option.colors.length - index
                  }
                ]}
              />
            ))}
          </View>

          {/* Selection Indicator */}
          <View style={[
            styles.selectionIndicator,
            { 
              backgroundColor: isSelected ? theme.colors.primary : 'transparent',
              borderColor: theme.colors.border
            }
          ]}>
            {isSelected && (
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <MaterialIcons 
          name="palette" 
          size={24} 
          color={theme.colors.primary} 
          style={styles.headerIcon}
        />
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Tema Ayarları
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Arayüz görünümünü kişiselleştirin
          </Text>
        </View>
      </View>

      <View style={styles.optionsContainer}>
        {themeOptions.map(renderThemeOption)}
      </View>

      {/* Current Theme Info */}
      <View style={[
        styles.currentThemeInfo,
        { 
          backgroundColor: theme.colors.cards,
          borderColor: theme.colors.border
        }
      ]}>
        <View style={styles.currentThemeRow}>
          <Text style={[styles.currentThemeLabel, { color: theme.colors.textSecondary }]}>
            Şu anki tema:
          </Text>
          <Text style={[styles.currentThemeValue, { color: theme.colors.textPrimary }]}>
            {themeOptions.find(o => o.type === themeType)?.title}
          </Text>
        </View>
        
        <View style={styles.currentThemeRow}>
          <Text style={[styles.currentThemeLabel, { color: theme.colors.textSecondary }]}>
            Durum:
          </Text>
          <Text style={[styles.currentThemeValue, { color: theme.colors.textPrimary }]}>
            {isDark ? 'Koyu Mod' : 'Açık Mod'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
  },
  
  headerIcon: {
    marginRight: 12,
  },
  
  headerTextContainer: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  optionsContainer: {
    marginBottom: 24,
  },
  
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  themeTextContainer: {
    flex: 1,
  },
  
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  themeSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  
  themeOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  themePreview: {
    flexDirection: 'row',
    marginRight: 12,
  },
  
  themePreviewColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  currentThemeInfo: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  currentThemeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  currentThemeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  currentThemeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ThemeSettingsComponent;