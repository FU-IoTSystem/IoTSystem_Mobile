import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Avatar,
  ActivityIndicator,
} from 'react-native-paper';
import LecturerLayout from '../../components/LecturerLayout';

const LecturerFinesRefunds = ({ user, navigation }) => {
  const [lecturerFines, setLecturerFines] = useState([]);
  const [lecturerRefunds, setLecturerRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // For now, set empty arrays (can be implemented with API later)
      setLecturerFines([]);
      setLecturerRefunds([]);
    } catch (error) {
      console.error('Error loading fines/refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const renderFineItem = ({ item }) => (
    <Card style={styles.itemCard} mode="outlined">
      <Card.Content>
        <View style={styles.itemHeader}>
          <Avatar.Icon size={40} icon="alert" style={{ backgroundColor: '#fa8c16' }} />
          <View style={styles.itemInfo}>
            <Title style={styles.itemTitle}>{item.kitName || 'Fine'}</Title>
            <Paragraph style={styles.itemId}>Rental ID: {item.rentalId}</Paragraph>
          </View>
          <Chip 
            style={{ backgroundColor: item.status === 'paid' ? '#52c41a' : '#fa8c16' }}
            textStyle={{ color: 'white' }}
          >
            {item.status?.toUpperCase() || 'PENDING'}
          </Chip>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Paragraph style={styles.detailLabel}>Fine Type:</Paragraph>
            <Chip style={styles.chip}>{item.fineType || 'N/A'}</Chip>
          </View>
          <View style={styles.detailRow}>
            <Paragraph style={styles.detailLabel}>Amount:</Paragraph>
            <Title style={[styles.detailValue, styles.amountValue]}>
              {item.fineAmount?.toLocaleString() || '0'} VND
            </Title>
          </View>
          {item.dueDate && (
            <View style={styles.detailRow}>
              <Paragraph style={styles.detailLabel}>Due Date:</Paragraph>
              <Paragraph style={styles.detailValue}>
                {new Date(item.dueDate).toLocaleDateString()}
              </Paragraph>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderRefundItem = ({ item }) => (
    <Card style={styles.itemCard} mode="outlined">
      <Card.Content>
        <View style={styles.itemHeader}>
          <Avatar.Icon size={40} icon="undo" style={{ backgroundColor: '#1890ff' }} />
          <View style={styles.itemInfo}>
            <Title style={styles.itemTitle}>{item.kitName || 'Refund'}</Title>
            <Paragraph style={styles.itemId}>Rental ID: {item.rentalId}</Paragraph>
          </View>
          <Chip 
            style={{ backgroundColor: item.status === 'approved' ? '#52c41a' : '#fa8c16' }}
            textStyle={{ color: 'white' }}
          >
            {item.status?.toUpperCase() || 'PENDING'}
          </Chip>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Paragraph style={styles.detailLabel}>Refund Type:</Paragraph>
            <Chip style={styles.chip}>{item.refundType || 'N/A'}</Chip>
          </View>
          <View style={styles.detailRow}>
            <Paragraph style={styles.detailLabel}>Original Amount:</Paragraph>
            <Paragraph style={styles.detailValue}>
              {item.originalAmount?.toLocaleString() || '0'} VND
            </Paragraph>
          </View>
          <View style={styles.detailRow}>
            <Paragraph style={styles.detailLabel}>Refund Amount:</Paragraph>
            <Title style={[styles.detailValue, styles.amountValue]}>
              {item.refundAmount?.toLocaleString() || '0'} VND
            </Title>
          </View>
          {item.requestDate && (
            <View style={styles.detailRow}>
              <Paragraph style={styles.detailLabel}>Request Date:</Paragraph>
              <Paragraph style={styles.detailValue}>
                {new Date(item.requestDate).toLocaleDateString()}
              </Paragraph>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const totalFines = lecturerFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const totalRefunds = lecturerRefunds.reduce((sum, refund) => sum + (refund.refundAmount || 0), 0);
  const pendingItems = lecturerFines.filter(f => f.status === 'pending').length + 
                       lecturerRefunds.filter(r => r.status === 'pending').length;

  return (
    <LecturerLayout title="Fines & Refunds">
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCard} mode="elevated">
            <Card.Content style={styles.summaryContent}>
              <Avatar.Icon size={48} icon="alert" style={{ backgroundColor: '#ff4d4f' }} />
              <Title style={styles.summaryValue}>{totalFines.toLocaleString()} VND</Title>
              <Paragraph style={styles.summaryLabel}>Total Fines</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.summaryCard} mode="elevated">
            <Card.Content style={styles.summaryContent}>
              <Avatar.Icon size={48} icon="undo" style={{ backgroundColor: '#52c41a' }} />
              <Title style={styles.summaryValue}>{totalRefunds.toLocaleString()} VND</Title>
              <Paragraph style={styles.summaryLabel}>Total Refunds</Paragraph>
            </Card.Content>
          </Card>
          <Card style={styles.summaryCard} mode="elevated">
            <Card.Content style={styles.summaryContent}>
              <Avatar.Icon size={48} icon="bell" style={{ backgroundColor: '#fa8c16' }} />
              <Title style={styles.summaryValue}>{pendingItems}</Title>
              <Paragraph style={styles.summaryLabel}>Pending Items</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Fines Section */}
        <Card style={styles.section} mode="elevated">
          <Card.Title title="My Fines" left={(props) => <Avatar.Icon {...props} icon="alert" size={32} style={{ backgroundColor: '#fa8c16' }} />} />
          <Card.Content>
          {lecturerFines.length > 0 ? (
            <FlatList
              data={lecturerFines}
              renderItem={renderFineItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Avatar.Icon size={48} icon="check-circle" style={{ backgroundColor: '#ccc' }} />
              <Paragraph style={styles.emptyText}>No fines found</Paragraph>
            </View>
          )}
          </Card.Content>
        </Card>

        {/* Refunds Section */}
        <Card style={styles.section} mode="elevated">
          <Card.Title title="My Refunds" left={(props) => <Avatar.Icon {...props} icon="undo" size={32} style={{ backgroundColor: '#1890ff' }} />} />
          <Card.Content>
          {lecturerRefunds.length > 0 ? (
            <FlatList
              data={lecturerRefunds}
              renderItem={renderRefundItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Avatar.Icon size={48} icon="information" style={{ backgroundColor: '#ccc' }} />
              <Paragraph style={styles.emptyText}>No refunds found</Paragraph>
            </View>
          )}
          </Card.Content>
        </Card>
      </ScrollView>
      )}
    </LecturerLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  itemCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
  },
  itemId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemDetails: {
    marginLeft: 52,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  amountValue: {
    color: '#1890ff',
    fontSize: 18,
  },
  chip: {
    backgroundColor: '#667eea',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default LecturerFinesRefunds;

