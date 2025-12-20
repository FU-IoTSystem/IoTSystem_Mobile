import React, { useEffect, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { walletAPI, walletTransactionAPI } from '../../services/api';

const TransferScreen = () => {
  const navigation = useNavigation();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const response = await walletAPI.getMyWallet();
      const walletData = response?.data || response || {};
      setBalance(walletData.balance || 0);
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
      Alert.alert('Lỗi', 'Không thể tải số dư ví. Vui lòng thử lại.');
    }
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleTransfer = async () => {
    const amountNumber = parseInt(amount, 10);

    if (!recipientEmail.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email người nhận.');
      return;
    }

    if (!validateEmail(recipientEmail.trim())) {
      Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email.');
      return;
    }

    if (!amountNumber || amountNumber <= 0) {
      Alert.alert('Số tiền không hợp lệ', 'Vui lòng nhập số tiền lớn hơn 0.');
      return;
    }

    if (amountNumber > balance) {
      Alert.alert(
        'Số dư không đủ',
        'Số tiền chuyển vượt quá số dư hiện tại. Vui lòng nạp thêm hoặc nhập số tiền nhỏ hơn.'
      );
      return;
    }

    setLoading(true);
    try {
      await walletTransactionAPI.transfer(
        recipientEmail.trim(),
        amountNumber,
        description?.trim() || 'Transfer money'
      );
      setSuccessInfo({
        recipient: recipientEmail.trim(),
        amount: amountNumber,
      });
      setShowSuccess(true);
      setBalance((prev) => Math.max(prev - amountNumber, 0));
      setAmount('');
      setRecipientEmail('');
      setDescription('');
    } catch (error) {
      console.error('Transfer failed:', error);
      const message =
        error?.message ||
        error?.details?.message ||
        'Chuyển tiền thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessInfo(null);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyển tiền</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Số dư hiện tại</Text>
            <Text style={styles.balance}>
              {balance.toLocaleString('vi-VN')} VND
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Email người nhận</Text>
            <TextInput
              style={styles.input}
              placeholder="example@domain.com"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Số tiền (VND)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số tiền"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, '');
                setAmount(numeric);
              }}
            />
            <Text style={styles.helperText}>
              Số tiền không được vượt quá số dư ví.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Mô tả (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập mô tả giao dịch"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Xác nhận chuyển</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccess} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Icon name="check-circle" size={64} color="#52c41a" />
            <Text style={styles.successTitle}>Chuyển tiền thành công</Text>
            <Text style={styles.successText}>
              Đã chuyển{' '}
              {successInfo?.amount
                ? successInfo.amount.toLocaleString('vi-VN')
                : 0}{' '}
              VND đến {successInfo?.recipient || 'người nhận'}
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={handleCloseSuccess}
            >
              <Text style={styles.successButtonText}>Đóng</Text>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#2c3e50',
    marginBottom: 8,
    fontWeight: '600',
  },
  balance: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#52c41a',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
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
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  successButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  flex: {
    flex: 1,
  },
});

export default TransferScreen;

