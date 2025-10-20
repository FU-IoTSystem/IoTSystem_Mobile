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
  Portal,
  RadioButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../src/theme';
import { mockKits, mockWallet } from '../mocks';

export default function RefundRequestScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form states
  const [refundReason, setRefundReason] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Data states
  const [rentals, setRentals] = useState([]);
  const [wallet, setWallet] = useState(mockWallet);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user's active rentals (mock data)
      const userRentals = [
        {
          id: 1,
          kitId: 1,
          kitName: 'IoT Starter Kit',
          kitCategory: 'IoT Development',
          rentalDate: '2024-01-15',
          dueDate: '2024-01-22',
          returnDate: null,
          status: 'active',
          dailyRate: 50000,
          totalDays: 7,
          totalCost: 350000,
          purpose: 'University project development',
          groupName: 'IoT Development Team'
        },
        {
          id: 2,
          kitId: 2,
          kitName: 'Raspberry Pi Kit',
          kitCategory: 'Embedded Systems',
          rentalDate: '2024-01-10',
          dueDate: '2024-01-17',
          returnDate: '2024-01-16',
          status: 'returned',
          dailyRate: 70000,
          totalDays: 6,
          totalCost: 420000,
          purpose: 'Prototype development',
          groupName: 'Smart City Project'
        },
        {
          id: 3,
          kitId: 3,
          kitName: 'Arduino Starter Kit',
          kitCategory: 'Microcontrollers',
          rentalDate: '2024-01-20',
          dueDate: '2024-01-27',
          returnDate: null,
          status: 'active',
          dailyRate: 30000,
          totalDays: 7,
          totalCost: 210000,
          purpose: 'Learning and experimentation',
          groupName: 'IoT Development Team'
        }
      ];
      
      setRentals(userRentals);
      setWallet(mockWallet);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handleRentalSelect = (rental) => {
    setSelectedRental(rental);
    setShowRentalModal(true);
  };

  const handleRentalConfirm = () => {
    setShowRentalModal(false);
    // Rental is now selected, user can proceed with refund form
  };


  const validateForm = () => {
    if (!selectedRental) {
      Alert.alert('Error', 'Please select a rental to request refund for');
      return false;
    }
    if (!refundReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the refund');
      return false;
    }
    return true;
  };

  const handleSubmitRefund = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update wallet (refund will be processed after approval)
      const updatedWallet = {
        ...wallet,
        transactions: [
          {
            type: 'Refund Request',
            amount: 0, // Will be updated after approval
            date: new Date().toISOString().split('T')[0]
          },
          ...wallet.transactions
        ]
      };
      
      setWallet(updatedWallet);
      setSnackbarMessage('Refund request submitted successfully!');
      setShowSnackbar(true);
      
      // Show success message
      Alert.alert(
        'Refund Request Submitted!',
        `Your refund request for ${selectedRental.kitName} has been submitted successfully.\n\nThe academic team will inspect the kit and determine the appropriate refund amount based on the condition and any applicable penalties.\n\nYour request will be reviewed and processed within 3-5 business days.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit refund request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(rental => 
    rental.kitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rental.kitCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rental.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );


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
                  Refunds will be credited here after approval
                </Paragraph>
              </Card.Content>
            </LinearGradient>
          </Card>

          {/* Rental Selection */}
          <Card style={[styles.card, shadows.medium]}>
            <Card.Content>
              <Title style={styles.cardTitle}>Select Rental</Title>
              
              {selectedRental ? (
                <View style={styles.selectedRentalContainer}>
                  <View style={styles.selectedRentalInfo}>
                    <Title style={styles.selectedRentalName}>{selectedRental.kitName}</Title>
                    <Paragraph style={styles.selectedRentalCategory}>{selectedRental.kitCategory}</Paragraph>
                    <Paragraph style={styles.selectedRentalPeriod}>
                      {selectedRental.rentalDate} to {selectedRental.dueDate}
                    </Paragraph>
                    <Chip 
                      mode="outlined" 
                      style={[
                        styles.statusChip,
                        { 
                          borderColor: selectedRental.status === 'active' ? colors.warning : colors.success,
                          alignSelf: 'flex-start'
                        }
                      ]}
                      textStyle={{ 
                        color: selectedRental.status === 'active' ? colors.warning : colors.success
                      }}
                    >
                      {selectedRental.status}
                    </Chip>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={() => setSelectedRental(null)}
                    style={styles.changeRentalButton}
                  >
                    Change
                  </Button>
                </View>
              ) : (
                <>
                  <Searchbar
                    placeholder="Search rentals..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                  />
                  
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Kit Name</DataTable.Title>
                      <DataTable.Title>Period</DataTable.Title>
                      <DataTable.Title>Status</DataTable.Title>
                      <DataTable.Title>Action</DataTable.Title>
                    </DataTable.Header>

                    {filteredRentals.map((rental) => (
                      <DataTable.Row key={rental.id}>
                        <DataTable.Cell>{rental.kitName}</DataTable.Cell>
                        <DataTable.Cell>
                          {rental.rentalDate} to {rental.dueDate}
                        </DataTable.Cell>
                        <DataTable.Cell>
                          <Chip 
                            mode="outlined" 
                            compact
                            style={[
                              styles.statusChip,
                              { 
                                borderColor: rental.status === 'active' ? colors.warning : colors.success
                              }
                            ]}
                            textStyle={{ 
                              color: rental.status === 'active' ? colors.warning : colors.success
                            }}
                          >
                            {rental.status}
                          </Chip>
                        </DataTable.Cell>
                        <DataTable.Cell>
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleRentalSelect(rental)}
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

          {/* Refund Details Form */}
          {selectedRental && (
            <Card style={[styles.card, shadows.medium]}>
              <Card.Content>
                <Title style={styles.cardTitle}>Refund Details</Title>
                

                {/* Refund Reason */}
                <TextInput
                  label="Refund Reason *"
                  value={refundReason}
                  onChangeText={setRefundReason}
                  mode="outlined"
                  style={styles.formInput}
                  placeholder="Why are you requesting a refund?"
                  multiline
                  numberOfLines={3}
                />


                {/* Additional Notes */}
                <TextInput
                  label="Additional Notes"
                  value={additionalNotes}
                  onChangeText={setAdditionalNotes}
                  mode="outlined"
                  style={styles.formInput}
                  placeholder="Any additional information (optional)"
                  multiline
                  numberOfLines={3}
                />
              </Card.Content>
            </Card>
          )}

          {/* Refund Summary */}
          {selectedRental && (
            <Card style={[styles.card, shadows.medium]}>
              <Card.Content>
                <Title style={styles.cardTitle}>Refund Summary</Title>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Kit:</Paragraph>
                  <Paragraph style={styles.summaryValue}>{selectedRental.kitName}</Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Rental Period:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    {selectedRental.rentalDate} to {selectedRental.dueDate}
                  </Paragraph>
                </View>
                
                <View style={styles.summaryRow}>
                  <Paragraph style={styles.summaryLabel}>Original Cost:</Paragraph>
                  <Paragraph style={styles.summaryValue}>
                    {selectedRental.totalCost.toLocaleString()} VND
                  </Paragraph>
                </View>
                
                <Divider style={styles.divider} />
                
                <Paragraph style={styles.refundNote}>
                  The academic team will inspect the kit and determine the appropriate refund amount based on the condition and any applicable penalties. The final refund amount will be communicated to you after the inspection.
                </Paragraph>
              </Card.Content>
            </Card>
          )}

          {/* Submit Button */}
          {selectedRental && (
            <Button
              mode="contained"
              onPress={handleSubmitRefund}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              icon="cash-refund"
            >
              {loading ? 'Submitting...' : 'Submit Refund Request'}
            </Button>
          )}

          {/* Terms and Conditions */}
          <Card style={[styles.card, shadows.small]}>
            <Card.Content>
              <Paragraph style={styles.termsText}>
                Refund requests are subject to review and approval. Processing time is 3-5 business days. 
                Damage assessments may affect the final refund amount. All decisions are final.
              </Paragraph>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Rental Details Modal */}
      <Portal>
        <Modal
          visible={showRentalModal}
          onDismiss={() => setShowRentalModal(false)}
          contentContainerStyle={styles.modal}
        >
          {selectedRental && (
            <View>
              <Title style={styles.modalTitle}>Rental Details</Title>
              
              <Card style={styles.modalCard}>
                <Card.Content>
                  <Title style={styles.rentalName}>{selectedRental.kitName}</Title>
                  <Paragraph style={styles.rentalCategory}>{selectedRental.kitCategory}</Paragraph>
                  
                  <View style={styles.rentalDetails}>
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Rental Date:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>{selectedRental.rentalDate}</Paragraph>
                    </View>
                    
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Due Date:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>{selectedRental.dueDate}</Paragraph>
                    </View>
                    
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Return Date:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>
                        {selectedRental.returnDate || 'Not returned'}
                      </Paragraph>
                    </View>
                    
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Status:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>{selectedRental.status}</Paragraph>
                    </View>
                    
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Daily Rate:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>
                        {selectedRental.dailyRate.toLocaleString()} VND
                      </Paragraph>
                    </View>
                    
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Total Cost:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>
                        {selectedRental.totalCost.toLocaleString()} VND
                      </Paragraph>
                    </View>
                    
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Purpose:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>{selectedRental.purpose}</Paragraph>
                    </View>
                    
                    <View style={styles.rentalDetailRow}>
                      <Paragraph style={styles.rentalDetailLabel}>Group:</Paragraph>
                      <Paragraph style={styles.rentalDetailValue}>{selectedRental.groupName}</Paragraph>
                    </View>
                  </View>
                </Card.Content>
              </Card>
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowRentalModal(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleRentalConfirm}
                  style={styles.modalButton}
                >
                  Select This Rental
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
  selectedRentalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedRentalInfo: {
    flex: 1,
  },
  selectedRentalName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selectedRentalCategory: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  selectedRentalPeriod: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  changeRentalButton: {
    marginLeft: spacing.md,
  },
  statusChip: {
    height: 32,
  },
  sectionLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.md,
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
    color: colors.success,
  },
  refundNote: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
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
    maxHeight: '80%',
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
  rentalName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rentalCategory: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  rentalDetails: {
    gap: spacing.sm,
  },
  rentalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentalDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  rentalDetailValue: {
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
