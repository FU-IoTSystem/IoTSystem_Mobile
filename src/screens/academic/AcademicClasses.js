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
  Switch,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { classesAPI, userAPI } from '../../services/api';
import dayjs from 'dayjs';

const AcademicClasses = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [iotSubjects, setIotSubjects] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [subjectModal, setSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Form states
  const [classCode, setClassCode] = useState('');
  const [semester, setSemester] = useState('');
  const [lecturerId, setLecturerId] = useState(null);
  const [status, setStatus] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (subjectModal) {
      loadLecturers();
    }
  }, [subjectModal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const classesData = await classesAPI.getAllClasses();
      const formatted = (classesData || []).map(cls => ({
        id: cls.id,
        classCode: cls.classCode,
        semester: cls.semester,
        status: cls.status,
        teacherId: cls.teacherId,
        teacherName: cls.teacherName || cls.teacherEmail,
        teacherEmail: cls.teacherEmail,
        createdAt: cls.createdAt ? dayjs(cls.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
        updatedAt: cls.updatedAt ? dayjs(cls.updatedAt).format('DD/MM/YYYY HH:mm') : 'N/A',
      }));
      setIotSubjects(formatted);
    } catch (error) {
      console.error('Error loading IOT subjects:', error);
      Alert.alert('Error', 'Failed to load IOT subjects');
    } finally {
      setLoading(false);
    }
  };

  const loadLecturers = async () => {
    try {
      const lecturersData = await classesAPI.getListLecturers();
      setLecturers(lecturersData || []);
    } catch (error) {
      console.error('Error loading lecturers:', error);
    }
  };

  const handleAdd = () => {
    setEditing(false);
    setSelectedSubject(null);
    setClassCode('');
    setSemester('');
    setLecturerId(null);
    setStatus(true);
    setSubjectModal(true);
  };

  const handleEdit = (subject) => {
    setEditing(true);
    setSelectedSubject(subject);
    setClassCode(subject.classCode || '');
    setSemester(subject.semester || '');
    setLecturerId(subject.teacherId || null);
    setStatus(subject.status !== false);
    setSubjectModal(true);
  };

  const handleSave = async () => {
    if (!classCode.trim() || !semester.trim() || !lecturerId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const classData = {
        classCode: classCode.trim(),
        semester: semester.trim(),
        status: status,
        teacherId: lecturerId,
      };

      if (editing && selectedSubject) {
        await classesAPI.updateClass(selectedSubject.id, classData);
        Alert.alert('Success', 'IOT Subject updated successfully');
      } else {
        await classesAPI.createClass(classData, lecturerId);
        Alert.alert('Success', 'IOT Subject created successfully');
      }
      
      setSubjectModal(false);
      await loadData();
    } catch (error) {
      console.error('Error saving IOT subject:', error);
      Alert.alert('Error', error.message || 'Failed to save IOT subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (subject) => {
    Alert.alert(
      'Delete IOT Subject',
      `Are you sure you want to delete "${subject.classCode}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await classesAPI.deleteClass(subject.id);
              Alert.alert('Success', 'IOT Subject deleted successfully');
              await loadData();
            } catch (error) {
              console.error('Error deleting IOT subject:', error);
              Alert.alert('Error', 'Failed to delete IOT subject');
            }
          },
        },
      ]
    );
  };

  const renderSubject = ({ item }) => (
    <View style={styles.subjectCard}>
      <View style={styles.subjectHeader}>
        <View style={styles.subjectIcon}>
          <Icon name="build" size={32} color="#43e97b" />
        </View>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectCode}>{item.classCode}</Text>
          <Text style={styles.subjectSemester}>{item.semester}</Text>
        </View>
        <View style={[styles.statusBadge, item.status && styles.statusBadgeActive]}>
          <Text style={[styles.statusText, item.status && styles.statusTextActive]}>
            {item.status ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={styles.subjectDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Lecturer:</Text>
          <Text style={styles.detailValue}>{item.teacherName || item.teacherEmail || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{item.createdAt}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Updated:</Text>
          <Text style={styles.detailValue}>{item.updatedAt}</Text>
        </View>
      </View>
      
      <View style={styles.subjectActions}>
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
          <Icon name="menu" size={28} color="#43e97b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>IOT Subjects</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdd}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {iotSubjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="build" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No IOT subjects found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAdd}
            >
              <Text style={styles.emptyButtonText}>Add IOT Subject</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={iotSubjects}
            renderItem={renderSubject}
            keyExtractor={(item) => item.id?.toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Subject Modal */}
      <Modal
        visible={subjectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editing ? 'Edit IOT Subject' : 'Add IOT Subject'}
              </Text>
              <TouchableOpacity onPress={() => setSubjectModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Class Code *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter class code"
                  value={classCode}
                  onChangeText={setClassCode}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Semester *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter semester"
                  value={semester}
                  onChangeText={setSemester}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Lecturer *</Text>
                <ScrollView style={styles.selectContainer}>
                  {lecturers.map((lecturer) => (
                    <TouchableOpacity
                      key={lecturer.id || lecturer.email}
                      style={[
                        styles.selectOption,
                        lecturerId === lecturer.id && styles.selectOptionSelected
                      ]}
                      onPress={() => setLecturerId(lecturer.id)}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        lecturerId === lecturer.id && styles.selectOptionTextSelected
                      ]}>
                        {lecturer.fullName || lecturer.email} ({lecturer.email})
                      </Text>
                      {lecturerId === lecturer.id && (
                        <Icon name="check-circle" size={20} color="#43e97b" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.formLabel}>Status</Text>
                  <Switch
                    value={status}
                    onValueChange={setStatus}
                    trackColor={{ false: '#767577', true: '#43e97b' }}
                    thumbColor={status ? '#fff' : '#f4f3f4'}
                  />
                </View>
                <Text style={styles.switchHint}>
                  {status ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSubjectModal(false)}
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
  addButton: {
    backgroundColor: '#43e97b',
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
  subjectCard: {
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
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subjectSemester: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#c62828',
  },
  statusTextActive: {
    color: '#2e7d32',
  },
  subjectDetails: {
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
    flex: 1,
    textAlign: 'right',
  },
  subjectActions: {
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
    backgroundColor: '#43e97b',
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
  selectContainer: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectOptionSelected: {
    backgroundColor: '#e8f5e9',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectOptionTextSelected: {
    color: '#43e97b',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
    backgroundColor: '#43e97b',
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

export default AcademicClasses;
