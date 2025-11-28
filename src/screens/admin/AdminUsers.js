import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AdminLayout from '../../components/AdminLayout';
import { userAPI, authAPI } from '../../services/api';

const AdminUsers = ({ onLogout }) => {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    studentCode: '',
    lecturerCode: '',
    password: '',
  });
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [roleFilterModalVisible, setRoleFilterModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await userAPI.getAllAccounts(0, 100);
      console.log('Users response:', usersData);
      
      if (usersData && usersData.length > 0) {
        const mappedUsers = usersData.map(profile => ({
          id: profile.id,
          name: profile.fullName || profile.email || 'Unknown',
          email: profile.email,
          phone: profile.phone,
          studentCode: profile.studentCode,
          lecturerCode: profile.lecturerCode,
          role: profile.role?.toLowerCase() || 'member',
          status: profile.isActive ? 'Active' : 'Inactive',
          createdAt: profile.createdAt,
        }));
        setUsers(mappedUsers);
      } else {
        setUsers([]);
        console.log('No users found or invalid response format');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setSelectedRole(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'student',
      studentCode: '',
      lecturerCode: '',
      password: '',
    });
    setModalVisible(true);
  };

  // Filter users based on search text and role
  const filteredUsers = users.filter(user => {
    // Filter by search text (name, email, phone, studentCode, lecturerCode)
    if (searchText && searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.phone || '').toLowerCase();
      const studentCode = (user.studentCode || '').toLowerCase();
      const lecturerCode = (user.lecturerCode || '').toLowerCase();
      
      if (!name.includes(searchLower) && 
          !email.includes(searchLower) && 
          !phone.includes(searchLower) && 
          !studentCode.includes(searchLower) &&
          !lecturerCode.includes(searchLower)) {
        return false;
      }
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      const userRole = (user.role || '').toLowerCase();
      if (userRole !== roleFilter.toLowerCase()) {
        return false;
      }
    }
    
    return true;
  });

  // Get unique roles from users for filter dropdown
  const availableRoles = [...new Set(users.map(user => user.role).filter(Boolean))].sort();

  const handleEditUser = (user) => {
    setEditingUser(user);
    const role = (user.role || '').toLowerCase();
    setFormData({
      name: user.name || user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'student',
      studentCode: role === 'student' ? (user.studentCode || '') : '',
      lecturerCode: role === 'lecturer' ? (user.lecturerCode || '') : '',
      password: '',
    });
    setSelectedRole(user.role || 'student');
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      Alert.alert('Error', 'Password is required for new users');
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          username: formData.email,
          password: formData.password || undefined,
          studentCode: formData.role?.toLowerCase() === 'student' ? (formData.studentCode || null) : null,
          lecturerCode: formData.role?.toLowerCase() === 'lecturer' ? (formData.lecturerCode || null) : null,
          roles: formData.role.toUpperCase(),
          phoneNumber: formData.phone || null,
          fullName: formData.name || null,
        };
        
        await authAPI.updateUser(editingUser.id, updateData);
        Alert.alert('Success', 'User updated successfully');
      } else {
        // Create new user
        const userData = {
          username: formData.email,
          password: formData.password,
          studentCode: formData.role?.toLowerCase() === 'student' ? (formData.studentCode || null) : null,
          lecturerCode: formData.role?.toLowerCase() === 'lecturer' ? (formData.lecturerCode || null) : null,
          roles: formData.role.toUpperCase(),
          phoneNumber: formData.phone || null,
          fullName: formData.name || null,
        };

        await authAPI.register(
          userData.username,
          userData.password,
          userData.studentCode,
          userData.roles,
          userData.phoneNumber,
          userData.fullName
        );
        Alert.alert('Success', 'User created successfully');
      }
      
      setModalVisible(false);
      await loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement delete user API call
              Alert.alert('Info', 'Delete user functionality needs to be implemented in API');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '#ff4d4f';
      case 'lecturer':
        return '#faad14';
      case 'academic':
        return '#722ed1';
      case 'leader':
        return '#1890ff';
      default:
        return '#52c41a';
    }
  };

  const getUserCode = (user) => {
    const role = (user.role || '').toLowerCase();
    if (role === 'student') {
      return user.studentCode || '-';
    } else if (role === 'lecturer') {
      return user.lecturerCode || '-';
    }
    return '-';
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.badgesContainer}>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(item.role)}15` }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role?.toUpperCase() || 'MEMBER'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'Active' ? '#52c41a15' : '#ff4d4f15' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.status === 'Active' ? '#52c41a' : '#ff4d4f' }
            ]}>
              {item.status || 'Active'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.userDetails}>
        {item.phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={16} color="#666" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {getUserCode(item) !== '-' && (
          <View style={styles.detailRow}>
            <Icon name="badge" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.role?.toLowerCase() === 'student' ? 'Student Code' : 'Lecturer Code'}: {getUserCode(item)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1890ff15' }]}
          onPress={() => handleEditUser(item)}
        >
          <Icon name="edit" size={18} color="#1890ff" />
          <Text style={[styles.actionButtonText, { color: '#1890ff' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ff4d4f15' }]}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Icon name="delete" size={18} color="#ff4d4f" />
          <Text style={[styles.actionButtonText, { color: '#ff4d4f' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
  </View>
);

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
    <AdminLayout 
      title="User Management"
      rightAction={{
        icon: 'add',
      }}
      onRightAction={handleAddUser}
    >
      {/* Search and Filter Section */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, phone, or user code..."
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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setRoleFilterModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>
            {roleFilter === 'all' ? 'All Roles' : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
          </Text>
          <Icon name="arrow-drop-down" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadUsers} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="people" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText || roleFilter !== 'all' 
                ? 'No users match your filters' 
                : 'No users available'}
            </Text>
            {(!searchText && roleFilter === 'all') && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddUser}>
                <Text style={styles.emptyButtonText}>Add First User</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          filteredUsers.length > 0 ? (
            <View style={styles.footerText}>
              <Text style={styles.footerTextContent}>
                Showing {filteredUsers.length} of {users.length} user(s)
              </Text>
            </View>
          ) : null
        }
      />

      {/* Add/Edit User Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add User'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!editingUser}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role *</Text>
                <View style={styles.roleGrid}>
                  {['student', 'lecturer', 'academic'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.roleButtonActive
                      ]}
                      onPress={() => {
                        setFormData({ 
                          ...formData, 
                          role,
                          studentCode: role === 'student' ? formData.studentCode : '',
                          lecturerCode: role === 'lecturer' ? formData.lecturerCode : '',
                        });
                        setSelectedRole(role);
                      }}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        formData.role === role && styles.roleButtonTextActive
                      ]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {formData.role === 'student' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>User Code (Student Code) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.studentCode}
                    onChangeText={(text) => setFormData({ ...formData, studentCode: text })}
                    placeholder="Enter student code"
                  />
                </View>
              )}

              {formData.role === 'lecturer' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>User Code (Lecturer Code) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.lecturerCode}
                    onChangeText={(text) => setFormData({ ...formData, lecturerCode: text })}
                    placeholder="Enter lecturer code"
                  />
                </View>
              )}

              {!editingUser && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                </View>
              )}

              {editingUser && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Leave empty to keep current password"
                    secureTextEntry
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveUser}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Filter Modal */}
      <Modal
        visible={roleFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRoleFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setRoleFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter by Role</Text>
            {['all', ...availableRoles].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterOption,
                  roleFilter === role && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setRoleFilter(role);
                  setRoleFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  roleFilter === role && styles.filterOptionTextSelected
                ]}>
                  {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
                {roleFilter === role && (
                  <Icon name="check" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
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
  filterButton: {
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
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
  userDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
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
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#667eea15',
    borderColor: '#667eea',
  },
  roleButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#667eea',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
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
});

export default AdminUsers;
