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
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Avatar,
  Button,
  Dialog,
  Portal,
  ActivityIndicator,
} from 'react-native-paper';
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
          borrowDate,
          dueDate,
          returnDate,
          status: normalizedStatus || 'PENDING',
          totalCost: request.totalCost || request.cost || 0,
          depositAmount: request.depositAmount || request.deposit || 0,
          duration: duration ?? 0,
          groupName: request.groupName || request.studentGroupName || request.borrowingGroup?.groupName || 'N/A',
          qrCode: request.qrCode || request.qrCodeUrl || request.data?.qrCode || null,
          raw: request
        };
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
        return '#fa8c16';
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
    <Card 
      style={styles.rentalCard} 
      mode="elevated"
      onPress={() => handleViewDetail(item)}
    >
      <Card.Content>
        <View style={styles.rentalHeader}>
          <View style={styles.rentalTitleContainer}>
            <Avatar.Icon size={40} icon="shopping" style={{ backgroundColor: '#667eea' }} />
            <View style={styles.rentalInfo}>
              <Title style={styles.rentalTitle}>{item.kitName}</Title>
              <Paragraph style={styles.rentalId}>ID: {item.rentalId}</Paragraph>
            </View>
          </View>
          <Chip 
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.rentalDetails}>
          <View style={styles.detailRow}>
            <Avatar.Icon size={24} icon="calendar-clock" style={{ backgroundColor: '#e0e0e0' }} />
            <Paragraph style={styles.detailText}>
              Due: {dayjs(item.dueDate).format('DD/MM/YYYY')}
            </Paragraph>
          </View>
          {item.returnDate && (
            <View style={styles.detailRow}>
              <Avatar.Icon size={24} icon="check-circle" style={{ backgroundColor: '#52c41a' }} />
              <Paragraph style={styles.detailText}>
                Returned: {dayjs(item.returnDate).format('DD/MM/YYYY')}
              </Paragraph>
            </View>
          )}
          <View style={styles.detailRow}>
            <Avatar.Icon size={24} icon="cash" style={{ backgroundColor: '#fa8c16' }} />
            <Paragraph style={styles.detailText}>
              Cost: {item.totalCost?.toLocaleString() || '0'} VND
            </Paragraph>
          </View>
        </View>

        <View style={styles.rentalFooter}>
          <Button
            mode="text"
            icon="chevron-right"
            onPress={() => handleViewDetail(item)}
          >
            View Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDetailModal = () => {
    if (!showDetail || !selectedRental) return null;

    return (
      <Portal>
        <Dialog
          visible={showDetail}
          onDismiss={() => setShowDetail(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Rental Details</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogContent}>
              <Card style={styles.detailSection} mode="outlined">
                <Card.Title title="Kit Information" />
                <Card.Content>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Kit Name:</Paragraph>
                    <Title style={styles.detailValue}>{selectedRental.kitName}</Title>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Request Type:</Paragraph>
                    <Chip style={styles.chip}>{selectedRental.requestType}</Chip>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Rental ID:</Paragraph>
                    <Paragraph style={styles.detailValue}>{selectedRental.rentalId}</Paragraph>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.detailSection} mode="outlined">
                <Card.Title title="Dates" />
                <Card.Content>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Borrow Date:</Paragraph>
                    <Paragraph style={styles.detailValue}>
                      {dayjs(selectedRental.borrowDate).format('DD/MM/YYYY HH:mm')}
                    </Paragraph>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Due Date:</Paragraph>
                    <Paragraph style={styles.detailValue}>
                      {dayjs(selectedRental.dueDate).format('DD/MM/YYYY HH:mm')}
                    </Paragraph>
                  </View>
                  {selectedRental.returnDate && (
                    <View style={styles.detailItem}>
                      <Paragraph style={styles.detailLabel}>Return Date:</Paragraph>
                      <Paragraph style={styles.detailValue}>
                        {dayjs(selectedRental.returnDate).format('DD/MM/YYYY HH:mm')}
                      </Paragraph>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Duration:</Paragraph>
                    <Paragraph style={styles.detailValue}>{selectedRental.duration} days</Paragraph>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.detailSection} mode="outlined">
                <Card.Title title="Financial" />
                <Card.Content>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Total Cost:</Paragraph>
                    <Title style={[styles.detailValue, styles.costValue]}>
                      -{selectedRental.totalCost?.toLocaleString() || '0'} VND
                    </Title>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Deposit Amount:</Paragraph>
                    <Paragraph style={[styles.detailValue, { color: '#ff4d4f', fontSize: 16 }]}>
                      -{selectedRental.depositAmount?.toLocaleString() || '0'} VND
                    </Paragraph>
                  </View>
                </Card.Content>
              </Card>

              {selectedRental.qrCode && (
                <Card style={styles.detailSection} mode="outlined">
                  <Card.Title title="QR Code" />
                  <Card.Content>
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
                            <Avatar.Icon size={80} icon="qr-code-2" style={{ backgroundColor: '#667eea' }} />
                            <Paragraph style={styles.qrCodeText}>
                              {qrCode.length > 50 ? `${qrCode.substring(0, 50)}...` : qrCode}
                            </Paragraph>
                          </View>
                        );
                      })()}
                    </View>
                    {selectedRental.qrCode && typeof selectedRental.qrCode === 'string' && (
                      <View style={styles.detailItem}>
                        <Paragraph style={styles.detailLabel}>QR Code Data:</Paragraph>
                        <Paragraph style={[styles.detailValue, styles.qrCodeData]}>
                          {selectedRental.qrCode.length > 100 
                            ? `${selectedRental.qrCode.substring(0, 100)}...` 
                            : selectedRental.qrCode}
                        </Paragraph>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowDetail(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  return (
    <LecturerLayout title="Borrow Status">
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
            <Avatar.Icon size={64} icon="shopping" style={{ backgroundColor: '#ccc' }} />
            <Paragraph style={styles.emptyText}>No rentals found</Paragraph>
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
  },
  listContainer: {
    padding: 16,
  },
  rentalCard: {
    marginBottom: 16,
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
  rentalInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rentalTitle: {
    fontSize: 16,
  },
  rentalId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rentalDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  rentalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  dialog: {
    maxHeight: '90%',
  },
  dialogContent: {
    paddingHorizontal: 16,
  },
  detailSection: {
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
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  costValue: {
    color: '#ff4d4f',
    fontSize: 18,
  },
  chip: {
    backgroundColor: '#667eea',
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
});

export default LecturerRentals;
