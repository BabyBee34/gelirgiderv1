// FinanceFlow - Accessibility Wrapper Component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

// Accessibility wrapper for different component types
export const AccessibilityWrapper = ({ 
  children, 
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessibilityState,
  accessibilityActions,
  onAccessibilityAction,
  ...props 
}) => {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      {...props}
    >
      {children}
    </View>
  );
};

// Accessible Button Component
export const AccessibleButton = ({ 
  children, 
  onPress, 
  accessibilityLabel, 
  accessibilityHint,
  disabled = false,
  style,
  textStyle,
  icon,
  iconSize = 20,
  iconColor,
  ...props 
}) => {
  const defaultIconColor = iconColor || theme.colors.primary;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[styles.accessibleButton, style, disabled && styles.disabledButton]}
      activeOpacity={0.7}
      {...props}
    >
      {icon && (
        <MaterialIcons 
          name={icon} 
          size={iconSize} 
          color={disabled ? theme.colors.textSecondary : defaultIconColor} 
          style={styles.buttonIcon}
        />
      )}
      {typeof children === 'string' ? (
        <Text style={[styles.buttonText, textStyle, disabled && styles.disabledText]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Accessible Card Component
export const AccessibleCard = ({ 
  children, 
  accessibilityLabel, 
  accessibilityHint,
  onPress,
  style,
  ...props 
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      accessible={true}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={[styles.accessibleCard, style]}
      activeOpacity={onPress ? 0.8 : 1}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Accessible Text Component
export const AccessibleText = ({ 
  children, 
  accessibilityLabel, 
  accessibilityHint,
  accessibilityRole = 'text',
  style,
  ...props 
}) => {
  return (
    <Text
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
};

// Accessible Icon Component
export const AccessibleIcon = ({ 
  name, 
  size = 24, 
  color = theme.colors.textPrimary,
  accessibilityLabel, 
  accessibilityHint,
  style,
  ...props 
}) => {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={style}
      {...props}
    />
  );
};

// Accessible List Item Component
export const AccessibleListItem = ({ 
  children, 
  accessibilityLabel, 
  accessibilityHint,
  onPress,
  selected = false,
  disabled = false,
  style,
  ...props 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled }}
      style={[styles.listItem, style, selected && styles.selectedItem, disabled && styles.disabledItem]}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

// Accessible Form Field Component
export const AccessibleFormField = ({ 
  children, 
  label, 
  error, 
  required = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  ...props 
}) => {
  const fieldAccessibilityLabel = accessibilityLabel || `${label}${required ? ' (gerekli)' : ''}`;
  const fieldAccessibilityHint = accessibilityHint || (error ? `Hata: ${error}` : 'Form alanı');
  
  return (
    <View
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={fieldAccessibilityLabel}
      accessibilityHint={fieldAccessibilityHint}
      style={[styles.formField, style]}
      {...props}
    >
      {children}
    </View>
  );
};

// Accessible Tab Component
export const AccessibleTab = ({ 
  children, 
  selected = false,
  accessibilityLabel, 
  accessibilityHint,
  onPress,
  style,
  ...props 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      style={[styles.tab, style, selected && styles.selectedTab]}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

// Accessible Modal Component
export const AccessibleModal = ({ 
  children, 
  visible, 
  onRequestClose,
  accessibilityLabel, 
  accessibilityHint,
  style,
  ...props 
}) => {
  return (
    <View
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[styles.modal, style]}
      {...props}
    >
      {children}
    </View>
  );
};

// Accessibility utilities
export const createAccessibilityLabel = (action, element, context = '') => {
  return `${action} ${element}${context ? ` ${context}` : ''}`;
};

export const createAccessibilityHint = (action, result) => {
  return `${action} ${result}`;
};

// Styles
const styles = StyleSheet.create({
  accessibleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    minHeight: 44, // Minimum touch target size
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: theme.colors.textSecondary,
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.bodyMedium.fontSize,
    fontWeight: '600',
  },
  disabledText: {
    color: theme.colors.textSecondary,
  },
  accessibleCard: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.cards,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 44, // Minimum touch target size
  },
  selectedItem: {
    backgroundColor: `${theme.colors.primary}15`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  disabledItem: {
    opacity: 0.5,
  },
  formField: {
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44, // Minimum touch target size
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccessibilityWrapper;
