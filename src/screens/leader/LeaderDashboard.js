import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LeaderLayout from '../../components/LeaderLayout';
import { 
  borrowingRequestAPI, 
  walletTransactionAPI, 
  walletAPI 
} from '../../services/api';

const LeaderDashboard = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activeRentals: 0,
    walletBalance: 0,
    pendingRequests: 0,
    totalSpent: 0,
  });
  const [rentalRequests, setRentalRequests] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    console.log('LeaderDashboard mounted, user:', user);
    loadData();
  }, []);

  const loadData = async () => {
    console.log('LeaderDashboard: Loading data...');
    setLoading(true);
    try {
      let loadedRentalRequests = [];
      let walletData = { balance: 0 };
      let transactions = [];

      // Load rental requests
      try {
        if (user?.id) {
          const rentalResponse = await borrowingRequestAPI.getByUser(user.id);
          loadedRentalRequests = Array.isArray(rentalResponse) 
            ? rentalResponse 
            : (rentalResponse?.data || []);
          // Sort by createdAt descending
          loadedRentalRequests.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          console.log('Loaded rental requests:', loadedRentalRequests);
          setRentalRequests(loadedRentalRequests);
        }
      } catch (error) {
        console.error('Error loading rental requests:', error);
      }

      // Load wallet
      try {
        const walletResponse = await walletAPI.getMyWallet();
        walletData = walletResponse?.data || walletResponse || {};
        setWallet({ balance: walletData.balance || 0 });
      } catch (error) {
        console.error('Error loading wallet:', error);
      }

      // Load transactions
      try {
        const transactionsResponse = await walletTransactionAPI.getHistory();
        const transactionsData = Array.isArray(transactionsResponse) 
          ? transactionsResponse 
          : (transactionsResponse?.data || []);
        
        // Map transactions to match expected structure (similar to LeaderPortal.js)
        const mappedTransactions = transactionsData.map(txn => ({
          type: txn.type || txn.transactionType || 'UNKNOWN',
          amount: txn.amount || 0,
          previousBalance: txn.previousBalance || null,
          date: txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('vi-VN') : 'N/A',
          description: txn.description || '',
          status: txn.status || txn.transactionStatus || 'COMPLETED',
          id: txn.id,
          createdAt: txn.createdAt || txn.transactionDate
        }));
        
        // Sort by createdAt descending (newest first)
        mappedTransactions.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        transactions = mappedTransactions;
        setTransactions(mappedTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }

      // Calculate stats
      const activeRentalsCount = loadedRentalRequests.filter(
        req => req.status === 'APPROVED' || req.status === 'BORROWED'
      ).length;
      const pendingRequestsCount = loadedRentalRequests.filter(
        req => req.status === 'PENDING' || req.status === 'PENDING_APPROVAL'
      ).length;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlySpent = transactions
        .filter(txn => {
          const txnDate = new Date(txn.createdAt || txn.transactionDate);
          return txnDate.getMonth() === currentMonth && 
                 txnDate.getFullYear() === currentYear &&
                 txn.amount < 0;
        })
        .reduce((sum, txn) => sum + Math.abs(txn.amount || 0), 0);

      const stats = {
        activeRentals: activeRentalsCount,
        walletBalance: walletData.balance || 0,
        pendingRequests: pendingRequestsCount,
        totalSpent: monthlySpent,
      };
      console.log('LeaderDashboard: Stats calculated:', stats);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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

  console.log('LeaderDashboard: Rendering with stats:', dashboardStats);
  
  return (
    <LeaderLayout 
      title="Leader Dashboard"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Welcome, {user?.fullName || user?.name || 'Leader'}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Manage your group, track rentals, and access your wallet from here.
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Active Rentals"
            value={dashboardStats.activeRentals}
            icon="shopping-cart"
            color="#1890ff"
            suffix=" rentals"
          />
          <StatCard
            title="Wallet Balance"
            value={dashboardStats.walletBalance}
            icon="account-balance-wallet"
            color="#52c41a"
            suffix=" VND"
          />
          <StatCard
            title="Pending Requests"
            value={dashboardStats.pendingRequests}
            icon="schedule"
            color="#faad14"
            suffix=" requests"
          />
          <StatCard
            title="Monthly Spent"
            value={dashboardStats.totalSpent}
            icon="attach-money"
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
                  navigation.navigate('KitRental');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="shopping-cart" size={32} color="#667eea" />
              <Text style={styles.actionText}>Rent Kit</Text>
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
              <Text style={styles.actionText}>Rent Component</Text>
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
                  navigation.navigate('BorrowStatus');
                }
              }}
              activeOpacity={0.7}
            >
              <Icon name="history" size={32} color="#667eea" />
              <Text style={styles.actionText}>My Rentals</Text>
            </TouchableOpacity>
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

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((transaction) => {
            // Determine color based on transaction type (similar to LeaderPortal.js)
            const typeUpper = (transaction.type || '').toUpperCase();
            const isPositiveTransaction = 
              typeUpper === 'TOP_UP' || 
              typeUpper === 'TOPUP' || 
              typeUpper === 'REFUND';
            const isNegativeTransaction = 
              typeUpper === 'RENTAL_FEE' || 
              typeUpper === 'PENALTY_PAYMENT' || 
              typeUpper === 'PENALTY' || 
              typeUpper === 'FINE';
            
            // Use type-based color if available, otherwise fallback to amount-based
            let amountColor = '#595959'; // default gray
            if (isPositiveTransaction) {
              amountColor = '#52c41a'; // green for top-up and refund
            } else if (isNegativeTransaction) {
              amountColor = '#ff4d4f'; // red for rental fee and penalty
            } else {
              // Fallback: use amount sign
              amountColor = transaction.amount > 0 ? '#52c41a' : '#ff4d4f';
            }

            // Get icon name based on type
            let iconName = 'attach-money';
            let iconColor = amountColor;
            if (typeUpper === 'TOP_UP' || typeUpper === 'TOPUP') {
              iconName = 'add-circle';
              iconColor = '#52c41a';
            } else if (typeUpper === 'RENTAL_FEE') {
              iconName = 'shopping-cart';
              iconColor = '#1890ff';
            } else if (typeUpper === 'PENALTY_PAYMENT' || typeUpper === 'PENALTY' || typeUpper === 'FINE') {
              iconName = 'warning';
              iconColor = '#ff4d4f';
            } else if (typeUpper === 'REFUND') {
              iconName = 'undo';
              iconColor = '#722ed1';
            }

            // Get tag color based on type
            let tagColor = '#52c41a';
            let tagBg = '#52c41a15';
            if (typeUpper === 'TOP_UP' || typeUpper === 'TOPUP') {
              tagColor = '#52c41a';
              tagBg = '#52c41a15';
            } else if (typeUpper === 'RENTAL_FEE') {
              tagColor = '#1890ff';
              tagBg = '#1890ff15';
            } else if (typeUpper === 'PENALTY_PAYMENT' || typeUpper === 'PENALTY' || typeUpper === 'FINE') {
              tagColor = '#ff4d4f';
              tagBg = '#ff4d4f15';
            } else if (typeUpper === 'REFUND') {
              tagColor = '#722ed1';
              tagBg = '#722ed115';
            }

            return (
              <View key={transaction.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Icon 
                    name={iconName}
                    size={20} 
                    color={iconColor}
                  />
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.transactionHeader}>
                    <View style={[
                      styles.typeBadge,
                      { backgroundColor: tagBg }
                    ]}>
                      <Text style={[
                        styles.typeText,
                        { color: tagColor }
                      ]}>
                        {transaction.type?.replace(/_/g, ' ') || 'Transaction'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activityText}>
                    {transaction.description || transaction.date || 'N/A'}
                  </Text>
                  <Text style={styles.activityTime}>
                    {transaction.createdAt 
                      ? new Date(transaction.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : transaction.date || 'N/A'}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.amountText,
                    { color: amountColor }
                  ]}>
                    {isPositiveTransaction ? '+' : isNegativeTransaction ? '-' : ''}{Math.abs(transaction.amount || 0)?.toLocaleString('vi-VN')} VND
                  </Text>
                </View>
              </View>
            );
          })}
          {transactions.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent transactions</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LeaderLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
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

export default LeaderDashboard;
