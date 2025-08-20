// FinanceFlow - Custom Card Component
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const CustomCard = ({ 
  children, 
  onPress,
  variant = 'default',
  size = 'medium',
  style,
  ...props 
}) => {
  
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[`card_${variant}`], styles[`card_${size}`]];
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };
  
  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        activeOpacity={0.9}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={getCardStyle()} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
  },
  
  // Variants
  card_default: {
    ...theme.shadows.small,
  },
  
  card_elevated: {
    ...theme.shadows.medium,
  },
  
  card_flat: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  card_primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  
  card_secondary: {
    backgroundColor: theme.colors.secondary,
    ...theme.shadows.small,
  },
  
  card_gradient: {
    // Will be handled with LinearGradient wrapper if needed
    ...theme.shadows.medium,
  },
  
  // Sizes
  card_small: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  
  card_medium: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  
  card_large: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  
  card_xlarge: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
  },
});

export default CustomCard;
