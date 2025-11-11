import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { userAPI, classesAPI } from '../../services/api';

const AcademicDashboard = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    activeIotSubjects: 0,
    totalKits: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load students
      const students = await userAPI.getStudents();
      const totalStudents = students?.length || 0;

      // Load lecturers
      const lecturers = await userAPI.getLecturers();
      const totalLecturers = lecturers?.length || 0;

      // Load IOT subjects
      const classes = await classesAPI.getAllClasses();
      const activeIotSubjects = classes?.filter(c => c.status)?.length || 0;

      setStats({
        totalStudents,
        totalLecturers,
        activeIotSubjects,
        totalKits: 0, // Kits are managed by admin
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <View style={styles.container}>
      {/* Header with gradient background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerGreeting}>Welcome back!</Text>
            <Text style={styles.headerTitle}>Academic Affairs</Text>
          </View>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome back, Academic Affairs! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Here's what's happening in your academic system today
          </Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Icon name="book" size={32} color="#fff" />
            <Text style={styles.statLabel}>Active Semesters</Text>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statSubtext}>0 total semesters</Text>
          </View>

          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Icon name="people" size={28} color="#fff" />
            <Text style={styles.statSmallLabel}>Total Students</Text>
            <Text style={styles.statSmallValue}>{stats.totalStudents}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardTertiary]}>
            <Icon name="groups" size={28} color="#fff" />
            <Text style={styles.statSmallLabel}>Total Lecturers</Text>
            <Text style={styles.statSmallValue}>{stats.totalLecturers}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardQuaternary]}>
            <Icon name="build" size={28} color="#fff" />
            <Text style={styles.statSmallLabel}>Active IoT Subjects</Text>
            <Text style={styles.statSmallValue}>{stats.activeIotSubjects}</Text>
          </View>
        </View>

        {/* System Overview */}
        <View style={styles.section}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>System Overview</Text>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Students:</Text>
              <Text style={styles.overviewValue}>{stats.totalStudents}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Lecturers:</Text>
              <Text style={styles.overviewValue}>{stats.totalLecturers}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Active IoT Subjects:</Text>
              <Text style={styles.overviewValue}>{stats.activeIotSubjects}</Text>
            </View>
          </View>
        </View>
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
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardPrimary: {
    width: '100%',
    backgroundColor: '#667eea',
  },
  statCardSecondary: {
    backgroundColor: '#f093fb',
  },
  statCardTertiary: {
    backgroundColor: '#4facfe',
  },
  statCardQuaternary: {
    backgroundColor: '#43e97b',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  statSmallLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    marginBottom: 4,
  },
  statSmallValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
  },
});

export default AcademicDashboard;
