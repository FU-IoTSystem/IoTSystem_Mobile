import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { walletAPI } from '../../services/api';

const TopUpScreen = ({ user }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

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
      const description = `Nạp tiền IoT Wallet - ${amount.toLocaleString('vi-VN')} VND`;
      
      const response = await walletAPI.topUp(amount, description);
      
      if (response && response.data) {
        setTransactionResult({
          transactionId: response.data.id || response.data.transactionId || 'N/A',
          amount: amount,
          status: 'COMPLETED',
        });
        setShowSuccess(true);
        Alert.alert('Success', 'Nạp tiền thành công! Số dư ví đã được cập nhật.');
      } else {
        Alert.alert('Error', 'Không thể nạp tiền. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Top-up error:', error);
      Alert.alert('Error', error.message || 'Không thể nạp tiền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setShowSuccess(false);
    setTopUpAmount('');
    setSelectedAmount(null);
    setTransactionResult(null);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Payment Info */}
        {topUpAmount && (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount:</Text>
                <Text style={styles.infoValue}>
                  {parseInt(topUpAmount || 0).toLocaleString('vi-VN')} VND
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Method:</Text>
                <Text style={styles.infoValue}>Direct</Text>
              </View>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!topUpAmount || loading) && styles.submitButtonDisabled]}
          onPress={handleTopUp}
          disabled={!topUpAmount || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Top Up</Text>
          )}
        </TouchableOpacity>
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
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
