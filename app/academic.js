import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { 
  Appbar, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  Surface,
  FAB,
  Portal,
  Modal,
  List,
  Divider,
  Avatar,
  Badge,
  Switch,
  TextInput,
  DataTable,
  ActivityIndicator,
  Searchbar,
  Text
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows } from '../src/theme';
import { 
  mockSemesters, 
  mockStudents, 
  mockLecturers, 
  mockKits,
  mockAcademicStudents,
  mockAcademicLecturers,
  mockIotSubjects,
  mockAcademicStats,
  mockEnrollments,
  mockAssignments,
  mockAcademicLogs,
  mockAcademicReports,
  mockAcademicNotifications,
  mockLecturerPerformance,
  mockLecturerSchedules
} from '../mocks';

export default function AcademicScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [kits, setKits] = useState([]);
  const [iotSubjects, setIotSubjects] = useState([]);
  const [academicStats, setAcademicStats] = useState({});
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [academicLogs, setAcademicLogs] = useState([]);
  const [academicReports, setAcademicReports] = useState([]);
  const [academicNotifications, setAcademicNotifications] = useState([]);
  const [lecturerPerformance, setLecturerPerformance] = useState([]);
  const [lecturerSchedules, setLecturerSchedules] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load comprehensive academic data
      setSemesters(mockSemesters);
      setStudents(mockAcademicStudents); // Use comprehensive student data
      setLecturers(mockAcademicLecturers); // Use comprehensive lecturer data
      setKits(mockKits);
      setIotSubjects(mockIotSubjects); // Use comprehensive IoT subjects
      setAcademicStats(mockAcademicStats);
      setEnrollments(mockEnrollments);
      setAssignments(mockAssignments);
      setAcademicLogs(mockAcademicLogs);
      setAcademicReports(mockAcademicReports);
      setAcademicNotifications(mockAcademicNotifications);
      setLecturerPerformance(mockLecturerPerformance);
      setLecturerSchedules(mockLecturerSchedules);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    router.push('/');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return colors.success;
      case 'pending':
      case 'in_progress':
        return colors.warning;
      case 'inactive':
      case 'rejected':
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderDashboard = () => {
    // Use comprehensive academic statistics
    const stats = academicStats || {};
    const activeSemesters = stats.activeSemesters || 0;
    const totalStudents = stats.totalStudents || 0;
    const totalLecturers = stats.totalLecturers || 0;
    const availableKits = (kits || []).filter(k => k.status === 'AVAILABLE').length;
    const activeIotSubjects = stats.activeIotSubjects || 0;

    return (
      <View style={styles.tabContent}>
        {/* Welcome Header */}
        <Card style={[styles.welcomeCard, shadows.medium]}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.welcomeGradient}
          >
            <Card.Content>
              <View style={styles.welcomeContent}>
                <View style={styles.welcomeText}>
                  <Title style={styles.welcomeTitle}>Welcome back, Academic Affairs! 👋</Title>
                  <Paragraph style={styles.welcomeSubtitle}>
                    Here's what's happening in your academic system today
                  </Paragraph>
                </View>
                <View style={styles.welcomeIcon}>
                  <Title style={styles.emoji}>📚</Title>
                </View>
              </View>
            </Card.Content>
          </LinearGradient>
        </Card>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, shadows.small]}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.statGradient}
            >
              <Card.Content style={styles.statContent}>
                <View style={styles.statHeader}>
                  <View>
                    <Title style={styles.statNumber}>{activeSemesters}</Title>
                    <Paragraph style={styles.statLabel}>Active Semesters</Paragraph>
                  </View>
                  <Title style={styles.statIcon}>📖</Title>
                </View>
                <Paragraph style={styles.statSubtext}>
                  {(semesters || []).length} total semesters
                </Paragraph>
              </Card.Content>
            </LinearGradient>
          </Card>

          <Card style={[styles.statCard, shadows.small]}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.statGradient}
            >
              <Card.Content style={styles.statContent}>
                <View style={styles.statHeader}>
                  <View>
                    <Title style={styles.statNumber}>{totalStudents}</Title>
                    <Paragraph style={styles.statLabel}>Total Students</Paragraph>
                  </View>
                  <Title style={styles.statIcon}>👥</Title>
                </View>
                <Paragraph style={styles.statSubtext}>
                  {(students || []).length} total students
                </Paragraph>
              </Card.Content>
            </LinearGradient>
          </Card>

          <Card style={[styles.statCard, shadows.small]}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.statGradient}
            >
              <Card.Content style={styles.statContent}>
                <View style={styles.statHeader}>
                  <View>
                    <Title style={styles.statNumber}>{totalLecturers}</Title>
                    <Paragraph style={styles.statLabel}>Total Lecturers</Paragraph>
                  </View>
                  <Title style={styles.statIcon}>👨‍🏫</Title>
                </View>
                <Paragraph style={styles.statSubtext}>
                  {activeIotSubjects} active IoT subjects
                </Paragraph>
              </Card.Content>
            </LinearGradient>
          </Card>

          <Card style={[styles.statCard, shadows.small]}>
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.statGradient}
            >
              <Card.Content style={styles.statContent}>
                <View style={styles.statHeader}>
                  <View>
                    <Title style={styles.statNumber}>{availableKits}</Title>
                    <Paragraph style={styles.statLabel}>Available Kits</Paragraph>
                  </View>
                  <Title style={styles.statIcon}>🔧</Title>
                </View>
                <Paragraph style={styles.statSubtext}>
                  {(kits || []).length} total kits
                </Paragraph>
              </Card.Content>
            </LinearGradient>
          </Card>
        </View>
      </View>
    );
  };

  const renderSemesterManagement = () => (
    <View style={styles.tabContent}>
      <Searchbar
        placeholder="Search semesters..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Semester Management</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Start Date</DataTable.Title>
              <DataTable.Title>End Date</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>

            {(semesters || []).map((semester) => (
              <DataTable.Row key={semester.id}>
                <DataTable.Cell>{semester.name}</DataTable.Cell>
                <DataTable.Cell>{semester.startDate}</DataTable.Cell>
                <DataTable.Cell>{semester.endDate}</DataTable.Cell>
                <DataTable.Cell>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.statusChip,
                      { borderColor: getStatusColor(semester.status) }
                    ]}
                    textStyle={{ color: getStatusColor(semester.status) }}
                  >
                    {semester.status}
                  </Chip>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </View>
  );

  const renderStudentManagement = () => {
    const filteredStudents = (students || []).filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
    <View style={styles.tabContent}>
      <Searchbar
        placeholder="Search students..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Student Management</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Student ID</DataTable.Title>
              <DataTable.Title>Major</DataTable.Title>
                <DataTable.Title>Year</DataTable.Title>
                <DataTable.Title>Enrollment Date</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>

              {filteredStudents.map((student) => (
              <DataTable.Row key={student.id}>
                  <DataTable.Cell>
                    <View>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentEmail}>{student.email}</Text>
                    </View>
                  </DataTable.Cell>
                <DataTable.Cell>{student.studentId}</DataTable.Cell>
                <DataTable.Cell>{student.major}</DataTable.Cell>
                  <DataTable.Cell>Year {student.year}</DataTable.Cell>
                  <DataTable.Cell>{student.enrollmentDate}</DataTable.Cell>
                <DataTable.Cell>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.statusChip,
                      { borderColor: getStatusColor(student.status) }
                    ]}
                    textStyle={{ color: getStatusColor(student.status) }}
                  >
                    {student.status}
                  </Chip>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </View>
  );
  };

  const renderLecturerManagement = () => {
    const filteredLecturers = (lecturers || []).filter(lecturer =>
      lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecturer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecturer.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
    <View style={styles.tabContent}>
      <Searchbar
        placeholder="Search lecturers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>Lecturer Management</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Department</DataTable.Title>
              <DataTable.Title>Specialization</DataTable.Title>
                <DataTable.Title>Classes</DataTable.Title>
                <DataTable.Title>Students</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>

              {filteredLecturers.map((lecturer) => (
              <DataTable.Row key={lecturer.id}>
                  <DataTable.Cell>
                    <View>
                      <Text style={styles.lecturerName}>{lecturer.name}</Text>
                      <Text style={styles.lecturerEmail}>{lecturer.email}</Text>
                    </View>
                  </DataTable.Cell>
                <DataTable.Cell>{lecturer.department}</DataTable.Cell>
                <DataTable.Cell>{lecturer.specialization}</DataTable.Cell>
                  <DataTable.Cell>{lecturer.classes?.length || 0}</DataTable.Cell>
                  <DataTable.Cell>{lecturer.totalStudents || 0}</DataTable.Cell>
                <DataTable.Cell>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.statusChip,
                      { borderColor: getStatusColor(lecturer.status) }
                    ]}
                    textStyle={{ color: getStatusColor(lecturer.status) }}
                  >
                    {lecturer.status}
                  </Chip>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </View>
  );
  };

  const renderIotSubjectsManagement = () => (
    <View style={styles.tabContent}>
      <Card style={[styles.card, shadows.medium]}>
        <Card.Content>
          <Title style={styles.cardTitle}>IoT Subjects Management</Title>
          <Paragraph style={styles.infoText}>
            Manage IoT-related subjects for each semester. Only IoT subjects are displayed here.
          </Paragraph>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Subject Name</DataTable.Title>
              <DataTable.Title>Semester</DataTable.Title>
              <DataTable.Title>Lecturer</DataTable.Title>
              <DataTable.Title>Capacity</DataTable.Title>
              <DataTable.Title>Enrolled</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>

            {(iotSubjects || []).map((subject) => (
              <DataTable.Row key={subject.id}>
                <DataTable.Cell>{subject.name}</DataTable.Cell>
                <DataTable.Cell>{subject.semesterName}</DataTable.Cell>
                <DataTable.Cell>{subject.lecturerName}</DataTable.Cell>
                <DataTable.Cell>{subject.capacity}</DataTable.Cell>
                <DataTable.Cell>{subject.enrolledCount}</DataTable.Cell>
                <DataTable.Cell>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.statusChip,
                      { borderColor: getStatusColor(subject.status) }
                    ]}
                    textStyle={{ color: getStatusColor(subject.status) }}
                  >
                    {subject.status}
                  </Chip>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    </View>
  );

  const renderKitsManagement = () => {
    const totalKits = (kits || []).length;
    const availableKits = (kits || []).filter(kit => kit.status === 'AVAILABLE').length;
    const inUseKits = (kits || []).filter(kit => kit.status === 'IN-USE').length;
    const damagedKits = (kits || []).filter(kit => kit.status === 'DAMAGED').length;

    return (
      <View style={styles.tabContent}>
        {/* Kit Statistics */}
        <View style={styles.kitStatsGrid}>
          <Card style={[styles.kitStatCard, shadows.small]}>
            <Card.Content style={styles.kitStatContent}>
              <Title style={styles.kitStatNumber}>{totalKits}</Title>
              <Paragraph style={styles.kitStatLabel}>Total Kits</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.kitStatCard, shadows.small]}>
            <Card.Content style={styles.kitStatContent}>
              <Title style={[styles.kitStatNumber, { color: colors.success }]}>{availableKits}</Title>
              <Paragraph style={styles.kitStatLabel}>Available</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.kitStatCard, shadows.small]}>
            <Card.Content style={styles.kitStatContent}>
              <Title style={[styles.kitStatNumber, { color: colors.warning }]}>{inUseKits}</Title>
              <Paragraph style={styles.kitStatLabel}>In Use</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.kitStatCard, shadows.small]}>
            <Card.Content style={styles.kitStatContent}>
              <Title style={[styles.kitStatNumber, { color: colors.error }]}>{damagedKits}</Title>
              <Paragraph style={styles.kitStatLabel}>Damaged</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <Searchbar
          placeholder="Search kits..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Kits Management</Title>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Kit Name</DataTable.Title>
                <DataTable.Title>Category</DataTable.Title>
                <DataTable.Title>Quantity</DataTable.Title>
                <DataTable.Title>Location</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title>Price</DataTable.Title>
              </DataTable.Header>

              {(kits || []).map((kit) => (
                <DataTable.Row key={kit.id}>
                  <DataTable.Cell>{kit.name}</DataTable.Cell>
                  <DataTable.Cell>{kit.category}</DataTable.Cell>
                  <DataTable.Cell>{kit.quantity}</DataTable.Cell>
                  <DataTable.Cell>{kit.location}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip 
                      mode="outlined" 
                      style={[
                        styles.statusChip,
                        { 
                          borderColor: kit.status === 'AVAILABLE' ? colors.success :
                                      kit.status === 'IN-USE' ? colors.warning :
                                      kit.status === 'DAMAGED' ? colors.error : colors.info
                        }
                      ]}
                      textStyle={{ 
                        color: kit.status === 'AVAILABLE' ? colors.success :
                               kit.status === 'IN-USE' ? colors.warning :
                               kit.status === 'DAMAGED' ? colors.error : colors.info
                      }}
                    >
                      {kit.status}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell>${kit.price}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
            { key: 'semesters', label: 'Semesters', icon: 'book-open-page-variant' },
            { key: 'students', label: 'Students', icon: 'account-group' },
            { key: 'lecturers', label: 'Lecturers', icon: 'school' },
            { key: 'iot-subjects', label: 'IoT Subjects', icon: 'chip' },
            { key: 'kits', label: 'Kits', icon: 'toolbox' }
          ].map((tab) => (
            <Button
              key={tab.key}
              mode={activeTab === tab.key ? 'contained' : 'outlined'}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tabButton}
              labelStyle={styles.tabLabel}
              icon={tab.icon}
            >
              {tab.label}
            </Button>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Paragraph style={styles.loadingText}>Loading data...</Paragraph>
          </View>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'semesters' && renderSemesterManagement()}
            {activeTab === 'students' && renderStudentManagement()}
            {activeTab === 'lecturers' && renderLecturerManagement()}
            {activeTab === 'iot-subjects' && renderIotSubjectsManagement()}
            {activeTab === 'kits' && renderKitsManagement()}
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>Quick Actions</Title>
          <List.Item
            title="Add New Semester"
            left={props => <List.Icon {...props} icon="book-open-page-variant" />}
            onPress={() => setModalVisible(false)}
          />
          <List.Item
            title="Add New Student"
            left={props => <List.Icon {...props} icon="account-plus" />}
            onPress={() => setModalVisible(false)}
          />
          <List.Item
            title="Add New Lecturer"
            left={props => <List.Icon {...props} icon="school" />}
            onPress={() => setModalVisible(false)}
          />
          <List.Item
            title="Add IoT Subject"
            left={props => <List.Icon {...props} icon="chip" />}
            onPress={() => setModalVisible(false)}
          />
          <Divider />
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
  },
  tabContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
  },
  tabButton: {
    marginRight: spacing.sm,
  },
  tabLabel: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  tabContent: {
    gap: spacing.md,
  },
  welcomeCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  welcomeGradient: {
    borderRadius: 16,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body2,
    color: 'rgba(255,255,255,0.8)',
  },
  welcomeIcon: {
    marginLeft: spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
  },
  statGradient: {
    borderRadius: 16,
  },
  statContent: {
    paddingVertical: spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: 'rgba(255,255,255,0.8)',
  },
  statIcon: {
    fontSize: 32,
    opacity: 0.8,
  },
  statSubtext: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  card: {
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchBar: {
    marginBottom: spacing.md,
  },
  statusChip: {
    height: 32,
  },
  infoText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  kitStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kitStatCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.surface,
  },
  kitStatContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  kitStatNumber: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  kitStatLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  modal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 8,
  },
  studentName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  studentEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  lecturerName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  lecturerEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});