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
  Chip,
  ActivityIndicator,
  Snackbar,
  DataTable,
  Searchbar,
  Modal,
  Portal
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../src/theme';
import { mockKits, mockWallet, mockGroups } from '../mocks';

export default function RentalRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKit, setSelectedKit] = useState(null);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [reason, setReason] = useState('');
  
  // Data states
  const [kits, setKits] = useState([]);
  const [wallet, setWallet] = useState(mockWallet);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load available kits
      const availableKits = mockKits.filter(kit => kit.status === 'AVAILABLE');
      setKits(availableKits);
      
      // Load wallet
      setWallet(mockWallet);
      
      
      // If kit is passed from previous screen, select it
      if (params.kitId) {
        const kit = availableKits.find(k => k.id === parseInt(params.kitId));
        if (kit) {
          setSelectedKit(kit);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleKitSelect = (kit) => {
    setSelectedKit(kit);
    setShowKitModal(true);
  };

  const handleKitConfirm = () => {
    setShowKitModal(false);
    // Kit is now selected, user can proceed with rental form
  };

  const calculateRentalCost = () => {
    if (!selectedKit || !startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    return selectedKit.price * days;
  };

  const validateForm = () => {
    if (!selectedKit) {
      Alert.alert('Error', 'Please select a kit to rent');
      return false;
    }
    if (!startDate) {
      Alert.alert('Error', 'Please select a start date');
      return false;
    }
    if (!endDate) {
      Alert.alert('Error', 'Please select an end date');
      return false;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return false;
    }
    if (!purpose.trim()) {
      Alert.alert('Error', 'Please provide a purpose for the rental');
      return false;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the rental');
      return false;
    }
    
    const rentalCost = calculateRentalCost();
    if (wallet.balance < rentalCost) {
      Alert.alert('Insufficient Funds', `You need ${rentalCost.toLocaleString()} VND but only have ${wallet.balance.toLocaleString()} VND`);
      return false;
    }
    
    return true;
  };

  const handleSubmitRental = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const rentalCost = calculateRentalCost();
      const newBalance = wallet.balance - rentalCost;
      
      // Update wallet
      const updatedWallet = {
        ...wallet,
        balance: newBalance,
        transactions: [
          {
            type: 'Kit Rental',
            amount: -rentalCost,
            date: new Date().toISOString().split('T')[0]
          },
          ...wallet.transactions
        ]
      };
      
      setWallet(updatedWallet);
      setSnackbarMessage('Rental request submitted successfully!');
      setShowSnackbar(true);
      
      // Show success message
      Alert.alert(
        'Rental Request Submitted!',
        `Your rental request for ${selectedKit.name} has been submitted successfully.\n\nRental Period: ${startDate} to ${endDate}\nTotal Cost: ${rentalCost.toLocaleString()} VND\nNew Balance: ${newBalance.toLocaleString()} VND`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rental request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredKits = kits.filter(kit => 
    kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kit.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rentalCost = calculateRentalCost();
  const days = selectedKit && startDate && endDate ? 
    Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 0;

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
                  Available for kit rentals
                </Paragraph>
              </Card.Content>
            </LinearGradient>
          </Card>

          {/* Kit Selection */}
          <Card style={[styles.card, shadows.medium]}>
            <Card.Content>
              <Title style={styles.cardTitle}>Select Kit</Title>
              
              {selectedKit ? (
                <View style={styles.selectedKitContainer}>
                  <View style={styles.selectedKitInfo}>
                    <Title style={styles.selectedKitName}>{selectedKit.name}</Title>
                    <Paragraph style={styles.selectedKitCategory}>{selectedKit.category}</Paragraph>
                    <Paragraph style={styles.selectedKitPrice}>
                      {selectedKit.price.toLocaleString()} VND/day
                    </Paragraph>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedKit(null)}
                    style={styles.changeKitButton}
                  >
                    Change
                  </Button>
                </View>
              ) : (
                <>
                  <Searchbar
                    placeholder="Search kits..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                  />
                  
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Kit Name</DataTable.Title>
                      <DataTable.Title>Category</DataTable.Title>
                      <DataTable.Title>Price/Day</DataTable.Title>
                      <DataTable.Title>Action</DataTable.Title>
                    </DataTable.Header>

                    {filteredKits.map((kit) => (
                      <DataTable.Row key={kit.id}>
                        <DataTable.Cell>{kit.name}</DataTable.Cell>
                        <DataTable.Cell>{kit.category}</DataTable.Cell>
                        <DataTable.Cell>{kit.price.toLocaleString()} VND</DataTable.Cell>
                        <DataTable.Cell>
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleKitSelect(kit)}
                          >
                            Select
                          </Button>
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Rental Details Form */}
          {selectedKit && (
            <Card style={[styles.card, shadows.medium]}>
              <Card.Content>
                <Title style={styles.cardTitle}>Rental Details</Title>
                
                {/* Date Selection */}
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <TextInput
                      label="Start Date"
                      value={startDate}
                      onChangeText={setStartDate}
                      mode="outlined"
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={styles.formField}>
                    <TextInput
                      label="End Date"
                      value={endDate}
                      onChangeText={setEndDate}
                      mode="outlined"
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>


                {/* Purpose */}
                <TextInput
                  label="Purpose *"
                  value={purpose}
                  onChangeText={setPurpose}
                  mode="outlined"
                  style={styles.formInput}
                  placeholder="What will you use this kit for?"
                  multiline
                  numberOfLines={3}
                />

                {/* Reason */}
                <TextInput
                  label="Reason *"
                  value={reason}
                  onChangeText={setReason}
                  mode="outlined"
                  style={styles.formInput}
                  placeholder="Why do you need this kit?"
                  multiline
                  numberOfLines={3}
                />
              </Card.Content>
            </Card>
          )}

          {/* Rental Summary */}
          {selectedKit && startDate && endDate && (
            <Card style={[styles.card, shadows.medium]}>
              <Card.Content>
                <Title style={styles.cardTitle}>Rental Summary</Title>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Kit:</Paragraph>
                  <Paragraph style={styles.summaryValue}>{selectedKit.name}</Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Rental Period:</Paragraph>
                  <Paragraph style={styles.summaryValue}>{startDate} to {endDate}</Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Duration:</Paragraph>
                  <Paragraph style={styles.summaryValue}>{days} days</Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Price per day:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    {selectedKit.price.toLocaleString()} VND
                  </Paragraph>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.summaryRow}>
                  <Title style={styles.summaryTotalLabel}>Total Cost:</Title>
                  <Title style={styles.summaryTotalValue}>
                    {rentalCost.toLocaleString()} VND
                  </Title>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Current Balance:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    {wallet.balance.toLocaleString()} VND
                  </Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Balance After:</Paragraph>
                  <Paragraph style={[
                    styles.summaryValue,
                    { color: wallet.balance >= rentalCost ? colors.success : colors.error }
                  ]}>
                    {(wallet.balance - rentalCost).toLocaleString()} VND
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Submit Button */}
          {selectedKit && (
            <Button
              mode="contained"
              onPress={handleSubmitRental}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              icon="send"
            >
              {loading ? 'Submitting...' : 'Submit Rental Request'}
            </Button>
          )}

          {/* Terms and Conditions */}
          <Card style={[styles.card, shadows.small]}>
            <Card.Content>
              <Paragraph style={styles.termsText}>
                By submitting this rental request, you agree to return the kit in good condition by the end date. 
                Late returns may incur additional charges. All transactions are final.
              </Paragraph>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Kit Details Modal */}
      <Portal>
        <Modal
          visible={showKitModal}
          onDismiss={() => setShowKitModal(false)}
          contentContainerStyle={styles.modal}
        >
          {selectedKit && (
            <View>
              <Title style={styles.modalTitle}>Kit Details</Title>
              
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.kitName}>{selectedKit.name}</Title>
                  <Paragraph style={styles.kitCategory}>{selectedKit.category}</Paragraph>
                  
                  <View style={styles.kitDetails}>
                    <View style={styles.kitDetailRow}>
                      <Paragraph style={styles.kitDetailLabel}>Price per day:</Paragraph>
                      <Paragraph style={styles.kitDetailValue}>
                        {selectedKit.price.toLocaleString()} VND
                      </Paragraph>
                    </View>
                    
                    <View style={styles.kitDetailRow}>
                      <Paragraph style={styles.kitDetailLabel}>Quantity:</Paragraph>
                      <Paragraph style={styles.kitDetailValue}>{selectedKit.quantity}</Paragraph>
                    </View>
                    
                    <View style={styles.kitDetailRow}>
                      <Paragraph style={styles.kitDetailLabel}>Location:</Paragraph>
                      <Paragraph style={styles.kitDetailValue}>{selectedKit.location}</Paragraph>
                    </View>
                    
                    {selectedKit.description && (
                      <View style={styles.kitDetailRow}>
                        <Paragraph style={styles.kitDetailLabel}>Description:</Paragraph>
                        <Paragraph style={styles.kitDetailValue}>
                          {selectedKit.description}
                        </Paragraph>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowKitModal(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleKitConfirm}
                  style={styles.modalButton}
                >
                  Select This Kit
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

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
  searchBar: {
    marginBottom: spacing.md,
  },
  selectedKitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedKitInfo: {
    flex: 1,
  },
  selectedKitName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selectedKitCategory: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectedKitPrice: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  changeKitButton: {
    marginLeft: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  formField: {
    flex: 1,
  },
  dateInput: {
    marginBottom: spacing.sm,
  },
  formInput: {
    marginBottom: spacing.md,
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
    color: colors.primary,
  },
  divider: {
    marginVertical: spacing.md,
  },
  submitButton: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  submitButtonLabel: {
    ...typography.button,
    fontSize: 16,
  },
  termsText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 8,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  kitName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  kitCategory: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  kitDetails: {
    gap: spacing.sm,
  },
  kitDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kitDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  kitDetailValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
  snackbar: {
    backgroundColor: colors.success,
  },
});