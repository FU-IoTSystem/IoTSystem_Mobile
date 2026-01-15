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
import { userAPI, classesAPI, classAssignmentAPI } from '../../services/api';
import AcademicLayout from '../../components/AcademicLayout';

const AcademicDashboard = ({ user, onLogout }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    activeIotSubjects: 0,
    activeSemesters: 0,
    unassignedStudents: 0,
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

      // Load IOT subjects (classes)
      const classes = await classesAPI.getAllClasses();
      // Filter active classes
      const activeClasses = classes?.filter(c =>
        c.status === 'Active' || c.status === 'ACTIVE' || c.status === true
      ) || [];

      // Count active classes
      const activeIotSubjects = activeClasses.length;

      // Count unique active semesters
      const uniqueSemesters = new Set(
        activeClasses
          .map(c => c.semester)
          .filter(semester => semester) // Remove null/undefined
      );
      const activeSemesters = uniqueSemesters.size;

      // Load class assignments to calculate unassigned students
      const classAssignments = await classAssignmentAPI.getAll();

      // Get student IDs from class assignments
      const assignedStudentIds = new Set(
        classAssignments
          .filter(assignment => {
            const roleName = assignment.roleName || assignment.role || '';
            const roleUpper = roleName.toUpperCase();
            return roleUpper === 'STUDENT' || roleUpper === 'STUDENT_ROLE';
          })
          .map(assignment => assignment.accountId?.toString())
      );

      // Count unassigned students
      const unassignedStudents = students.filter(student =>
        !assignedStudentIds.has(student.id?.toString())
      ).length;

      setStats({
        totalStudents,
        totalLecturers,
        activeIotSubjects,
        activeSemesters,
        unassignedStudents,
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
    <AcademicLayout
      title="Academic Affairs"
      rightAction={{
        icon: 'logout',
      }}
      onRightAction={handleLogout}
    >
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
            <Text style={styles.statLabel}>Active Class/Semester</Text>
            <Text style={styles.statValue}>{stats.activeIotSubjects}</Text>
            <Text style={styles.statSubtext}>{stats.activeSemesters} active semester</Text>
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
            <Icon name="person-add" size={28} color="#fff" />
            <Text style={styles.statSmallLabel}>Unassigned Students</Text>
            <Text style={styles.statSmallValue}>{stats.unassignedStudents}</Text>
          </View>
        </View>
      </ScrollView>
    </AcademicLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#fa8c16',
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
