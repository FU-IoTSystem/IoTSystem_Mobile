import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, RefreshControl } from 'react-native';
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
  DataTable, 
  Searchbar, 
  ActivityIndicator, 
  Avatar, 
  Badge, 
  Switch,
  TextInput,
  RadioButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '../src/theme';
import { 
  mockSystemStats, 
  mockRentalRequests, 
  mockRefundRequests, 
  mockKits,
  mockStudents,
  mockLecturers,
  demoUsers,
  mockAllUsers,
  mockGroups,
  mockFines,
  mockTransactions,
  mockLogHistory
} from '../mocks';

// Group Form Component
const GroupForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    lecturer: '',
    description: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.lecturer) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <View style={styles.formContainer}>
      <TextInput
        label="Group Name *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        mode="outlined"
        style={styles.formInput}
      />
      
      <TextInput
        label="Lecturer Email *"
        value={formData.lecturer}
        onChangeText={(text) => setFormData({ ...formData, lecturer: text })}
        mode="outlined"
        keyboardType="email-address"
        style={styles.formInput}
      />
      
      <TextInput
        label="Description"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.formInput}
      />
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Automatic Member Assignment</Text>
        <Text style={styles.infoText}>
          When you create a group, the system will automatically assign up to 3 random available students. 
          The first assigned student will become the group leader.
        </Text>
      </View>
      
      <View style={styles.formActions}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Create Group with Random Members
        </Button>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
};

// Group Detail View Component
const GroupDetailView = ({ group, onAddMembers, onAdjustMembers, onDelete, onClose }) => {
  const getLeaderInfo = () => {
    if (!group.leader) return { name: 'No Leader', email: 'Not assigned' };
    return { name: group.leader.split('@')[0], email: group.leader };
  };

  const getLecturerInfo = () => {
    if (!group.lecturer) return { name: 'No Lecturer', email: 'Not assigned' };
    return { name: group.lecturer.split('@')[0], email: group.lecturer };
  };

  const leaderInfo = getLeaderInfo();
  const lecturerInfo = getLecturerInfo();

  return (
    <View style={styles.groupDetailContainer}>
      {/* Group Header */}
      <View style={styles.groupDetailHeader}>
        <Avatar.Text 
          size={80} 
          label={group.name?.charAt(0)?.toUpperCase() || 'G'} 
          style={[styles.groupDetailAvatar, { backgroundColor: colors.primary }]}
        />
        <View style={styles.groupDetailInfo}>
          <Title style={styles.groupDetailName}>{group.name}</Title>
          <Paragraph style={styles.groupDetailDescription}>
            {group.description || 'No description provided'}
          </Paragraph>
          <View style={styles.groupDetailChips}>
            <Chip 
              style={[styles.groupDetailChip, { backgroundColor: colors.info }]}
              textStyle={{ color: 'white' }}
            >
              {group.members?.length || 0} Members
            </Chip>
            <Chip 
              style={[styles.groupDetailChip, { backgroundColor: group.leader ? colors.success : colors.warning }]}
              textStyle={{ color: 'white' }}
            >
              {group.leader ? 'Has Leader' : 'Needs Leader'}
            </Chip>
          </View>
        </View>
      </View>

      <Divider style={styles.groupDetailDivider} />

      {/* Group Information */}
      <View style={styles.groupDetailSection}>
        <Title style={styles.groupDetailSectionTitle}>Group Information</Title>
        
        <View style={styles.groupDetailRow}>
          <Text style={styles.groupDetailLabel}>Group Name:</Text>
          <Text style={styles.groupDetailValue}>{group.name}</Text>
        </View>
        
        <View style={styles.groupDetailRow}>
          <Text style={styles.groupDetailLabel}>Description:</Text>
          <Text style={styles.groupDetailValue}>{group.description || 'Not provided'}</Text>
        </View>
        
        <View style={styles.groupDetailRow}>
          <Text style={styles.groupDetailLabel}>Group ID:</Text>
          <Text style={styles.groupDetailValue}>{group.id}</Text>
        </View>
      </View>

      <Divider style={styles.groupDetailDivider} />

      {/* Leadership Information */}
      <View style={styles.groupDetailSection}>
        <Title style={styles.groupDetailSectionTitle}>Leadership</Title>
        
        <View style={styles.groupDetailRow}>
          <Text style={styles.groupDetailLabel}>Leader:</Text>
          <Text style={styles.groupDetailValue}>{leaderInfo.name}</Text>
        </View>
        
        <View style={styles.groupDetailRow}>
          <Text style={styles.groupDetailLabel}>Leader Email:</Text>
          <Text style={styles.groupDetailValue}>{leaderInfo.email}</Text>
        </View>
        
        <View style={styles.groupDetailRow}>
          <Text style={styles.groupDetailLabel}>Lecturer:</Text>
          <Text style={styles.groupDetailValue}>{lecturerInfo.name}</Text>
        </View>
        
        <View style={styles.groupDetailRow}>
          <Text style={styles.groupDetailLabel}>Lecturer Email:</Text>
          <Text style={styles.groupDetailValue}>{lecturerInfo.email}</Text>
        </View>
      </View>

      <Divider style={styles.groupDetailDivider} />

      {/* Members Information */}
      <View style={styles.groupDetailSection}>
        <Title style={styles.groupDetailSectionTitle}>Members ({group.members?.length || 0})</Title>
        
        {group.members && group.members.length > 0 ? (
          group.members.map((member, index) => (
            <View key={index} style={styles.memberRow}>
              <Avatar.Text 
                size={40} 
                label={member.split('@')[0].charAt(0).toUpperCase()} 
                style={[styles.memberAvatar, { backgroundColor: colors.secondary }]}
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.split('@')[0]}</Text>
                <Text style={styles.memberEmail}>{member}</Text>
              </View>
              {member === group.leader && (
                <Chip 
                  style={[styles.leaderChip, { backgroundColor: colors.success }]}
                  textStyle={{ color: 'white' }}
                >
                  Leader
                </Chip>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noMembersText}>No members assigned to this group</Text>
        )}
      </View>

      <Divider style={styles.groupDetailDivider} />

      {/* Action Buttons */}
      <View style={styles.groupDetailActions}>
        <Button
          mode="contained"
          icon="account-plus"
          onPress={onAddMembers}
          style={[styles.groupDetailActionButton, { backgroundColor: colors.success }]}
          labelStyle={{ color: 'white' }}
        >
          Add Random Members
        </Button>
        
        <Button
          mode="contained"
          icon="account-edit"
          onPress={onAdjustMembers}
          style={[styles.groupDetailActionButton, { backgroundColor: colors.primary }]}
          labelStyle={{ color: 'white' }}
        >
          Adjust Members
        </Button>
        
        <Button
          mode="outlined"
          icon="delete"
          onPress={onDelete}
          style={[styles.groupDetailActionButton, { borderColor: colors.error }]}
          textColor={colors.error}
        >
          Delete Group
        </Button>
        
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.groupDetailActionButton}
        >
          Close
        </Button>
      </View>
    </View>
  );
};

// Group Members Form Component
const GroupMembersForm = ({ group, students, selectedStudents, setSelectedStudents, onSave, onCancel }) => {
  const availableStudents = (students || []).filter(student => 
    !selectedStudents.includes(student.email)
  );

  const toggleStudent = (studentEmail) => {
    if (selectedStudents.includes(studentEmail)) {
      setSelectedStudents(prev => prev.filter(email => email !== studentEmail));
    } else {
      setSelectedStudents(prev => [...prev, studentEmail]);
    }
  };

  return (
    <View style={styles.groupMembersContainer}>
      <Text style={styles.groupMembersInfo}>
        Select students to add to {group.name}. Currently selected: {selectedStudents.length} students.
      </Text>

      <Title style={styles.groupMembersSectionTitle}>Available Students</Title>
      <ScrollView style={styles.studentsList} showsVerticalScrollIndicator={false}>
        {availableStudents.map((student) => (
          <View key={student.id} style={styles.studentItem}>
            <Avatar.Text 
              size={40} 
              label={student.name?.charAt(0)?.toUpperCase() || 'S'} 
              style={[styles.studentAvatar, { backgroundColor: colors.secondary }]}
            />
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentEmail}>{student.email}</Text>
            </View>
            <Button
              mode={selectedStudents.includes(student.email) ? "contained" : "outlined"}
              onPress={() => toggleStudent(student.email)}
              style={styles.studentToggleButton}
            >
              {selectedStudents.includes(student.email) ? 'Remove' : 'Add'}
            </Button>
          </View>
        ))}
      </ScrollView>

      <Title style={styles.groupMembersSectionTitle}>Selected Members</Title>
      <View style={styles.selectedMembersContainer}>
        {selectedStudents.length > 0 ? (
          selectedStudents.map((email, index) => {
            const student = (students || []).find(s => s.email === email);
            return (
              <Chip 
                key={index}
                mode="outlined"
                onClose={() => toggleStudent(email)}
                style={styles.selectedMemberChip}
              >
                {student ? student.name : email.split('@')[0]}
              </Chip>
            );
          })
        ) : (
          <Text style={styles.noSelectedText}>No members selected</Text>
        )}
      </View>

      <View style={styles.groupMembersActions}>
        <Button
          mode="contained"
          onPress={onSave}
          style={styles.submitButton}
        >
          Save Members
        </Button>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
};

// Transaction History Management
const renderTransactionHistory = (searchQuery, setSearchQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter, transactions, setSelectedTransaction, setShowTransactionDetailModal) => {

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'RENTAL_PAYMENT':
        return colors.primary;
      case 'FINE_PAYMENT':
        return colors.error;
      case 'DAMAGE_FINE':
        return colors.warning;
      case 'REFUND':
        return colors.success;
      case 'DEPOSIT':
        return colors.secondary;
      default:
        return colors.text;
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'RENTAL_PAYMENT':
        return '🛒';
      case 'FINE_PAYMENT':
        return '💰';
      case 'DAMAGE_FINE':
        return '⚠️';
      case 'REFUND':
        return '↩️';
      case 'DEPOSIT':
        return '➕';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'FAILED':
        return colors.error;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '✓';
      case 'PENDING':
        return '⏳';
      case 'FAILED':
        return '✗';
      default:
        return '?';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  const handleShowTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetailModal(true);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalAmount = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const completedTransactions = filteredTransactions.filter(txn => txn.status === 'COMPLETED');
  const pendingTransactions = filteredTransactions.filter(txn => txn.status === 'PENDING');
  const failedTransactions = filteredTransactions.filter(txn => txn.status === 'FAILED');

  return (
    <View style={styles.container}>
      {/* Statistics Cards */}
      <View style={styles.transactionStatsGrid}>
        <Card style={styles.transactionStatCard}>
          <View style={styles.transactionStatContent}>
            <Title style={styles.transactionStatNumber}>{filteredTransactions.length}</Title>
            <Paragraph style={styles.transactionStatLabel}>Total Transactions</Paragraph>
          </View>
        </Card>
        
        <Card style={styles.transactionStatCard}>
          <View style={styles.transactionStatContent}>
            <Title style={[styles.transactionStatNumber, { color: totalAmount >= 0 ? colors.success : colors.error }]}>
              {formatAmount(totalAmount)}
            </Title>
            <Paragraph style={styles.transactionStatLabel}>Total Amount</Paragraph>
          </View>
        </Card>
        
        <Card style={styles.transactionStatCard}>
          <View style={styles.transactionStatContent}>
            <Title style={[styles.transactionStatNumber, { color: colors.success }]}>{completedTransactions.length}</Title>
            <Paragraph style={styles.transactionStatLabel}>Completed</Paragraph>
          </View>
        </Card>
        
        <Card style={styles.transactionStatCard}>
          <View style={styles.transactionStatContent}>
            <Title style={[styles.transactionStatNumber, { color: colors.warning }]}>{pendingTransactions.length}</Title>
            <Paragraph style={styles.transactionStatLabel}>Pending</Paragraph>
          </View>
        </Card>
      </View>

      {/* Financial Summary */}
      <Card style={styles.financialSummary}>
        <Title style={styles.financialTitle}>Financial Summary</Title>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Total Revenue:</Text>
          <Text style={[styles.financialValue, { color: colors.success }]}>
            {formatAmount(completedTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0))}
          </Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Total Refunds:</Text>
          <Text style={[styles.financialValue, { color: colors.error }]}>
            {formatAmount(completedTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0))}
          </Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Net Income:</Text>
          <Text style={[styles.financialValue, { color: totalAmount >= 0 ? colors.success : colors.error }]}>
            {formatAmount(totalAmount)}
          </Text>
        </View>
      </Card>

      {/* Filters */}
      <Card style={styles.filterCard}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterRow}>
          <Chip
            selected={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
            style={styles.filterChip}
          >
            All Status
          </Chip>
          <Chip
            selected={statusFilter === 'COMPLETED'}
            onPress={() => setStatusFilter('COMPLETED')}
            style={styles.filterChip}
          >
            Completed
          </Chip>
          <Chip
            selected={statusFilter === 'PENDING'}
            onPress={() => setStatusFilter('PENDING')}
            style={styles.filterChip}
          >
            Pending
          </Chip>
          <Chip
            selected={statusFilter === 'FAILED'}
            onPress={() => setStatusFilter('FAILED')}
            style={styles.filterChip}
          >
            Failed
          </Chip>
        </View>

        <View style={styles.filterRow}>
          <Chip
            selected={typeFilter === 'all'}
            onPress={() => setTypeFilter('all')}
            style={styles.filterChip}
          >
            All Types
          </Chip>
          <Chip
            selected={typeFilter === 'RENTAL_PAYMENT'}
            onPress={() => setTypeFilter('RENTAL_PAYMENT')}
            style={styles.filterChip}
          >
            Rental
          </Chip>
          <Chip
            selected={typeFilter === 'FINE_PAYMENT'}
            onPress={() => setTypeFilter('FINE_PAYMENT')}
            style={styles.filterChip}
          >
            Fine
          </Chip>
          <Chip
            selected={typeFilter === 'REFUND'}
            onPress={() => setTypeFilter('REFUND')}
            style={styles.filterChip}
          >
            Refund
          </Chip>
        </View>
      </Card>

      {/* Transaction Type Legend */}
      <Card style={styles.legendCard}>
        <Title style={styles.legendTitle}>Transaction Type Legend</Title>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🛒</Text>
            <Text style={styles.legendText}>Rental Payment</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>💰</Text>
            <Text style={styles.legendText}>Fine Payment</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>⚠️</Text>
            <Text style={styles.legendText}>Damage Fine</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>↩️</Text>
            <Text style={styles.legendText}>Refund</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>➕</Text>
            <Text style={styles.legendText}>Deposit</Text>
          </View>
        </View>
      </Card>

      {/* Transactions Table */}
      <Card style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Transaction ID</DataTable.Title>
            <DataTable.Title>User</DataTable.Title>
            <DataTable.Title>Type</DataTable.Title>
            <DataTable.Title>Amount</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {filteredTransactions.map((transaction) => (
            <DataTable.Row key={transaction.id}>
              <DataTable.Cell style={styles.tableCell}>
                <Text style={styles.transactionIdText}>#{transaction.transactionId}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <View style={styles.userInfo}>
                  <Text style={styles.userNameText}>{transaction.userName}</Text>
                  <Text style={styles.userEmailText}>{transaction.userEmail}</Text>
                  <Chip style={styles.roleChip} textStyle={styles.roleChipText}>
                    {transaction.userRole}
                  </Chip>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <View style={styles.typeContainer}>
                  <Text style={styles.typeIcon}>{getTransactionTypeIcon(transaction.type)}</Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <Text style={[
                  styles.amountText, 
                  { color: transaction.amount >= 0 ? colors.success : colors.error }
                ]}>
                  {formatAmount(transaction.amount)}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusIcon, { color: getStatusColor(transaction.status) }]}>
                    {getStatusIcon(transaction.status)}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <Text style={styles.dateText}>{formatDateTime(transaction.transactionDate)}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <Button
                  mode="outlined"
                  onPress={() => handleShowTransactionDetails(transaction)}
                  style={styles.detailButton}
                  labelStyle={styles.detailButtonText}
                >
                  Detail
                </Button>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </View>
  );
};

// Log History Management
const renderLogHistory = (searchQuery, setSearchQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter, logHistory, setSelectedLog, setShowLogDetailModal) => {

  const getActionIcon = (action) => {
    switch (action) {
      case 'RENTAL_REQUEST_BORROWED':
        return '📦';
      case 'RENTAL_REQUEST_RETURNED':
        return '✅';
      case 'REFUND_REQUEST_REJECTED':
        return '❌';
      case 'REFUND_REQUEST_RETURNED':
        return '✅';
      case 'FINE_PAID':
        return '💰';
      case 'USER_CREATED':
        return '👤';
      case 'KIT_MAINTENANCE':
        return '🔧';
      case 'GROUP_CREATED':
        return '👥';
      default:
        return '📄';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'RENTAL_REQUEST_BORROWED':
        return colors.primary;
      case 'RENTAL_REQUEST_RETURNED':
        return colors.success;
      case 'REFUND_REQUEST_REJECTED':
        return colors.error;
      case 'REFUND_REQUEST_RETURNED':
        return colors.success;
      case 'FINE_PAID':
        return colors.success;
      case 'USER_CREATED':
        return colors.secondary;
      case 'KIT_MAINTENANCE':
        return colors.warning;
      case 'GROUP_CREATED':
        return colors.secondary;
      default:
        return colors.text;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BORROWED':
        return colors.primary;
      case 'RETURNED':
        return colors.success;
      case 'REJECTED':
        return colors.error;
      case 'PAID':
        return colors.success;
      case 'SUCCESS':
        return colors.success;
      case 'COMPLETED':
        return colors.success;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'BORROWED':
        return '📦';
      case 'RETURNED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'PAID':
        return '💰';
      case 'SUCCESS':
        return '✅';
      case 'COMPLETED':
        return '✅';
      default:
        return '?';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const handleShowLogDetails = (log) => {
    setSelectedLog(log);
    setShowLogDetailModal(true);
  };

  const filteredLogs = logHistory.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.kitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.requestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalLogs = filteredLogs.length;
  const rentalLogs = filteredLogs.filter(log => log.type === 'rental').length;
  const refundLogs = filteredLogs.filter(log => log.type === 'refund').length;
  const fineLogs = filteredLogs.filter(log => log.type === 'fine').length;
  const userLogs = filteredLogs.filter(log => log.type === 'user').length;
  const kitLogs = filteredLogs.filter(log => log.type === 'kit').length;
  const groupLogs = filteredLogs.filter(log => log.type === 'group').length;

  return (
    <View style={styles.container}>
      {/* Statistics Cards */}
      <View style={styles.logStatsGrid}>
        <Card style={styles.logStatCard}>
          <View style={styles.logStatContent}>
            <Title style={styles.logStatNumber}>{totalLogs}</Title>
            <Paragraph style={styles.logStatLabel}>Total Logs</Paragraph>
          </View>
        </Card>
        
        <Card style={styles.logStatCard}>
          <View style={styles.logStatContent}>
            <Title style={[styles.logStatNumber, { color: colors.primary }]}>{rentalLogs}</Title>
            <Paragraph style={styles.logStatLabel}>Rental Logs</Paragraph>
          </View>
        </Card>
        
        <Card style={styles.logStatCard}>
          <View style={styles.logStatContent}>
            <Title style={[styles.logStatNumber, { color: colors.warning }]}>{refundLogs}</Title>
            <Paragraph style={styles.logStatLabel}>Refund Logs</Paragraph>
          </View>
        </Card>
        
        <Card style={styles.logStatCard}>
          <View style={styles.logStatContent}>
            <Title style={[styles.logStatNumber, { color: colors.success }]}>{fineLogs}</Title>
            <Paragraph style={styles.logStatLabel}>Fine Logs</Paragraph>
          </View>
        </Card>
      </View>

      {/* Activity Summary */}
      <Card style={styles.activitySummary}>
        <Title style={styles.activityTitle}>Activity Summary</Title>
        <View style={styles.activityRow}>
          <Text style={styles.activityLabel}>User Management:</Text>
          <Text style={[styles.activityValue, { color: colors.secondary }]}>{userLogs}</Text>
        </View>
        <View style={styles.activityRow}>
          <Text style={styles.activityLabel}>Kit Management:</Text>
          <Text style={[styles.activityValue, { color: colors.warning }]}>{kitLogs}</Text>
        </View>
        <View style={styles.activityRow}>
          <Text style={styles.activityLabel}>Group Management:</Text>
          <Text style={[styles.activityValue, { color: colors.secondary }]}>{groupLogs}</Text>
        </View>
      </Card>

      {/* Filters */}
      <Card style={styles.filterCard}>
        <Searchbar
          placeholder="Search logs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterRow}>
          <Chip
            selected={statusFilter === 'all'}
            onPress={() => setStatusFilter('all')}
            style={styles.filterChip}
          >
            All Status
          </Chip>
          <Chip
            selected={statusFilter === 'BORROWED'}
            onPress={() => setStatusFilter('BORROWED')}
            style={styles.filterChip}
          >
            Borrowed
          </Chip>
          <Chip
            selected={statusFilter === 'RETURNED'}
            onPress={() => setStatusFilter('RETURNED')}
            style={styles.filterChip}
          >
            Returned
          </Chip>
          <Chip
            selected={statusFilter === 'REJECTED'}
            onPress={() => setStatusFilter('REJECTED')}
            style={styles.filterChip}
          >
            Rejected
          </Chip>
          <Chip
            selected={statusFilter === 'SUCCESS'}
            onPress={() => setStatusFilter('SUCCESS')}
            style={styles.filterChip}
          >
            Success
          </Chip>
        </View>

        <View style={styles.filterRow}>
          <Chip
            selected={typeFilter === 'all'}
            onPress={() => setTypeFilter('all')}
            style={styles.filterChip}
          >
            All Types
          </Chip>
          <Chip
            selected={typeFilter === 'rental'}
            onPress={() => setTypeFilter('rental')}
            style={styles.filterChip}
          >
            Rental
          </Chip>
          <Chip
            selected={typeFilter === 'refund'}
            onPress={() => setTypeFilter('refund')}
            style={styles.filterChip}
          >
            Refund
          </Chip>
          <Chip
            selected={typeFilter === 'fine'}
            onPress={() => setTypeFilter('fine')}
            style={styles.filterChip}
          >
            Fine
          </Chip>
          <Chip
            selected={typeFilter === 'user'}
            onPress={() => setTypeFilter('user')}
            style={styles.filterChip}
          >
            User
          </Chip>
        </View>
      </Card>

      {/* Action Type Legend */}
      <Card style={styles.legendCard}>
        <Title style={styles.legendTitle}>Action Type Legend</Title>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>📦</Text>
            <Text style={styles.legendText}>Borrowed</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>✅</Text>
            <Text style={styles.legendText}>Returned</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>❌</Text>
            <Text style={styles.legendText}>Rejected</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>💰</Text>
            <Text style={styles.legendText}>Fine Paid</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>👤</Text>
            <Text style={styles.legendText}>User Created</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>🔧</Text>
            <Text style={styles.legendText}>Maintenance</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendIcon}>👥</Text>
            <Text style={styles.legendText}>Group Created</Text>
          </View>
        </View>
      </Card>

      {/* Logs Table */}
      <Card style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Action</DataTable.Title>
            <DataTable.Title>User</DataTable.Title>
            <DataTable.Title>Kit</DataTable.Title>
            <DataTable.Title>Status</DataTable.Title>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Actions</DataTable.Title>
          </DataTable.Header>

          {filteredLogs.map((log) => (
            <DataTable.Row key={log.id}>
              <DataTable.Cell style={styles.tableCell}>
                <View style={styles.actionContainer}>
                  <Text style={styles.actionIcon}>{getActionIcon(log.action)}</Text>
                  <Text style={styles.actionText}>{log.action.replace(/_/g, ' ')}</Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <View style={styles.userInfo}>
                  <Text style={styles.userNameText}>{log.userName}</Text>
                  <Text style={styles.userEmailText}>{log.user}</Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <Text style={styles.kitNameText}>{log.details.kitName || 'N/A'}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusIcon, { color: getStatusColor(log.status) }]}>
                    {getStatusIcon(log.status)}
                  </Text>
                </View>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <Text style={styles.dateText}>{formatTimestamp(log.timestamp)}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.tableCell}>
                <Button
                  mode="outlined"
                  onPress={() => handleShowLogDetails(log)}
                  style={styles.detailButton}
                  labelStyle={styles.detailButtonText}
                >
                  Detail
                </Button>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </Card>
    </View>
  );
};

// Transaction Detail View Component
const TransactionDetailView = ({ transaction, onClose }) => {
  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'RENTAL_PAYMENT':
        return colors.primary;
      case 'FINE_PAYMENT':
        return colors.error;
      case 'DAMAGE_FINE':
        return colors.warning;
      case 'REFUND':
        return colors.success;
      case 'DEPOSIT':
        return colors.secondary;
      default:
        return colors.text;
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'RENTAL_PAYMENT':
        return '🛒';
      case 'FINE_PAYMENT':
        return '💰';
      case 'DAMAGE_FINE':
        return '⚠️';
      case 'REFUND':
        return '↩️';
      case 'DEPOSIT':
        return '➕';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'FAILED':
        return colors.error;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '✓';
      case 'PENDING':
        return '⏳';
      case 'FAILED':
        return '✗';
      default:
        return '?';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  return (
    <View style={styles.transactionDetailContainer}>
      <View style={styles.transactionDetailHeader}>
        <Avatar.Icon 
          size={60} 
          icon="receipt" 
          style={[styles.transactionDetailAvatar, { backgroundColor: getTransactionTypeColor(transaction.type) }]} 
        />
        <View style={styles.transactionDetailInfo}>
          <Title style={styles.transactionDetailTitle}>Transaction Details</Title>
          <Text style={styles.transactionDetailId}>#{transaction.transactionId}</Text>
        </View>
      </View>

      <Divider style={styles.transactionDetailDivider} />

      <View style={styles.transactionDetailSection}>
        <Title style={styles.transactionDetailSectionTitle}>Transaction Information</Title>
        
        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Type:</Text>
          <View style={styles.transactionDetailValue}>
            <Text style={styles.typeIcon}>{getTransactionTypeIcon(transaction.type)}</Text>
            <Text style={[styles.typeText, { color: getTransactionTypeColor(transaction.type) }]}>
              {transaction.type.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Amount:</Text>
          <Text style={[
            styles.transactionDetailValue, 
            { color: transaction.amount >= 0 ? colors.success : colors.error, fontSize: 18, fontWeight: 'bold' }
          ]}>
            {formatAmount(transaction.amount)}
          </Text>
        </View>

        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Status:</Text>
          <View style={styles.transactionDetailValue}>
            <Text style={[styles.statusIcon, { color: getStatusColor(transaction.status) }]}>
              {getStatusIcon(transaction.status)}
            </Text>
            <Text style={[styles.transactionDetailValue, { color: getStatusColor(transaction.status) }]}>
              {transaction.status}
            </Text>
          </View>
        </View>

        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Date:</Text>
          <Text style={styles.transactionDetailValue}>{formatDateTime(transaction.transactionDate)}</Text>
        </View>

        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Payment Method:</Text>
          <Text style={styles.transactionDetailValue}>{transaction.paymentMethod}</Text>
        </View>

        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Reference:</Text>
          <Text style={styles.transactionDetailValue}>{transaction.reference}</Text>
        </View>
      </View>

      <View style={styles.transactionDetailSection}>
        <Title style={styles.transactionDetailSectionTitle}>User Information</Title>
        
        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Name:</Text>
          <Text style={styles.transactionDetailValue}>{transaction.userName}</Text>
        </View>

        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Email:</Text>
          <Text style={styles.transactionDetailValue}>{transaction.userEmail}</Text>
        </View>

        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Role:</Text>
          <Chip style={styles.roleChip} textStyle={styles.roleChipText}>
            {transaction.userRole}
          </Chip>
        </View>
      </View>

      {transaction.kitName && (
        <View style={styles.transactionDetailSection}>
          <Title style={styles.transactionDetailSectionTitle}>Kit Information</Title>
          
          <View style={styles.transactionDetailRow}>
            <Text style={styles.transactionDetailLabel}>Kit Name:</Text>
            <Text style={styles.transactionDetailValue}>{transaction.kitName}</Text>
          </View>

          <View style={styles.transactionDetailRow}>
            <Text style={styles.transactionDetailLabel}>Kit ID:</Text>
            <Text style={styles.transactionDetailValue}>#{transaction.kitId}</Text>
          </View>
        </View>
      )}

      <View style={styles.transactionDetailSection}>
        <Title style={styles.transactionDetailSectionTitle}>Additional Information</Title>
        
        <View style={styles.transactionDetailRow}>
          <Text style={styles.transactionDetailLabel}>Description:</Text>
          <Text style={styles.transactionDetailValue}>{transaction.description}</Text>
        </View>

        {transaction.notes && (
          <View style={styles.transactionDetailRow}>
            <Text style={styles.transactionDetailLabel}>Notes:</Text>
            <Text style={styles.transactionDetailValue}>{transaction.notes}</Text>
          </View>
        )}

        {transaction.processedBy && (
          <View style={styles.transactionDetailRow}>
            <Text style={styles.transactionDetailLabel}>Processed By:</Text>
            <Text style={styles.transactionDetailValue}>{transaction.processedBy}</Text>
          </View>
        )}
      </View>

      <View style={styles.transactionDetailActions}>
        <Button
          mode="contained"
          onPress={onClose}
          style={styles.transactionDetailActionButton}
        >
          Close
        </Button>
      </View>
    </View>
  );
};

// Log Detail View Component
const LogDetailView = ({ log, onClose }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'RENTAL_REQUEST_BORROWED':
        return '📦';
      case 'RENTAL_REQUEST_RETURNED':
        return '✅';
      case 'REFUND_REQUEST_REJECTED':
        return '❌';
      case 'REFUND_REQUEST_RETURNED':
        return '✅';
      case 'FINE_PAID':
        return '💰';
      case 'USER_CREATED':
        return '👤';
      case 'KIT_MAINTENANCE':
        return '🔧';
      case 'GROUP_CREATED':
        return '👥';
      default:
        return '📄';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'RENTAL_REQUEST_BORROWED':
        return colors.primary;
      case 'RENTAL_REQUEST_RETURNED':
        return colors.success;
      case 'REFUND_REQUEST_REJECTED':
        return colors.error;
      case 'REFUND_REQUEST_RETURNED':
        return colors.success;
      case 'FINE_PAID':
        return colors.success;
      case 'USER_CREATED':
        return colors.secondary;
      case 'KIT_MAINTENANCE':
        return colors.warning;
      case 'GROUP_CREATED':
        return colors.secondary;
      default:
        return colors.text;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BORROWED':
        return colors.primary;
      case 'RETURNED':
        return colors.success;
      case 'REJECTED':
        return colors.error;
      case 'PAID':
        return colors.success;
      case 'SUCCESS':
        return colors.success;
      case 'COMPLETED':
        return colors.success;
      default:
        return colors.text;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'BORROWED':
        return '📦';
      case 'RETURNED':
        return '✅';
      case 'REJECTED':
        return '❌';
      case 'PAID':
        return '💰';
      case 'SUCCESS':
        return '✅';
      case 'COMPLETED':
        return '✅';
      default:
        return '?';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  return (
    <View style={styles.logDetailContainer}>
      <View style={styles.logDetailHeader}>
        <Avatar.Icon 
          size={60} 
          icon="history" 
          style={[styles.logDetailAvatar, { backgroundColor: getActionColor(log.action) }]} 
        />
        <View style={styles.logDetailInfo}>
          <Title style={styles.logDetailTitle}>Log Details</Title>
          <Text style={styles.logDetailId}>#{log.id}</Text>
        </View>
      </View>

      <Divider style={styles.logDetailDivider} />

      <View style={styles.logDetailSection}>
        <Title style={styles.logDetailSectionTitle}>Action Information</Title>
        
        <View style={styles.logDetailRow}>
          <Text style={styles.logDetailLabel}>Action:</Text>
          <View style={styles.logDetailValue}>
            <Text style={styles.actionIcon}>{getActionIcon(log.action)}</Text>
            <Text style={[styles.logDetailValue, { color: getActionColor(log.action) }]}>
              {log.action.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.logDetailRow}>
          <Text style={styles.logDetailLabel}>Type:</Text>
          <Chip style={styles.typeChip} textStyle={styles.typeChipText}>
            {log.type}
          </Chip>
        </View>

        <View style={styles.logDetailRow}>
          <Text style={styles.logDetailLabel}>Status:</Text>
          <View style={styles.logDetailValue}>
            <Text style={[styles.statusIcon, { color: getStatusColor(log.status) }]}>
              {getStatusIcon(log.status)}
            </Text>
            <Text style={[styles.logDetailValue, { color: getStatusColor(log.status) }]}>
              {log.status}
            </Text>
          </View>
        </View>

        <View style={styles.logDetailRow}>
          <Text style={styles.logDetailLabel}>Timestamp:</Text>
          <Text style={styles.logDetailValue}>{formatTimestamp(log.timestamp)}</Text>
        </View>
      </View>

      <View style={styles.logDetailSection}>
        <Title style={styles.logDetailSectionTitle}>User Information</Title>
        
        <View style={styles.logDetailRow}>
          <Text style={styles.logDetailLabel}>Name:</Text>
          <Text style={styles.logDetailValue}>{log.userName}</Text>
        </View>

        <View style={styles.logDetailRow}>
          <Text style={styles.logDetailLabel}>Email:</Text>
          <Text style={styles.logDetailValue}>{log.user}</Text>
        </View>
      </View>

      {log.details.kitName && (
        <View style={styles.logDetailSection}>
          <Title style={styles.logDetailSectionTitle}>Kit Information</Title>
          
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Kit Name:</Text>
            <Text style={styles.logDetailValue}>{log.details.kitName}</Text>
          </View>

          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Kit ID:</Text>
            <Text style={styles.logDetailValue}>{log.details.kitId}</Text>
          </View>

          {log.details.requestId && (
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailLabel}>Request ID:</Text>
              <Text style={styles.logDetailValue}>{log.details.requestId}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.logDetailSection}>
        <Title style={styles.logDetailSectionTitle}>Action Details</Title>
        
        {log.details.reason && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Reason:</Text>
            <Text style={styles.logDetailValue}>{log.details.reason}</Text>
          </View>
        )}

        {log.details.duration && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Duration:</Text>
            <Text style={styles.logDetailValue}>{log.details.duration}</Text>
          </View>
        )}

        {log.details.damageDescription && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Damage Description:</Text>
            <Text style={styles.logDetailValue}>{log.details.damageDescription}</Text>
          </View>
        )}

        {log.details.fineAmount && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Fine Amount:</Text>
            <Text style={[styles.logDetailValue, { color: colors.error, fontWeight: 'bold' }]}>
              {log.details.fineAmount.toLocaleString()} VND
            </Text>
          </View>
        )}

        {log.details.returnNotes && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Return Notes:</Text>
            <Text style={styles.logDetailValue}>{log.details.returnNotes}</Text>
          </View>
        )}

        {log.details.rejectionReason && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Rejection Reason:</Text>
            <Text style={styles.logDetailValue}>{log.details.rejectionReason}</Text>
          </View>
        )}

        {log.details.newUserName && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>New User:</Text>
            <Text style={styles.logDetailValue}>{log.details.newUserName} ({log.details.newUserEmail})</Text>
          </View>
        )}

        {log.details.groupName && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Group Name:</Text>
            <Text style={styles.logDetailValue}>{log.details.groupName}</Text>
          </View>
        )}

        {log.details.maintenanceNotes && (
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Maintenance Notes:</Text>
            <Text style={styles.logDetailValue}>{log.details.maintenanceNotes}</Text>
          </View>
        )}
      </View>

      {log.adminAction && (
        <View style={styles.logDetailSection}>
          <Title style={styles.logDetailSectionTitle}>Admin Information</Title>
          
          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Admin Action:</Text>
            <Chip style={[styles.adminChip, { backgroundColor: log.adminAction === 'approved' ? colors.success : colors.error }]} 
                  textStyle={styles.adminChipText}>
              {log.adminAction.toUpperCase()}
            </Chip>
          </View>

          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Admin User:</Text>
            <Text style={styles.logDetailValue}>{log.adminUser}</Text>
          </View>

          <View style={styles.logDetailRow}>
            <Text style={styles.logDetailLabel}>Admin Timestamp:</Text>
            <Text style={styles.logDetailValue}>{formatTimestamp(log.adminTimestamp)}</Text>
          </View>
        </View>
      )}

      <View style={styles.logDetailActions}>
        <Button
          mode="contained"
          onPress={onClose}
          style={styles.logDetailActionButton}
        >
          Close
        </Button>
      </View>
    </View>
  );
};

export default function AdminScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKit, setSelectedKit] = useState(null);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEditMode, setUserEditMode] = useState('edit'); // 'edit' or 'role'
  
  // Group management states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Fine management states
  const [showFineDetailModal, setShowFineDetailModal] = useState(false);
  const [showTransactionDetailModal, setShowTransactionDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Transaction history states
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  
  // Log history states
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [showLogDetailModal, setShowLogDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedFine, setSelectedFine] = useState(null);
  
  // Data states
  const [kits, setKits] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [fines, setFines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logHistory, setLogHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data
      setKits(mockKits);
      setStudents(mockStudents);
      setLecturers(mockLecturers);
      setGroups(mockGroups);
      setFines(mockFines);
      setTransactions(mockTransactions);
      setLogHistory(mockLogHistory);
      
      // Use comprehensive user mocks
      setUsers(mockAllUsers);
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

  const handleKitAction = (kit, action) => {
    setSelectedKit(kit);
    setShowKitModal(true);
  };

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleKitStatusChange = (kitId, newStatus) => {
    setKits(prevKits => 
      prevKits.map(kit => 
        kit.id === kitId ? { ...kit, status: newStatus } : kit
      )
    );
    setShowKitModal(false);
    Alert.alert('Success', `Kit status updated to ${newStatus}`);
  };

  const handleUserStatusChange = (userId, newStatus) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
    setShowUserModal(false);
    Alert.alert('Success', `User status updated to ${newStatus}`);
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            Alert.alert('Success', 'User deleted successfully');
          },
        },
      ]
    );
  };

  const handleAddEditUser = (userData) => {
    if (selectedUser) {
      // Edit existing user
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? { ...user, ...userData } : user
        )
      );
      Alert.alert('Success', 'User updated successfully');
    } else {
      // Add new user
      const newUser = {
        id: Date.now(),
        ...userData,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString().split('T')[0],
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
      Alert.alert('Success', 'User created successfully');
    }
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (userData) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === selectedUser.id ? { ...user, ...userData } : user
      )
    );
    setShowUserModal(false);
    setSelectedUser(null);
    setUserEditMode('edit');
    Alert.alert('Success', 'User information updated successfully');
  };

  const handleEditUserRole = (userData) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === selectedUser.id ? { ...user, ...userData } : user
      )
    );
    Alert.alert('Success', 'User role updated successfully');
    setShowUserModal(false);
    setSelectedUser(null);
    setUserEditMode('edit');
  };

  const handleAddKit = (kitData) => {
    const newKit = {
      id: Date.now(),
      ...kitData,
      status: 'AVAILABLE',
      components: []
    };
    setKits(prevKits => [...prevKits, newKit]);
    Alert.alert('Success', 'Kit created successfully');
    setShowKitModal(false);
    setSelectedKit(null);
  };

  const handleKitRename = (newName) => {
    setKits(prevKits => 
      prevKits.map(kit => 
        kit.id === selectedKit.id ? { ...kit, name: newName } : kit
      )
    );
    Alert.alert('Success', 'Kit renamed successfully');
    setShowKitModal(false);
    setSelectedKit(null);
  };

  const handleManageComponents = (components) => {
    setKits(prevKits => 
      prevKits.map(kit => 
        kit.id === selectedKit.id ? { ...kit, components: components } : kit
      )
    );
    Alert.alert('Success', 'Kit components updated successfully');
    setShowKitModal(false);
    setSelectedKit(null);
  };

  const handleKitCategoryChange = (newCategory) => {
    setKits(prevKits => 
      prevKits.map(kit => 
        kit.id === selectedKit.id ? { ...kit, category: newCategory } : kit
      )
    );
    Alert.alert('Success', 'Kit category updated successfully');
    setShowKitModal(false);
    setSelectedKit(null);
  };

  // Group Management Functions
  const generateRandomStudents = (groupId, count = 3) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    // Get students not already in this group or any other group
    const availableStudentsForGroup = (students || []).filter(student => 
      !groups.some(g => 
        g.members && 
        g.members.includes(student.email)
      )
    );
    
    if (availableStudentsForGroup.length === 0) {
      Alert.alert('No Available Students', 'All students are already assigned to groups');
      return;
    }
    
    const shuffled = availableStudentsForGroup.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(count, availableStudentsForGroup.length));
    const selectedEmails = selected.map(student => student.email);
    
    setGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, members: [...(g.members || []), ...selectedEmails] }
        : g
    ));
    
    Alert.alert('Success', `${selectedEmails.length} additional students randomly assigned to the group`);
  };

  const adjustGroupMembers = (group) => {
    setSelectedGroup(group);
    setSelectedStudents(group.members || []);
    setShowGroupMembersModal(true);
  };

  const saveGroupMembers = () => {
    setGroups(prev => prev.map(group => 
      group.id === selectedGroup.id 
        ? { ...group, members: selectedStudents }
        : group
    ));
    
    setShowGroupMembersModal(false);
    setSelectedGroup(null);
    setSelectedStudents([]);
    
    Alert.alert('Success', 'Group members updated successfully');
  };

  const handleCreateGroup = (groupData) => {
    // Get available students for random assignment
    const availableStudentsForGroup = (students || []).filter(student => 
      !groups.some(group => 
        group.members && 
        group.members.includes(student.email)
      )
    );
    
    let newGroup = {
      id: Date.now(),
      ...groupData,
      members: []
    };
    
    // If there are available students, assign them randomly
    if (availableStudentsForGroup.length > 0) {
      const shuffled = availableStudentsForGroup.sort(() => 0.5 - Math.random());
      const selectedCount = Math.min(3, availableStudentsForGroup.length); // Assign up to 3 students
      const selectedStudents = shuffled.slice(0, selectedCount);
      const selectedEmails = selectedStudents.map(student => student.email);
      
      // First student becomes the leader
      const leaderEmail = selectedEmails[0];
      
      newGroup = {
        ...newGroup,
        leader: leaderEmail,
        members: selectedEmails
      };
      
      setGroups(prev => [...prev, newGroup]);
      
      Alert.alert('Success', `Group created with ${selectedEmails.length} random members. ${selectedStudents[0].name} assigned as leader.`);
    } else {
      // No available students, create group without members
      setGroups(prev => [...prev, newGroup]);
      Alert.alert('Warning', 'Group created successfully, but no students are available for assignment.');
    }
    
    setShowGroupModal(false);
  };

  const handleDeleteGroup = (groupId) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGroups(prev => prev.filter(group => group.id !== groupId));
            Alert.alert('Success', 'Group deleted successfully');
          },
        },
      ]
    );
  };

  // Fine Management Functions
  const handleMarkAsPaid = (fineId) => {
    const fine = fines.find(f => f.id === fineId);
    
    setFines(prev => prev.map(f => 
      f.id === fineId 
        ? { ...f, status: 'paid', paidDate: new Date().toISOString() }
        : f
    ));
    
    Alert.alert('Success', 'Fine marked as paid successfully');
  };

  const handleShowFineDetails = (fine) => {
    setSelectedFine(fine);
    setShowFineDetailModal(true);
  };

  const renderDashboard = () => {
    if (!mockSystemStats) {
      return (
        <View style={styles.tabContent}>
          <Card style={[styles.card, shadows.medium]}>
            <Card.Content>
              <Title>Loading Dashboard...</Title>
              <Paragraph>Please wait while we load the dashboard data.</Paragraph>
            </Card.Content>
          </Card>
        </View>
      );
    }

  return (
      <View style={styles.tabContent}>
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, shadows.small]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{mockSystemStats.totalUsers || 0}</Title>
              <Paragraph style={styles.statLabel}>Total Users</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, shadows.small]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{mockSystemStats.totalKits || 0}</Title>
              <Paragraph style={styles.statLabel}>Total Kits</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, shadows.small]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{mockSystemStats.activeRentals || 0}</Title>
              <Paragraph style={styles.statLabel}>Active Rentals</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, shadows.small]}>
            <Card.Content style={styles.statContent}>
              <Title style={styles.statNumber}>{mockSystemStats.pendingApprovals || 0}</Title>
              <Paragraph style={styles.statLabel}>Pending Approvals</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <Title style={styles.cardTitle}>Recent Activity</Title>
            {mockSystemStats.recentActivity && mockSystemStats.recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Paragraph style={styles.activityText}>
                  <Text style={styles.activityUser}>{activity.user}</Text> - {activity.action}
                </Paragraph>
                <Paragraph style={styles.activityTime}>{activity.time}</Paragraph>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderRentalRequests = () => (
    <View style={styles.tabContent}>
      {mockRentalRequests.map((request) => (
        <Card key={request.id} style={[styles.card, shadows.medium]}>
          <Card.Content>
            <View style={styles.requestHeader}>
              <Title style={styles.requestTitle}>{request.kitName}</Title>
              <Chip 
                mode="outlined" 
                style={[
                  styles.statusChip,
                  { borderColor: request.status === 'APPROVED' ? colors.success : colors.warning }
                ]}
                textStyle={{ color: request.status === 'APPROVED' ? colors.success : colors.warning }}
              >
                {request.status}
              </Chip>
            </View>
            <Paragraph style={styles.requestInfo}>
              User: {request.userName} ({request.userEmail})
            </Paragraph>
            <Paragraph style={styles.requestInfo}>
              Duration: {request.duration} days
            </Paragraph>
            <Paragraph style={styles.requestInfo}>
              Cost: {request.totalCost.toLocaleString()} VND
            </Paragraph>
            <Paragraph style={styles.requestInfo}>
              Purpose: {request.purpose}
            </Paragraph>
            {request.status === 'PENDING_APPROVAL' && (
              <View style={styles.buttonRow}>
                <Button mode="contained" style={styles.approveButton}>
                  Approve
                </Button>
                <Button mode="outlined" style={styles.rejectButton}>
                  Reject
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderRefundRequests = () => (
    <View style={styles.tabContent}>
      {mockRefundRequests.map((request) => (
        <Card key={request.id} style={[styles.card, shadows.medium]}>
          <Card.Content>
            <View style={styles.requestHeader}>
              <Title style={styles.requestTitle}>{request.kitName}</Title>
              <Chip 
                mode="outlined" 
                style={[
                  styles.statusChip,
                  { borderColor: request.status === 'approved' ? colors.success : colors.warning }
                ]}
                textStyle={{ color: request.status === 'approved' ? colors.success : colors.warning }}
              >
                {request.status}
              </Chip>
            </View>
            <Paragraph style={styles.requestInfo}>
              User: {request.userEmail}
            </Paragraph>
            <Paragraph style={styles.requestInfo}>
              Original Amount: {request.originalAmount.toLocaleString()} VND
            </Paragraph>
            <Paragraph style={styles.requestInfo}>
              Refund Amount: {request.refundAmount.toLocaleString()} VND
            </Paragraph>
            <Paragraph style={styles.requestInfo}>
              Reason: {request.refundReason}
            </Paragraph>
            {request.status === 'pending' && (
              <View style={styles.buttonRow}>
                <Button mode="contained" style={styles.approveButton}>
                  Approve Refund
                </Button>
                <Button mode="outlined" style={styles.rejectButton}>
                  Reject
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderUserManagement = () => {
    const filteredUsers = users.filter(user => 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // User statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const inactiveUsers = users.filter(user => user.status === 'inactive').length;
    const suspendedUsers = users.filter(user => user.status === 'suspended').length;

    return (
      <View style={styles.tabContent}>
        {/* User Statistics */}
        <View style={styles.userStatsGrid}>
          <Card style={[styles.userStatCard, shadows.small]}>
            <Card.Content style={styles.userStatContent}>
              <Title style={styles.userStatNumber}>{totalUsers}</Title>
              <Paragraph style={styles.userStatLabel}>Total Users</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.userStatCard, shadows.small]}>
            <Card.Content style={styles.userStatContent}>
              <Title style={[styles.userStatNumber, { color: colors.success }]}>{activeUsers}</Title>
              <Paragraph style={styles.userStatLabel}>Active</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.userStatCard, shadows.small]}>
            <Card.Content style={styles.userStatContent}>
              <Title style={[styles.userStatNumber, { color: colors.error }]}>{inactiveUsers}</Title>
              <Paragraph style={styles.userStatLabel}>Inactive</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.userStatCard, shadows.small]}>
            <Card.Content style={styles.userStatContent}>
              <Title style={[styles.userStatNumber, { color: colors.warning }]}>{suspendedUsers}</Title>
              <Paragraph style={styles.userStatLabel}>Suspended</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <Searchbar
          placeholder="Search users by name, email, or role..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>User Management</Title>
              <Button 
                mode="contained" 
                icon="plus"
                onPress={() => {
                  setSelectedUser(null);
                  setShowUserModal(true);
                }}
              >
                Add User
              </Button>
            </View>
            
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={styles.tableHeader}>User Info</DataTable.Title>
                <DataTable.Title style={styles.tableHeader}>Role</DataTable.Title>
                <DataTable.Title style={styles.tableHeader}>Status</DataTable.Title>
                <DataTable.Title style={styles.tableHeader}>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredUsers.map((user) => (
                <DataTable.Row key={user.id || user.email}>
                  <DataTable.Cell style={styles.tableCell}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                        {user.name || user.email}
                      </Text>
                      <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="tail">
                        {user.email}
                      </Text>
                      <Text style={styles.userDepartment} numberOfLines={1} ellipsizeMode="tail">
                        {user.department || 'N/A'}
                      </Text>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <Chip 
                      mode="outlined" 
                      compact
                      style={[
                        styles.roleChip,
                        { 
                          borderColor: user.role === 'student' ? colors.info :
                                      user.role === 'lecturer' ? colors.warning : 
                                      user.role === 'admin' ? colors.error : colors.primary
                        }
                      ]}
                      textStyle={{ 
                        color: user.role === 'student' ? colors.info :
                               user.role === 'lecturer' ? colors.warning : 
                               user.role === 'admin' ? colors.error : colors.primary
                      }}
                    >
                      {user.role}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <Chip 
                      mode="outlined" 
                      compact
                      style={[
                        styles.statusChip,
                        { 
                          borderColor: user.status === 'active' ? colors.success : 
                                      user.status === 'inactive' ? colors.error : colors.warning
                        }
                      ]}
                      textStyle={{ 
                        color: user.status === 'active' ? colors.success : 
                               user.status === 'inactive' ? colors.error : colors.warning
                      }}
                    >
                      {user.status || 'active'}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <View style={styles.actionButtons}>
                      <Button
                        mode="contained"
                        compact
                        icon="information"
                        onPress={() => {
                          setSelectedUser(user);
                          setShowUserDetailModal(true);
                        }}
                        style={styles.detailButton}
                        labelStyle={styles.buttonLabel}
                      >
                        Detail
                      </Button>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderKitManagement = () => {
    const filteredKits = kits.filter(kit => 
      kit.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalKits = kits.length;
    const availableKits = kits.filter(kit => kit.status === 'AVAILABLE').length;
    const inUseKits = kits.filter(kit => kit.status === 'IN-USE').length;
    const damagedKits = kits.filter(kit => kit.status === 'DAMAGED').length;

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
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Kit Management</Title>
              <Button 
                mode="contained" 
                icon="plus"
                onPress={() => {
                  setSelectedKit(null);
                  setShowKitModal(true);
                }}
              >
                New Kit
              </Button>
            </View>
            
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Kit Name</DataTable.Title>
                <DataTable.Title>Category</DataTable.Title>
                <DataTable.Title>Location</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredKits.map((kit) => (
                <DataTable.Row key={kit.id}>
                  <DataTable.Cell>{kit.name}</DataTable.Cell>
                  <DataTable.Cell>{kit.category}</DataTable.Cell>
                  <DataTable.Cell>{kit.location}</DataTable.Cell>
                  <DataTable.Cell>
                    <Chip 
                      mode="outlined" 
                      compact
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
                  <DataTable.Cell>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleKitAction(kit, 'manage')}
                    >
                      Manage
                    </Button>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderGroupManagement = () => {
    const filteredGroups = groups.filter(group => 
      group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.lecturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.leader?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group statistics
    const totalGroups = groups.length;
    const groupsWithMembers = groups.filter(group => group.members && group.members.length > 0).length;
    const groupsWithoutLeader = groups.filter(group => !group.leader).length;
    const totalMembers = groups.reduce((sum, group) => sum + (group.members?.length || 0), 0);

    return (
      <View style={styles.tabContent}>
        {/* Group Statistics */}
        <View style={styles.groupStatsGrid}>
          <Card style={[styles.groupStatCard, shadows.small]}>
            <Card.Content style={styles.groupStatContent}>
              <Title style={styles.groupStatNumber}>{totalGroups}</Title>
              <Paragraph style={styles.groupStatLabel}>Total Groups</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.groupStatCard, shadows.small]}>
            <Card.Content style={styles.groupStatContent}>
              <Title style={[styles.groupStatNumber, { color: colors.success }]}>{groupsWithMembers}</Title>
              <Paragraph style={styles.groupStatLabel}>With Members</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.groupStatCard, shadows.small]}>
            <Card.Content style={styles.groupStatContent}>
              <Title style={[styles.groupStatNumber, { color: colors.warning }]}>{groupsWithoutLeader}</Title>
              <Paragraph style={styles.groupStatLabel}>Need Leader</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.groupStatCard, shadows.small]}>
            <Card.Content style={styles.groupStatContent}>
              <Title style={[styles.groupStatNumber, { color: colors.primary }]}>{totalMembers}</Title>
              <Paragraph style={styles.groupStatLabel}>Total Members</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <Searchbar
          placeholder="Search groups..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Group Management</Title>
              <Button 
                mode="contained" 
                icon="plus"
                onPress={() => setShowGroupModal(true)}
              >
                Create Group
              </Button>
            </View>
            
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Group Name</DataTable.Title>
                <DataTable.Title>Leader</DataTable.Title>
                <DataTable.Title>Lecturer</DataTable.Title>
                <DataTable.Title>Members</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredGroups.map((group) => (
                <DataTable.Row key={group.id}>
                  <DataTable.Cell style={styles.tableCell}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <Text style={styles.leaderText}>
                      {group.leader ? group.leader.split('@')[0] : 'No Leader'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <Text style={styles.lecturerText}>
                      {group.lecturer ? group.lecturer.split('@')[0] : 'No Lecturer'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <View style={styles.membersContainer}>
                      <Text style={styles.memberCount}>
                        {group.members?.length || 0} members
                      </Text>
                      {group.members && group.members.length > 0 && (
                        <View style={styles.memberChips}>
                          {group.members.slice(0, 2).map((member, index) => (
                            <Chip 
                              key={index} 
                              mode="outlined" 
                              compact
                              style={styles.memberChip}
                            >
                              {member.split('@')[0]}
                            </Chip>
                          ))}
                          {group.members.length > 2 && (
                            <Chip 
                              mode="outlined" 
                              compact
                              style={styles.memberChip}
                            >
                              +{group.members.length - 2}
                            </Chip>
                          )}
                        </View>
                      )}
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <View style={styles.groupActionButtons}>
                      <Button
                        mode="contained"
                        compact
                        icon="information"
                        onPress={() => {
                          setSelectedGroup(group);
                          setShowGroupDetailModal(true);
                        }}
                        style={styles.detailButton}
                        labelStyle={styles.buttonLabel}
                      >
                        Detail
                      </Button>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderFineManagement = () => {
    const filteredFines = fines.filter(fine => 
      fine.kitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.leaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fine.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Fine statistics
    const totalFines = fines.length;
    const pendingFines = fines.filter(fine => fine.status === 'pending').length;
    const paidFines = fines.filter(fine => fine.status === 'paid').length;
    const overdueFines = fines.filter(fine => fine.status === 'overdue').length;
    const totalAmount = fines.reduce((sum, fine) => sum + fine.fineAmount, 0);
    const pendingAmount = fines.filter(fine => fine.status === 'pending' || fine.status === 'overdue')
      .reduce((sum, fine) => sum + fine.fineAmount, 0);

    return (
      <View style={styles.tabContent}>
        {/* Fine Statistics */}
        <View style={styles.fineStatsGrid}>
          <Card style={[styles.fineStatCard, shadows.small]}>
            <Card.Content style={styles.fineStatContent}>
              <Title style={styles.fineStatNumber}>{totalFines}</Title>
              <Paragraph style={styles.fineStatLabel}>Total Fines</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.fineStatCard, shadows.small]}>
            <Card.Content style={styles.fineStatContent}>
              <Title style={[styles.fineStatNumber, { color: colors.warning }]}>{pendingFines}</Title>
              <Paragraph style={styles.fineStatLabel}>Pending</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.fineStatCard, shadows.small]}>
            <Card.Content style={styles.fineStatContent}>
              <Title style={[styles.fineStatNumber, { color: colors.success }]}>{paidFines}</Title>
              <Paragraph style={styles.fineStatLabel}>Paid</Paragraph>
            </Card.Content>
          </Card>
          <Card style={[styles.fineStatCard, shadows.small]}>
            <Card.Content style={styles.fineStatContent}>
              <Title style={[styles.fineStatNumber, { color: colors.error }]}>{overdueFines}</Title>
              <Paragraph style={styles.fineStatLabel}>Overdue</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialSummary}>
          <Card style={[styles.financialCard, shadows.medium]}>
            <Card.Content>
              <Title style={styles.financialTitle}>Financial Summary</Title>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Total Fine Amount:</Text>
                <Text style={[styles.financialValue, { color: colors.error }]}>
                  {totalAmount.toLocaleString()} VND
                </Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Pending Amount:</Text>
                <Text style={[styles.financialValue, { color: colors.warning }]}>
                  {pendingAmount.toLocaleString()} VND
                </Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Collected Amount:</Text>
                <Text style={[styles.financialValue, { color: colors.success }]}>
                  {(totalAmount - pendingAmount).toLocaleString()} VND
                </Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        <Searchbar
          placeholder="Search fines..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Card style={[styles.card, shadows.medium]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Fine Management</Title>
            </View>
            
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Fine ID</DataTable.Title>
                <DataTable.Title>Student</DataTable.Title>
                <DataTable.Title>Amount</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title>Due Date</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>

              {filteredFines.map((fine) => (
                <DataTable.Row key={fine.id}>
                  <DataTable.Cell style={styles.tableCell}>
                    <Text style={styles.fineIdText}>#{fine.id}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentNameText}>{fine.studentName}</Text>
                      <Text style={styles.studentEmailText}>{fine.studentEmail}</Text>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <Text style={[styles.fineAmountText, { color: colors.error }]}>
                      {fine.fineAmount.toLocaleString()} VND
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <View style={styles.statusIconContainer}>
                      {fine.status === 'paid' && (
                        <View style={[styles.statusIcon, { backgroundColor: colors.success }]}>
                          <Text style={styles.statusIconText}>✓</Text>
                        </View>
                      )}
                      {fine.status === 'pending' && (
                        <View style={[styles.statusIcon, { backgroundColor: colors.warning }]}>
                          <Text style={styles.statusIconText}>⏳</Text>
                        </View>
                      )}
                      {fine.status === 'overdue' && (
                        <View style={[styles.statusIcon, { backgroundColor: colors.error }]}>
                          <Text style={styles.statusIconText}>⚠</Text>
                        </View>
                      )}
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <Text style={styles.dueDateText}>
                      {new Date(fine.dueDate).toLocaleDateString()}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>
                    <View style={styles.fineActionButtons}>
                      <Button
                        mode="contained"
                        compact
                        icon="information"
                        onPress={() => handleShowFineDetails(fine)}
                        style={styles.detailButton}
                        labelStyle={styles.buttonLabel}
                      >
                        Detail
                      </Button>
                    </View>
                  </DataTable.Cell>
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
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'rentals', label: 'Rental Requests' },
            { key: 'refunds', label: 'Refund Requests' },
            { key: 'users', label: 'Users' },
            { key: 'kits', label: 'Kits' },
            { key: 'groups', label: 'Groups' },
            { key: 'fines', label: 'Fines' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'log-history', label: 'Log History' }
          ].map((tab) => (
            <Button
              key={tab.key}
              mode={activeTab === tab.key ? 'contained' : 'outlined'}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tabButton}
              labelStyle={styles.tabLabel}
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
            {activeTab === 'rentals' && renderRentalRequests()}
            {activeTab === 'refunds' && renderRefundRequests()}
            {activeTab === 'users' && renderUserManagement()}
            {activeTab === 'kits' && renderKitManagement()}
            {activeTab === 'groups' && renderGroupManagement()}
            {activeTab === 'fines' && renderFineManagement()}
            {activeTab === 'transactions' && renderTransactionHistory(
              transactionSearchQuery, 
              setTransactionSearchQuery, 
              transactionStatusFilter, 
              setTransactionStatusFilter, 
              transactionTypeFilter, 
              setTransactionTypeFilter, 
              transactions, 
              setSelectedTransaction, 
              setShowTransactionDetailModal
            )}
            {activeTab === 'log-history' && renderLogHistory(
              logSearchQuery, 
              setLogSearchQuery, 
              logStatusFilter, 
              setLogStatusFilter, 
              logTypeFilter, 
              setLogTypeFilter, 
              logHistory, 
              setSelectedLog, 
              setShowLogDetailModal
            )}
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
            title="Add New User"
            left={props => <List.Icon {...props} icon="account-plus" />}
            onPress={() => setModalVisible(false)}
          />
          <List.Item
            title="Add New Kit"
            left={props => <List.Icon {...props} icon="package-variant" />}
            onPress={() => setModalVisible(false)}
          />
          <List.Item
            title="Generate Report"
            left={props => <List.Icon {...props} icon="file-chart" />}
            onPress={() => setModalVisible(false)}
          />
          <Divider />
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
        </Modal>
      </Portal>

      {/* Kit Management Modal */}
      <Portal>
        <Modal
          visible={showKitModal}
          onDismiss={() => {
            setShowKitModal(false);
            setSelectedKit(null);
          }}
          contentContainerStyle={styles.managementModal}
        >
          <View>
            <Title style={styles.modalTitle}>
              {selectedKit ? 'Kit Management' : 'Add New Kit'}
            </Title>
            
            {selectedKit ? (
              // Kit Management Mode
              <KitManagementActions 
                kit={selectedKit}
                onStatusChange={handleKitStatusChange}
                onRename={handleKitRename}
                onManageComponents={handleManageComponents}
                onCategoryChange={handleKitCategoryChange}
                onCancel={() => {
                  setShowKitModal(false);
                  setSelectedKit(null);
                }}
              />
            ) : (
              // Add New Kit Mode
              <KitForm 
                onSubmit={handleAddKit}
                onCancel={() => {
                  setShowKitModal(false);
                  setSelectedKit(null);
                }}
              />
            )}
            
            <Button 
              mode="outlined" 
              onPress={() => {
                setShowKitModal(false);
                setSelectedKit(null);
              }}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* User Management Modal */}
      <Portal>
        <Modal
          visible={showUserModal}
          onDismiss={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          contentContainerStyle={styles.managementModal}
        >
          <View>
            <Title style={styles.modalTitle}>
              {selectedUser ? 'Edit User' : 'Add New User'}
            </Title>
            
            {selectedUser ? (
              // Edit User Mode
              userEditMode === 'edit' ? (
                <EditUserForm 
                  user={selectedUser}
                  onSubmit={handleEditUser}
                  onCancel={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setUserEditMode('edit');
                  }}
                />
              ) : (
                <EditUserRoleForm 
                  user={selectedUser}
                  onSubmit={handleEditUserRole}
                  onCancel={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setUserEditMode('edit');
                  }}
                />
              )
            ) : (
              // Add User Mode
              <UserForm 
                onSubmit={handleAddEditUser}
                onCancel={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                  setUserEditMode('edit');
                }}
              />
            )}
            
            <Button 
              mode="outlined" 
              onPress={() => {
                setShowUserModal(false);
                setSelectedUser(null);
              }}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* User Detail Modal */}
      <Portal>
        <Modal
          visible={showUserDetailModal}
          onDismiss={() => {
            setShowUserDetailModal(false);
            setSelectedUser(null);
          }}
          contentContainerStyle={styles.userDetailModal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <Title style={styles.modalTitle}>User Details</Title>
              
              {selectedUser && (
                <UserDetailView 
                  user={selectedUser}
                  onEdit={() => {
                    setUserEditMode('edit');
                    setShowUserDetailModal(false);
                    setShowUserModal(true);
                  }}
                  onRoleChange={() => {
                    setUserEditMode('role');
                    setShowUserDetailModal(false);
                    setShowUserModal(true);
                  }}
                  onDelete={() => {
                    setShowUserDetailModal(false);
                    handleDeleteUser(selectedUser.id);
                  }}
                  onClose={() => {
                    setShowUserDetailModal(false);
                    setSelectedUser(null);
                  }}
                />
              )}
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Group Management Modal */}
      <Portal>
        <Modal
          visible={showGroupModal}
          onDismiss={() => {
            setShowGroupModal(false);
          }}
          contentContainerStyle={styles.managementModal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <Title style={styles.modalTitle}>Create New Group</Title>
              
              <GroupForm 
                onSubmit={handleCreateGroup}
                onCancel={() => {
                  setShowGroupModal(false);
                }}
              />
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Group Detail Modal */}
      <Portal>
        <Modal
          visible={showGroupDetailModal}
          onDismiss={() => {
            setShowGroupDetailModal(false);
            setSelectedGroup(null);
          }}
          contentContainerStyle={styles.groupDetailModal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <Title style={styles.modalTitle}>Group Details</Title>
              
              {selectedGroup && (
                <GroupDetailView 
                  group={selectedGroup}
                  onAddMembers={() => {
                    setShowGroupDetailModal(false);
                    generateRandomStudents(selectedGroup.id, 2);
                  }}
                  onAdjustMembers={() => {
                    setShowGroupDetailModal(false);
                    adjustGroupMembers(selectedGroup);
                  }}
                  onDelete={() => {
                    setShowGroupDetailModal(false);
                    handleDeleteGroup(selectedGroup.id);
                  }}
                  onClose={() => {
                    setShowGroupDetailModal(false);
                    setSelectedGroup(null);
                  }}
                />
              )}
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Group Members Modal */}
      <Portal>
        <Modal
          visible={showGroupMembersModal}
          onDismiss={() => {
            setShowGroupMembersModal(false);
            setSelectedGroup(null);
            setSelectedStudents([]);
          }}
          contentContainerStyle={styles.groupMembersModal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <Title style={styles.modalTitle}>
                Adjust Members - {selectedGroup?.name}
              </Title>
              
              {selectedGroup && (
                <GroupMembersForm 
                  group={selectedGroup}
                  students={students}
                  selectedStudents={selectedStudents}
                  setSelectedStudents={setSelectedStudents}
                  onSave={saveGroupMembers}
                  onCancel={() => {
                    setShowGroupMembersModal(false);
                    setSelectedGroup(null);
                    setSelectedStudents([]);
                  }}
                />
              )}
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Fine Detail Modal */}
      <Portal>
        <Modal
          visible={showFineDetailModal}
          onDismiss={() => {
            setShowFineDetailModal(false);
            setSelectedFine(null);
          }}
          contentContainerStyle={styles.fineDetailModal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              <Title style={styles.modalTitle}>Fine Details</Title>
              
              {selectedFine && (
                <FineDetailView 
                  fine={selectedFine}
                  onMarkPaid={() => {
                    setShowFineDetailModal(false);
                    handleMarkAsPaid(selectedFine.id);
                  }}
                  onClose={() => {
                    setShowFineDetailModal(false);
                    setSelectedFine(null);
                  }}
                />
              )}
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Transaction Detail Modal */}
      <Portal>
        <Modal
          visible={showTransactionDetailModal}
          onDismiss={() => {
            setShowTransactionDetailModal(false);
            setSelectedTransaction(null);
          }}
          contentContainerStyle={styles.transactionDetailModal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              {selectedTransaction && (
                <TransactionDetailView 
                  transaction={selectedTransaction}
                  onClose={() => {
                    setShowTransactionDetailModal(false);
                    setSelectedTransaction(null);
                  }}
                />
              )}
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Log Detail Modal */}
      <Portal>
        <Modal
          visible={showLogDetailModal}
          onDismiss={() => {
            setShowLogDetailModal(false);
            setSelectedLog(null);
          }}
          contentContainerStyle={styles.logDetailModal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View>
              {selectedLog && (
                <LogDetailView 
                  log={selectedLog}
                  onClose={() => {
                    setShowLogDetailModal(false);
                    setSelectedLog(null);
                  }}
                />
              )}
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// User Form Component
const UserForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    department: '',
    phone: '',
    address: '',
    password: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Lecturer', value: 'lecturer' },
    { label: 'Admin', value: 'admin' },
    { label: 'Academic Affairs', value: 'academic' },
    { label: 'Leader', value: 'leader' },
    { label: 'Member', value: 'member' }
  ];

  return (
    <View style={styles.formContainer}>
      <TextInput
        label="Name *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        mode="outlined"
        style={styles.formInput}
      />
      
      <TextInput
        label="Email *"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        mode="outlined"
        keyboardType="email-address"
        style={styles.formInput}
      />
      
      <TextInput
        label="Password *"
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        mode="outlined"
        secureTextEntry
        style={styles.formInput}
      />
      
      <Text style={styles.formLabel}>Role *</Text>
      <View style={styles.radioGroup}>
        {roleOptions.map((option) => (
          <View key={option.value} style={styles.radioOption}>
            <RadioButton
              value={option.value}
              status={formData.role === option.value ? 'checked' : 'unchecked'}
              onPress={() => setFormData({ ...formData, role: option.value })}
            />
            <Text style={styles.radioLabel}>{option.label}</Text>
          </View>
        ))}
      </View>
      
      <TextInput
        label="Department"
        value={formData.department}
        onChangeText={(text) => setFormData({ ...formData, department: text })}
        mode="outlined"
        style={styles.formInput}
      />
      
      <TextInput
        label="Phone"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.formInput}
      />
      
      <TextInput
        label="Address"
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
        mode="outlined"
        multiline
        numberOfLines={2}
        style={styles.formInput}
      />
      
      <View style={styles.formActions}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Add User
        </Button>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
};

// Edit User Form Component - Comprehensive user editing
const EditUserForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    address: user.address || '',
    role: user.role || 'student',
    status: user.status || 'active'
  });

  const roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Lecturer', value: 'lecturer' },
    { label: 'Admin', value: 'admin' },
    { label: 'Academic Affairs', value: 'academic' },
    { label: 'Leader', value: 'leader' },
    { label: 'Member', value: 'member' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' }
  ];

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.editFormContainer}>
      <View style={styles.formContainer}>
        <Title style={styles.actionTitle}>Edit User Information</Title>
        
        <TextInput
          label="Full Name *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          mode="outlined"
          style={styles.formInput}
        />
        
        <TextInput
          label="Email *"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          mode="outlined"
          keyboardType="email-address"
          style={styles.formInput}
        />
        
        <TextInput
          label="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.formInput}
        />
        
        <TextInput
          label="Department"
          value={formData.department}
          onChangeText={(text) => setFormData({ ...formData, department: text })}
          mode="outlined"
          style={styles.formInput}
        />
        
        <TextInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          mode="outlined"
          multiline
          numberOfLines={2}
          style={styles.formInput}
        />
        
        <Text style={styles.formLabel}>Role *</Text>
        <View style={styles.radioGroup}>
          {roleOptions.map((option) => (
            <View key={option.value} style={styles.radioOption}>
              <RadioButton
                value={option.value}
                status={formData.role === option.value ? 'checked' : 'unchecked'}
                onPress={() => setFormData({ ...formData, role: option.value })}
              />
              <Text style={styles.radioLabel}>{option.label}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.formLabel}>Status *</Text>
        <View style={styles.radioGroup}>
          {statusOptions.map((option) => (
            <View key={option.value} style={styles.radioOption}>
              <RadioButton
                value={option.value}
                status={formData.status === option.value ? 'checked' : 'unchecked'}
                onPress={() => setFormData({ ...formData, status: option.value })}
              />
              <Text style={styles.radioLabel}>{option.label}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.formActions}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Update User
          </Button>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

// Edit User Role Form Component - For role-only changes
const EditUserRoleForm = ({ user, onSubmit, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Lecturer', value: 'lecturer' },
    { label: 'Admin', value: 'admin' },
    { label: 'Academic Affairs', value: 'academic' },
    { label: 'Leader', value: 'leader' },
    { label: 'Member', value: 'member' }
  ];

  const handleSubmit = () => {
    if (selectedRole === user.role) {
      Alert.alert('No Changes', 'Please select a different role to update');
      return;
    }
    onSubmit({ role: selectedRole });
  };

  return (
    <View style={styles.formContainer}>
      <Card style={styles.modalCard}>
        <Card.Content>
          <View style={styles.userInfo}>
            <Title style={styles.userModalName}>{user.name}</Title>
            <Paragraph style={styles.userModalEmail}>{user.email}</Paragraph>
            <Chip 
              mode="outlined" 
              style={[
                styles.roleChip,
                { 
                  borderColor: user.role === 'student' ? colors.info :
                              user.role === 'lecturer' ? colors.warning : 
                              user.role === 'admin' ? colors.error : colors.primary
                }
              ]}
              textStyle={{ 
                color: user.role === 'student' ? colors.info :
                       user.role === 'lecturer' ? colors.warning : 
                       user.role === 'admin' ? colors.error : colors.primary
              }}
            >
              Current: {user.role}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Title style={styles.actionTitle}>Change User Role</Title>
      <Text style={styles.formLabel}>Select New Role:</Text>
      <View style={styles.radioGroup}>
        {roleOptions.map((option) => (
          <View key={option.value} style={styles.radioOption}>
            <RadioButton
              value={option.value}
              status={selectedRole === option.value ? 'checked' : 'unchecked'}
              onPress={() => setSelectedRole(option.value)}
            />
            <Text style={styles.radioLabel}>{option.label}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.formActions}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={selectedRole === user.role}
        >
          Update Role
        </Button>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
};

// Kit Form Component
const KitForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Basic',
    quantity: '1',
    price: '',
    description: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    onSubmit({
      ...formData,
      quantity: parseInt(formData.quantity),
      price: parseInt(formData.price)
    });
  };

  const categoryOptions = [
    { label: 'Basic', value: 'Basic' },
    { label: 'Advanced', value: 'Advanced' },
    { label: 'Professional', value: 'Professional' }
  ];

  return (
    <View style={styles.formContainer}>
      <TextInput
        label="Kit Name *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        mode="outlined"
        style={styles.formInput}
      />
      
      <Text style={styles.formLabel}>Category *</Text>
      <View style={styles.radioGroup}>
        {categoryOptions.map((option) => (
          <View key={option.value} style={styles.radioOption}>
            <RadioButton
              value={option.value}
              status={formData.category === option.value ? 'checked' : 'unchecked'}
              onPress={() => setFormData({ ...formData, category: option.value })}
            />
            <Text style={styles.radioLabel}>{option.label}</Text>
          </View>
        ))}
      </View>
      
      <TextInput
        label="Quantity *"
        value={formData.quantity}
        onChangeText={(text) => setFormData({ ...formData, quantity: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.formInput}
      />
      
      <TextInput
        label="Price per day (VND) *"
        value={formData.price}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        mode="outlined"
        keyboardType="numeric"
        style={styles.formInput}
      />
      
      <TextInput
        label="Description"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.formInput}
      />
      
      <View style={styles.formActions}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
        >
          Create Kit
        </Button>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
};

// Kit Management Actions Component
const KitManagementActions = ({ kit, onStatusChange, onRename, onManageComponents, onCategoryChange, onCancel }) => {
  const [actionMode, setActionMode] = useState('main'); // 'main', 'rename', 'components', 'category'
  const [newName, setNewName] = useState(kit.name);
  const [newCategory, setNewCategory] = useState(kit.category);
  const [components, setComponents] = useState(kit.components || []);

  const handleRename = () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a valid kit name');
      return;
    }
    onRename(newName.trim());
  };

  const handleCategoryChange = () => {
    if (newCategory === kit.category) {
      Alert.alert('No Changes', 'Please select a different category to update');
      return;
    }
    onCategoryChange(newCategory);
  };

  const addComponent = () => {
    const newComponent = {
      id: Date.now(),
      name: '',
      quantity: 1,
      condition: 'New'
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (id, field, value) => {
    setComponents(components.map(comp => 
      comp.id === id ? { ...comp, [field]: value } : comp
    ));
  };

  const removeComponent = (id) => {
    setComponents(components.filter(comp => comp.id !== id));
  };

  const saveComponents = () => {
    onManageComponents(components);
  };

  if (actionMode === 'rename') {
    return (
      <View style={styles.formContainer}>
        <Title style={styles.actionTitle}>Rename Kit</Title>
        <TextInput
          label="New Kit Name"
          value={newName}
          onChangeText={setNewName}
          mode="outlined"
          style={styles.formInput}
        />
        <View style={styles.formActions}>
          <Button
            mode="contained"
            onPress={handleRename}
            style={styles.submitButton}
          >
            Save Name
          </Button>
          <Button
            mode="outlined"
            onPress={() => setActionMode('main')}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </View>
    );
  }

  if (actionMode === 'category') {
    const categoryOptions = [
      { label: 'Basic', value: 'Basic' },
      { label: 'Advanced', value: 'Advanced' },
      { label: 'Professional', value: 'Professional' }
    ];

    return (
      <View style={styles.formContainer}>
        <Title style={styles.actionTitle}>Change Kit Category</Title>
        <Text style={styles.formLabel}>Current Category: {kit.category}</Text>
        <Text style={styles.formLabel}>Select New Category:</Text>
        <View style={styles.radioGroup}>
          {categoryOptions.map((option) => (
            <View key={option.value} style={styles.radioOption}>
              <RadioButton
                value={option.value}
                status={newCategory === option.value ? 'checked' : 'unchecked'}
                onPress={() => setNewCategory(option.value)}
              />
              <Text style={styles.radioLabel}>{option.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.formActions}>
          <Button
            mode="contained"
            onPress={handleCategoryChange}
            style={styles.submitButton}
            disabled={newCategory === kit.category}
          >
            Update Category
          </Button>
          <Button
            mode="outlined"
            onPress={() => setActionMode('main')}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </View>
    );
  }

  if (actionMode === 'components') {
    return (
      <View style={styles.formContainer}>
        <Title style={styles.actionTitle}>Manage Components</Title>
        
        <Button
          mode="contained"
          icon="plus"
          onPress={addComponent}
          style={styles.addComponentButton}
        >
          Add Component
        </Button>

        <ScrollView style={styles.componentsList}>
          {components.map((component, index) => (
            <Card key={`component-${component.id}-${index}`} style={styles.componentCard}>
              <Card.Content>
                <View style={styles.componentRow}>
                  <TextInput
                    label="Component Name"
                    value={component.name}
                    onChangeText={(text) => updateComponent(component.id, 'name', text)}
                    mode="outlined"
                    style={styles.componentInput}
                  />
                  <TextInput
                    label="Quantity"
                    value={String(component.quantity)}
                    onChangeText={(text) => updateComponent(component.id, 'quantity', parseInt(text) || 1)}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.componentInput}
                  />
                </View>
                <View style={styles.componentRow}>
                  <Text style={styles.formLabel}>Condition:</Text>
                  <View style={styles.radioGroup}>
                    {['New', 'Used', 'Damaged'].map((condition) => (
                      <View key={`condition-${component.id}-${condition}`} style={styles.radioOption}>
                        <RadioButton
                          value={condition}
                          status={component.condition === condition ? 'checked' : 'unchecked'}
                          onPress={() => updateComponent(component.id, 'condition', condition)}
                        />
                        <Text style={styles.radioLabel}>{condition}</Text>
                      </View>
                    ))}
                  </View>
                  <Button
                    mode="outlined"
                    icon="delete"
                    onPress={() => removeComponent(component.id)}
                    style={styles.deleteComponentButton}
                    textColor={colors.error}
                  >
                    Remove
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.formActions}>
          <Button
            mode="contained"
            onPress={saveComponents}
            style={styles.submitButton}
          >
            Save Components
          </Button>
          <Button
            mode="outlined"
            onPress={() => setActionMode('main')}
            style={styles.cancelButton}
          >
            Back
          </Button>
        </View>
      </View>
    );
  }

  // Main actions view
  return (
    <View>
      <Card style={styles.modalCard}>
        <Card.Content>
          <Title style={styles.kitName}>{kit.name}</Title>
          <Paragraph style={styles.kitCategory}>{kit.category}</Paragraph>
          
          <View style={styles.kitDetails}>
            <View style={styles.kitDetailRow}>
              <Paragraph style={styles.kitDetailLabel}>Current Status:</Paragraph>
              <Paragraph style={styles.kitDetailValue}>{kit.status}</Paragraph>
            </View>
            
            <View style={styles.kitDetailRow}>
              <Paragraph style={styles.kitDetailLabel}>Category:</Paragraph>
              <Paragraph style={styles.kitDetailValue}>{kit.category}</Paragraph>
            </View>
            
            <View style={styles.kitDetailRow}>
              <Paragraph style={styles.kitDetailLabel}>Price:</Paragraph>
              <Paragraph style={styles.kitDetailValue}>{kit.price.toLocaleString()} VND/day</Paragraph>
            </View>
            
            <View style={styles.kitDetailRow}>
              <Paragraph style={styles.kitDetailLabel}>Quantity:</Paragraph>
              <Paragraph style={styles.kitDetailValue}>{kit.quantity}</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Title style={styles.actionTitle}>Kit Actions</Title>
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          icon="pencil"
          onPress={() => setActionMode('rename')}
          style={[styles.actionButton, { backgroundColor: colors.info }]}
        >
          Rename Kit
        </Button>
        <Button
          mode="contained"
          icon="tag"
          onPress={() => setActionMode('category')}
          style={[styles.actionButton, { backgroundColor: colors.warning }]}
        >
          Change Category
        </Button>
        <Button
          mode="contained"
          icon="cog"
          onPress={() => setActionMode('components')}
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
        >
          Manage Components
        </Button>
      </View>

      <Title style={styles.actionTitle}>Change Status</Title>
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => onStatusChange(kit.id, 'AVAILABLE')}
          style={[styles.actionButton, { backgroundColor: colors.success }]}
        >
          Mark Available
        </Button>
        <Button
          mode="contained"
          onPress={() => onStatusChange(kit.id, 'IN-USE')}
          style={[styles.actionButton, { backgroundColor: colors.warning }]}
        >
          Mark In Use
        </Button>
        <Button
          mode="contained"
          onPress={() => onStatusChange(kit.id, 'DAMAGED')}
          style={[styles.actionButton, { backgroundColor: colors.error }]}
        >
          Mark Damaged
        </Button>
        <Button
          mode="contained"
          onPress={() => onStatusChange(kit.id, 'MAINTENANCE')}
          style={[styles.actionButton, { backgroundColor: colors.info }]}
        >
          Mark Maintenance
        </Button>
      </View>
    </View>
  );
};

// User Detail View Component
const UserDetailView = ({ user, onEdit, onRoleChange, onDelete, onClose }) => {
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return colors.error;
      case 'lecturer': return colors.warning;
      case 'academic': return colors.info;
      case 'leader': return colors.primary;
      case 'member': return colors.secondary;
      default: return colors.textSecondary;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return colors.success;
      case 'inactive': return colors.error;
      case 'suspended': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.userDetailContainer}>
      {/* User Avatar and Basic Info */}
      <View style={styles.userDetailHeader}>
        <Avatar.Text 
          size={80} 
          label={user.name?.charAt(0)?.toUpperCase() || 'U'} 
          style={[styles.userDetailAvatar, { backgroundColor: getRoleColor(user.role) }]}
        />
        <View style={styles.userDetailInfo}>
          <Title style={styles.userDetailName}>{user.name || 'Unknown User'}</Title>
          <Paragraph style={styles.userDetailEmail}>{user.email}</Paragraph>
          <View style={styles.userDetailChips}>
            <Chip 
              style={[styles.userDetailChip, { backgroundColor: getRoleColor(user.role) }]}
              textStyle={{ color: 'white' }}
            >
              {user.role?.toUpperCase()}
            </Chip>
            <Chip 
              style={[styles.userDetailChip, { backgroundColor: getStatusColor(user.status) }]}
              textStyle={{ color: 'white' }}
            >
              {user.status?.toUpperCase()}
            </Chip>
          </View>
        </View>
      </View>

      <Divider style={styles.userDetailDivider} />

      {/* Detailed Information */}
      <View style={styles.userDetailSection}>
        <Title style={styles.userDetailSectionTitle}>Personal Information</Title>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Full Name:</Text>
          <Text style={styles.userDetailValue}>{user.name || 'Not provided'}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Email:</Text>
          <Text style={styles.userDetailValue}>{user.email}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Phone:</Text>
          <Text style={styles.userDetailValue}>{user.phone || 'Not provided'}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Department:</Text>
          <Text style={styles.userDetailValue}>{user.department || 'Not specified'}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Address:</Text>
          <Text style={styles.userDetailValue}>{user.address || 'Not provided'}</Text>
        </View>
      </View>

      <Divider style={styles.userDetailDivider} />

      {/* Account Information */}
      <View style={styles.userDetailSection}>
        <Title style={styles.userDetailSectionTitle}>Account Information</Title>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>User ID:</Text>
          <Text style={styles.userDetailValue}>{user.id}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Role:</Text>
          <Text style={styles.userDetailValue}>{user.role}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Status:</Text>
          <Text style={styles.userDetailValue}>{user.status}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Created:</Text>
          <Text style={styles.userDetailValue}>{user.createdAt || 'Unknown'}</Text>
        </View>
        
        <View style={styles.userDetailRow}>
          <Text style={styles.userDetailLabel}>Last Login:</Text>
          <Text style={styles.userDetailValue}>{user.lastLogin || 'Never'}</Text>
        </View>
      </View>

      <Divider style={styles.userDetailDivider} />

      {/* Action Buttons */}
      <View style={styles.userDetailActions}>
        <Button
          mode="contained"
          icon="pencil"
          onPress={onEdit}
          style={[styles.userDetailActionButton, { backgroundColor: colors.primary }]}
          labelStyle={{ color: 'white' }}
        >
          Edit Information
        </Button>
        
        <Button
          mode="contained"
          icon="account-switch"
          onPress={onRoleChange}
          style={[styles.userDetailActionButton, { backgroundColor: colors.warning }]}
          labelStyle={{ color: 'white' }}
        >
          Change Role
        </Button>
        
        <Button
          mode="outlined"
          icon="delete"
          onPress={onDelete}
          style={[styles.userDetailActionButton, { borderColor: colors.error }]}
          textColor={colors.error}
        >
          Delete User
        </Button>
        
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.userDetailActionButton}
        >
          Close
        </Button>
      </View>
    </View>
  );
};

// Fine Detail View Component
const FineDetailView = ({ fine, onMarkPaid, onClose }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'overdue': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.fineDetailContainer}>
      {/* Fine Header */}
      <View style={styles.fineDetailHeader}>
        <Avatar.Text 
          size={80} 
          label={`#${fine.id}`} 
          style={[styles.fineDetailAvatar, { backgroundColor: getStatusColor(fine.status) }]}
        />
        <View style={styles.fineDetailInfo}>
          <Title style={styles.fineDetailTitle}>Fine #{fine.id}</Title>
          <Paragraph style={styles.fineDetailKit}>{fine.kitName}</Paragraph>
          <View style={styles.fineDetailChips}>
            <Chip 
              style={[styles.fineDetailChip, { backgroundColor: getStatusColor(fine.status) }]}
              textStyle={{ color: 'white' }}
            >
              {fine.status?.toUpperCase()}
            </Chip>
            <Chip 
              style={[styles.fineDetailChip, { backgroundColor: colors.error }]}
              textStyle={{ color: 'white' }}
            >
              {fine.fineAmount.toLocaleString()} VND
            </Chip>
          </View>
        </View>
      </View>

      <Divider style={styles.fineDetailDivider} />

      {/* Fine Information */}
      <View style={styles.fineDetailSection}>
        <Title style={styles.fineDetailSectionTitle}>Fine Information</Title>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Fine ID:</Text>
          <Text style={styles.fineDetailValue}>#{fine.id}</Text>
        </View>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Kit Name:</Text>
          <Text style={styles.fineDetailValue}>{fine.kitName}</Text>
        </View>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Fine Amount:</Text>
          <Text style={[styles.fineDetailValue, { color: colors.error, fontWeight: 'bold' }]}>
            {fine.fineAmount.toLocaleString()} VND
          </Text>
        </View>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Status:</Text>
          <Text style={[styles.fineDetailValue, { color: getStatusColor(fine.status) }]}>
            {fine.status?.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Created:</Text>
          <Text style={styles.fineDetailValue}>{formatDate(fine.createdAt)}</Text>
        </View>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Due Date:</Text>
          <Text style={styles.fineDetailValue}>{formatDate(fine.dueDate)}</Text>
        </View>
        
        {fine.paidDate && (
          <View style={styles.fineDetailRow}>
            <Text style={styles.fineDetailLabel}>Paid Date:</Text>
            <Text style={[styles.fineDetailValue, { color: colors.success }]}>
              {formatDate(fine.paidDate)}
            </Text>
          </View>
        )}
      </View>

      <Divider style={styles.fineDetailDivider} />

      {/* Student Information */}
      <View style={styles.fineDetailSection}>
        <Title style={styles.fineDetailSectionTitle}>Student Information</Title>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Student Name:</Text>
          <Text style={styles.fineDetailValue}>{fine.studentName}</Text>
        </View>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Student Email:</Text>
          <Text style={styles.fineDetailValue}>{fine.studentEmail}</Text>
        </View>
      </View>

      <Divider style={styles.fineDetailDivider} />

      {/* Group Leader Information */}
      <View style={styles.fineDetailSection}>
        <Title style={styles.fineDetailSectionTitle}>Group Leader Information</Title>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Leader Name:</Text>
          <Text style={styles.fineDetailValue}>{fine.leaderName}</Text>
        </View>
        
        <View style={styles.fineDetailRow}>
          <Text style={styles.fineDetailLabel}>Leader Email:</Text>
          <Text style={styles.fineDetailValue}>{fine.leaderEmail}</Text>
        </View>
      </View>

      <Divider style={styles.fineDetailDivider} />

      {/* Damage Assessment */}
      <View style={styles.fineDetailSection}>
        <Title style={styles.fineDetailSectionTitle}>Damage Assessment</Title>
        
        {fine.damageAssessment && Object.keys(fine.damageAssessment).length > 0 ? (
          Object.entries(fine.damageAssessment).map(([component, assessment]) => (
            <View key={component} style={styles.damageItem}>
              <View style={styles.damageHeader}>
                <Text style={styles.damageComponent}>{component}</Text>
                <Chip 
                  style={[styles.damageChip, { backgroundColor: colors.error }]}
                  textStyle={{ color: 'white' }}
                >
                  {assessment.value.toLocaleString()} VND
                </Chip>
              </View>
              <Text style={styles.damageDescription}>
                Component damaged during rental period
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDamageText}>No damage assessment available</Text>
        )}
      </View>

      <Divider style={styles.fineDetailDivider} />

      {/* Action Buttons */}
      <View style={styles.fineDetailActions}>
        {fine.status === 'pending' && (
          <Button
            mode="contained"
            icon="check"
            onPress={onMarkPaid}
            style={[styles.fineDetailActionButton, { backgroundColor: colors.success }]}
            labelStyle={{ color: 'white' }}
          >
            Mark as Paid
          </Button>
        )}
        
        {fine.status === 'overdue' && (
          <Button
            mode="contained"
            icon="alert"
            onPress={onMarkPaid}
            style={[styles.fineDetailActionButton, { backgroundColor: colors.error }]}
            labelStyle={{ color: 'white' }}
          >
            Mark as Paid (Overdue)
          </Button>
        )}
        
        <Button
          mode="outlined"
          icon="email"
          onPress={() => {
            // TODO: Implement send reminder functionality
            Alert.alert('Send Reminder', 'Reminder email would be sent to group leader');
          }}
          style={[styles.fineDetailActionButton, { borderColor: colors.info }]}
          textColor={colors.info}
        >
          Send Reminder
        </Button>
        
        <Button
          mode="outlined"
          icon="file-document"
          onPress={() => {
            // TODO: Implement generate report functionality
            Alert.alert('Generate Report', 'Fine report would be generated');
          }}
          style={[styles.fineDetailActionButton, { borderColor: colors.warning }]}
          textColor={colors.warning}
        >
          Generate Report
        </Button>
        
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.fineDetailActionButton}
        >
          Close
        </Button>
      </View>
    </View>
  );
};

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
  tabContent: {
    gap: spacing.md,
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
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statNumber: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
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
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  activityText: {
    ...typography.body2,
    color: colors.text,
    flex: 1,
  },
  activityUser: {
    fontWeight: '600',
    color: colors.primary,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  requestTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
  },
  statusChip: {
    height: 32,
  },
  requestInfo: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.success,
  },
  rejectButton: {
    flex: 1,
    borderColor: colors.error,
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
  searchBar: {
    marginBottom: spacing.md,
  },
  userCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  userAvatar: {
    backgroundColor: colors.primary,
  },
  userName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  typeChip: {
    height: 32,
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
  managementModal: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 8,
    maxHeight: '80%',
  },
  actionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  closeButton: {
    marginTop: spacing.md,
  },
  kitName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  kitCategory: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  kitDetails: {
    gap: spacing.sm,
  },
  kitDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kitDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  kitDetailValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userModalAvatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userModalName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userModalEmail: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  userDetails: {
    gap: spacing.sm,
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  userDetailValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  userStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  userStatCard: {
    flex: 1,
    minWidth: '45%',
  },
  userStatContent: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  userStatNumber: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  userStatLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  userName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  userRole: {
    ...typography.caption,
    color: colors.textSecondary,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  userDepartment: {
    ...typography.caption,
    color: colors.textSecondary,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  roleChip: {
    marginTop: spacing.xs,
  },
  editButton: {
    marginRight: spacing.xs,
  },
  deleteButton: {
    marginLeft: spacing.xs,
  },
  formContainer: {
    padding: spacing.md,
  },
  formInput: {
    marginBottom: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  formHalf: {
    flex: 1,
  },
  formLabel: {
    ...typography.body2,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  radioGroup: {
    gap: spacing.xs,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  radioLabel: {
    ...typography.body2,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  tableHeader: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  tableCell: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  emailText: {
    ...typography.body2,
    color: colors.text,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  buttonLabel: {
    ...typography.caption,
    fontSize: 10,
  },
  addComponentButton: {
    marginBottom: spacing.md,
  },
  componentsList: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  componentCard: {
    marginBottom: spacing.sm,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  componentInput: {
    flex: 1,
  },
  deleteComponentButton: {
    marginLeft: spacing.sm,
  },
  // User Detail Modal Styles
  userDetailModal: {
    backgroundColor: 'white',
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '90%',
  },
  userDetailContainer: {
    padding: spacing.lg,
  },
  userDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userDetailAvatar: {
    marginRight: spacing.lg,
  },
  userDetailInfo: {
    flex: 1,
  },
  userDetailName: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userDetailEmail: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  userDetailChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  userDetailChip: {
    marginRight: spacing.xs,
  },
  userDetailDivider: {
    marginVertical: spacing.lg,
  },
  userDetailSection: {
    marginBottom: spacing.lg,
  },
  userDetailSectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  userDetailValue: {
    ...typography.body2,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  userDetailActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  userDetailActionButton: {
    marginBottom: spacing.sm,
  },
  detailButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  editFormContainer: {
    maxHeight: 400,
  },
  // Group Management Styles
  groupStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  groupStatCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  groupStatContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  groupStatNumber: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  groupStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  groupName: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
  },
  groupDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  leaderText: {
    ...typography.body2,
    color: colors.text,
  },
  lecturerText: {
    ...typography.body2,
    color: colors.text,
  },
  membersContainer: {
    flex: 1,
  },
  memberCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  memberChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  memberChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  // Group Detail Modal Styles
  groupDetailModal: {
    backgroundColor: 'white',
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '90%',
  },
  groupDetailContainer: {
    padding: spacing.lg,
  },
  groupDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  groupDetailAvatar: {
    marginRight: spacing.lg,
  },
  groupDetailInfo: {
    flex: 1,
  },
  groupDetailName: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  groupDetailDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  groupDetailChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  groupDetailChip: {
    marginRight: spacing.xs,
  },
  groupDetailDivider: {
    marginVertical: spacing.lg,
  },
  groupDetailSection: {
    marginBottom: spacing.lg,
  },
  groupDetailSectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  groupDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  groupDetailValue: {
    ...typography.body2,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  groupDetailActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  groupDetailActionButton: {
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberAvatar: {
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  memberEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  leaderChip: {
    marginLeft: spacing.sm,
  },
  noMembersText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },
  // Group Members Modal Styles
  groupMembersModal: {
    backgroundColor: 'white',
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '90%',
  },
  groupMembersContainer: {
    padding: spacing.lg,
  },
  groupMembersInfo: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  groupMembersSectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  studentsList: {
    maxHeight: 200,
    marginBottom: spacing.lg,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  studentAvatar: {
    marginRight: spacing.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  studentEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  studentToggleButton: {
    marginLeft: spacing.sm,
  },
  selectedMembersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    minHeight: 60,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  selectedMemberChip: {
    marginBottom: spacing.xs,
  },
  noSelectedText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    flex: 1,
  },
  groupMembersActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Group Action Buttons Styles
  groupActionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  // Fine Management Styles
  fineStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  fineStatCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  fineStatContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  fineStatNumber: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fineStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  financialSummary: {
    marginBottom: spacing.lg,
  },
  financialCard: {
    backgroundColor: colors.surface,
  },
  financialTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  financialLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  financialValue: {
    ...typography.body2,
    color: colors.text,
    fontWeight: 'bold',
  },
  fineIdText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  kitNameText: {
    ...typography.body2,
    color: colors.text,
  },
  studentNameText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  studentEmailText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fineAmountText: {
    ...typography.body2,
    fontWeight: 'bold',
  },
  dueDateText: {
    ...typography.body2,
    color: colors.text,
  },
  fineActionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  markPaidButton: {
    marginLeft: spacing.xs,
  },
  statusIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Fine Detail Modal Styles
  fineDetailModal: {
    backgroundColor: 'white',
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '90%',
  },
  fineDetailContainer: {
    padding: spacing.lg,
  },
  fineDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  fineDetailAvatar: {
    marginRight: spacing.lg,
  },
  fineDetailInfo: {
    flex: 1,
  },
  fineDetailTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fineDetailKit: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fineDetailChips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fineDetailChip: {
    marginRight: spacing.xs,
  },
  fineDetailDivider: {
    marginVertical: spacing.lg,
  },
  fineDetailSection: {
    marginBottom: spacing.lg,
  },
  fineDetailSectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  fineDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fineDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  fineDetailValue: {
    ...typography.body2,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
  fineDetailActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  fineDetailActionButton: {
    marginBottom: spacing.sm,
  },
  damageItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  damageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  damageComponent: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '600',
  },
  damageChip: {
    marginLeft: spacing.sm,
  },
  damageDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  noDamageText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
  },

  // Transaction History Styles
  transactionStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  transactionStatCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  transactionStatContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  transactionStatNumber: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  transactionStatLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  filterCard: {
    marginBottom: spacing.lg,
  },
  legendCard: {
    marginBottom: spacing.lg,
  },
  legendTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    minWidth: '18%',
  },
  legendIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  transactionIdText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    ...typography.body2,
    fontWeight: 'bold',
    color: colors.text,
  },
  userEmailText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  roleChip: {
    alignSelf: 'flex-start',
  },
  roleChipText: {
    fontSize: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  typeText: {
    ...typography.body2,
    fontWeight: 'bold',
  },
  amountText: {
    ...typography.body2,
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },

  // Transaction Detail Modal Styles
  transactionDetailModal: {
    backgroundColor: 'white',
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '90%',
  },
  transactionDetailContainer: {
    padding: spacing.lg,
  },
  transactionDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  transactionDetailAvatar: {
    marginRight: spacing.lg,
  },
  transactionDetailInfo: {
    flex: 1,
  },
  transactionDetailTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  transactionDetailId: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  transactionDetailDivider: {
    marginVertical: spacing.lg,
  },
  transactionDetailSection: {
    marginBottom: spacing.lg,
  },
  transactionDetailSectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  transactionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  transactionDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1,
  },
  transactionDetailValue: {
    ...typography.body2,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  transactionDetailActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  transactionDetailActionButton: {
    marginHorizontal: spacing.sm,
  },

  // Log History Styles
  logStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  logStatCard: {
    width: '48%',
    marginBottom: spacing.md,
  },
  logStatContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  logStatNumber: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  logStatLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activitySummary: {
    marginBottom: spacing.lg,
  },
  activityTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  activityValue: {
    ...typography.body2,
    fontWeight: 'bold',
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
  },
  kitNameText: {
    ...typography.body2,
    color: colors.text,
  },

  // Log Detail Modal Styles
  logDetailModal: {
    backgroundColor: 'white',
    margin: spacing.lg,
    borderRadius: 16,
    maxHeight: '90%',
  },
  logDetailContainer: {
    padding: spacing.lg,
  },
  logDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logDetailAvatar: {
    marginRight: spacing.lg,
  },
  logDetailInfo: {
    flex: 1,
  },
  logDetailTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  logDetailId: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  logDetailDivider: {
    marginVertical: spacing.lg,
  },
  logDetailSection: {
    marginBottom: spacing.lg,
  },
  logDetailSectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  logDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logDetailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    flex: 1,
  },
  logDetailValue: {
    ...typography.body2,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logDetailActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  logDetailActionButton: {
    marginHorizontal: spacing.sm,
  },
  typeChip: {
    alignSelf: 'flex-end',
  },
  typeChipText: {
    fontSize: 10,
  },
  adminChip: {
    alignSelf: 'flex-end',
  },
  adminChipText: {
    fontSize: 10,
    color: 'white',
  },
});


