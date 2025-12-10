import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { walletAPI, borrowingGroupAPI, studentGroupAPI, kitAPI, penaltiesAPI, penaltyDetailAPI, walletTransactionAPI } from '../../services/api';
import LecturerLayout from '../../components/LecturerLayout';
import dayjs from 'dayjs';

const LecturerDashboard = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [lecturerGroups, setLecturerGroups] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [kits, setKits] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [penaltyDetails, setPenaltyDetails] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('LecturerDashboard mounted, user:', user);
    loadData();
  }, []);

  const loadData = async () => {
    if (!user || !user.id) {
      console.warn('User or user.id is missing');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading lecturer data for user:', user.id);
      
      // Load wallet
      try {
        const walletResponse = await walletAPI.getMyWallet();
        const walletData = walletResponse?.data || walletResponse || {};
        
        // Fetch transaction history separately
        let transactions = [];
        try {
          const transactionHistoryResponse = await walletTransactionAPI.getHistory();
          console.log('Transaction history response:', transactionHistoryResponse);
          
          // Handle response format - could be array or wrapped in data
          const transactionData = Array.isArray(transactionHistoryResponse) 
            ? transactionHistoryResponse 
            : (transactionHistoryResponse?.data || []);
          
          // Map transactions to expected format
          transactions = transactionData.map(txn => ({
            type: txn.type || txn.transactionType || 'UNKNOWN',
            amount: txn.amount || 0,
            date: txn.createdAt ? dayjs(txn.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
            description: txn.description || '',
            status: txn.status || txn.transactionStatus || 'COMPLETED',
            id: txn.id
          }));
          
          console.log('Mapped transactions:', transactions);
        } catch (txnError) {
          console.error('Error loading transaction history:', txnError);
          transactions = [];
        }
        
        setWallet({
          balance: walletData.balance || 0,
          transactions: transactions
        });
      } catch (error) {
        console.error('Error loading wallet:', error);
        setWallet({ balance: 0, transactions: [] });
      }
      
      // Load all kits
      try {
        const kitsResponse = await kitAPI.getAllKits();
        const kitsData = kitsResponse?.data || kitsResponse || [];
        const mappedKits = kitsData.map(kit => ({
          id: kit.id,
          name: kit.kitName,
          type: kit.type,
          status: kit.status,
          quantityAvailable: kit.quantityAvailable,
        }));
        setKits(mappedKits);
      } catch (error) {
        console.error('Error loading kits:', error);
        setKits([]);
      }
      
      // Load penalties
      try {
        const penaltiesResponse = await penaltiesAPI.getPenByAccount();
        let penaltiesData = [];
        if (Array.isArray(penaltiesResponse)) {
          penaltiesData = penaltiesResponse;
        } else if (penaltiesResponse && penaltiesResponse.data && Array.isArray(penaltiesResponse.data)) {
          penaltiesData = penaltiesResponse.data;
        }
        
        setPenalties(penaltiesData);
        
        // Load penalty details for each penalty
        if (penaltiesData.length > 0) {
          const detailsPromises = penaltiesData.map(async (penalty) => {
            try {
              const detailsResponse = await penaltyDetailAPI.findByPenaltyId(penalty.id);
              let detailsData = [];
              if (Array.isArray(detailsResponse)) {
                detailsData = detailsResponse;
              } else if (detailsResponse && detailsResponse.data && Array.isArray(detailsResponse.data)) {
                detailsData = detailsResponse.data;
              }
              return { penaltyId: penalty.id, details: detailsData };
            } catch (error) {
              console.error(`Error loading penalty details for penalty ${penalty.id}:`, error);
              return { penaltyId: penalty.id, details: [] };
            }
          });
          
          const allDetails = await Promise.all(detailsPromises);
          const detailsMap = {};
          allDetails.forEach(({ penaltyId, details }) => {
            detailsMap[penaltyId] = details;
          });
          setPenaltyDetails(detailsMap);
        }
      } catch (error) {
        console.error('Error loading penalties:', error);
        setPenalties([]);
      }
      
      // Load groups for lecturer
      try {
        const allGroups = await studentGroupAPI.getAll();
        console.log('All groups response:', allGroups);
        
        // Filter groups where lecturer is assigned
        const filteredGroups = allGroups.filter(group => 
          group.lecturerEmail === user.email || 
          group.accountId === user.id
        );
        
        console.log('Filtered lecturer groups:', filteredGroups);
        
        // Load borrowing groups for each lecturer group
        const groupsWithMembers = await Promise.all(
          filteredGroups.map(async (group) => {
            const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(group.id);
            const members = (borrowingGroups || []).map(bg => ({
              id: bg.accountId,
              name: bg.accountName,
              email: bg.accountEmail,
              role: bg.roles,
              isLeader: bg.isLeader === true || bg.isLeader === 'true'
            }));

            // Find leader using isLeader field
            const leaderMember = members.find(member => member.isLeader === true);
            
            return {
              id: group.id,
              name: group.groupName,
              lecturer: group.lecturerEmail,
              lecturerName: group.lecturerName,
              leader: leaderMember ? (leaderMember.name || leaderMember.email || 'N/A') : 'N/A',
              leaderEmail: leaderMember?.email || null,
              leaderId: leaderMember?.id || null,
              members: members,
              status: group.status ? 'active' : 'inactive',
              classId: group.classId
            };
          })
        );
        
        setLecturerGroups(groupsWithMembers);
      } catch (error) {
        console.error('Error loading groups:', error);
        setLecturerGroups([]);
      }
      
      console.log('Lecturer data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onLogout) {
                await onLogout();
              }
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const totalStudents = lecturerGroups.reduce((total, group) => total + (group.members?.length || 0), 0);
  const availableKits = kits.filter(kit => kit.status === 'AVAILABLE').length;
  const unresolvedPenalties = penalties.filter(p => !p.resolved);
  const recentTransactions = wallet.transactions?.slice(0, 5) || [];

  const StatCard = ({ title, value, icon, color, suffix = '' }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          <Icon name={icon} size={28} color={color} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>
            {value?.toLocaleString('vi-VN')}{suffix}
          </Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  console.log('LecturerDashboard: Rendering with stats');

  return (
    <LecturerLayout 
      title="Lecturer Dashboard"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >
                <ScrollView
            style={{ flex: 1, padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Statistics Cards */}
            <View style={styles.statsContainer}>
          <StatCard
            title="My Groups"
            value={lecturerGroups.length}
            icon="group"
            color="#1890ff"
            suffix=" groups"
          />
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon="people"
            color="#52c41a"
            suffix=" students"
          />
          <StatCard
            title="Available Kits"
            value={availableKits}
            icon="build"
            color="#faad14"
            suffix=" kits"
          />
          <StatCard
            title="Wallet Balance"
            value={wallet.balance}
            icon="account-balance-wallet"
            color="#722ed1"
            suffix=" VND"
          />
            </View>

            {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Groups');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="group" size={32} color="#667eea" />
              <Text style={styles.actionText}>Groups</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('KitRental');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="build" size={32} color="#667eea" />
              <Text style={styles.actionText}>Kit Rental</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('ComponentRental');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="settings" size={32} color="#667eea" />
              <Text style={styles.actionText}>Component Rental</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Wallet');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="account-balance-wallet" size={32} color="#667eea" />
              <Text style={styles.actionText}>Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Rentals');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="history" size={32} color="#667eea" />
              <Text style={styles.actionText}>Borrow Status</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                if (navigation) {
                  navigation.navigate('Profile');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="person" size={32} color="#667eea" />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

            {/* My Groups Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Groups</Text>
                {lecturerGroups.length > 0 ? (
                  lecturerGroups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Icon name="group" size={24} color="#667eea" />
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupLeader}>Leader: {group.leader}</Text>
                  </View>
                </View>
                <View style={styles.groupFooter}>
                  <View style={styles.groupBadge}>
                    <Icon name="people" size={16} color="#52c41a" />
                    <Text style={styles.groupBadgeText}>{group.members.length} members</Text>
                        </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: group.status === 'active' ? '#52c41a15' : '#99915' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: group.status === 'active' ? '#52c41a' : '#999' }
                    ]}>
                      {group.status?.toUpperCase() || 'INACTIVE'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No groups assigned yet</Text>
                  </View>
                )}
        </View>

            {/* Recent Transactions Section */}
            {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
                  {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Icon 
                    name={transaction.type === 'TOP_UP' ? 'arrow-upward' : 'arrow-downward'} 
                    size={20} 
                    color={transaction.amount > 0 ? '#52c41a' : '#ff4d4f'} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{transaction.type}</Text>
                  <Text style={styles.activityTime}>{transaction.date}</Text>
                          </View>
                <Text style={[
                  styles.activityAmount,
                            { color: transaction.amount > 0 ? '#52c41a' : '#ff4d4f' }
                          ]}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('vi-VN')} VND
                </Text>
                        </View>
                  ))}
          </View>
            )}

            {/* Penalties Section */}
            {unresolvedPenalties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unresolved Penalties</Text>
                  {unresolvedPenalties.map((penalty) => (
              <View key={penalty.id} style={styles.penaltyCard}>
                        <View style={styles.penaltyHeader}>
                  <View style={styles.penaltyInfo}>
                    <Text style={styles.penaltyTitle}>{penalty.note || 'Penalty Fee'}</Text>
                    <Text style={styles.penaltyDate}>
                      {penalty.takeEffectDate 
                        ? dayjs(penalty.takeEffectDate).format('DD/MM/YYYY HH:mm')
                        : 'N/A'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: penalty.resolved ? '#52c41a15' : '#faad1415' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: penalty.resolved ? '#52c41a' : '#faad14' }
                    ]}>
                      {penalty.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                    </Text>
                  </View>
                </View>
                <View style={styles.penaltyAmountContainer}>
                  <Text style={styles.penaltyAmountLabel}>Amount:</Text>
                  <Text style={styles.penaltyAmountValue}>
                    {penalty.totalAmount ? penalty.totalAmount.toLocaleString('vi-VN') : 0} VND
                  </Text>
                        </View>
                        {penaltyDetails[penalty.id] && penaltyDetails[penalty.id].length > 0 && (
                          <View style={styles.penaltyDetails}>
                    <Text style={styles.penaltyDetailsTitle}>Details:</Text>
                            {penaltyDetails[penalty.id].map((detail, idx) => (
                      <Text key={idx} style={styles.penaltyDetailItem}>
                        • {detail.description || 'N/A'}: {detail.amount ? detail.amount.toLocaleString('vi-VN') : 0} VND
                      </Text>
                            ))}
                          </View>
                        )}
              </View>
                  ))}
          </View>
        )}
      </ScrollView>
    </LecturerLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '48%',
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#667eea',
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  groupLeader: {
    fontSize: 14,
    color: '#666',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupBadgeText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  penaltyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#faad14',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  penaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  penaltyInfo: {
    flex: 1,
  },
  penaltyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  penaltyDate: {
    fontSize: 12,
    color: '#666',
  },
  penaltyAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  penaltyAmountLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  penaltyAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  penaltyDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  penaltyDetailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  penaltyDetailItem: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default LecturerDashboard;
