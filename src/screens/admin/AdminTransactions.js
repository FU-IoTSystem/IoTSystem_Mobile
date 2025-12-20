import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { walletTransactionAPI } from '../../services/api';

const AdminTransactions = ({ onLogout }) => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await walletTransactionAPI.getAll();
      const transactionsData = Array.isArray(response) 
        ? response 
        : (response?.data || []);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
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

  const getTransactionTypeColor = (type) => {
    // Keep color mapping consistent with dashboard and wallet UIs
    const upperType = (type || '').toUpperCase();
    switch (upperType) {
      case 'TOP_UP':
      case 'TOPUP':
        return '#52c41a'; // green for top up
      case 'RENTAL_FEE':
        return '#1890ff'; // blue for rental fee
      case 'PENALTY_PAYMENT':
      case 'PENALTY':
      case 'FINE':
        return '#ff4d4f'; // red for penalties
      case 'REFUND':
        return '#722ed1'; // purple for refunds
      default:
        return '#666';
    }
  };

  const getTransactionIconName = (type) => {
    // Use type-specific icons similar to dashboard "Recent Transactions"
    const upperType = (type || '').toUpperCase();
    switch (upperType) {
      case 'TOP_UP':
      case 'TOPUP':
        return 'add-circle';
      case 'RENTAL_FEE':
        return 'shopping-cart';
      case 'PENALTY_PAYMENT':
      case 'PENALTY':
      case 'FINE':
        return 'warning';
      case 'REFUND':
        return 'undo';
      default:
        return 'payment';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#52c41a';
      case 'PENDING':
        return '#faad14';
      case 'FAILED':
        return '#ff4d4f';
      default:
        return '#666';
    }
  };

  const formatAmount = (amount) => {
    return `${(amount || 0).toLocaleString('vi-VN')} VND`;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      (transaction.id || '').toString().toLowerCase().includes(searchText.toLowerCase()) ||
      (transaction.description || '').toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = typeFilter === 'all' || 
      (transaction.type || transaction.transactionType) === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalAmount = filteredTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);

  const renderTransactionItem = ({ item }) => {
    const transactionType = item.type || item.transactionType || 'UNKNOWN';
    const status = item.status || item.transactionStatus || 'UNKNOWN';
    const iconName = getTransactionIconName(transactionType);

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => {
          setSelectedTransaction(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <Icon 
              name={iconName} 
              size={32} 
              color={getTransactionTypeColor(transactionType)} 
            />
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionType}>{transactionType.replace(/_/g, ' ')}</Text>
              <Text style={styles.transactionDate}>
                {formatDateTime(item.createdAt || item.transactionDate)}
              </Text>
            </View>
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.amountText,
              { color: (item.amount || 0) >= 0 ? '#52c41a' : '#ff4d4f' }
            ]}>
              {formatAmount(item.amount || 0)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                {status}
              </Text>
            </View>
          </View>
        </View>
        {item.description && (
          <Text style={styles.transactionDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="list" size={24} color="#1890ff" />
          <Text style={styles.statValue}>{filteredTransactions.length}</Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="attach-money" size={24} color="#52c41a" />
          <Text style={[styles.statValue, { color: totalAmount >= 0 ? '#52c41a' : '#ff4d4f' }]}>
            {formatAmount(totalAmount)}
          </Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            const filters = ['all', 'TOP_UP', 'PENALTY_PAYMENT', 'REFUND', 'RENTAL_FEE'];
            const currentIndex = filters.indexOf(typeFilter);
            const nextIndex = (currentIndex + 1) % filters.length;
            setTypeFilter(filters[nextIndex]);
          }}
        >
          <Icon name="filter-list" size={20} color="#667eea" />
          <Text style={styles.filterText}>
            {typeFilter === 'all' ? 'All Types' : typeFilter.replace(/_/g, ' ')}
          </Text>
        </TouchableOpacity>
      </View>

      {typeFilter !== 'all' && (
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>Filter: {typeFilter.replace(/_/g, ' ')}</Text>
          <TouchableOpacity onPress={() => setTypeFilter('all')}>
            <Icon name="close" size={16} color="#667eea" />
          </TouchableOpacity>
        </View>
      )}

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inbox" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.id || selectedTransaction.transactionId || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <View style={[styles.typeBadge, { backgroundColor: `${getTransactionTypeColor(selectedTransaction.type || selectedTransaction.transactionType)}20` }]}>
                    <Text style={[styles.typeText, { color: getTransactionTypeColor(selectedTransaction.type || selectedTransaction.transactionType) }]}>
                      {(selectedTransaction.type || selectedTransaction.transactionType || 'UNKNOWN').replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[styles.detailValue, { 
                    color: (selectedTransaction.amount || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold',
                    fontSize: 18
                  }]}>
                    {formatAmount(selectedTransaction.amount || 0)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedTransaction.status || selectedTransaction.transactionStatus)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedTransaction.status || selectedTransaction.transactionStatus) }]}>
                      {selectedTransaction.status || selectedTransaction.transactionStatus || 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.description || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(selectedTransaction.createdAt || selectedTransaction.transactionDate)}
                  </Text>
                </View>
                {selectedTransaction.userName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User:</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransaction.userName} ({selectedTransaction.email || selectedTransaction.userEmail || 'N/A'})
                    </Text>
                  </View>
                )}
                {selectedTransaction.kitName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Kit:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.kitName}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterText: {
    marginLeft: 8,
    color: '#667eea',
    fontWeight: '600',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterChipText: {
    color: '#667eea',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminTransactions;
