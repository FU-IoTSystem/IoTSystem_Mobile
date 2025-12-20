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
import { kitAPI, kitComponentAPI, borrowingRequestAPI, notificationAPI, walletAPI } from '../../services/api';
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
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  // const [filterType, setFilterType] = useState('all'); // Type filter disabled by design
  const [statusFilterModalVisible, setStatusFilterModalVisible] = useState(false);
  const [typeFilterModalVisible, setTypeFilterModalVisible] = useState(false);
  const [kitComponents, setKitComponents] = useState([]);

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
        kitName: kit.kitName,
        type: kit.type,
        status: kit.status,
        description: kit.description,
        quantityTotal: kit.quantityTotal,
        quantityAvailable: kit.quantityAvailable,
        amount: kit.amount || 0,
        imageUrl: kit.imageUrl,
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

  const loadKitComponents = async () => {
    try {
      const response = await kitComponentAPI.getAllComponents();
      const data = Array.isArray(response) ? response : response?.data || [];
      // Only use global components (kitId == null) for rental, same as AdminScreen
      const globals = (Array.isArray(data) ? data : []).filter(
        (component) => component.kitId == null
      );
      setKitComponents(globals);
    } catch (error) {
      console.error('Error loading kit components for rental:', error);
      setKitComponents([]);
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
    await Promise.all([loadKits(), loadWallet(), loadKitComponents()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadKits();
    loadWallet();
    loadKitComponents();
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

  // Filter global kit components based on search and filters
  const filteredComponents = kitComponents.filter(component => {
    const available = component.quantityAvailable || 0;
    if (available <= 0) return false;

    // Filter by search text (name / id / type)
    if (searchText && searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      const name = (component.componentName || component.name || '').toLowerCase();
      const id = (component.id || '').toString().toLowerCase();
      const type = (component.componentType || '').toLowerCase();
      if (!name.includes(searchLower) && !id.includes(searchLower) && !type.includes(searchLower)) {
        return false;
      }
    }

    // Filter by status
    if (filterStatus !== 'all') {
      if ((component.status || '').toUpperCase() !== filterStatus.toUpperCase()) {
        return false;
      }
    }

    return true;
  });

  const renderComponentItem = ({ item }) => {
    const available = item.quantityAvailable || 0;

    return (
      <View style={styles.componentCard}>
        {item.imageUrl && item.imageUrl !== 'null' && item.imageUrl !== 'undefined' ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.componentImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.componentImagePlaceholder}>
            <Icon name="extension" size={32} color="#fff" />
          </View>
        )}

        <View style={styles.componentCardContent}>
          <Text style={styles.componentName} numberOfLines={1}>
            {item.componentName || item.name || 'N/A'}
          </Text>

          <View style={styles.componentBadge}>
            <Text style={styles.componentBadgeText}>
              {item.componentType || 'N/A'}
            </Text>
          </View>

          <View style={styles.componentStatsRow}>
            <Text style={styles.componentStatText}>
              Total: {item.quantityTotal || 0}
            </Text>
            <Text style={[styles.componentStatText, { color: '#52c41a' }]}>
              Available: {available}
            </Text>
          </View>

          {item.pricePerCom > 0 && (
            <Text style={styles.componentPrice}>
              {item.pricePerCom.toLocaleString('vi-VN')} VND
            </Text>
          )}

          {item.description ? (
            <Text style={styles.componentDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.rentButton, { opacity: available === 0 ? 0.5 : 1 }]}
            onPress={() => handleRentComponent(item)}
            disabled={available === 0}
          >
            <Icon name="shopping-cart" size={20} color="#fff" />
            <Text style={styles.rentButtonText}>
              {available === 0 ? 'Sold Out' : 'Rent Component'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LeaderLayout title="Kit Component Rental">
      <View style={styles.container}>
        {/* Search and Filter Section */}
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or ID..."
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
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setStatusFilterModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {filterStatus === 'all' ? 'All Status' : filterStatus}
              </Text>
              <Icon name="arrow-drop-down" size={20} color="#666" />
            </TouchableOpacity>
            {/* Type filter removed by design; keep only status + search for simplicity */}
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : (
          <FlatList
            data={filteredComponents}
            renderItem={renderComponentItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            numColumns={2}
            columnWrapperStyle={styles.componentsRow}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="extension" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchText || filterStatus !== 'all' || filterType !== 'all' 
                    ? 'No components match your filters' 
                    : 'No components available'}
                </Text>
              </View>
            }
            ListFooterComponent={
              filteredComponents.length > 0 ? (
                <View style={styles.footerText}>
                  <Text style={styles.footerTextContent}>
                    Showing {filteredComponents.length} of {kitComponents.length} component(s)
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Status Filter Modal */}
      <Modal
        visible={statusFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setStatusFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter by Status</Text>
            {['all', 'AVAILABLE', 'BORROWED', 'MAINTENANCE'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  filterStatus === status && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setFilterStatus(status);
                  setStatusFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterStatus === status && styles.filterOptionTextSelected
                ]}>
                  {status === 'all' ? 'All Status' : status}
                </Text>
                {filterStatus === status && (
                  <Icon name="check" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Type Filter Modal */}
      {/* Type Filter Modal removed by design */}

      {renderKitDetailModal()}
      {renderRentModal()}
      {renderQRCodeModal()}
    </LeaderLayout>
  );

  function renderKitDetailModal() {
    if (!showKitDetail || !selectedKit) return null;
    const availableComponents =
      kitComponents.filter(c => (c.quantityAvailable || 0) > 0);

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
                    numColumns={2}
                    columnWrapperStyle={styles.componentsRow}
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
                  <Text style={[styles.detailValue, { color: '#ff4d4f', fontSize: 16 }]}>
                    -{selectedComponent.pricePerCom?.toLocaleString() || '0'} VND
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
                  <Text style={[styles.totalValue, { color: '#ff4d4f' }]}>
                    -{depositAmount.toLocaleString()} VND
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  filterOptionSelected: {
    backgroundColor: '#667eea15',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  filterOptionTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  kitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  kitImageContainer: {
    height: 150,
    position: 'relative',
  },
  kitImage: {
    width: '100%',
    height: '100%',
  },
  kitImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kitImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  kitCardContent: {
    padding: 12,
  },
  kitHeader: {
    marginBottom: 12,
  },
  kitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  kitDetails: {
    marginBottom: 12,
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
  viewButton: {
    backgroundColor: '#52c41a15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  viewButtonText: {
    color: '#52c41a',
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
  componentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  componentCard: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  componentImage: {
    width: '100%',
    height: 90,
  },
  componentImagePlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  componentCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  componentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  componentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#722ed115',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  componentBadgeText: {
    fontSize: 10,
    color: '#722ed1',
    fontWeight: '600',
  },
  componentStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  componentStatText: {
    fontSize: 11,
    color: '#666',
  },
  componentPrice: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e6f4ff',
    borderRadius: 12,
  },
  componentDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  rentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#667eea',
    marginTop: 10,
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
