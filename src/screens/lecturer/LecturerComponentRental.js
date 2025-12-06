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
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LecturerLayout from '../../components/LecturerLayout';
import { kitAPI, borrowingRequestAPI, notificationAPI, walletAPI } from '../../services/api';

const LecturerComponentRental = ({ user }) => {
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
  const [filterType, setFilterType] = useState('all');
  const [statusFilterModalVisible, setStatusFilterModalVisible] = useState(false);
  const [typeFilterModalVisible, setTypeFilterModalVisible] = useState(false);

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
      // Lecturer dùng all kits giống trước đây
      const kitsResponse = await kitAPI.getAllKits();
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
        components: kit.components || [],
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
        expectReturnDate: returnDate.toISOString(),
      };

      const response = await borrowingRequestAPI.createComponentRequest(requestData);

      if (response) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_REQUEST',
              title: 'Đã gửi yêu cầu thuê linh kiện',
              message: `Bạn đã gửi yêu cầu thuê ${selectedComponent.componentName} x${componentQuantity}.`,
            },
            {
              subType: 'BORROW_REQUEST_CREATED',
              title: 'Yêu cầu mượn linh kiện mới',
              message: `${user?.fullName || user?.email || 'Giảng viên'} đã gửi yêu cầu thuê ${selectedComponent.componentName} x${componentQuantity}.`,
            },
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
      const errorMessage = error.message || 'Unknown error';
      Alert.alert('Error', 'Failed to create component request: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter kits giống LeaderComponentRental
  const filteredKits = kits.filter(kit => {
    if (kit.quantityAvailable <= 0) return false;
    if (!kit.components || !kit.components.some(c => (c.quantityAvailable || 0) > 0)) {
      return false;
    }

    if (searchText && searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      const kitName = (kit.name || kit.kitName || '').toLowerCase();
      const kitId = (kit.id || '').toString().toLowerCase();
      if (!kitName.includes(searchLower) && !kitId.includes(searchLower)) {
        return false;
      }
    }

    if (filterStatus !== 'all' && kit.status !== filterStatus) {
      return false;
    }

    if (filterType !== 'all' && kit.type !== filterType) {
      return false;
    }

    return true;
  });

  const renderKitItem = ({ item }) => (
    <TouchableOpacity
      style={styles.kitCard}
      onPress={() => handleViewKitDetail(item)}
      activeOpacity={0.8}
    >
      <View style={styles.kitImageContainer}>
        {item.imageUrl && item.imageUrl !== 'null' && item.imageUrl !== 'undefined' ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.kitImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.kitImagePlaceholder}>
            <Icon name="build" size={48} color="#fff" />
          </View>
        )}
        <View style={styles.kitImageBadge}>
          <View
            style={[
              styles.badge,
              { backgroundColor: item.status === 'AVAILABLE' ? '#52c41a' : '#faad14' },
            ]}
          >
            <Text style={[styles.badgeText, { color: '#fff' }]}>
              {item.status || 'AVAILABLE'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.kitCardContent}>
        <View style={styles.kitHeader}>
          <Text style={styles.kitName} numberOfLines={2}>
            {item.name || item.kitName || 'N/A'}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: item.type === 'LECTURER_KIT' ? '#ff4d4f15' : '#1890ff15' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: item.type === 'LECTURER_KIT' ? '#ff4d4f' : '#1890ff' },
              ]}
            >
              {item.type === 'LECTURER_KIT' ? 'Lecturer' : 'Student'}
            </Text>
          </View>
        </View>

        <View style={styles.kitDetails}>
          <View style={styles.detailRow}>
            <Icon name="inventory-2" size={14} color="#666" />
            <Text style={styles.detailText}>
              Total: {item.quantityTotal || 0}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="check-circle" size={14} color="#52c41a" />
            <Text style={[styles.detailText, { color: '#52c41a' }]}>
              Available: {item.quantityAvailable || 0}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="extension" size={14} color="#722ed1" />
            <Text style={styles.detailText}>
              Components: {item.components?.length || 0}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={(e) => {
            e.stopPropagation();
            handleViewKitDetail(item);
          }}
        >
          <Icon name="visibility" size={18} color="#52c41a" />
          <Text style={styles.viewButtonText}>View Components</Text>
        </TouchableOpacity>
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
          <View
            style={[
              styles.availabilityBadge,
              { backgroundColor: available > 0 ? '#52c41a' : '#ff4d4f' },
            ]}
          >
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

  const renderKitDetailModal = () => {
    if (!showKitDetail || !selectedKit) return null;

    const availableComponents =
      selectedKit.components?.filter(c => (c.quantityAvailable || 0) > 0) || [];

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
  };

  const renderRentModal = () => {
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
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedComponent.componentType || 'N/A'}
                  </Text>
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
                {componentQuantity > (selectedComponent.quantityAvailable || 0) && (
                  <Text style={styles.errorText}>
                    Quantity cannot exceed available amount
                  </Text>
                )}
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
                  placeholder="Please provide reason..."
                  value={reason}
                  onChangeText={setReason}
                />
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Deposit:</Text>
                  <Text
                    style={[
                      styles.totalValue,
                      { color: '#ff4d4f' },
                    ]}
                  >
                    -{depositAmount.toLocaleString()} VND
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Your Balance:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: hasEnoughBalance ? '#52c41a' : '#ff4d4f' },
                    ]}
                  >
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
                  { opacity: hasEnoughBalance && reason.trim() !== '' ? 1 : 0.5 },
                ]}
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
  };

  const renderQRCodeModal = () => {
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
                  {submittedRequest.componentName && (
                    <Text style={styles.infoText}>
                      Component: {submittedRequest.componentName}
                    </Text>
                  )}
                  {submittedRequest.quantity && (
                    <Text style={styles.infoText}>
                      Quantity: {submittedRequest.quantity}
                    </Text>
                  )}
                  {submittedRequest.expectReturnDate && (
                    <Text style={styles.infoText}>
                      Expected Return:{' '}
                      {new Date(submittedRequest.expectReturnDate).toLocaleDateString('vi-VN')}
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
  };

  return (
    <LecturerLayout title="Kit Component Rental">
      <View style={styles.container}>
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
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setTypeFilterModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>
                {filterType === 'all'
                  ? 'All Types'
                  : filterType === 'STUDENT_KIT'
                  ? 'Student Kit'
                  : 'Lecturer Kit'}
              </Text>
              <Icon name="arrow-drop-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : (
          <FlatList
            data={filteredKits}
            renderItem={renderKitItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="build" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchText || filterStatus !== 'all' || filterType !== 'all'
                    ? 'No kits match your filters'
                    : 'No kits with available components'}
                </Text>
              </View>
            }
            ListFooterComponent={
              filteredKits.length > 0 ? (
                <View style={styles.footerText}>
                  <Text style={styles.footerTextContent}>
                    Showing {filteredKits.length} of{' '}
                    {kits.filter(
                      k =>
                        k.quantityAvailable > 0 &&
                        k.components &&
                        k.components.some(c => (c.quantityAvailable || 0) > 0)
                    ).length}{' '}
                    available kit(s)
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
                  filterStatus === status && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setFilterStatus(status);
                  setStatusFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterStatus === status && styles.filterOptionTextSelected,
                  ]}
                >
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
      <Modal
        visible={typeFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTypeFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setTypeFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter by Type</Text>
            {['all', 'STUDENT_KIT', 'LECTURER_KIT'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterOption,
                  filterType === type && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setFilterType(type);
                  setTypeFilterModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterType === type && styles.filterOptionTextSelected,
                  ]}
                >
                  {type === 'all'
                    ? 'All Types'
                    : type === 'STUDENT_KIT'
                    ? 'Student Kit'
                    : 'Lecturer Kit'}
                </Text>
                {filterType === type && (
                  <Icon name="check" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {renderKitDetailModal()}
      {renderRentModal()}
      {renderQRCodeModal()}
    </LecturerLayout>
  );
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
    backgroundColor: 'white',
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
  errorText: {
    fontSize: 12,
    color: '#ff4d4f',
    marginTop: 4,
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
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
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

export default LecturerComponentRental;
