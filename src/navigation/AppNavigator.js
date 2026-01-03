import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { lightTheme } from '../theme/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Member Screens
import MemberDashboard from '../screens/member/MemberDashboard';
import MemberWallet from '../screens/member/MemberWallet';
import MemberGroups from '../screens/member/MemberGroups';
import MemberNotifications from '../screens/member/MemberNotifications';
import MemberProfile from '../screens/member/MemberProfile';
import BorrowTracking from '../screens/member/BorrowTracking';

// Leader Screens
import LeaderDashboard from '../screens/leader/LeaderDashboard';
import LeaderRentals from '../screens/leader/LeaderRentals';
import LeaderBorrowStatus from '../screens/leader/LeaderBorrowStatus';
import LeaderComponentRental from '../screens/leader/LeaderComponentRental';
import LeaderWallet from '../screens/leader/LeaderWallet';
import LeaderProfile from '../screens/leader/LeaderProfile';
import LeaderSettings from '../screens/leader/LeaderSettings';
import QRScannerScreen from '../screens/leader/QRScannerScreen';
import GroupManagementScreen from '../screens/leader/GroupManagementScreen';

// Lecturer Screens
import LecturerDashboard from '../screens/lecturer/LecturerDashboard';
import LecturerRentals from '../screens/lecturer/LecturerRentals';
import LecturerGroups from '../screens/lecturer/LecturerGroups';
import LecturerKitRental from '../screens/lecturer/LecturerKitRental';
import LecturerComponentRental from '../screens/lecturer/LecturerComponentRental';
import LecturerWallet from '../screens/lecturer/LecturerWallet';
import LecturerProfile from '../screens/lecturer/LecturerProfile';

// Admin Screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminApprovals from '../screens/admin/AdminApprovals';
import AdminReturnKits from '../screens/admin/AdminReturnKits';
import AdminKits from '../screens/admin/AdminKits';
import AdminUsers from '../screens/admin/AdminUsers';
import AdminTransactions from '../screens/admin/AdminTransactions';
import AdminLogHistory from '../screens/admin/AdminLogHistory';
import AdminGroups from '../screens/admin/AdminGroups';
import AdminFines from '../screens/admin/AdminFines';
import AdminPenaltyPolicies from '../screens/admin/AdminPenaltyPolicies';
import AdminScanQR from '../screens/admin/AdminScanQR';
import AdminKitComponents from '../screens/admin/AdminKitComponents';
import AdminKitComponentHistory from '../screens/admin/AdminKitComponentHistory';
import AdminProfile from '../screens/admin/AdminProfile';

// Academic Affairs Screens
import AcademicDashboard from '../screens/academic/AcademicDashboard';
import AcademicClasses from '../screens/academic/AcademicClasses';
import AcademicStudents from '../screens/academic/AcademicStudents';
import AcademicLecturers from '../screens/academic/AcademicLecturers';
import AcademicStudentEnrollment from '../screens/academic/AcademicStudentEnrollment';
import AcademicProfile from '../screens/academic/AcademicProfile';

// Shared Screens
import TopUpScreen from '../screens/shared/TopUpScreen';
import PenaltyPaymentScreen from '../screens/shared/PenaltyPaymentScreen';
import QRInfoScreen from '../screens/shared/QRInfoScreen';
import TransferScreen from '../screens/shared/TransferScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Member Drawer Navigator
function MemberDrawerInner({ user, onLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      >
        {(props) => <MemberDashboard {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Wallet"
        options={{
          drawerLabel: 'Wallet',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      >
        {(props) => <MemberWallet {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Groups"
        options={{
          drawerLabel: 'My Groups',
          drawerIcon: ({ color, size }) => (
            <Icon name="group" size={size} color={color} />
          ),
        }}
      >
        {(props) => <MemberGroups {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Notifications"
        options={{
          drawerLabel: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Icon name="notifications" size={size} color={color} />
          ),
        }}
      >
        {(props) => <MemberNotifications {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="BorrowTracking"
        options={{
          drawerLabel: 'Borrow Tracking',
          drawerIcon: ({ color, size }) => (
            <Icon name="history" size={size} color={color} />
          ),
        }}
      >
        {(props) => <BorrowTracking {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Profile"
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <MemberProfile {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// Leader Drawer Navigator
function LeaderDrawerInner({ user, onLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LeaderDashboard {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Groups"
        options={{
          drawerLabel: 'Group Management',
          drawerIcon: ({ color, size }) => (
            <Icon name="group" size={size} color={color} />
          ),
        }}
      >
        {(props) => <GroupManagementScreen {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="KitRental"
        options={{
          drawerLabel: 'Kit Rental',
          drawerIcon: ({ color, size }) => (
            <Icon name="build" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LeaderRentals {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="ComponentRental"
        options={{
          drawerLabel: 'Kit Component Rental',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LeaderComponentRental {...props} user={user} navigation={props.navigation} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="BorrowStatus"
        options={{
          drawerLabel: 'Borrow Tracking',
          drawerIcon: ({ color, size }) => (
            <Icon name="visibility" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LeaderBorrowStatus {...props} user={user} navigation={props.navigation} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Wallet"
        options={{
          drawerLabel: 'Wallet',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LeaderWallet {...props} user={user} navigation={props.navigation} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Profile"
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LeaderProfile {...props} user={user} navigation={props.navigation} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Settings"
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LeaderSettings {...props} user={user} navigation={props.navigation} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// Member Stack Navigator (wraps Drawer with shared screens)
function MemberStack({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberMain">
        {(props) => <MemberDrawerInner {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="TopUp">
        {(props) => <TopUpScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="Transfer">
        {(props) => <TransferScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="PenaltyPayment">
        {(props) => <PenaltyPaymentScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="QRInfo">
        {(props) => <QRInfoScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Leader Stack Navigator (wraps Drawer with shared screens)
function LeaderDrawer({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LeaderMain">
        {(props) => <LeaderDrawerInner {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="TopUp">
        {(props) => <TopUpScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="Transfer">
        {(props) => <TransferScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="PenaltyPayment">
        {(props) => <PenaltyPaymentScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="QRInfo">
        {(props) => <QRInfoScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Lecturer Drawer Navigator
function LecturerDrawerInner({ user, onLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LecturerDashboard {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Groups"
        options={{
          drawerLabel: 'My Groups',
          drawerIcon: ({ color, size }) => (
            <Icon name="group" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LecturerGroups {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="KitRental"
        options={{
          drawerLabel: 'Kit Rental',
          drawerIcon: ({ color, size }) => (
            <Icon name="build" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LecturerKitRental {...props} user={user} navigation={props.navigation} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="ComponentRental"
        options={{
          drawerLabel: 'Kit Component Rental',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LecturerComponentRental {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Rentals"
        options={{
          drawerLabel: 'Borrow Tracking',
          drawerIcon: ({ color, size }) => (
            <Icon name="shopping-cart" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LecturerRentals {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Wallet"
        options={{
          drawerLabel: 'Wallet',
          drawerIcon: ({ color, size }) => (
            <Icon name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LecturerWallet {...props} user={user} navigation={props.navigation} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Profile"
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <LecturerProfile {...props} user={user} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// Lecturer Stack Navigator (wraps Drawer with shared screens)
function LecturerDrawer({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LecturerMain">
        {(props) => <LecturerDrawerInner {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="TopUp">
        {(props) => <TopUpScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="Transfer">
        {(props) => <TransferScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="PenaltyPayment">
        {(props) => <PenaltyPaymentScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="QRInfo">
        {(props) => <QRInfoScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Admin Drawer Navigator
function AdminDrawer({ user, onLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminDashboard {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Kits"
        options={{
          drawerLabel: 'Kit Management',
          drawerIcon: ({ color, size }) => (
            <Icon name="build" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminKits {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="KitComponents"
        options={{
          drawerLabel: 'Kit Components',
          drawerIcon: ({ color, size }) => (
            <Icon name="memory" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminKitComponents {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Approvals"
        options={{
          drawerLabel: 'Rental Approvals',
          drawerIcon: ({ color, size }) => (
            <Icon name="check-circle" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminApprovals {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="ReturnKits"
        options={{
          drawerLabel: 'Return Checking',
          drawerIcon: ({ color, size }) => (
            <Icon name="assignment-returned" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminReturnKits {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="ScanQRDrawer"
        options={{
          drawerLabel: 'Scan QR Code',
          drawerIcon: ({ color, size }) => (
            <Icon name="qr-code-scanner" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            e.preventDefault();
            // Navigate to the Stack screen instead
            navigation.closeDrawer();
            navigation.getParent()?.navigate('ScanQR');
          },
        })}
      >
        {(props) => <AdminScanQR {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Users"
        options={{
          drawerLabel: 'User Management',
          drawerIcon: ({ color, size }) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminUsers {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Groups"
        options={{
          drawerLabel: 'Group Management',
          drawerIcon: ({ color, size }) => (
            <Icon name="group" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminGroups {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="KitComponentHistory"
        options={{
          drawerLabel: 'Component History',
          drawerIcon: ({ color, size }) => (
            <Icon name="history-toggle-off" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminKitComponentHistory {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="LogHistory"
        options={{
          drawerLabel: 'Log History',
          drawerIcon: ({ color, size }) => (
            <Icon name="history" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminLogHistory {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Transactions"
        options={{
          drawerLabel: 'Transaction History',
          drawerIcon: ({ color, size }) => (
            <Icon name="payment" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminTransactions {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Fines"
        options={{
          drawerLabel: 'Fine Management',
          drawerIcon: ({ color, size }) => (
            <Icon name="attach-money" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminFines {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="PenaltyPolicies"
        options={{
          drawerLabel: 'Penalty Policies',
          drawerIcon: ({ color, size }) => (
            <Icon name="policy" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminPenaltyPolicies {...props} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Profile"
        options={{
          drawerLabel: 'My Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AdminProfile {...props} user={user} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// Admin Stack Navigator (wraps Drawer with shared screens)
function AdminStack({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain">
        {(props) => <AdminDrawer {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="ScanQR">
        {(props) => <AdminScanQR {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Academic Stack Navigator (wraps Drawer with shared screens)
function AcademicStack({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AcademicMain">
        {(props) => <AcademicDrawerInner {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="StudentEnrollment">
        {(props) => <AcademicStudentEnrollment {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Academic Drawer Navigator
function AcademicDrawerInner({ user, onLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#667eea',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AcademicDashboard {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="StudentEnrollment"
        options={{
          drawerLabel: 'Student Enrollment',
          drawerIcon: ({ color, size }) => (
            <Icon name="assignment" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AcademicStudentEnrollment {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Classes"
        options={{
          drawerLabel: 'IOT Subjects',
          drawerIcon: ({ color, size }) => (
            <Icon name="build" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AcademicClasses {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Students"
        options={{
          drawerLabel: 'Students',
          drawerIcon: ({ color, size }) => (
            <Icon name="school" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AcademicStudents {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Lecturers"
        options={{
          drawerLabel: 'Lecturers',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AcademicLecturers {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
      <Drawer.Screen
        name="Profile"
        options={{
          drawerLabel: 'My Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      >
        {(props) => <AcademicProfile {...props} user={user} onLogout={onLogout} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

// Main App Navigator (Inner component that uses AuthContext)
function AppNavigatorInner() {
  const { user, loading, logout, checkAuth } = useAuth();

  React.useEffect(() => {
    // Initial auth check on mount
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return null; // You can add a loading screen here
  }

  const getRoleNavigator = () => {
    if (!user) return <AuthStack />;

    const role = user.role?.toLowerCase();

    switch (role) {
      case 'member':
      case 'student':
        return <MemberStack user={user} onLogout={handleLogout} />;
      case 'leader':
        return <LeaderDrawer user={user} onLogout={handleLogout} />;
      case 'lecturer':
        return <LecturerDrawer user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminStack user={user} onLogout={handleLogout} />;
      case 'academic':
        return <AcademicStack user={user} onLogout={handleLogout} />;
      default:
        return <MemberStack user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <PaperProvider theme={lightTheme}>
      <NavigationContainer>
        {getRoleNavigator()}
      </NavigationContainer>
    </PaperProvider>
  );
}

// Main App Navigator (Wrapper with AuthProvider)
export default function AppNavigator() {
  return (
    <AuthProvider>
      <AppNavigatorInner />
    </AuthProvider>
  );
}
