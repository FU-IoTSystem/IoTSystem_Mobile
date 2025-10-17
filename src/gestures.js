import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated as RNAnimated } from 'react-native';
import { colors, spacing, animations } from './theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Simple pressable card with animation
export const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  style 
}) => {
  const scale = React.useRef(new RNAnimated.Value(1)).current;
  const opacity = React.useRef(new RNAnimated.Value(1)).current;

  const handlePress = () => {
    // Simple press animation
    RNAnimated.sequence([
      RNAnimated.spring(scale, { toValue: 0.95, useNativeDriver: true }),
      RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <RNAnimated.View style={[
        { 
          transform: [{ scale }],
          opacity 
        }, 
        style
      ]}>
        {children}
      </RNAnimated.View>
    </TouchableOpacity>
  );
};

// Simple pull to refresh component
export const PullToRefresh = ({ 
  children, 
  onRefresh, 
  refreshing = false,
  style 
}) => {
  return (
    <View style={style}>
      {children}
    </View>
  );
};

// Simple long pressable component
export const LongPressable = ({ 
  children, 
  onLongPress, 
  onPress,
  style 
}) => {
  const scale = React.useRef(new RNAnimated.Value(1)).current;

  const handlePress = () => {
    RNAnimated.sequence([
      RNAnimated.spring(scale, { toValue: 0.95, useNativeDriver: true }),
      RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };

  const handleLongPress = () => {
    RNAnimated.sequence([
      RNAnimated.spring(scale, { toValue: 0.9, useNativeDriver: true }),
      RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onLongPress?.();
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
    >
      <RNAnimated.View style={[
        { 
          transform: [{ scale }]
        }, 
        style
      ]}>
        {children}
      </RNAnimated.View>
    </TouchableOpacity>
  );
};

// Simple double tappable component
export const DoubleTappable = ({ 
  children, 
  onDoubleTap,
  onSingleTap,
  style 
}) => {
  const scale = React.useRef(new RNAnimated.Value(1)).current;
  const [lastTap, setLastTap] = React.useState(0);

  const handlePress = () => {
    const now = Date.now();
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300) {
      // Double tap
      RNAnimated.sequence([
        RNAnimated.spring(scale, { toValue: 1.2, useNativeDriver: true }),
        RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
      onDoubleTap?.();
    } else {
      // Single tap
      onSingleTap?.();
    }
    
    setLastTap(now);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <RNAnimated.View style={[
        { 
          transform: [{ scale }]
        }, 
        style
      ]}>
        {children}
      </RNAnimated.View>
    </TouchableOpacity>
  );
};

// Simple draggable component placeholder
export const Draggable = ({ children, style }) => {
  return (
    <View style={style}>
      {children}
    </View>
  );
};

// Simple pinchable component placeholder  
export const Pinchable = ({ children, style }) => {
  return (
    <View style={style}>
      {children}
    </View>
  );
};
