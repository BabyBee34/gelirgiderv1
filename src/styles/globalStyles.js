// FinanceFlow - Global Styles
import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  
  // Card styles
  card: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  
  cardLarge: {
    backgroundColor: theme.colors.cards,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  
  // Text styles
  textPrimary: {
    color: theme.colors.textPrimary,
    ...theme.typography.bodyMedium,
  },
  
  textSecondary: {
    color: theme.colors.textSecondary,
    ...theme.typography.bodyMedium,
  },
  
  heading1: {
    color: theme.colors.textPrimary,
    ...theme.typography.h1,
  },
  
  heading2: {
    color: theme.colors.textPrimary,
    ...theme.typography.h2,
  },
  
  heading3: {
    color: theme.colors.textPrimary,
    ...theme.typography.h3,
  },
  
  // Currency text
  currencyText: {
    color: theme.colors.textPrimary,
    ...theme.typography.currency,
  },
  
  currencyTextLarge: {
    color: theme.colors.textPrimary,
    ...theme.typography.currencyLarge,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
  },
  
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Spacing utilities
  mt_xs: { marginTop: theme.spacing.xs },
  mt_sm: { marginTop: theme.spacing.sm },
  mt_md: { marginTop: theme.spacing.md },
  mt_lg: { marginTop: theme.spacing.lg },
  mt_xl: { marginTop: theme.spacing.xl },
  
  mb_xs: { marginBottom: theme.spacing.xs },
  mb_sm: { marginBottom: theme.spacing.sm },
  mb_md: { marginBottom: theme.spacing.md },
  mb_lg: { marginBottom: theme.spacing.lg },
  mb_xl: { marginBottom: theme.spacing.xl },
  
  ml_xs: { marginLeft: theme.spacing.xs },
  ml_sm: { marginLeft: theme.spacing.sm },
  ml_md: { marginLeft: theme.spacing.md },
  ml_lg: { marginLeft: theme.spacing.lg },
  ml_xl: { marginLeft: theme.spacing.xl },
  
  mr_xs: { marginRight: theme.spacing.xs },
  mr_sm: { marginRight: theme.spacing.sm },
  mr_md: { marginRight: theme.spacing.md },
  mr_lg: { marginRight: theme.spacing.lg },
  mr_xl: { marginRight: theme.spacing.xl },
  
  // Padding utilities
  p_xs: { padding: theme.spacing.xs },
  p_sm: { padding: theme.spacing.sm },
  p_md: { padding: theme.spacing.md },
  p_lg: { padding: theme.spacing.lg },
  p_xl: { padding: theme.spacing.xl },
  
  px_xs: { paddingHorizontal: theme.spacing.xs },
  px_sm: { paddingHorizontal: theme.spacing.sm },
  px_md: { paddingHorizontal: theme.spacing.md },
  px_lg: { paddingHorizontal: theme.spacing.lg },
  px_xl: { paddingHorizontal: theme.spacing.xl },
  
  py_xs: { paddingVertical: theme.spacing.xs },
  py_sm: { paddingVertical: theme.spacing.sm },
  py_md: { paddingVertical: theme.spacing.md },
  py_lg: { paddingVertical: theme.spacing.lg },
  py_xl: { paddingVertical: theme.spacing.xl },
});