import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockLogin } from '../mocks';
import { Floating } from '../src/animations';
import { ModernButton, ModernCard } from '../src/components';
import { colors, spacing, typography } from '../src/theme';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (user) => {
    console.log('handleLogin called with user:', user);
    try {
      setLoading(true);
      const authenticatedUser = await mockLogin(user.email, user.password);
      
      // Navigate to appropriate portal based on role
      switch (authenticatedUser.role.toLowerCase()) {
        case 'admin':
          router.push('/admin');
          break;
        case 'leader':
          router.push('/leader');
          break;
        case 'lecturer':
          router.push('/lecturer');
          break;
        case 'member':
          router.push('/member');
          break;
        case 'academic':
          router.push('/academic');
          break;
        default:
          Alert.alert('Error', 'Unknown user role');
          break;
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Floating>
            <View style={styles.header}>
              <Text style={styles.title}>IoT Kit Rental System</Text>
              <Text style={styles.subtitle}>
                Welcome to the IoT Kit Rental Management System
              </Text>
              <Text style={styles.description}>
                Click on any role below to login with demo credentials
              </Text>
            </View>
          </Floating>

          <View style={styles.buttonList}>
            {demoUsers.map((user, index) => (
              <ModernCard
                key={user.role}
                variant="elevated"
                animated={false}
                delay={index * 150}
                style={styles.userCard}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.roleIcon}>
                      <Text style={styles.roleIconText}>{user.icon}</Text>
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.roleTitle}>{user.title}</Text>
                      <Text style={styles.roleDescription}>
                        {user.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <ModernButton
                      title={`Login as ${user.role}`}
                      variant="primary"
                      size="medium"
                      loading={loading}
                      disabled={loading}
                      onPress={() => handleLogin(user)}
                      style={[styles.loginButton, { backgroundColor: user.color }]}
                    />
                  </View>
                </View>
              </ModernCard>
            ))}
          </View>
          
          <View style={styles.buttonList}>
            <ModernCard
              variant="outlined"
              animated={false}
              delay={demoUsers.length * 150}
              style={styles.userCard}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.roleIcon}>
                    <Text style={styles.roleIconText}>🎨</Text>
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.roleTitle}>UI Demo</Text>
                    <Text style={styles.roleDescription}>
                      Explore modern UI components and animations
                    </Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <ModernButton
                    title="View Demo"
                    variant="secondary"
                    size="medium"
                    onPress={() => router.push('/demo')}
                    style={styles.loginButton}
                  />
                </View>
              </View>
            </ModernCard>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.textOnPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.titleLarge,
    color: colors.textOnPrimary,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyLarge,
    color: colors.textOnPrimary,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonList: {
    gap: spacing.md,
  },
  userCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    padding: spacing.cardPadding,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleIconText: {
    fontSize: 24,
  },
  cardText: {
    flex: 1,
  },
  roleTitle: {
    ...typography.titleLarge,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  roleDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardActions: {
    marginTop: spacing.sm,
  },
  loginButton: {
    borderRadius: 12,
  },
});
