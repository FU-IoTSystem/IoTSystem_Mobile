import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LeaderLayout from '../../components/LeaderLayout';

const LeaderSettings = ({ user, navigation }) => {
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [rentalAlerts, setRentalAlerts] = React.useState(true);
  const [showProfile, setShowProfile] = React.useState(true);
  const [allowMessages, setAllowMessages] = React.useState(true);

  const SettingItem = ({ label, description, value, onValueChange }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e0e0e0', true: '#667eea' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <LeaderLayout title="Settings">
      <ScrollView style={styles.content}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <SettingItem
              label="Email Notifications"
              description="Receive notifications via email"
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
            <View style={styles.divider} />
            <SettingItem
              label="Push Notifications"
              description="Receive push notifications on your device"
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
            <View style={styles.divider} />
            <SettingItem
              label="Rental Alerts"
              description="Get notified about rental updates"
              value={rentalAlerts}
              onValueChange={setRentalAlerts}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <SettingItem
              label="Show Profile to Members"
              description="Allow group members to view your profile"
              value={showProfile}
              onValueChange={setShowProfile}
            />
            <View style={styles.divider} />
            <SettingItem
              label="Allow Direct Messages"
              description="Let others send you direct messages"
              value={allowMessages}
              onValueChange={setAllowMessages}
            />
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
});

export default LeaderSettings;
