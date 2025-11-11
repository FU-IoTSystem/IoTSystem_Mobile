import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
// Note: expo-document-picker may need to be installed
// For now, using a placeholder import - install with: npx expo install expo-document-picker
let DocumentPicker;
try {
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  console.warn('expo-document-picker not installed. Import functionality will be limited.');
  DocumentPicker = null;
}
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { userAPI, excelImportAPI } from '../../services/api';
import dayjs from 'dayjs';

const AcademicLecturers = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Modal states
  const [lecturerModal, setLecturerModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    loadLecturers();
  }, []);

  const loadLecturers = async () => {
    setLoading(true);
    try {
      const lecturersData = await userAPI.getLecturers();
      const formatted = (lecturersData || []).map(lecturer => ({
        id: lecturer.id || lecturer.email,
        name: lecturer.fullName,
        email: lecturer.email,
        phoneNumber: lecturer.phone || '',
        createdAt: lecturer.createdAt ? dayjs(lecturer.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
        status: lecturer.status || 'ACTIVE',
      }));
      setLecturers(formatted);
    } catch (error) {
      console.error('Error loading lecturers:', error);
      Alert.alert('Error', 'Failed to load lecturers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(false);
    setSelectedLecturer(null);
    setName('');
    setEmail('');
    setPhoneNumber('');
    setLecturerModal(true);
  };

  const handleEdit = (lecturer) => {
    setEditing(true);
    setSelectedLecturer(lecturer);
    setName(lecturer.name || '');
    setEmail(lecturer.email || '');
    setPhoneNumber(lecturer.phoneNumber || '');
    setLecturerModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editing && selectedLecturer) {
        // Update lecturer - note: API might not support update
        Alert.alert('Info', 'Lecturer update functionality may require backend support');
      } else {
        // Create new lecturer
        await userAPI.createSingleLecturer({
          name: name.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
        });
        
        Alert.alert('Success', 'Lecturer created successfully');
        setLecturerModal(false);
        await loadLecturers();
      }
    } catch (error) {
      console.error('Error saving lecturer:', error);
      Alert.alert('Error', error.message || 'Failed to save lecturer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (lecturer) => {
    Alert.alert(
      'Delete Lecturer',
      `Are you sure you want to delete ${lecturer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: API might not support delete
              Alert.alert('Info', 'Lecturer deletion may require backend support');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lecturer');
            }
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    if (!DocumentPicker || !DocumentPicker.getDocumentAsync) {
      Alert.alert('Info', 'Document picker not available. Please install expo-document-picker');
      return;
    }
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (result.type === 'cancel') {
        return;
      }

      setImporting(true);
      const response = await excelImportAPI.importAccounts(result, 'LECTURER');
      
      if (response.success) {
        Alert.alert('Success', response.message || 'Lecturers imported successfully');
        await loadLecturers();
      } else {
        Alert.alert('Error', response.message || 'Failed to import lecturers');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import lecturers. Please check file format.');
    } finally {
      setImporting(false);
    }
  };

  const renderLecturer = ({ item }) => (
    <View style={styles.lecturerCard}>
      <View style={styles.lecturerHeader}>
        <View style={styles.lecturerAvatar}>
          <Icon name="person" size={24} color="#f093fb" />
        </View>
        <View style={styles.lecturerInfo}>
          <Text style={styles.lecturerName}>{item.name}</Text>
          <Text style={styles.lecturerEmail}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'ACTIVE' && styles.statusBadgeActive]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.lecturerDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{item.phoneNumber || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{item.createdAt}</Text>
        </View>
      </View>
      
      <View style={styles.lecturerActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Icon name="edit" size={20} color="#667eea" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Icon name="delete" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
  </View>
);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Icon name="menu" size={28} color="#f093fb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lecturer Management</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImport}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Icon name="upload-file" size={24} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLecturers} />
        }
      >
        {lecturers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="person-off" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No lecturers found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAdd}
            >
              <Text style={styles.emptyButtonText}>Add Lecturer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={lecturers}
            renderItem={renderLecturer}
            keyExtractor={(item) => item.id?.toString() || item.email}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Lecturer Modal */}
      <Modal
        visible={lecturerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLecturerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Lecturer' : 'Add Lecturer'}
              </Text>
              <TouchableOpacity onPress={() => setLecturerModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Lecturer Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter lecturer name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email *</Text>
                <TextInput
                  style={[styles.formInput, editing && styles.formInputDisabled]}
                  placeholder="Enter email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editing}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setLecturerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, saving && styles.modalSubmitButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>{editing ? 'Update' : 'Add'}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  importButton: {
    backgroundColor: '#52c41a',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#f093fb',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lecturerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lecturerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lecturerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fce4ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lecturerInfo: {
    flex: 1,
  },
  lecturerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  lecturerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#c62828',
  },
  lecturerDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  lecturerActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
  },
  editButtonText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#f093fb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formInputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalSubmitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f093fb',
    alignItems: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AcademicLecturers;
