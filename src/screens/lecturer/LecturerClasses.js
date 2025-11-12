import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { studentGroupAPI, borrowingGroupAPI } from '../../services/api';

const LecturerClasses = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [lecturerGroups, setLecturerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = async () => {
    if (!user || !user.id) {
      console.warn('User or user.id is missing');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading groups for lecturer:', user.id);
      const allGroups = await studentGroupAPI.getAll();
      console.log('All groups response:', allGroups);
      
      // Filter groups where lecturer is assigned
      const filteredGroups = allGroups.filter(group => 
        group.lecturerEmail === user.email || 
        group.accountId === user.id
      );
      
      console.log('Filtered lecturer groups:', filteredGroups);
      
      // Load borrowing groups for each lecturer group
      const groupsWithMembers = await Promise.all(
        filteredGroups.map(async (group) => {
          const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(group.id);
          const members = (borrowingGroups || []).map(bg => ({
            id: bg.accountId,
            name: bg.accountName,
            email: bg.accountEmail,
            role: bg.roles,
            isLeader: bg.isLeader === true || bg.isLeader === 'true'
          }));

          // Find leader using isLeader field
          const leaderMember = members.find(member => member.isLeader === true);
          
          return {
            id: group.id,
            name: group.groupName,
            lecturer: group.lecturerEmail,
            lecturerName: group.lecturerName,
            leader: leaderMember ? (leaderMember.name || leaderMember.email || 'N/A') : 'N/A',
            leaderEmail: leaderMember?.email || null,
            leaderId: leaderMember?.id || null,
            members: members,
            status: group.status ? 'active' : 'inactive',
            classId: group.classId
          };
        })
      );
      
      setLecturerGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error loading groups:', error);
      setLecturerGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const handleViewGroupDetails = async (group) => {
    try {
      const membersResponse = await borrowingGroupAPI.getByStudentGroupId(group.id);
      const members = (Array.isArray(membersResponse) ? membersResponse : []).map(bg => ({
        ...bg,
        isLeader: bg.isLeader === true || bg.isLeader === 'true'
      }));
      setGroupMembers(members);
      setSelectedGroup(group);
      setShowGroupDetail(true);
    } catch (error) {
      console.error('Error loading group members:', error);
      Alert.alert('Error', 'Failed to load group members');
    }
  };

  const handlePromoteToLeader = async (studentGroupId, accountId) => {
    Alert.alert(
      'Promote to Leader',
      'Are you sure you want to promote this member to leader?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              const requestData = { studentGroupId, accountId };
              await borrowingGroupAPI.promoteToLeader(requestData);
              Alert.alert('Success', 'Successfully promoted member to leader');
              // Refresh group members
              const membersResponse = await borrowingGroupAPI.getByStudentGroupId(studentGroupId);
              const members = (Array.isArray(membersResponse) ? membersResponse : []).map(bg => ({
                ...bg,
                isLeader: bg.isLeader === true || bg.isLeader === 'true'
              }));
              setGroupMembers(members);
            } catch (error) {
              console.error('Error promoting to leader:', error);
              Alert.alert('Error', 'Failed to promote member to leader');
            }
          },
        },
      ]
    );
  };

  const handleDemoteToMember = async (studentGroupId, accountId) => {
    Alert.alert(
      'Demote to Member',
      'Are you sure you want to demote this leader to member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            try {
              const requestData = { studentGroupId, accountId };
              await borrowingGroupAPI.demoteToMember(requestData);
              Alert.alert('Success', 'Successfully demoted leader to member');
              // Refresh group members
              const membersResponse = await borrowingGroupAPI.getByStudentGroupId(studentGroupId);
              const members = (Array.isArray(membersResponse) ? membersResponse : []).map(bg => ({
                ...bg,
                isLeader: bg.isLeader === true || bg.isLeader === 'true'
              }));
              setGroupMembers(members);
            } catch (error) {
              console.error('Error demoting to member:', error);
              Alert.alert('Error', 'Failed to demote leader to member');
            }
          },
        },
      ]
    );
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleViewGroupDetails(item)}
    >
      <View style={styles.groupHeader}>
        <Icon name="group" size={32} color="#667eea" />
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <View style={styles.groupStats}>
            <View style={styles.stat}>
              <Icon name="people" size={16} color="#52c41a" />
              <Text style={styles.statText}>{item.members.length} members</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="star" size={16} color="#ffc107" />
              <Text style={styles.statText}>Leader</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.groupFooter}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#52c41a' : '#999' }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewGroupDetails(item)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Icon name="chevron-right" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item }) => {
    // Check isLeader field instead of roles
    const isLeader = item.isLeader === true || item.isLeader === 'true';
    
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={[styles.memberAvatar, { backgroundColor: isLeader ? '#667eea' : '#52c41a' }]}>
            <Text style={styles.memberAvatarText}>
              {isLeader ? 'L' : 'M'}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.accountName || item.accountEmail}</Text>
            <Text style={styles.memberEmail}>{item.accountEmail}</Text>
          </View>
        </View>
        <View style={styles.memberFooter}>
          <View style={[styles.roleBadge, { backgroundColor: isLeader ? '#ffc107' : '#667eea' }]}>
            <Text style={styles.roleText}>{item.roles}</Text>
          </View>
          {selectedGroup && (
            <View style={styles.memberActions}>
              {!isLeader ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handlePromoteToLeader(selectedGroup.id, item.accountId)}
                >
                  <Icon name="arrow-upward" size={16} color="#667eea" />
                  <Text style={styles.actionText}>Promote</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.demoteButton]}
                  onPress={() => handleDemoteToMember(selectedGroup.id, item.accountId)}
                >
                  <Icon name="arrow-downward" size={16} color="#ff4d4f" />
                  <Text style={[styles.actionText, styles.demoteText]}>Demote</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGroupDetailModal = () => {
    if (!showGroupDetail || !selectedGroup) return null;

    // Count leaders using isLeader field
    const leaderCount = groupMembers.filter(m => m.isLeader === true || m.isLeader === 'true').length;
    const memberCount = groupMembers.filter(m => !m.isLeader || m.isLeader === false || m.isLeader === 'false').length;

    return (
      <Modal
        visible={showGroupDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowGroupDetail(false);
          setSelectedGroup(null);
          setGroupMembers([]);
        }}
      >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedGroup.name}</Text>
              <Text style={styles.modalSubtitle}>Group ID: {selectedGroup.id}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowGroupDetail(false);
                setSelectedGroup(null);
                setGroupMembers([]);
              }}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Group Statistics */}
            <View style={styles.statisticsContainer}>
              <View style={styles.statisticCard}>
                <Icon name="people" size={32} color="#52c41a" />
                <Text style={styles.statisticValue}>{groupMembers.length}</Text>
                <Text style={styles.statisticLabel}>Total Members</Text>
              </View>
              <View style={styles.statisticCard}>
                <Icon name="star" size={32} color="#ffc107" />
                <Text style={styles.statisticValue}>{leaderCount}</Text>
                <Text style={styles.statisticLabel}>Leaders</Text>
              </View>
              <View style={styles.statisticCard}>
                <Icon name="person" size={32} color="#667eea" />
                <Text style={styles.statisticValue}>{memberCount}</Text>
                <Text style={styles.statisticLabel}>Members</Text>
              </View>
            </View>

            {/* Members List */}
            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>Group Members</Text>
              <FlatList
                data={groupMembers}
                renderItem={renderMemberItem}
                keyExtractor={(item) => item.accountId?.toString() || item.accountEmail || Math.random().toString()}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>
        </View>
      </View>
      </Modal>
    );
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>My Classes</Text>
            <Text style={styles.headerSubtitle}>Welcome, {user?.name || user?.fullName || 'Lecturer'}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={lecturerGroups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="group" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No groups assigned yet</Text>
          </View>
        }
      />
      {renderGroupDetailModal()}
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
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupInfo: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
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
    maxHeight: '80%',
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
  modalSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  statisticCard: {
    alignItems: 'center',
  },
  statisticValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statisticLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  membersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
    paddingBottom: 8,
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  memberActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  demoteButton: {
    backgroundColor: 'rgba(255, 77, 79, 0.1)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
  demoteText: {
    color: '#ff4d4f',
  },
});

export default LecturerClasses;
