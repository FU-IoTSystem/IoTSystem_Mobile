import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Avatar,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LecturerLayout from '../../components/LecturerLayout';
import { walletAPI, walletTransactionAPI } from '../../services/api';
import dayjs from 'dayjs';

const LecturerWallet = ({ user, navigation }) => {
  const [wallet, setWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    loadData();
  }, []);

  const handleTopUp = () => {
    if (navigation) {
      navigation.navigate('TopUp');
    } else {
      Alert.alert('Info', 'Top up functionality coming soon');
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
    switch (upperType) {
      case 'TOP_UP':
      case 'TOPUP':
        return { icon: 'add-circle', color: '#52c41a', label: 'Nạp tiền' };
      case 'RENTAL_FEE':
        return { icon: 'shopping-cart', color: '#1890ff', label: 'Thuê kit' };
      case 'PENALTY_PAYMENT':
      case 'PENALTY':
      case 'FINE':
        return { icon: 'warning', color: '#ff4d4f', label: 'Phí phạt' };
      case 'REFUND':
        return { icon: 'undo', color: '#722ed1', label: 'Hoàn tiền' };
      default:
        return { icon: 'info', color: '#666', label: type || 'Khác' };
    }
  };

  const renderTransaction = ({ item }) => {
    const typeInfo = getTransactionTypeInfo(item.type);
    return (
      <Card style={styles.transactionItem} mode="outlined">
        <Card.Content>
          <View style={styles.transactionRow}>
            <View style={[styles.iconContainer, { backgroundColor: `${typeInfo.color}20` }]}>
              <Icon 
                name={typeInfo.icon} 
                size={32} 
                color={typeInfo.color}
              />
            </View>
            <View style={styles.transactionDetails}>
              <Title style={styles.transactionType}>{typeInfo.label}</Title>
              <Paragraph style={styles.transactionDescription}>{item.description || 'N/A'}</Paragraph>
              <Paragraph style={styles.transactionDate}>{item.date}</Paragraph>
            </View>
            <View style={styles.transactionAmount}>
              <Title
                style={[
                  styles.amountText,
                  { color: item.amount > 0 ? '#52c41a' : '#ff4d4f' },
                ]}
              >
                {item.amount > 0 ? '+' : ''}
                {Math.abs(item.amount).toLocaleString('vi-VN')} VND
              </Title>
              <Chip
                style={{
                  backgroundColor: item.status === 'COMPLETED' || item.status === 'SUCCESS' ? '#52c41a' : '#fa8c16',
                  marginTop: 4,
                }}
                textStyle={{ color: 'white' }}
                compact
              >
                {item.status === 'COMPLETED' || item.status === 'SUCCESS' ? 'Hoàn thành' : 'Chờ xử lý'}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <LecturerLayout title="My Wallet">
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
        <Card style={styles.balanceCard} mode="elevated">
          <Card.Content style={styles.balanceContent}>
            <Paragraph style={styles.balanceLabel}>Current Balance</Paragraph>
            <Title style={styles.balanceAmount}>
              {wallet.balance.toLocaleString('vi-VN')} VND
            </Title>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            icon="plus-circle"
            onPress={handleTopUp}
            style={[styles.actionButton, styles.topUpButton]}
            buttonColor="#52c41a"
          >
            Top Up
          </Button>
          <Button
            mode="contained"
            icon="alert"
            onPress={handlePayPenalties}
            style={[styles.actionButton, styles.penaltyButton]}
            buttonColor="#fa8c16"
          >
            Pay Penalties
          </Button>
        </View>

        {/* Transaction History */}
        <Card style={styles.transactionsSection} mode="elevated">
          <Card.Title title="Transaction History" />
          <Card.Content>
            <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="history" size={48} color="#ccc" />
                <Paragraph style={styles.emptyText}>No transactions yet</Paragraph>
              </View>
            }
          />
          </Card.Content>
        </Card>
      </ScrollView>
      )}
    </LecturerLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#667eea',
    marginBottom: 20,
  },
  balanceContent: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  transactionsSection: {
    marginBottom: 20,
  },
  transactionItem: {
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionType: {
    fontSize: 16,
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconContainer: {
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 10,
  },
});

export default LecturerWallet;

