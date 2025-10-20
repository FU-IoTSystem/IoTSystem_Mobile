import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Surface } from 'react-native-paper';
import {
  BounceIn,
  FadeIn,
  LoadingSpinner,
  Shake,
  Skeleton,
  SlideIn
} from './animations';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
  variants
} from './theme';

// Modern Card Component
export const ModernCard = ({ 
  children, 
  variant = 'default', 
  animated = true, 
  delay = 0,
  onPress,
  style,
  ...props 
}) => {
  const cardContent = (
    <Surface style={[variants.card[variant], style]} {...props}>
      {children}
    </Surface>
  );

  if (animated) {
    return (
      <FadeIn delay={delay}>
        <SlideIn direction="up" delay={delay} distance={20}>
          {onPress ? (
            <Pressable onPress={onPress} style={styles.cardPressable}>
              {cardContent}
            </Pressable>
          ) : (
            cardContent
          )}
        </SlideIn>
      </FadeIn>
    );
  }

  return onPress ? (
    <Pressable onPress={onPress} style={styles.cardPressable}>
      {cardContent}
    </Pressable>
  ) : (
    cardContent
  );
};

// Modern Button Component
export const ModernButton = ({ 
  title, 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  disabled = false,
  animated = true,
  onPress,
  style,
  textStyle,
  icon,
  ...props 
}) => {
  const handlePress = () => {
    console.log('Button pressed:', title, { disabled, loading, hasOnPress: !!onPress });
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.buttonTouchable,
        style,
        disabled && styles.buttonDisabled,
      ]}
      {...props}
    >
      <LinearGradient
        colors={getButtonGradient(variant)}
        style={[
          styles.button,
          styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.buttonContent}>
          {loading && <LoadingSpinner size={16} color={colors.textOnPrimary} />}
          {icon && !loading && <View style={styles.buttonIcon}>{icon}</View>}
          <Text style={[
            styles.buttonText,
            styles[`buttonText${size.charAt(0).toUpperCase() + size.slice(1)}`],
            textStyle,
          ]}>
            {title}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Modern Input Component
export const ModernInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  animated = true,
  style,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(!!error);
  }, [error]);

  const inputContent = (
    <View style={[styles.inputContainer, style]}>
      <Text style={[
        styles.inputLabel,
        (isFocused || value) && styles.inputLabelFocused,
        hasError && styles.inputLabelError,
      ]}>
        {label}
      </Text>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        hasError && styles.inputWrapperError,
      ]}>
        <Text
          style={[
            styles.inputText,
            !value && styles.inputPlaceholder,
          ]}
          onPress={() => setIsFocused(true)}
        >
          {value || placeholder}
        </Text>
      </View>
      {hasError && (
        <Shake trigger={hasError}>
          <Text style={styles.inputError}>{error}</Text>
        </Shake>
      )}
    </View>
  );

  if (animated) {
    return (
      <FadeIn>
        <SlideIn direction="up" distance={10}>
          {inputContent}
        </SlideIn>
      </FadeIn>
    );
  }

  return inputContent;
};

// Modern Tab Component
export const ModernTab = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  animated = true,
  style 
}) => {
  const tabContent = (
    <View style={[styles.tabContainer, style]}>
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.tabActive,
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={[
            styles.tabText,
            activeTab === tab.key && styles.tabTextActive,
          ]}>
            {tab.label}
          </Text>
          {activeTab === tab.key && (
            <View style={styles.tabIndicator} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  if (animated) {
    return (
      <FadeIn>
        <SlideIn direction="down" distance={20}>
          {tabContent}
        </SlideIn>
      </FadeIn>
    );
  }

  return tabContent;
};

// Modern Badge Component
export const ModernBadge = ({ 
  text, 
  variant = 'default', 
  size = 'medium',
  animated = true,
  style 
}) => {
  const badgeContent = (
    <View style={[
      styles.badge,
      styles[`badge${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      styles[`badge${size.charAt(0).toUpperCase() + size.slice(1)}`],
      style,
    ]}>
      <Text style={[
        styles.badgeText,
        styles[`badgeText${size.charAt(0).toUpperCase() + size.slice(1)}`],
      ]}>
        {text}
      </Text>
    </View>
  );

  if (animated) {
    return (
      <BounceIn>
        {badgeContent}
      </BounceIn>
    );
  }

  return badgeContent;
};

// Modern Loading Component
export const ModernLoading = ({ 
  message = 'Loading...', 
  size = 'large',
  style 
}) => {
  return (
    <View style={[styles.loadingContainer, style]}>
      <LoadingSpinner size={size === 'large' ? 48 : 32} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

// Modern Skeleton Component
export const ModernSkeleton = ({ 
  lines = 3, 
  animated = true,
  style 
}) => {
  const skeletonLines = Array.from({ length: lines }, (_, index) => (
    <Skeleton
      key={index}
      width={index === lines - 1 ? '70%' : '100%'}
      height={16}
      borderRadius={8}
      style={{ marginBottom: spacing.sm }}
    />
  ));

  return (
    <View style={style}>
      {skeletonLines}
    </View>
  );
};

// Modern Status Card Component
export const ModernStatusCard = ({ 
  title, 
  value, 
  status = 'default', 
  icon,
  animated = true,
  delay = 0,
  onPress,
  style 
}) => {
  const cardContent = (
    <ModernCard
      variant="elevated"
      animated={animated}
      delay={delay}
      onPress={onPress}
      style={[styles.statusCard, style]}
    >
      <View style={styles.statusCardContent}>
        <View style={styles.statusCardHeader}>
          <Text style={styles.statusCardTitle}>{title}</Text>
          {icon && <View style={styles.statusCardIcon}>{icon}</View>}
        </View>
        <Text style={[
          styles.statusCardValue,
          styles[`statusCardValue${status.charAt(0).toUpperCase() + status.slice(1)}`],
        ]}>
          {value}
        </Text>
      </View>
    </ModernCard>
  );

  return cardContent;
};

// Helper functions
const getButtonGradient = (variant) => {
  switch (variant) {
    case 'primary':
      return [colors.primary, colors.primaryVariant];
    case 'secondary':
      return [colors.secondary, colors.secondaryVariant];
    case 'success':
      return [colors.success, colors.successDark];
    case 'warning':
      return [colors.warning, colors.warningDark];
    case 'error':
      return [colors.error, colors.errorDark];
    case 'info':
      return [colors.info, colors.infoDark];
    default:
      return [colors.primary, colors.primaryVariant];
  }
};

const styles = StyleSheet.create({
  // Card styles
  cardPressable: {
    borderRadius: borderRadius.card,
  },

  // Button styles
  button: {
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.buttonPadding,
    paddingVertical: spacing.buttonPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonLarge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTouchable: {
    borderRadius: borderRadius.button,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonText: {
    ...typography.button,
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonTextLarge: {
    fontSize: 16,
  },

  // Input styles
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputLabelFocused: {
    color: colors.primary,
  },
  inputLabelError: {
    color: colors.error,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.inputPadding,
    paddingVertical: spacing.inputPadding,
    backgroundColor: colors.surface,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    ...shadows.elevation1,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  inputText: {
    ...typography.bodyLarge,
    color: colors.text,
  },
  inputPlaceholder: {
    color: colors.placeholder,
  },
  inputError: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  tabText: {
    ...typography.labelLarge,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -spacing.xs,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },

  // Badge styles
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeDefault: {
    backgroundColor: colors.grayLight,
  },
  badgePrimary: {
    backgroundColor: colors.primary,
  },
  badgeSuccess: {
    backgroundColor: colors.success,
  },
  badgeWarning: {
    backgroundColor: colors.warning,
  },
  badgeError: {
    backgroundColor: colors.error,
  },
  badgeSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeLarge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    ...typography.labelSmall,
    color: colors.text,
    fontWeight: '600',
  },
  badgeTextSmall: {
    fontSize: 10,
  },
  badgeTextLarge: {
    fontSize: 14,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // Status card styles
  statusCard: {
    marginBottom: spacing.md,
  },
  statusCardContent: {
    padding: spacing.cardPadding,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusCardTitle: {
    ...typography.labelLarge,
    color: colors.textSecondary,
  },
  statusCardIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCardValue: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
  },
  statusCardValueSuccess: {
    color: colors.success,
  },
  statusCardValueWarning: {
    color: colors.warning,
  },
  statusCardValueError: {
    color: colors.error,
  },
  statusCardValueInfo: {
    color: colors.info,
  },
});