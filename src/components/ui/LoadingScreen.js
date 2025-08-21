// FinanceFlow - Loading Screen Components
import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

// Main loading screen
export const LoadingScreen = ({ 
  message = 'Yükleniyor...', 
  showSpinner = true,
  size = 'large',
  color = theme.colors.primary 
}) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {showSpinner && (
        <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: spin }] }]}>
          <MaterialIcons 
            name="refresh" 
            size={size === 'large' ? 40 : size === 'medium' ? 30 : 20} 
            color={color} 
          />
        </Animated.View>
      )}
      <Text style={[styles.message, { color }]}>{message}</Text>
    </View>
  );
};

// Skeleton loading component
export const SkeletonLoader = ({ 
  type = 'card', 
  width: skeletonWidth = '100%',
  height: skeletonHeight = 100,
  style 
}) => {
  const shimmerValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const opacity = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getSkeletonStyle = () => {
    switch (type) {
      case 'card':
        return styles.skeletonCard;
      case 'text':
        return styles.skeletonText;
      case 'circle':
        return styles.skeletonCircle;
      case 'button':
        return styles.skeletonButton;
      default:
        return styles.skeletonCard;
    }
  };

  return (
    <Animated.View
      style={[
        getSkeletonStyle(),
        {
          width: skeletonWidth,
          height: skeletonHeight,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton card for transaction items
export const TransactionSkeleton = () => (
  <View style={styles.transactionSkeleton}>
    <View style={styles.transactionSkeletonHeader}>
      <SkeletonLoader type="circle" width={40} height={40} />
      <View style={styles.transactionSkeletonContent}>
        <SkeletonLoader type="text" width="60%" height={16} />
        <SkeletonLoader type="text" width="40%" height={12} />
      </View>
      <SkeletonLoader type="text" width="20%" height={16} />
    </View>
  </View>
);

// Skeleton for dashboard cards
export const DashboardCardSkeleton = () => (
  <View style={styles.dashboardCardSkeleton}>
    <SkeletonLoader type="text" width="50%" height={20} />
    <SkeletonLoader type="text" width="80%" height={32} />
    <SkeletonLoader type="text" width="30%" height={14} />
  </View>
);

// Skeleton for chart loading
export const ChartSkeleton = () => (
  <View style={styles.chartSkeleton}>
    <SkeletonLoader type="text" width="40%" height={18} />
    <View style={styles.chartBars}>
      {[...Array(7)].map((_, index) => (
        <SkeletonLoader
          key={index}
          type="text"
          width={20}
          height={Math.random() * 60 + 20}
          style={styles.chartBar}
        />
      ))}
    </View>
  </View>
);

// Pull to refresh loading
export const PullToRefreshLoader = ({ refreshing, onRefresh, children }) => {
  return (
    <View style={styles.pullToRefreshContainer}>
      {refreshing && (
        <View style={styles.pullToRefreshIndicator}>
          <LoadingScreen 
            message="Yenileniyor..." 
            size="small" 
            showSpinner={true}
          />
        </View>
      )}
      {children}
    </View>
  );
};

// Button loading state
export const ButtonLoader = ({ loading, children, style }) => {
  if (loading) {
    return (
      <View style={[styles.buttonLoader, style]}>
        <LoadingScreen 
          message="" 
          size="small" 
          showSpinner={true}
          color="#FFFFFF"
        />
      </View>
    );
  }
  return children;
};

// Page loading overlay
export const PageLoadingOverlay = ({ visible, message = 'Sayfa yükleniyor...' }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        <LoadingScreen message={message} />
      </View>
    </View>
  );
};

// Empty state component
export const EmptyState = ({ 
  icon = 'inbox', 
  title = 'Veri bulunamadı', 
  message = 'Henüz hiç veri eklenmemiş',
  actionText,
  onAction,
  style 
}) => {
  return (
    <View style={[styles.emptyState, style]}>
      <MaterialIcons 
        name={icon} 
        size={64} 
        color={theme.colors.textSecondary} 
      />
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
      {actionText && onAction && (
        <Text style={styles.emptyStateAction} onPress={onAction}>
          {actionText}
        </Text>
      )}
    </View>
  );
};

// Error state component
export const ErrorState = ({ 
  icon = 'error-outline', 
  title = 'Bir hata oluştu', 
  message = 'Lütfen tekrar deneyin',
  retryText = 'Tekrar Dene',
  onRetry,
  style 
}) => {
  return (
    <View style={[styles.errorState, style]}>
      <MaterialIcons 
        name={icon} 
        size={64} 
        color={theme.colors.error} 
      />
      <Text style={styles.errorStateTitle}>{title}</Text>
      <Text style={styles.errorStateMessage}>{message}</Text>
      {onRetry && (
        <Text style={styles.errorStateRetry} onPress={onRetry}>
          {retryText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  
  spinnerContainer: {
    marginBottom: theme.spacing.md,
  },
  
  message: {
    ...theme.typography.bodyMedium,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  
  // Skeleton styles
  skeletonCard: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  
  skeletonText: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
  },
  
  skeletonCircle: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
  },
  
  skeletonButton: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  
  // Transaction skeleton
  transactionSkeleton: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  
  transactionSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  transactionSkeletonContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'space-between',
    height: 40,
  },
  
  // Dashboard card skeleton
  dashboardCardSkeleton: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  
  // Chart skeleton
  chartSkeleton: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    marginTop: theme.spacing.md,
  },
  
  chartBar: {
    marginHorizontal: 2,
  },
  
  // Pull to refresh
  pullToRefreshContainer: {
    flex: 1,
  },
  
  pullToRefreshIndicator: {
    paddingVertical: theme.spacing.md,
  },
  
  // Button loader
  buttonLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  
  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  overlayContent: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  
  emptyStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  
  emptyStateMessage: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  emptyStateAction: {
    ...theme.typography.bodyMedium,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  
  // Error state
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  
  errorStateTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  
  errorStateMessage: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  errorStateRetry: {
    ...theme.typography.bodyMedium,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default {
  LoadingScreen,
  SkeletonLoader,
  TransactionSkeleton,
  DashboardCardSkeleton,
  ChartSkeleton,
  PullToRefreshLoader,
  ButtonLoader,
  PageLoadingOverlay,
  EmptyState,
  ErrorState,
};
