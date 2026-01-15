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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AdminLayout from '../../components/AdminLayout';
import { penaltiesAPI, penaltyDetailAPI, penaltyPoliciesAPI } from '../../services/api';
import dayjs from 'dayjs';

const AdminFines = ({ onLogout }) => {
  const navigation = useNavigation();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [penaltyDetails, setPenaltyDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    setLoading(true);
    try {
      // Load unresolved fines - matching AdminPortal.js behavior
      // Note: Backend only has endpoint for unresolved fines (getAllByResolved-F)
      const response = await penaltiesAPI.getUnresolved();
      console.log('Unresolved penalties response:', response);
      const data = Array.isArray(response)
        ? response
        : (response?.data || []);

      // Map penalties to fine format - matching AdminPortal.js structure
      const mappedFines = data.map(p => {
        // Extract account information
        const account = p.account || {};
        const borrowRequest = p.request || p.borrowRequest || {};
        const kit = borrowRequest?.kit || {};

        // Get student/account email and name
        const accountEmail = account.email || p.accountEmail || 'N/A';
        const accountName = account.fullName || account.name || accountEmail;

        // Get borrow request information
        const borrowRequestId = borrowRequest.id || p.borrowRequestId || 'N/A';
        const kitName = kit.kitName || kit.name || 'N/A';

        // For group leader, check if borrow request has requestedBy info
        const requestedBy = borrowRequest.requestedBy || {};
        const leaderEmail = requestedBy.email || accountEmail;
        const leaderName = requestedBy.fullName || requestedBy.name || leaderEmail;

        return {
          id: p.id,
          kitId: borrowRequestId,
          kitName: kitName,
          studentEmail: accountEmail,
          studentName: accountName,
          leaderEmail: leaderEmail,
          leaderName: leaderName,
          fineAmount: (p.totalAmount !== undefined && p.totalAmount !== null)
            ? Number(p.totalAmount)
            : (p.total_ammount !== undefined && p.total_ammount !== null)
              ? Number(p.total_ammount)
              : 0,
          createdAt: p.takeEffectDate || p.take_effect_date || p.createdAt || new Date().toISOString(),
          dueDate: p.dueDate || p.createdAt || new Date().toISOString(),
          status: p.resolved ? 'paid' : 'pending',
          damageAssessment: p.damageAssessment || {},
          penalty: p,
        };
      });

      // Sort by createdAt descending (newest first)
      const sortedFines = mappedFines.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });

      setFines(sortedFines);
    } catch (error) {
      console.error('Error loading fines:', error);
      Alert.alert('Error', 'Failed to load fines');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (fine) => {
    setSelectedFine(fine);
    setPenaltyDetails([]); // Clear previous details
    setDetailModalVisible(true);
    await loadPenaltyDetails(fine.id);
  };

  const loadPenaltyDetails = async (penaltyId) => {
    if (!penaltyId) {
      setPenaltyDetails([]);
      return;
    }

    setLoadingDetails(true);
    setPenaltyDetails([]); // Clear while loading
    try {
      const response = await penaltyDetailAPI.findByPenaltyId(penaltyId);

      let detailsData = [];
      if (Array.isArray(response)) {
        detailsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        detailsData = response.data;
      } else if (response && response.id) {
        detailsData = [response];
      }

      // Fetch penalty policy info for each detail
      if (detailsData.length > 0) {
        const detailsWithPolicies = await Promise.all(
          detailsData.map(async (detail) => {
            if (detail.policiesId) {
              try {
                const policyResponse = await penaltyPoliciesAPI.getById(detail.policiesId);
                const policyData = policyResponse?.data || policyResponse;
                return { ...detail, policy: policyData };
              } catch (error) {
                console.error(`Error loading policy for detail ${detail.id}:`, error);
                return { ...detail, policy: null };
              }
            }
            return { ...detail, policy: null };
          })
        );
        setPenaltyDetails(detailsWithPolicies);
      } else {
        setPenaltyDetails([]);
      }
    } catch (error) {
      console.error('Error loading penalty details:', error);
      setPenaltyDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#52c41a';
      case 'pending':
        return '#faad14';
      default:
        return '#ff4d4f';
    }
  };


  const renderFineItem = ({ item }) => (
    <TouchableOpacity
      style={styles.fineCard}
      onPress={() => handleViewDetails(item)}
    >
      <View style={styles.fineHeader}>
        <View style={styles.fineInfo}>
          <Text style={styles.fineId}>Fine #{item.id?.toString().substring(0, 8)}</Text>
          <Text style={styles.fineStudent}>{item.studentName}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(item.status)}15` }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status?.toUpperCase() || 'PENDING'}
          </Text>
        </View>
      </View>

      <View style={styles.fineDetails}>
        <View style={styles.detailRow}>
          <Icon name="account-circle" size={16} color="#666" />
          <Text style={styles.detailText}>
            Leader: {item.leaderName}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="attach-money" size={16} color="#666" />
          <Text style={[styles.detailText, styles.amountText]}>
            {item.fineAmount.toLocaleString('vi-VN')} VND
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.detailText}>
            Due: {item.dueDate ? dayjs(item.dueDate).format('DD/MM/YYYY') : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.fineActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1890ff15' }]}
          onPress={() => handleViewDetails(item)}
        >
          <Icon name="visibility" size={18} color="#1890ff" />
          <Text style={[styles.actionButtonText, { color: '#1890ff' }]}>View Details</Text>
        </TouchableOpacity>
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

  return (
    <AdminLayout
      title="Fine Management"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >
      <FlatList
        data={fines}
        renderItem={renderFineItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadFines} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="money-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No fines found</Text>
          </View>
        }
      />

      {/* Fine Details Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setDetailModalVisible(false);
          setPenaltyDetails([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fine Details</Text>
              <TouchableOpacity onPress={() => {
                setDetailModalVisible(false);
                setPenaltyDetails([]);
              }}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedFine && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Fine Information</Text>
                  <DetailRow label="Fine ID" value={`#${selectedFine.id}`} />
                  <DetailRow
                    label="Status"
                    value={selectedFine.status?.toUpperCase() || 'PENDING'}
                    valueColor={getStatusColor(selectedFine.status)}
                  />
                  <DetailRow
                    label="Fine Amount"
                    value={`${selectedFine.fineAmount.toLocaleString('vi-VN')} VND`}
                    valueColor="#cf1322"
                  />
                  <DetailRow
                    label="Created Date"
                    value={selectedFine.createdAt
                      ? dayjs(selectedFine.createdAt).format('DD/MM/YYYY HH:mm')
                      : 'N/A'}
                  />
                  <DetailRow
                    label="Due Date"
                    value={selectedFine.dueDate
                      ? dayjs(selectedFine.dueDate).format('DD/MM/YYYY HH:mm')
                      : 'N/A'}
                  />
                </View>

                {loadingDetails ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.loadingText}>Loading policies...</Text>
                  </View>
                ) : penaltyDetails && penaltyDetails.length > 0 ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Penalty Details</Text>
                    {penaltyDetails.map((detail, index) => {
                      const imageUri = detail.imageUrl ? (
                        (detail.imageUrl.startsWith('http') || detail.imageUrl.startsWith('data:') || detail.imageUrl.startsWith('file://'))
                          ? detail.imageUrl
                          : detail.imageUrl.startsWith('/')
                            ? `file://${detail.imageUrl}`
                            : detail.imageUrl
                      ) : null;

                      // Display logic: 
                      // 1. If policy exists, show policy name/desc
                      // 2. If no policy, show description (for manual/damage penalties)
                      const title = detail.policy
                        ? (detail.policy.policyName || detail.policy.name || 'Policy Violation')
                        : (detail.description || 'Penalty Detail');

                      const description = detail.policy
                        ? detail.policy.description
                        : (detail.quantity && detail.quantity > 1 ? `Quantity: ${detail.quantity}` : null);

                      return (
                        <View key={detail.id || index} style={styles.policyItem}>
                          <Text style={styles.policyName}>{title}</Text>

                          {description && (
                            <Text style={styles.policyDescription}>
                              {description}
                            </Text>
                          )}

                          {/* If it's a damage penalty without policy but has description, show it as description too if distinct */}
                          {!detail.policy && detail.description && detail.description !== title && (
                            <Text style={styles.policyDescription}>
                              {detail.description}
                            </Text>
                          )}

                          {imageUri && (
                            <Image
                              source={{ uri: imageUri }}
                              style={styles.detailImage}
                              resizeMode="cover"
                              onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
                            />
                          )}

                          <Text style={styles.policyAmount}>
                            {detail.amount ? Number(detail.amount).toLocaleString('vi-VN') : 0} VND
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.detailSection}>
                    <Text style={styles.noPoliciesText}>No penalty details found</Text>
                  </View>
                )}

                {selectedFine.damageAssessment && Object.keys(selectedFine.damageAssessment).length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Damage Assessment</Text>
                    {Object.entries(selectedFine.damageAssessment).map(([component, assessment]) => (
                      assessment.damaged && (
                        <View key={component} style={styles.damageItem}>
                          <Text style={styles.damageComponent}>{component}</Text>
                          <Text style={styles.damageValue}>
                            {assessment.value ? assessment.value.toLocaleString('vi-VN') : 0} VND
                          </Text>
                        </View>
                      )
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => {
                  setDetailModalVisible(false);
                  setPenaltyDetails([]);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AdminLayout >
  );
};

const DetailRow = ({ label, value, valueColor }) => (
  <View style={styles.detailRowItem}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
      {value || 'N/A'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  fineCard: {
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
  fineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fineInfo: {
    flex: 1,
  },
  fineId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 4,
  },
  fineStudent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
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
  fineDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cf1322',
  },
  fineActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
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
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  damageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  damageComponent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  damageValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#cf1322',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  policyItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  policyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  policyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cf1322',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noPoliciesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  detailImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#e6e6e6',
  },
});

export default AdminFines;
