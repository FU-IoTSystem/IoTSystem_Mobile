import React, { useState } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { BottomNavigation, PortalHeader } from '../components/BottomNavigation';
import { colors } from '../theme';

export default function AcademicPortalExample() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <PortalHeader
        userName="Academic Affairs"
        userEmail="academic@fpt.edu.vn"
        userRole="academic"
        notificationCount={12}
        onNotificationPress={() => console.log('Academic notifications')}
      />
      
      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {/* Your academic content here */}
        <View style={{ padding: 20, minHeight: 600 }}>
          {/* Dashboard, Students, Groups, Reports, Profile content */}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        userRole="academic"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </View>
  );
}

