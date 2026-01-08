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
import AdminLayout from '../../components/AdminLayout';
import { borrowingRequestAPI, kitAPI, penaltiesAPI, penaltyDetailAPI, notificationAPI, userAPI, borrowingGroupAPI, studentGroupAPI, classesAPI } from '../../services/api';

const AdminReturnKits = ({ onLogout, route }) => {
  const navigation = useNavigation();
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [inspectionModalVisible, setInspectionModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedKit, setSelectedKit] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [damageAssessment, setDamageAssessment] = useState({});
  const [fineAmount, setFineAmount] = useState(0);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [kits, setKits] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadRefundRequests();
    loadKits();
    loadUsers();
  }, []);

  // Handle auto-open request when navigated from QR scan
  useEffect(() => {
    const autoOpenRequest = async () => {
      if (route?.params?.requestId && route?.params?.autoOpen && !loading) {
        // Wait for data to load first
        if (refundRequests.length > 0 && kits.length > 0 && users.length > 0) {
          const requestId = route.params.requestId;
          const request = refundRequests.find(req =>
            req.id?.toString() === requestId?.toString() || req.id === requestId
          );

          if (request) {
            // Auto-open the inspection modal for this request
            await openKitInspection(request);

            // Clear the params to avoid reopening on subsequent renders
            navigation.setParams({ requestId: undefined, autoOpen: undefined });
          }
        }
      }
    };

    autoOpenRequest();
  }, [route?.params?.requestId, route?.params?.autoOpen, refundRequests.length, kits.length, users.length, loading]);

  const loadKits = async () => {
    try {
      const kitsResponse = await kitAPI.getAllKits();
      const kitsData = Array.isArray(kitsResponse)
        ? kitsResponse
        : (kitsResponse?.data || []);
      setKits(kitsData);
    } catch (error) {
      console.error('Error loading kits:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await userAPI.getAllAccounts(0, 100);
      if (usersData && usersData.length > 0) {
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadRefundRequests = async () => {
    setLoading(true);
    try {
      // Get all approved requests (these are the ones that need to be returned)
      const approvedResponse = await borrowingRequestAPI.getApproved();

      // Transform approved requests to refund request format
      const refundRequestsData = approvedResponse.map(request => ({
        id: request.id,
        rentalId: request.id,
        kitName: request.kit?.kitName || request.kitName || 'N/A',
        kitId: request.kit?.id || request.kitId,
        userEmail: request.requestedBy?.email || request.userEmail || 'N/A',
        userName: request.requestedBy?.fullName || request.userName || request.userEmail?.split('@')[0] || 'Unknown',
        status: request.status || 'APPROVED',
        approvedDate: request.approvedDate || request.createdAt,
        expectReturnDate: request.expectReturnDate,
        depositAmount: request.depositAmount || 0,
        requestType: request.requestType || 'BORROW_KIT',
        raw: request
      }));

      setRefundRequests(refundRequestsData);
    } catch (error) {
      console.error('Error loading refund requests:', error);
      Alert.alert('Error', 'Failed to load return requests');
      setRefundRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGroupInfo = async (userId, userEmail) => {
    // Determine accountId
    const accountId = userId || users.find(u => u.email === userEmail)?.id;

    if (!accountId) return null;

    try {
      const groups = await borrowingGroupAPI.getByAccountId(accountId);
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
                  // Handle different response structures
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
    } catch (err) {
      console.log('Error fetching group info:', err);
    }
    return null;
  };

  const handleOpenDetail = async (item) => {
    setLoading(true); // temporary loading indicator for details
    try {
      const groupInfo = await fetchStudentGroupInfo(item.requestedBy?.id || item.userId, item.userEmail);
      setSelectedRequest({
        ...item,
        groupInfo
      });
      setDetailModalVisible(true);
    } catch (error) {
      console.error('Error opening detail:', error);
      // Fallback to showing what we have
      setSelectedRequest(item);
      setDetailModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const openKitInspection = async (refundRequest) => {
    console.log('Opening kit inspection for:', refundRequest);

    const isComponentRental = refundRequest.requestType === 'BORROW_COMPONENT';

    // Find the kit
    let kit = kits.find(k =>
      k.kitName === refundRequest.kitName ||
      k.name === refundRequest.kitName
    );

    if (!kit) {
      console.log('Kit not found, creating virtual kit context for inspection');
      // Always create virtual kit if not found to allow inspection (removes validation blocking)
      kit = {
        id: 'virtual-kit-context',
        kitName: refundRequest.kitName || 'Individual Components',
        name: refundRequest.kitName || 'Individual Components',
        type: 'COMPONENT',
        components: [],
        status: 'AVAILABLE'
      };
    }

    // Create a rental-like object for the refund request
    const rentalObject = {
      id: refundRequest.id || refundRequest.rentalId,
      kitId: kit.id,
      kitName: refundRequest.kitName,
      userEmail: refundRequest.userEmail,
      userName: refundRequest.userName || refundRequest.userEmail?.split('@')[0] || 'Unknown',
      status: refundRequest.status,
      totalCost: refundRequest.depositAmount || 0,
      requestType: refundRequest.requestType,
      raw: refundRequest.raw || refundRequest
    };

    let kitToUse = kit;

    // If component rental, fetch the rented components
    if (isComponentRental) {
      try {
        const rentedComponents = await borrowingRequestAPI.getRequestComponents(refundRequest.id);

        if (rentedComponents && rentedComponents.length > 0) {
          const actualComponents = rentedComponents.map(rc => {
            const actualComp = kit.components?.find(c =>
              c.id === rc.kitComponentsId || c.componentName === rc.componentName
            );
            return actualComp ? {
              ...actualComp,
              rentedQuantity: rc.quantity,
              componentName: rc.componentName
            } : {
              componentName: rc.componentName,
              name: rc.componentName,
              quantity: rc.quantity,
              rentedQuantity: rc.quantity
            };
          });

          kitToUse = {
            ...kit,
            components: actualComponents.length > 0 ? actualComponents : kit.components
          };
        }
      } catch (error) {
        console.error('Error fetching rented components:', error);
      }
    }

    // Fetch group/class info using helper
    const groupInfo = await fetchStudentGroupInfo(refundRequest.requestedBy?.id || refundRequest.userId, refundRequest.userEmail);

    setSelectedRental({
      ...rentalObject,
      groupInfo: groupInfo
    });
    setSelectedKit(kitToUse);
    setDamageAssessment(refundRequest.damageAssessment || {});
    setFineAmount(0);
    setInspectionModalVisible(true);
  };

  const handleComponentDamage = (componentName, isDamaged, componentPrice = 0, quantity = 1) => {
    setDamageAssessment(prev => {
      const newAssessment = {
        ...prev,
        [componentName]: {
          damaged: isDamaged,
          quantity: isDamaged ? quantity : 0,
          value: isDamaged ? (componentPrice * quantity) : 0
        }
      };

      // Calculate fine amount
      let totalFine = 0;
      Object.values(newAssessment).forEach(component => {
        if (component && component.damaged) {
          totalFine += component.value || 0;
        }
      });

      setFineAmount(totalFine);
      return newAssessment;
    });
  };

  const submitKitInspection = async () => {
    setInspectionLoading(true);
    let totalFine = fineAmount;

    try {
      // Create penalty if there's damage
      let penaltyCreated = false;
      if (totalFine > 0 && Object.keys(damageAssessment).length > 0) {
        try {
          const penaltyData = {
            semester: new Date().getFullYear() + '-' + (new Date().getMonth() < 6 ? 'SPRING' : 'FALL'),
            takeEffectDate: new Date(),
            kitType: selectedKit?.type || 'STUDENT_KIT',
            resolved: false,
            note: 'Kit returned with damage',
            totalAmount: totalFine,
            borrowRequestId: selectedRental?.id,
            accountId: users.find(u => u.email === selectedRental?.userEmail)?.id,
            policyId: null
          };

          const penaltyResponse = await penaltiesAPI.create(penaltyData);
          const penaltyId = penaltyResponse?.id || penaltyResponse?.data?.id;

          if (penaltyId) {
            // Create penalty details for each damaged component
            const penaltyDetails = Object.entries(damageAssessment)
              .filter(([_, component]) => component && component.damaged)
              .map(([componentName, component]) => ({
                penaltyId: penaltyId,
                amount: component.value || 0,
                description: `Damage to ${componentName}`,
                kitComponentId: selectedKit?.components?.find(c =>
                  c.componentName === componentName || c.name === componentName
                )?.id || null
              }));

            if (penaltyDetails.length > 0) {
              await penaltyDetailAPI.createMultiple(penaltyDetails);
            }

            penaltyCreated = true;
          }
        } catch (penaltyError) {
          console.error('Error creating penalty:', penaltyError);
          Alert.alert('Error', 'Failed to create penalty. Please try again.');
          setInspectionLoading(false);
          return;
        }
      }

      // Update borrowing request status to RETURNED
      const actualReturnDateStr = new Date().toISOString();
      let isLate = false;

      if (selectedRental?.raw?.expectReturnDate) {
        const dueDay = new Date(selectedRental.raw.expectReturnDate);
        const returnDay = new Date(actualReturnDateStr);
        if (returnDay > dueDay) {
          isLate = true;
        }
      }

      await borrowingRequestAPI.update(selectedRental.id, {
        status: 'RETURNED',
        actualReturnDate: actualReturnDateStr,
        isLate: isLate
      });

      // Send notification
      const targetAccountId = users.find(u => u.email === selectedRental?.userEmail)?.id;
      if (targetAccountId) {
        try {
          await notificationAPI.createNotifications([{
            subType: totalFine > 0 ? 'UNPAID_PENALTY' : 'OVERDUE_RETURN',
            userId: targetAccountId,
            title: totalFine > 0 ? 'Bạn có khoản phạt mới' : 'Trả kit thành công',
            message: totalFine > 0
              ? `Kit ${selectedKit?.kitName || ''} có phát sinh khoản phạt ${totalFine.toLocaleString()} VND. Vui lòng kiểm tra và thanh toán.`
              : `Kit ${selectedKit?.kitName || ''} đã được check-in thành công.`
          }]);
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }

      Alert.alert(
        'Success',
        totalFine > 0
          ? `Kit inspection completed. Fine of ${totalFine.toLocaleString()} VND has been created.`
          : 'Kit returned successfully. Deposit will be refunded if no penalty exists.'
      );

      // Close modal and refresh
      setInspectionModalVisible(false);
      setSelectedKit(null);
      setSelectedRental(null);
      setDamageAssessment({});
      setFineAmount(0);
      await loadRefundRequests();
    } catch (error) {
      console.error('Error during checkin process:', error);
      Alert.alert('Error', 'Failed to complete kit inspection');
    } finally {
      setInspectionLoading(false);
    }
  };

  // Filter refund requests
  const filteredRequests = refundRequests.filter(request => {
    // Filter by search text
    if (searchText && searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      const userName = (request.userName || '').toLowerCase();
      const userEmail = (request.userEmail || '').toLowerCase();
      const kitName = (request.kitName || '').toLowerCase();
      const requestId = request.id?.toString().toLowerCase() || '';

      if (!userName.includes(searchLower) &&
        !userEmail.includes(searchLower) &&
        !kitName.includes(searchLower) &&
        !requestId.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return new Date(dateTimeString).toLocaleString('vi-VN');
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return '#52c41a';
      case 'RETURNED':
        return '#1890ff';
      case 'REJECTED':
        return '#ff4d4f';
      default:
        return '#666';
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestId}>#{String(item.id).substring(0, 8)}...</Text>
          <Text style={styles.userName}>{item.userName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status || 'APPROVED'}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Icon name="build" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.requestType === 'BORROW_COMPONENT' ? 'Component' : 'Full Kit'}: {item.kitName}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="calendar-today" size={16} color="#666" />
          <Text style={styles.detailText}>
            Borrowed: {formatDateTime(item.approvedDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.detailText}>
            Expected Return: {formatDateTime(item.expectReturnDate)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="account-circle" size={16} color="#666" />
          <Text style={styles.detailText}>{item.userEmail}</Text>
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1890ff15' }]}
          onPress={() => handleOpenDetail(item)}
        >
          <Icon name="info" size={18} color="#1890ff" />
          <Text style={[styles.actionButtonText, { color: '#1890ff' }]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#52c41a15' }]}
          onPress={() => openKitInspection(item)}
        >
          <Icon name="check-circle" size={18} color="#52c41a" />
          <Text style={[styles.actionButtonText, { color: '#52c41a' }]}>Checkin Kit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <AdminLayout
      title="Return Checking"
      rightAction={{
        icon: 'refresh',
      }}
      onRightAction={loadRefundRequests}
    >
      {/* Search Section */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user, kit, or request ID..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadRefundRequests} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="assignment-returned" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText
                ? 'No requests match your search'
                : 'No return requests available'}
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredRequests.length > 0 ? (
            <View style={styles.footerText}>
              <Text style={styles.footerTextContent}>
                Showing {filteredRequests.length} of {refundRequests.length} request(s)
              </Text>
            </View>
          ) : null
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
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailsSection}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Request ID:</Text>
                    <Text style={styles.detailsValue}>#{selectedRequest.id}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>User Name:</Text>
                    <Text style={styles.detailsValue}>{selectedRequest.userName}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>User Email:</Text>
                    <Text style={styles.detailsValue}>{selectedRequest.userEmail}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Type:</Text>
                    <View style={[
                      styles.badge,
                      { backgroundColor: selectedRequest.requestType === 'BORROW_COMPONENT' ? '#faad1415' : '#1890ff15' }
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        { color: selectedRequest.requestType === 'BORROW_COMPONENT' ? '#faad14' : '#1890ff' }
                      ]}>
                        {selectedRequest.requestType === 'BORROW_COMPONENT' ? 'Component' : 'Full Kit'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Kit/Component:</Text>
                    <Text style={styles.detailsValue}>{selectedRequest.kitName}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Kit ID:</Text>
                    <Text style={styles.detailsValue}>{selectedRequest.kitId || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Group:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedRequest.groupInfo?.groupName || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Class:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedRequest.groupInfo?.classCode || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Semester:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedRequest.groupInfo?.semester || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Reason:</Text>
                    <Text style={styles.detailsValue}>
                      {(selectedRequest.raw?.borrowReason || selectedRequest.raw?.reason)
                        ? (selectedRequest.raw?.borrowReason || selectedRequest.raw?.reason)
                        : (selectedRequest.requestType === 'BORROW_COMPONENT' ? 'Component Rental' : 'N/A')}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Borrow Date:</Text>
                    <Text style={styles.detailsValue}>{formatDateTime(selectedRequest.approvedDate)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Expected Return:</Text>
                    <Text style={styles.detailsValue}>{formatDateTime(selectedRequest.expectReturnDate)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Deposit Amount:</Text>
                    <Text style={[styles.detailsValue, { color: '#52c41a', fontWeight: 'bold' }]}>
                      {selectedRequest.depositAmount?.toLocaleString('vi-VN') || 0} VND
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Status:</Text>
                    <View style={[
                      styles.badge,
                      { backgroundColor: `${getStatusColor(selectedRequest.status)}15` }
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        { color: getStatusColor(selectedRequest.status) }
                      ]}>
                        {selectedRequest.status || 'APPROVED'}
                      </Text>
                    </View>
                  </View>
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
            </View>
          </View>
        </View>
      </Modal>

      {/* Kit Inspection Modal */}
      <Modal
        visible={inspectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!inspectionLoading) {
            setInspectionModalVisible(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kit Inspection</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!inspectionLoading) {
                    setInspectionModalVisible(false);
                  }
                }}
                disabled={inspectionLoading}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedKit && selectedRental && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.inspectionSection}>
                  <Text style={styles.sectionTitle}>Kit Information</Text>

                  {/* Basic Info */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Rental ID:</Text>
                    <Text style={styles.detailsValue}>#{selectedRental.id}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Type:</Text>
                    <View style={[
                      styles.badge,
                      { backgroundColor: selectedRental.requestType === 'BORROW_COMPONENT' ? '#faad1415' : '#1890ff15' }
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        { color: selectedRental.requestType === 'BORROW_COMPONENT' ? '#faad14' : '#1890ff' }
                      ]}>
                        {selectedRental.requestType === 'BORROW_COMPONENT' ? 'Component' : 'Full Kit'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Kit Name:</Text>
                    <Text style={styles.detailsValue}>{selectedKit.kitName || selectedKit.name}</Text>
                  </View>

                  {/* User Info */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>User:</Text>
                    <Text style={styles.detailsValue}>{selectedRental.userName}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Email:</Text>
                    <Text style={styles.detailsValue}>{selectedRental.userEmail}</Text>
                  </View>

                  {/* Group & Class Info */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Group:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedRental.groupInfo?.groupName || selectedRental.raw?.groupName || selectedRental.raw?.group?.groupName || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Class:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedRental.groupInfo?.classCode || selectedRental.raw?.classCode || selectedRental.raw?.class?.classCode || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Semester:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedRental.groupInfo?.semester || selectedRental.raw?.semester || selectedRental.raw?.class?.semester || 'N/A'}
                    </Text>
                  </View>

                  {/* Dates */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Request Date:</Text>
                    <Text style={styles.detailsValue}>{formatDateTime(selectedRental.raw?.createdAt)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Approval Date:</Text>
                    <Text style={styles.detailsValue}>{formatDateTime(selectedRental.raw?.approvedDate)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Expected Return:</Text>
                    <Text style={styles.detailsValue}>{formatDateTime(selectedRental.raw?.expectReturnDate)}</Text>
                  </View>

                  {/* Duration / Lateness */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Return Status:</Text>
                    {(() => {
                      const now = new Date();
                      const expectDate = selectedRental.raw?.expectReturnDate ? new Date(selectedRental.raw.expectReturnDate) : null;

                      if (!expectDate) return <Text style={styles.detailsValue}>N/A</Text>;

                      const diffTime = expectDate - now;
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isLate = diffDays < 0;

                      return (
                        <View style={{ flex: 2, alignItems: 'flex-end' }}>
                          <View style={[
                            styles.badge,
                            { backgroundColor: isLate ? '#ff4d4f15' : '#52c41a15' }
                          ]}>
                            <Text style={[
                              styles.badgeText,
                              { color: isLate ? '#ff4d4f' : '#52c41a' }
                            ]}>
                              {isLate ? `Late by ${Math.abs(diffDays)} day(s)` : `On time (${diffDays} days left)`}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Reason */}
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Reason:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedRental.raw?.borrowReason || selectedRental.raw?.reason || 'N/A'}
                    </Text>
                  </View>

                </View>

                <View style={styles.inspectionSection}>
                  <Text style={styles.sectionTitle}>Component Inspection</Text>
                  {selectedKit.components && selectedKit.components.length > 0 ? (
                    selectedKit.components.map((component, index) => {
                      const componentName = component.componentName || component.name || `Component ${index + 1}`;
                      const isDamaged = damageAssessment[componentName]?.damaged || false;
                      const componentPrice = component.pricePerCom || component.price || 0;
                      const damageValue = damageAssessment[componentName]?.value || (isDamaged ? componentPrice : 0);

                      return (
                        <View key={component.id || index} style={styles.componentInspectionItem}>
                          <View style={styles.componentInfo}>
                            <Text style={styles.componentName}>{componentName}</Text>
                            <Text style={styles.componentDetails}>
                              Type: {component.componentType || 'N/A'} | Qty: {component.rentedQuantity || component.quantityTotal || 0}
                            </Text>
                            {componentPrice > 0 && (
                              <Text style={[styles.componentDetails, { color: '#1890ff', marginTop: 4 }]}>
                                Price: {componentPrice.toLocaleString('vi-VN')} VND
                              </Text>
                            )}
                          </View>

                          <View style={styles.damageControls}>
                            <TouchableOpacity
                              style={[
                                styles.damageButton,
                                isDamaged && styles.damageButtonActive
                              ]}
                              onPress={() => handleComponentDamage(componentName, !isDamaged, componentPrice, 1)}
                            >
                              <Text style={[
                                styles.damageButtonText,
                                isDamaged && styles.damageButtonTextActive
                              ]}>
                                {isDamaged ? 'Damaged' : 'OK'}
                              </Text>
                            </TouchableOpacity>
                            {isDamaged && (
                              <View style={styles.damageInputContainer}>
                                <Text style={styles.damageLabel}>Qty:</Text>
                                <TextInput
                                  style={styles.damageQtyInput}
                                  value={damageAssessment[componentName]?.quantity ? String(damageAssessment[componentName].quantity) : ''}
                                  keyboardType="numeric"
                                  onChangeText={(text) => {
                                    if (text === '') {
                                      handleComponentDamage(componentName, true, componentPrice, 0);
                                      return;
                                    }
                                    const newQty = parseInt(text);
                                    if (isNaN(newQty)) return;

                                    const maxQty = component.rentedQuantity || component.quantityTotal || 1;
                                    // Only clamp max, allow 0/empty during typing
                                    const validQty = Math.min(newQty, maxQty);
                                    handleComponentDamage(componentName, true, componentPrice, validQty);
                                  }}
                                  onEndEditing={() => {
                                    // Enforce minimum 1 on blur
                                    const currentQty = damageAssessment[componentName]?.quantity || 0;
                                    if (currentQty < 1) {
                                      handleComponentDamage(componentName, true, componentPrice, 1);
                                    }
                                  }}
                                />
                                <Text style={styles.damageValueText}>
                                  x {componentPrice.toLocaleString('vi-VN')} = {(damageValue).toLocaleString('vi-VN')}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noComponentsText}>No components to inspect</Text>
                  )}
                </View>

                {fineAmount > 0 && (
                  <View style={styles.fineSection}>
                    <Text style={styles.fineLabel}>Total Fine Amount:</Text>
                    <Text style={styles.fineAmount}>
                      {fineAmount.toLocaleString('vi-VN')} VND
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  if (!inspectionLoading) {
                    setInspectionModalVisible(false);
                    setSelectedKit(null);
                    setSelectedRental(null);
                    setDamageAssessment({});
                    setFineAmount(0);
                  }
                }}
                disabled={inspectionLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitKitInspection}
                disabled={inspectionLoading}
              >
                <Text style={styles.submitButtonText}>
                  {inspectionLoading ? 'Processing...' : 'Submit Inspection'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AdminLayout >
  );
};

const styles = StyleSheet.create({
  searchFilterContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#2c3e50',
  },
  clearButton: {
    padding: 4,
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
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
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
  footerText: {
    padding: 16,
    alignItems: 'center',
  },
  footerTextContent: {
    fontSize: 12,
    color: '#999',
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
    maxHeight: 500,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
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
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  closeButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inspectionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1890ff',
  },
  componentInspectionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  componentInfo: {
    marginBottom: 8,
  },
  componentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  componentDetails: {
    fontSize: 12,
    color: '#999',
  },
  damageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  damageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  damageButtonActive: {
    backgroundColor: '#ff4d4f15',
    borderColor: '#ff4d4f',
  },
  damageButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  damageButtonTextActive: {
    color: '#ff4d4f',
  },
  damageValueInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  damageValueContainer: {
    flex: 1,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd591',
  },
  damageValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff4d4f',
    marginLeft: 8,
  },
  damageInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd591',
  },
  damageLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  damageQtyInput: {
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    width: 40,
    textAlign: 'center',
    color: '#333',
  },
  noComponentsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  fineSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    marginTop: 16,
  },
  fineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  fineAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  submitButton: {
    backgroundColor: '#52c41a',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminReturnKits;
