import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { 
  studentGroupAPI, 
  borrowingGroupAPI, 
  userAPI,
  classesAPI 
} from '../../services/api';

const AdminGroups = ({ onLogout }) => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);
  const [selectedGroupRecord, setSelectedGroupRecord] = useState(null);
  const [studentsToAdd, setStudentsToAdd] = useState([]);
  const [isFirstMember, setIsFirstMember] = useState(false);
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilterModalVisible, setClassFilterModalVisible] = useState(false);
  const [statusFilterModalVisible, setStatusFilterModalVisible] = useState(false);
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [createGroupFormData, setCreateGroupFormData] = useState({
    name: '',
    classId: '',
    lecturer: '',
  });

  useEffect(() => {
    loadGroups();
    loadClasses();
    loadLecturers();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const studentGroups = await studentGroupAPI.getAll();
      
      // Get all borrowing groups for each student group
      const groupsWithMembers = await Promise.all(
        studentGroups.map(async (group) => {
          try {
            const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(group.id);
            
            // Map borrowing groups to members list
            const members = borrowingGroups.map(bg => ({
              id: bg.accountId,
              name: bg.accountName,
              email: bg.accountEmail,
              role: bg.roles,
              isLeader: bg.isLeader === true || bg.isLeader === 'true'
            }));

            // Find leader (check isLeader field)
            const leader = borrowingGroups.find(bg => bg.isLeader === true || bg.isLeader === 'true');
            
            return {
              id: group.id,
              groupName: group.groupName || group.name,
              classId: group.classId,
              lecturer: group.lecturerEmail || null,
              lecturerName: group.lecturerName,
              leader: leader ? leader.accountEmail : null,
              members: members.map(m => m.email),
              status: group.status,
              lecturerId: group.accountId
            };
          } catch (error) {
            console.error(`Error loading members for group ${group.id}:`, error);
            return {
              id: group.id,
              groupName: group.groupName || group.name,
              classId: group.classId,
              lecturer: group.lecturerEmail || null,
              lecturerName: group.lecturerName,
              leader: null,
              members: [],
              status: group.status,
              lecturerId: group.accountId
            };
          }
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const classesList = await classesAPI.getAllClasses();
      setClasses(classesList);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadLecturers = async () => {
    try {
      const lecturerList = await userAPI.getLecturers();
      setLecturers(lecturerList);
    } catch (error) {
      console.error('Error loading lecturers:', error);
    }
  };

  const getClassName = (classId) => {
    const classInfo = classes.find(c => c.id === classId);
    return classInfo ? `${classInfo.classCode} - ${classInfo.semester}` : 'N/A';
  };

  // Filter groups based on search and filters
  const filteredGroups = groups.filter(group => {
    // Filter by search text (group name, leader, lecturer)
    if (searchText && searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      const groupName = (group.groupName || '').toLowerCase();
      const leader = (group.leader || '').toLowerCase();
      const lecturer = (group.lecturerName || group.lecturer || '').toLowerCase();
      
      if (!groupName.includes(searchLower) && 
          !leader.includes(searchLower) && 
          !lecturer.includes(searchLower)) {
        return false;
      }
    }
    
    // Filter by class
    if (classFilter !== 'all') {
      if (group.classId !== classFilter) {
        return false;
      }
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      const groupStatus = group.status ? 'active' : 'inactive';
      if (groupStatus !== statusFilter) {
        return false;
      }
    }
    
    return true;
  });

  // Get unique classes for filter
  const availableClasses = [...new Set(groups.map(g => g.classId).filter(Boolean))];

  const handleAddStudentToGroup = async (groupRecord) => {
    setSelectedGroupRecord(groupRecord);
    setLoading(true);
    
    try {
      const allStudents = await userAPI.getStudents();
      const allBorrowingGroups = await borrowingGroupAPI.getAll();
      
      // Filter available students (not in any group)
      const availableStudents = allStudents.filter(student => {
        const isInAnyGroup = allBorrowingGroups.some(bg => {
          const bgAccountId = bg.accountId?.toString();
          const studentId = student.id?.toString();
          return bgAccountId === studentId;
        });
        return !isInAnyGroup;
      });
      
      if (availableStudents.length === 0) {
        Alert.alert('No Available Students', 'All students are already assigned to groups');
        setLoading(false);
        return;
      }

      // Check if group already has students
      const existingMembers = await borrowingGroupAPI.getByStudentGroupId(groupRecord.id);
      const firstMember = existingMembers.length === 0;

      // Select random 2-4 students (or less if not enough available)
      const minStudents = 2;
      const maxStudents = 4;
      const availableCount = availableStudents.length;
      const numberOfStudentsToAdd = Math.min(maxStudents, Math.max(minStudents, availableCount));
      
      if (availableCount < minStudents) {
        Alert.alert('Insufficient Students', `Only ${availableCount} student(s) available. Need at least ${minStudents}.`);
        setLoading(false);
        return;
      }
      
      const shuffledStudents = [...availableStudents].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffledStudents.slice(0, numberOfStudentsToAdd);

      setStudentsToAdd(selectedStudents);
      setIsFirstMember(firstMember);
      setAddStudentModalVisible(true);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddStudents = async () => {
    setLoading(true);
    
    try {
      for (let i = 0; i < studentsToAdd.length; i++) {
        const student = studentsToAdd[i];
        const role = (isFirstMember && i === 0) ? 'LEADER' : 'MEMBER';
        
        const borrowingGroupData = {
          studentGroupId: selectedGroupRecord.id,
          accountId: student.id,
          roles: role
        };

        await borrowingGroupAPI.addMemberToGroup(borrowingGroupData);
      }

      // Refresh group data
      await loadGroups();
      
      Alert.alert('Success', `Successfully added ${studentsToAdd.length} students to the group`);
      setAddStudentModalVisible(false);
      setSelectedGroupRecord(null);
      setStudentsToAdd([]);
    } catch (error) {
      console.error('Error adding students to group:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to add students to group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This will also delete all associated members.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await studentGroupAPI.delete(groupId);
              await loadGroups();
              Alert.alert('Success', 'Group deleted successfully');
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    if (!createGroupFormData.name.trim() || !createGroupFormData.classId || !createGroupFormData.lecturer) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const lecturer = lecturers.find(l => l.id === createGroupFormData.lecturer);
      const groupData = {
        groupName: createGroupFormData.name,
        classId: createGroupFormData.classId,
        accountId: lecturer?.id || null,
        status: true,
        roles: null
      };
      
      await studentGroupAPI.create(groupData);
      await loadGroups();
      Alert.alert('Success', 'Group created successfully');
      setCreateGroupModalVisible(false);
      setCreateGroupFormData({
        name: '',
        classId: '',
        lecturer: '',
      });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

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

  const renderGroupItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => {
          setSelectedGroup(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}>
            <Icon name="group" size={32} color="#667eea" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.groupName || 'Unnamed Group'}</Text>
            <Text style={styles.groupClass}>{getClassName(item.classId)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status ? '#52c41a20' : '#ff4d4f20' }]}>
            <Text style={[styles.statusText, { color: item.status ? '#52c41a' : '#ff4d4f' }]}>
              {item.status ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={styles.groupDetails}>
          <View style={styles.detailRow}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.detailText}>Leader: {item.leader || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="school" size={16} color="#666" />
            <Text style={styles.detailText}>Lecturer: {item.lecturerName || item.lecturer || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="people" size={16} color="#666" />
            <Text style={styles.detailText}>Members: {item.members?.length || 0}</Text>
          </View>
        </View>
        <View style={styles.groupActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddStudentToGroup(item)}
          >
            <Icon name="person-add" size={20} color="#52c41a" />
            <Text style={styles.actionButtonText}>Add Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteGroup(item.id)}
          >
            <Icon name="delete" size={20} color="#ff4d4f" />
            <Text style={[styles.actionButtonText, { color: '#ff4d4f' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Management</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setCreateGroupModalVisible(true)}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by group name, leader, or lecturer..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setClassFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>
              {classFilter === 'all' ? 'All Classes' : getClassName(classFilter)}
            </Text>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setStatusFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>
              {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}
            </Text>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadGroups} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="group" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText || classFilter !== 'all' || statusFilter !== 'all' 
                ? 'No groups match your filters' 
                : 'No groups found'}
            </Text>
            {(!searchText && classFilter === 'all' && statusFilter === 'all') && (
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={() => setCreateGroupModalVisible(true)}
              >
                <Text style={styles.emptyButtonText}>Create First Group</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          filteredGroups.length > 0 ? (
            <View style={styles.footerText}>
              <Text style={styles.footerTextContent}>
                Showing {filteredGroups.length} of {groups.length} group(s)
              </Text>
            </View>
          ) : null
        }
      />

      {/* Group Details Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedGroup && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Group Name:</Text>
                  <Text style={styles.detailValue}>{selectedGroup.groupName || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>IoT Subject:</Text>
                  <Text style={styles.detailValue}>{getClassName(selectedGroup.classId)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Leader:</Text>
                  <Text style={styles.detailValue}>{selectedGroup.leader || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lecturer:</Text>
                  <Text style={styles.detailValue}>
                    {selectedGroup.lecturerName || selectedGroup.lecturer || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: selectedGroup.status ? '#52c41a20' : '#ff4d4f20' }]}>
                    <Text style={[styles.statusText, { color: selectedGroup.status ? '#52c41a' : '#ff4d4f' }]}>
                      {selectedGroup.status ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Members ({selectedGroup.members?.length || 0}):</Text>
                </View>
                {selectedGroup.members && selectedGroup.members.length > 0 ? (
                  selectedGroup.members.map((member, index) => (
                    <View key={index} style={styles.memberItem}>
                      <Icon name="account-circle" size={20} color="#667eea" />
                      <Text style={styles.memberText}>{member}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noMembersText}>No members</Text>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        visible={addStudentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddStudentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {studentsToAdd.length} Students to "{selectedGroupRecord?.groupName}"
              </Text>
              <TouchableOpacity onPress={() => setAddStudentModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Selected students to add:
              </Text>
              {studentsToAdd.map((student, index) => (
                <View key={student.id} style={styles.studentItem}>
                  <View style={styles.studentInfo}>
                    {(isFirstMember && index === 0) && (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderText}>LEADER</Text>
                      </View>
                    )}
                    {!(isFirstMember && index === 0) && (
                      <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>MEMBER</Text>
                      </View>
                    )}
                    <Text style={styles.studentName}>
                      {student.fullName || student.name} ({student.email})
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#52c41a' }]}
                onPress={handleConfirmAddStudents}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Adding...' : `Add ${studentsToAdd.length} Students`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAddStudentModalVisible(false);
                  setSelectedGroupRecord(null);
                  setStudentsToAdd([]);
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={createGroupModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity onPress={() => setCreateGroupModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Group Name *</Text>
                <TextInput
                  style={styles.input}
                  value={createGroupFormData.name}
                  onChangeText={(text) => setCreateGroupFormData({ ...createGroupFormData, name: text })}
                  placeholder="Enter group name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>IoT Subject *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => {
                    // Show class selection modal
                    Alert.alert(
                      'Select IoT Subject',
                      'Choose a class',
                      [
                        ...classes.map(cls => ({
                          text: `${cls.classCode} - ${cls.semester}`,
                          onPress: () => setCreateGroupFormData({ ...createGroupFormData, classId: cls.id })
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={[
                    styles.selectButtonText,
                    !createGroupFormData.classId && styles.selectButtonPlaceholder
                  ]}>
                    {createGroupFormData.classId 
                      ? getClassName(createGroupFormData.classId)
                      : 'Select IoT subject'}
                  </Text>
                  <Icon name="arrow-drop-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Lecturer *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => {
                    // Show lecturer selection modal
                    Alert.alert(
                      'Select Lecturer',
                      'Choose a lecturer',
                      [
                        ...lecturers.map(lec => ({
                          text: `${lec.fullName || lec.name} (${lec.email})`,
                          onPress: () => setCreateGroupFormData({ ...createGroupFormData, lecturer: lec.id })
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={[
                    styles.selectButtonText,
                    !createGroupFormData.lecturer && styles.selectButtonPlaceholder
                  ]}>
                    {createGroupFormData.lecturer 
                      ? lecturers.find(l => l.id === createGroupFormData.lecturer)?.fullName || lecturers.find(l => l.id === createGroupFormData.lecturer)?.name || 'Selected'
                      : 'Select lecturer'}
                  </Text>
                  <Icon name="arrow-drop-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Icon name="info" size={20} color="#1890ff" />
                <Text style={styles.infoText}>
                  When you create a group, you can add students manually. The first student added will become the group leader.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCreateGroupModalVisible(false);
                  setCreateGroupFormData({
                    name: '',
                    classId: '',
                    lecturer: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateGroup}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Creating...' : 'Create Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Class Filter Modal */}
      <Modal
        visible={classFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setClassFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setClassFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter by Class</Text>
            {['all', ...availableClasses].map((classId) => (
              <TouchableOpacity
                key={classId}
                style={[
                  styles.filterOption,
                  classFilter === classId && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setClassFilter(classId);
                  setClassFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  classFilter === classId && styles.filterOptionTextSelected
                ]}>
                  {classId === 'all' ? 'All Classes' : getClassName(classId)}
                </Text>
                {classFilter === classId && (
                  <Icon name="check" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Filter Modal */}
      <Modal
        visible={statusFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setStatusFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter by Status</Text>
            {['all', 'active', 'inactive'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  statusFilter === status && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setStatusFilter(status);
                  setStatusFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  statusFilter === status && styles.filterOptionTextSelected
                ]}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                {statusFilter === status && (
                  <Icon name="check" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
    padding: 16,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchFilterContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#2c3e50',
  },
  clearButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  filterOptionSelected: {
    backgroundColor: '#667eea15',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  filterOptionTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  groupClass: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  groupDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#52c41a20',
    borderRadius: 8,
    padding: 10,
  },
  deleteButton: {
    backgroundColor: '#ff4d4f20',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#52c41a',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    padding: 16,
    alignItems: 'center',
  },
  footerTextContent: {
    fontSize: 12,
    color: '#999',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  selectButtonPlaceholder: {
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e6f7ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1890ff',
    lineHeight: 18,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  modalBody: {
    padding: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 8,
  },
  noMembersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  studentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderBadge: {
    backgroundColor: '#faad14',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  leaderText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  memberBadge: {
    backgroundColor: '#1890ff20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  memberBadgeText: {
    color: '#1890ff',
    fontSize: 11,
    fontWeight: '600',
  },
  studentName: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  modalButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminGroups;
