import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LeaderLayout from '../../components/LeaderLayout';
import { borrowingGroupAPI, studentGroupAPI, classesAPI } from '../../services/api';

const GroupManagementScreen = ({ user, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [groupData, setGroupData] = useState(null);

  useEffect(() => {
    if (user) {
      loadGroupData();
    }
  }, [user]);

  const loadGroupData = async () => {
    if (!user || !user.id) {
      console.warn('User or user.id is missing');
      return;
    }

    setLoading(true);
    try {
      let groupId = user?.borrowingGroupInfo?.groupId;

      // If no groupId from user info, try to get it from borrowing groups
      if (!groupId && user.id) {
        const borrowingGroups = await borrowingGroupAPI.getByAccountId(user.id);
        const groupsArray = Array.isArray(borrowingGroups)
          ? borrowingGroups
          : (borrowingGroups?.data || borrowingGroups?.content || []);

        if (groupsArray && groupsArray.length > 0) {
          // Find the group where user is a leader
          const leaderGroup = groupsArray.find(bg => bg.roles === 'LEADER');
          if (leaderGroup) {
            groupId = leaderGroup.studentGroupId;
          } else if (groupsArray.length > 0) {
            // Fallback to first group
            groupId = groupsArray[0].studentGroupId;
          }
        }
      }

      if (groupId) {
        console.log('Loading group info for groupId:', groupId);

        // Get borrowing groups for this student group (all members)
        const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(groupId);
        console.log('Borrowing groups response:', borrowingGroups);

        // Get student group details
        const studentGroup = await studentGroupAPI.getById(groupId);
        console.log('Student group response:', studentGroup);

        if (studentGroup) {
          // Handle array or object response
          const groupsArray = Array.isArray(borrowingGroups)
            ? borrowingGroups
            : (borrowingGroups?.data || borrowingGroups?.content || []);

          // Map borrowing groups to members
          const members = (groupsArray || []).map(bg => ({
            id: bg.accountId,
            name: bg.accountName || bg.accountEmail,
            email: bg.accountEmail,
            role: bg.roles,
            studentCode: bg.studentCode || null,
          }));

          // Find leader
          const leaderMember = members.find(member => (member.role || '').toUpperCase() === 'LEADER');

          // Fetch class info if classId exists
          let classInfo = null;
          if (studentGroup.classId) {
            try {
              // Use getAllClasses to ensure consistent data structure handling
              const classesResponse = await classesAPI.getAllClasses();
              const classList = Array.isArray(classesResponse)
                ? classesResponse
                : (classesResponse?.data || classesResponse?.content || []);

              classInfo = classList.find(c => c.id === studentGroup.classId);
            } catch (err) {
              console.log('Error fetching class info:', err);
            }
          }

          const groupInfo = {
            id: studentGroup.id,
            name: studentGroup.groupName,
            leader: leaderMember ? (leaderMember.name || leaderMember.email) : 'N/A',
            leaderEmail: leaderMember?.email || null,
            members: members.filter(m => (m.role || '').toUpperCase() === 'MEMBER'),
            lecturer: studentGroup.lecturerEmail || null,
            lecturerName: studentGroup.lecturerName || null,
            classId: studentGroup.classId,
            classCode: classInfo?.classCode || 'N/A',
            semester: classInfo?.semester || 'N/A',
            status: studentGroup.status ? 'active' : 'inactive'
          };

          console.log('Processed group data:', groupInfo);
          setGroupData(groupInfo);
        } else {
          setGroupData(null);
        }
      } else {
        console.warn('No group found for user');
        setGroupData(null);
      }
    } catch (error) {
      console.error('Error loading group info:', error);
      Alert.alert('Error', 'Failed to load group information');
      setGroupData(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadGroupData();
    setRefreshing(false);
  }, [user]);

  if (loading && !groupData) {
    return (
      <LeaderLayout title="Group Management">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </LeaderLayout>
    );
  }

  if (!groupData) {
    return (
      <LeaderLayout title="Group Management">
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyState}>
            <Icon name="group" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No group found</Text>
            <Text style={styles.emptySubtext}>You are not assigned to any group yet</Text>
          </View>
        </ScrollView>
      </LeaderLayout>
    );
  }

  return (
    <LeaderLayout title="Group Management">
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Group Info Card */}
        <View style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <Icon name="group" size={32} color="#667eea" />
            <Text style={styles.groupName}>{groupData.name || 'N/A'}</Text>
          </View>

          <View style={styles.groupInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Group ID:</Text>
              <Text style={styles.infoValue}>{groupData.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: groupData.status === 'active' ? '#52c41a15' : '#ff4d4f15' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: groupData.status === 'active' ? '#52c41a' : '#ff4d4f' }
                ]}>
                  {groupData.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class Code:</Text>
              <Text style={styles.infoValue}>{groupData.classCode}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Semester:</Text>
              <Text style={styles.infoValue}>{groupData.semester}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lecturer:</Text>
              <Text style={styles.infoValue}>
                {groupData.lecturerName || groupData.lecturer || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lecturer Email:</Text>
              <Text style={styles.infoValue}>{groupData.lecturer || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Leader Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leader</Text>
          <View style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={[styles.memberIcon, { backgroundColor: '#667eea15' }]}>
                <Icon name="person" size={24} color="#667eea" />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {groupData.leader || 'N/A'}
                </Text>
                <Text style={styles.memberEmail}>{groupData.leaderEmail || 'N/A'}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: '#667eea15' }]}>
                <Text style={[styles.roleText, { color: '#667eea' }]}>LEADER</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Members ({groupData.members.length})
          </Text>
          {groupData.members.length > 0 ? (
            groupData.members.map((member, index) => (
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
      </ScrollView>
    </LeaderLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
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
});

export default GroupManagementScreen;
