import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { kitComponentAPI } from '../../services/api';

const COMPONENT_TYPE_OPTIONS = ['BOX', 'SET', 'UNIT'];
const STATUS_OPTIONS = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DAMAGED'];

const AdminKitComponents = ({ onLogout }) => {
  const navigation = useNavigation();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [formData, setFormData] = useState({
    componentName: '',
    seriNumber: '',
    componentType: '',
    quantityTotal: 1,
    quantityAvailable: 1,
    pricePerCom: 0,
    status: 'AVAILABLE',
    description: '',
    imageUrl: '',
    link: '',
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const response = await kitComponentAPI.getAllComponents();
      const data = Array.isArray(response) ? response : (response?.data || []);
      // Only keep global components that are not linked to any specific kit (kitId == null)
      const globalComponents = (Array.isArray(data) ? data : []).filter(
        (component) => component.kitId == null
      );
      setComponents(globalComponents);
    } catch (error) {
      console.error('Error loading components:', error);
      Alert.alert('Error', 'Failed to load kit components');
      setComponents([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadComponents();
    setRefreshing(false);
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

  const openAddModal = () => {
    setEditingComponent(null);
    setTypeDropdownVisible(false);
    setStatusDropdownVisible(false);
    setFormData({
      componentName: '',
      seriNumber: '',
      componentType: COMPONENT_TYPE_OPTIONS[0],
      quantityTotal: 1,
      quantityAvailable: 1,
      pricePerCom: 0,
      status: 'AVAILABLE',
      description: '',
      imageUrl: '',
      link: '',
    });
    setEditModalVisible(true);
  };

  const openEditModal = (component) => {
    setEditingComponent(component);
    setTypeDropdownVisible(false);
    setStatusDropdownVisible(false);
    setFormData({
      componentName: component.componentName || component.name || '',
      seriNumber: component.seriNumber || '',
      componentType:
        component.componentType ||
        component.type ||
        COMPONENT_TYPE_OPTIONS[0],
      quantityTotal: component.quantityTotal || component.quantityAvailable || 1,
      quantityAvailable: component.quantityAvailable || 1,
      pricePerCom: component.pricePerCom || 0,
      status: component.status || 'AVAILABLE',
      description: component.description || '',
      imageUrl: component.imageUrl || '',
      link: component.link || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveComponent = async () => {
    if (!formData.componentName.trim()) {
      Alert.alert('Error', 'Please enter component name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        kitId: null,
        componentName: formData.componentName,
        seriNumber: formData.seriNumber,
        componentType: formData.componentType,
        description: formData.description || '',
        quantityTotal: formData.quantityTotal,
        quantityAvailable: formData.quantityAvailable,
        pricePerCom: formData.pricePerCom || 0,
        status: formData.status,
        imageUrl: formData.imageUrl || '',
        link: formData.link || '',
      };

      if (editingComponent && editingComponent.id) {
        await kitComponentAPI.updateComponent(editingComponent.id, payload);
        Alert.alert('Success', 'Component updated successfully');
      } else {
        await kitComponentAPI.createComponent(payload);
        Alert.alert('Success', 'Component created successfully');
      }

      setEditModalVisible(false);
      setEditingComponent(null);
      await loadComponents();
    } catch (error) {
      console.error('Error saving component:', error);
      Alert.alert('Error', 'Failed to save component');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComponent = async (component) => {
    Alert.alert(
      'Confirm Delete',
      `Delete component "${component.componentName || component.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await kitComponentAPI.deleteComponent(component.id);
              Alert.alert('Success', 'Component deleted successfully');
              await loadComponents();
            } catch (error) {
              console.error('Error deleting component:', error);
              Alert.alert('Error', 'Failed to delete component');
            }
          },
        },
      ]
    );
  };

  const filteredComponents = components.filter((component) => {
    const search = searchText.trim().toLowerCase();
    const matchesSearch =
      !search ||
      component.componentName?.toLowerCase().includes(search) ||
      component.name?.toLowerCase().includes(search) ||
      component.id?.toString().includes(search);

    const matchesStatus =
      statusFilter === 'all' || (component.status || '').toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const renderComponentItem = ({ item }) => {
    const typeLabel = item.componentType || item.type || 'N/A';
    const statusUpper = (item.status || 'UNKNOWN').toUpperCase();
    const isAvailable = statusUpper === 'AVAILABLE';

    // Type color mapping
    const getTypeColor = (type) => {
      switch (type) {
        case 'BOX': return '#faad14';
        case 'SET': return '#1890ff';
        case 'UNIT': return '#52c41a';
        default: return '#722ed1';
      }
    };
    const typeColor = getTypeColor(typeLabel);

    return (
      <View style={styles.componentCard}>
        {/* Image Area with Overlays */}
        <View style={styles.imageContainer}>
          {item.imageUrl && item.imageUrl !== 'null' && item.imageUrl !== 'undefined' ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.componentImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.componentImagePlaceholder, { backgroundColor: typeColor }]}>
              <Icon name="memory" size={32} color="#fff" />
            </View>
          )}

          {/* Status Overlay (Top Right) */}
          <View style={[
            styles.statusOverlay,
            { backgroundColor: isAvailable ? 'rgba(82, 196, 26, 0.9)' : 'rgba(255, 77, 79, 0.9)' }
          ]}>
            <Text style={styles.statusOverlayText}>
              {isAvailable ? 'AVAIL' : 'UNAVAIL'}
            </Text>
          </View>

          {/* Type Overlay (Bottom Left) */}
          <View style={[styles.typeOverlay, { backgroundColor: typeColor }]}>
            <Text style={styles.typeOverlayText}>{typeLabel}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.componentCardContent}>
          <Text style={styles.componentName} numberOfLines={2}>
            {item.componentName || item.name || 'Component'}
          </Text>

          <Text style={styles.componentPrice}>
            {(item.pricePerCom || 0).toLocaleString('vi-VN')} đ
          </Text>

          <View style={styles.componentStats}>
            <Icon name="inventory" size={14} color="#666" />
            <Text style={styles.componentStatsText}>
              <Text style={{ fontWeight: '700', color: '#333' }}>
                {item.quantityAvailable ?? 0}
              </Text>
              /{item.quantityTotal ?? item.quantityAvailable ?? 0} left
            </Text>
          </View>

          <View style={styles.componentActionsRow}>
            <TouchableOpacity
              style={[styles.actionIconButton, { backgroundColor: '#e6f7ff' }]}
              onPress={() => openEditModal(item)}
            >
              <Icon name="edit" size={18} color="#1890ff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconButton, { backgroundColor: '#fff1f0' }]}
              onPress={() => handleDeleteComponent(item)}
            >
              <Icon name="delete" size={18} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kit Components</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters & actions */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search components..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All Status
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'AVAILABLE' && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter('AVAILABLE')}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === 'AVAILABLE' && styles.filterChipTextActive,
              ]}
            >
              Available
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === 'UNAVAILABLE' && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter('UNAVAILABLE')}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === 'UNAVAILABLE' && styles.filterChipTextActive,
              ]}
            >
              Unavailable
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={openAddModal}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Add Component</Text>
          </TouchableOpacity>
        </View>

        {/* Components list */}
        <View style={styles.listContainer}>
          {filteredComponents.length > 0 ? (
            <FlatList
              data={filteredComponents}
              renderItem={renderComponentItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="memory" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No components found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit/Add Component Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingComponent ? 'Edit Component' : 'Add Component'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.componentName}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, componentName: text }))
                  }
                  placeholder="Component name"
                />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Seri Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.seriNumber}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, seriNumber: text }))
                  }
                  placeholder="Serial Number"
                />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Type</Text>
                <TouchableOpacity
                  style={styles.formSelect}
                  onPress={() =>
                    setTypeDropdownVisible((prevVisible) => !prevVisible)
                  }
                >
                  <Text
                    style={
                      formData.componentType
                        ? styles.formSelectText
                        : styles.formSelectPlaceholder
                    }
                  >
                    {formData.componentType || 'Select type'}
                  </Text>
                  <Icon
                    name={
                      typeDropdownVisible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {typeDropdownVisible && (
                  <View style={styles.dropdownOptions}>
                    {COMPONENT_TYPE_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dropdownOption,
                          formData.componentType === option &&
                          styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setFormData((prev) => ({
                            ...prev,
                            componentType: option,
                          }));
                          setTypeDropdownVisible(false);
                        }}
                      >
                        <View
                          style={[
                            styles.typeColorDot,
                            {
                              backgroundColor:
                                option === 'BOX'
                                  ? '#faad14'
                                  : option === 'SET'
                                    ? '#1890ff'
                                    : option === 'UNIT'
                                      ? '#52c41a'
                                      : '#f0f0f0',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            formData.componentType === option &&
                            styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.formRowInline}>
                <View style={styles.formColumn}>
                  <Text style={styles.formLabel}>Total</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={String(formData.quantityTotal)}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantityTotal: Number(text) || 0,
                      }))
                    }
                  />
                </View>
                <View style={styles.formColumn}>
                  <Text style={styles.formLabel}>Available</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={String(formData.quantityAvailable)}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantityAvailable: Number(text) || 0,
                      }))
                    }
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Price per component</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={String(formData.pricePerCom)}
                  onChangeText={(text) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricePerCom: Number(text) || 0,
                    }))
                  }
                  placeholder="Price (VND)"
                />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Status</Text>
                <TouchableOpacity
                  style={styles.formSelect}
                  onPress={() =>
                    setStatusDropdownVisible((prevVisible) => !prevVisible)
                  }
                >
                  <Text
                    style={
                      formData.status
                        ? styles.formSelectText
                        : styles.formSelectPlaceholder
                    }
                  >
                    {formData.status || 'Select status'}
                  </Text>
                  <Icon
                    name={
                      statusDropdownVisible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {statusDropdownVisible && (
                  <View style={styles.dropdownOptions}>
                    {STATUS_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dropdownOption,
                          formData.status === option &&
                          styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setFormData((prev) => ({
                            ...prev,
                            status: option,
                          }));
                          setStatusDropdownVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            formData.status === option &&
                            styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Image URL</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.imageUrl}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, imageUrl: text }))
                  }
                  placeholder="https://..."
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Link</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.link}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, link: text }))
                  }
                  placeholder="Reference link"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, description: text }))
                  }
                  placeholder="Description"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveComponent}
              >
                <Text style={styles.modalButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#667eea15',
    borderColor: '#667eea',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#667eea',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    marginTop: 6,
    paddingBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  componentCard: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0,
    marginBottom: 0,
  },
  imageContainer: {
    position: 'relative',
    height: 100,
    width: '100%',
  },
  componentImage: {
    width: '100%',
    height: '100%',
  },
  componentImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusOverlayText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  typeOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  typeOverlayText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  componentCardContent: {
    padding: 12,
  },
  componentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 18,
    height: 36, // Fixed height for 2 lines
  },
  componentPrice: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: '700',
    marginBottom: 8,
  },
  componentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  componentStatsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  componentActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionIconButton: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  // Legacy styles kept for reference if needed, but unused in new layout:
  actionButtonText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 16,
  },
  formRow: {
    marginBottom: 12,
  },
  formRowInline: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formColumn: {
    flex: 1,
  },
  formLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  formInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  formSelect: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formSelectText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  formSelectPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  dropdownOptions: {
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownOptionSelected: {
    backgroundColor: '#667eea15',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
    color: '#667eea',
  },
  typeColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    backgroundColor: '#667eea',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminKitComponents;
