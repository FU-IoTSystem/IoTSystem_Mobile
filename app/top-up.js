import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Appbar, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  TextInput,
  Surface,
  Divider,
  List,
  RadioButton,
  Chip,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../src/theme';
import { mockWallet } from '../mocks';

export default function TopUpScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [wallet, setWallet] = useState(mockWallet);

  // Predefined amounts
  const predefinedAmounts = [50000, 100000, 200000, 500000, 1000000];

  // Payment methods
  const paymentMethods = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer from your bank account',
      icon: '🏦',
      processingTime: '1-2 business days'
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Visa, Mastercard, American Express',
      icon: '💳',
      processingTime: 'Instant'
    },
    {
      id: 'e_wallet',
      name: 'E-Wallet',
      description: 'MoMo, ZaloPay, ShopeePay',
      icon: '📱',
      processingTime: 'Instant'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Bitcoin, Ethereum, USDT',
      icon: '₿',
      processingTime: '10-30 minutes'
    }
  ];

  useEffect(() => {
    // Load current wallet balance
    setWallet(mockWallet);
  }, []);

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString());
  };

  const handleCustomAmount = (text) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  const validateAmount = () => {
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 10000) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is 10,000 VND');
      return false;
    }
    if (numAmount > 10000000) {
      Alert.alert('Invalid Amount', 'Maximum top-up amount is 10,000,000 VND');
      return false;
    }
    return true;
  };

  const handleTopUp = async () => {
    if (!validateAmount()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const topUpAmount = parseInt(amount);
      const newBalance = wallet.balance + topUpAmount;
      
      // Update wallet
      const updatedWallet = {
        ...wallet,
        balance: newBalance,
        transactions: [
          {
            type: 'Top-up',
            amount: topUpAmount,
            date: new Date().toISOString().split('T')[0]
          },
          ...wallet.transactions
        ]
      };
      
      setWallet(updatedWallet);
      setSnackbarMessage(`Successfully topped up ${topUpAmount.toLocaleString()} VND!`);
      setShowSnackbar(true);
      
      // Reset form
      setAmount('');
      
      // Show success message
      Alert.alert(
        'Top-up Successful!',
        `Your wallet has been topped up with ${topUpAmount.toLocaleString()} VND.\nNew balance: ${newBalance.toLocaleString()} VND`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to process top-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return parseInt(amount || 0).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Current Balance */}
          <Card style={[styles.balanceCard, shadows.medium]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.balanceGradient}
            >
              <Card.Content>
                <Title style={styles.balanceTitle}>Current Balance</Title>
                <Title style={styles.balanceAmount}>
                  {wallet.balance.toLocaleString()} VND
                </Title>
                <Paragraph style={styles.balanceSubtitle}>
                  Available for kit rentals and payments
                </Paragraph>
              </Card.Content>
            </LinearGradient>
          </Card>

          {/* Amount Selection */}
          <Card style={[styles.card, shadows.medium]}>
            <Card.Content>
              <Title style={styles.cardTitle}>Select Amount</Title>
              
              {/* Predefined Amounts */}
              <Paragraph style={styles.sectionLabel}>Quick Select</Paragraph>
              <View style={styles.amountGrid}>
                {predefinedAmounts.map((predefinedAmount) => (
                  <Button
                    key={predefinedAmount}
                    mode={amount === predefinedAmount.toString() ? 'contained' : 'outlined'}
                    onPress={() => handleAmountSelect(predefinedAmount)}
                    style={styles.amountButton}
                    labelStyle={styles.amountButtonLabel}
                  >
                    {predefinedAmount.toLocaleString()}
                  </Button>
                ))}
              </View>

              <Divider style={styles.divider} />

              {/* Custom Amount */}
              <Paragraph style={styles.sectionLabel}>Custom Amount</Paragraph>
              <TextInput
                label="Enter amount (VND)"
                value={amount}
                onChangeText={handleCustomAmount}
                mode="outlined"
                keyboardType="numeric"
                style={styles.amountInput}
                right={<TextInput.Affix text="VND" />}
                placeholder="Enter amount"
              />
              
              {amount && (
                <Paragraph style={styles.amountPreview}>
                  You will add: {formatAmount(amount)} VND
                </Paragraph>
              )}
            </Card.Content>
          </Card>

          {/* Payment Method Selection */}
          <Card style={[styles.card, shadows.medium]}>
            <Card.Content>
              <Title style={styles.cardTitle}>Payment Method</Title>
              
              <RadioButton.Group
                onValueChange={setSelectedMethod}
                value={selectedMethod}
              >
                {paymentMethods.map((method) => (
                  <View key={method.id} style={styles.paymentMethodItem}>
                    <View style={styles.paymentMethodContent}>
                      <View style={styles.paymentMethodInfo}>
                        <View style={styles.paymentMethodHeader}>
                          <Title style={styles.paymentMethodIcon}>{method.icon}</Title>
                          <View style={styles.paymentMethodDetails}>
                            <Title style={styles.paymentMethodName}>{method.name}</Title>
                            <Paragraph style={styles.paymentMethodDescription}>
                              {method.description}
                            </Paragraph>
                            <Chip 
                              mode="outlined" 
                              compact
                              style={styles.processingTimeChip}
                              textStyle={styles.processingTimeText}
                            >
                              {method.processingTime}
                            </Chip>
                          </View>
                        </View>
                      </View>
                      <RadioButton value={method.id} />
                    </View>
                    {method.id !== paymentMethods[paymentMethods.length - 1].id && (
                      <Divider style={styles.methodDivider} />
                    )}
                  </View>
                ))}
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Summary */}
          {amount && (
            <Card style={[styles.card, shadows.medium]}>
              <Card.Content>
                <Title style={styles.cardTitle}>Transaction Summary</Title>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Current Balance:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    {wallet.balance.toLocaleString()} VND
                  </Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Top-up Amount:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    +{formatAmount(amount)} VND
                  </Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Processing Fee:</Paragraph>
                  <Paragraph style={styles.summaryValue}>0 VND</Paragraph>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.summaryRow}>
                  <Title style={styles.summaryTotalLabel}>New Balance:</Title>
                  <Title style={styles.summaryTotalValue}>
                    {(wallet.balance + parseInt(amount || 0)).toLocaleString()} VND
                  </Title>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Top-up Button */}
          <Button
            mode="contained"
            onPress={handleTopUp}
            loading={loading}
            disabled={!amount || loading}
            style={styles.topUpButton}
            labelStyle={styles.topUpButtonLabel}
            icon="wallet-plus"
          >
            {loading ? 'Processing...' : `Top Up ${formatAmount(amount)} VND`}
          </Button>

          {/* Terms and Conditions */}
          <Card style={[styles.card, shadows.small]}>
            <Card.Content>
              <Paragraph style={styles.termsText}>
                By proceeding with this top-up, you agree to our Terms of Service and Privacy Policy. 
                All transactions are secure and encrypted.
              </Paragraph>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  balanceGradient: {
    borderRadius: 16,
  },
  balanceTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  balanceSubtitle: {
    ...typography.body2,
    color: 'rgba(255,255,255,0.8)',
  },
  card: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  amountButton: {
    flex: 1,
    minWidth: '30%',
    marginBottom: spacing.sm,
  },
  amountButtonLabel: {
    fontSize: 12,
  },
  divider: {
    marginVertical: spacing.md,
  },
  amountInput: {
    marginBottom: spacing.sm,
  },
  amountPreview: {
    ...typography.body2,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentMethodItem: {
    marginBottom: spacing.sm,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  paymentMethodDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  processingTimeChip: {
    alignSelf: 'flex-start',
  },
  processingTimeText: {
    fontSize: 10,
  },
  methodDivider: {
    marginTop: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  summaryTotalLabel: {
    ...typography.h4,
    color: colors.text,
  },
  summaryTotalValue: {
    ...typography.h4,
    color: colors.success,
  },
  topUpButton: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  topUpButtonLabel: {
    ...typography.button,
    fontSize: 16,
  },
  termsText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  snackbar: {
    backgroundColor: colors.success,
  },
});