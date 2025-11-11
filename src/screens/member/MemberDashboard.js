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
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { walletAPI, borrowingGroupAPI, walletTransactionAPI, studentGroupAPI } from '../../services/api';

const MemberDashboard = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    groupMembers: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load wallet
      const walletResponse = await walletAPI.getMyWallet();
      const walletData = walletResponse?.data || walletResponse || {};
      
      // Load transaction count
      let transactions = [];
      try {
        const transactionHistory = await walletTransactionAPI.getHistory();
        transactions = Array.isArray(transactionHistory) 
          ? transactionHistory 
          : (transactionHistory?.data || []);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }

      setWallet({ 
        balance: walletData.balance || 0,
        transactions: transactions
      });

      // Load group info
      if (user?.id) {
        try {
          const borrowingGroups = await borrowingGroupAPI.getByAccountId(user.id);
          if (borrowingGroups && borrowingGroups.length > 0) {
            const memberGroup = borrowingGroups[0];
            const groupId = memberGroup.studentGroupId;
            
            // Get full group details
            const studentGroup = await studentGroupAPI.getById(groupId);
            const allMembers = await borrowingGroupAPI.getByStudentGroupId(groupId);
            
            setGroup({
              id: groupId,
              name: studentGroup?.groupName || memberGroup.studentGroup?.groupName || 'Unknown Group',
              role: memberGroup.roles,
              memberCount: (allMembers || []).length,
              lecturer: studentGroup?.lecturerName || studentGroup?.lecturerEmail || null,
            });
            
            setStats(prev => ({
              ...prev,
              groupMembers: (allMembers || []).length,
            }));
          } else {
            setGroup(null);
          }
        } catch (error) {
          console.error('Error loading group:', error);
          setGroup(null);
        }
      }
      
      setStats(prev => ({
        ...prev,
        totalTransactions: transactions.length,
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    navigation.navigate('Wallet');
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Welcome back!</Text>
            <Text style={styles.headerTitle}>{user?.fullName || user?.email || 'Member'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onLogout}
          >
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIconContainer}>
              <Icon name="account-balance-wallet" size={32} color="#fff" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Wallet Balance</Text>
              <Text style={styles.statValue}>
                {wallet.balance.toLocaleString('vi-VN')} VND
              </Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Icon name="group" size={28} color="#2ecc71" />
            <Text style={styles.statSmallLabel}>My Group</Text>
            <Text style={styles.statSmallValue}>
              {group ? group.name.length > 15 ? group.name.substring(0, 15) + '...' : group.name : 'No Group'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="people" size={28} color="#f39c12" />
            <Text style={styles.statSmallLabel}>Members</Text>
            <Text style={styles.statSmallValue}>{stats.groupMembers || 0}</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="history" size={28} color="#9b59b6" />
            <Text style={styles.statSmallLabel}>Transactions</Text>
            <Text style={styles.statSmallValue}>{stats.totalTransactions}</Text>
          </View>
        </View>

        {/* Group Information Card */}
        {group ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="group" size={24} color="#667eea" />
              <Text style={styles.cardTitle}>Group Information</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Group Name:</Text>
                <Text style={styles.infoValue}>{group.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Your Role:</Text>
                <View style={[styles.badge, group.role === 'LEADER' && styles.badgeLeader]}>
                  <Text style={styles.badgeText}>{group.role || 'MEMBER'}</Text>
                </View>
              </View>
              {group.lecturer && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Lecturer:</Text>
                  <Text style={styles.infoValue}>{group.lecturer}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Members:</Text>
                <Text style={styles.infoValue}>{stats.groupMembers}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.noGroupContainer}>
              <Icon name="group-off" size={48} color="#ddd" />
              <Text style={styles.noGroupText}>You're not in any group yet</Text>
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => navigation.navigate('Groups')}
              >
                <Text style={styles.joinButtonText}>Join or Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        {wallet.transactions && wallet.transactions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="history" size={24} color="#667eea" />
              <Text style={styles.cardTitle}>Recent Transactions</Text>
            </View>
            <View style={styles.transactionsList}>
              {wallet.transactions.slice(0, 3).map((txn, index) => (
                <View key={index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Icon
                      name={txn.type === 'TOP_UP' ? 'add-circle' : 'remove-circle'}
                      size={24}
                      color={txn.type === 'TOP_UP' ? '#2ecc71' : '#e74c3c'}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>
                      {txn.type?.replace(/_/g, ' ') || 'Transaction'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {txn.date || txn.createdAt || 'N/A'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: txn.amount > 0 ? '#2ecc71' : '#e74c3c' }
                    ]}
                  >
                    {txn.amount > 0 ? '+' : ''}
                    {Math.abs(txn.amount || 0).toLocaleString('vi-VN')} VND
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleViewHistory}
            >
              <Text style={styles.viewAllText}>View All Transactions</Text>
              <Icon name="arrow-forward" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewHistory}
          >
            <Icon name="history" size={24} color="#667eea" />
            <Text style={styles.actionButtonText}>Transaction History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardPrimary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statSmallLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statSmallValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  cardBody: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLeader: {
    backgroundColor: '#fff3cd',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
  },
  noGroupContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noGroupText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionsList: {
    marginTop: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginRight: 8,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default MemberDashboard;

