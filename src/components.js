import React from 'react';
import { Pressable } from 'react-native';
import { Surface } from 'react-native-paper';
import {
  FadeIn,
  SlideIn
} from './animations';
import {
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

