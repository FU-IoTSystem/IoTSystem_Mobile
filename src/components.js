import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Surface } from 'react-native-paper';
import {
  FadeIn,
  LoadingSpinner,
  SlideIn
} from './animations';
import {
  colors,
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
