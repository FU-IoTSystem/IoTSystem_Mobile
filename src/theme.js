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

export const shadows = {
  // Material Design elevation levels
  elevation0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  elevation1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  elevation2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  elevation3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  elevation4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  elevation5: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  elevation8: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  elevation12: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  elevation16: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  elevation24: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16.00,
    elevation: 24,
  },
  
  // Legacy support
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Animation constants
export const animations = {
  // Duration
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  },
  
  // Easing curves
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // Material Design easing curves
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  },
  
  // Spring configurations
  spring: {
    gentle: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
    wobbly: {
      damping: 18,
      stiffness: 180,
      mass: 1,
    },
    stiff: {
      damping: 26,
      stiffness: 400,
      mass: 1,
    },
  },
};

// Border radius system
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
  
  // Component-specific
  button: 12,
  card: 16,
  input: 12,
  modal: 20,
  sheet: 24,
};

// Z-index system
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

// Component variants
export const variants = {
  button: {
    primary: {
      backgroundColor: colors.primary,
      color: colors.textOnPrimary,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.textOnSecondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      borderWidth: 1,
      color: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.primary,
    },
  },
  
  card: {
    default: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      ...shadows.elevation2,
    },
    elevated: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      ...shadows.elevation4,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
  },
};