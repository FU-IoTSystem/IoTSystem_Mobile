import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Keyboard,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { kitAPI, borrowingRequestAPI, notificationAPI, walletAPI } from '../../services/api';
import LeaderLayout from '../../components/LeaderLayout';
import dayjs from 'dayjs';

const LeaderComponentRental = ({ user, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [kits, setKits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [showKitDetail, setShowKitDetail] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showRentModal, setShowRentModal] = useState(false);
  const [componentQuantity, setComponentQuantity] = useState(1);
  const [expectReturnDate, setExpectReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [wallet, setWallet] = useState({ balance: 0 });
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

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

  const handleViewKitDetail = (kit) => {
    setSelectedKit(kit);
    setShowKitDetail(true);
  };

  const handleRentComponent = (component) => {
    setSelectedComponent(component);
    setComponentQuantity(1);
    setExpectReturnDate('');
    setReason('');
    setShowRentModal(true);
  };

  const handleConfirmRent = async () => {
    if (!selectedComponent || componentQuantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (componentQuantity > selectedComponent.quantityAvailable) {
      Alert.alert('Error', 'Quantity exceeds available amount');
      return;
    }

    if (!expectReturnDate || expectReturnDate.trim() === '') {
      Alert.alert('Error', 'Please enter expected return date');
      return;
    }

    let returnDate;
    try {
      if (expectReturnDate.includes('/')) {
        const [day, month, year] = expectReturnDate.split('/');
        returnDate = new Date(`${year}-${month}-${day}`);
      } else {
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
      Alert.alert('Error', 'Please provide a reason for renting this component');
      return;
    }

    const depositAmount = (selectedComponent.pricePerCom || 0) * componentQuantity;
    if (wallet.balance < depositAmount) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${depositAmount.toLocaleString()} VND but only have ${wallet.balance.toLocaleString()} VND. Please top up your wallet.`
      );
      return;
    }

    dismissKeyboard();
    setLoading(true);
    try {
      const requestData = {
        kitComponentsId: selectedComponent.id,
        componentName: selectedComponent.componentName,
        quantity: componentQuantity,
        reason: reason,
        depositAmount: depositAmount,
        expectReturnDate: returnDate.toISOString()
      };
      
      const response = await borrowingRequestAPI.createComponentRequest(requestData);
      
      if (response) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_REQUEST',
              title: 'Đã gửi yêu cầu thuê linh kiện',
              message: `Bạn đã gửi yêu cầu thuê ${selectedComponent.componentName} x${componentQuantity}.`
            },
            {
              subType: 'BORROW_REQUEST_CREATED',
              title: 'Yêu cầu mượn linh kiện mới',
              message: `${user?.fullName || user?.email || 'Leader'} đã gửi yêu cầu thuê ${selectedComponent.componentName} x${componentQuantity}.`
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending notifications:', notifyError);
        }
        
        const qrCode = response?.qrCode || response?.data?.qrCode || response?.qrCodeUrl;
        const requestId = response?.id || response?.data?.id;

        setShowRentModal(false);
        
        if (qrCode) {
          setQrCodeData(qrCode);
          setSubmittedRequest({
            id: requestId,
            componentName: selectedComponent.componentName,
            quantity: componentQuantity,
            expectReturnDate: returnDate.toISOString(),
          });
          setShowQRModal(true);
        } else {
          setSelectedComponent(null);
          setComponentQuantity(1);
          setReason('');
          setExpectReturnDate('');
          await Promise.all([loadKits(), loadWallet()]);
          setTimeout(() => {
            Alert.alert('Success', 'Component rental request created successfully! Waiting for admin approval.');
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error creating component request:', error);
      Alert.alert('Error', 'Failed to create component request: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const renderKitItem = ({ item }) => (
    <TouchableOpacity
      style={styles.kitCard}
      onPress={() => handleViewKitDetail(item)}
    >
      <View style={styles.kitHeader}>
        <Icon name="build" size={32} color="#667eea" />
        <View style={styles.kitInfo}>
          <Text style={styles.kitName}>{item.name}</Text>
          <Text style={styles.kitType}>{item.type || 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.kitFooter}>
        <Text style={styles.kitComponents}>
          {item.components?.length || 0} components available
        </Text>
        <Icon name="chevron-right" size={24} color="#667eea" />
      </View>
    </TouchableOpacity>
  );

  const renderComponentItem = ({ item }) => {
    const available = item.quantityAvailable || 0;
    return (
      <View style={styles.componentCard}>
        <View style={styles.componentHeader}>
          <View style={styles.componentInfo}>
            <Text style={styles.componentName}>{item.componentName}</Text>
            <Text style={styles.componentType}>{item.componentType || 'N/A'}</Text>
          </View>
          <View style={[styles.availabilityBadge, { backgroundColor: available > 0 ? '#52c41a' : '#ff4d4f' }]}>
            <Text style={styles.availabilityText}>{available} available</Text>
          </View>
        </View>
        <View style={styles.componentDetails}>
          <Text style={styles.componentPrice}>
            Price: {item.pricePerCom?.toLocaleString() || '0'} VND/unit
          </Text>
          {item.description && (
            <Text style={styles.componentDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.rentButton, { opacity: available === 0 ? 0.5 : 1 }]}
          onPress={() => handleRentComponent(item)}
          disabled={available === 0}
        >
          <Icon name="shopping-cart" size={20} color="white" />
          <Text style={styles.rentButtonText}>
            {available === 0 ? 'Sold Out' : 'Rent Component'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const availableKits = kits.filter(kit => 
    kit.quantityAvailable > 0 && 
    kit.components && 
    kit.components.some(c => (c.quantityAvailable || 0) > 0)
  );

  return (
    <LeaderLayout title="Kit Component Rental">
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="build" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No kits with available components</Text>
            </View>
          }
        />
      )}
      {renderKitDetailModal()}
      {renderRentModal()}
      {renderQRCodeModal()}
    </LeaderLayout>
  );

  function renderKitDetailModal() {
    if (!showKitDetail || !selectedKit) return null;
    const availableComponents = selectedKit.components?.filter(c => (c.quantityAvailable || 0) > 0) || [];

    return (
      <Modal
        visible={showKitDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowKitDetail(false);
          setSelectedKit(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedKit.name}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowKitDetail(false);
                  setSelectedKit(null);
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Kit Information</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedKit.type || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Available:</Text>
                  <Text style={styles.detailValue}>
                    {selectedKit.quantityAvailable}/{selectedKit.quantityTotal}
                  </Text>
                </View>
              </View>
              {availableComponents.length > 0 ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Available Components</Text>
                  <FlatList
                    data={availableComponents}
                    renderItem={renderComponentItem}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    scrollEnabled={false}
                  />
                </View>
              ) : (
                <View style={styles.emptyComponents}>
                  <Icon name="info" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No components available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderRentModal() {
    if (!showRentModal || !selectedComponent) return null;
    const depositAmount = (selectedComponent.pricePerCom || 0) * componentQuantity;
    const hasEnoughBalance = wallet.balance >= depositAmount;

    return (
      <Modal
        visible={showRentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          dismissKeyboard();
          setShowRentModal(false);
          setSelectedComponent(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rent Component</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  dismissKeyboard();
                  setShowRentModal(false);
                  setSelectedComponent(null);
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Component Information</Text>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedComponent.componentName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Available:</Text>
                  <Text style={styles.detailValue}>{selectedComponent.quantityAvailable || 0}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Price per Unit:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    {selectedComponent.pricePerCom?.toLocaleString() || '0'} VND
                  </Text>
                </View>
              </View>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={componentQuantity.toString()}
                  onChangeText={(text) => {
                    const qty = parseInt(text) || 1;
                    const maxQty = selectedComponent.quantityAvailable || 0;
                    setComponentQuantity(Math.min(Math.max(qty, 1), maxQty));
                  }}
                />
              </View>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Expected Return Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY or YYYY-MM-DD"
                  value={expectReturnDate}
                  onChangeText={setExpectReturnDate}
                />
              </View>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Reason *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={4}
                  placeholder="Please provide reason..."
                  value={reason}
                  onChangeText={setReason}
                />
              </View>
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Deposit:</Text>
                  <Text style={[styles.totalValue, { color: hasEnoughBalance ? '#52c41a' : '#ff4d4f' }]}>
                    {depositAmount.toLocaleString()} VND
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Your Balance:</Text>
                  <Text style={[styles.summaryValue, { color: hasEnoughBalance ? '#52c41a' : '#ff4d4f' }]}>
                    {wallet.balance.toLocaleString()} VND
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.confirmButton, { opacity: hasEnoughBalance && reason.trim() !== '' ? 1 : 0.5 }]}
                onPress={handleConfirmRent}
                disabled={!hasEnoughBalance || reason.trim() === '' || loading}
              >
                <Text style={styles.confirmButtonText}>Confirm Rent</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

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
          setSelectedComponent(null);
          setComponentQuantity(1);
          setReason('');
          setExpectReturnDate('');
          loadKits();
          loadWallet();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Component Rental QR Code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSubmittedRequest(null);
                  setSelectedComponent(null);
                  setComponentQuantity(1);
                  setReason('');
                  setExpectReturnDate('');
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
                    <Image source={{ uri: qrCodeData }} style={styles.qrImage} resizeMode="contain" />
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
                  {submittedRequest.id && <Text style={styles.infoText}>Request ID: #{submittedRequest.id}</Text>}
                  {submittedRequest.componentName && <Text style={styles.infoText}>Component: {submittedRequest.componentName}</Text>}
                  {submittedRequest.quantity && <Text style={styles.infoText}>Quantity: {submittedRequest.quantity}</Text>}
                </View>
              )}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setShowQRModal(false);
                  setQrCodeData(null);
                  setSubmittedRequest(null);
                  setSelectedComponent(null);
                  setComponentQuantity(1);
                  setReason('');
                  setExpectReturnDate('');
                  loadKits();
                  loadWallet();
                  Alert.alert('Success', 'Component rental request created successfully!');
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
  },
  listContainer: {
    padding: 16,
  },
  kitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: '600',
    color: '#333',
  },
  kitType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  kitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  kitComponents: {
    fontSize: 14,
    color: '#666',
  },
  componentCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  componentInfo: {
    flex: 1,
  },
  componentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  componentType: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  componentDetails: {
    marginBottom: 12,
  },
  componentPrice: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: '600',
    marginBottom: 4,
  },
  componentDescription: {
    fontSize: 12,
    color: '#666',
  },
  rentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#667eea',
  },
  rentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
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
  emptyComponents: {
    alignItems: 'center',
    paddingVertical: 32,
  },
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
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default LeaderComponentRental;
