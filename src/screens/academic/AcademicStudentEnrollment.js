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
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { classAssignmentAPI, classesAPI, userAPI } from '../../services/api';

const AcademicStudentEnrollment = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [classAssignments, setClassAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  
  // Modal states
  const [assignLecturerModal, setAssignLecturerModal] = useState(false);
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [viewStudentsModal, setViewStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  
  // Form states
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load class assignments (lecturers only for main table)
      const allAssignments = await classAssignmentAPI.getAll();
      const lecturerAssignments = allAssignments.filter(assignment => 
        assignment.roleName === 'LECTURER' || assignment.roleName === 'TEACHER'
      );
      setClassAssignments(lecturerAssignments);

      // Load classes
      const classesData = await classesAPI.getAllClasses();
      setClasses(classesData || []);

      // Load lecturers
      const lecturersData = await userAPI.getLecturers();
      setLecturers(lecturersData || []);

      // Load students
      const studentsData = await userAPI.getStudents();
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading enrollment data:', error);
      Alert.alert('Error', 'Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLecturer = async () => {
    if (!selectedClassId || !selectedLecturerId) {
      Alert.alert('Error', 'Please select both class and lecturer');
      return;
    }

    setSubmitting(true);
    try {
      await classAssignmentAPI.create({
        classId: selectedClassId,
        accountId: selectedLecturerId,
      });
      
      Alert.alert('Success', 'Lecturer assigned successfully');
      setAssignLecturerModal(false);
      setSelectedClassId(null);
      setSelectedLecturerId(null);
      await loadData();
    } catch (error) {
      console.error('Error assigning lecturer:', error);
      Alert.alert('Error', error.message || 'Failed to assign lecturer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedClassId || !selectedStudentId) {
      Alert.alert('Error', 'Please select both class and student');
      return;
    }

    setSubmitting(true);
    try {
      await classAssignmentAPI.create({
        classId: selectedClassId,
        accountId: selectedStudentId,
      });
      
      Alert.alert('Success', 'Student enrolled successfully');
      setAddStudentModal(false);
      setSelectedStudentId(null);
      await loadData();
    } catch (error) {
      console.error('Error enrolling student:', error);
      Alert.alert('Error', error.message || 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewStudents = async (record) => {
    try {
      const allAssignments = await classAssignmentAPI.getAll();
      const studentsInClass = allAssignments.filter(assignment => 
        assignment.classId === record.classId && 
        assignment.roleName === 'STUDENT'
      );
      setClassStudents(studentsInClass);
      setSelectedClass(record);
      setViewStudentsModal(true);
    } catch (error) {
      console.error('Error loading class students:', error);
      Alert.alert('Error', 'Failed to load class students');
    }
  };

  const handleDeleteAssignment = async (record) => {
    Alert.alert(
      'Delete Assignment',
      'Are you sure you want to delete this assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await classAssignmentAPI.delete(record.id);
              Alert.alert('Success', 'Assignment deleted successfully');
              await loadData();
            } catch (error) {
              console.error('Error deleting assignment:', error);
              Alert.alert('Error', 'Failed to delete assignment');
            }
          },
        },
      ]
    );
  };

  const getClassName = (classId) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? `${classInfo.classCode} - ${classInfo.semester}` : '-';
  };

  const renderAssignment = ({ item }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <Icon name="person" size={24} color="#667eea" />
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentName}>{item.accountName || item.accountEmail}</Text>
          <Text style={styles.assignmentEmail}>{item.accountEmail}</Text>
        </View>
      </View>
      <View style={styles.assignmentDetails}>
        <Text style={styles.assignmentLabel}>IoT Subject:</Text>
        <Text style={styles.assignmentValue}>{getClassName(item.classId)}</Text>
      </View>
      <View style={styles.assignmentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewStudents(item)}
        >
          <Icon name="visibility" size={20} color="#667eea" />
          <Text style={styles.actionButtonText}>View Students</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonAdd]}
          onPress={() => {
            setSelectedClassId(item.classId);
            setAddStudentModal(true);
          }}
        >
          <Icon name="person-add" size={20} color="#2ecc71" />
          <Text style={[styles.actionButtonText, styles.actionButtonTextAdd]}>Add Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDelete]}
          onPress={() => handleDeleteAssignment(item)}
        >
          <Icon name="delete" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStudent = ({ item }) => (
    <View style={styles.studentCard}>
      <Icon name="person" size={24} color="#667eea" />
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.accountName || item.accountEmail}</Text>
        <Text style={styles.studentEmail}>{item.accountEmail}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleDeleteAssignment(item)}
      >
        <Icon name="close" size={20} color="#e74c3c" />
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Student Enrollment</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAssignLecturerModal(true)}
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
        {classAssignments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No class assignments yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setAssignLecturerModal(true)}
            >
              <Text style={styles.emptyButtonText}>Assign Lecturer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={classAssignments}
            renderItem={renderAssignment}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Assign Lecturer Modal */}
      <Modal
        visible={assignLecturerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignLecturerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Lecturer</Text>
              <TouchableOpacity onPress={() => setAssignLecturerModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>IoT Subject *</Text>
                <View style={styles.selectContainer}>
                  <FlatList
                    data={classes}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item: cls }) => (
                      <TouchableOpacity
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
                          {cls.classCode} - {cls.semester}
                        </Text>
                        {selectedClassId === cls.id && (
                          <Icon name="check-circle" size={20} color="#667eea" />
                        )}
                      </TouchableOpacity>
                    )}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={styles.flatListContainer}
                  />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Lecturer *</Text>
                <View style={styles.selectContainer}>
                  <FlatList
                    data={lecturers}
                    keyExtractor={(item) => item.id?.toString() || item.email || Math.random().toString()}
                    renderItem={({ item: lecturer }) => (
                      <TouchableOpacity
                        style={[
                          styles.selectOption,
                          selectedLecturerId === lecturer.id && styles.selectOptionSelected
                        ]}
                        onPress={() => setSelectedLecturerId(lecturer.id)}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          selectedLecturerId === lecturer.id && styles.selectOptionTextSelected
                        ]}>
                          {lecturer.fullName || lecturer.email} ({lecturer.email})
                        </Text>
                        {selectedLecturerId === lecturer.id && (
                          <Icon name="check-circle" size={20} color="#667eea" />
                        )}
                      </TouchableOpacity>
                    )}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={styles.flatListContainer}
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setAssignLecturerModal(false);
                  setSelectedClassId(null);
                  setSelectedLecturerId(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, submitting && styles.modalSubmitButtonDisabled]}
                onPress={handleAssignLecturer}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        visible={addStudentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enroll Student</Text>
              <TouchableOpacity onPress={() => setAddStudentModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>IoT Subject *</Text>
                <Text style={styles.formValue}>{getClassName(selectedClassId)}</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Student *</Text>
                <View style={styles.selectContainer}>
                  <FlatList
                    data={students}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item: student }) => (
                      <TouchableOpacity
                        style={[
                          styles.selectOption,
                          selectedStudentId === student.id && styles.selectOptionSelected
                        ]}
                        onPress={() => setSelectedStudentId(student.id)}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          selectedStudentId === student.id && styles.selectOptionTextSelected
                        ]}>
                          {student.fullName || student.email} ({student.email})
                        </Text>
                        {selectedStudentId === student.id && (
                          <Icon name="check-circle" size={20} color="#667eea" />
                        )}
                      </TouchableOpacity>
                    )}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    style={styles.flatListContainer}
                  />
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setAddStudentModal(false);
                  setSelectedStudentId(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, submitting && styles.modalSubmitButtonDisabled]}
                onPress={handleAddStudent}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Enroll</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* View Students Modal */}
      <Modal
        visible={viewStudentsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setViewStudentsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Students in {selectedClass ? getClassName(selectedClass.classId) : 'Class'} ({classStudents.length})
              </Text>
              <TouchableOpacity onPress={() => setViewStudentsModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {classStudents.length === 0 ? (
              <View style={styles.emptyModalContainer}>
                <Icon name="person-off" size={48} color="#ddd" />
                <Text style={styles.emptyModalText}>No students enrolled</Text>
              </View>
            ) : (
              <FlatList
                data={classStudents}
                renderItem={renderStudent}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                style={styles.modalBody}
              />
            )}
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
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignmentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  assignmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  assignmentEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  assignmentDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  assignmentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  assignmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  assignmentActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4ff',
  },
  actionButtonAdd: {
    backgroundColor: '#e8f5e9',
  },
  actionButtonDelete: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#667eea',
    marginLeft: 4,
  },
  actionButtonTextAdd: {
    color: '#2ecc71',
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
    maxHeight: 500,
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
  formValue: {
    fontSize: 16,
    color: '#666',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  selectContainer: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  flatListContainer: {
    maxHeight: 180,
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
    backgroundColor: '#e3f2fd',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectOptionTextSelected: {
    color: '#667eea',
    fontWeight: '600',
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
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  studentEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  emptyModalContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default AcademicStudentEnrollment;
