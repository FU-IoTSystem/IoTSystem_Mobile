import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { authAPI } from '../../services/api';
import dayjs from 'dayjs';

const MemberProfile = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getProfile();
      const profileData = response?.data || response;
      setProfile(profileData);
      
      if (profileData) {
        setFullName(profileData.fullName || '');
        setPhone(profileData.phone || '');
        setAvatarUrl(profileData.avatarUrl || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatarUrl || '');
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number (10-11 digits)');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      };

      const response = await authAPI.updateProfile(updateData);
      const updatedProfile = response?.data || response;
      setProfile(updatedProfile);
      setEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTimeDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dayjs(dateString);
    return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!editing ? (
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Icon name="edit" size={24} color="#667eea" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadProfile} />
        }
      >
        {profile ? (
          <>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              {profile.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={64} color="#667eea" />
                </View>
              )}
              {editing && (
                <View style={styles.avatarEditContainer}>
                  <TextInput
                    style={styles.avatarInput}
                    placeholder="Avatar URL"
                    placeholderTextColor="#999"
                    value={avatarUrl}
                    onChangeText={setAvatarUrl}
                    keyboardType="url"
                  />
                </View>
              )}
            </View>

            {/* Profile Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Account ID</Text>
                  <Text style={styles.infoValue}>{profile.id || 'N/A'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <View style={styles.infoValueContainer}>
                    <Text style={styles.infoValue}>{profile.email || 'N/A'}</Text>
                    <View style={styles.readOnlyBadge}>
                      <Text style={styles.readOnlyText}>Cannot be changed</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile.fullName || 'N/A'}</Text>
                  )}
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  {editing ? (
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile.phone || 'N/A'}</Text>
                  )}
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Student Code</Text>
                  <View style={styles.infoValueContainer}>
                    <Text style={styles.infoValue}>{profile.studentCode || 'N/A'}</Text>
                    <View style={styles.readOnlyBadge}>
                      <Text style={styles.readOnlyText}>Cannot be changed</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <View style={[styles.roleBadge, styles.roleBadgeMember]}>
                    <Text style={styles.roleText}>{profile.role || 'MEMBER'}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Account Status</Text>
                  <View style={[
                    styles.statusBadge,
                    profile.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      profile.isActive ? styles.statusTextActive : styles.statusTextInactive
                    ]}>
                      {profile.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created At</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTimeDisplay(profile.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="person-off" size={64} color="#ddd" />
            <Text style={styles.emptyText}>Failed to load profile</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  editButton: {
    padding: 8,
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#667eea',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#667eea',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#667eea',
  },
  avatarEditContainer: {
    marginTop: 16,
    width: '100%',
  },
  avatarInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  infoValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'right',
  },
  readOnlyBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  readOnlyText: {
    fontSize: 10,
    color: '#856404',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeMember: {
    backgroundColor: '#e3f2fd',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#e8f5e9',
  },
  statusBadgeInactive: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextActive: {
    color: '#2e7d32',
  },
  statusTextInactive: {
    color: '#c62828',
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
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MemberProfile;

