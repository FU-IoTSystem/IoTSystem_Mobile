import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Surface } from 'react-native-paper';
import {
  FadeIn,
  LoadingSpinner,
  Shake,
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
