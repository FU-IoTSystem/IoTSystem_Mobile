import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366f1', // Modern indigo
    primaryVariant: '#4f46e5',
    secondary: '#8b5cf6', // Modern purple
    secondaryVariant: '#7c3aed',
    accent: '#06b6d4', // Modern cyan
    background: '#fafbfc',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    disabled: '#cbd5e1',
    placeholder: '#94a3b8',
    backdrop: 'rgba(15, 23, 42, 0.6)',
    notification: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    overlay: 'rgba(15, 23, 42, 0.1)',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    semiBold: {
      fontFamily: 'System',
      fontWeight: '600',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  roundness: 16,
};

export const colors = {
  // Primary colors
  primary: '#6366f1',
  primaryVariant: '#4f46e5',
  primaryLight: '#a5b4fc',
  primaryDark: '#4338ca',
  
  // Secondary colors
  secondary: '#8b5cf6',
  secondaryVariant: '#7c3aed',
  secondaryLight: '#c4b5fd',
  secondaryDark: '#6d28d9',
  
  // Accent colors
  accent: '#06b6d4',
  accentVariant: '#0891b2',
  accentLight: '#67e8f9',
  accentDark: '#0e7490',
  
  // Surface colors
  background: '#fafbfc',
  surface: '#ffffff',
  surfaceVariant: '#f8fafc',
  surfaceElevated: '#ffffff',
  
  // Text colors
  text: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textOnPrimary: '#ffffff',
  textOnSecondary: '#ffffff',
  
  // State colors
  success: '#10b981',
  successLight: '#6ee7b7',
  successDark: '#059669',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  info: '#3b82f6',
  infoLight: '#60a5fa',
  infoDark: '#2563eb',
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray: '#94a3b8',
  grayLight: '#f1f5f9',
  grayDark: '#475569',
  disabled: '#cbd5e1',
  placeholder: '#94a3b8',
  
  // Border colors
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Overlay colors
  backdrop: 'rgba(15, 23, 42, 0.6)',
  overlay: 'rgba(15, 23, 42, 0.1)',
  overlayLight: 'rgba(15, 23, 42, 0.05)',
  
  // Role-specific colors
  admin: '#ef4444',
  leader: '#3b82f6',
  lecturer: '#10b981',
  member: '#f59e0b',
  academic: '#8b5cf6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Component-specific spacing
  cardPadding: 20,
  buttonPadding: 16,
  inputPadding: 12,
  sectionMargin: 24,
  itemMargin: 12,
  
  // Layout spacing
  screenPadding: 20,
  headerHeight: 60,
  tabBarHeight: 80,
  bottomSheetPadding: 24,
};

export const typography = {
  // Display text
  displayLarge: {
    fontSize: 57,
    fontWeight: '400',
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400',
    lineHeight: 52,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400',
    lineHeight: 44,
  },
  
  // Headlines
  headlineLarge: {
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
  },
  
  // Titles
  titleLarge: {
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  
  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  
  // Legacy support
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
};