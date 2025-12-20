import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, Text } from 'react-native';
import { Appbar, useTheme, Badge, Card, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { notificationAPI } from '../services/api';
import dayjs from 'dayjs';

const LeaderLayout = ({ 
  title, 
  children, 
  showBackButton = false,
  rightAction = null,
  onRightAction = null,
  rightActionBadge = null,
}) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);
      // Use user-specific notifications instead of role-based to match web behavior
      const response = await notificationAPI.getMyNotifications();
      const data = response?.data ?? response;
      const notificationsList = Array.isArray(data) ? data : [];
      // Sort by createdAt descending (newest first)
      notificationsList.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleMenuPress = () => {
    if (navigation && navigation.openDrawer) {
      navigation.openDrawer();
    }
  };

  const handleNotificationPress = () => {
    setNotificationModalVisible(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state to mark as read
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(item => !item.isRead);
      await Promise.all(
        unreadNotifications.map(notif => notificationAPI.markAsRead(notif.id))
      );
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;

  const notificationTypeStyles = {
    ALERT: { color: '#ff4d4f', label: 'Cảnh báo' },
    DEPOSIT: { color: '#52c41a', label: 'Giao dịch ví' },
    SYSTEM: { color: '#1890ff', label: 'Hệ thống' },
    USER: { color: '#722ed1', label: 'Người dùng' }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dayjs(dateString);
    return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
  };

  const renderNotificationItem = ({ item }) => {
    const typeInfo = notificationTypeStyles[item.type] || { color: '#1890ff', label: item.type || 'Thông báo' };
    const notificationDate = formatDateTime(item.createdAt);

    return (
      <TouchableOpacity
        onPress={() => {
          if (!item.isRead) {
            handleMarkAsRead(item.id);
          }
        }}
        activeOpacity={0.7}
      >
        <Card 
          style={[
            styles.notificationCard,
            !item.isRead && styles.unreadNotification
          ]}
          mode="outlined"
        >
          <Card.Content>
            <View style={styles.notificationHeader}>
              <View style={[styles.notificationTypeBadge, { backgroundColor: `${typeInfo.color}15` }]}>
                <Text style={[styles.notificationTypeText, { color: typeInfo.color }]}>
                  {typeInfo.label}
                </Text>
              </View>
              {!item.isRead && (
                <View style={styles.unreadDot} />
              )}
            </View>
            <Text style={styles.notificationTitle}>{item.title || item.subType || 'Thông báo'}</Text>
            <Paragraph style={styles.notificationMessage}>{item.message || ''}</Paragraph>
            <Text style={styles.notificationDate}>{notificationDate}</Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header 
        style={{ backgroundColor: theme.colors.primary }}
        elevated
      >
        {showBackButton ? (
          <Appbar.BackAction onPress={() => navigation?.goBack?.()} color={theme.colors.onPrimary} />
        ) : (
          <Appbar.Action 
            icon="menu" 
            onPress={handleMenuPress} 
            color={theme.colors.onPrimary}
            size={24}
          />
        )}
        <Appbar.Content 
          title={title} 
          titleStyle={{ 
            color: theme.colors.onPrimary,
            fontSize: 20,
            fontWeight: 'bold',
          }}
        />
        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={styles.notificationButton}
          >
            <Icon name="notifications" size={24} color={theme.colors.onPrimary} />
            {unreadNotificationsCount > 0 && (
              <Badge 
                style={[styles.badge, { backgroundColor: theme.colors.error }]}
                size={18}
              >
                {unreadNotificationsCount}
              </Badge>
            )}
          </TouchableOpacity>
          {rightAction && (
            <View style={styles.rightActionContainer}>
              <Appbar.Action 
                icon={rightAction.icon} 
                onPress={onRightAction || (() => {})}
                color={theme.colors.onPrimary}
                size={24}
              />
              {rightActionBadge && (
                <Badge 
                  style={[styles.badge, { backgroundColor: theme.colors.error }]}
                  size={18}
                >
                  {rightActionBadge}
                </Badge>
              )}
            </View>
          )}
        </View>
      </Appbar.Header>
      <View style={styles.content}>
        {children}
      </View>

      {/* Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thông báo</Text>
            <View style={styles.modalHeaderActions}>
              {unreadNotificationsCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  style={styles.markAllAsReadButton}
                >
                  <Text style={styles.markAllAsReadText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setNotificationModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {notificationLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Đang tải...</Text>
            </View>
          ) : notifications.length > 0 ? (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.notificationList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="notifications-none" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>Không có thông báo</Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="notifications-none" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Không có thông báo</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActionContainer: {
    position: 'relative',
  },
  notificationButton: {
    position: 'relative',
    marginRight: 8,
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#667eea',
    paddingTop: 50,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  markAllAsReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  markAllAsReadText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  notificationList: {
    padding: 16,
  },
  notificationCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default LeaderLayout;