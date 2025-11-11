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

const AcademicStudents = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Modal states
  const [studentModal, setStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const studentsData = await userAPI.getStudents();
      const formatted = (studentsData || []).map(student => ({
        id: student.id,
        name: student.fullName,
        email: student.email,
        studentCode: student.studentCode,
        phoneNumber: student.phoneNumber,
        createdAt: student.createdAt ? dayjs(student.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
        status: student.status || 'ACTIVE',
      }));
      setStudents(formatted);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing(false);
    setSelectedStudent(null);
    setName('');
    setEmail('');
    setStudentCode('');
    setPhoneNumber('');
    setStudentModal(true);
  };

  const handleEdit = (student) => {
    setEditing(true);
    setSelectedStudent(student);
    setName(student.name || '');
    setEmail(student.email || '');
    setStudentCode(student.studentCode || '');
    setPhoneNumber(student.phoneNumber || '');
    setStudentModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !studentCode.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editing && selectedStudent) {
        // Update student - note: API might not support update, so this is placeholder
        Alert.alert('Info', 'Student update functionality may require backend support');
      } else {
        // Create new student
        await userAPI.createSingleStudent({
          name: name.trim(),
          email: email.trim(),
          studentCode: studentCode.trim(),
          phoneNumber: phoneNumber.trim(),
        });
        
        Alert.alert('Success', 'Student created successfully');
        setStudentModal(false);
        await loadStudents();
      }
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('Error', error.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: API might not support delete, so this is placeholder
              Alert.alert('Info', 'Student deletion may require backend support');
              // await userAPI.deleteStudent(student.id);
              // await loadStudents();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student');
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
      const response = await excelImportAPI.importAccounts(result, 'STUDENT');
      
      if (response.success) {
        Alert.alert('Success', response.message || 'Students imported successfully');
        await loadStudents();
      } else {
        Alert.alert('Error', response.message || 'Failed to import students');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import students. Please check file format.');
    } finally {
      setImporting(false);
    }
  };

  const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dayjs(dateString);
    return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
  };

  const renderStudent = ({ item }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Icon name="person" size={24} color="#667eea" />
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentEmail}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'ACTIVE' && styles.statusBadgeActive]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.studentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Student Code:</Text>
          <Text style={styles.detailValue}>{item.studentCode}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{item.phoneNumber || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{item.createdAt}</Text>
        </View>
      </View>
      
      <View style={styles.studentActions}>
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
          <Icon name="menu" size={28} color="#667eea" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Management</Text>
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
          <RefreshControl refreshing={loading} onRefresh={loadStudents} />
        }
      >
        {students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="person-off" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No students found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAdd}
            >
              <Text style={styles.emptyButtonText}>Add Student</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={students}
            renderItem={renderStudent}
            keyExtractor={(item) => item.id?.toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Student Modal */}
      <Modal
        visible={studentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit Student' : 'Add Student'}
              </Text>
              <TouchableOpacity onPress={() => setStudentModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Student Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter student name"
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
                <Text style={styles.formLabel}>Student Code *</Text>
                <TextInput
                  style={[styles.formInput, editing && styles.formInputDisabled]}
                  placeholder="Enter student code"
                  value={studentCode}
                  onChangeText={setStudentCode}
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
                onPress={() => setStudentModal(false)}
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
    backgroundColor: '#667eea',
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
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  studentEmail: {
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
  studentDetails: {
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
  studentActions: {
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
    backgroundColor: '#667eea',
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
    backgroundColor: '#667eea',
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

export default AcademicStudents;
