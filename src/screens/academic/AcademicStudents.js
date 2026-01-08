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
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { userAPI, classesAPI, classAssignmentAPI } from '../../services/api';
import dayjs from 'dayjs';

const AcademicStudents = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]); // List of active classes
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [studentModal, setStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null); // Selected class for enrollment

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const classesData = await classesAPI.getAllClasses();
      // Filter for active classes if needed, or just show all
      const activeClasses = (classesData || []).filter(c => c.status === true);
      setClasses(activeClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const [studentsData, classesData, assignmentsData] = await Promise.all([
        userAPI.getStudents(),
        classesAPI.getAllClasses(),
        classAssignmentAPI.getAll()
      ]);

      const formatted = (studentsData || []).map(student => {
        // Find active class assignment for this student
        const assignment = assignmentsData.find(a =>
          a.accountId === student.id &&
          a.roleName === 'STUDENT' &&
          classesData.some(c => c.id === a.classId && c.status === true)
        );

        const classInfo = assignment
          ? classesData.find(c => c.id === assignment.classId)
          : null;

        return {
          id: student.id,
          name: student.fullName,
          email: student.email,
          studentCode: student.studentCode,
          phoneNumber: student.phoneNumber,
          createdAt: student.createdAt ? dayjs(student.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
          status: student.status || 'ACTIVE',
          classCode: classInfo ? classInfo.classCode : null,
          semester: classInfo ? classInfo.semester : null,
        };
      });
      setStudents(formatted);
      // Update classes state as well since we fetched them
      setClasses((classesData || []).filter(c => c.status === true));
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
    setSelectedClassId(null);
    setStudentModal(true);
  };

  const handleEdit = async (student) => {
    setEditing(true);
    setSelectedStudent(student);
    setName(student.name || '');
    setEmail(student.email || '');
    setStudentCode(student.studentCode || '');
    setPhoneNumber(student.phoneNumber || '');
    setSelectedClassId(null); // Reset first
    setStudentModal(true);

    // Try to find if student is enrolled in a class to pre-fill
    // This is optional and might require matching assignments
    try {
      const assignments = await classAssignmentAPI.getAll();
      const studentAssignment = assignments.find(a =>
        a.accountId === student.id &&
        a.roleName === 'STUDENT' &&
        classes.some(c => c.id === a.classId && c.status === true) // Prefer active class
      );
      if (studentAssignment) {
        setSelectedClassId(studentAssignment.classId);
      }
    } catch (err) {
      console.log('Error fetching student assignments in edit:', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !studentCode.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editing && selectedStudent) {
        // Update student
        // Note: userAPI.updateUser might be what's needed here if update is supported
        // Checks on User Management/Profile typically use updateProfile or updateUser
        await userAPI.updateUser(selectedStudent.id, {
          fullName: name.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(), // Email usually can't be changed but sending it defined
          studentCode: studentCode.trim()
        });

        // If class is selected, update enrollment
        if (selectedClassId) {
          // First check if already enrolled in this class to avoid duplicate
          const assignments = await classAssignmentAPI.getAll();
          const existingAssignment = assignments.find(a =>
            a.accountId === selectedStudent.id &&
            a.classId === selectedClassId &&
            a.roleName === 'STUDENT'
          );

          if (!existingAssignment) {
            // Assign to new class
            await classAssignmentAPI.create({
              classId: selectedClassId,
              accountId: selectedStudent.id,
              roleName: 'STUDENT'
            });
          }
        }

        Alert.alert('Success', 'Student updated successfully');
        setStudentModal(false);
        await loadStudents();
      } else {
        // Create new student
        const result = await userAPI.createSingleStudent({
          name: name.trim(),
          email: email.trim(),
          studentCode: studentCode.trim(),
          phoneNumber: phoneNumber.trim(),
        });

        // If class is selected, enroll the new student
        if (selectedClassId && result && result.id) {
          await classAssignmentAPI.create({
            classId: selectedClassId,
            accountId: result.id,
            roleName: 'STUDENT'
          });
        }

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
          <Text style={styles.detailLabel}>Class:</Text>
          <Text style={styles.detailValue}>
            {item.classCode ? `${item.classCode} - ${item.semester}` : 'N/A'}
          </Text>
        </View>
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
                  style={styles.formInput}
                  placeholder="Enter email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Student Code *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter student code"
                  value={studentCode}
                  onChangeText={setStudentCode}
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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Class (Optional)</Text>
                <ScrollView style={styles.selectContainer} nestedScrollEnabled={true}>
                  {classes.map((cls) => (
                    <TouchableOpacity
                      key={cls.id}
                      style={[
                        styles.selectOption,
                        selectedClassId === cls.id && styles.selectOptionSelected
                      ]}
                      onPress={() => setSelectedClassId(cls.id)}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        selectedClassId === cls.id && styles.selectOptionTextSelected
                      ]}>
                        {cls.classCode} ({cls.semester})
                      </Text>
                      {selectedClassId === cls.id && (
                        <Icon name="check-circle" size={20} color="#43e97b" />
                      )}
                    </TouchableOpacity>
                  ))}
                  {classes.length === 0 && (
                    <Text style={styles.emptyOptionText}>No active classes found</Text>
                  )}
                </ScrollView>
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
        </View >
      </Modal >
    </View >
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
    color: '#2e7d32', // Green color requested
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
  selectContainer: {
    maxHeight: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
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
  emptyOptionText: {
    padding: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center'
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
