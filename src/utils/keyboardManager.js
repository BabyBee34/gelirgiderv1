// FinanceFlow - Advanced Keyboard Management Utility
import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Platform, Dimensions, Animated, KeyboardEvent } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Klavye yönetimi için gelişmiş hook
export const useKeyboardManager = () => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardDuration, setKeyboardDuration] = useState(250);
  const [keyboardEasing, setKeyboardEasing] = useState('ease');
  
  // Animasyon değerleri
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const contentOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardWillShow', (e) => {
      if (Platform.OS === 'ios') {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardDuration(e.duration || 250);
        setKeyboardEasing(e.easing || 'ease');
        
        Animated.timing(keyboardAnim, {
          toValue: 1,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();
      }
    });

    const didShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
      
      if (Platform.OS === 'android') {
        Animated.timing(keyboardAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', (e) => {
      if (Platform.OS === 'ios') {
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();
      }
    });

    const didHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      
      if (Platform.OS === 'android') {
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => {
      showListener?.remove();
      didShowListener?.remove();
      hideListener?.remove();
      didHideListener?.remove();
    };
  }, []);

  // Klavye açıkken content offset hesapla
  const getContentOffset = (inputY, inputHeight = 50) => {
    const keyboardTop = screenHeight - keyboardHeight;
    const inputBottom = inputY + inputHeight;
    
    if (inputBottom > keyboardTop) {
      return inputBottom - keyboardTop + 20; // 20px extra padding
    }
    return 0;
  };

  // Klavye açıldığında content'i yukarı kaydır
  const animateContentUp = (offset) => {
    Animated.timing(contentOffset, {
      toValue: offset,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Content'i normal pozisyonuna getir
  const resetContentPosition = () => {
    Animated.timing(contentOffset, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  return {
    keyboardVisible,
    keyboardHeight,
    keyboardDuration,
    keyboardEasing,
    keyboardAnim,
    contentOffset,
    getContentOffset,
    animateContentUp,
    resetContentPosition,
    dismiss: () => Keyboard.dismiss(),
  };
};

// Platform-specific klavye davranışları
export const getKeyboardBehavior = () => {
  if (Platform.OS === 'ios') {
    return 'padding';
  }
  return 'height';
};

// Platform-specific vertical offset
export const getKeyboardVerticalOffset = () => {
  if (Platform.OS === 'ios') {
    return 0;
  }
  return 0;
};

// Klavye açıkken container style'ları
export const getKeyboardContainerStyle = (keyboardVisible, keyboardHeight) => {
  if (!keyboardVisible) return {};
  
  return {
    paddingBottom: keyboardHeight,
    flex: 1,
  };
};

// Input focus yönetimi için
export const useInputFocus = (keyboardManager) => {
  const inputRefs = useRef({});
  
  const registerInput = (key, ref) => {
    inputRefs.current[key] = ref;
  };
  
  const focusInput = (key) => {
    const inputRef = inputRefs.current[key];
    if (inputRef) {
      inputRef.focus();
    }
  };
  
  const blurInput = (key) => {
    const inputRef = inputRefs.current[key];
    if (inputRef) {
      inputRef.blur();
    }
  };
  
  const blurAllInputs = () => {
    Object.values(inputRefs.current).forEach(ref => {
      if (ref && ref.blur) {
        ref.blur();
      }
    });
  };
  
  return {
    registerInput,
    focusInput,
    blurInput,
    blurAllInputs,
  };
};

// Klavye event listener'ları için utility
export const keyboardListeners = {
  addShowListener: (callback) => {
    return Keyboard.addListener('keyboardDidShow', callback);
  },
  
  addHideListener: (callback) => {
    return Keyboard.addListener('keyboardDidHide', callback);
  },
  
  addWillShowListener: (callback) => {
    if (Platform.OS === 'ios') {
      return Keyboard.addListener('keyboardWillShow', callback);
    }
    return null;
  },
  
  addWillHideListener: (callback) => {
    if (Platform.OS === 'ios') {
      return Keyboard.addListener('keyboardWillHide', callback);
    }
    return null;
  },
  
  removeListener: (listener) => {
    listener?.remove();
  },
  
  removeAllListeners: (listeners) => {
    listeners.forEach(listener => listener?.remove());
  },
};

// Klavye açıkken scroll pozisyonu hesaplama
export const calculateScrollPosition = (inputY, inputHeight, keyboardHeight, screenHeight) => {
  const keyboardTop = screenHeight - keyboardHeight;
  const inputBottom = inputY + inputHeight;
  
  if (inputBottom > keyboardTop) {
    return inputBottom - keyboardTop + 50; // 50px extra padding
  }
  
  return 0;
};

// Klavye açıkken safe area hesaplama
export const getKeyboardSafeArea = (keyboardVisible, keyboardHeight, safeAreaBottom = 0) => {
  if (!keyboardVisible) return { paddingBottom: safeAreaBottom };
  
  return {
    paddingBottom: Math.max(keyboardHeight, safeAreaBottom),
  };
};

export default {
  useKeyboardManager,
  getKeyboardBehavior,
  getKeyboardVerticalOffset,
  getKeyboardContainerStyle,
  useInputFocus,
  keyboardListeners,
  calculateScrollPosition,
  getKeyboardSafeArea,
};
