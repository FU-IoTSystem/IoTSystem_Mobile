import React, { useMemo, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { mockGroups, mockWallet } from '../mocks';
import { colors, spacing, typography, shadows, borderRadius } from '../src/theme';
import { 
  ModernCard, 
  ModernTab, 
  ModernStatusCard, 
  ModernSkeleton,
  ModernButton,
  ModernBadge,
  BottomNavigation,
  PortalHeader
} from '../src/components';
import { FadeIn, SlideIn, ScaleIn, Pulse } from '../src/animations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MemberScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const group = useMemo(() => mockGroups.find(g => g.members.includes('member@fpt.edu.vn')), []);
  const wallet = mockWallet;

  // Navigation tabs are now handled by BottomNavigation component

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleFABPress = () => {
    // Handle floating action button press based on current tab
    switch (activeTab) {
      case 'dashboard':
        // Quick action for dashboard
        break;
      case 'group':
        // Create or join group
        break;
      case 'wallet':
        // Top up wallet
        break;
      case 'profile':
        // Edit profile
        break;
    }
  };

  const renderHeader = () => (
    <PortalHeader
      userName="John Doe"
      userEmail="member@fpt.edu.vn"
      userRole="member"
      notificationCount={2}
      onNotificationPress={() => console.log('Notifications pressed')}
    />
  );

  const renderBottomNavigation = () => (
    <BottomNavigation
      userRole="member"
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  const renderFloatingActionButton = () => (
    <FadeIn delay={300}>
      <TouchableOpacity
        style={styles.fab}
        onPress={handleFABPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentVariant]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>
    </FadeIn>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'dashboard' && <DashboardContent group={group} wallet={wallet} />}
        {activeTab === 'group' && <GroupContent group={group} />}
        {activeTab === 'wallet' && <WalletContent wallet={wallet} />}
        {activeTab === 'profile' && <ProfileContent />}
      </ScrollView>

      {renderBottomNavigation()}
      {showFAB && renderFloatingActionButton()}
    </View>
  );
}


// Helper Components
const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
                  </View>
);

// Dashboard Content Component
const DashboardContent = ({ group, wallet }) => (
  <View style={styles.tabContent}>
    {/* Quick Stats */}
    <View style={styles.quickStatsContainer}>
      <SlideIn direction="up" delay={0}>
        <ModernCard variant="elevated" style={styles.quickStatCard}>
          <LinearGradient
            colors={[colors.success, colors.successDark]}
            style={styles.quickStatGradient}
          >
            <View style={styles.quickStatContent}>
              <Ionicons name="people" size={24} color={colors.white} />
              <Text style={styles.quickStatValue}>{group ? group.members.length + 1 : 0}</Text>
              <Text style={styles.quickStatLabel}>Group Members</Text>
                  </View>
          </LinearGradient>
        </ModernCard>
      </SlideIn>

      <SlideIn direction="up" delay={100}>
        <ModernCard variant="elevated" style={styles.quickStatCard}>
          <LinearGradient
            colors={[colors.info, colors.infoDark]}
            style={styles.quickStatGradient}
          >
            <View style={styles.quickStatContent}>
              <Ionicons name="wallet" size={24} color={colors.white} />
              <Text style={styles.quickStatValue}>₫{wallet.balance.toLocaleString()}</Text>
              <Text style={styles.quickStatLabel}>Wallet Balance</Text>
                </View>
          </LinearGradient>
        </ModernCard>
      </SlideIn>
      </View>

    {/* Group Status Card */}
    <SlideIn direction="up" delay={200}>
      <ModernCard variant="elevated" style={styles.groupStatusCard}>
        <View style={styles.groupStatusHeader}>
          <View style={styles.groupStatusLeft}>
            <Ionicons 
              name={group ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={group ? colors.success : colors.warning} 
            />
            <Text style={styles.groupStatusTitle}>
              {group ? 'Group Active' : 'No Group Assigned'}
            </Text>
          </View>
          <ModernBadge 
            text={group ? 'Active' : 'Pending'} 
            variant={group ? 'success' : 'warning'} 
          />
        </View>

          {group ? (
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
            <View style={styles.groupMembers}>
              <Text style={styles.groupMembersLabel}>Members:</Text>
              <Text style={styles.groupMembersList}>
                {[group.leader, ...group.members].join(', ')}
              </Text>
              </View>
          </View>
        ) : (
          <View style={styles.noGroupContent}>
            <Text style={styles.noGroupText}>
              You haven't been assigned to a group yet. Contact your lecturer to join a group.
                </Text>
            <ModernButton
              title="Request Group Assignment"
              variant="primary"
              style={styles.requestGroupButton}
          />
        </View>
      )}
            </ModernCard>
    </SlideIn>

    {/* Recent Activity */}
    <SlideIn direction="up" delay={300}>
      <ModernCard variant="elevated" style={styles.recentActivityCard}>
        <View style={styles.recentActivityHeader}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
                  </View>
        
        <View style={styles.activityList}>
          {wallet.transactions.slice(0, 3).map((transaction, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: transaction.amount > 0 ? colors.success + '20' : colors.error + '20' }
              ]}>
                <Ionicons
                  name={transaction.amount > 0 ? "arrow-down" : "arrow-up"}
                  size={16}
                  color={transaction.amount > 0 ? colors.success : colors.error}
                />
                  </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{transaction.type}</Text>
                <Text style={styles.activityDate}>{transaction.date}</Text>
              </View>
              <Text style={[
                styles.activityAmount,
                transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {transaction.amount > 0 ? '+' : ''}₫{transaction.amount.toLocaleString()}
                </Text>
            </View>
          ))}
              </View>
            </ModernCard>
    </SlideIn>
        </View>
);

// Group Content Component
const GroupContent = ({ group }) => (
  <View style={styles.tabContent}>
    {group ? (
      <>
        {/* Group Overview */}
        <SlideIn direction="up" delay={0}>
          <ModernCard variant="elevated" style={styles.groupOverviewCard}>
            <View style={styles.groupOverviewHeader}>
              <LinearGradient
                colors={[colors.primary, colors.primaryVariant]}
                style={styles.groupOverviewGradient}
              >
                <Ionicons name="people" size={24} color={colors.white} />
              </LinearGradient>
              <View style={styles.groupOverviewInfo}>
                <Text style={styles.groupOverviewName}>{group.name}</Text>
                <Text style={styles.groupOverviewStatus}>Active Group</Text>
              </View>
            </View>
            
            <View style={styles.groupOverviewStats}>
              <View style={styles.groupStat}>
                <Text style={styles.groupStatValue}>{group.members.length + 1}</Text>
                <Text style={styles.groupStatLabel}>Total Members</Text>
                </View>
              <View style={styles.groupStat}>
                <Text style={styles.groupStatValue}>4</Text>
                <Text style={styles.groupStatLabel}>Max Members</Text>
              </View>
              <View style={styles.groupStat}>
                <Text style={styles.groupStatValue}>1</Text>
                <Text style={styles.groupStatLabel}>Active Projects</Text>
              </View>
            </View>
          </ModernCard>
        </SlideIn>

        {/* Group Members */}
        <SlideIn direction="up" delay={100}>
          <ModernCard variant="elevated" style={styles.groupMembersCard}>
            <Text style={styles.sectionTitle}>Group Members</Text>
            
            <View style={styles.memberList}>
              <View style={styles.memberItem}>
                <View style={[styles.memberAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{group.leader}</Text>
                  <Text style={styles.memberRole}>Leader</Text>
              </View>
                <ModernBadge text="Leader" variant="primary" />
          </View>
          
              {group.members.map((member, index) => (
                <View key={index} style={styles.memberItem}>
                  <View style={[styles.memberAvatar, { backgroundColor: colors.secondary + '20' }]}>
                    <Ionicons name="person" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member}</Text>
                    <Text style={styles.memberRole}>Member</Text>
                  </View>
                  <ModernBadge text="Member" variant="default" />
                </View>
              ))}
              </View>
            </ModernCard>
        </SlideIn>

        {/* Group Details */}
        <SlideIn direction="up" delay={200}>
          <ModernCard variant="elevated" style={styles.groupDetailsCard}>
            <Text style={styles.sectionTitle}>Group Details</Text>
            
            <View style={styles.detailList}>
              <DetailItem label="Group Name" value={group.name} />
              <DetailItem label="Leader" value={group.leader} />
              <DetailItem label="Lecturer" value={group.lecturer} />
              <DetailItem label="Description" value={group.description} />
              <DetailItem label="Created" value="2024-01-15" />
              <DetailItem label="Status" value="Active" />
                  </View>
          </ModernCard>
        </SlideIn>
      </>
    ) : (
      <SlideIn direction="up" delay={0}>
        <ModernCard variant="outlined" style={styles.noGroupCard}>
          <View style={styles.noGroupContent}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.noGroupTitle}>No Group Assigned</Text>
            <Text style={styles.noGroupText}>
              You haven't been assigned to a group yet. Contact your lecturer to join a group or create a new one.
                      </Text>
            <View style={styles.noGroupActions}>
              <ModernButton
                title="Contact Lecturer"
                variant="primary"
                style={styles.noGroupButton}
              />
              <ModernButton
                title="Create Group"
                variant="outline"
                style={styles.noGroupButton}
              />
                </View>
              </View>
            </ModernCard>
      </SlideIn>
    )}
                  </View>
);

// Wallet Content Component
const WalletContent = ({ wallet }) => (
  <View style={styles.tabContent}>
    {/* Wallet Balance Card */}
    <SlideIn direction="up" delay={0}>
      <ModernCard variant="elevated" style={styles.walletBalanceCard}>
        <LinearGradient
          colors={[colors.primary, colors.primaryVariant]}
          style={styles.walletBalanceGradient}
        >
          <View style={styles.walletBalanceContent}>
            <View style={styles.walletBalanceHeader}>
              <Text style={styles.walletBalanceLabel}>Total Balance</Text>
              <Ionicons name="wallet" size={20} color={colors.white} />
                  </View>
            <Text style={styles.walletBalanceAmount}>₫{wallet.balance.toLocaleString()}</Text>
            <Text style={styles.walletBalanceSubtitle}>Available for kit rentals</Text>
                </View>
        </LinearGradient>
            </ModernCard>
    </SlideIn>



    {/* Transaction History */}
    <SlideIn direction="up" delay={100}>
      <ModernCard variant="elevated" style={styles.transactionHistoryCard}>
        <View style={styles.transactionHistoryHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
            </View>
            
        <View style={styles.transactionList}>
          {wallet.transactions.slice(0, 5).map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={[
                styles.transactionIcon,
                { backgroundColor: transaction.amount > 0 ? colors.success + '20' : colors.error + '20' }
              ]}>
                <Ionicons
                  name={transaction.amount > 0 ? "arrow-down" : "arrow-up"}
                  size={20}
                  color={transaction.amount > 0 ? colors.success : colors.error}
                />
                    </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>{transaction.type}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
                    </View>
                      <Text style={[
                styles.transactionAmount,
                transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
                      ]}>
                {transaction.amount > 0 ? '+' : ''}₫{transaction.amount.toLocaleString()}
                      </Text>
                    </View>
          ))}
                  </View>
      </ModernCard>
    </SlideIn>
                </View>
);

// Profile Content Component
const ProfileContent = () => (
  <View style={styles.tabContent}>
    <SlideIn direction="up" delay={0}>
      <ModernCard variant="elevated" style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={[colors.secondary, colors.secondaryVariant]}
            style={styles.profileAvatar}
          >
            <Ionicons name="person" size={40} color={colors.white} />
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>member@fpt.edu.vn</Text>
            <ModernBadge text="Member" variant="primary" />
          </View>
        </View>
          </ModernCard>
    </SlideIn>

    <SlideIn direction="up" delay={100}>
      <ModernCard variant="elevated" style={styles.profileDetailsCard}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.profileDetailsList}>
          <DetailItem label="Student ID" value="SE123456" />
          <DetailItem label="Full Name" value="John Doe" />
          <DetailItem label="Email" value="member@fpt.edu.vn" />
          <DetailItem label="Phone" value="+84 123 456 789" />
          <DetailItem label="Department" value="Software Engineering" />
          <DetailItem label="Year" value="2024" />
                  </View>
      </ModernCard>
    </SlideIn>

    <SlideIn direction="up" delay={200}>
      <ModernCard variant="elevated" style={styles.profileActionsCard}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <View style={styles.profileActionsList}>
          <TouchableOpacity style={styles.profileAction}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.profileActionLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileAction}>
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <Text style={styles.profileActionLabel}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileAction}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.profileActionLabel}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileAction}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[styles.profileActionLabel, { color: colors.error }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
                </View>
          </ModernCard>
    </SlideIn>
        </View>
  );


function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxxl, // Extra padding for bottom navigation
  },

  // Header and Navigation styles are now handled by reusable components

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 80,
    right: spacing.screenPadding,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...shadows.elevation8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dashboard Styles
  quickStatsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    overflow: 'hidden',
  },
  quickStatGradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.card,
  },
  quickStatContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatValue: {
    ...typography.headlineSmall,
    color: colors.white,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  quickStatLabel: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Group Status Card
  groupStatusCard: {
    marginBottom: spacing.lg,
  },
  groupStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  groupStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupStatusTitle: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  groupInfo: {
    // Group info content
  },
  groupName: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  groupDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  groupMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMembersLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  groupMembersList: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },

  // Recent Activity
  recentActivityCard: {
    marginBottom: spacing.lg,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recentActivityTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
  },
  viewAllText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  activityList: {
    // Activity list container
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'left',
  },
  activityDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  activityAmount: {
    ...typography.bodyMedium,
    fontWeight: '600',
    textAlign: 'right',
  },
  positiveAmount: {
    color: colors.success,
  },
  negativeAmount: {
    color: colors.error,
  },

  // Section Title
  sectionTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Group Content Styles
  groupOverviewCard: {
    marginBottom: spacing.lg,
  },
  groupOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  groupOverviewGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  groupOverviewInfo: {
    flex: 1,
  },
  groupOverviewName: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
  },
  groupOverviewStatus: {
    ...typography.bodyMedium,
    color: colors.success,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  groupOverviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  groupStat: {
    alignItems: 'center',
  },
  groupStatValue: {
    ...typography.headlineSmall,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  groupStatLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Group Members
  groupMembersCard: {
    marginBottom: spacing.lg,
  },
  memberList: {
    // Member list container
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'left',
  },
  memberRole: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'left',
  },

  // Group Details
  groupDetailsCard: {
    marginBottom: spacing.lg,
  },
  detailList: {
    // Detail list container
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },

  // No Group Card
  noGroupCard: {
    marginBottom: spacing.lg,
  },
  noGroupContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noGroupTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noGroupText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  noGroupActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  noGroupButton: {
    flex: 1,
  },
  requestGroupButton: {
    marginTop: spacing.md,
  },

  // Wallet Content Styles
  walletBalanceCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  walletBalanceGradient: {
    padding: spacing.lg,
  },
  walletBalanceContent: {
    // Wallet balance content
  },
  walletBalanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  walletBalanceLabel: {
    ...typography.bodyMedium,
    color: colors.white,
    opacity: 0.9,
  },
  walletBalanceAmount: {
    ...typography.headlineLarge,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  walletBalanceSubtitle: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'left',
  },



  // Transaction History
  transactionHistoryCard: {
    marginBottom: spacing.lg,
  },
  transactionHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  transactionList: {
    // Transaction list container
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'left',
  },
  transactionDate: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'left',
  },
  transactionAmount: {
    ...typography.bodyMedium,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Profile Content Styles
  profileCard: {
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'left',
  },
  profileEmail: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'left',
  },

  // Profile Details
  profileDetailsCard: {
    marginBottom: spacing.lg,
  },
  profileDetailsList: {
    // Profile details list container
  },

  // Profile Actions
  profileActionsCard: {
    marginBottom: spacing.lg,
  },
  profileActionsList: {
    // Profile actions list container
  },
  profileAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  profileActionLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
    marginLeft: spacing.md,
    textAlign: 'left',
  },

  // Legacy styles (keeping for compatibility)
  statusIcon: {
    fontSize: 20,
  },
  groupCard: {
    padding: spacing.cardPadding,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    ...typography.titleLarge,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  emptyStateText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Legacy styles (keeping for compatibility)
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
});


