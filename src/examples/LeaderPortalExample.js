import React, { useState } from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { BottomNavigation, PortalHeader, FloatingActionButton } from '../components/BottomNavigation';
import { colors } from '../theme';

export default function LeaderPortalExample() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleFABPress = () => {
    // Handle FAB press based on current tab
    switch (activeTab) {
      case 'dashboard':
        console.log('Quick action for dashboard');
        break;
      case 'group':
        console.log('Manage group');
        break;
      case 'rentals':
        console.log('Request new rental');
        break;
      case 'wallet':
        console.log('Top up wallet');
        break;
      default:
        break;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      {/* Header */}
      <PortalHeader
        userName="Group Leader"
        userEmail="leader@fpt.edu.vn"
        userRole="leader"
        notificationCount={3}
        onNotificationPress={() => console.log('Leader notifications')}
      />
      
      {/* Content */}
      <ScrollView style={{ flex: 1 }}>
        {/* Your leader content here */}
        <View style={{ padding: 20, minHeight: 600 }}>
          {/* Dashboard, Group, Rentals, Wallet, Profile content */}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        userRole="leader"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={handleFABPress}
        icon="add"
      />
    </View>
  );
}

