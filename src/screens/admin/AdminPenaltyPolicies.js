import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AdminLayout from '../../components/AdminLayout';
import { penaltyPoliciesAPI } from '../../services/api';
import dayjs from 'dayjs';

const AdminPenaltyPolicies = ({ onLogout }) => {
  const navigation = useNavigation();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [formData, setFormData] = useState({
    policyName: '',
    type: 'damaged',
    amount: '',
    issuedDate: null,
    resolved: null,
  });
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null); // 'issuedDate' or 'resolved'

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await penaltyPoliciesAPI.getAll();
      console.log('Penalty policies response:', response);
      
      const policiesData = response?.data || response;
      
      if (Array.isArray(policiesData)) {
        setPolicies(policiesData);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error loading penalty policies:', error);
      Alert.alert('Error', 'Failed to load penalty policies');
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = () => {
    setEditingPolicy(null);
    setFormData({
      policyName: '',
      type: 'damaged',
      amount: '',
      issuedDate: null,
      resolved: null,
    });
    setModalVisible(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      policyName: policy.policyName || '',
      type: policy.type || 'damaged',
      amount: policy.amount ? String(policy.amount) : '',
      issuedDate: policy.issuedDate ? dayjs(policy.issuedDate) : null,
      resolved: policy.resolved ? dayjs(policy.resolved) : null,
    });
    setModalVisible(true);
  };

  const handleDeletePolicy = (policy) => {
    Alert.alert(
      'Delete Policy',
      `Are you sure you want to delete policy "${policy.policyName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await penaltyPoliciesAPI.delete(policy.id);
              Alert.alert('Success', 'Policy deleted successfully');
              await loadPolicies();
            } catch (error) {
              console.error('Error deleting policy:', error);
              Alert.alert('Error', 'Failed to delete policy');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.policyName.trim()) {
      Alert.alert('Error', 'Please enter policy name');
      return;
    }
    if (!formData.amount || Number(formData.amount) < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const policyData = {
        policyName: formData.policyName,
        type: formData.type,
        amount: Number(formData.amount),
        issuedDate: formData.issuedDate ? formData.issuedDate.toISOString() : null,
        resolved: formData.resolved ? formData.resolved.toISOString() : null,
      };

      if (editingPolicy) {
        await penaltyPoliciesAPI.update(editingPolicy.id, policyData);
        Alert.alert('Success', 'Policy updated successfully');
      } else {
        await penaltyPoliciesAPI.create(policyData);
        Alert.alert('Success', 'Policy created successfully');
      }

      await loadPolicies();
      setModalVisible(false);
      setEditingPolicy(null);
      setFormData({
        policyName: '',
        type: 'damaged',
        amount: '',
        issuedDate: null,
        resolved: null,
      });
    } catch (error) {
      console.error('Error saving policy:', error);
      Alert.alert('Error', error.message || 'Failed to save policy');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'damaged':
        return '#faad14';
      case 'lost':
        return '#ff4d4f';
      case 'lated':
      case 'late':
        return '#1890ff';
      default:
        return '#666';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return dayjs(dateTimeString).format('DD/MM/YYYY HH:mm');
  };

  const renderPolicyItem = ({ item }) => (
    <View style={styles.policyCard}>
      <View style={styles.policyHeader}>
        <View style={styles.policyInfo}>
          <Text style={styles.policyName}>{item.policyName || 'N/A'}</Text>
          <View style={[
            styles.typeBadge,
            { backgroundColor: `${getTypeColor(item.type)}15` }
          ]}>
            <Text style={[
              styles.typeText,
              { color: getTypeColor(item.type) }
            ]}>
              {item.type ? item.type.toUpperCase() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.policyDetails}>
        <View style={styles.detailRow}>
          <Icon name="attach-money" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.amount ? Number(item.amount).toLocaleString('vi-VN') : '0'} VND
          </Text>
        </View>
        {item.issuedDate && (
          <View style={styles.detailRow}>
            <Icon name="event" size={16} color="#666" />
            <Text style={styles.detailText}>
              Issued: {formatDateTime(item.issuedDate)}
            </Text>
          </View>
        )}
        {item.resolved && (
          <View style={styles.detailRow}>
            <Icon name="check-circle" size={16} color="#666" />
            <Text style={styles.detailText}>
              Resolved: {formatDateTime(item.resolved)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.policyActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1890ff15' }]}
          onPress={() => handleEditPolicy(item)}
        >
          <Icon name="edit" size={18} color="#1890ff" />
          <Text style={[styles.actionButtonText, { color: '#1890ff' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ff4d4f15' }]}
          onPress={() => handleDeletePolicy(item)}
        >
          <Icon name="delete" size={18} color="#ff4d4f" />
          <Text style={[styles.actionButtonText, { color: '#ff4d4f' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (onLogout) {
                await onLogout();
              }
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <AdminLayout 
      title="Penalty Policies"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPolicy}
        >
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Policy</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={policies}
        renderItem={renderPolicyItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPolicies} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="policy" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No penalty policies found</Text>
          </View>
        }
      />

      {/* Add/Edit Policy Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPolicy ? 'Edit Policy' : 'Add Policy'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Policy Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter policy name"
                  value={formData.policyName}
                  onChangeText={(text) => setFormData({ ...formData, policyName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type *</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'damaged' && styles.typeButtonActive,
                      formData.type === 'damaged' && { backgroundColor: '#faad1415' }
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'damaged' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === 'damaged' && { color: '#faad14', fontWeight: 'bold' }
                    ]}>
                      Damaged
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'lost' && styles.typeButtonActive,
                      formData.type === 'lost' && { backgroundColor: '#ff4d4f15' }
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'lost' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === 'lost' && { color: '#ff4d4f', fontWeight: 'bold' }
                    ]}>
                      Lost
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'lated' && styles.typeButtonActive,
                      formData.type === 'lated' && { backgroundColor: '#1890ff15' }
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'lated' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === 'lated' && { color: '#1890ff', fontWeight: 'bold' }
                    ]}>
                      Late Return
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount (VND) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter penalty amount"
                  value={formData.amount}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, amount: numericValue });
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Issued Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerType('issuedDate');
                    setDatePickerVisible(true);
                  }}
                >
                  <Icon name="event" size={20} color="#666" />
                  <Text style={styles.dateButtonText}>
                    {formData.issuedDate 
                      ? dayjs(formData.issuedDate).format('DD/MM/YYYY')
                      : 'Select issued date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Resolved Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerType('resolved');
                    setDatePickerVisible(true);
                  }}
                >
                  <Icon name="check-circle" size={20} color="#666" />
                  <Text style={styles.dateButtonText}>
                    {formData.resolved 
                      ? dayjs(formData.resolved).format('DD/MM/YYYY')
                      : 'Select resolved date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Saving...' : (editingPolicy ? 'Update' : 'Create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal - Simplified version using Alert for date selection */}
      {datePickerVisible && (
        <Modal
          visible={datePickerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContent}>
              <Text style={styles.datePickerTitle}>
                Select {datePickerType === 'issuedDate' ? 'Issued' : 'Resolved'} Date
              </Text>
              <Text style={styles.datePickerHint}>
                Date picker functionality can be enhanced with a proper date picker library like @react-native-community/datetimepicker
              </Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  const today = dayjs();
                  setFormData({
                    ...formData,
                    [datePickerType]: today
                  });
                  setDatePickerVisible(false);
                }}
              >
                <Text style={styles.datePickerButtonText}>Use Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  setFormData({
                    ...formData,
                    [datePickerType]: null
                  });
                  setDatePickerVisible(false);
                }}
              >
                <Text style={styles.datePickerButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.datePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  addButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  policyCard: {
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
  policyHeader: {
    marginBottom: 12,
  },
  policyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  policyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  policyDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
  policyActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
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
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#667eea',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  datePickerHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    alignItems: 'center',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
});

export default AdminPenaltyPolicies;
