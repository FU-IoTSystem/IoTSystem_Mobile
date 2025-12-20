import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  penaltiesAPI, 
  penaltyDetailAPI, 
  penaltyPoliciesAPI, 
  walletAPI, 
  borrowingRequestAPI 
} from '../../services/api';
import dayjs from 'dayjs';

const PenaltyPaymentScreen = ({ user }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState([]);
  const [selectedPenalty, setSelectedPenalty] = useState(null);
  const [penaltyDetails, setPenaltyDetails] = useState([]);
  const [borrowRequest, setBorrowRequest] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentResult, setPaymentResult] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const penaltyId = route.params?.penaltyId;

  useEffect(() => {
    loadPenalties();
    loadWalletBalance();
  }, []);

  useEffect(() => {
    if (penaltyId && penalties.length > 0) {
      const penalty = penalties.find(p => p.id === penaltyId || p.penaltyId === penaltyId);
      if (penalty) {
        handleSelectPenalty(penalty);
      }
    }
  }, [penaltyId, penalties]);

  const loadWalletBalance = async () => {
    try {
      const walletResponse = await walletAPI.getMyWallet();
      const walletData = walletResponse?.data || walletResponse || {};
      setWalletBalance(walletData.balance || 0);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
    }
  };

  const loadPenalties = async () => {
    try {
      setLoading(true);
      const response = await penaltiesAPI.getPenByAccount();
      
      let penaltiesData = [];
      if (Array.isArray(response)) {
        penaltiesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        penaltiesData = response.data;
      }
      
      // Map penalties and extract kitName from nested structure
      const mappedPenalties = await Promise.all(
        penaltiesData.map(async (penalty) => {
          // Extract kitName from nested structure (preferred method)
          const borrowRequest = penalty.request || penalty.borrowRequest || {};
          const kit = borrowRequest?.kit || {};
          let kitName = kit.kitName || kit.name || penalty.kitName || null;
          let kitType = kit.type || penalty.kitType || penalty.kit_type || null;
          
          // Only load borrowRequest if kitName not found in nested structure
          // This avoids unnecessary API calls when data is already available
          if ((!kitName || !kitType) && (penalty.borrowRequestId || borrowRequest.id)) {
            try {
              const borrowRequestId = penalty.borrowRequestId || borrowRequest.id;
              const borrowResponse = await borrowingRequestAPI.getById(borrowRequestId);
              const borrowData = borrowResponse?.data || borrowResponse || {};
              if (!kitName) {
                kitName = borrowData.kit?.kitName || borrowData.kitName || null;
              }
              if (!kitType) {
                kitType = borrowData.kit?.type || borrowData.kitType || null;
              }
            } catch (error) {
              console.error(`Error loading borrow request for penalty ${penalty.id}:`, error);
            }
          }
          
          // Determine penalty type from policy or penalty details
          let penaltyType = penalty.type || null;
          if (!penaltyType) {
            // Try to get type from nested policy
            if (penalty.policies || penalty.penaltyPolicies) {
              const policy = penalty.policies || penalty.penaltyPolicies;
              const policyName = (policy.policyName || policy.name || '').toLowerCase();
              if (policyName.includes('late') || policyName.includes('return')) {
                penaltyType = 'late_return';
              } else if (policyName.includes('damage')) {
                penaltyType = 'damage';
              } else if (policyName.includes('overdue')) {
                penaltyType = 'overdue';
              }
            }
          }
          
          return {
            id: penalty.id,
            penaltyId: penalty.id,
            kitName: kitName || 'N/A',
            kitType: kitType || null,
            rentalId: penalty.borrowRequestId || borrowRequest.id || 'N/A',
            amount: penalty.totalAmount || penalty.total_ammount || 0,
            penaltyType: penaltyType || 'other',
            dueDate: penalty.takeEffectDate || penalty.take_effect_date || new Date().toISOString(),
            reason: penalty.note || 'Penalty fee',
            status: penalty.resolved ? 'resolved' : 'pending',
            originalData: penalty
          };
        })
      );
      
      const pendingPenalties = mappedPenalties.filter(p => p.status === 'pending');
      setPenalties(pendingPenalties);
    } catch (error) {
      console.error('Error loading penalties:', error);
      setPenalties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPenaltyDetails = async (penaltyId) => {
    if (!penaltyId) {
      setPenaltyDetails([]);
      return;
    }

    try {
      const response = await penaltyDetailAPI.findByPenaltyId(penaltyId);
      
      let detailsData = [];
      if (Array.isArray(response)) {
        detailsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        detailsData = response.data;
      } else if (response && response.id) {
        detailsData = [response];
      }
      
      if (detailsData.length > 0) {
        const detailsWithPolicies = await Promise.all(
          detailsData.map(async (detail) => {
            let policyData = null;
            if (detail.policiesId) {
              try {
                const policyResponse = await penaltyPoliciesAPI.getById(detail.policiesId);
                policyData = policyResponse?.data || policyResponse;
              } catch (error) {
                console.error(`Error loading policy for detail ${detail.id}:`, error);
              }
            }
            
            return { ...detail, policy: policyData };
          })
        );
        
        setPenaltyDetails(detailsWithPolicies);
        
        // Update penalty type based on policy if found
        if (detailsWithPolicies.length > 0) {
          const firstDetail = detailsWithPolicies[0];
          if (firstDetail.policy) {
            const policyName = firstDetail.policy.policyName || firstDetail.policy.name || '';
            let newType = 'other';
            if (policyName.toLowerCase().includes('late')) {
              newType = 'late_return';
            } else if (policyName.toLowerCase().includes('damage')) {
              newType = 'damage';
            } else if (policyName.toLowerCase().includes('overdue')) {
              newType = 'overdue';
            }
            
            if (newType !== 'other' && selectedPenalty && selectedPenalty.penaltyType === 'other') {
              setSelectedPenalty(prev => ({
                ...prev,
                penaltyType: newType
              }));
            }
          }
        }
      } else {
        setPenaltyDetails([]);
      }
    } catch (error) {
      console.error('Error loading penalty details:', error);
      setPenaltyDetails([]);
    }
  };

  const loadBorrowRequest = async (borrowRequestId) => {
    if (!borrowRequestId || borrowRequestId === 'N/A') {
      setBorrowRequest(null);
      return;
    }
    
    try {
      const response = await borrowingRequestAPI.getById(borrowRequestId);
      const requestData = response?.data || response;
      setBorrowRequest(requestData);
      
      // Update kitName and kitType in selectedPenalty if not set or is 'N/A'
      if (selectedPenalty) {
        const updates = {};
        if (selectedPenalty.kitName === 'N/A' || !selectedPenalty.kitName) {
          const kitName = requestData.kit?.kitName || requestData.kitName || null;
          if (kitName) {
            updates.kitName = kitName;
          }
        }
        if (!selectedPenalty.kitType) {
          const kitType = requestData.kit?.type || requestData.kitType || null;
          if (kitType) {
            updates.kitType = kitType;
          }
        }
        if (Object.keys(updates).length > 0) {
          setSelectedPenalty(prev => ({
            ...prev,
            ...updates
          }));
        }
      }
    } catch (error) {
      console.error('Error loading borrow request:', error);
      setBorrowRequest(null);
    }
  };

  const handleSelectPenalty = (penalty) => {
    setSelectedPenalty(penalty);
    loadPenaltyDetails(penalty.id);
    if (penalty.rentalId && penalty.rentalId !== 'N/A') {
      loadBorrowRequest(penalty.rentalId);
    } else {
      const originalData = penalty.originalData;
      if (originalData && originalData.borrowRequestId) {
        loadBorrowRequest(originalData.borrowRequestId);
      } else {
        setBorrowRequest(null);
      }
    }
    setCurrentStep(1);
  };

  const handleConfirmPayment = () => {
    if (!isBalanceSufficient()) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${(selectedPenalty.amount - walletBalance).toLocaleString('vi-VN')} VND more to pay this penalty. Please top up your wallet first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Top Up', 
            onPress: () => navigation.navigate('TopUp')
          }
        ]
      );
      return;
    }
    setShowConfirmation(true);
  };

  const handleProcessPayment = async () => {
    setShowConfirmation(false);
    setLoading(true);
    try {
      // Process payment
      await penaltiesAPI.confirmPenaltyPayment(selectedPenalty.id);
      
      // Reload wallet balance to get the updated balance from server
      const updatedWalletResponse = await walletAPI.getMyWallet();
      const updatedWalletData = updatedWalletResponse?.data || updatedWalletResponse || {};
      const updatedBalance = updatedWalletData.balance || 0;
      
      // Update wallet balance state
      setWalletBalance(updatedBalance);
      
      // Reload penalties list
      await loadPenalties();
      
      // Set payment result with actual remaining balance from server
      setPaymentResult({
        success: true,
        paymentId: `PAY-${Date.now()}`,
        penaltyId: selectedPenalty.id,
        amount: selectedPenalty.amount,
        remainingBalance: updatedBalance,
        previousBalance: walletBalance
      });
      
      setCurrentStep(2);
      setShowSuccess(true);
      Alert.alert('Success', 'Thanh toán penalty thành công!');
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setShowSuccess(false);
    setSelectedPenalty(null);
    setPenaltyDetails([]);
    setBorrowRequest(null);
    setPaymentResult(null);
    setCurrentStep(0);
    navigation.goBack();
  };

  const isBalanceSufficient = () => {
    return walletBalance >= (selectedPenalty?.amount || 0);
  };

  const getPenaltyTypeColor = (type) => {
    switch (type) {
      case 'late_return':
        return '#fa8c16';
      case 'damage':
        return '#ff4d4f';
      case 'overdue':
        return '#722ed1';
      default:
        return '#666';
    }
  };

  const getPenaltyTypeText = (type, penalty = null) => {
    switch (type) {
      case 'late_return':
        return 'Late Return';
      case 'damage':
        return 'Damage';
      case 'overdue':
        return 'Overdue';
      case 'other':
        // If type is 'other', show kit type instead
        if (penalty && penalty.kitType) {
          return penalty.kitType;
        }
        return 'Other';
      default:
        // If type is not recognized, try to show kit type
        if (penalty && penalty.kitType) {
          return penalty.kitType;
        }
        return type || 'Other';
    }
  };

  const getPenaltyTypeIcon = (type) => {
    switch (type) {
      case 'late_return':
        return 'schedule';
      case 'damage':
        return 'build';
      case 'overdue':
        return 'error-outline';
      default:
        return 'warning';
    }
  };

  const renderStepIndicator = () => {
    const steps = ['Select', 'Confirm', 'Success'];
    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              currentStep >= index && styles.stepCircleActive
            ]}>
              {currentStep > index ? (
                <Icon name="check" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep >= index && styles.stepNumberActive
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep >= index && styles.stepLabelActive
            ]}>
              {step}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                currentStep > index && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPenaltyItem = ({ item }) => {
    const isInsufficient = item.amount > walletBalance;
    const typeColor = getPenaltyTypeColor(item.penaltyType);
    
    return (
      <TouchableOpacity
        style={[
          styles.penaltyCard,
          isInsufficient && styles.penaltyCardInsufficient
        ]}
        onPress={() => handleSelectPenalty(item)}
        activeOpacity={0.7}
      >
        <View style={styles.penaltyCardContent}>
          <View style={[styles.penaltyIconContainer, { backgroundColor: `${typeColor}15` }]}>
            <Icon 
              name={getPenaltyTypeIcon(item.penaltyType)} 
              size={28} 
              color={typeColor} 
            />
          </View>
          
          <View style={styles.penaltyMainInfo}>
            <Text style={styles.penaltyKitName} numberOfLines={1}>
              {item.kitName}
            </Text>
            <View style={styles.penaltyMetaRow}>
              <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                  {getPenaltyTypeText(item.penaltyType, item)}
                </Text>
              </View>
              <View style={styles.dateContainer}>
                <Icon name="calendar-today" size={14} color="#999" />
                <Text style={styles.penaltyDueDate}>
                  {dayjs(item.dueDate).format('DD/MM/YYYY')}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.penaltyAmountContainer}>
            <Text style={[
              styles.amountText,
              isInsufficient && styles.amountTextInsufficient
            ]}>
              {item.amount.toLocaleString('vi-VN')} VND
            </Text>
            {isInsufficient && (
              <View style={styles.insufficientBadge}>
                <Icon name="error" size={12} color="#ff4d4f" />
                <Text style={styles.insufficientText}>Insufficient</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPenaltySelection = () => (
    <View style={styles.content}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Penalty Payment</Text>
        <Text style={styles.pageSubtitle}>
          Select a penalty to proceed with payment
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading penalties...</Text>
        </View>
      ) : penalties.length > 0 ? (
        <FlatList
          data={penalties}
          renderItem={renderPenaltyItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="check-circle" size={80} color="#52c41a" />
          </View>
          <Text style={styles.emptyTitle}>No Pending Penalties</Text>
          <Text style={styles.emptyText}>
            You don't have any pending penalty fees to pay at the moment.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={20} color="#667eea" />
            <Text style={styles.emptyButtonText}>Back to Wallet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderConfirmation = () => {
    if (!selectedPenalty) return null;

    const typeColor = getPenaltyTypeColor(selectedPenalty.penaltyType);
    const sufficient = isBalanceSufficient();

    return (
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Payment Confirmation</Text>
          <Text style={styles.pageSubtitle}>
            Review your penalty details before payment
          </Text>
        </View>

        {/* Penalty Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIconContainer, { backgroundColor: `${typeColor}15` }]}>
              <Icon 
                name={getPenaltyTypeIcon(selectedPenalty.penaltyType)} 
                size={32} 
                color={typeColor} 
              />
            </View>
            <View style={styles.summaryHeaderText}>
              <Text style={styles.summaryTitle}>{selectedPenalty.kitName}</Text>
              <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                  {getPenaltyTypeText(selectedPenalty.penaltyType, selectedPenalty)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryAmountContainer}>
            <Text style={styles.summaryAmountLabel}>Total Amount</Text>
            <Text style={styles.summaryAmountValue}>
              {selectedPenalty.amount.toLocaleString('vi-VN')} VND
            </Text>
          </View>
        </View>

        {/* Penalty Details */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionHeader}>
            <Icon name="info-outline" size={20} color="#667eea" />
            <Text style={styles.sectionTitle}>Penalty Information</Text>
          </View>
          <View style={styles.infoCard}>
            <InfoRow label="Rental ID" value={selectedPenalty.rentalId} />
            <InfoRow 
              label="Due Date" 
              value={dayjs(selectedPenalty.dueDate).format('DD/MM/YYYY HH:mm')} 
            />
            <InfoRow label="Reason" value={selectedPenalty.reason} />
          </View>
        </View>

        {/* Penalty Details List */}
        {penaltyDetails.length > 0 && (
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <Icon name="list" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>Penalty Details</Text>
            </View>
            <View style={styles.infoCard}>
              {penaltyDetails.map((detail, index) => (
                <View key={detail.id || index} style={styles.detailItem}>
                  <View style={styles.detailItemHeader}>
                    <Text style={styles.detailItemTitle}>
                      Detail {index + 1}
                    </Text>
                    <Text style={styles.detailItemAmount}>
                      {detail.amount ? detail.amount.toLocaleString('vi-VN') : 0} VND
                    </Text>
                  </View>
                  {detail.description && (
                    <Text style={styles.detailItemDescription}>
                      {detail.description}
                    </Text>
                  )}
                  {detail.policy && (
                    <View style={styles.policyCard}>
                      <View style={styles.policyHeader}>
                        <Icon name="policy" size={16} color="#1890ff" />
                        <Text style={styles.policyName}>
                          {detail.policy.policyName || 'N/A'}
                        </Text>
                      </View>
                      {detail.policy.amount && (
                        <Text style={styles.policyAmount}>
                          Policy Amount: {detail.policy.amount.toLocaleString('vi-VN')} VND
                        </Text>
                      )}
                    </View>
                  )}
                  {index < penaltyDetails.length - 1 && (
                    <View style={styles.detailDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Borrow Request Info */}
        {borrowRequest && (
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <Icon name="shopping-cart" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>Borrow Request</Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow label="Request ID" value={borrowRequest.id || 'N/A'} />
              {borrowRequest.kit && (
                <>
                  <InfoRow 
                    label="Kit Name" 
                    value={borrowRequest.kit.kitName || borrowRequest.kitName || 'N/A'} 
                  />
                  {borrowRequest.kit.type && (
                    <InfoRow label="Kit Type" value={borrowRequest.kit.type} />
                  )}
                </>
              )}
              {borrowRequest.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={[styles.typeBadge, { backgroundColor: '#1890ff15' }]}>
                    <Text style={[styles.typeBadgeText, { color: '#1890ff' }]}>
                      {borrowRequest.status}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Wallet Balance Card */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionHeader}>
            <Icon name="account-balance-wallet" size={20} color="#667eea" />
            <Text style={styles.sectionTitle}>Wallet Balance</Text>
          </View>
          <View style={[
            styles.walletCard,
            sufficient ? styles.walletCardSufficient : styles.walletCardInsufficient
          ]}>
            <View style={styles.walletCardContent}>
              <View style={styles.walletIconContainer}>
                <Icon 
                  name="account-balance-wallet" 
                  size={40} 
                  color={sufficient ? '#52c41a' : '#ff4d4f'} 
                />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Current Balance</Text>
                <Text style={[
                  styles.walletAmount,
                  sufficient ? styles.walletAmountSufficient : styles.walletAmountInsufficient
                ]}>
                  {walletBalance.toLocaleString('vi-VN')} VND
                </Text>
                <View style={[
                  styles.walletStatusBadge,
                  sufficient ? styles.walletStatusSufficient : styles.walletStatusInsufficient
                ]}>
                  <Icon 
                    name={sufficient ? 'check-circle' : 'error'} 
                    size={14} 
                    color={sufficient ? '#52c41a' : '#ff4d4f'} 
                  />
                  <Text style={[
                    styles.walletStatusText,
                    sufficient ? styles.walletStatusTextSufficient : styles.walletStatusTextInsufficient
                  ]}>
                    {sufficient ? 'Sufficient' : 'Insufficient'}
                  </Text>
                </View>
              </View>
            </View>
            {!sufficient && (
              <View style={styles.insufficientAlert}>
                <Icon name="warning" size={20} color="#ff4d4f" />
                <View style={styles.insufficientAlertContent}>
                  <Text style={styles.insufficientAlertTitle}>
                    Insufficient Balance
                  </Text>
                  <Text style={styles.insufficientAlertText}>
                    You need {(selectedPenalty.amount - walletBalance).toLocaleString('vi-VN')} VND more
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.topUpButton}
                  onPress={() => navigation.navigate('TopUp')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.topUpButtonText}>Top Up</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setCurrentStep(0)}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={20} color="#666" />
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !sufficient && styles.primaryButtonDisabled
            ]}
            onPress={handleConfirmPayment}
            disabled={!sufficient}
            activeOpacity={0.7}
          >
            <Icon name="payment" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Confirm Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderSuccess = () => (
    <View style={styles.content}>
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <View style={styles.successIconBackground}>
            <Icon name="check-circle" size={80} color="#52c41a" />
          </View>
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successMessage}>
          Your penalty fee of{' '}
          <Text style={styles.successAmount}>
            {paymentResult?.amount?.toLocaleString('vi-VN')} VND
          </Text>{' '}
          has been paid successfully.
        </Text>
        
        {paymentResult && (
          <View style={styles.paymentInfoCard}>
            <View style={styles.paymentInfoHeader}>
              <Icon name="receipt" size={24} color="#667eea" />
              <Text style={styles.paymentInfoTitle}>Payment Receipt</Text>
            </View>
            <View style={styles.paymentInfoDivider} />
            <InfoRow label="Payment ID" value={paymentResult.paymentId} />
            <InfoRow 
              label="Amount Paid" 
              value={`${paymentResult.amount?.toLocaleString('vi-VN')} VND`} 
            />
            {paymentResult.previousBalance !== undefined && (
              <View style={styles.balanceChangeRow}>
                <View style={styles.balanceChangeItem}>
                  <Text style={styles.balanceChangeLabel}>Previous Balance</Text>
                  <Text style={styles.balanceChangeValue}>
                    {paymentResult.previousBalance?.toLocaleString('vi-VN')} VND
                  </Text>
                </View>
                <Icon name="arrow-downward" size={20} color="#ff4d4f" />
                <View style={styles.balanceChangeItem}>
                  <Text style={styles.balanceChangeLabel}>Amount Deducted</Text>
                  <Text style={[styles.balanceChangeValue, styles.balanceChangeDeducted]}>
                    -{paymentResult.amount?.toLocaleString('vi-VN')} VND
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.remainingBalanceRow}>
              <View style={styles.remainingBalanceIcon}>
                <Icon name="account-balance-wallet" size={24} color="#52c41a" />
              </View>
              <View style={styles.remainingBalanceContent}>
                <Text style={styles.remainingBalanceLabel}>Remaining Balance</Text>
                <Text style={styles.remainingBalanceValue}>
                  {paymentResult.remainingBalance?.toLocaleString('vi-VN')} VND
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.successButton} 
          onPress={handleComplete}
          activeOpacity={0.7}
        >
          <Icon name="home" size={20} color="#fff" />
          <Text style={styles.successButtonText}>Back to Wallet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPenaltySelection();
      case 1:
        return renderConfirmation();
      case 2:
        return renderSuccess();
      default:
        return renderPenaltySelection();
    }
  };

  const getHeaderTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Penalty Payment';
      case 1:
        return 'Confirm Payment';
      case 2:
        return 'Payment Success';
      default:
        return 'Penalty Payment';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => currentStep === 0 ? navigation.goBack() : setCurrentStep(0)} 
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {currentStep < 2 && renderStepIndicator()}
      
      {getStepContent()}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconBackground}>
                <Icon name="payment" size={48} color="#667eea" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.modalMessage}>
              You are about to pay{' '}
              <Text style={styles.modalAmount}>
                {selectedPenalty?.amount?.toLocaleString('vi-VN')} VND
              </Text>{' '}
              for the penalty fee.
            </Text>
            <Text style={styles.modalWarning}>
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmation(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleProcessPayment}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#667eea',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    marginLeft: 8,
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
    marginTop: -18,
  },
  stepLineActive: {
    backgroundColor: '#667eea',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 8,
  },
  penaltyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  penaltyCardInsufficient: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d4f',
    backgroundColor: '#fff5f5',
  },
  penaltyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  penaltyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  penaltyMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  penaltyKitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  penaltyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  penaltyDueDate: {
    fontSize: 12,
    color: '#999',
  },
  penaltyAmountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#52c41a',
    marginBottom: 4,
  },
  amountTextInsufficient: {
    color: '#ff4d4f',
  },
  insufficientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ff4d4f15',
  },
  insufficientText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ff4d4f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#52c41a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  summaryAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryAmountLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryAmountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
  detailItem: {
    marginBottom: 16,
  },
  detailItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  detailItemAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  detailItemDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 16,
  },
  policyCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1890ff',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  policyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1890ff',
  },
  policyAmount: {
    fontSize: 12,
    color: '#666',
  },
  walletCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  walletCardSufficient: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#52c41a',
  },
  walletCardInsufficient: {
    backgroundColor: '#fff2f0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d4f',
  },
  walletCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIconContainer: {
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  walletAmountSufficient: {
    color: '#52c41a',
  },
  walletAmountInsufficient: {
    color: '#ff4d4f',
  },
  walletStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  walletStatusSufficient: {
    backgroundColor: '#52c41a15',
  },
  walletStatusInsufficient: {
    backgroundColor: '#ff4d4f15',
  },
  walletStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  walletStatusTextSufficient: {
    color: '#52c41a',
  },
  walletStatusTextInsufficient: {
    color: '#ff4d4f',
  },
  insufficientAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  insufficientAlertContent: {
    flex: 1,
  },
  insufficientAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff4d4f',
    marginBottom: 4,
  },
  insufficientAlertText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  topUpButton: {
    backgroundColor: '#ff4d4f',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  topUpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successIconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#52c41a15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successAmount: {
    fontWeight: 'bold',
    color: '#52c41a',
  },
  paymentInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  paymentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  paymentInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  paymentInfoDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  balanceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    gap: 12,
  },
  balanceChangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceChangeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  balanceChangeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  balanceChangeDeducted: {
    color: '#ff4d4f',
  },
  remainingBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#52c41a',
    marginTop: 8,
  },
  remainingBalanceIcon: {
    marginRight: 12,
  },
  remainingBalanceContent: {
    flex: 1,
  },
  remainingBalanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  remainingBalanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#52c41a',
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  modalAmount: {
    fontWeight: 'bold',
    color: '#ff4d4f',
  },
  modalWarning: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#52c41a',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PenaltyPaymentScreen;
