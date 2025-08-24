// FinanceFlow - Global Error Boundary
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // TODO: Integrate with error reporting service (Sentry, Bugsnag, etc.)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent || 'React Native',
      errorId: this.state.errorId
    };

    console.log('Error Report:', errorReport);
    
    // Example: Send to error reporting service
    // errorReportingService.log(errorReport);
  };

  handleRestart = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleRefresh = () => {
    // Force app restart or navigation reset
    if (this.props.onRestart) {
      this.props.onRestart();
    } else {
      this.handleRestart();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <MaterialIcons name="error-outline" size={80} color={theme.colors.error} />
            </View>

            {/* Error Message */}
            <Text style={styles.title}>Bir Hata Oluştu</Text>
            <Text style={styles.subtitle}>
              Üzgünüz, beklenmeyen bir hata meydana geldi. Lütfen uygulamayı yeniden başlatmayı deneyin.
            </Text>

            {/* Error ID */}
            <View style={styles.errorIdContainer}>
              <Text style={styles.errorIdLabel}>Hata ID:</Text>
              <Text style={styles.errorId}>{this.state.errorId}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={this.handleRefresh}>
                <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Uygulamayı Yenile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={this.handleRestart}>
                <MaterialIcons name="replay" size={20} color={theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>

            {/* Developer Info (only in development) */}
            {__DEV__ && this.state.error && (
              <View style={styles.developerSection}>
                <Text style={styles.developerTitle}>Geliştirici Bilgisi:</Text>
                
                <View style={styles.errorDetails}>
                  <Text style={styles.errorLabel}>Hata Mesajı:</Text>
                  <Text style={styles.errorText}>{this.state.error.message}</Text>
                </View>

                {this.state.error.stack && (
                  <View style={styles.errorDetails}>
                    <Text style={styles.errorLabel}>Stack Trace:</Text>
                    <ScrollView style={styles.stackTrace} horizontal>
                      <Text style={styles.errorText}>{this.state.error.stack}</Text>
                    </ScrollView>
                  </View>
                )}

                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <View style={styles.errorDetails}>
                    <Text style={styles.errorLabel}>Component Stack:</Text>
                    <ScrollView style={styles.stackTrace} horizontal>
                      <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Support Info */}
            <View style={styles.supportSection}>
              <Text style={styles.supportTitle}>Yardıma mı ihtiyacınız var?</Text>
              <Text style={styles.supportText}>
                Bu hata devam ederse, lütfen yukarıdaki hata ID'sini belirterek destek ekibimizle iletişime geçin.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  errorIdContainer: {
    backgroundColor: theme.colors.cards,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  errorIdLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  errorId: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  developerSection: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  developerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: theme.spacing.md,
  },
  errorDetails: {
    marginBottom: theme.spacing.md,
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd93d',
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  stackTrace: {
    backgroundColor: '#000000',
    borderRadius: 4,
    padding: theme.spacing.sm,
    maxHeight: 100,
  },
  supportSection: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    width: '100%',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  supportText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ErrorBoundary;

