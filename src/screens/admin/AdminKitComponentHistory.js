import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { kitAPI, kitComponentHistoryAPI } from '../../services/api';

const AdminKitComponentHistory = ({ onLogout }) => {
  const navigation = useNavigation();
  const [kits, setKits] = useState([]);
  const [selectedKitId, setSelectedKitId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    setLoading(true);
    try {
      const kitsResponse = await kitAPI.getAllKits();
      const kitsData = Array.isArray(kitsResponse)
        ? kitsResponse
        : kitsResponse?.data || [];
      setKits(Array.isArray(kitsData) ? kitsData : []);
    } catch (error) {
      console.error('Error loading kits for history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    const search = searchText.trim().toLowerCase();
    if (!search) return true;
    const inComponent =
      (item.componentName || '').toLowerCase().includes(search);
    const inKit = (item.kitName || '').toLowerCase().includes(search);
    const inNote = (item.note || '').toLowerCase().includes(search);
    const inAction = (item.action || '').toLowerCase().includes(search);
    return inComponent || inKit || inNote || inAction;
  });

  const loadHistoryForKit = async (kitId) => {
    if (!kitId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    try {
      const response = await kitComponentHistoryAPI.getByKit(kitId);
      const data = Array.isArray(response) ? response : response?.data || [];
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading kit component history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadKits();
    if (selectedKitId) {
      await loadHistoryForKit(selectedKitId);
    }
    setRefreshing(false);
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

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    try {
      return new Date(value).toLocaleString('vi-VN');
    } catch {
      return String(value);
    }
  };

  const getActionChipStyle = (action) => {
    if (!action) {
      return { bg: '#e0e0e0', color: '#555' };
    }
    const lower = action.toLowerCase();
    const isDamage = lower.includes('damage');
    return {
      bg: isDamage ? '#faad1415' : '#1890ff15',
      color: isDamage ? '#faad14' : '#1890ff',
    };
  };

  const getStatusChipStyle = (status, isNew) => {
    if (!status) {
      return { bg: '#f5f5f5', color: '#666' };
    }
    const lower = status.toLowerCase();
    const isDamage = lower.includes('damage') || lower.includes('broken');
    if (isDamage) {
      return { bg: '#faad1415', color: '#faad14' };
    }
    return {
      bg: isNew ? '#52c41a15' : '#f5f5f5',
      color: isNew ? '#52c41a' : '#666',
    };
  };

  const renderHistoryItem = ({ item }) => {
    const actionStyle = getActionChipStyle(item.action);
    const oldStatusStyle = getStatusChipStyle(item.oldStatus, false);
    const newStatusStyle = getStatusChipStyle(item.newStatus, true);

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => {
          setSelectedHistory(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.historyHeader}>
          <View style={styles.historyIcon}>
            <Icon name="history" size={20} color="#667eea" />
          </View>
          <View style={styles.historyTitleArea}>
            <Text style={styles.historyTitle}>
              {item.componentName || 'Component'}
            </Text>
            <Text style={styles.historySubtitle}>
              {item.kitName || 'Unknown kit'}
            </Text>
          </View>
          <View
            style={[
              styles.actionChip,
              { backgroundColor: actionStyle.bg },
            ]}
          >
            <Text
              style={[styles.actionChipText, { color: actionStyle.color }]}
            >
              {item.action || 'Action'}
            </Text>
          </View>
        </View>
        <View style={styles.historyBody}>
          <Text style={styles.historyTime}>{formatDateTime(item.createdAt)}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: oldStatusStyle.bg },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: oldStatusStyle.color },
                ]}
              >
                {item.oldStatus || 'N/A'}
              </Text>
            </View>
            <Icon
              name="arrow-forward"
              size={16}
              color="#999"
              style={{ marginHorizontal: 6 }}
            />
            <View
              style={[
                styles.statusChip,
                { backgroundColor: newStatusStyle.bg },
              ]}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: newStatusStyle.color },
                ]}
              >
                {item.newStatus || 'N/A'}
              </Text>
            </View>
          </View>
          {item.note ? (
            <Text style={styles.historyNote} numberOfLines={2}>
              {item.note}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const selectedKit = kits.find((k) => k.id === selectedKitId) || null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kit Component History</Text>
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Kit selector */}
        <Text style={styles.sectionTitle}>Select Kit</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kitChipsScroll}
        >
          {kits.map((kit) => {
            const isSelected = kit.id === selectedKitId;
            return (
              <TouchableOpacity
                key={kit.id}
                style={[
                  styles.kitChip,
                  isSelected && styles.kitChipSelected,
                ]}
                onPress={() => {
                  const newKitId = isSelected ? null : kit.id;
                  setSelectedKitId(newKitId);
                  if (newKitId) {
                    loadHistoryForKit(newKitId);
                  } else {
                    setHistory([]);
                  }
                }}
              >
                <Text
                  style={[
                    styles.kitChipText,
                    isSelected && styles.kitChipTextSelected,
                  ]}
                >
                  {kit.kitName || kit.name || 'Kit'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {selectedKit && (
          <Text style={styles.selectedKitInfo}>
            Showing history for kit:{' '}
            <Text style={styles.selectedKitName}>
              {selectedKit.kitName || selectedKit.name}
            </Text>
          </Text>
        )}

        {/* Search filter */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by component or kit name..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* History list */}
        <View style={styles.listContainer}>
          {filteredHistory.length > 0 ? (
            <FlatList
              data={filteredHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) =>
                item.id?.toString() ||
                `${item.componentId || 'comp'}-${item.createdAt || index}`
              }
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="history" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {selectedKitId
                  ? searchText
                    ? 'No history matches your search'
                    : 'No history for this kit yet'
                  : 'Select a kit to view history'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>History Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedHistory && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(selectedHistory.createdAt)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Kit</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistory.kitName || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Component</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistory.componentName || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Action</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistory.action || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Old Status</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistory.oldStatus || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>New Status</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistory.newStatus || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Note</Text>
                  <Text style={styles.detailValue}>
                    {selectedHistory.note || 'N/A'}
                  </Text>
                </View>
                {selectedHistory.penaltyDetailImageUrl && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Damage Image</Text>
                    <Image
                      source={{ uri: selectedHistory.penaltyDetailImageUrl }}
                      style={styles.detailImage}
                      resizeMode="contain"
                    />
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
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
  kitChipsScroll: {
    marginBottom: 8,
  },
  kitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  kitChipSelected: {
    backgroundColor: '#667eea15',
    borderColor: '#667eea',
  },
  kitChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  kitChipTextSelected: {
    color: '#667eea',
  },
  selectedKitInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  selectedKitName: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  listContainer: {
    paddingBottom: 24,
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTitleArea: {
    flex: 1,
    marginLeft: 10,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  historySubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyBody: {
    marginTop: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  historyNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 4,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminKitComponentHistory;


