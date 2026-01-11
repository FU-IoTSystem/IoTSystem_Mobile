import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AdminLayout from '../../components/AdminLayout';
import {
  borrowingRequestAPI,
  notificationAPI,
  borrowingGroupAPI,
  studentGroupAPI,
  classesAPI
} from '../../services/api';

const AdminApprovals = ({ onLogout }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [rentalRequests, setRentalRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const processedRequestIdRef = useRef(null);

  useEffect(() => {
    loadRentalRequests();
  }, []);

  // Handle navigation params to open specific request detail
  useEffect(() => {
    const requestId = route.params?.requestId;
    // Only process if we have a requestId, haven't processed it yet, and requests are loaded
    if (requestId &&
      requestId !== processedRequestIdRef.current &&
      rentalRequests.length > 0 &&
      !loading) {
      processedRequestIdRef.current = requestId;

      const request = rentalRequests.find(req =>
        req.id?.toString() === requestId.toString() ||
        req.id === requestId
      );

      if (request) {
        setSelectedRequest(request);
        setDetailModalVisible(true);
      } else {
        // Request not found in current list, try to fetch it directly
        fetchAndOpenRequest(requestId);
      }
    }
  }, [route.params?.requestId, rentalRequests, loading]);

  const fetchAndOpenRequest = async (requestId) => {
    try {
      const request = await borrowingRequestAPI.getById(requestId);
      if (request) {
        setSelectedRequest(request);
        setDetailModalVisible(true);
        // Add to list if not already there
        setRentalRequests(prev => {
          const exists = prev.find(req => req.id?.toString() === requestId.toString());
          if (!exists) {
            return [request, ...prev];
          }
          return prev;
        });
        navigation.setParams({ requestId: undefined });
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      Alert.alert('Error', 'Could not find the requested borrowing request.');
    }
  };

  const loadRentalRequests = async () => {
    setLoading(true);
    try {
      const rentalResponse = await borrowingRequestAPI.getAll();
      const rawData = Array.isArray(rentalResponse)
        ? rentalResponse
        : (rentalResponse?.data || []);

      // Process requests to resolving component names
      const processedData = await Promise.all(rawData.map(async (request) => {
        let displayKitName = request.kit?.kitName || request.kitName;
        let displayComponentIds = 'N/A';

        // If it looks like a component rental or name is missing, try to fetch components
        if (request.requestType === 'BORROW_COMPONENT' || !displayKitName) {
          if (request.borrowingRequestComponents && request.borrowingRequestComponents.length > 0) {
            displayKitName = request.borrowingRequestComponents.map(c => c.componentName).join(', ');
            displayComponentIds = request.borrowingRequestComponents.map(c => c.componentId || c.id || 'N/A').join(', ');
          } else {
            try {
              const comps = await borrowingRequestAPI.getRequestComponents(request.id);
              if (comps && comps.length > 0) {
                displayKitName = comps.map(c => c.componentName).join(', ');
                displayComponentIds = comps.map(c => c.componentId || c.id || 'N/A').join(', ');
              }
            } catch (err) {
              console.log('Error fetching components for request ' + request.id, err);
            }
          }
        }

        return {
          ...request,
          kitName: displayKitName || request.componentName || 'N/A',
          componentIds: displayComponentIds
        };
      }));

      setRentalRequests(processedData);
    } catch (error) {
      console.error('Error loading rental requests:', error);
      Alert.alert('Error', 'Failed to load rental requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGroupInfo = async (userId) => {
    if (!userId) return null;

    try {
      const groups = await borrowingGroupAPI.getByAccountId(userId);
      if (groups && groups.length > 0) {
        // Use the most recent group or the first one
        const activeGroup = groups.find(bg => bg.isActive !== false) || groups[0];

        if (activeGroup) {
          let groupName = activeGroup.studentGroupName || activeGroup.groupName || 'N/A';
          let classCode = activeGroup.classCode || 'N/A';
          let semester = activeGroup.semester || 'N/A';

          // If we have studentGroupId, fetch details from studentGroupAPI to get Class info
          if (activeGroup.studentGroupId) {
            try {
              const studentGroup = await studentGroupAPI.getById(activeGroup.studentGroupId);
              if (studentGroup) {
                groupName = studentGroup.groupName || studentGroup.name || groupName;

                if (studentGroup.classId) {
                  const classes = await classesAPI.getAllClasses();
                  const classList = Array.isArray(classes) ? classes : (classes?.data || []);
                  const classData = classList.find(c => c.id === studentGroup.classId);

                  if (classData) {
                    classCode = classData.classCode || classCode;
                    semester = classData.semester || semester;
                  }
                }
              }
            } catch (sgError) {
              console.log('Error fetching student group details:', sgError);
            }
          }

          return {
            groupName,
            classCode,
            semester
          };
        }
      }
    } catch (error) {
      console.log('Error fetching group info:', error);
    }
    return null;
  };

  const handleApproval = async (requestId, action) => {
    try {
      const request = rentalRequests.find(req => req.id === requestId);
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

      const updateData = {
        status: newStatus,
        note: action === 'reject' ? 'Request rejected by admin' : 'Request approved by admin',
      };

      await borrowingRequestAPI.update(requestId, updateData);

      // Update local state
      setRentalRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));

      // Send notification
      if (request?.requestedBy?.id) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: action === 'approve' ? 'RENTAL_SUCCESS' : 'RENTAL_REJECTED',
              title: action === 'approve'
                ? 'Yêu cầu thuê kit được chấp nhận'
                : 'Yêu cầu thuê kit bị từ chối',
              message: action === 'approve'
                ? `Yêu cầu thuê kit ${request?.kit?.kitName || ''} của bạn đã được admin phê duyệt.`
                : `Yêu cầu thuê kit ${request?.kit?.kitName || ''} của bạn đã bị admin từ chối.`,
              userId: request.requestedBy.id
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }

      Alert.alert(
        'Success',
        action === 'approve'
          ? 'Request approved successfully'
          : 'Request rejected successfully'
      );
    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('Error', `Failed to ${action} request`);
    }
  };

  const handleViewDetails = async (request) => {
    let groupInfo = null;

    // Check if user is student and fetch group info
    const isStudent = request.requestedBy?.roles?.includes('STUDENT') || !request.requestedBy?.roles?.includes('LECTURER'); // Default to student if not lecturer
    if (isStudent && request.requestedBy?.id) {
      groupInfo = await fetchStudentGroupInfo(request.requestedBy.id);
    }

    setSelectedRequest({
      ...request,
      groupInfo
    });
    setDetailModalVisible(true);
  };

  const filteredRequests = statusFilter === 'all'
    ? rentalRequests
    : rentalRequests.filter(req => req.status === statusFilter);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return '#52c41a';
      case 'REJECTED':
        return '#ff4d4f';
      case 'PENDING':
      case 'PENDING_APPROVAL':
        return '#faad14';
      case 'BORROWED':
        return '#1890ff';
      case 'RETURNED':
        return '#52c41a';
      default:
        return '#666';
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestId}>Request #{item.id?.toString().substring(0, 8)}</Text>
          <Text style={styles.requestUser}>
            {item.requestedBy?.fullName || item.requestedBy?.email || 'Unknown'}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(item.status)}15` }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status || 'PENDING'}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Icon name="inventory-2" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.kit?.kitName || item.kitName || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="category" size={16} color="#666" />
          <Text style={styles.detailText}>
            Type: {item.requestType || 'BORROW_KIT'}
          </Text>
        </View>
        {item.depositAmount && (
          <View style={styles.detailRow}>
            <Icon name="attach-money" size={16} color="#666" />
            <Text style={styles.detailText}>
              Deposit: {item.depositAmount.toLocaleString('vi-VN')} VND
            </Text>
          </View>
        )}
        {item.expectReturnDate && (
          <View style={styles.detailRow}>
            <Icon name="event" size={16} color="#666" />
            <Text style={styles.detailText}>
              Expected Return: {new Date(item.expectReturnDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        )}
        {item.createdAt && (
          <View style={styles.detailRow}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.detailText}>
              Created: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1890ff15' }]}
          onPress={() => handleViewDetails(item)}
        >
          <Icon name="visibility" size={18} color="#1890ff" />
          <Text style={[styles.actionButtonText, { color: '#1890ff' }]}>Details</Text>
        </TouchableOpacity>

        {item.status === 'PENDING' || item.status === 'PENDING_APPROVAL' ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#52c41a15' }]}
              onPress={() => handleApproval(item.id, 'approve')}
            >
              <Icon name="check-circle" size={18} color="#52c41a" />
              <Text style={[styles.actionButtonText, { color: '#52c41a' }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ff4d4f15' }]}
              onPress={() => handleApproval(item.id, 'reject')}
            >
              <Icon name="cancel" size={18} color="#ff4d4f" />
              <Text style={[styles.actionButtonText, { color: '#ff4d4f' }]}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
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
      title="Rental Approvals"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >

      {statusFilter !== 'all' && (
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>Filter: {statusFilter}</Text>
          <TouchableOpacity onPress={() => setStatusFilter('all')}>
            <Icon name="close" size={16} color="#667eea" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadRentalRequests} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No rental requests</Text>
          </View>
        }
      />

      {/* Request Details Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Request Information</Text>
                  <DetailRow label="Request ID" value={`#${selectedRequest.id}`} />
                  <DetailRow
                    label="Status"
                    value={selectedRequest.status || 'PENDING'}
                    valueColor={getStatusColor(selectedRequest.status)}
                  />
                  <DetailRow
                    label="Request Type"
                    value={selectedRequest.requestType || 'BORROW_KIT'}
                  />
                  <DetailRow
                    label="Created Date"
                    value={
                      selectedRequest.createdAt
                        ? new Date(selectedRequest.createdAt).toLocaleString('vi-VN')
                        : selectedRequest.createdDate
                          ? new Date(selectedRequest.createdDate).toLocaleString('vi-VN')
                          : selectedRequest.dateCreated
                            ? new Date(selectedRequest.dateCreated).toLocaleString('vi-VN')
                            : 'N/A'
                    }
                  />
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>User Information</Text>
                  <DetailRow
                    label="Name"
                    value={selectedRequest.requestedBy?.fullName || 'N/A'}
                  />
                  <DetailRow
                    label="Email"
                    value={selectedRequest.requestedBy?.email || 'N/A'}
                  />
                  {selectedRequest.requestedBy?.phone && (
                    <DetailRow
                      label="Phone"
                      value={selectedRequest.requestedBy.phone}
                    />
                  )}
                  {selectedRequest.groupInfo && (
                    <>
                      <DetailRow
                        label="Group"
                        value={selectedRequest.groupInfo.groupName}
                      />
                      <DetailRow
                        label="Class"
                        value={selectedRequest.groupInfo.classCode}
                      />
                      <DetailRow
                        label="Semester"
                        value={selectedRequest.groupInfo.semester}
                      />
                    </>
                  )}
                </View>

                {selectedRequest.requestType === 'BORROW_COMPONENT' ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Component Information</Text>
                    <DetailRow
                      label="Component Name"
                      value={selectedRequest.kitName || 'N/A'}
                    />
                    <DetailRow
                      label="Component ID"
                      value={selectedRequest.componentIds || 'N/A'}
                    />
                  </View>
                ) : (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Kit Information</Text>
                    <DetailRow
                      label="Kit Name"
                      value={selectedRequest.kit?.kitName || selectedRequest.kitName || 'N/A'}
                    />
                    <DetailRow
                      label="Kit ID"
                      value={selectedRequest.kit?.id || selectedRequest.kitId || 'N/A'}
                    />
                    <DetailRow
                      label="Kit Type"
                      value={selectedRequest.kit?.type || 'N/A'}
                    />
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Rental Details</Text>
                  {selectedRequest.depositAmount && (
                    <DetailRow
                      label="Deposit Amount"
                      value={`${selectedRequest.depositAmount.toLocaleString('vi-VN')} VND`}
                    />
                  )}
                  {selectedRequest.expectReturnDate && (
                    <DetailRow
                      label="Expected Return Date"
                      value={new Date(selectedRequest.expectReturnDate).toLocaleDateString('vi-VN')}
                    />
                  )}
                  {selectedRequest.reason && (
                    <DetailRow
                      label="Reason"
                      value={selectedRequest.reason}
                    />
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              {selectedRequest && (selectedRequest.status === 'PENDING' || selectedRequest.status === 'PENDING_APPROVAL') && (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.approveButton]}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleApproval(selectedRequest.id, 'approve');
                    }}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectButton]}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleApproval(selectedRequest.id, 'reject');
                    }}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </AdminLayout>
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
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterChipText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 4,
  },
  requestUser: {
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
  requestDetails: {
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
  requestActions: {
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
    height: '90%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1890ff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1890ff',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  detailRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8c8c8c',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#262626',
    flex: 2,
    textAlign: 'right',
    fontWeight: '400',
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
  approveButton: {
    backgroundColor: '#52c41a',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#ff4d4f',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminApprovals;
