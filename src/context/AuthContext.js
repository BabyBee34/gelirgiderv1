// FinanceFlow - Authentication Context Provider
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

// Context oluşturma
const AuthContext = createContext();

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  // Kullanıcı oturum durumunu kontrol et
  useEffect(() => {
    // Onboarding durumunu kontrol et
    const checkOnboarding = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        setHasCompletedOnboarding(onboardingCompleted === 'true');
      } catch (error) {
        console.error('Onboarding check error:', error);
        setHasCompletedOnboarding(false);
      }
    };

    // Mevcut oturumu kontrol et
    const checkSession = async () => {
      try {
        // Supabase'den mevcut session'ı al
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Kullanıcı profilini al
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            if (profile) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.warn('Profile fetch error:', profileError);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Her ikisini de kontrol et
    checkOnboarding();
    checkSession();

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          setSession(session);
          setUser(session.user);
          
          // Kullanıcı profilini al
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile) {
              setUserProfile(profile);
            }
          } catch (profileError) {
            console.warn('Profile fetch error:', profileError);
          }
          
          // Session timeout'u başlat
          startSessionTimeout(session);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          clearSessionTimeout();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(session.user);
          
          // Session timeout'u yenile
          clearSessionTimeout();
          startSessionTimeout(session);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
      clearSessionTimeout();
    };
  }, []);

  // Kayıt olma
  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      
      // firstName ve lastName'i birleştir
      const fullName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`.trim()
        : 'Kullanıcı';
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            ...userData,
            full_name: fullName // full_name ekle
          },
          emailRedirectTo: 'financeflow://signup',
        },
      });
      
      if (error) {
        throw error;
      }

      // Başarılı kayıt sonrası user state'i güncelle
      if (data?.user) {
        setUser(data.user);
        setSession(data);
        
        // Kullanıcı profilini al
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (profile) {
          setUserProfile(profile);
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error in context:', error);
      
      // Özel hata mesajları
      let errorMessage = 'Kayıt işlemi başarısız';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Geçersiz email adresi.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Şifre en az 6 karakter olmalıdır.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Giriş yapma
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (error) {
        throw error;
      }

      // Başarılı giriş sonrası user state'i güncelle
      if (data?.user) {
        setUser(data.user);
        setSession(data);
        
        // Kullanıcı profilini al
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (profile) {
          setUserProfile(profile);
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error in context:', error);
      
      // Özel hata mesajları
      let errorMessage = 'Giriş işlemi başarısız';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email veya şifre hatalı.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email adresinizi onaylayın.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Çok fazla deneme. Lütfen bekleyin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yapma
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      setUser(null);
      setUserProfile(null);
      setSession(null);
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error in context:', error);
      return { success: false, error: error.message || 'Çıkış işlemi başarısız' };
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı profilini güncelleme
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('Kullanıcı oturum açmamış');

      const { data, error } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
      
      if (error) {
        throw error;
      }

      setUserProfile(data);
      return { success: true, data };
    } catch (error) {
      console.error('Update profile error in context:', error);
      return { success: false, error: error.message || 'Profil güncellenemedi' };
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'financeflow://reset-password',
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error in context:', error);
      return { success: false, error: error.message || 'Şifre sıfırlama başarısız' };
    }
  };

  // Şifre değiştirme
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Update password error in context:', error);
      return { success: false, error: error.message || 'Şifre güncellenemedi' };
    }
  };

  // Email değiştirme
  const updateEmail = async (newEmail) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Update email error in context:', error);
      return { success: false, error: error.message || 'Email güncellenemedi' };
    }
  };

  // Session timeout functions
  const startSessionTimeout = (currentSession) => {
    if (!currentSession?.access_token) return;
    
    // Token'ın expire olma süresini hesapla (varsayılan: 1 saat)
    const expiresAt = currentSession.expires_at * 1000; // Unix timestamp'i milisaniyeye çevir
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry > 0) {
      // Session timeout'u başlat
      const timeout = setTimeout(() => {
        handleSessionExpired();
      }, timeUntilExpiry);
      
      setSessionTimeout(timeout);
    }
  };

  const clearSessionTimeout = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  };

  const handleSessionExpired = async () => {
    console.log('Session expired, logging out user');
    
    // Kullanıcıyı otomatik olarak çıkış yap
    setUser(null);
    setUserProfile(null);
    setSession(null);
    clearSessionTimeout();
    
    // Supabase'den çıkış yap
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Auto logout error:', error);
    }
  };

  // Onboarding tamamlama
  const completeOnboarding = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setHasCompletedOnboarding(true);
      return { success: true };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, error };
    }
  };

  // Kullanıcı silme
  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('Kullanıcı oturum açmamış');

      // Kullanıcı profilini sil
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Delete profile error:', profileError);
      }

      // Auth kullanıcısını sil
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        throw error;
      }

      setUser(null);
      setUserProfile(null);
      setSession(null);
      
      return { success: true };
    } catch (error) {
      console.error('Delete account error in context:', error);
      return { success: false, error: error.message || 'Hesap silinemedi' };
    }
  };



  // Context value
  const value = {
    user,
    userProfile,
    session,
    loading,
    hasCompletedOnboarding,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    updateEmail,
    deleteAccount,
    completeOnboarding,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

