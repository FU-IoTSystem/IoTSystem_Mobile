import React, { useState } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { BottomNavigation, PortalHeader } from '../components/BottomNavigation';
import { colors } from '../theme';

export default function LecturerPortalExample() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <PortalHeader
        userName="Dr. Lecturer"
        userEmail="lecturer@fpt.edu.vn"
        userRole="lecturer"
        notificationCount={8}
        onNotificationPress={() => console.log('Lecturer notifications')}
      />
      
      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {/* Your lecturer content here */}
        <View style={{ padding: 20, minHeight: 600 }}>
          {/* Dashboard, Groups, Approvals, Reports, Profile content */}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        userRole="lecturer"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </View>
  );
}

