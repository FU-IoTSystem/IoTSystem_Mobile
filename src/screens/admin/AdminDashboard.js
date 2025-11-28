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
import AdminLayout from '../../components/AdminLayout';
import { 
  kitAPI, 
  borrowingRequestAPI, 
  walletTransactionAPI, 
  userAPI 
} from '../../services/api';

const AdminDashboard = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    availableKits: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0,
  });
  const [kits, setKits] = useState([]);
  const [rentalRequests, setRentalRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    console.log('AdminDashboard mounted, user:', user);
    loadData();
  }, []);

  const loadData = async () => {
    console.log('AdminDashboard: Loading data...');
    setLoading(true);
    try {
      let loadedKits = [];
      let loadedUsers = [];
      let loadedRentalRequests = [];
      let loadedTransactions = [];

      // Load kits
      try {
        const kitsResponse = await kitAPI.getAllKits();
        loadedKits = Array.isArray(kitsResponse) 
          ? kitsResponse 
          : (kitsResponse?.data || []);
        setKits(loadedKits);
      } catch (error) {
        console.error('Error loading kits:', error);
      }

      // Load users
      try {
        const usersData = await userAPI.getAllAccounts(0, 100);
        console.log('AdminDashboard - Users response:', usersData);
        loadedUsers = usersData || [];
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }

      // Load rental requests
      try {
        const rentalResponse = await borrowingRequestAPI.getAll();
        loadedRentalRequests = Array.isArray(rentalResponse) 
          ? rentalResponse 
          : (rentalResponse?.data || []);
        setRentalRequests(loadedRentalRequests);
      } catch (error) {
        console.error('Error loading rental requests:', error);
      }

      // Load transactions
      try {
        const transactionsResponse = await walletTransactionAPI.getAll();
        loadedTransactions = Array.isArray(transactionsResponse) 
          ? transactionsResponse 
          : (transactionsResponse?.data || []);
        setTransactions(loadedTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }

      // Calculate stats using loaded data directly
      const availableKitsCount = loadedKits.filter(kit => kit.status === 'AVAILABLE').length;
      const pendingRequestsCount = loadedRentalRequests.filter(
        req => req.status === 'PENDING' || req.status === 'PENDING_APPROVAL'
      ).length;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = loadedTransactions
        .filter(txn => {
          const txnDate = new Date(txn.createdAt || txn.transactionDate);
          return txnDate.getMonth() === currentMonth && 
                 txnDate.getFullYear() === currentYear &&
                 (txn.type === 'RENTAL_FEE' || txn.type === 'PENALTY_PAYMENT');
        })
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);

      const stats = {
        totalUsers: loadedUsers.length,
        availableKits: availableKitsCount,
        pendingApprovals: pendingRequestsCount,
        monthlyRevenue: monthlyRevenue,
      };
      console.log('AdminDashboard: Stats calculated:', stats);
      setSystemStats(stats);
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

  console.log('AdminDashboard: Rendering with stats:', systemStats);
  
  return (
    <AdminLayout 
      title="Admin Dashboard"
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
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Users"
            value={systemStats.totalUsers}
            icon="people"
            color="#1890ff"
            suffix=" users"
          />
          <StatCard
            title="Available Kits"
            value={systemStats.availableKits}
            icon="build"
            color="#52c41a"
            suffix=" kits"
          />
          <StatCard
            title="Pending Approvals"
            value={systemStats.pendingApprovals}
            icon="schedule"
            color="#faad14"
            suffix=" requests"
          />
          <StatCard
            title="Monthly Revenue"
            value={systemStats.monthlyRevenue}
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
              onPress={() => navigation.navigate('Kits')}
              activeOpacity={0.7}
            >
              <Icon name="add-circle-outline" size={32} color="#667eea" />
              <Text style={styles.actionText}>Add Kit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Users')}
              activeOpacity={0.7}
            >
              <Icon name="person-add" size={32} color="#667eea" />
              <Text style={styles.actionText}>Add User</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ScanQR')}
              activeOpacity={0.7}
            >
              <Icon name="qr-code-scanner" size={32} color="#667eea" />
              <Text style={styles.actionText}>Scan QR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Approvals')}
              activeOpacity={0.7}
            >
              <Icon name="check-circle" size={32} color="#667eea" />
              <Text style={styles.actionText}>Approvals</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('LogHistory')}
              activeOpacity={0.7}
            >
              <Icon name="history" size={32} color="#667eea" />
              <Text style={styles.actionText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {rentalRequests.slice(0, 5).map((request) => (
            <View key={request.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon 
                  name={
                    request.status === 'APPROVED' ? 'check-circle' : 
                    request.status === 'REJECTED' ? 'cancel' : 
                    'schedule'
                  } 
                  size={20} 
                  color={
                    request.status === 'APPROVED' ? '#52c41a' : 
                    request.status === 'REJECTED' ? '#ff4d4f' : 
                    '#faad14'
                  } 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  {request.requestedBy?.fullName || 'Unknown'} requested kit
                </Text>
                <Text style={styles.activityTime}>
                  {request.createdAt 
                    ? new Date(request.createdAt).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: 
                  request.status === 'APPROVED' ? '#52c41a15' : 
                  request.status === 'REJECTED' ? '#ff4d4f15' : 
                  '#faad1415'
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: 
                    request.status === 'APPROVED' ? '#52c41a' : 
                    request.status === 'REJECTED' ? '#ff4d4f' : 
                    '#faad14'
                  }
                ]}>
                  {request.status || 'PENDING'}
                </Text>
              </View>
            </View>
          ))}
          {rentalRequests.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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

export default AdminDashboard;
