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
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Avatar,
  Button,
  TextInput,
  Divider,
} from 'react-native-paper';
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
        {/* Avatar Section */}
        <Card style={styles.avatarSection} mode="elevated">
          <Card.Content style={styles.avatarContent}>
            <View style={styles.avatarContainer}>
              <Icon name="account-circle" size={120} color="#ffffff" />
            </View>
            {isEditing && (
              <TextInput
                style={styles.avatarUrlInput}
                label="Avatar URL (optional)"
                value={formData.avatarUrl}
                onChangeText={(text) => setFormData({ ...formData, avatarUrl: text })}
                mode="outlined"
              />
            )}
          </Card.Content>
        </Card>

        {/* Profile Details */}
        <Card style={styles.detailsSection} mode="elevated">
          <Card.Content>
            <View style={styles.detailItem}>
              <Paragraph style={styles.detailLabel}>Account ID</Paragraph>
              <Chip style={styles.chip}>{profile.id}</Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <Paragraph style={styles.detailLabel}>Email</Paragraph>
              <View style={styles.detailValueRow}>
                <Paragraph style={styles.detailValue}>{profile.email || 'N/A'}</Paragraph>
                <Chip style={styles.orangeChip} compact>Cannot be changed</Chip>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <Paragraph style={styles.detailLabel}>Full Name</Paragraph>
              {isEditing ? (
                <TextInput
                  label="Full Name"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  mode="outlined"
                  style={styles.input}
                />
              ) : (
                <Title style={styles.detailValue}>{profile.fullName || 'N/A'}</Title>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <Paragraph style={styles.detailLabel}>Phone</Paragraph>
              {isEditing ? (
                <TextInput
                  label="Phone"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              ) : (
                <Paragraph style={styles.detailValue}>{profile.phone || 'N/A'}</Paragraph>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <Paragraph style={styles.detailLabel}>Role</Paragraph>
              <View style={styles.detailValueRow}>
                <Chip style={styles.purpleChip}>{profile.role || 'N/A'}</Chip>
                <Chip style={styles.orangeChip} compact>Cannot be changed</Chip>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <Paragraph style={styles.detailLabel}>Account Status</Paragraph>
              <Chip 
                style={{ backgroundColor: profile.isActive ? '#52c41a' : '#ff4d4f' }}
                textStyle={{ color: 'white' }}
              >
                {profile.isActive ? 'Active' : 'Inactive'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <Paragraph style={styles.detailLabel}>Created At</Paragraph>
              <Paragraph style={styles.detailValue}>
                {formatDateTimeDisplay(profile.createdAt)}
              </Paragraph>
            </View>
          </Card.Content>
        </Card>
        
        {/* Change Password Button */}
        <Card style={styles.changePasswordCard} mode="elevated">
          <Card.Content>
            <Button
              mode="outlined"
              icon="lock"
              onPress={() => setChangePasswordModalVisible(true)}
              buttonColor="#667eea"
            >
              Change Password
            </Button>
          </Card.Content>
        </Card>
        </ScrollView>
      )}
      {isEditing && (
        <Card style={styles.editActionsCard} mode="elevated">
          <Card.Actions>
            <Button onPress={handleCancel}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              buttonColor="#667eea"
            >
              Save
            </Button>
          </Card.Actions>
        </Card>
      )}
      
      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard} mode="elevated">
            <Card.Title title="Change Password" />
            <Card.Content>
              <TextInput
                label="Current Password"
                value={passwordData.oldPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, oldPassword: text })}
                secureTextEntry
                mode="outlined"
                style={styles.passwordInput}
              />
              <TextInput
                label="New Password"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                secureTextEntry
                mode="outlined"
                style={styles.passwordInput}
                helperText="Password must be at least 8 characters, contain uppercase, lowercase, and special characters"
              />
              <TextInput
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                secureTextEntry
                mode="outlined"
                style={styles.passwordInput}
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => {
                setChangePasswordModalVisible(false);
                setPasswordData({
                  oldPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleChangePassword}
                loading={changingPassword}
                buttonColor="#667eea"
              >
                Change Password
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    </LecturerLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    marginBottom: 16,
  },
  avatarContent: {
    alignItems: 'center',
    paddingVertical: 20,
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
  avatarUrlInput: {
    marginTop: 16,
  },
  detailsSection: {
    marginBottom: 16,
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
    color: '#333',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#1890ff',
  },
  orangeChip: {
    backgroundColor: '#fa8c16',
  },
  purpleChip: {
    backgroundColor: '#722ed1',
  },
  divider: {
    marginVertical: 8,
  },
  editActionsCard: {
    margin: 16,
    marginTop: 0,
  },
  changePasswordCard: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
  },
  passwordInput: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default LecturerProfile;

