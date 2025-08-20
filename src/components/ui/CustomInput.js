// FinanceFlow - Custom Input Component
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const hasValue = value && value.length > 0;
  const shouldFloatLabel = isFocused || hasValue;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (error) {
      baseStyle.push(styles.containerError);
    } else if (isFocused) {
      baseStyle.push(styles.containerFocused);
    }
    
    if (disabled) {
      baseStyle.push(styles.containerDisabled);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];
    
    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }
    
    if (rightIcon || secureTextEntry) {
      baseStyle.push(styles.inputWithRightIcon);
    }
    
    if (multiline) {
      baseStyle.push(styles.inputMultiline);
    }
    
    if (inputStyle) {
      baseStyle.push(inputStyle);
    }
    
    return baseStyle;
  };

  const getLabelStyle = () => {
    const baseStyle = [styles.label];
    
    if (shouldFloatLabel) {
      baseStyle.push(styles.labelFloating);
      if (isFocused) {
        baseStyle.push(styles.labelFocused);
      }
    }
    
    if (error) {
      baseStyle.push(styles.labelError);
    }
    
    return baseStyle;
  };

  return (
    <View style={getContainerStyle()}>
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <View style={styles.inputWrapper}>
          {label && (
            <Text style={getLabelStyle()}>
              {label}
            </Text>
          )}
          
          <TextInput
            style={getInputStyle()}
            value={value}
            onChangeText={onChangeText}
            placeholder={shouldFloatLabel ? '' : placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry={secureTextEntry && !showPassword}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            {...props}
          />
        </View>
        
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity 
            style={styles.rightIconContainer}
            onPress={secureTextEntry ? togglePasswordVisibility : onRightIconPress}
            disabled={!secureTextEntry && !onRightIconPress}
          >
            {secureTextEntry ? (
              <MaterialIcons 
                name={showPassword ? 'visibility-off' : 'visibility'} 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  
  containerFocused: {
    // Focus state handled by input border
  },
  
  containerError: {
    // Error state handled by input border
  },
  
  containerDisabled: {
    opacity: 0.6,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 56,
  },
  
  leftIconContainer: {
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
  },
  
  rightIconContainer: {
    paddingRight: theme.spacing.md,
    paddingLeft: theme.spacing.sm,
  },
  
  inputWrapper: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  label: {
    position: 'absolute',
    left: theme.spacing.md,
    top: '50%',
    transform: [{ translateY: -8 }],
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  
  labelFloating: {
    top: 8,
    fontSize: 12,
    fontWeight: '500',
    transform: [{ translateY: 0 }],
  },
  
  labelFocused: {
    color: theme.colors.primary,
  },
  
  labelError: {
    color: theme.colors.error,
  },
  
  input: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    minHeight: 24,
  },
  
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  
  inputWithRightIcon: {
    paddingRight: 0,
  },
  
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.md,
  },
});

export default CustomInput;
