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
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LecturerLayout from '../../components/LecturerLayout';
import { kitAPI, borrowingRequestAPI, walletAPI, notificationAPI } from '../../services/api';

const LecturerKitRental = ({ user }) => {
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
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [statusFilterModalVisible, setStatusFilterModalVisible] = useState(false);
  const [typeFilterModalVisible, setTypeFilterModalVisible] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [components, setComponents] = useState([]);
  const [componentPage, setComponentPage] = useState(1);
  const componentPageSize = 6;

  // Helper to safely dismiss keyboard
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
      // Lecturer vẫn dùng toàn bộ kit – giữ behavior cũ nhưng map theo view mới
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

  const loadComponents = async (kitId) => {
    try {
      const kitResponse = await kitAPI.getKitById(kitId);
      const kitData = kitResponse?.data || kitResponse;
      return kitData?.components || [];
    } catch (error) {
      console.error('Error loading components:', error);
      return [];
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  const handleViewDetail = async (kit) => {
    try {
      setSelectedKit(kit);
      setComponentPage(1);
      setShowDetailModal(true);
      // Load components in background
      const kitComponents = await loadComponents(kit.id);
      setComponents(kitComponents);
    } catch (error) {
      console.error('Error in handleViewDetail:', error);
      Alert.alert('Error', 'Failed to load kit details');
    }
  };

  const handleRent = (kit) => {
    setRentingKit(kit);
    setExpectReturnDate('');
    setReason('');
    setShowRentModal(true);
    setShowDetailModal(false);
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
      Alert.alert('Error', 'Please provide a reason for renting this kit');
      return;
    }

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
        requestType: 'BORROW_KIT',
      };

      if (!requestData.accountID) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        setSubmitting(false);
        return;
      }

      const response = await borrowingRequestAPI.create(requestData);

      if (response) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_REQUEST',
              title: 'Đã gửi yêu cầu thuê kit',
              message: `Bạn đã gửi yêu cầu thuê ${rentingKit.name}.`,
            },
            {
              subType: 'BORROW_REQUEST_CREATED',
              title: 'Yêu cầu mượn kit mới',
              message: `${user?.fullName || user?.email || 'Giảng viên'} đã gửi yêu cầu thuê ${rentingKit.name}.`,
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

  // Filter kits tương tự leader
  const filteredKits = kits.filter(kit => {
    if (kit.quantityAvailable <= 0) return false;

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
      onPress={() => handleViewDetail(item)}
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
            <Icon name="attach-money" size={14} color="#faad14" />
            <Text style={styles.detailText}>
              {item.amount?.toLocaleString() || '0'} VND
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.rentButton,
            { opacity: item.quantityAvailable === 0 ? 0.5 : 1 },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleRent(item);
          }}
          disabled={item.quantityAvailable === 0}
        >
          <Icon name="shopping-cart" size={18} color="#fff" />
          <Text style={styles.rentButtonText}>
            {item.quantityAvailable === 0 ? 'Sold Out' : 'Rent Kit'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedKit) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowDetailModal(false);
          setSelectedKit(null);
          setComponentPage(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Icon name="info" size={24} color="#1890ff" />
                <Text style={styles.modalTitle}>Kit Details</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowDetailModal(false);
                setSelectedKit(null);
                setComponentPage(1);
              }}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Kit Image */}
              {selectedKit.imageUrl && selectedKit.imageUrl !== 'null' && selectedKit.imageUrl !== 'undefined' ? (
                <View style={styles.detailsImageContainer}>
                  <Image
                    source={{ uri: selectedKit.imageUrl }}
                    style={styles.detailsImage}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* Kit Information */}
              <View style={styles.detailsSection}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Kit ID:</Text>
                  <Text style={styles.detailsValue}>#{selectedKit.id}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Kit Name:</Text>
                  <Text style={[styles.detailsValue, styles.detailsValueBold]}>
                    {selectedKit.kitName || selectedKit.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Type:</Text>
                  <View style={[
                    styles.badge,
                    { backgroundColor: selectedKit.type === 'LECTURER_KIT' ? '#ff4d4f15' : '#1890ff15' }
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: selectedKit.type === 'LECTURER_KIT' ? '#ff4d4f' : '#1890ff' }
                    ]}>
                      {selectedKit.type || 'STUDENT_KIT'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Status:</Text>
                  <View style={[
                    styles.badge,
                    { backgroundColor: selectedKit.status === 'AVAILABLE' ? '#52c41a15' : '#faad1415' }
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: selectedKit.status === 'AVAILABLE' ? '#52c41a' : '#faad14' }
                    ]}>
                      {selectedKit.status || 'AVAILABLE'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Total Quantity:</Text>
                  <Text style={[styles.detailsValue, { color: '#1890ff' }]}>
                    {selectedKit.quantityTotal || 0}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Available Quantity:</Text>
                  <Text style={[styles.detailsValue, { color: '#52c41a' }]}>
                    {selectedKit.quantityAvailable || 0}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>In Use Quantity:</Text>
                  <Text style={[styles.detailsValue, { color: '#faad14' }]}>
                    {(selectedKit.quantityTotal || 0) - (selectedKit.quantityAvailable || 0)}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Deposit Amount:</Text>
                  <Text style={[styles.detailsValue, { color: '#faad14', fontWeight: 'bold' }]}>
                    {selectedKit.amount?.toLocaleString() || '0'} VND
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Total Components:</Text>
                  <Text style={styles.detailsValue}>
                    {components.length || 0} components
                  </Text>
                </View>
                {selectedKit.description && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Description:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedKit.description}
                    </Text>
                  </View>
                )}
                {selectedKit.createdAt && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Created At:</Text>
                    <Text style={[styles.detailsValue, styles.detailsValueSmall]}>
                      {formatDateTime(selectedKit.createdAt)}
                    </Text>
                  </View>
                )}
                {selectedKit.updatedAt && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Updated At:</Text>
                    <Text style={[styles.detailsValue, styles.detailsValueSmall]}>
                      {formatDateTime(selectedKit.updatedAt)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Components Section */}
              <View style={styles.componentsSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="extension" size={20} color="#1890ff" />
                  <Text style={styles.sectionTitle}>
                    Components ({components.length || 0})
                  </Text>
                </View>

                {components.length > 0 ? (
                  <>
                    {(() => {
                      const startIndex = (componentPage - 1) * componentPageSize;
                      const endIndex = startIndex + componentPageSize;
                      const currentComponents = components.slice(startIndex, endIndex);
                      const totalPages = Math.ceil(components.length / componentPageSize);

                      return (
                        <>
                          <View style={styles.componentsGrid}>
                            {currentComponents.map((component, index) => (
                              <View key={component.id || index} style={styles.componentCard}>
                                {component.imageUrl && component.imageUrl !== 'null' ? (
                                  <Image
                                    source={{ uri: component.imageUrl }}
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
                                    {component.componentName || component.name || 'N/A'}
                                  </Text>
                                  {component.seriNumber && (
                                    <Text style={styles.componentSerial}>
                                      SN: {component.seriNumber}
                                    </Text>
                                  )}
                                  <View style={styles.componentBadge}>
                                    <Text style={styles.componentBadgeText}>
                                      {component.componentType || 'N/A'}
                                    </Text>
                                  </View>
                                  <View style={styles.componentDetails}>
                                    <Text style={styles.componentDetailText}>
                                      Total: {component.quantityTotal || 0}
                                    </Text>
                                    <Text style={[styles.componentDetailText, { color: '#52c41a' }]}>
                                      Available: {component.quantityAvailable || 0}
                                    </Text>
                                  </View>
                                  {component.pricePerCom > 0 && (
                                    <Text style={styles.componentPrice}>
                                      {component.pricePerCom.toLocaleString('vi-VN')} VND
                                    </Text>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>

                          {totalPages > 1 && (
                            <View style={styles.paginationContainer}>
                              <TouchableOpacity
                                style={[styles.paginationButton, componentPage === 1 && styles.paginationButtonDisabled]}
                                onPress={() => setComponentPage(Math.max(1, componentPage - 1))}
                                disabled={componentPage === 1}
                              >
                                <Icon name="chevron-left" size={20} color={componentPage === 1 ? "#ccc" : "#667eea"} />
                              </TouchableOpacity>
                              <Text style={styles.paginationText}>
                                Page {componentPage} of {totalPages}
                              </Text>
                              <TouchableOpacity
                                style={[styles.paginationButton, componentPage === totalPages && styles.paginationButtonDisabled]}
                                onPress={() => setComponentPage(Math.min(totalPages, componentPage + 1))}
                                disabled={componentPage === totalPages}
                              >
                                <Icon name="chevron-right" size={20} color={componentPage === totalPages ? "#ccc" : "#667eea"} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <View style={styles.emptyComponents}>
                    <Icon name="extension" size={48} color="#ccc" />
                    <Text style={styles.emptyComponentsText}>No components available</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => handleRent(selectedKit)}
                disabled={selectedKit.quantityAvailable === 0}
              >
                <Icon name="shopping-cart" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>
                  {selectedKit.quantityAvailable === 0 ? 'Sold Out' : 'Rent This Kit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
                  <Text style={[styles.detailValue, { color: '#2c3e50', fontSize: 16 }]}>
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
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: '#2c3e50' },
                    ]}
                  >
                    {depositAmount.toLocaleString()} VND
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
                  {
                    opacity:
                      hasEnoughBalance &&
                        reason.trim() !== '' &&
                        expectReturnDate.trim() !== '' &&
                        !submitting
                        ? 1
                        : 0.5,
                  },
                ]}
                onPress={handleConfirmRent}
                disabled={
                  !hasEnoughBalance ||
                  reason.trim() === '' ||
                  expectReturnDate.trim() === '' ||
                  submitting
                }
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
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
                {qrCodeData && (() => {
                  // Check if it's a URL
                  if (typeof qrCodeData === 'string' && (qrCodeData.startsWith('http://') || qrCodeData.startsWith('https://'))) {
                    return (
                      <Image
                        source={{ uri: qrCodeData }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    );
                  }

                  // Check if it's already a data URI
                  if (typeof qrCodeData === 'string' && qrCodeData.startsWith('data:image')) {
                    return (
                      <Image
                        source={{ uri: qrCodeData }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    );
                  }

                  // Check if it's a base64 string - try to display as image
                  // Base64 strings are typically longer than 100 chars and contain only base64 characters
                  if (typeof qrCodeData === 'string' && qrCodeData.length > 50 &&
                    qrCodeData.match(/^[A-Za-z0-9+/=]+$/) &&
                    !qrCodeData.includes(' ') &&
                    !qrCodeData.includes('\n')) {
                    // Convert base64 to data URI (assume PNG format for QR codes)
                    const base64Uri = `data:image/png;base64,${qrCodeData}`;
                    return (
                      <Image
                        source={{ uri: base64Uri }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    );
                  }

                  // Fallback: show as text (should not happen for valid QR codes)
                  return (
                    <View style={styles.qrCodePlaceholder}>
                      <Icon name="qr-code" size={150} color="#667eea" />
                      <Text style={styles.qrCodeText}>{qrCodeData}</Text>
                    </View>
                  );
                })()}
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
  };

  return (
    <LecturerLayout title="Kit Rental">
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
                    : 'No kits available'}
                </Text>
              </View>
            }
            ListFooterComponent={
              filteredKits.length > 0 ? (
                <View style={styles.footerText}>
                  <Text style={styles.footerTextContent}>
                    Showing {filteredKits.length} of{' '}
                    {kits.filter(k => k.quantityAvailable > 0).length} available kit(s)
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

      {renderDetailModal()}
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
    backgroundColor: '#f5f5f5',
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
  rentButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  rentButtonText: {
    color: '#fff',
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  detailsImage: {
    width: '100%',
    height: '100%',
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailsValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  detailsValueBold: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: 15,
  },
  detailsValueSmall: {
    fontSize: 13,
    color: '#666',
  },
  componentsSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 300,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  componentCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  componentImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#eee',
  },
  componentImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#e6f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  componentCardContent: {
    padding: 10,
  },
  componentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  componentSerial: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  componentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(24, 144, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  componentBadgeText: {
    fontSize: 10,
    color: '#1890ff',
  },
  componentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  componentDetailText: {
    fontSize: 11,
    color: '#666',
  },
  componentPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#faad14',
    textAlign: 'right',
    marginTop: 4,
  },
  emptyComponents: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 20,
  },
  emptyComponentsText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LecturerKitRental;
