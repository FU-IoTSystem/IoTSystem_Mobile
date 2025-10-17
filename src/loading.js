import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from './theme';
import { ModernLoading, ModernSkeleton } from './components';
import { Floating, Pulse } from './animations';

// Full screen loading component
export const FullScreenLoading = ({ message = 'Loading...', showSkeleton = false }) => {
  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.fullScreenGradient}
      >
        <View style={styles.fullScreenContent}>
          <Floating>
            <ModernLoading message={message} size="large" />
          </Floating>
          {showSkeleton && (
            <View style={styles.skeletonContainer}>
              <ModernSkeleton lines={3} animated={true} />
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Inline loading component
export const InlineLoading = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <View style={styles.inlineContainer}>
      <ModernLoading message={message} size={size} />
    </View>
  );
};

// Skeleton loading for cards
export const CardSkeleton = ({ count = 3, animated = true }) => {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <ModernSkeleton lines={2} animated={animated} />
          <View style={styles.skeletonButton}>
            <ModernSkeleton width="60%" height={40} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Skeleton loading for lists
export const ListSkeleton = ({ count = 5, animated = true }) => {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonListItem}>
          <ModernSkeleton width="100%" height={60} borderRadius={12} />
        </View>
      ))}
    </View>
  );
};

// Pulse loading for buttons
export const ButtonSkeleton = ({ width = '100%', height = 48, animated = true }) => {
  return (
    <Pulse>
      <ModernSkeleton width={width} height={height} borderRadius={12} />
    </Pulse>
  );
};

// Shimmer effect component
export const Shimmer = ({ width = '100%', height = 20, borderRadius = 4, style }) => {
  return (
    <View style={[styles.shimmerContainer, { width, height, borderRadius }, style]}>
      <ModernSkeleton width="100%" height="100%" borderRadius={borderRadius} />
    </View>
  );
};

// Loading overlay
export const LoadingOverlay = ({ visible, message = 'Loading...', children }) => {
  if (!visible) return children;

  return (
    <View style={styles.overlayContainer}>
      {children}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <ModernLoading message={message} size="medium" />
        </View>
      </View>
    </View>
  );
};

// Progressive loading component
export const ProgressiveLoading = ({ 
  steps = ['Loading data...', 'Processing...', 'Almost done...'], 
  currentStep = 0,
  onComplete 
}) => {
  React.useEffect(() => {
    if (currentStep >= steps.length - 1) {
      setTimeout(() => {
        onComplete?.();
      }, 1000);
    }
  }, [currentStep, steps.length, onComplete]);

  return (
    <View style={styles.progressiveContainer}>
      <ModernLoading 
        message={steps[currentStep] || 'Loading...'} 
        size="large" 
      />
      <View style={styles.progressSteps}>
        {steps.map((step, index) => (
          <View
            key={index}
            style={[
              styles.progressStep,
              index <= currentStep && styles.progressStepActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenGradient: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  skeletonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: spacing.xl,
  },
  inlineContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  skeletonList: {
    gap: spacing.md,
  },
  skeletonCard: {
    padding: spacing.cardPadding,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  skeletonButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  skeletonListItem: {
    marginBottom: spacing.sm,
  },
  shimmerContainer: {
    backgroundColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  overlayContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  progressiveContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  progressSteps: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
});
