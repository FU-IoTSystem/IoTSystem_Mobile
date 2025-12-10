import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LecturerLayout from '../../components/LecturerLayout';
import { authAPI } from '../../services/api';
import dayjs from 'dayjs';

// Password validation helper
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
};

const LecturerProfile = ({ user, navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    avatarUrl: '',
  });
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      console.log('Profile response:', response);
      
      const profileData = response?.data || response;
      setProfile(profileData);
      
      if (profileData) {
        setFormData({
          fullName: profileData.fullName || '',
          phone: profileData.phone || '',
          avatarUrl: profileData.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  };

  const handleSave = async () => {
    if (!formData.fullName || formData.fullName.trim() === '') {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number (10-11 digits)');
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        fullName: formData.fullName,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl || null,
      };

      const response = await authAPI.updateProfile(updateData);
      console.log('Update profile response:', response);
      
      const updatedProfile = response?.data || response;
      setProfile(updatedProfile);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
      
      // Reload profile to get latest data
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const { oldPassword, newPassword, confirmPassword } = passwordData;
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    
    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match');
      return;
    }
    
    // Check if new password is same as old password
    if (oldPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from old password');
      return;
    }
    
    try {
      setChangingPassword(true);
      await authAPI.changePassword(oldPassword, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      setChangePasswordModalVisible(false);
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password: ' + (error.message || 'Unknown error'));
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dayjs(dateString);
    return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!profile) {
    return (
      <LecturerLayout title="My Profile">
        <View style={styles.loadingContainer}>
          <Icon name="error-outline" size={48} color="#ccc" />
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </LecturerLayout>
    );
  }

  return (
    <LecturerLayout 
      title="My Profile"
      rightAction={!isEditing ? {
        icon: 'pencil',
      } : null}
      onRightAction={!isEditing ? handleEdit : null}
    >
      {loading ? (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <>
          <ScrollView style={styles.content}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContent}>
                <View style={styles.avatarContainer}>
                  {profile.avatarUrl ? (
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      style={styles.avatarImage}
                      onError={(error) => {
                        console.error('Avatar image load error:', error);
                      }}
                    />
                  ) : (
                    <Icon name="account-circle" size={120} color="#ffffff" />
                  )}
                </View>
                {isEditing && (
                  <View style={styles.avatarUrlContainer}>
                    <Text style={styles.label}>Avatar URL (optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.avatarUrl}
                      onChangeText={(text) => setFormData({ ...formData, avatarUrl: text })}
                      placeholder="Enter avatar URL"
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Profile Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Lecturer Code</Text>
                <View style={styles.detailValueRow}>
                  <Text style={styles.detailValue}>{profile.lecturerCode || 'N/A'}</Text>
                  <View style={[styles.badge, { backgroundColor: '#faad1415' }]}>
                    <Text style={[styles.badgeText, { color: '#faad14' }]}>Cannot be changed</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Email</Text>
                <View style={styles.detailValueRow}>
                  <Text style={styles.detailValue}>{profile.email || 'N/A'}</Text>
                  <View style={[styles.badge, { backgroundColor: '#faad1415' }]}>
                    <Text style={[styles.badgeText, { color: '#faad14' }]}>Cannot be changed</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={formData.fullName}
                    onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                    placeholder="Enter full name"
                  />
                ) : (
                  <Text style={[styles.detailValue, styles.detailValueLarge]}>
                    {profile.fullName || 'N/A'}
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.detailValue}>{profile.phone || 'N/A'}</Text>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Role</Text>
                <View style={styles.detailValueRow}>
                  <View style={[styles.badge, { backgroundColor: '#722ed115' }]}>
                    <Text style={[styles.badgeText, { color: '#722ed1' }]}>
                      {profile.role?.toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#faad1415' }]}>
                    <Text style={[styles.badgeText, { color: '#faad14' }]}>Cannot be changed</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Account Status</Text>
                <View style={[
                  styles.badge,
                  { backgroundColor: profile.isActive ? '#52c41a15' : '#ff4d4f15' }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    { color: profile.isActive ? '#52c41a' : '#ff4d4f' }
                  ]}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Created At</Text>
                <Text style={styles.detailValue}>
                  {formatDateTimeDisplay(profile.createdAt)}
                </Text>
              </View>
            </View>
            
            {/* Change Password Button */}
            <View style={styles.changePasswordSection}>
              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={() => setChangePasswordModalVisible(true)}
              >
                <Icon name="lock" size={20} color="#667eea" />
                <Text style={styles.changePasswordButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          {isEditing && (
            <View style={styles.editActionsCard}>
              <TouchableOpacity
                style={[styles.editButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setChangePasswordModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.oldPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, oldPassword: text })}
                placeholder="Enter current password"
                secureTextEntry
              />
              
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry
              />
              <Text style={styles.helperText}>
                Password must be at least 8 characters, contain uppercase, lowercase, and special characters
              </Text>
              
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setChangePasswordModalVisible(false);
                  setPasswordData({
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LecturerLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  avatarSection: {
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
  avatarContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarUrlContainer: {
    width: '100%',
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  detailValueLarge: {
    fontSize: 18,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  editActionsCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  changePasswordSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 8,
    gap: 8,
  },
  changePasswordButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    marginBottom: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LecturerProfile;
