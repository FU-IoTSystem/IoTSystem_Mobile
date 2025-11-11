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
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { borrowingGroupAPI, studentGroupAPI, userAPI, classesAPI } from '../../services/api';

const MemberGroups = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  
  // Form states
  const [groupName, setGroupName] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, []);

  useEffect(() => {
    if (createModalVisible) {
      loadLecturersAndClasses();
    }
  }, [createModalVisible]);

  const loadLecturersAndClasses = async () => {
    try {
      const lecturersData = await userAPI.getLecturers();
      setLecturers(lecturersData || []);
      
      const classesData = await classesAPI.getAllClasses();
      const classOptions = (classesData || []).map(cls => ({
        id: cls.id,
        label: `${cls.classCode || cls.className || 'Unknown'} - ${cls.semester || 'N/A'}`,
        classCode: cls.classCode,
        semester: cls.semester
      }));
      setClasses(classOptions);
    } catch (error) {
      console.error('Error loading lecturers and classes:', error);
      Alert.alert('Error', 'Failed to load lecturers and classes');
    }
  };

  const loadGroupData = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        // Load user's group
        const borrowingGroups = await borrowingGroupAPI.getByAccountId(user.id);
        if (borrowingGroups && borrowingGroups.length > 0) {
          const memberGroup = borrowingGroups[0];
          const groupId = memberGroup.studentGroupId;
          
          // Get full group details
          const studentGroup = await studentGroupAPI.getById(groupId);
          const allMembers = await borrowingGroupAPI.getByStudentGroupId(groupId);
          
          setGroup({
            id: groupId,
            name: studentGroup?.groupName || 'Unknown Group',
            lecturer: studentGroup?.lecturerName || studentGroup?.lecturerEmail || null,
            classId: studentGroup?.classId || null,
            status: studentGroup?.status ? 'active' : 'inactive',
          });
          
          // Format members
          const formattedMembers = (allMembers || []).map(bg => ({
            id: bg.accountId,
            name: bg.accountName || bg.accountEmail,
            email: bg.accountEmail,
            role: bg.roles,
          }));
          setMembers(formattedMembers);
        } else {
          setGroup(null);
          setMembers([]);
        }
        
        // Load available groups for joining
        await loadAvailableGroups();
      }
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableGroups = async () => {
    try {
      const allGroups = await studentGroupAPI.getAll();
      const allGroupsData = Array.isArray(allGroups) ? allGroups : (allGroups?.data || []);
      
      // Filter out groups where user is already a member
      const userBorrowingGroups = await borrowingGroupAPI.getByAccountId(user.id);
      const userGroupIds = new Set(
        (userBorrowingGroups || []).map(bg => bg.studentGroupId)
      );
      
      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        allGroupsData
          .filter(g => !userGroupIds.has(g.id) && g.status)
          .map(async (g) => {
            try {
              const members = await borrowingGroupAPI.getByStudentGroupId(g.id);
              return {
                id: g.id,
                name: g.groupName,
                lecturer: g.lecturerEmail || g.lecturerName,
                classId: g.classId,
                members: members || [],
                maxMembers: 4,
                status: g.status ? 'active' : 'inactive'
              };
            } catch (err) {
              console.error(`Error loading members for group ${g.id}:`, err);
              return null;
            }
          })
      );
      
      setAvailableGroups(groupsWithCounts.filter(g => g !== null));
    } catch (error) {
      console.error('Error loading available groups:', error);
      setAvailableGroups([]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    
    if (!selectedLecturer) {
      Alert.alert('Error', 'Please select a lecturer');
      return;
    }

    setCreating(true);
    try {
      const lecturer = lecturers.find(l => l.email === selectedLecturer);
      if (!lecturer || !lecturer.id) {
        Alert.alert('Error', 'Invalid lecturer selection');
        return;
      }

      const groupData = {
        groupName: groupName.trim(),
        classId: selectedClass || null,
        accountId: lecturer.id,
        status: true
      };

      const response = await studentGroupAPI.create(groupData);
      
      if (response && response.id) {
        // Add user as leader
        const borrowingGroupData = {
          studentGroupId: response.id,
          accountId: user.id,
          roles: 'LEADER'
        };
        
        await borrowingGroupAPI.addMemberToGroup(borrowingGroupData);
        
        Alert.alert('Success', 'Group created successfully! You are now the leader.');
        setCreateModalVisible(false);
        setGroupName('');
        setSelectedLecturer(null);
        setSelectedClass(null);
        await loadGroupData();
      } else {
        Alert.alert('Error', 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    setJoining(true);
    try {
      const targetGroup = availableGroups.find(g => g.id === groupId);
      if (!targetGroup) {
        Alert.alert('Error', 'Group not found');
        return;
      }
      
      const currentMemberCount = targetGroup.members?.length || 0;
      const maxMembers = targetGroup.maxMembers || 4;
      
      if (currentMemberCount >= maxMembers) {
        Alert.alert('Error', 'Group is full');
        return;
      }
      
      const borrowingGroupData = {
        studentGroupId: groupId,
        accountId: user.id,
        roles: 'MEMBER'
      };
      
      await borrowingGroupAPI.addMemberToGroup(borrowingGroupData);
      
      Alert.alert('Success', 'Successfully joined the group!');
      setJoinModalVisible(false);
      await loadGroupData();
    } catch (error) {
      console.error('Error joining group:', error);
      const errorMessage = error.message || 'Failed to join group';
      
      if (errorMessage.includes('already a member')) {
        Alert.alert('Error', 'You are already a member of this group');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setJoining(false);
    }
  };

  const renderMember = ({ item }) => {
    const isLeader = (item.role || '').toUpperCase() === 'LEADER';
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={[styles.memberAvatar, isLeader && styles.memberAvatarLeader]}>
            <Icon
              name={isLeader ? 'star' : 'person'}
              size={24}
              color={isLeader ? '#f39c12' : '#667eea'}
            />
          </View>
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{item.name || item.email}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={[styles.roleBadge, isLeader && styles.roleBadgeLeader]}>
          <Text style={[styles.roleText, isLeader && styles.roleTextLeader]}>
            {item.role || 'MEMBER'}
          </Text>
        </View>
      </View>
    );
  };

  const renderAvailableGroup = ({ item }) => {
    const isFull = (item.members?.length || 0) >= (item.maxMembers || 4);
    return (
      <View style={styles.availableGroupCard}>
        <View style={styles.availableGroupHeader}>
          <Icon name="group" size={24} color="#667eea" />
          <Text style={styles.availableGroupName}>{item.name}</Text>
        </View>
        <View style={styles.availableGroupInfo}>
          <Text style={styles.availableGroupDetail}>
            <Icon name="person" size={16} color="#666" /> Members: {item.members?.length || 0}/{item.maxMembers || 4}
          </Text>
          {item.lecturer && (
            <Text style={styles.availableGroupDetail}>
              <Icon name="school" size={16} color="#666" /> {item.lecturer}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.joinGroupButton, isFull && styles.joinGroupButtonDisabled]}
          onPress={() => handleJoinGroup(item.id)}
          disabled={isFull || joining}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinGroupButtonText}>
              {isFull ? 'Full' : 'Join Group'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Group</Text>
        {!group && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Icon name="add" size={24} color="#667eea" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setJoinModalVisible(true)}
            >
              <Icon name="group-add" size={24} color="#667eea" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadGroupData} />
        }
      >
        {group ? (
          <>
            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Icon name="group" size={48} color="#667eea" />
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={[styles.statusBadge, group.status === 'active' && styles.statusBadgeActive]}>
                  <Text style={styles.statusText}>{group.status || 'inactive'}</Text>
                </View>
              </View>
              
              <View style={styles.groupDetails}>
                {group.lecturer && (
                  <View style={styles.detailRow}>
                    <Icon name="school" size={20} color="#666" />
                    <Text style={styles.detailText}>Lecturer: {group.lecturer}</Text>
                  </View>
                )}
                {group.classId && (
                  <View style={styles.detailRow}>
                    <Icon name="class" size={20} color="#666" />
                    <Text style={styles.detailText}>Class ID: {group.classId}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Group Members ({members.length})</Text>
              <FlatList
                data={members}
                renderItem={renderMember}
                keyExtractor={(item) => item.id?.toString() || item.email}
                scrollEnabled={false}
              />
            </View>
          </>
        ) : (
          <View style={styles.noGroupContainer}>
            <Icon name="group-off" size={64} color="#ddd" />
            <Text style={styles.noGroupText}>You're not in any group yet</Text>
            <Text style={styles.noGroupSubtext}>
              Create a new group or join an existing one to get started
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={() => setCreateModalVisible(true)}
              >
                <Icon name="add-circle" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Create New Group</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={() => setJoinModalVisible(true)}
              >
                <Icon name="group-add" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Join Existing Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Group Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter group name"
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Lecturer *</Text>
                <ScrollView style={styles.selectContainer}>
                  {lecturers.map((lecturer) => (
                    <TouchableOpacity
                      key={lecturer.email}
                      style={[
                        styles.selectOption,
                        selectedLecturer === lecturer.email && styles.selectOptionSelected
                      ]}
                      onPress={() => setSelectedLecturer(lecturer.email)}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        selectedLecturer === lecturer.email && styles.selectOptionTextSelected
                      ]}>
                        {lecturer.fullName || lecturer.email} ({lecturer.email})
                      </Text>
                      {selectedLecturer === lecturer.email && (
                        <Icon name="check-circle" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Class (Optional)</Text>
                <ScrollView style={styles.selectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      !selectedClass && styles.selectOptionSelected
                    ]}
                    onPress={() => setSelectedClass(null)}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      !selectedClass && styles.selectOptionTextSelected
                    ]}>
                      None
                    </Text>
                    {!selectedClass && (
                      <Icon name="check-circle" size={20} color="#667eea" />
                    )}
                  </TouchableOpacity>
                  {classes.map((cls) => (
                    <TouchableOpacity
                      key={cls.id}
                      style={[
                        styles.selectOption,
                        selectedClass === cls.id && styles.selectOptionSelected
                      ]}
                      onPress={() => setSelectedClass(cls.id)}
                    >
                      <Text style={[
                        styles.selectOptionText,
                        selectedClass === cls.id && styles.selectOptionTextSelected
                      ]}>
                        {cls.label}
                      </Text>
                      {selectedClass === cls.id && (
                        <Icon name="check-circle" size={20} color="#667eea" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, creating && styles.modalSubmitButtonDisabled]}
                onPress={handleCreateGroup}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={joinModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Existing Group</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={availableGroups}
              renderItem={renderAvailableGroup}
              keyExtractor={(item) => item.id?.toString()}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="group-off" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>No available groups to join</Text>
                </View>
              }
            />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#fee',
    paddingHorizontal: 12,
    paddingVertical: 4,
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
  groupDetails: {
    width: '100%',
    marginTop: 12,
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
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarLeader: {
    backgroundColor: '#fff3cd',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeLeader: {
    backgroundColor: '#fff3cd',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
  },
  roleTextLeader: {
    color: '#f39c12',
  },
  noGroupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  noGroupText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  noGroupSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  createButton: {
    backgroundColor: '#667eea',
  },
  joinButton: {
    backgroundColor: '#2ecc71',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
    maxHeight: 400,
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
  availableGroupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  availableGroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  availableGroupInfo: {
    marginBottom: 12,
  },
  availableGroupDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  joinGroupButton: {
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinGroupButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinGroupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default MemberGroups;
