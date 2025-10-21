import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
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
  Searchbar,
  Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../src/theme';
import { 
  mockKits, 
  mockGroups, 
  mockWallet,
  mockLecturerFines,
  mockLecturerRefunds,
  mockLecturerBorrowStatus
} from '../mocks';

export default function LecturerScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [kits, setKits] = useState([]);
  const [lecturerGroups, setLecturerGroups] = useState([]);
  const [wallet, setWallet] = useState({});
  const [refundRequests, setRefundRequests] = useState([]);
  const [lecturerFines, setLecturerFines] = useState([]);
  const [lecturerRefunds, setLecturerRefunds] = useState([]);
  const [borrowStatus, setBorrowStatus] = useState([]);
  
  // Modal states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);
  const [showKitDetailModal, setShowKitDetailModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedKit, setSelectedKit] = useState(null);
  
  // Form states
  const [refundForm, setRefundForm] = useState({
    kitName: '',
    refundDate: '',
    reason: '',
    purpose: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load comprehensive lecturer data
      setKits(mockKits);
      setWallet(mockWallet);
      
      // Find lecturer groups (assuming current user is a lecturer)
      const currentLecturerEmail = 'iot.specialist@fpt.edu.vn'; // Default lecturer
      const foundGroups = mockGroups.filter(g => g.lecturer === currentLecturerEmail);
      setLecturerGroups(foundGroups);
      
      // Load lecturer-specific data
      const lecturerFinesData = mockLecturerFines.filter(fine => fine.lecturerEmail === currentLecturerEmail);
      const lecturerRefundsData = mockLecturerRefunds.filter(refund => refund.lecturerEmail === currentLecturerEmail);
      const borrowStatusData = mockLecturerBorrowStatus.filter(borrow => borrow.lecturerEmail === currentLecturerEmail);
      
      setLecturerFines(lecturerFinesData);
      setLecturerRefunds(lecturerRefundsData);
      setBorrowStatus(borrowStatusData);
      
      // Initialize refund requests
      setRefundRequests([
        {
          id: 1,
          kitName: 'Raspberry Pi Kit',
          requester: currentLecturerEmail,
          requestDate: '2024-01-10',
          refundDate: '2024-01-12',
          status: 'pending_approval',
          reason: 'Kit malfunction',
          purpose: 'Project completion'
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

  const handleTopUp = () => {
    setWallet(prev => ({
      ...prev,
      balance: prev.balance + 100000,
      transactions: [...prev.transactions, {
        type: 'Top-up',
        amount: 100000,
        date: new Date().toISOString().split('T')[0]
      }]
    }));
    Alert.alert('Success', 'Top-up successful!');
  };

  const handleRentKit = (kit) => {
    setSelectedKit(kit);
    setShowKitDetailModal(true);
  };

  const handleViewGroupDetails = (group) => {
    setSelectedGroup(group);
    setShowGroupDetailModal(true);
  };

  const handleNewRefund = () => {
    setShowRefundModal(true);
  };

  const handleRefundSubmit = () => {
    const newRefund = {
      id: Date.now(),
      kitName: refundForm.kitName,
      requester: lecturerProfile?.email,
      requestDate: new Date().toISOString().split('T')[0],
      refundDate: refundForm.refundDate,
      status: 'pending_approval',
      reason: refundForm.reason,
      purpose: refundForm.purpose
    };
    
    setRefundRequests(prev => [...prev, newRefund]);
    setShowRefundModal(false);
    setRefundForm({ kitName: '', refundDate: '', reason: '', purpose: '' });
    Alert.alert('Success', 'Refund request submitted successfully!');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'approved':
      case 'active':
        return colors.success;
      case 'pending_approval':
      case 'pending':
        return colors.warning;
      case 'rejected':
      case 'damaged':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderDashboard = () => {
    const totalStudents = lecturerGroups.reduce((total, group) => total + group.members.length + 1, 0);
    const availableKits = (kits || []).filter(kit => kit.status === 'AVAILABLE').length;
    const pendingRefunds = (refundRequests || []).filter(r => r.status === 'pending_approval').length;
    const totalFines = lecturerFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    const totalRefunds = lecturerRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0);

    return (
      <View style={styles.tabContent}>
        {/* Android-Style Welcome Header */}
        <Card style={[styles.androidWelcomeCard, shadows.medium]}>
          <Card.Content style={styles.androidWelcomeContent}>
            <View style={styles.androidWelcomeHeader}>
              <View style={styles.androidWelcomeText}>
                <Text style={styles.androidWelcomeTitle}>Welcome back, Lecturer! 👨‍🏫</Text>
                <Text style={styles.androidWelcomeSubtitle}>
                  Here's your academic overview for today
                </Text>
              </View>
              <View style={styles.androidWelcomeIcon}>
                <Text style={styles.androidWelcomeIconText}>📚</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Android-Style Statistics Cards */}
        <View style={styles.androidStatsGrid}>
          <Card style={[styles.androidStatCard, shadows.small]} onPress={() => setActiveTab('groups')}>
            <Card.Content style={styles.androidStatContent}>
              <View style={styles.androidStatHeader}>
                <View style={styles.androidStatInfo}>
                  <Text style={styles.androidStatNumber}>{lecturerGroups.length}</Text>
                  <Text style={styles.androidStatLabel}>My Groups</Text>
                </View>
                <View style={[styles.androidStatIcon, { backgroundColor: colors.primary }]}>
                  <Text style={styles.androidStatIconText}>👥</Text>
                </View>
              </View>
              <Text style={styles.androidStatSubtext}>
                {totalStudents} total students
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.androidStatCard, shadows.small]} onPress={() => setActiveTab('kits')}>
            <Card.Content style={styles.androidStatContent}>
              <View style={styles.androidStatHeader}>
                <View style={styles.androidStatInfo}>
                  <Text style={styles.androidStatNumber}>{availableKits}</Text>
                  <Text style={styles.androidStatLabel}>Available Kits</Text>
                </View>
                <View style={[styles.androidStatIcon, { backgroundColor: colors.info }]}>
                  <Text style={styles.androidStatIconText}>🔧</Text>
                </View>
              </View>
              <Text style={styles.androidStatSubtext}>
                Ready for rental
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.androidStatCard, shadows.small]} onPress={() => setActiveTab('wallet')}>
            <Card.Content style={styles.androidStatContent}>
              <View style={styles.androidStatHeader}>
                <View style={styles.androidStatInfo}>
                  <Text style={styles.androidStatNumber}>{wallet.balance?.toLocaleString() || '0'}</Text>
                  <Text style={styles.androidStatLabel}>Wallet Balance</Text>
                </View>
                <View style={[styles.androidStatIcon, { backgroundColor: colors.success }]}>
                  <Text style={styles.androidStatIconText}>💰</Text>
                </View>
              </View>
              <Text style={styles.androidStatSubtext}>
                VND
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.androidStatCard, shadows.small]} onPress={() => setActiveTab('fines-refunds')}>
            <Card.Content style={styles.androidStatContent}>
              <View style={styles.androidStatHeader}>
                <View style={styles.androidStatInfo}>
                  <Text style={styles.androidStatNumber}>{pendingRefunds}</Text>
                  <Text style={styles.androidStatLabel}>Pending Refunds</Text>
                </View>
                <View style={[styles.androidStatIcon, { backgroundColor: colors.warning }]}>
                  <Text style={styles.androidStatIconText}>⏳</Text>
                </View>
              </View>
              <Text style={styles.androidStatSubtext}>
                Need approval
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Android-Style Recent Groups */}
        <Card style={[styles.androidCard, shadows.medium]}>
          <Card.Content>
            <View style={styles.androidCardHeader}>
              <Text style={styles.androidCardTitle}>My Groups</Text>
              <Button 
                mode="text" 
                compact
                onPress={() => setActiveTab('groups')}
                textColor={colors.primary}
              >
                View All
              </Button>
            </View>
            {lecturerGroups.length > 0 ? (
              <View style={styles.androidGroupsList}>
                {lecturerGroups.slice(0, 3).map((group) => (
                  <Card key={group.id} style={[styles.androidGroupCard, shadows.small]} onPress={() => handleViewGroupDetails(group)}>
                    <Card.Content style={styles.androidGroupContent}>
                      <View style={styles.androidGroupHeader}>
                        <View style={styles.androidGroupInfo}>
                          <Text style={styles.androidGroupName}>{group.name}</Text>
                          <Text style={styles.androidGroupDetails}>
                            Leader: {group.leader} • Members: {group.members.length + 1}
                          </Text>
                        </View>
                        <View style={styles.androidGroupIcon}>
                          <Text style={styles.androidGroupIconText}>🎓</Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ) : (
              <View style={styles.androidEmptyState}>
                <Text style={styles.androidEmptyStateIcon}>👥</Text>
                <Text style={styles.androidEmptyStateTitle}>No Groups Assigned</Text>
                <Text style={styles.androidEmptyStateText}>You haven't been assigned to any groups yet.</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Transactions */}
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Recent Transactions</Title>
            {wallet.transactions?.length > 0 ? (
              <View style={styles.transactionsList}>
                {wallet.transactions.slice(0, 3).map((transaction, index) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionType}>{transaction.type}</Text>
                      <Text style={styles.transactionDate}>{transaction.date}</Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      {transaction.amount.toLocaleString()} VND
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Paragraph style={styles.emptyText}>No transactions yet</Paragraph>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderGroupsManagement = () => {
    const filteredGroups = (lecturerGroups || []).filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.leader.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <Searchbar
          placeholder="Search groups..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        {/* Android-Style Groups Management */}
        <View style={styles.androidGroupsContainer}>
          {filteredGroups.length > 0 ? (
            <View style={styles.androidGroupsGrid}>
              {filteredGroups.map((group) => (
                <Card key={group.id} style={[styles.androidGroupManagementCard, shadows.medium]} onPress={() => handleViewGroupDetails(group)}>
                  <Card.Content style={styles.androidGroupManagementContent}>
                    <View style={styles.androidGroupManagementHeader}>
                      <View style={styles.androidGroupManagementInfo}>
                        <Text style={styles.androidGroupManagementName}>{group.name}</Text>
                        <View style={styles.androidGroupManagementStatus}>
                          <View style={styles.androidStatusDot} />
                          <Text style={styles.androidStatusText}>Active</Text>
                        </View>
                      </View>
                      <View style={styles.androidGroupManagementIcon}>
                        <Text style={styles.androidGroupManagementIconText}>🎓</Text>
                      </View>
                    </View>
                    
                    <View style={styles.androidGroupManagementStats}>
                      <View style={styles.androidGroupManagementStat}>
                        <Text style={styles.androidGroupManagementStatNumber}>{group.members.length + 1}</Text>
                        <Text style={styles.androidGroupManagementStatLabel}>Members</Text>
                      </View>
                      <View style={styles.androidGroupManagementStat}>
                        <Text style={styles.androidGroupManagementStatNumber}>3</Text>
                        <Text style={styles.androidGroupManagementStatLabel}>Projects</Text>
                      </View>
                      <View style={styles.androidGroupManagementStat}>
                        <Text style={styles.androidGroupManagementStatNumber}>85%</Text>
                        <Text style={styles.androidGroupManagementStatLabel}>Progress</Text>
                      </View>
                    </View>
                    
                    <View style={styles.androidGroupManagementLeader}>
                      <View style={styles.androidGroupManagementLeaderIcon}>
                        <Text style={styles.androidGroupManagementLeaderIconText}>👑</Text>
                      </View>
                      <View style={styles.androidGroupManagementLeaderInfo}>
                        <Text style={styles.androidGroupManagementLeaderLabel}>Group Leader</Text>
                        <Text style={styles.androidGroupManagementLeaderName}>{group.leader}</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : (
            <Card style={[styles.androidEmptyStateCard, shadows.medium]}>
              <Card.Content style={styles.androidEmptyStateContent}>
                <Text style={styles.androidEmptyStateIcon}>👥</Text>
                <Text style={styles.androidEmptyStateTitle}>No Groups Found</Text>
                <Text style={styles.androidEmptyStateText}>
                  {searchQuery ? 'No groups match your search criteria.' : 'You are not assigned to any groups yet.'}
                </Text>
              </Card.Content>
            </Card>
          )}
        </View>
      </View>
    );
  };

  const renderKitRental = () => {
    const availableKits = (kits || []).filter(kit => kit.status === 'AVAILABLE');
    const filteredKits = availableKits.filter(kit =>
      kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
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
                <DataTable.Title>Quantity</DataTable.Title>
                <DataTable.Title>Price</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredKits.map((kit) => (
                <DataTable.Row key={kit.id}>
                  <DataTable.Cell>{kit.name}</DataTable.Cell>
                  <DataTable.Cell>{kit.category}</DataTable.Cell>
                  <DataTable.Cell>{kit.quantity}</DataTable.Cell>
                  <DataTable.Cell>
                    {kit.price ? `${kit.price.toLocaleString()} VND` : 'N/A'}
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.kitActions}>
                      <Button 
                        mode="contained" 
                        compact
                        onPress={() => handleRentKit(kit)}
                      >
                        Rent
                      </Button>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderBorrowStatus = () => {
    const filteredBorrows = (borrowStatus || []).filter(borrow =>
      borrow.kitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      borrow.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <Searchbar
          placeholder="Search borrows..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Borrow Status</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Kit Name</DataTable.Title>
                <DataTable.Title>Borrow Date</DataTable.Title>
                <DataTable.Title>Return Date</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title>Purpose</DataTable.Title>
              </DataTable.Header>

              {filteredBorrows.map((borrow) => (
                <DataTable.Row key={borrow.id}>
                  <DataTable.Cell>{borrow.kitName}</DataTable.Cell>
                  <DataTable.Cell>{formatDate(borrow.borrowDate)}</DataTable.Cell>
                  <DataTable.Cell>{formatDate(borrow.returnDate)}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip 
                      mode="outlined" 
                      style={[
                        styles.statusChip,
                        { 
                          borderColor: borrow.status === 'borrowed' ? colors.warning : colors.success 
                        }
                      ]}
                      textStyle={{ 
                        color: borrow.status === 'borrowed' ? colors.warning : colors.success 
                      }}
                    >
                      {borrow.status.toUpperCase()}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell>{borrow.purpose}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderFinesRefunds = () => {
    const filteredFines = (lecturerFines || []).filter(fine =>
      fine.kitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRefunds = (lecturerRefunds || []).filter(refund =>
      refund.kitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <Searchbar
          placeholder="Search fines and refunds..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        {/* Fines Section */}
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Fines</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Kit Name</DataTable.Title>
                <DataTable.Title>Amount</DataTable.Title>
                <DataTable.Title>Reason</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
              </DataTable.Header>

              {filteredFines.map((fine) => (
                <DataTable.Row key={fine.id}>
                  <DataTable.Cell>{fine.kitName}</DataTable.Cell>
                  <DataTable.Cell>{fine.fineAmount.toLocaleString()} VND</DataTable.Cell>
                  <DataTable.Cell>{fine.reason}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip 
                      mode="outlined" 
                      style={[
                        styles.statusChip,
                        { 
                          borderColor: fine.status === 'pending' ? colors.warning : colors.success 
                        }
                      ]}
                      textStyle={{ 
                        color: fine.status === 'pending' ? colors.warning : colors.success 
                      }}
                    >
                      {fine.status.toUpperCase()}
                    </Chip>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>

        {/* Refunds Section */}
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Refunds</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Kit Name</DataTable.Title>
                <DataTable.Title>Amount</DataTable.Title>
                <DataTable.Title>Reason</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
              </DataTable.Header>

              {filteredRefunds.map((refund) => (
                <DataTable.Row key={refund.id}>
                  <DataTable.Cell>{refund.kitName}</DataTable.Cell>
                  <DataTable.Cell>{refund.refundAmount.toLocaleString()} VND</DataTable.Cell>
                  <DataTable.Cell>{refund.reason}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip 
                      mode="outlined" 
                      style={[
                        styles.statusChip,
                        { 
                          borderColor: refund.status === 'pending' ? colors.warning : 
                                      refund.status === 'approved' ? colors.success : colors.error 
                        }
                      ]}
                      textStyle={{ 
                        color: refund.status === 'pending' ? colors.warning : 
                               refund.status === 'approved' ? colors.success : colors.error 
                      }}
                    >
                      {refund.status.toUpperCase()}
                    </Chip>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderRefundRequests = () => {
    const filteredRefunds = (refundRequests || []).filter(refund =>
      refund.kitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.tabContent}>
        <View style={styles.refundHeader}>
          <Searchbar
            placeholder="Search refunds..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { flex: 1 }]}
          />
          <Button 
            mode="contained" 
            icon="plus"
            onPress={handleNewRefund}
            style={styles.newRefundButton}
          >
            New Request
          </Button>
        </View>
        
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Refund Requests</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Kit Name</DataTable.Title>
                <DataTable.Title>Request Date</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredRefunds.map((refund) => (
                <DataTable.Row key={refund.id}>
                  <DataTable.Cell>{refund.kitName}</DataTable.Cell>
                  <DataTable.Cell>{formatDate(refund.requestDate)}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip 
                      mode="outlined" 
                      style={[
                        styles.statusChip,
                        { borderColor: getStatusColor(refund.status) }
                      ]}
                      textStyle={{ color: getStatusColor(refund.status) }}
                    >
                      {refund.status.replace('_', ' ').toUpperCase()}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Button mode="outlined" compact>Details</Button>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderWalletManagement = () => {
    return (
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
                    {wallet.balance?.toLocaleString() || '0'} VND
                  </Title>
                  <Paragraph style={styles.walletSubtitle}>Available for kit rentals</Paragraph>
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
                ₫{wallet.transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString() || '0'}
              </Title>
              <Paragraph style={styles.statLabel}>Total Deposited</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, shadows.small]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statValue}>
                ₫{Math.abs(wallet.transactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)).toLocaleString() || '0'}
              </Title>
              <Paragraph style={styles.statLabel}>Total Spent</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, shadows.small]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statValue}>
                {wallet.transactions?.length || 0}
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
            onPress={() => router.push('/top-up')}
            icon="cash-multiple"
          >
            Manage Wallet
          </Button>
        </View>

        {/* Transaction History */}
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <View style={styles.transactionsHeader}>
              <Title style={styles.cardTitle}>Recent Transactions</Title>
              <Button mode="text" compact>View All</Button>
            </View>
            {wallet.transactions?.length > 0 ? (
              wallet.transactions.slice(0, 5).map((transaction, index) => (
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
              ))
            ) : (
              <Paragraph style={styles.emptyText}>No transactions yet</Paragraph>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderSettings = () => {
    return (
      <View style={styles.tabContent}>
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Notifications</Title>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Switch value={true} onValueChange={() => {}} />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Switch value={true} onValueChange={() => {}} />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Group Updates</Text>
              <Switch value={true} onValueChange={() => {}} />
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Privacy</Title>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Show Profile to Students</Text>
              <Switch value={true} onValueChange={() => {}} />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Allow Direct Messages</Text>
              <Switch value={true} onValueChange={() => {}} />
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.androidTabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.androidTabScroll}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
            { key: 'groups', label: 'My Groups', icon: 'account-group' },
            { key: 'kits', label: 'Kit Rental', icon: 'toolbox' },
            { key: 'borrow-status', label: 'Borrow Status', icon: 'shopping' },
            { key: 'fines-refunds', label: 'Fines & Refunds', icon: 'currency-usd' },
            { key: 'refunds', label: 'Refund Requests', icon: 'undo' },
            { key: 'wallet', label: 'Wallet', icon: 'wallet' },
            { key: 'settings', label: 'Settings', icon: 'cog' }
          ].map((tab) => (
            <Button
              key={tab.key}
              mode={activeTab === tab.key ? 'contained' : 'outlined'}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.androidTabButton,
                activeTab === tab.key && styles.androidTabButtonActive
              ]}
              labelStyle={[
                styles.androidTabLabel,
                activeTab === tab.key && styles.androidTabLabelActive
              ]}
              icon={tab.icon}
              buttonColor={activeTab === tab.key ? colors.primary : 'transparent'}
              textColor={activeTab === tab.key ? colors.surface : colors.primary}
              rippleColor={colors.primary + '20'}
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
            {activeTab === 'groups' && renderGroupsManagement()}
            {activeTab === 'kits' && renderKitRental()}
            {activeTab === 'borrow-status' && renderBorrowStatus()}
            {activeTab === 'fines-refunds' && renderFinesRefunds()}
            {activeTab === 'refunds' && renderRefundRequests()}
            {activeTab === 'wallet' && renderWalletManagement()}
            {activeTab === 'settings' && renderSettings()}
          </>
        )}
      </ScrollView>

      {/* New Refund Request Modal */}
      <Portal>
        <Modal
          visible={showRefundModal}
          onDismiss={() => setShowRefundModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>New Refund Request</Title>
          <TextInput
            label="Kit Name"
            value={refundForm.kitName}
            onChangeText={(text) => setRefundForm(prev => ({ ...prev, kitName: text }))}
            style={styles.modalInput}
          />
          <TextInput
            label="Refund Date"
            value={refundForm.refundDate}
            onChangeText={(text) => setRefundForm(prev => ({ ...prev, refundDate: text }))}
            style={styles.modalInput}
            placeholder="YYYY-MM-DD"
          />
          <TextInput
            label="Reason for Refund"
            value={refundForm.reason}
            onChangeText={(text) => setRefundForm(prev => ({ ...prev, reason: text }))}
            style={styles.modalInput}
            multiline
            numberOfLines={3}
          />
          <TextInput
            label="Purpose"
            value={refundForm.purpose}
            onChangeText={(text) => setRefundForm(prev => ({ ...prev, purpose: text }))}
            style={styles.modalInput}
            multiline
            numberOfLines={2}
          />
          <View style={styles.modalActions}>
            <Button onPress={() => setShowRefundModal(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleRefundSubmit}>Submit Request</Button>
          </View>
        </Modal>
      </Portal>

      {/* Group Detail Modal */}
      <Portal>
        <Modal
          visible={showGroupDetailModal}
          onDismiss={() => setShowGroupDetailModal(false)}
          contentContainerStyle={styles.modal}
        >
          {selectedGroup && (
            <>
              <Title>Group Details</Title>
              <View style={styles.groupDetailContent}>
                <Text style={styles.groupDetailName}>{selectedGroup.name}</Text>
                <Text style={styles.groupDetailId}>Group ID: {selectedGroup.id}</Text>
                
                <View style={styles.groupDetailSection}>
                  <Text style={styles.groupDetailLabel}>Leader:</Text>
                  <Chip mode="outlined" style={styles.groupDetailChip}>
                    {selectedGroup.leader}
                  </Chip>
                </View>
                
                <View style={styles.groupDetailSection}>
                  <Text style={styles.groupDetailLabel}>Total Members:</Text>
                  <Text style={styles.groupDetailValue}>{selectedGroup.members.length + 1}</Text>
                </View>
                
                <View style={styles.groupDetailSection}>
                  <Text style={styles.groupDetailLabel}>Members:</Text>
                  <View style={styles.groupMembersList}>
                    {selectedGroup.members.map((member, index) => (
                      <Chip key={index} mode="outlined" style={styles.memberChip}>
                        {member}
                      </Chip>
                    ))}
                  </View>
                </View>
              </View>
              <Button onPress={() => setShowGroupDetailModal(false)}>Close</Button>
            </>
          )}
        </Modal>
      </Portal>

      {/* Kit Detail Modal */}
      <Portal>
        <Modal
          visible={showKitDetailModal}
          onDismiss={() => setShowKitDetailModal(false)}
          contentContainerStyle={styles.modal}
        >
          {selectedKit && (
            <>
              <Title>Kit Details</Title>
              <View style={styles.kitDetailContent}>
                <Text style={styles.kitDetailName}>{selectedKit.name}</Text>
                <Text style={styles.kitDetailCategory}>{selectedKit.category}</Text>
                
                <View style={styles.kitDetailSection}>
                  <Text style={styles.kitDetailLabel}>Quantity:</Text>
                  <Text style={styles.kitDetailValue}>{selectedKit.quantity}</Text>
                </View>
                
                <View style={styles.kitDetailSection}>
                  <Text style={styles.kitDetailLabel}>Price:</Text>
                  <Text style={styles.kitDetailValue}>
                    {selectedKit.price ? `${selectedKit.price.toLocaleString()} VND` : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.kitDetailSection}>
                  <Text style={styles.kitDetailLabel}>Location:</Text>
                  <Text style={styles.kitDetailValue}>{selectedKit.location}</Text>
                </View>
              </View>
              <View style={styles.modalActions}>
                <Button onPress={() => setShowKitDetailModal(false)}>Close</Button>
                <Button mode="contained">Rent This Kit</Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Android-Specific Styles
  androidWelcomeCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  androidWelcomeContent: {
    padding: spacing.xl,
  },
  androidWelcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  androidWelcomeText: {
    flex: 1,
  },
  androidWelcomeTitle: {
    ...typography.headlineMedium,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  androidWelcomeSubtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  androidWelcomeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.lg,
    elevation: 2,
  },
  androidWelcomeIconText: {
    fontSize: 28,
  },
  androidStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  androidStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 1,
  },
  androidStatContent: {
    padding: spacing.lg,
  },
  androidStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  androidStatInfo: {
    flex: 1,
  },
  androidStatNumber: {
    ...typography.headlineSmall,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  androidStatLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  androidStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  androidStatIconText: {
    fontSize: 20,
  },
  androidStatSubtext: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
  androidTabContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    elevation: 2,
  },
  androidTabScroll: {
    paddingHorizontal: spacing.md,
  },
  androidTabButton: {
    marginRight: spacing.sm,
    borderRadius: 20,
    minHeight: 40,
    elevation: 0,
  },
  androidTabButtonActive: {
    elevation: 2,
  },
  androidTabLabel: {
    ...typography.labelLarge,
  },
  androidTabLabelActive: {
    fontWeight: '600',
  },
  androidCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  androidCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  androidCardTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
  },
  androidGroupsList: {
    gap: spacing.md,
  },
  androidGroupCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    elevation: 1,
  },
  androidGroupContent: {
    padding: spacing.md,
  },
  androidGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  androidGroupInfo: {
    flex: 1,
  },
  androidGroupName: {
    ...typography.titleMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  androidGroupDetails: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  androidGroupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  androidGroupIconText: {
    fontSize: 18,
  },
  androidEmptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  androidEmptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  androidEmptyStateTitle: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  androidEmptyStateText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  androidGroupsContainer: {
    gap: spacing.md,
  },
  androidGroupsGrid: {
    gap: spacing.md,
  },
  androidGroupManagementCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 2,
  },
  androidGroupManagementContent: {
    padding: spacing.lg,
  },
  androidGroupManagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  androidGroupManagementInfo: {
    flex: 1,
  },
  androidGroupManagementName: {
    ...typography.titleLarge,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  androidGroupManagementStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  androidStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  androidStatusText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  androidGroupManagementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  androidGroupManagementIconText: {
    fontSize: 24,
  },
  androidGroupManagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  androidGroupManagementStat: {
    alignItems: 'center',
    flex: 1,
  },
  androidGroupManagementStatNumber: {
    ...typography.titleMedium,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  androidGroupManagementStatLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  androidGroupManagementLeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
  },
  androidGroupManagementLeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  androidGroupManagementLeaderIconText: {
    fontSize: 18,
  },
  androidGroupManagementLeaderInfo: {
    flex: 1,
  },
  androidGroupManagementLeaderLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  androidGroupManagementLeaderName: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  androidEmptyStateCard: {
    backgroundColor: colors.surface,
  },
  androidEmptyStateContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  
  // Legacy styles
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
  welcomeCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  welcomeGradient: {
    borderRadius: 16,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body2,
    color: 'rgba(255,255,255,0.8)',
  },
  welcomeIcon: {
    marginLeft: spacing.md,
  },
  emoji: {
    fontSize: 48,
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
  statGradient: {
    borderRadius: 16,
  },
  statContent: {
    paddingVertical: spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: 'rgba(255,255,255,0.8)',
  },
  statIcon: {
    fontSize: 32,
    opacity: 0.8,
  },
  statSubtext: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
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
  searchBar: {
    marginBottom: spacing.md,
  },
  statusChip: {
    height: 32,
  },
  emptyText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  groupsList: {
    gap: spacing.sm,
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  groupDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionsList: {
    gap: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text,
  },
  transactionDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  transactionAmount: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.primary,
  },
  groupsGrid: {
    gap: spacing.md,
  },
  groupCard: {
    backgroundColor: colors.surface,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  groupCardName: {
    ...typography.h5,
    color: colors.text,
    fontWeight: '600',
  },
  groupStatusChip: {
    height: 24,
  },
  groupCardDetails: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  groupCardLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  groupCardValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
  },
  groupMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  memberChip: {
    height: 24,
  },
  groupActionButton: {
    marginTop: spacing.sm,
  },
  kitActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  newRefundButton: {
    marginLeft: spacing.sm,
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
  },
  topUpButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    ...typography.body1,
    color: colors.text,
  },
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 8,
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  groupDetailContent: {
    marginBottom: spacing.lg,
  },
  groupDetailName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  groupDetailId: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  groupDetailSection: {
    marginBottom: spacing.md,
  },
  groupDetailLabel: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  groupDetailValue: {
    ...typography.body1,
    color: colors.text,
  },
  groupDetailChip: {
    alignSelf: 'flex-start',
  },
  groupMembersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  kitDetailContent: {
    marginBottom: spacing.lg,
  },
  kitDetailName: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  kitDetailCategory: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  kitDetailSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  kitDetailLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  kitDetailValue: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '500',
  },
});