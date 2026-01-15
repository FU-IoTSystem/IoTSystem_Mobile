import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
  Image,
  TouchableOpacity,
  Text,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LecturerLayout from '../../components/LecturerLayout';
import { borrowingRequestAPI } from '../../services/api';
import dayjs from 'dayjs';

const LecturerRentals = ({ user, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [borrowStatus, setBorrowStatus] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const loadBorrowRequests = async () => {
    if (!user || !user.id) {
      console.warn('User or user.id is missing');
      return;
    }

    setLoading(true);
    try {
      console.log('Loading borrow requests for lecturer:', user.id);
      const borrowRequests = await borrowingRequestAPI.getByUser(user.id);
      console.log('Borrow requests raw data:', borrowRequests);

      const mappedBorrowStatus = (Array.isArray(borrowRequests) ? borrowRequests : []).map((request) => {
        const borrowDate = request.borrowDate || request.startDate || request.createdAt;
        const dueDate = request.dueDate || request.expectReturnDate;
        const returnDate = request.returnDate || request.actualReturnDate || null;
        const normalizedStatus = (request.status || '').toUpperCase();
        const createdAt = request.createdAt || request.borrowDate || request.startDate;

        let duration = request.duration;
        if (!duration && borrowDate && (returnDate || dueDate)) {
          const start = dayjs(borrowDate);
          const end = dayjs(returnDate || dueDate);
          if (start.isValid() && end.isValid()) {
            const diff = end.diff(start, 'day');
            duration = diff >= 0 ? diff : 0;
          }
        }

        return {
          id: request.id || request.requestId || request.borrowingRequestId || request.rentalId || request.code,
          kitName: request.kitName || request.kit?.kitName || 'Unknown Kit',
          requestType: request.requestType || request.type || 'BORROW_KIT',
          rentalId: request.requestCode || request.rentalId || request.id || request.code || 'N/A',
          reason: request.reason || '',
          borrowDate,
          dueDate,
          returnDate,
          status: normalizedStatus || 'PENDING',
          totalCost: request.totalCost || request.cost || 0,
          depositAmount: request.depositAmount || request.deposit || 0,
          duration: duration ?? 0,
          qrCode: request.qrCode || request.qrCodeUrl || request.data?.qrCode || null,
          createdAt,
          raw: request
        };
      }).sort((a, b) => {
        // Sort descending by createdAt; fallback to recent entries if missing
        const dateA = dayjs(a.createdAt || a.borrowDate || a.dueDate);
        const dateB = dayjs(b.createdAt || b.borrowDate || b.dueDate);
        if (!dateA.isValid() && !dateB.isValid()) return 0;
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;
        return dateB.valueOf() - dateA.valueOf();
      });

      console.log('Mapped borrow status data:', mappedBorrowStatus);
      setBorrowStatus(mappedBorrowStatus);
    } catch (error) {
      console.error('Error loading borrow requests:', error);
      setBorrowStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadBorrowRequests();
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBorrowRequests();
    }
  }, [user]);

  const handleViewDetail = (rental) => {
    setSelectedRental(rental);
    setShowDetail(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
      case 'BORROWED':
        return '#52c41a';
      case 'PENDING':
      case 'WAITING_APPROVAL':
        return '#faad14';
      case 'REJECTED':
      case 'CANCELLED':
        return '#ff4d4f';
      case 'RETURNED':
      case 'COMPLETED':
        return '#1890ff';
      case 'OVERDUE':
        return '#722ed1';
      default:
        return '#666';
    }
  };

  const renderRentalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rentalCard}
      onPress={() => handleViewDetail(item)}
    >
      <View style={styles.rentalHeader}>
        <View style={styles.rentalTitleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: '#667eea15' }]}>
            <Icon name="shopping-cart" size={24} color="#667eea" />
          </View>
          <View style={styles.rentalInfo}>
            <Text style={styles.rentalTitle}>{item.kitName}</Text>
            <Text style={styles.rentalId}>ID: {item.rentalId}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.rentalDetails}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.detailText}>
            Due: {item.dueDate ? dayjs(item.dueDate).format('DD/MM/YYYY') : 'N/A'}
          </Text>
        </View>
        {item.returnDate && (
          <View style={styles.detailRow}>
            <Icon name="check-circle" size={16} color="#52c41a" />
            <Text style={styles.detailText}>
              Returned: {dayjs(item.returnDate).format('DD/MM/YYYY')}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Icon name="attach-money" size={16} color="#faad14" />
          <Text style={styles.detailText}>
            Cost: {item.totalCost?.toLocaleString() || '0'} VND
          </Text>
        </View>
      </View>

      <View style={styles.rentalFooter}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewDetail(item)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Icon name="chevron-right" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!showDetail || !selectedRental) return null;

    return (
      <Modal
        visible={showDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rental Details</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {/* Kit Information */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Kit Information</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Kit Name:</Text>
                  <Text style={styles.detailValue}>{selectedRental.kitName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.badge, { backgroundColor: `${getStatusColor(selectedRental.status)}15` }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(selectedRental.status) }]}>
                      {selectedRental.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Request Type:</Text>
                  <View style={[styles.badge, { backgroundColor: '#1890ff15' }]}>
                    <Text style={[styles.badgeText, { color: '#1890ff' }]}>
                      {selectedRental.requestType}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rental ID:</Text>
                  <Text style={styles.detailValue}>{selectedRental.rentalId}</Text>
                </View>
                {selectedRental.reason ? (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Reason:</Text>
                    <Text style={[styles.detailValue, styles.reasonValue]} numberOfLines={2}>
                      {selectedRental.reason}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Dates */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Dates</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Borrow Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedRental.borrowDate ? dayjs(selectedRental.borrowDate).format('DD/MM/YYYY HH:mm') : 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedRental.dueDate ? dayjs(selectedRental.dueDate).format('DD/MM/YYYY HH:mm') : 'N/A'}
                  </Text>
                </View>
                {selectedRental.returnDate && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Return Date:</Text>
                    <Text style={styles.detailValue}>
                      {dayjs(selectedRental.returnDate).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{selectedRental.duration} days</Text>
                </View>
              </View>

              {/* Financial */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Financial</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Cost:</Text>
                  <Text style={[styles.detailValue, styles.costValue]}>
                    -{selectedRental.totalCost?.toLocaleString() || '0'} VND
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Deposit Amount:</Text>
                  <Text style={styles.detailValue}>
                    {selectedRental.depositAmount?.toLocaleString() || '0'} VND
                  </Text>
                </View>
              </View>

              {/* QR Code */}
              {selectedRental.qrCode && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>QR Code</Text>
                  <View style={styles.qrCodeContainer}>
                    {(() => {
                      const qrCode = selectedRental.qrCode;
                      // Check if it's a URL (http/https)
                      if (typeof qrCode === 'string' && (qrCode.startsWith('http://') || qrCode.startsWith('https://'))) {
                        return (
                          <Image
                            source={{ uri: qrCode }}
                            style={styles.qrCodeImage}
                            resizeMode="contain"
                          />
                        );
                      }
                      // Check if it's a data URI (base64 encoded image)
                      if (typeof qrCode === 'string' && qrCode.startsWith('data:image')) {
                        return (
                          <Image
                            source={{ uri: qrCode }}
                            style={styles.qrCodeImage}
                            resizeMode="contain"
                          />
                        );
                      }
                      // Check if it's base64 string without data URI prefix
                      if (typeof qrCode === 'string' && qrCode.length > 100 && /^[A-Za-z0-9+/=]+$/.test(qrCode)) {
                        // Assume it's PNG base64
                        const dataUri = `data:image/png;base64,${qrCode}`;
                        return (
                          <Image
                            source={{ uri: dataUri }}
                            style={styles.qrCodeImage}
                            resizeMode="contain"
                          />
                        );
                      }
                      // Otherwise show as text with icon
                      return (
                        <View style={styles.qrCodePlaceholder}>
                          <Icon name="qr-code-2" size={80} color="#667eea" />
                          <Text style={styles.qrCodeText}>
                            {qrCode.length > 50 ? `${qrCode.substring(0, 50)}...` : qrCode}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetail(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LecturerLayout title="Borrow Tracking">
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <FlatList
          data={borrowStatus}
          renderItem={renderRentalItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="shopping-cart" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No rentals found</Text>
            </View>
          }
        />
      )}
      {renderDetailModal()}
    </LecturerLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  rentalCard: {
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
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rentalTitleContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rentalInfo: {
    flex: 1,
  },
  rentalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  rentalId: {
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
  rentalDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  rentalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
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
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
  reasonValue: {
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  costValue: {
    color: '#ff4d4f',
    fontSize: 18,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrCodeText: {
    marginTop: 12,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  qrCodeData: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#667eea',
    flexWrap: 'wrap',
  },
  closeButton: {
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LecturerRentals;
