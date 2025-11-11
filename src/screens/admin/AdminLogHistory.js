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
import { borrowingRequestAPI } from '../../services/api';

const AdminLogHistory = ({ onLogout }) => {
  const navigation = useNavigation();
  const [logHistory, setLogHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadLogHistory();
  }, []);

  const loadLogHistory = async () => {
    setLoading(true);
    try {
      const requests = await borrowingRequestAPI.getByStatuses(['REJECTED', 'RETURNED']);
      console.log('Fetched borrowing requests:', requests);
      
      // Map borrowing requests to log history format
      const mappedLogs = requests.map(request => {
        const status = request.status || 'UNKNOWN';
        const action = status === 'REJECTED' ? 'RENTAL_REQUEST_REJECTED' : 
                       status === 'RETURNED' ? 'RENTAL_REQUEST_RETURNED' : 
                       'RENTAL_REQUEST_OTHER';
        
        return {
          id: request.id,
          timestamp: request.actualReturnDate || request.approvedDate || request.createdAt || new Date().toISOString(),
          action: action,
          type: 'rental',
          user: request.requestedBy?.email || 'N/A',
          userName: request.requestedBy?.fullName || request.requestedBy?.email || 'N/A',
          details: {
            kitName: request.kit?.kitName || 'N/A',
            kitId: request.kit?.id || 'N/A',
            requestId: request.id?.toString() || 'N/A',
            reason: request.reason || 'N/A',
            requestType: request.requestType || 'N/A',
            depositAmount: request.depositAmount || 0,
            expectReturnDate: request.expectReturnDate || 'N/A',
            actualReturnDate: request.actualReturnDate || 'N/A'
          },
          status: status,
          adminAction: status === 'REJECTED' ? 'rejected' : status === 'RETURNED' ? 'returned' : 'N/A',
          adminUser: 'admin@fpt.edu.vn',
          adminTimestamp: request.actualReturnDate || request.approvedDate || request.createdAt || new Date().toISOString()
        };
      });
      
      setLogHistory(mappedLogs);
    } catch (error) {
      console.error('Error loading log history:', error);
      Alert.alert('Error', 'Failed to load log history');
      setLogHistory([]);
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

  const getActionIcon = (action) => {
    if (action.includes('BORROWED')) return 'shopping-cart';
    if (action.includes('RETURNED')) return 'check-circle';
    if (action.includes('REJECTED')) return 'cancel';
    return 'info';
  };

  const getActionColor = (action) => {
    if (action.includes('BORROWED')) return '#1890ff';
    if (action.includes('RETURNED')) return '#52c41a';
    if (action.includes('REJECTED')) return '#ff4d4f';
    return '#666';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BORROWED':
        return '#1890ff';
      case 'RETURNED':
        return '#52c41a';
      case 'REJECTED':
        return '#ff4d4f';
      case 'PAID':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const filteredLogs = logHistory.filter(log => {
    const matchesSearch = (log.userName || '').toLowerCase().includes(searchText.toLowerCase()) ||
                         (log.details?.kitName || '').toLowerCase().includes(searchText.toLowerCase()) ||
                         (log.details?.requestId || '').toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const renderLogItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.logCard}
        onPress={() => {
          setSelectedLog(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.logHeader}>
          <View style={[styles.logIconContainer, { backgroundColor: `${getActionColor(item.action)}20` }]}>
            <Icon 
              name={getActionIcon(item.action)} 
              size={24} 
              color={getActionColor(item.action)} 
            />
          </View>
          <View style={styles.logInfo}>
            <Text style={styles.logAction}>{item.action.replace(/_/g, ' ')}</Text>
            <Text style={styles.logUser}>{item.userName} ({item.user})</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.logDetails}>
          <Text style={styles.logKit}>{item.details?.kitName || 'N/A'}</Text>
          <Text style={styles.logTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
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
          <Text style={styles.headerTitle}>Log History</Text>
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
          <Icon name="history" size={24} color="#1890ff" />
          <Text style={styles.statValue}>{filteredLogs.length}</Text>
          <Text style={styles.statLabel}>Total Logs</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="check-circle" size={24} color="#52c41a" />
          <Text style={styles.statValue}>
            {filteredLogs.filter(log => log.status === 'RETURNED').length}
          </Text>
          <Text style={styles.statLabel}>Returned</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="cancel" size={24} color="#ff4d4f" />
          <Text style={styles.statValue}>
            {filteredLogs.filter(log => log.status === 'REJECTED').length}
          </Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user, kit, or request ID..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const filters = ['all', 'BORROWED', 'RETURNED', 'REJECTED'];
              const currentIndex = filters.indexOf(statusFilter);
              const nextIndex = (currentIndex + 1) % filters.length;
              setStatusFilter(filters[nextIndex]);
            }}
          >
            <Icon name="filter-list" size={20} color="#667eea" />
            <Text style={styles.filterText}>
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const filters = ['all', 'rental', 'refund'];
              const currentIndex = filters.indexOf(typeFilter);
              const nextIndex = (currentIndex + 1) % filters.length;
              setTypeFilter(filters[nextIndex]);
            }}
          >
            <Icon name="category" size={20} color="#667eea" />
            <Text style={styles.filterText}>
              {typeFilter === 'all' ? 'All Types' : typeFilter}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {(statusFilter !== 'all' || typeFilter !== 'all') && (
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>
            Filters: {statusFilter !== 'all' ? statusFilter : ''} {typeFilter !== 'all' ? typeFilter : ''}
          </Text>
          <TouchableOpacity onPress={() => {
            setStatusFilter('all');
            setTypeFilter('all');
          }}>
            <Icon name="close" size={16} color="#667eea" />
          </TouchableOpacity>
        </View>
      )}

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLogHistory} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inbox" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No log history found</Text>
          </View>
        }
      />

      {/* Log Details Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedLog && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Action:</Text>
                  <View style={[styles.typeBadge, { backgroundColor: `${getActionColor(selectedLog.action)}20` }]}>
                    <Text style={[styles.typeText, { color: getActionColor(selectedLog.action) }]}>
                      {selectedLog.action.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <View style={[styles.typeBadge, { backgroundColor: '#1890ff20' }]}>
                    <Text style={[styles.typeText, { color: '#1890ff' }]}>
                      {selectedLog.type?.toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedLog.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedLog.status) }]}>
                      {selectedLog.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.userName} ({selectedLog.user})
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kit Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.details?.kitName || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Request ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.details?.requestId || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.details?.reason || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Request Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.details?.requestType || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deposit Amount:</Text>
                  <Text style={styles.detailValue}>
                    {(selectedLog.details?.depositAmount || 0).toLocaleString('vi-VN')} VND
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expected Return Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.details?.expectReturnDate !== 'N/A' 
                      ? formatTimestamp(selectedLog.details.expectReturnDate)
                      : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Actual Return Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLog.details?.actualReturnDate !== 'N/A'
                      ? formatTimestamp(selectedLog.details.actualReturnDate)
                      : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timestamp:</Text>
                  <Text style={styles.detailValue}>
                    {formatTimestamp(selectedLog.timestamp)}
                  </Text>
                </View>
                {selectedLog.adminAction && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Admin Action:</Text>
                      <Text style={styles.detailValue}>{selectedLog.adminAction}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Admin User:</Text>
                      <Text style={styles.detailValue}>{selectedLog.adminUser || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Admin Timestamp:</Text>
                      <Text style={styles.detailValue}>
                        {formatTimestamp(selectedLog.adminTimestamp)}
                      </Text>
                    </View>
                  </>
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
    padding: 12,
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
    fontSize: 11,
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
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
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
    fontSize: 12,
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
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  logCard: {
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
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  logUser: {
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
  logDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  logKit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#999',
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

export default AdminLogHistory;


