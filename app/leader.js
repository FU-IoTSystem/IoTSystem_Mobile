import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { 
  Appbar, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  Surface,
  FAB,
  Portal,
  Modal,
  List,
  Divider,
  Avatar,
  Badge,
  Switch,
  TextInput,
  DataTable,
  ActivityIndicator,
  Searchbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../src/theme';
import { mockGroups, mockKits, mockWallet, mockSystemStats } from '../mocks';

export default function LeaderScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [kits, setKits] = useState([]);
  const [wallet, setWallet] = useState(mockWallet);
  const [refundRequests, setRefundRequests] = useState([]);
  
  // Find user's group
  const myGroup = useMemo(() => 
    mockGroups.find(g => g.leader === 'leader@fpt.edu.vn') || null, 
    []
  );
  
  const openGroups = useMemo(() => 
    mockGroups.filter(g => g.status === 'open'), 
    []
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      setKits(mockKits);
      setWallet(mockWallet);
      setRefundRequests([
        {
          id: 1,
          kitName: 'IoT Starter Kit',
          requestDate: '2024-01-10',
          refundDate: '2024-01-12',
          status: 'pending',
          reason: 'Kit malfunction',
          amount: 70000
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    router.push('/');
  };

  const handleRentKit = (kit) => {
    router.push('/rental-request');
  };

  const handleTopUp = () => {
    router.push('/top-up');
  };

  const handlePayPenalties = () => {
    router.push('/penalty-payment');
  };

  const renderDashboard = () => (
    <View style={styles.tabContent}>
      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, shadows.small]}>
          <Card.Content style={styles.statContent}>
            <Title style={styles.statNumber}>{myGroup ? myGroup.members.length + 1 : 0}</Title>
            <Paragraph style={styles.statLabel}>Group Members</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, shadows.small]}>
          <Card.Content style={styles.statContent}>
            <Title style={styles.statNumber}>{wallet.balance.toLocaleString()}</Title>
            <Paragraph style={styles.statLabel}>Wallet Balance (VND)</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, shadows.small]}>
          <Card.Content style={styles.statContent}>
            <Title style={styles.statNumber}>{kits.filter(kit => kit.status === 'AVAILABLE').length}</Title>
            <Paragraph style={styles.statLabel}>Available Kits</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, shadows.small]}>
          <Card.Content style={styles.statContent}>
            <Title style={styles.statNumber}>{refundRequests.length}</Title>
            <Paragraph style={styles.statLabel}>Refund Requests</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* Group Information */}
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Group Information</Title>
          {myGroup ? (
            <View>
              <Paragraph style={styles.groupName}>{myGroup.name}</Paragraph>
              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>Leader:</Paragraph>
                <Paragraph style={styles.infoValue}>{myGroup.leader}</Paragraph>
              </View>
              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>Members:</Paragraph>
                <Paragraph style={styles.infoValue}>{myGroup.members.join(', ')}</Paragraph>
              </View>
              {myGroup.lecturer && (
                <View style={styles.infoRow}>
                  <Paragraph style={styles.infoLabel}>Lecturer:</Paragraph>
                  <Paragraph style={styles.infoValue}>{myGroup.lecturer}</Paragraph>
                </View>
              )}
            </View>
          ) : (
            <Paragraph>No group information available</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Recent Transactions</Title>
          {wallet.transactions.slice(0, 3).map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Paragraph style={styles.transactionType}>{transaction.type}</Paragraph>
                <Paragraph style={styles.transactionDate}>{transaction.date}</Paragraph>
              </View>
              <Paragraph style={styles.transactionAmount}>
                {transaction.amount.toLocaleString()} VND
              </Paragraph>
            </View>
          ))}
        </Card.Content>
      </Card>
    </View>
  );

  const renderGroupManagement = () => (
    <View style={styles.tabContent}>
      {myGroup ? (
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Group Management</Title>
            
            <View style={styles.groupDetails}>
              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>Group Name:</Paragraph>
                <Paragraph style={styles.infoValue}>{myGroup.name}</Paragraph>
              </View>
              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>Leader:</Paragraph>
                <Paragraph style={styles.infoValue}>{myGroup.leader}</Paragraph>
              </View>
              <View style={styles.infoRow}>
                <Paragraph style={styles.infoLabel}>Total Members:</Paragraph>
                <Paragraph style={styles.infoValue}>{myGroup.members.length + 1}</Paragraph>
              </View>
              {myGroup.lecturer && (
                <View style={styles.infoRow}>
                  <Paragraph style={styles.infoLabel}>Lecturer:</Paragraph>
                  <Paragraph style={styles.infoValue}>{myGroup.lecturer}</Paragraph>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            <Title style={styles.sectionTitle}>Group Members</Title>
            <List.Section>
              <List.Item
                title={myGroup.leader}
                description="Group Leader"
                left={props => <List.Icon {...props} icon="crown" />}
                right={props => <Chip mode="outlined" compact>Leader</Chip>}
              />
              {myGroup.members.map((member, index) => (
                <List.Item
                  key={index}
                  title={member}
                  description={`Member ${index + 1}`}
                  left={props => <List.Icon {...props} icon="account" />}
                  right={props => <Chip mode="outlined" compact>Member</Chip>}
                />
              ))}
            </List.Section>
          </Card.Content>
        </Card>
      ) : (
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>No Group</Title>
            <Paragraph>You are not currently leading any group.</Paragraph>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderKitRental = () => (
    <View style={styles.tabContent}>
      <Searchbar
        placeholder="Search kits..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Available Kits</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Category</DataTable.Title>
              <DataTable.Title>Price</DataTable.Title>
              <DataTable.Title>Actions</DataTable.Title>
            </DataTable.Header>

            {kits.filter(kit => kit.status === 'AVAILABLE').map((kit) => (
              <DataTable.Row key={kit.id}>
                <DataTable.Cell>{kit.name}</DataTable.Cell>
                <DataTable.Cell>{kit.category}</DataTable.Cell>
                <DataTable.Cell>{kit.price.toLocaleString()} VND</DataTable.Cell>
                <DataTable.Cell>
                  <Button 
                    mode="contained" 
                    compact
                    onPress={() => handleRentKit(kit)}
                  >
                    Rent
                  </Button>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </View>
  );

  const renderRefundRequests = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Refund Requests</Title>
            <Button 
              mode="contained" 
              icon="plus"
              onPress={() => router.push('/refund-request')}
            >
              New Request
            </Button>
          </View>
          
          {refundRequests.map((request) => (
            <Card key={request.id} style={styles.requestCard}>
              <Card.Content>
                <View style={styles.requestHeader}>
                  <Title style={styles.requestTitle}>{request.kitName}</Title>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.statusChip,
                      { borderColor: request.status === 'approved' ? colors.success : colors.warning }
                    ]}
                    textStyle={{ color: request.status === 'approved' ? colors.success : colors.warning }}
                  >
                    {request.status}
                  </Chip>
                </View>
                <Paragraph style={styles.requestInfo}>
                  Request Date: {request.requestDate}
                </Paragraph>
                <Paragraph style={styles.requestInfo}>
                  Refund Date: {request.refundDate}
                </Paragraph>
                <Paragraph style={styles.requestInfo}>
                  Amount: {request.amount.toLocaleString()} VND
                </Paragraph>
                <Paragraph style={styles.requestInfo}>
                  Reason: {request.reason}
                </Paragraph>
              </Card.Content>
            </Card>
          ))}
        </Card.Content>
      </Card>
    </View>
  );

  const renderWallet = () => (
    <View style={styles.tabContent}>
      {/* Modern Wallet Card */}
      <Card style={[styles.modernWalletCard, shadows.medium]}>
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.walletGradient}
        >
          <Card.Content style={styles.walletCardContent}>
            <View style={styles.walletHeader}>
              <View style={styles.walletInfo}>
                <Title style={styles.walletLabel}>Total Balance</Title>
                <Title style={styles.walletAmount}>
                  {wallet.balance.toLocaleString()} VND
                </Title>
                <Paragraph style={styles.walletSubtitle}>Available for group expenses</Paragraph>
              </View>
              <View style={styles.walletIcon}>
                <Text style={styles.walletIconText}>💳</Text>
              </View>
            </View>
            
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <View style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Text style={styles.quickActionIconText}>📈</Text>
                </View>
                <Paragraph style={styles.quickActionLabel}>Top Up</Paragraph>
              </View>
              <View style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Text style={styles.quickActionIconText}>⚡</Text>
                </View>
                <Paragraph style={styles.quickActionLabel}>Quick Pay</Paragraph>
              </View>
              <View style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Text style={styles.quickActionIconText}>📊</Text>
                </View>
                <Paragraph style={styles.quickActionLabel}>Analytics</Paragraph>
              </View>
              <View style={styles.quickAction}>
                <View style={styles.quickActionIcon}>
                  <Text style={styles.quickActionIconText}>🔒</Text>
                </View>
                <Paragraph style={styles.quickActionLabel}>Security</Paragraph>
              </View>
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>

      {/* Wallet Stats */}
      <View style={styles.walletStats}>
        <Card style={[styles.statCard, shadows.small]}>
          <Card.Content style={styles.statContent}>
            <Title style={styles.statValue}>
              ₫{wallet.transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </Title>
            <Paragraph style={styles.statLabel}>Total Deposited</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, shadows.small]}>
          <Card.Content style={styles.statContent}>
            <Title style={styles.statValue}>
              ₫{Math.abs(wallet.transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
            </Title>
            <Paragraph style={styles.statLabel}>Total Spent</Paragraph>
          </Card.Content>
        </Card>
        <Card style={[styles.statCard, shadows.small]}>
          <Card.Content style={styles.statContent}>
            <Title style={styles.statValue}>
              {wallet.transactions.length}
            </Title>
            <Paragraph style={styles.statLabel}>Transactions</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.walletActionButtons}>
        <Button 
          mode="contained" 
          style={styles.walletActionButton}
          onPress={handleTopUp}
          icon="plus"
        >
          Top Up Wallet
        </Button>
        <Button 
          mode="outlined" 
          style={styles.walletActionButton}
          onPress={handlePayPenalties}
          icon="cash-multiple"
        >
          Pay Penalties
        </Button>
      </View>

      {/* Transaction History */}
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <View style={styles.transactionsHeader}>
            <Title style={styles.cardTitle}>Recent Transactions</Title>
            <Button mode="text" compact>View All</Button>
          </View>
          {wallet.transactions.slice(0, 5).map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionIconText}>
                  {transaction.amount > 0 ? '💰' : '🛒'}
                </Text>
              </View>
              <View style={styles.transactionInfo}>
                <Paragraph style={styles.transactionType}>{transaction.type}</Paragraph>
                <Paragraph style={styles.transactionDate}>{transaction.date}</Paragraph>
              </View>
              <Paragraph style={[
                styles.transactionAmount,
                { color: transaction.amount > 0 ? colors.success : colors.error }
              ]}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} VND
              </Paragraph>
            </View>
          ))}
        </Card.Content>
      </Card>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Settings</Title>
          
          <Title style={styles.sectionTitle}>Notifications</Title>
          <List.Item
            title="Email Notifications"
            description="Receive email updates about your group"
            right={props => <Switch value={true} onValueChange={() => {}} />}
          />
          <List.Item
            title="Push Notifications"
            description="Receive push notifications on your device"
            right={props => <Switch value={true} onValueChange={() => {}} />}
          />
          <List.Item
            title="Rental Alerts"
            description="Get notified about rental status changes"
            right={props => <Switch value={true} onValueChange={() => {}} />}
          />

          <Divider style={styles.divider} />

          <Title style={styles.sectionTitle}>Privacy</Title>
          <List.Item
            title="Show Profile to Members"
            description="Allow group members to see your profile"
            right={props => <Switch value={true} onValueChange={() => {}} />}
          />
          <List.Item
            title="Allow Direct Messages"
            description="Allow members to send you direct messages"
            right={props => <Switch value={true} onValueChange={() => {}} />}
          />
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
            { key: 'group', label: 'Group', icon: 'account-group' },
            { key: 'kits', label: 'Kits', icon: 'toolbox' },
            { key: 'refunds', label: 'Refunds', icon: 'cash-refund' },
            { key: 'wallet', label: 'Wallet', icon: 'wallet' },
            { key: 'settings', label: 'Settings', icon: 'cog' }
          ].map((tab) => (
            <Button
              key={tab.key}
              mode={activeTab === tab.key ? 'contained' : 'outlined'}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tabButton}
              labelStyle={styles.tabLabel}
              icon={tab.icon}
            >
              {tab.label}
            </Button>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Paragraph style={styles.loadingText}>Loading data...</Paragraph>
          </View>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'group' && renderGroupManagement()}
            {activeTab === 'kits' && renderKitRental()}
            {activeTab === 'refunds' && renderRefundRequests()}
            {activeTab === 'wallet' && renderWallet()}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>Quick Actions</Title>
          <List.Item
            title="Request Kit Rental"
            left={props => <List.Icon {...props} icon="toolbox" />}
            onPress={() => {
              setModalVisible(false);
              router.push('/rental-request');
            }}
          />
          <List.Item
            title="Request Refund"
            left={props => <List.Icon {...props} icon="cash-refund" />}
            onPress={() => {
              setModalVisible(false);
              router.push('/refund-request');
            }}
          />
          <List.Item
            title="Top Up Wallet"
            left={props => <List.Icon {...props} icon="wallet" />}
            onPress={() => {
              setModalVisible(false);
              router.push('/top-up');
            }}
          />
          <Divider />
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
  },
  tabContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
  },
  tabButton: {
    marginRight: spacing.sm,
  },
  tabLabel: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  tabContent: {
    gap: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  groupName: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  groupDetails: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  requestCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  statusChip: {
    height: 32,
  },
  requestInfo: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  // Modern Wallet Styles
  modernWalletCard: {
    marginBottom: spacing.lg,
  },
  walletCardContent: {
    padding: spacing.lg,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    ...typography.bodyMedium,
    color: colors.white,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  walletAmount: {
    ...typography.headlineLarge,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  walletSubtitle: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.8,
  },
  walletIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconText: {
    fontSize: 24,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionIconText: {
    fontSize: 16,
  },
  quickActionLabel: {
    ...typography.bodySmall,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  walletStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  walletActionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  walletActionButton: {
    flex: 1,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  transactionIconText: {
    fontSize: 16,
  },
  
  // Legacy styles (keeping for compatibility)
  walletCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  walletGradient: {
    borderRadius: 16,
  },
  walletTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  walletAmount: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  walletActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  walletButton: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionAmount: {
    ...typography.body2,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 8,
  },
});


