import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { paymentAPI, API_BASE_URL } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TopUpScreen = ({ user }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: amount selection, 1: confirmation

  const amountOptions = [
    { label: '50,000 VND', value: 50000 },
    { label: '100,000 VND', value: 100000 },
    { label: '200,000 VND', value: 200000 },
    { label: '500,000 VND', value: 500000 },
    { label: '1,000,000 VND', value: 1000000 },
    { label: '2,000,000 VND', value: 2000000 },
  ];

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setTopUpAmount(amount.toString());
  };

  const handleCustomAmountChange = (text) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setTopUpAmount(numericValue);
    setSelectedAmount(null);
  };

  // Handle PayPal return callback
  useEffect(() => {
    const parseUrl = (url) => {
      try {
        // For React Native, we need to manually parse the URL
        const parts = url.split('?');
        if (parts.length < 2) return {};
        
        const params = {};
        const queryString = parts[1];
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
          const [key, value] = pair.split('=');
          if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
          }
        });
        
        return params;
      } catch (error) {
        console.error('Error parsing URL:', error);
        return {};
      }
    };

    const handleDeepLink = async (event) => {
      const url = event.url || event;
      console.log('Deep link received:', url);
      
      if (!url || !url.includes('iotkitrental://')) {
        return;
      }
      
      try {
        const params = parseUrl(url);
        const paymentId = params.paymentId;
        const payerId = params.PayerID || params.payerId;
        const cancel = params.cancel;
        
        if (cancel === 'true') {
          Alert.alert('Payment Cancelled', 'Payment was cancelled');
          await AsyncStorage.removeItem('pendingPayPalPayment');
          return;
        }
        
        if (paymentId && payerId) {
          await handlePayPalReturn(paymentId, payerId);
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handlePayPalReturn = async (paymentId, payerId) => {
    setLoading(true);
    try {
      // Get stored payment info
      const storedPayment = await AsyncStorage.getItem('pendingPayPalPayment');
      if (!storedPayment) {
        Alert.alert('Error', 'Payment information not found');
        setLoading(false);
        return;
      }
      
      const paymentInfo = JSON.parse(storedPayment);
      
      // Execute PayPal payment
      const response = await paymentAPI.executePayPalPayment(
        paymentId, 
        payerId, 
        paymentInfo.transactionId
      );
      
      if (response && response.data) {
        Alert.alert('Success', 'Payment successful! Wallet balance has been updated.');
        
        // Set transaction result for display
        setTransactionResult({
          transactionId: response.data.transactionId || paymentInfo.transactionId,
          amount: paymentInfo.originalAmountVND || paymentInfo.amount
        });
        
        // Clear stored payment info
        await AsyncStorage.removeItem('pendingPayPalPayment');
        
        setShowSuccess(true);
        setCurrentStep(0);
      } else {
        Alert.alert('Error', 'Payment execution failed. Please try again.');
      }
    } catch (error) {
      console.error('PayPal payment execution error:', error);
      // Check if error is about payment already done
      if (error.message && error.message.includes('PAYMENT_ALREADY_DONE')) {
        Alert.alert('Success', 'Payment was already completed successfully!');
        setShowSuccess(true);
        setCurrentStep(0);
      } else {
        Alert.alert('Error', error.message || 'Payment execution failed. Please try again.');
      }
      await AsyncStorage.removeItem('pendingPayPalPayment');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    
    if (!amount || amount < 10000) {
      Alert.alert('Error', 'Số tiền nạp tối thiểu là 10,000 VND');
      return;
    }
    
    if (amount > 10000000) {
      Alert.alert('Error', 'Số tiền nạp tối đa là 10,000,000 VND');
      return;
    }

    setLoading(true);
    try {
      const description = `Top-up IoT Wallet - ${amount.toLocaleString('vi-VN')} VND`;
      
      // Convert VND to USD (approximate rate: 1 USD = 24,000 VND)
      const exchangeRate = 24000;
      const amountUSD = (amount / exchangeRate).toFixed(2);
      
      // Get return URL based on user role
      // For mobile, we'll use backend endpoint that redirects to deep link
      // PayPal will append paymentId and PayerID to the return URL
      const returnUrl = `${API_BASE_URL}/api/payment/paypal/return-mobile`;
      const cancelUrl = `${API_BASE_URL}/api/payment/paypal/return-mobile?cancel=true`;
      
      // Create PayPal payment
      const response = await paymentAPI.createPayPalPayment(
        parseFloat(amountUSD),
        description,
        returnUrl,
        cancelUrl
      );
      
      if (response && response.data) {
        const { approvalUrl, paymentId, transactionId } = response.data;
        
        if (approvalUrl) {
          // Store transaction info in AsyncStorage for callback handling
          await AsyncStorage.setItem('pendingPayPalPayment', JSON.stringify({
            paymentId,
            transactionId,
            amount: parseFloat(amountUSD),
            originalAmountVND: amount
          }));
          
          // Open PayPal approval page in browser
          const canOpen = await Linking.canOpenURL(approvalUrl);
          if (canOpen) {
            await Linking.openURL(approvalUrl);
          } else {
            Alert.alert('Error', 'Cannot open PayPal. Please check your browser settings.');
          }
        } else {
          Alert.alert('Error', 'Không thể tạo PayPal payment. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Error', 'Không thể tạo PayPal payment. Vui lòng thử lại.');
      }
      
    } catch (error) {
      console.error('PayPal payment creation error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        details: error.details
      });
      
      let errorMessage = 'Không thể tạo PayPal payment. Vui lòng thử lại.';
      
      if (error.message) {
        if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.';
        } else if (error.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 403) {
          errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
        } else if (error.status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        } else if (error.message && !error.message.includes('HTTP')) {
          errorMessage = error.message;
        } else {
          errorMessage = `Lỗi: ${error.message || `HTTP ${error.status || 'Unknown'}`}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else {
      handleTopUp();
    }
  };

  const handleComplete = () => {
    setShowSuccess(false);
    setTopUpAmount('');
    setSelectedAmount(null);
    setTransactionResult(null);
    setCurrentStep(0);
    navigation.goBack();
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 0 ? 'Top Up Wallet' : 'Confirm Payment'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 0 ? (
          <>
            {/* Amount Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Amount</Text>
              <View style={styles.amountGrid}>
                {amountOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.amountCard,
                      selectedAmount === option.value && styles.amountCardSelected,
                    ]}
                    onPress={() => handleAmountSelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.amountText,
                        selectedAmount === option.value && styles.amountTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Amount Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Or Enter Custom Amount</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount (VND)"
                  placeholderTextColor="#999"
                  value={topUpAmount}
                  onChangeText={handleCustomAmountChange}
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>
                  Minimum: 10,000 VND | Maximum: 10,000,000 VND
                </Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!topUpAmount || loading) && styles.submitButtonDisabled]}
              onPress={handleConfirm}
              disabled={!topUpAmount || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Payment Confirmation */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Amount:</Text>
                  <Text style={[styles.infoValue, styles.amountValue]}>
                    {parseInt(topUpAmount || 0).toLocaleString('vi-VN')} VND
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Method:</Text>
                  <Text style={styles.infoValue}>PayPal</Text>
                </View>
                <View style={styles.infoNote}>
                  <Icon name="info" size={16} color="#1890ff" />
                  <Text style={styles.infoNoteText}>
                    You will be redirected to PayPal to complete the payment
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.backButtonStyle]}
                onPress={() => setCurrentStep(0)}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={20} color="#667eea" style={styles.backButtonIcon} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleTopUp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Confirm Top Up</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="slide"
        onRequestClose={handleComplete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={64} color="#52c41a" />
            </View>
            <Text style={styles.successTitle}>Top Up Successful!</Text>
            <Text style={styles.successMessage}>
              Your wallet has been topped up with{' '}
              {transactionResult?.amount?.toLocaleString('vi-VN')} VND
            </Text>
            {transactionResult?.transactionId && (
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionLabel}>Transaction ID:</Text>
                <Text style={styles.transactionValue}>{transactionResult.transactionId}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.successButton} onPress={handleComplete}>
              <Text style={styles.successButtonText}>Back to Wallet</Text>
            </TouchableOpacity>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  amountCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  amountCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  amountTextSelected: {
    color: '#667eea',
  },
  inputContainer: {
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginLeft: 4,
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
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  amountValue: {
    color: '#52c41a',
    fontSize: 18,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1890ff',
  },
  infoNoteText: {
    fontSize: 14,
    color: '#1890ff',
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  backButtonStyle: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#d9d9d9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    flex: 0.4,
    minWidth: 100,
  },
  backButtonIcon: {
    marginRight: 6,
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1.6,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonText: {
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
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  transactionInfo: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  transactionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  successButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TopUpScreen;