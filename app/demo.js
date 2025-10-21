import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../src/theme';
import { 
  ModernCard, 
  ModernButton, 
  ModernTab, 
  ModernBadge, 
  ModernStatusCard,
  ModernSkeleton
} from '../src/components';
import { Floating, StaggeredList } from '../src/animations';
import { 
  SwipeableCard, 
  LongPressable, 
  DoubleTappable,
  PullToRefresh 
} from '../src/gestures';
import { FullScreenLoading, CardSkeleton } from '../src/loading';

export default function DemoScreen() {
  const [activeTab, setActiveTab] = useState('components');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { key: 'components', label: 'Components' },
    { key: 'animations', label: 'Animations' },
    { key: 'gestures', label: 'Gestures' },
    { key: 'loading', label: 'Loading' },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed!', 'Content has been refreshed');
    }, 2000);
  };

  const handleSwipeLeft = () => {
    Alert.alert('Swipe Left', 'You swiped left!');
  };

  const handleSwipeRight = () => {
    Alert.alert('Swipe Right', 'You swiped right!');
  };

  const handleLongPress = () => {
    Alert.alert('Long Press', 'Long press detected!');
  };

  const handleDoubleTap = () => {
    Alert.alert('Double Tap', 'Double tap detected!');
  };

  if (loading) {
    return <FullScreenLoading message="Loading demo..." showSkeleton={true} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <Floating>
          <Text style={styles.headerTitle}>Modern UI Demo</Text>
          <Text style={styles.headerSubtitle}>Showcasing animations and components</Text>
        </Floating>
      </LinearGradient>

      <ModernTab
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        animated={true}
      />

      <PullToRefresh onRefresh={handleRefresh} refreshing={refreshing}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'components' && (
            <StaggeredList staggerDelay={100}>
              <ModernStatusCard
                title="Total Users"
                value="1,234"
                status="success"
                icon={<Text style={styles.statusIcon}>👥</Text>}
                delay={0}
              />
              
              <ModernStatusCard
                title="Active Rentals"
                value="56"
                status="info"
                icon={<Text style={styles.statusIcon}>📦</Text>}
                delay={100}
              />
              
              <ModernStatusCard
                title="Pending Requests"
                value="12"
                status="warning"
                icon={<Text style={styles.statusIcon}>⏳</Text>}
                delay={200}
              />

              <ModernCard variant="elevated" animated={true} delay={300}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Modern Card</Text>
                  <Text style={styles.cardDescription}>
                    This is a modern card with elevation and animations.
                  </Text>
                  <View style={styles.badgeContainer}>
                    <ModernBadge text="New" variant="success" size="small" />
                    <ModernBadge text="Featured" variant="primary" size="small" />
                  </View>
                </View>
              </ModernCard>

              <View style={styles.buttonContainer}>
                <ModernButton
                  title="Primary Button"
                  variant="primary"
                  size="medium"
                  onPress={() => Alert.alert('Primary', 'Primary button pressed!')}
                />
                <ModernButton
                  title="Success Button"
                  variant="success"
                  size="medium"
                  onPress={() => Alert.alert('Success', 'Success button pressed!')}
                />
                <ModernButton
                  title="Warning Button"
                  variant="warning"
                  size="medium"
                  onPress={() => Alert.alert('Warning', 'Warning button pressed!')}
                />
              </View>
            </StaggeredList>
          )}

          {activeTab === 'animations' && (
            <StaggeredList staggerDelay={150}>
              <ModernCard variant="elevated" animated={true} delay={0}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Fade In Animation</Text>
                  <Text style={styles.cardDescription}>
                    This card fades in with a smooth animation.
                  </Text>
                </View>
              </ModernCard>

              <ModernCard variant="elevated" animated={true} delay={200}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Slide In Animation</Text>
                  <Text style={styles.cardDescription}>
                    This card slides in from the bottom.
                  </Text>
                </View>
              </ModernCard>

              <ModernCard variant="elevated" animated={true} delay={400}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Scale Animation</Text>
                  <Text style={styles.cardDescription}>
                    This card scales in with a bounce effect.
                  </Text>
                </View>
              </ModernCard>

              <Floating>
                <ModernCard variant="outlined" animated={false}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Floating Animation</Text>
                    <Text style={styles.cardDescription}>
                      This card has a continuous floating animation.
                    </Text>
                  </View>
                </ModernCard>
              </Floating>
            </StaggeredList>
          )}

          {activeTab === 'gestures' && (
            <StaggeredList staggerDelay={100}>
              <SwipeableCard
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                style={styles.swipeableCard}
              >
                <ModernCard variant="elevated" animated={false}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Swipeable Card</Text>
                    <Text style={styles.cardDescription}>
                      Swipe left or right to see the gesture in action!
                    </Text>
                  </View>
                </ModernCard>
              </SwipeableCard>

              <LongPressable
                onLongPress={handleLongPress}
                onPress={() => Alert.alert('Tap', 'Single tap detected!')}
              >
                <ModernCard variant="elevated" animated={false}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Long Pressable</Text>
                    <Text style={styles.cardDescription}>
                      Long press this card to see the effect!
                    </Text>
                  </View>
                </ModernCard>
              </LongPressable>

              <DoubleTappable
                onDoubleTap={handleDoubleTap}
                onSingleTap={() => Alert.alert('Single Tap', 'Single tap detected!')}
              >
                <ModernCard variant="elevated" animated={false}>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Double Tappable</Text>
                    <Text style={styles.cardDescription}>
                      Double tap this card to see the effect!
                    </Text>
                  </View>
                </ModernCard>
              </DoubleTappable>
            </StaggeredList>
          )}

          {activeTab === 'loading' && (
            <StaggeredList staggerDelay={100}>
              <ModernCard variant="elevated" animated={true} delay={0}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Skeleton Loading</Text>
                  <Text style={styles.cardDescription}>
                    Here's how skeleton loading looks:
                  </Text>
                  <ModernSkeleton lines={3} animated={true} />
                </View>
              </ModernCard>

              <ModernCard variant="elevated" animated={true} delay={200}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Card Skeleton</Text>
                  <Text style={styles.cardDescription}>
                    Skeleton loading for cards:
                  </Text>
                  <CardSkeleton count={2} animated={true} />
                </View>
              </ModernCard>

              <ModernButton
                title="Show Loading"
                variant="primary"
                size="medium"
                loading={loading}
                onPress={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 3000);
                }}
              />
            </StaggeredList>
          )}
        </ScrollView>
      </PullToRefresh>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.headlineMedium,
    color: colors.textOnPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodyLarge,
    color: colors.textOnPrimary,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: spacing.screenPadding,
  },
  cardContent: {
    padding: spacing.cardPadding,
  },
  cardTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  cardDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  swipeableCard: {
    marginBottom: spacing.md,
  },
  statusIcon: {
    fontSize: 24,
  },
});
