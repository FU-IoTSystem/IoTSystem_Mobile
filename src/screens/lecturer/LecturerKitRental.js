import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  Image,
  ActivityIndicator as RNActivityIndicator,
  Keyboard,
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
import { kitAPI, borrowingRequestAPI, walletAPI, notificationAPI } from '../../services/api';
import dayjs from 'dayjs';

const LecturerKitRental = ({ user, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [kits, setKits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [showKitDetail, setShowKitDetail] = useState(false);
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
      const kitsResponse = await kitAPI.getAllKits();
      const kitsData = kitsResponse?.data || kitsResponse || [];
      const mappedKits = kitsData.map(kit => ({
        id: kit.id,
        name: kit.kitName,
        type: kit.type,
        status: kit.status,
        description: kit.description,
        imageUrl: kit.imageUrl,
        quantityTotal: kit.quantityTotal,
        quantityAvailable: kit.quantityAvailable,
        amount: kit.amount || 0,
        components: kit.components || []
      }));
      setKits(mappedKits);
    } catch (error) {
      console.error('Error loading kits:', error);
      setKits([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadKits();
    setRefreshing(false);
  }, []);

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

  useEffect(() => {
    loadKits();
    loadWallet();
  }, []);

  const handleViewKitDetail = (kit) => {
    setSelectedKit(kit);
    setShowKitDetail(true);
  };

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
        // Check if response includes QR code
        if (response.qrCode || response.data?.qrCode) {
          const qrCode = response.qrCode || response.data?.qrCode;
          setQrCodeData({
            qrCode: qrCode,
            requestId: response.id || response.data?.id,
            kitName: rentingKit.name,
            rentalData: requestData
          });
          setSubmittedRequest(response);
          setShowQRModal(true);
        }

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
              message: `${user?.fullName || user?.email || 'Giảng viên'} đã gửi yêu cầu thuê ${rentingKit.name}.`
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending notifications:', notifyError);
        }

        setShowRentModal(false);
        setRentingKit(null);
        setExpectReturnDate('');
        setReason('');

        await Promise.all([loadKits(), loadWallet()]);

        if (!response.qrCode && !response.data?.qrCode) {
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
    <Card style={styles.kitCard} mode="elevated">
      <Card.Content>
        <View style={styles.kitHeader}>
          <Avatar.Icon size={40} icon="toolbox" style={{ backgroundColor: '#667eea' }} />
          <View style={styles.kitInfo}>
            <Title style={styles.kitName}>{item.name}</Title>
            <Chip style={styles.chip}>{item.type || 'N/A'}</Chip>
          </View>
          <Chip 
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.kitDetails}>
          <View style={styles.detailRow}>
            <Avatar.Icon size={24} icon="check-circle" style={{ backgroundColor: '#52c41a' }} />
            <Paragraph style={styles.detailText}>
              Available: {item.quantityAvailable}/{item.quantityTotal}
            </Paragraph>
          </View>
          <View style={styles.detailRow}>
            <Avatar.Icon size={24} icon="cash" style={{ backgroundColor: '#fa8c16' }} />
            <Paragraph style={styles.detailText}>
              Amount: {item.amount?.toLocaleString() || '0'} VND
            </Paragraph>
          </View>
          {item.description && (
            <Paragraph style={styles.description} numberOfLines={2}>
              {item.description}
            </Paragraph>
          )}
        </View>

        <View style={styles.kitFooter}>
          <Button
            mode="text"
            icon="information"
            onPress={() => handleViewKitDetail(item)}
          >
            Details
          </Button>
          <Button
            mode="contained"
            icon="shopping"
            onPress={() => handleRent(item)}
            disabled={item.quantityAvailable === 0}
            buttonColor="#667eea"
          >
            Rent
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderKitDetailModal = () => {
    if (!showKitDetail || !selectedKit) return null;

    return (
      <Portal>
        <Dialog
          visible={showKitDetail}
          onDismiss={() => {
            setShowKitDetail(false);
            setSelectedKit(null);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Kit Details</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={styles.dialogContent}>
              <Card style={styles.detailSection} mode="outlined">
                <Card.Title title="Kit Information" />
                <Card.Content>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Name:</Paragraph>
                    <Title style={styles.detailValue}>{selectedKit.name}</Title>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Type:</Paragraph>
                    <Chip style={styles.chip}>{selectedKit.type || 'N/A'}</Chip>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Status:</Paragraph>
                    <Chip 
                      style={{ backgroundColor: getStatusColor(selectedKit.status) }}
                      textStyle={{ color: 'white' }}
                    >
                      {selectedKit.status}
                    </Chip>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Available:</Paragraph>
                    <Paragraph style={styles.detailValue}>
                      {selectedKit.quantityAvailable}/{selectedKit.quantityTotal}
                    </Paragraph>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Amount:</Paragraph>
                    <Title style={[styles.detailValue, styles.amountValue]}>
                      {selectedKit.amount?.toLocaleString() || '0'} VND
                    </Title>
                  </View>
                  <View style={styles.detailItem}>
                    <Paragraph style={styles.detailLabel}>Description:</Paragraph>
                    <Paragraph style={styles.detailValue}>{selectedKit.description || 'No description'}</Paragraph>
                  </View>
                </Card.Content>
              </Card>

              {selectedKit.components && selectedKit.components.length > 0 && (
                <Card style={styles.detailSection} mode="outlined">
                  <Card.Title title="Kit Components" />
                  <Card.Content>
                    {selectedKit.components.map((component, index) => (
                      <Card key={index} style={styles.componentCard} mode="outlined">
                        <Card.Content>
                          <Title style={styles.componentName}>{component.componentName || 'Component'}</Title>
                          <Chip style={styles.chip}>{component.componentType || 'N/A'}</Chip>
                          <Paragraph style={styles.componentPrice}>
                            Price: {component.pricePerCom?.toLocaleString() || '0'} VND
                          </Paragraph>
                        </Card.Content>
                      </Card>
                    ))}
                  </Card.Content>
                </Card>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => {
              setShowKitDetail(false);
              setSelectedKit(null);
            }}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const availableKits = kits.filter(kit => kit.quantityAvailable > 0);

  return (
    <LecturerLayout title="Kit Rental">
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
            <Avatar.Icon size={64} icon="toolbox" style={{ backgroundColor: '#ccc' }} />
            <Paragraph style={styles.emptyText}>No kits available</Paragraph>
          </View>
        }
        />
      )}
      {renderKitDetailModal()}
      {renderRentModal()}
      {renderQRCodeModal()}
    </LecturerLayout>
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
        }}
      >
        <View style={rentModalStyles.modalOverlay}>
          <View style={rentModalStyles.modalContent}>
            <View style={rentModalStyles.modalHeader}>
              <Text style={rentModalStyles.modalTitle}>Rental Request QR Code</Text>
              <TouchableOpacity
                style={rentModalStyles.closeButton}
                onPress={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSubmittedRequest(null);
                }}
              >
                <Text style={rentModalStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={rentModalStyles.modalBody}>
              <View style={rentModalStyles.detailSection}>
                <Text style={rentModalStyles.detailSectionTitle}>Request Information</Text>
                <View style={rentModalStyles.detailItem}>
                  <Text style={rentModalStyles.detailLabel}>Request ID:</Text>
                  <Text style={rentModalStyles.detailValue}>#{qrCodeData.requestId || 'N/A'}</Text>
                </View>
                <View style={rentModalStyles.detailItem}>
                  <Text style={rentModalStyles.detailLabel}>Kit Name:</Text>
                  <Text style={rentModalStyles.detailValue}>{qrCodeData.kitName}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Text style={[rentModalStyles.inputLabel, { marginBottom: 16 }]}>QR Code</Text>
                {qrCodeData.qrCode ? (
                  typeof qrCodeData.qrCode === 'string' && qrCodeData.qrCode.startsWith('data:image') ? (
                    <Image 
                      source={{ uri: qrCodeData.qrCode }} 
                      style={{ width: 250, height: 250, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                  ) : typeof qrCodeData.qrCode === 'string' ? (
                    <View style={{
                      width: 250,
                      height: 250,
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
                        {qrCodeData.qrCode}
                      </Text>
                    </View>
                  ) : null
                ) : (
                  <View style={{
                    width: 250,
                    height: 250,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#999' }}>QR Code not available</Text>
                  </View>
                )}
                <Text style={[rentModalStyles.hintText, { marginTop: 12, textAlign: 'center' }]}>
                  Please show this QR code to the admin when collecting the kit
                </Text>
              </View>

              <TouchableOpacity
                style={rentModalStyles.confirmButton}
                onPress={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSubmittedRequest(null);
                  Alert.alert('Success', 'Kit rental request created successfully! Please show the QR code to admin when collecting the kit.');
                }}
              >
                <Text style={rentModalStyles.confirmButtonText}>Got it</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderRentModal() {
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
      <View style={rentModalStyles.modalOverlay}>
        <View style={rentModalStyles.modalContent}>
          <View style={rentModalStyles.modalHeader}>
            <Text style={rentModalStyles.modalTitle}>Rent Kit</Text>
            <TouchableOpacity
              style={rentModalStyles.closeButton}
              onPress={() => {
                dismissKeyboard();
                setShowRentModal(false);
                setRentingKit(null);
              }}
            >
              <Text style={rentModalStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={rentModalStyles.modalBody}>
            <View style={rentModalStyles.detailSection}>
              <Text style={rentModalStyles.detailSectionTitle}>Kit Information</Text>
              <View style={rentModalStyles.detailItem}>
                <Text style={rentModalStyles.detailLabel}>Name:</Text>
                <Text style={rentModalStyles.detailValue}>{rentingKit.name}</Text>
              </View>
              <View style={rentModalStyles.detailItem}>
                <Text style={rentModalStyles.detailLabel}>Type:</Text>
                <Text style={rentModalStyles.detailValue}>{rentingKit.type || 'N/A'}</Text>
              </View>
              <View style={rentModalStyles.detailItem}>
                <Text style={rentModalStyles.detailLabel}>Price:</Text>
                <Text style={[rentModalStyles.detailValue, rentModalStyles.amountValue]}>
                  {depositAmount.toLocaleString()} VND
                </Text>
              </View>
            </View>

            <View style={rentModalStyles.inputSection}>
              <Text style={rentModalStyles.inputLabel}>Expected Return Date *</Text>
              <TextInput
                style={rentModalStyles.input}
                placeholder="DD/MM/YYYY or YYYY-MM-DD"
                value={expectReturnDate}
                onChangeText={setExpectReturnDate}
                keyboardType="default"
              />
              <Text style={rentModalStyles.hintText}>
                Format: DD/MM/YYYY (e.g., 25/12/2024) or YYYY-MM-DD (e.g., 2024-12-25)
              </Text>
            </View>

            <View style={rentModalStyles.inputSection}>
              <Text style={rentModalStyles.inputLabel}>Reason *</Text>
              <TextInput
                style={[rentModalStyles.input, rentModalStyles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Please provide reason for renting this kit..."
                value={reason}
                onChangeText={setReason}
              />
            </View>

            <View style={rentModalStyles.summarySection}>
              <Text style={rentModalStyles.summaryTitle}>Summary</Text>
              <View style={rentModalStyles.summaryRow}>
                <Text style={rentModalStyles.summaryLabel}>Deposit Amount:</Text>
                <Text style={[rentModalStyles.summaryValue, { color: hasEnoughBalance ? '#52c41a' : '#ff4d4f' }]}>
                  {depositAmount.toLocaleString()} VND
                </Text>
              </View>
              <View style={rentModalStyles.summaryRow}>
                <Text style={rentModalStyles.summaryLabel}>Your Balance:</Text>
                <Text style={[rentModalStyles.summaryValue, { color: hasEnoughBalance ? '#52c41a' : '#ff4d4f' }]}>
                  {wallet.balance.toLocaleString()} VND
                </Text>
              </View>
              {!hasEnoughBalance && (
                <Text style={rentModalStyles.errorText}>
                  Insufficient balance. Please top up your wallet.
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                rentModalStyles.confirmButton,
                { opacity: hasEnoughBalance && reason.trim() !== '' && expectReturnDate.trim() !== '' && !submitting ? 1 : 0.5 }
              ]}
              onPress={handleConfirmRent}
              disabled={!hasEnoughBalance || reason.trim() === '' || expectReturnDate.trim() === '' || submitting}
            >
              {submitting ? (
                <RNActivityIndicator size="small" color="white" />
              ) : (
                <Text style={rentModalStyles.confirmButtonText}>Confirm Rent</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
    );
  };
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
  kitCard: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#667eea',
    marginTop: 4,
  },
  kitDetails: {
    marginBottom: 12,
    paddingLeft: 52,
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
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  kitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  amountValue: {
    color: '#1890ff',
    fontSize: 18,
  },
  componentCard: {
    marginBottom: 12,
  },
  componentName: {
    fontSize: 14,
    marginBottom: 8,
  },
  componentType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  componentPrice: {
    fontSize: 12,
    color: '#1890ff',
    marginTop: 4,
    fontWeight: '600',
  },
});

const rentModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
    paddingBottom: 4,
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
    color: '#333',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    color: '#333',
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
});

export default LecturerKitRental;

