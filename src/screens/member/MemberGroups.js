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
import MemberLayout from '../../components/MemberLayout';

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
          
          // Get classCode from class details if classId exists but classCode doesn't
          let classCode = studentGroup?.classCode || null;
          if (!classCode && studentGroup?.classId) {
            try {
              const classDetails = await classesAPI.getClassById(studentGroup.classId);
              classCode = classDetails?.classCode || classDetails?.data?.classCode || null;
            } catch (error) {
              console.error('Error fetching class details:', error);
            }
          }
          
          setGroup({
            id: groupId,
            name: studentGroup?.groupName || 'Unknown Group',
            lecturer: studentGroup?.lecturerName || studentGroup?.lecturerEmail || null,
            classCode: classCode,
            status: studentGroup?.status ? 'active' : 'inactive',
          });
          
          // Format members
          const formattedMembers = (allMembers || []).map(bg => ({
            id: bg.accountId,
            name: bg.accountName || bg.accountEmail,
            email: bg.accountEmail,
            role: bg.roles,
            studentCode: bg.studentCode || null,
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
              
              // Get classCode from class details if classId exists but classCode doesn't
              let classCode = g.classCode || null;
              if (!classCode && g.classId) {
                try {
                  const classDetails = await classesAPI.getClassById(g.classId);
                  classCode = classDetails?.classCode || classDetails?.data?.classCode || null;
                } catch (error) {
                  console.error(`Error fetching class details for group ${g.id}:`, error);
                }
              }
              
              return {
                id: g.id,
                name: g.groupName,
                lecturer: g.lecturerEmail || g.lecturerName,
                classCode: classCode,
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
        classCode: selectedClass ? classes.find(c => c.id === selectedClass)?.classCode : null,
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
    <MemberLayout title="My Group">
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadGroupData} />
        }
      >
        {!group && (
          <View style={styles.actionButtonsHeader}>
            <TouchableOpacity
              style={[styles.actionButton, styles.createButton]}
              onPress={() => setCreateModalVisible(true)}
            >
              <Icon name="add-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={() => setJoinModalVisible(true)}
            >
              <Icon name="group-add" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
        )}
        {group ? (
          <>
            {/* Group Info Card */}
            <View style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Icon name="group" size={32} color="#667eea" />
                <Text style={styles.groupName}>{group.name || 'N/A'}</Text>
              </View>
              
              <View style={styles.groupInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Group ID:</Text>
                  <Text style={styles.infoValue}>{group.id || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: group.status === 'active' ? '#52c41a15' : '#ff4d4f15' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: group.status === 'active' ? '#52c41a' : '#ff4d4f' }
                    ]}>
                      {group.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                {group.lecturer && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Lecturer:</Text>
                    <Text style={styles.infoValue}>{group.lecturer}</Text>
                  </View>
                )}
                
                {group.classCode && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Class Code:</Text>
                    <Text style={styles.infoValue}>{group.classCode}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Leader Section */}
            {members.find(m => (m.role || '').toUpperCase() === 'LEADER') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Leader</Text>
                {(() => {
                  const leader = members.find(m => (m.role || '').toUpperCase() === 'LEADER');
                  return (
                    <View style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={[styles.memberIcon, { backgroundColor: '#667eea15' }]}>
                          <Icon name="person" size={24} color="#667eea" />
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {leader.name || leader.email || 'N/A'}
                          </Text>
                          <Text style={styles.memberEmail}>{leader.email || 'N/A'}</Text>
                        </View>
                        <View style={[styles.roleBadge, { backgroundColor: '#667eea15' }]}>
                          <Text style={[styles.roleText, { color: '#667eea' }]}>LEADER</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* Members Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Members ({members.filter(m => (m.role || '').toUpperCase() === 'MEMBER').length})
              </Text>
              {members.filter(m => (m.role || '').toUpperCase() === 'MEMBER').length > 0 ? (
                members
                  .filter(m => (m.role || '').toUpperCase() === 'MEMBER')
                  .map((member, index) => (
                    <View key={member.id || index} style={styles.memberCard}>
                      <View style={styles.memberHeader}>
                        <View style={[styles.memberIcon, { backgroundColor: '#1890ff15' }]}>
                          <Icon name="person" size={24} color="#1890ff" />
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {member.name || member.email || 'N/A'}
                          </Text>
                          <Text style={styles.memberEmail}>{member.email || 'N/A'}</Text>
                          {member.studentCode && (
                            <Text style={styles.memberStudentCode}>
                              Student Code: {member.studentCode}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.roleBadge, { backgroundColor: '#1890ff15' }]}>
                          <Text style={[styles.roleText, { color: '#1890ff' }]}>MEMBER</Text>
                        </View>
                      </View>
                    </View>
                  ))
              ) : (
                <View style={styles.emptyMembers}>
                  <Icon name="people-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyMembersText}>No members in this group</Text>
                </View>
              )}
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
    </MemberLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  actionButtonsHeader: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 0,
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
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  groupInfo: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  memberStudentCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyMembers: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyMembersText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
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
