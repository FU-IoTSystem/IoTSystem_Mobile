import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
// Removed react-native-paper imports - using React Native core components
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LeaderLayout from '../../components/LeaderLayout';
import { kitAPI, borrowingRequestAPI, walletAPI, notificationAPI } from '../../services/api';
import dayjs from 'dayjs';

const LeaderRentals = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [kits, setKits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [rentingKit, setRentingKit] = useState(null);
  const [expectReturnDate, setExpectReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [wallet, setWallet] = useState({ balance: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  // Helper function to safely dismiss keyboard
  const dismissKeyboard = () => {
    try {
      if (Keyboard && Keyboard.dismiss && typeof Keyboard.dismiss === 'function') {
        Keyboard.dismiss();
      }
    } catch (error) {
      console.log('Keyboard dismiss error:', error);
    }
  };

  const loadKits = async () => {
    setLoading(true);
    try {
      const kitsResponse = await kitAPI.getStudentKits();
      const kitsData = kitsResponse?.data || kitsResponse || [];
      const mappedKits = kitsData.map(kit => ({
        id: kit.id,
        name: kit.kitName,
        type: kit.type,
        status: kit.status,
        description: kit.description,
        quantityTotal: kit.quantityTotal,
        quantityAvailable: kit.quantityAvailable,
        amount: kit.amount || 0,
      }));
      setKits(mappedKits);
    } catch (error) {
      console.error('Error loading kits:', error);
      setKits([]);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    try {
      const walletResponse = await walletAPI.getMyWallet();
      const walletData = walletResponse?.data || walletResponse || {};
      setWallet({ balance: walletData.balance || 0 });
    } catch (error) {
      console.error('Error loading wallet:', error);
      setWallet({ balance: 0 });
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadKits(), loadWallet()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadKits();
    loadWallet();
  }, []);

  const handleRent = (kit) => {
    setRentingKit(kit);
    setExpectReturnDate('');
    setReason('');
    setShowRentModal(true);
  };

  const handleConfirmRent = async () => {
    if (!rentingKit) return;

    if (!expectReturnDate || expectReturnDate.trim() === '') {
      Alert.alert('Error', 'Please enter expected return date');
      return;
    }

    // Validate date format (YYYY-MM-DD or DD/MM/YYYY)
    let returnDate;
    try {
      if (expectReturnDate.includes('/')) {
        // DD/MM/YYYY format
        const [day, month, year] = expectReturnDate.split('/');
        returnDate = new Date(`${year}-${month}-${day}`);
      } else {
        // YYYY-MM-DD format
        returnDate = new Date(expectReturnDate);
      }
      
      if (isNaN(returnDate.getTime()) || returnDate <= new Date()) {
        Alert.alert('Error', 'Please enter a valid future date');
        return;
      }
    } catch (error) {
      Alert.alert('Error', 'Please enter a valid date (DD/MM/YYYY or YYYY-MM-DD)');
      return;
    }

    if (!reason || reason.trim() === '') {
      Alert.alert('Error', 'Please provide a reason for renting this kit');
      return;
    }

    // Check wallet balance
    const depositAmount = rentingKit.amount || 0;
    if (wallet.balance < depositAmount) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${depositAmount.toLocaleString()} VND but only have ${wallet.balance.toLocaleString()} VND. Please top up your wallet.`
      );
      return;
    }

    dismissKeyboard();
    setSubmitting(true);

    try {
      const requestData = {
        kitId: rentingKit.id,
        accountID: user?.id || user?.accountID || user?.userId,
        reason: reason.trim(),
        expectReturnDate: returnDate.toISOString(),
        requestType: 'BORROW_KIT'
      };

      console.log('Kit rental request data:', requestData);
      console.log('User object:', user);

      if (!requestData.accountID) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        setSubmitting(false);
        return;
      }

      const response = await borrowingRequestAPI.create(requestData);
      console.log('API response:', response);

      if (response) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_REQUEST',
              title: 'Đã gửi yêu cầu thuê kit',
              message: `Bạn đã gửi yêu cầu thuê ${rentingKit.name}.`
            },
            {
              subType: 'BORROW_REQUEST_CREATED',
              title: 'Yêu cầu mượn kit mới',
              message: `${user?.fullName || user?.email || 'Leader'} đã gửi yêu cầu thuê ${rentingKit.name}.`
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending notifications:', notifyError);
        }

        // Check if QR code is in response
        const qrCode = response?.qrCode || response?.data?.qrCode || response?.qrCodeUrl;
        const requestId = response?.id || response?.data?.id;

        setShowRentModal(false);
        
        if (qrCode) {
          setQrCodeData(qrCode);
          setSubmittedRequest({
            id: requestId,
            kitName: rentingKit.name,
            expectReturnDate: returnDate.toISOString(),
          });
          setShowQRModal(true);
        } else {
          setRentingKit(null);
          setExpectReturnDate('');
          setReason('');
          await Promise.all([loadKits(), loadWallet()]);
          setTimeout(() => {
            Alert.alert('Success', 'Kit rental request created successfully! Waiting for admin approval.');
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error creating kit rental request:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      const errorMessage = error.message || error.toString() || 'Unknown error';
      Alert.alert('Error', 'Failed to create kit rental request: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return '#52c41a';
      case 'BORROWED':
        return '#fa8c16';
      case 'DAMAGED':
        return '#ff4d4f';
      case 'MAINTENANCE':
        return '#1890ff';
      default:
        return '#666';
    }
  };

  const renderKitItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.kitCard}
      onPress={() => handleRent(item)}
      disabled={item.quantityAvailable === 0}
    >
      <View style={styles.kitHeader}>
        <View style={[styles.iconContainer, { backgroundColor: '#667eea15' }]}>
          <Icon name="build" size={24} color="#667eea" />
        </View>
        <View style={styles.kitInfo}>
          <Text style={styles.kitName}>{item.name}</Text>
          <Text style={styles.kitType}>{item.type || 'N/A'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.kitDetails}>
        <View style={styles.detailRow}>
          <Icon name="check-circle" size={16} color="#52c41a" />
          <Text style={styles.detailText}>
            Available: {item.quantityAvailable}/{item.quantityTotal}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="attach-money" size={16} color="#faad14" />
          <Text style={styles.detailText}>
            Amount: {item.amount?.toLocaleString() || '0'} VND
          </Text>
        </View>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.rentButton,
          { opacity: item.quantityAvailable === 0 ? 0.5 : 1 }
        ]}
        onPress={() => handleRent(item)}
        disabled={item.quantityAvailable === 0}
      >
        <Icon name="shopping-cart" size={20} color="#fff" />
        <Text style={styles.rentButtonText}>
          {item.quantityAvailable === 0 ? 'Sold Out' : 'Rent Kit'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRentModal = () => {
    if (!showRentModal || !rentingKit) return null;

    const depositAmount = rentingKit.amount || 0;
    const hasEnoughBalance = wallet.balance >= depositAmount;

    return (
      <Modal
        visible={showRentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          dismissKeyboard();
          setShowRentModal(false);
          setRentingKit(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rent Kit</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  dismissKeyboard();
                  setShowRentModal(false);
                  setRentingKit(null);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Kit Information</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{rentingKit.name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{rentingKit.type || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    {depositAmount.toLocaleString()} VND
                  </Text>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Expected Return Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY or YYYY-MM-DD"
                  value={expectReturnDate}
                  onChangeText={setExpectReturnDate}
                  keyboardType="default"
                />
                <Text style={styles.hintText}>
                  Format: DD/MM/YYYY (e.g., 25/12/2024) or YYYY-MM-DD (e.g., 2024-12-25)
                </Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Reason *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder="Please provide reason for renting this kit..."
                  value={reason}
                  onChangeText={setReason}
                />
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Deposit Amount:</Text>
                  <Text style={[styles.summaryValue, { color: hasEnoughBalance ? '#52c41a' : '#ff4d4f' }]}>
                    {depositAmount.toLocaleString()} VND
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Your Balance:</Text>
                  <Text style={[styles.summaryValue, { color: hasEnoughBalance ? '#52c41a' : '#ff4d4f' }]}>
                    {wallet.balance.toLocaleString()} VND
                  </Text>
                </View>
                {!hasEnoughBalance && (
                  <Text style={styles.errorText}>
                    Insufficient balance. Please top up your wallet.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { opacity: hasEnoughBalance && reason.trim() !== '' && expectReturnDate.trim() !== '' && !submitting ? 1 : 0.5 }
                ]}
                onPress={handleConfirmRent}
                disabled={!hasEnoughBalance || reason.trim() === '' || expectReturnDate.trim() === '' || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Rent</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const availableKits = kits.filter(kit => kit.quantityAvailable > 0);

  return (
    <LeaderLayout title="Kit Rental">
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <FlatList
          data={availableKits}
          renderItem={renderKitItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="build" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No kits available</Text>
            </View>
          }
        />
      )}
      {renderRentModal()}
      {renderQRCodeModal()}
    </LeaderLayout>
  );

  function renderQRCodeModal() {
    if (!showQRModal || !qrCodeData) return null;

    return (
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowQRModal(false);
          setQrCodeData(null);
          setSubmittedRequest(null);
          setRentingKit(null);
          setExpectReturnDate('');
          setReason('');
          loadKits();
          loadWallet();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rental Request QR Code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSubmittedRequest(null);
                  setRentingKit(null);
                  setExpectReturnDate('');
                  setReason('');
                  loadKits();
                  loadWallet();
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.qrContainer}>
                {qrCodeData && (
                  typeof qrCodeData === 'string' && qrCodeData.startsWith('http') ? (
                    <Image
                      source={{ uri: qrCodeData }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.qrCodePlaceholder}>
                      <Icon name="qr-code" size={150} color="#667eea" />
                      <Text style={styles.qrCodeText}>{qrCodeData}</Text>
                    </View>
                  )
                )}
              </View>

              {submittedRequest && (
                <View style={styles.requestInfo}>
                  <Text style={styles.infoTitle}>Request Information</Text>
                  {submittedRequest.id && (
                    <Text style={styles.infoText}>Request ID: #{submittedRequest.id}</Text>
                  )}
                  {submittedRequest.kitName && (
                    <Text style={styles.infoText}>Kit: {submittedRequest.kitName}</Text>
                  )}
                  {submittedRequest.expectReturnDate && (
                    <Text style={styles.infoText}>
                      Expected Return: {new Date(submittedRequest.expectReturnDate).toLocaleDateString('vi-VN')}
                    </Text>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSubmittedRequest(null);
                  setRentingKit(null);
                  setExpectReturnDate('');
                  setReason('');
                  loadKits();
                  loadWallet();
                  Alert.alert('Success', 'Kit rental request created successfully!');
                }}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }
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
  kitCard: {
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  kitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  kitInfo: {
    flex: 1,
    marginLeft: 12,
  },
  kitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  kitType: {
    fontSize: 14,
    color: '#666',
  },
  kitDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  rentButton: {
    marginTop: 12,
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
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
  amountValue: {
    color: '#1890ff',
    fontSize: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    color: '#2c3e50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  summarySection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4d4f',
    marginTop: 8,
  },
  confirmButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 20,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrCodeText: {
    marginTop: 16,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  requestInfo: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default LeaderRentals;
