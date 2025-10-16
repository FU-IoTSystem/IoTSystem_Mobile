import React from 'react';
import { View, StyleSheet, Animated as RNAnimated } from 'react-native';
import { animations, colors, spacing } from './theme';

// Fade animation component
export const FadeIn = ({ children, delay = 0, duration = animations.duration.normal, style }) => {
  const opacity = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity]);

  return (
    <RNAnimated.View style={[{ opacity }, style]}>
      {children}
    </RNAnimated.View>
  );
};

// Slide animation component
export const SlideIn = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = animations.duration.normal,
  distance = 50,
  style 
}) => {
  const translateY = React.useRef(new RNAnimated.Value(direction === 'up' ? distance : direction === 'down' ? -distance : 0)).current;
  const translateX = React.useRef(new RNAnimated.Value(direction === 'left' ? distance : direction === 'right' ? -distance : 0)).current;
  const opacity = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateX, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, translateY, translateX, opacity]);

  return (
    <RNAnimated.View style={[
      { 
        transform: [{ translateY }, { translateX }],
        opacity 
      }, 
      style
    ]}>
      {children}
    </RNAnimated.View>
  );
};

// Scale animation component
export const ScaleIn = ({ 
  children, 
  delay = 0, 
  duration = animations.duration.normal,
  initialScale = 0.8,
  style 
}) => {
  const scale = React.useRef(new RNAnimated.Value(initialScale)).current;
  const opacity = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, scale, opacity]);

  return (
    <RNAnimated.View style={[
      { 
        transform: [{ scale }],
        opacity 
      }, 
      style
    ]}>
      {children}
    </RNAnimated.View>
  );
};

// Bounce animation component
export const BounceIn = ({ children, delay = 0, style }) => {
  const scale = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      RNAnimated.sequence([
        RNAnimated.spring(scale, {
          toValue: 1.2,
          useNativeDriver: true,
        }),
        RNAnimated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, scale]);

  return (
    <RNAnimated.View style={[
      { 
        transform: [{ scale }]
      }, 
      style
    ]}>
      {children}
    </RNAnimated.View>
  );
};

// Pulse animation component
export const Pulse = ({ children, style }) => {
  const scale = React.useRef(new RNAnimated.Value(1)).current;

  React.useEffect(() => {
    const pulseAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(scale, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(scale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [scale]);

  return (
    <RNAnimated.View style={[
      { 
        transform: [{ scale }]
      }, 
      style
    ]}>
      {children}
    </RNAnimated.View>
  );
};

// Shake animation component
export const Shake = ({ children, trigger, style }) => {
  const translateX = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    if (trigger) {
      RNAnimated.sequence([
        RNAnimated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [trigger, translateX]);

  return (
    <RNAnimated.View style={[
      { 
        transform: [{ translateX }]
      }, 
      style
    ]}>
      {children}
    </RNAnimated.View>
  );
};

// Loading spinner component
export const LoadingSpinner = ({ size = 24, color = colors.primary, style }) => {
  const rotation = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const spinAnimation = RNAnimated.loop(
      RNAnimated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.spinner, { width: size, height: size }, style]}>
      <RNAnimated.View
        style={[
          styles.spinnerInner,
          {
            width: size,
            height: size,
            borderColor: color,
            borderTopColor: 'transparent',
            transform: [{ rotate: spin }],
          },
        ]}
      />
    </View>
  );
};

// Skeleton loading component
export const Skeleton = ({ width = '100%', height = 20, borderRadius = 4, style }) => {
  const opacity = React.useRef(new RNAnimated.Value(0.3)).current;

  React.useEffect(() => {
    const skeletonAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    skeletonAnimation.start();

    return () => skeletonAnimation.stop();
  }, [opacity]);

  return (
    <RNAnimated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.grayLight,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Staggered list animation
export const StaggeredList = ({ children, staggerDelay = 100, style }) => {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          <SlideIn direction="up" delay={index * staggerDelay}>
            {child}
          </SlideIn>
        </FadeIn>
      ))}
    </View>
  );
};

// Simple animated button press effect
export const AnimatedButton = ({ 
  children, 
  onPress, 
  disabled = false,
  style,
  pressScale = 0.95,
  ...props 
}) => {
  const scale = React.useRef(new RNAnimated.Value(1)).current;
  const opacity = React.useRef(new RNAnimated.Value(1)).current;

  const handlePressIn = () => {
    RNAnimated.parallel([
      RNAnimated.spring(scale, { toValue: pressScale, useNativeDriver: true }),
      RNAnimated.timing(opacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    RNAnimated.parallel([
      RNAnimated.spring(scale, { toValue: 1, useNativeDriver: true }),
      RNAnimated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <RNAnimated.View style={[
      { 
        transform: [{ scale }],
        opacity 
      }, 
      style
    ]}>
      {React.cloneElement(children, {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        onPress: disabled ? undefined : onPress,
        disabled,
        ...props,
      })}
    </RNAnimated.View>
  );
};

// Simple floating animation
export const Floating = ({ children, amplitude = 10, duration = 2000, style }) => {
  const translateY = React.useRef(new RNAnimated.Value(0)).current;

  React.useEffect(() => {
    const floatingAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(translateY, {
          toValue: -amplitude,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateY, {
          toValue: amplitude,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    floatingAnimation.start();

    return () => floatingAnimation.stop();
  }, [amplitude, duration, translateY]);

  return (
    <RNAnimated.View style={[
      { 
        transform: [{ translateY }]
      }, 
      style
    ]}>
      {children}
    </RNAnimated.View>
  );
};

const styles = StyleSheet.create({
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    borderRadius: 50,
    borderWidth: 2,
  },
  skeleton: {
    backgroundColor: colors.grayLight,
  },
});

// Export animation utilities
export const createSpringAnimation = (config = {}) => {
  return RNAnimated.spring(new RNAnimated.Value(0), {
    toValue: 1,
    damping: config.damping || 20,
    stiffness: config.stiffness || 300,
    mass: config.mass || 1,
    useNativeDriver: true,
  });
};

export const createTimingAnimation = (config = {}) => {
  return RNAnimated.timing(new RNAnimated.Value(0), {
    toValue: 1,
    duration: config.duration || animations.duration.normal,
    useNativeDriver: true,
  });
};

export const createSequenceAnimation = (animations) => {
  return RNAnimated.sequence(animations);
};

export const createRepeatAnimation = (animation, iterations = -1, reverse = false) => {
  return RNAnimated.loop(animation, { iterations, resetBeforeIteration: reverse });
};
