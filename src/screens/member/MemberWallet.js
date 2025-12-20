import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import MemberLayout from '../../components/MemberLayout';
import { walletAPI, walletTransactionAPI } from '../../services/api';
import dayjs from 'dayjs';

const MemberWallet = ({ user, navigation, onLogout }) => {
  const [wallet, setWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load wallet
      const walletResponse = await walletAPI.getMyWallet();
      const walletData = walletResponse?.data || walletResponse || {};
      setWallet({ balance: walletData.balance || 0 });

      // Load transactions
      const transactionHistory = await walletTransactionAPI.getHistory();
      const formattedTransactions = (transactionHistory || []).map(txn => ({
        id: txn.id,
        type: txn.type || txn.transactionType || 'UNKNOWN',
        amount: txn.amount || 0,
        description: txn.description || '',
        date: txn.createdAt ? dayjs(txn.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
        status: txn.status || 'COMPLETED',
      }));
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleTopUp = () => {
    if (navigation) {
      navigation.navigate('TopUp');
    } else {
      Alert.alert('Info', 'Top up functionality coming soon');
    }
  };

  const handleTransfer = () => {
    if (navigation) {
      navigation.navigate('Transfer');
    } else {
      Alert.alert('Info', 'Transfer functionality coming soon');
    }
  };

  const handlePayPenalties = () => {
    if (navigation) {
      navigation.navigate('PenaltyPayment');
    } else {
      Alert.alert('Info', 'Penalty payment functionality coming soon');
    }
  };

  const getTransactionTypeInfo = (type) => {
    const upperType = (type || '').toUpperCase();
    const displayLabel = upperType ? upperType.replace(/_/g, ' ') : 'TRANSACTION';
    switch (upperType) {
      case 'TOP_UP':
      case 'TOPUP':
        return { icon: 'add-circle', color: '#52c41a', label: displayLabel, amountColor: '#52c41a' };
      case 'RENTAL_FEE':
        // Match dashboard UI: blue icon/tag, red amount
        return { icon: 'shopping-cart', color: '#1890ff', label: displayLabel, amountColor: '#ff4d4f' };
      case 'PENALTY_PAYMENT':
      case 'PENALTY':
      case 'FINE':
        return { icon: 'warning', color: '#ff4d4f', label: displayLabel, amountColor: '#ff4d4f' };
      case 'REFUND':
        // Match dashboard UI: purple icon/tag, green amount
        return { icon: 'undo', color: '#722ed1', label: displayLabel, amountColor: '#52c41a' };
      default:
        // Generic payment icon to align with dashboard/admin default transaction icon
        return { icon: 'payment', color: '#666', label: displayLabel, amountColor: '#666' };
    }
  };

  const renderTransaction = ({ item }) => {
    const typeInfo = getTransactionTypeInfo(item.type);
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${typeInfo.color}15` }]}>
            <Icon 
              name={typeInfo.icon} 
              size={24} 
              color={typeInfo.color}
            />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionType}>{typeInfo.label}</Text>
            <Text style={styles.transactionDescription}>{item.description || 'N/A'}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text
              style={[
                styles.amountText,
                { color: typeInfo.amountColor },
              ]}
            >
              {typeInfo.amountColor === '#ff4d4f' ? '-' : (item.amount > 0 ? '+' : '-')}
              {Math.abs(item.amount).toLocaleString('vi-VN')} VND
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'COMPLETED' || item.status === 'SUCCESS' ? '#52c41a15' : '#faad1415' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.status === 'COMPLETED' || item.status === 'SUCCESS' ? '#52c41a' : '#faad14' }
              ]}>
                {item.status === 'COMPLETED' || item.status === 'SUCCESS' ? 'Completed' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

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

  return (
    <MemberLayout 
      title="My Wallet"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {wallet.balance.toLocaleString('vi-VN')} VND
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.topUpButton]}
              onPress={handleTopUp}
            >
              <Icon name="add-circle" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.transferButton]}
              onPress={handleTransfer}
            >
              <Icon name="swap-horiz" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.penaltyButton]}
              onPress={handlePayPenalties}
            >
              <Icon name="warning" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Pay Penalties</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.transactionsSection}>
              {transactions.length > 0 ? (
                <FlatList
                  data={transactions}
                  renderItem={renderTransaction}
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Icon name="history" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No transactions yet</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </MemberLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  balanceCard: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topUpButton: {
    backgroundColor: '#52c41a',
  },
  transferButton: {
    backgroundColor: '#13c2c2',
  },
  penaltyButton: {
    backgroundColor: '#faad14',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  transactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
  },
});

export default MemberWallet;
