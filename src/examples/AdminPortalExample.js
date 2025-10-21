import React, { useState } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { BottomNavigation, PortalHeader } from '../components/BottomNavigation';
import { colors } from '../theme';

export default function AdminPortalExample() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <PortalHeader
        userName="Admin User"
        userEmail="admin@fpt.edu.vn"
        userRole="admin"
        notificationCount={5}
        onNotificationPress={() => console.log('Admin notifications')}
      />
      
      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {/* Your admin content here */}
        <View style={{ padding: 20, minHeight: 600 }}>
          {/* Dashboard, Kits, Requests, Users, Profile content */}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        userRole="admin"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </View>
  );
}

