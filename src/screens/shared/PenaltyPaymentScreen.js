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
  const [currentStep, setCurrentStep] = useState(0); // 0: select, 1: confirm, 2: success

  // Get penalty ID from route params
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
      
      const mappedPenalties = penaltiesData.map(penalty => ({
        id: penalty.id,
        penaltyId: penalty.id,
        kitName: penalty.kitName || 'Unknown Kit',
        rentalId: penalty.borrowRequestId || 'N/A',
        amount: penalty.totalAmount || 0,
        penaltyType: penalty.type || 'other',
        dueDate: penalty.takeEffectDate || new Date().toISOString(),
        reason: penalty.note || 'Penalty fee',
        status: penalty.resolved ? 'resolved' : 'pending',
        originalData: penalty
      }));
      
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
      
      // Fetch penalty policy info for each detail
      if (detailsData.length > 0) {
        const detailsWithPolicies = await Promise.all(
          detailsData.map(async (detail) => {
            if (detail.policiesId) {
              try {
                const policyResponse = await penaltyPoliciesAPI.getById(detail.policiesId);
                const policyData = policyResponse?.data || policyResponse;
                return { ...detail, policy: policyData };
              } catch (error) {
                console.error(`Error loading policy for detail ${detail.id}:`, error);
                return { ...detail, policy: null };
              }
            }
            return { ...detail, policy: null };
          })
        );
        setPenaltyDetails(detailsWithPolicies);
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
      await penaltiesAPI.confirmPenaltyPayment(selectedPenalty.id);
      await loadWalletBalance();
      await loadPenalties();
      
      const newWalletBalance = walletBalance - selectedPenalty.amount;
      setPaymentResult({
        success: true,
        paymentId: `PAY-${Date.now()}`,
        penaltyId: selectedPenalty.id,
        amount: selectedPenalty.amount,
        remainingBalance: Math.max(0, newWalletBalance)
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

  const getPenaltyTypeText = (type) => {
    switch (type) {
      case 'late_return':
        return 'Late Return';
      case 'damage':
        return 'Damage';
      case 'overdue':
        return 'Overdue';
      default:
        return type;
    }
  };

  const renderPenaltyItem = ({ item }) => {
    const isInsufficient = item.amount > walletBalance;
    return (
      <TouchableOpacity
        style={[styles.penaltyCard, isInsufficient && styles.penaltyCardInsufficient]}
        onPress={() => handleSelectPenalty(item)}
      >
        <View style={styles.penaltyHeader}>
          <View style={[styles.penaltyIcon, { backgroundColor: `${getPenaltyTypeColor(item.penaltyType)}15` }]}>
            <Icon name="warning" size={24} color={getPenaltyTypeColor(item.penaltyType)} />
          </View>
          <View style={styles.penaltyInfo}>
            <Text style={styles.penaltyKitName}>{item.kitName}</Text>
            <View style={[styles.badge, { backgroundColor: `${getPenaltyTypeColor(item.penaltyType)}15` }]}>
              <Text style={[styles.badgeText, { color: getPenaltyTypeColor(item.penaltyType) }]}>
                {getPenaltyTypeText(item.penaltyType)}
              </Text>
            </View>
            <Text style={styles.penaltyDueDate}>
              Due: {dayjs(item.dueDate).format('DD/MM/YYYY')}
            </Text>
          </View>
          <View style={styles.penaltyAmount}>
            <Text style={[
              styles.amountText,
              { color: isInsufficient ? '#ff4d4f' : '#52c41a' }
            ]}>
              {item.amount.toLocaleString('vi-VN')} VND
            </Text>
            {isInsufficient && (
              <View style={[styles.badge, { backgroundColor: '#ff4d4f15', marginTop: 4 }]}>
                <Text style={[styles.badgeText, { color: '#ff4d4f' }]}>
                  Insufficient
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPenaltySelection = () => (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Select Penalty to Pay</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : penalties.length > 0 ? (
        <FlatList
          data={penalties}
          renderItem={renderPenaltyItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="check-circle" size={64} color="#52c41a" />
          <Text style={styles.emptyTitle}>No Pending Penalties</Text>
          <Text style={styles.emptyText}>
            You don't have any pending penalty fees to pay.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back to Wallet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderConfirmation = () => {
    if (!selectedPenalty) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Payment Confirmation</Text>
        
        {/* Penalty Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kit Name:</Text>
            <Text style={styles.infoValue}>{selectedPenalty.kitName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Penalty Type:</Text>
            <View style={[styles.badge, { backgroundColor: `${getPenaltyTypeColor(selectedPenalty.penaltyType)}15` }]}>
              <Text style={[styles.badgeText, { color: getPenaltyTypeColor(selectedPenalty.penaltyType) }]}>
                {getPenaltyTypeText(selectedPenalty.penaltyType)}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rental ID:</Text>
            <Text style={styles.infoValue}>{selectedPenalty.rentalId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount:</Text>
            <Text style={[styles.infoValue, styles.amountValue]}>
              {selectedPenalty.amount.toLocaleString('vi-VN')} VND
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date:</Text>
            <Text style={styles.infoValue}>
              {dayjs(selectedPenalty.dueDate).format('DD/MM/YYYY')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reason:</Text>
            <Text style={styles.infoValue}>{selectedPenalty.reason}</Text>
          </View>
        </View>

        {/* Penalty Details */}
        {penaltyDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Penalty Details</Text>
            <View style={styles.infoCard}>
              {penaltyDetails.map((detail, index) => (
                <View key={detail.id || index} style={styles.detailItem}>
                  <Text style={styles.detailTitle}>
                    Detail {index + 1}: {detail.description || 'Penalty Detail'}
                  </Text>
                  <Text style={styles.detailAmount}>
                    Amount: {detail.amount ? detail.amount.toLocaleString('vi-VN') : 0} VND
                  </Text>
                  {detail.policy && (
                    <View style={styles.policyInfo}>
                      <Text style={styles.policyLabel}>Policy: {detail.policy.policyName || 'N/A'}</Text>
                      {detail.policy.amount && (
                        <Text style={styles.policyAmount}>
                          Policy Amount: {detail.policy.amount.toLocaleString('vi-VN')} VND
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Borrow Request Info */}
        {borrowRequest && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Borrow Request Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Request ID:</Text>
                <Text style={styles.infoValue}>{borrowRequest.id || 'N/A'}</Text>
              </View>
              {borrowRequest.kit && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Kit Name:</Text>
                    <Text style={styles.infoValue}>
                      {borrowRequest.kit.kitName || borrowRequest.kitName || 'N/A'}
                    </Text>
                  </View>
                  {borrowRequest.kit.type && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Kit Type:</Text>
                      <Text style={styles.infoValue}>{borrowRequest.kit.type}</Text>
                    </View>
                  )}
                </>
              )}
              {borrowRequest.status && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={[styles.badge, { backgroundColor: '#1890ff15' }]}>
                    <Text style={[styles.badgeText, { color: '#1890ff' }]}>
                      {borrowRequest.status}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Wallet Balance */}
        <View style={styles.section}>
          <View style={[styles.infoCard, isBalanceSufficient() ? styles.balanceCardSufficient : styles.balanceCardInsufficient]}>
            <View style={styles.balanceRow}>
              <Icon 
                name="account-balance-wallet" 
                size={32} 
                color={isBalanceSufficient() ? '#1890ff' : '#ff4d4f'} 
              />
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Current Wallet Balance</Text>
                <Text style={[styles.balanceAmount, { color: isBalanceSufficient() ? '#1890ff' : '#ff4d4f' }]}>
                  {walletBalance.toLocaleString('vi-VN')} VND
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isBalanceSufficient() ? '#52c41a15' : '#ff4d4f15' }]}>
                <Text style={[styles.badgeText, { color: isBalanceSufficient() ? '#52c41a' : '#ff4d4f' }]}>
                  {isBalanceSufficient() ? 'Sufficient' : 'Insufficient'}
                </Text>
              </View>
            </View>
          </View>
          {!isBalanceSufficient() && (
            <View style={styles.alertCard}>
              <Icon name="warning" size={24} color="#ff4d4f" />
              <Text style={styles.alertText}>
                You need {(selectedPenalty.amount - walletBalance).toLocaleString('vi-VN')} VND more to pay this penalty.
              </Text>
              <TouchableOpacity 
                style={styles.topUpButton}
                onPress={() => navigation.navigate('TopUp')}
              >
                <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.backButton]}
            onPress={() => setCurrentStep(0)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton, !isBalanceSufficient() && styles.confirmButtonDisabled]}
            onPress={handleConfirmPayment}
            disabled={!isBalanceSufficient()}
          >
            <Text style={styles.confirmButtonText}>Confirm Payment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderSuccess = () => (
    <View style={styles.content}>
      <View style={styles.successContainer}>
        <Icon name="check-circle" size={80} color="#52c41a" />
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successMessage}>
          Penalty fee of {paymentResult?.amount?.toLocaleString('vi-VN')} VND has been paid successfully
        </Text>
        {paymentResult && (
          <View style={styles.paymentInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment ID:</Text>
              <Text style={styles.infoValue}>{paymentResult.paymentId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount Paid:</Text>
              <Text style={styles.infoValue}>{paymentResult.amount?.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Remaining Balance:</Text>
              <Text style={styles.infoValue}>{paymentResult.remainingBalance?.toLocaleString('vi-VN')} VND</Text>
            </View>
          </View>
        )}
        <TouchableOpacity style={styles.successButton} onPress={handleComplete}>
          <Text style={styles.successButtonText}>Back to Wallet</Text>
        </TouchableOpacity>
      </View>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Penalty Payment</Text>
        <View style={styles.placeholder} />
      </View>
      {getStepContent()}

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Icon name="warning" size={48} color="#fa8c16" />
            </View>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalMessage}>
              You are about to pay{' '}
              <Text style={styles.modalAmount}>
                {selectedPenalty?.amount?.toLocaleString('vi-VN')} VND
              </Text>{' '}
              for the penalty fee.
            </Text>
            <Text style={styles.modalWarning}>This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleProcessPayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Payment</Text>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  penaltyCard: {
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
  penaltyCardInsufficient: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d4f',
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  penaltyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  penaltyInfo: {
    flex: 1,
  },
  penaltyKitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  penaltyDueDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  penaltyAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#52c41a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  amountValue: {
    fontSize: 18,
    color: '#ff4d4f',
  },
  detailItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  policyInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  policyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  policyAmount: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: '600',
  },
  balanceCardSufficient: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  balanceCardInsufficient: {
    backgroundColor: '#fff2f0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d4f',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: '#fff2f0',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#ff4d4f',
    marginLeft: 12,
    marginRight: 12,
  },
  topUpButton: {
    backgroundColor: '#ff4d4f',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  topUpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    backgroundColor: '#f5f5f5',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  confirmButtonText: {
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
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  paymentInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  successButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#52c41a',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PenaltyPaymentScreen;
