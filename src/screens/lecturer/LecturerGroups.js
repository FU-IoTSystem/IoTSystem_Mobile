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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { studentGroupAPI, borrowingGroupAPI, classesAPI, classAssignmentAPI, borrowingRequestAPI } from '../../services/api';
import LecturerLayout from '../../components/LecturerLayout';

const LecturerGroups = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [lecturerGroups, setLecturerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [groupBorrowStatus, setGroupBorrowStatus] = useState(null);
  const [loadingBorrowStatus, setLoadingBorrowStatus] = useState(false);

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedClassCode, setSelectedClassCode] = useState(null);
  const [studentCodeSearch, setStudentCodeSearch] = useState('');
  const [classCodes, setClassCodes] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user || !user.id) {
      console.warn('User or user.id is missing');
      return;
    }

    setLoading(true);
    try {
      console.log('Loading groups for lecturer:', user.id);
      const allGroups = await studentGroupAPI.getAll();

      // Filter groups where lecturer is assigned
      const filteredGroups = allGroups.filter(group =>
        group.lecturerEmail === user.email ||
        group.accountId === user.id
      );

      // Load all classes to get semester information
      let allClasses = [];
      try {
        const classesResponse = await classesAPI.getAllClasses();
        allClasses = Array.isArray(classesResponse)
          ? classesResponse
          : (classesResponse?.data || []);
      } catch (classesError) {
        console.error('Error loading classes:', classesError);
      }

      // Load all class assignments
      let allClassAssignments = [];
      try {
        const classAssignmentsResponse = await classAssignmentAPI.getAll();
        allClassAssignments = Array.isArray(classAssignmentsResponse)
          ? classAssignmentsResponse
          : (classAssignmentsResponse?.data || []);
      } catch (caError) {
        console.error('Error loading class assignments:', caError);
      }

      // Load borrowing groups for each lecturer group
      const groupsWithMembers = await Promise.all(
        filteredGroups.map(async (group) => {
          const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(group.id);
          const members = (borrowingGroups || []).map(bg => ({
            id: bg.accountId,
            accountId: bg.accountId, // Ensure accountId is available
            name: bg.accountName,
            email: bg.accountEmail,
            role: bg.roles,
            isLeader: (bg.roles || '').toUpperCase() === 'LEADER' || bg.isLeader === true || bg.isLeader === 'true',
            studentCode: bg.studentCode
          }));

          // Find leader using isLeader field
          const leaderMember = members.find(member => member.isLeader === true);

          // Find class to get semester
          const classInfo = group.classId
            ? allClasses.find(cls => cls.id === group.classId)
            : null;

          const groupClassAssignments = group.classId
            ? allClassAssignments.filter(ca => ca.classId === group.classId)
            : [];

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
            classId: group.classId,
            className: group.className,
            semester: classInfo?.semester || null,
            classAssignmentsCount: groupClassAssignments.length
          };
        })
      );

      setLecturerGroups(groupsWithMembers);

      // Extract unique class codes for filter
      const codes = [...new Set(groupsWithMembers
        .map(g => g.className)
        .filter(c => c && c.trim() !== '')
      )].sort();
      setClassCodes(codes);

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

  const handleViewGroupDetails = async (group) => {
    try {
      const membersResponse = await borrowingGroupAPI.getByStudentGroupId(group.id);
      const members = (Array.isArray(membersResponse) ? membersResponse : []).map(bg => ({
        ...bg,
        accountId: bg.accountId, // Ensure accountId is present
        isLeader: (bg.roles || '').toUpperCase() === 'LEADER' || bg.isLeader === true || bg.isLeader === 'true'
      }));
      setGroupMembers(members);
      setSelectedGroup(group);

      // Fetch Kit Borrow Status if leader exists
      const leader = members.find(m => (m.role || '').toUpperCase() === 'LEADER' || m.isLeader === true);
      if (leader) {
        setLoadingBorrowStatus(true);
        try {
          const requests = await borrowingRequestAPI.getByUser(leader.accountId);
          const activeRequest = requests.find(req =>
            ['APPROVED', 'BORROWED', 'PENDING'].includes((req.status || '').toUpperCase())
          );

          if (activeRequest) {
            setGroupBorrowStatus({
              hasBorrowedKit: true,
              kitName: activeRequest.kitName,
              status: activeRequest.status,
              hasLeader: true
            });
          } else {
            setGroupBorrowStatus({
              hasBorrowedKit: false,
              hasLeader: true
            });
          }
        } catch (err) {
          console.error('Error loading borrow status:', err);
          setGroupBorrowStatus({
            hasBorrowedKit: false,
            hasLeader: true,
            error: true
          });
        } finally {
          setLoadingBorrowStatus(false);
        }
      } else {
        setGroupBorrowStatus({ hasLeader: false });
      }

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

              // Refresh details
              const membersResponse = await borrowingGroupAPI.getByStudentGroupId(studentGroupId);
              const members = (Array.isArray(membersResponse) ? membersResponse : []).map(bg => ({
                ...bg,
                accountId: bg.accountId,
                isLeader: (bg.roles || '').toUpperCase() === 'LEADER' || bg.isLeader === true || bg.isLeader === 'true'
              }));
              setGroupMembers(members);
              loadGroups(); // Refresh main list
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

              // Refresh details
              const membersResponse = await borrowingGroupAPI.getByStudentGroupId(studentGroupId);
              const members = (Array.isArray(membersResponse) ? membersResponse : []).map(bg => ({
                ...bg,
                accountId: bg.accountId,
                isLeader: (bg.roles || '').toUpperCase() === 'LEADER' || bg.isLeader === true || bg.isLeader === 'true'
              }));
              setGroupMembers(members);
              loadGroups(); // Refresh main list
            } catch (error) {
              console.error('Error demoting to member:', error);
              Alert.alert('Error', 'Failed to demote leader to member');
            }
          },
        },
      ]
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

  // Filter Logic
  const filteredGroups = lecturerGroups.filter(group => {
    // Search by Group Name
    if (searchText && !group.name?.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    // Filter by Class Code
    if (selectedClassCode && group.className !== selectedClassCode) {
      return false;
    }
    // Search by Student Code
    if (studentCodeSearch) {
      const searchLower = studentCodeSearch.toLowerCase();
      const hasStudent = group.members.some(m =>
        m.studentCode?.toLowerCase().includes(searchLower)
      );
      if (!hasStudent) return false;
    }
    return true;
  });

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleViewGroupDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{item.name}</Text>
        <TouchableOpacity
          style={styles.viewDetailsLink}
          onPress={() => handleViewGroupDetails(item)}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Icon name="arrow-forward" size={16} color="#1890ff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tagsContainer}>
        {item.className && (
          <View style={[styles.tag, { backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }]}>
            <Text style={[styles.tagLabel, { color: '#666' }]}>Class: </Text>
            <Text style={[styles.tagValue, { color: '#1890ff' }]}>{item.className}</Text>
          </View>
        )}
        {item.semester && (
          <View style={[styles.tag, { backgroundColor: '#f9f0ff', borderColor: '#d3adf7' }]}>
            <Text style={[styles.tagLabel, { color: '#666' }]}>Sem: </Text>
            <Text style={[styles.tagValue, { color: '#722ed1' }]}>{item.semester}</Text>
          </View>
        )}
        <View style={[styles.tag, { backgroundColor: '#e6fffb', borderColor: '#87e8de' }]}>
          <Text style={[styles.tagLabel, { color: '#666' }]}>Members: </Text>
          <Text style={[styles.tagValue, { color: '#52c41a' }]}>{item.members.length}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Leader:</Text>
        <View style={[styles.leaderTag, { backgroundColor: '#fffbe6', borderColor: '#ffe58f' }]}>
          <Text style={[styles.leaderText, { color: '#fa8c16' }]}>{item.leader}</Text>
        </View>
      </View>

      <View style={styles.membersPreview}>
        {item.members.filter(m => !m.isLeader).slice(0, 3).map((member, idx) => (
          <View key={idx} style={styles.memberChip}>
            <Text style={styles.memberChipText} numberOfLines={1}>
              {member.name || member.email}
            </Text>
          </View>
        ))}
        {(item.members.filter(m => !m.isLeader).length > 3) && (
          <Text style={styles.moreMembersText}>
            +{item.members.filter(m => !m.isLeader).length - 3} more
          </Text>
        )}
        {item.members.filter(m => !m.isLeader).length === 0 && (
          <Text style={styles.noMembersText}>No other members</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item }) => {
    const isLeader = item.isLeader === true || item.isLeader === 'true';
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={[styles.memberAvatar, { backgroundColor: isLeader ? '#1890ff' : '#52c41a' }]}>
            <Text style={styles.memberAvatarText}>
              {isLeader ? 'L' : 'M'}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{item.accountName || item.accountEmail}</Text>
              <View style={[
                styles.roleBadge,
                { backgroundColor: isLeader ? '#fff7e6' : '#e6f7ff' }
              ]}>
                <Text style={[
                  styles.roleText,
                  { color: isLeader ? '#fa8c16' : '#1890ff' }
                ]}>
                  {isLeader ? 'LEADER' : 'MEMBER'}
                </Text>
              </View>
            </View>
            <Text style={styles.memberEmail}>{item.accountEmail}</Text>
            {item.studentCode && (
              <Text style={styles.memberCode}>Code: {item.studentCode}</Text>
            )}
          </View>
        </View>

        {selectedGroup && (
          <View style={styles.memberActions}>
            {!isLeader ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePromoteToLeader(selectedGroup.id, item.accountId)}
              >
                <Text style={styles.actionText}>Promote to Leader</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.demoteButton]}
                onPress={() => handleDemoteToMember(selectedGroup.id, item.accountId)}
              >
                <Text style={[styles.actionText, styles.demoteText]}>Demote to Member</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Groups</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.filterBody}>
            <Text style={styles.filterLabel}>Class Code</Text>
            <View style={styles.classCodesContainer}>
              <TouchableOpacity
                style={[
                  styles.classCodeChip,
                  selectedClassCode === null && styles.classCodeChipSelected
                ]}
                onPress={() => setSelectedClassCode(null)}
              >
                <Text style={[
                  styles.classCodeText,
                  selectedClassCode === null && styles.classCodeTextSelected
                ]}>All</Text>
              </TouchableOpacity>
              {classCodes.map(code => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.classCodeChip,
                    selectedClassCode === code && styles.classCodeChipSelected
                  ]}
                  onPress={() => setSelectedClassCode(code)}
                >
                  <Text style={[
                    styles.classCodeText,
                    selectedClassCode === code && styles.classCodeTextSelected
                  ]}>{code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderGroupDetailModal = () => {
    if (!showGroupDetail || !selectedGroup) return null;

    const leader = groupMembers.find(m => m.isLeader === true || m.isLeader === 'true');
    const leaderName = leader ? (leader.accountName || leader.name || leader.email) : 'N/A';

    return (
      <Modal
        visible={showGroupDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowGroupDetail(false);
          setSelectedGroup(null);
          setGroupMembers([]);
          setGroupBorrowStatus(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={[styles.modalTitle, { fontSize: 22 }]}>{selectedGroup.name}</Text>
                <View style={styles.idTag}>
                  <Text style={styles.idTagText}>ID: {selectedGroup.id}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowGroupDetail(false);
                  setSelectedGroup(null);
                  setGroupMembers([]);
                  setGroupBorrowStatus(null);
                }}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Detailed Info Card */}
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Class Name</Text>
                    <View style={[styles.tag, { backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }]}>
                      <Text style={[styles.tagValue, { color: '#1890ff' }]}>{selectedGroup.className || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Semester</Text>
                    <View style={[styles.tag, { backgroundColor: '#f9f0ff', borderColor: '#d3adf7' }]}>
                      <Text style={[styles.tagValue, { color: '#722ed1' }]}>{selectedGroup.semester || 'N/A'}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailItem, { flex: 2 }]}>
                    <Text style={styles.detailLabel}>Group Leader</Text>
                    <View style={[styles.tag, { backgroundColor: '#fffbe6', borderColor: '#ffe58f' }]}>
                      <Icon name="star" size={14} color="#fa8c16" style={{ marginRight: 4 }} />
                      <Text style={[styles.tagValue, { color: '#fa8c16' }]}>{leaderName}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Members</Text>
                    <View style={[styles.tag, { backgroundColor: '#e6fffb', borderColor: '#87e8de' }]}>
                      <Text style={[styles.tagValue, { color: '#52c41a' }]}>{groupMembers.length}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={[styles.detailItem, { flex: 2 }]}>
                    <Text style={styles.detailLabel}>Lecturer</Text>
                    <View style={[styles.tag, { backgroundColor: '#f9f0ff', borderColor: '#d3adf7' }]}>
                      <Icon name="school" size={14} color="#722ed1" style={{ marginRight: 4 }} />
                      <Text style={[styles.tagValue, { color: '#722ed1' }]}>{selectedGroup.lecturerName || selectedGroup.lecturer}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.tag, { backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }]}>
                      <Text style={[styles.tagValue, { color: '#52c41a' }]}>Active</Text>
                    </View>
                  </View>
                </View>

                {/* Kit Borrow Status Section */}
                <View style={styles.detailRow}>
                  <View style={[styles.detailItem, { flex: 2 }]}>
                    <Text style={styles.detailLabel}>Kit Borrow Status</Text>
                    {loadingBorrowStatus ? (
                      <View style={[styles.tag, { backgroundColor: '#f5f5f5', borderColor: '#d9d9d9' }]}>
                        <Text style={[styles.tagValue, { color: '#8c8c8c' }]}>Checking...</Text>
                      </View>
                    ) : (
                      groupBorrowStatus?.hasLeader ? (
                        groupBorrowStatus.hasBorrowedKit ? (
                          <View style={[styles.tag, { backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }]}>
                            <Icon name="check-circle" size={14} color="#52c41a" style={{ marginRight: 4 }} />
                            <Text style={[styles.tagValue, { color: '#52c41a' }]}>
                              Borrowed: {groupBorrowStatus.kitName} ({groupBorrowStatus.status})
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.tag, { backgroundColor: '#fff1f0', borderColor: '#ffa39e' }]}>
                            <Icon name="info" size={14} color="#f5222d" style={{ marginRight: 4 }} />
                            <Text style={[styles.tagValue, { color: '#f5222d' }]}>No active borrowing</Text>
                          </View>
                        )
                      ) : (
                        <View style={[styles.tag, { backgroundColor: '#fffbe6', borderColor: '#ffe58f' }]}>
                          <Text style={[styles.tagValue, { color: '#fa8c16' }]}>No leader assigned</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </View>

              {/* Members Section */}
              <View style={styles.membersSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Group Members</Text>
                  <View style={[styles.badge, { backgroundColor: '#f6ffed' }]}>
                    <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>{groupMembers.length}</Text>
                  </View>
                </View>
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
      </Modal >
    );
  };

  return (
    <LecturerLayout
      title="My Groups"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >
      <View style={styles.container}>
        {/* Search Bar Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputRow}>
            <View style={styles.searchBox}>
              <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Group Name..."
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Icon name="close" size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.filterButton, selectedClassCode && styles.filterButtonActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Icon name="filter-list" size={24} color={selectedClassCode ? "#fff" : "#667eea"} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBox}>
            <Icon name="person-search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Student Code..."
              value={studentCodeSearch}
              onChangeText={setStudentCodeSearch}
            />
            {studentCodeSearch.length > 0 && (
              <TouchableOpacity onPress={() => setStudentCodeSearch('')}>
                <Icon name="close" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : (
          <FlatList
            data={filteredGroups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="group-off" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {lecturerGroups.length === 0 ? "No groups assigned yet" : "No groups match filters"}
                </Text>
              </View>
            }
          />
        )}
      </View>
      {renderGroupDetailModal()}
      {renderFilterModal()}
    </LecturerLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  searchInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Group Card Styles
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
    flex: 1,
  },
  viewDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#1890ff',
    marginRight: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagLabel: {
    fontSize: 12,
  },
  tagValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  leaderTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  leaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  membersPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  memberChip: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  memberChipText: {
    fontSize: 12,
    color: '#595959',
  },
  moreMembersText: {
    fontSize: 12,
    color: '#8c8c8c',
  },
  noMembersText: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#262626',
    marginBottom: 4,
  },
  modalTagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 24,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statisticCard: {
    alignItems: 'center',
    flex: 1,
  },
  statisticValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#262626',
    marginTop: 8,
  },
  statisticLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 16,
  },
  membersSection: {
    marginBottom: 24,
  },

  // Member Card Styles
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberInfo: {
    marginLeft: 16,
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  memberEmail: {
    fontSize: 13,
    color: '#595959',
  },
  memberCode: {
    fontSize: 12,
    color: '#8c8c8c',
    marginTop: 2,
  },
  memberActions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e6f7ff',
  },
  demoteButton: {
    backgroundColor: '#fff1f0',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1890ff',
  },
  demoteText: {
    color: '#ff4d4f',
  },

  // Filter Modal Styles
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  filterBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  classCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classCodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
  },
  classCodeChipSelected: {
    backgroundColor: '#e6f7ff',
    borderColor: '#1890ff',
  },
  classCodeText: {
    color: '#666',
  },
  classCodeTextSelected: {
    color: '#1890ff',
    fontWeight: '600',
  },
  filterFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  idTag: {
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  idTagText: {
    color: '#1890ff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8c8c8c',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

export default LecturerGroups;
