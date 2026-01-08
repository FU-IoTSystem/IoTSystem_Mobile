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
import { kitAPI, kitComponentAPI } from '../../services/api';

const COMPONENT_TYPES = ['BOX', 'SET', 'UNIT'];

const AdminKits = ({ onLogout }) => {
  const navigation = useNavigation();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [componentModalVisible, setComponentModalVisible] = useState(false);
  const [kitDetailsModalVisible, setKitDetailsModalVisible] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [editingKit, setEditingKit] = useState(null);
  const [components, setComponents] = useState([]);
  const [editingComponent, setEditingComponent] = useState(null);
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [componentPage, setComponentPage] = useState(1);
  const componentPageSize = 6;
  const [statusFilterModalVisible, setStatusFilterModalVisible] = useState(false);
  const [typeFilterModalVisible, setTypeFilterModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    kitName: '',
    type: 'STUDENT_KIT',
    quantityTotal: 1,
    quantityAvailable: 1,
    status: 'AVAILABLE',
    description: '',
    imageUrl: '',
  });
  const [componentFormData, setComponentFormData] = useState({
    componentName: '',
    componentType: 'RED',
    quantityTotal: 1,
    quantityAvailable: 1,
    pricePerCom: 0,
    status: 'AVAILABLE',
    description: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadKits();
  }, []);

  const loadKits = async () => {
    setLoading(true);
    try {
      const kitsResponse = await kitAPI.getAllKits();
      const kitsData = Array.isArray(kitsResponse)
        ? kitsResponse
        : (kitsResponse?.data || []);
      setKits(kitsData);
    } catch (error) {
      console.error('Error loading kits:', error);
      Alert.alert('Error', 'Failed to load kits');
    } finally {
      setLoading(false);
    }
  };

  // Filter kits based on search and filters
  const filteredKits = kits.filter(kit => {
    const matchesSearch = !searchText ||
      kit.kitName?.toLowerCase().includes(searchText.toLowerCase()) ||
      kit.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      kit.id?.toString().includes(searchText);
    const matchesStatus = filterStatus === 'all' || kit.status === filterStatus;
    const matchesType = filterType === 'all' || kit.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const showKitDetails = async (kit) => {
    setSelectedKit(kit);
    setComponentPage(1);
    const kitComponents = await loadComponents(kit.id);
    setComponents(kitComponents);
    setKitDetailsModalVisible(true);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  const loadComponents = async (kitId) => {
    try {
      const kitResponse = await kitAPI.getKitById(kitId);
      const kitData = kitResponse?.data || kitResponse;
      return kitData?.components || [];
    } catch (error) {
      console.error('Error loading components:', error);
      return [];
    }
  };

  const handleAddKit = () => {
    setEditingKit(null);
    setFormData({
      kitName: '',
      type: 'STUDENT_KIT',
      quantityTotal: 1,
      quantityAvailable: 1,
      status: 'AVAILABLE',
      description: '',
      imageUrl: '',
    });
    setModalVisible(true);
  };

  const handleEditKit = (kit) => {
    setEditingKit(kit);
    setFormData({
      kitName: kit.kitName || kit.name || '',
      type: kit.type || 'STUDENT_KIT',
      quantityTotal: kit.quantityTotal || 1,
      quantityAvailable: kit.quantityAvailable || 1,
      status: kit.status || 'AVAILABLE',
      description: kit.description || '',
      imageUrl: kit.imageUrl || '',
    });
    setModalVisible(true);
  };

  const handleManageComponents = async (kit) => {
    setSelectedKit(kit);
    const kitComponents = await loadComponents(kit.id);
    setComponents(kitComponents);
    setComponentModalVisible(true);
  };

  const handleDeleteKit = (kit) => {
    Alert.alert(
      'Delete Kit',
      `Are you sure you want to delete ${kit.kitName || kit.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await kitAPI.deleteKit(kit.id);
              Alert.alert('Success', 'Kit deleted successfully');
              await loadKits();
            } catch (error) {
              console.error('Error deleting kit:', error);
              Alert.alert('Error', 'Failed to delete kit');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveKit = async () => {
    if (!formData.kitName.trim()) {
      Alert.alert('Error', 'Please enter kit name');
      return;
    }

    setLoading(true);
    try {
      if (editingKit) {
        // Update existing kit
        const kitData = {
          kitName: formData.kitName,
          type: formData.type,
          quantityTotal: formData.quantityTotal,
          quantityAvailable: formData.quantityAvailable,
          status: formData.status,
          description: formData.description,
          imageUrl: formData.imageUrl,
        };
        await kitAPI.updateKit(editingKit.id, kitData);
        Alert.alert('Success', 'Kit updated successfully');
      } else {
        // Create new kit
        const kitData = {
          kitName: formData.kitName,
          type: formData.type,
          quantityTotal: formData.quantityTotal,
          quantityAvailable: formData.quantityAvailable,
          status: 'AVAILABLE',
          description: formData.description,
          imageUrl: formData.imageUrl,
        };
        await kitAPI.createSingleKit(kitData);
        Alert.alert('Success', 'Kit created successfully');
      }
      setModalVisible(false);
      await loadKits();
    } catch (error) {
      console.error('Error saving kit:', error);
      Alert.alert('Error', 'Failed to save kit');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = () => {
    setEditingComponent(null);
    setIsAddingComponent(true);
    setComponentFormData({
      componentName: '',
      componentType: 'UNIT',
      seriNumber: '',
      quantityTotal: 1,
      quantityAvailable: 1,
      pricePerCom: 0,
      status: 'AVAILABLE',
      description: '',
      imageUrl: '',
    });
    setComponentModalVisible(true);
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setIsAddingComponent(false);
    setComponentFormData({
      componentName: component.componentName || component.name || '',
      componentType: component.componentType || 'UNIT',
      seriNumber: component.seriNumber || '',
      quantityTotal: component.quantityTotal || 1,
      quantityAvailable: component.quantityAvailable || 1,
      pricePerCom: component.pricePerCom || 0,
      status: component.status || 'AVAILABLE',
      description: component.description || '',
      imageUrl: component.imageUrl || '',
    });
  };

  const handleSaveComponent = async () => {
    if (!componentFormData.componentName.trim()) {
      Alert.alert('Error', 'Please enter component name');
      return;
    }

    setLoading(true);
    try {
      const componentData = {
        kitId: selectedKit.id,
        componentName: componentFormData.componentName,
        componentType: componentFormData.componentType,
        quantityTotal: componentFormData.quantityTotal,
        quantityAvailable: componentFormData.quantityAvailable,
        pricePerCom: componentFormData.pricePerCom || 0,
        status: componentFormData.status,
        description: componentFormData.description || '',
        imageUrl: componentFormData.imageUrl || '',
      };

      if (editingComponent) {
        await kitComponentAPI.updateComponent(editingComponent.id, componentData);
        Alert.alert('Success', 'Component updated successfully');
      } else {
        await kitComponentAPI.createComponent(componentData);
        Alert.alert('Success', 'Component created successfully');
      }

      // Reload components
      const updatedComponents = await loadComponents(selectedKit.id);
      setComponents(updatedComponents);
      setEditingComponent(null);
      setIsAddingComponent(false);
      setComponentFormData({
        componentName: '',
        componentType: 'UNIT',
        quantityTotal: 1,
        quantityAvailable: 1,
        pricePerCom: 0,
        status: 'AVAILABLE',
        description: '',
        imageUrl: '',
      });
    } catch (error) {
      console.error('Error saving component:', error);
      Alert.alert('Error', 'Failed to save component');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComponent = async (componentId) => {
    Alert.alert(
      'Delete Component',
      'Are you sure you want to delete this component?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await kitComponentAPI.deleteComponent(componentId);
              const updatedComponents = await loadComponents(selectedKit.id);
              setComponents(updatedComponents);
              Alert.alert('Success', 'Component deleted successfully');
            } catch (error) {
              console.error('Error deleting component:', error);
              Alert.alert('Error', 'Failed to delete component');
            }
          },
        },
      ]
    );
  };

  const renderKitItem = ({ item }) => (
    <TouchableOpacity
      style={styles.kitCard}
      onPress={() => showKitDetails(item)}
      activeOpacity={0.8}
    >
      {/* Kit Image */}
      <View style={styles.kitImageContainer}>
        {item.imageUrl && item.imageUrl !== 'null' && item.imageUrl !== 'undefined' ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.kitImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.kitImagePlaceholder}>
            <Icon name="build" size={48} color="#fff" />
          </View>
        )}
        <View style={styles.kitImageBadge}>
          <View style={[
            styles.badge,
            { backgroundColor: item.status === 'AVAILABLE' ? '#52c41a' : '#faad14' }
          ]}>
            <Text style={[styles.badgeText, { color: '#fff' }]}>
              {item.status || 'AVAILABLE'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.kitCardContent}>
        <View style={styles.kitHeader}>
          <Text style={styles.kitName} numberOfLines={2}>
            {item.kitName || item.name || 'N/A'}
          </Text>
          <View style={[
            styles.badge,
            { backgroundColor: item.type === 'LECTURER_KIT' ? '#ff4d4f15' : '#1890ff15' }
          ]}>
            <Text style={[
              styles.badgeText,
              { color: item.type === 'LECTURER_KIT' ? '#ff4d4f' : '#1890ff' }
            ]}>
              {item.type === 'LECTURER_KIT' ? 'Lecturer' : 'Student'}
            </Text>
          </View>
        </View>

        <View style={styles.kitDetails}>
          <View style={styles.detailRow}>
            <Icon name="inventory-2" size={14} color="#666" />
            <Text style={styles.detailText}>
              Total: {item.quantityTotal || 0}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="check-circle" size={14} color="#52c41a" />
            <Text style={[styles.detailText, { color: '#52c41a' }]}>
              Available: {item.quantityAvailable || 0}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="extension" size={14} color="#722ed1" />
            <Text style={styles.detailText}>
              Components: {item.components?.length || 0}
            </Text>
          </View>
        </View>

        <View style={styles.kitActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#1890ff15', flex: 1 }]}
            onPress={(e) => {
              e.stopPropagation();
              handleEditKit(item);
            }}
          >
            <Icon name="edit" size={20} color="#1890ff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#722ed115', flex: 1 }]}
            onPress={(e) => {
              e.stopPropagation();
              handleManageComponents(item);
            }}
          >
            <Icon name="settings" size={20} color="#722ed1" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ff4d4f15', flex: 1 }]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteKit(item);
            }}
          >
            <Icon name="delete" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.openDrawer()}
          >
            <Icon name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kit Management</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddKit}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter Section */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setStatusFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>
              {filterStatus === 'all' ? 'All Status' : filterStatus}
            </Text>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setTypeFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>
              {filterType === 'all' ? 'All Types' : filterType === 'STUDENT_KIT' ? 'Student Kit' : 'Lecturer Kit'}
            </Text>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredKits}
        renderItem={renderKitItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadKits} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inventory-2" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText || filterStatus !== 'all' || filterType !== 'all'
                ? 'No kits match your filters'
                : 'No kits available'}
            </Text>
            {(!searchText && filterStatus === 'all' && filterType === 'all') && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddKit}>
                <Text style={styles.emptyButtonText}>Add First Kit</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          filteredKits.length > 0 ? (
            <View style={styles.footerText}>
              <Text style={styles.footerTextContent}>
                Showing {filteredKits.length} of {kits.length} kit(s)
              </Text>
            </View>
          ) : null
        }
      />

      {/* Add/Edit Kit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingKit ? 'Edit Kit' : 'Add Kit'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Kit Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.kitName}
                  onChangeText={(text) => setFormData({ ...formData, kitName: text })}
                  placeholder="Enter kit name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kit Type *</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'STUDENT_KIT' && styles.typeButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'STUDENT_KIT' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === 'STUDENT_KIT' && styles.typeButtonTextActive
                    ]}>
                      Student Kit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'LECTURER_KIT' && styles.typeButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'LECTURER_KIT' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === 'LECTURER_KIT' && styles.typeButtonTextActive
                    ]}>
                      Lecturer Kit
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Total Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantityTotal.toString()}
                    onChangeText={(text) => setFormData({
                      ...formData,
                      quantityTotal: parseInt(text) || 0
                    })}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Available Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantityAvailable.toString()}
                    onChangeText={(text) => setFormData({
                      ...formData,
                      quantityAvailable: parseInt(text) || 0
                    })}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status *</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === 'AVAILABLE' && styles.statusButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, status: 'AVAILABLE' })}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === 'AVAILABLE' && styles.statusButtonTextActive
                    ]}>
                      Available
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === 'IN_USE' && styles.statusButtonActive
                    ]}
                    onPress={() => setFormData({ ...formData, status: 'IN_USE' })}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === 'IN_USE' && styles.statusButtonTextActive
                    ]}>
                      In Use
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Enter description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                  placeholder="Enter image URL"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveKit}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : editingKit ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Component Management Modal */}
      <Modal
        visible={componentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setComponentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Components - {selectedKit?.kitName || selectedKit?.name || 'Kit'}
              </Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity
                  style={styles.addComponentButton}
                  onPress={handleAddComponent}
                >
                  <Icon name="add" size={20} color="#667eea" />
                  <Text style={styles.addComponentText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setComponentModalVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={components}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              renderItem={({ item }) => (
                <View style={styles.componentItem}>
                  <View style={styles.componentInfo}>
                    <Text style={styles.componentName}>
                      {item.componentName || item.name || 'N/A'}
                    </Text>
                    <Text style={styles.componentDetails}>
                      Type: {item.componentType || 'N/A'} | Qty: {item.quantityTotal || 0}
                    </Text>
                    <Text style={styles.componentDetails}>
                      Price: {item.pricePerCom?.toLocaleString('vi-VN') || 0} VND
                    </Text>
                  </View>
                  <View style={styles.componentActions}>
                    <TouchableOpacity
                      style={styles.componentActionButton}
                      onPress={() => handleEditComponent(item)}
                    >
                      <Icon name="edit" size={18} color="#1890ff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.componentActionButton}
                      onPress={() => handleDeleteComponent(item.id)}
                    >
                      <Icon name="delete" size={18} color="#ff4d4f" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Icon name="extension" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No components</Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={handleAddComponent}
                  >
                    <Text style={styles.emptyButtonText}>Add Component</Text>
                  </TouchableOpacity>
                </View>
              }
            />

            {/* Component Form - Show if editing OR adding */}
            {(editingComponent || isAddingComponent) && (
              <View style={styles.componentFormCard}>
                <View style={styles.componentFormHeader}>
                  <Text style={styles.componentFormTitle}>
                    {editingComponent ? 'Edit Component' : 'Add New Component'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingComponent(null);
                      setIsAddingComponent(false);
                    }}
                    style={styles.closeIconBtn}
                  >
                    <Icon name="close" size={20} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* Name Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Component Name</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="label-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputWithIcon}
                      value={componentFormData.componentName}
                      onChangeText={(text) => setComponentFormData({
                        ...componentFormData,
                        componentName: text
                      })}
                      placeholder="e.g. Raspberry Pi 4"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                </View>

                {/* Serial Number Input */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Serial Number</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="qr-code" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.inputWithIcon}
                      value={componentFormData.seriNumber}
                      onChangeText={(text) => setComponentFormData({
                        ...componentFormData,
                        seriNumber: text
                      })}
                      placeholder="Enter Serial Number"
                      placeholderTextColor="#ccc"
                    />
                  </View>
                </View>

                {/* Quantity & Price Row */}
                <View style={styles.formRow}>
                  <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Total Quantity</Text>
                    <View style={styles.inputContainer}>
                      <Icon name="format-list-numbered" size={20} color="#999" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        value={componentFormData.quantityTotal.toString()}
                        onChangeText={(text) => setComponentFormData({
                          ...componentFormData,
                          quantityTotal: parseInt(text) || 0
                        })}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#ccc"
                      />
                    </View>
                  </View>
                  <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Price (VND)</Text>
                    <View style={styles.inputContainer}>
                      <Icon name="attach-money" size={20} color="#999" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        value={componentFormData.pricePerCom.toString()}
                        onChangeText={(text) => setComponentFormData({
                          ...componentFormData,
                          pricePerCom: parseInt(text) || 0
                        })}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#ccc"
                      />
                    </View>
                  </View>
                </View>

                {/* Type & Status Row */}
                <View style={styles.formRow}>
                  <View style={[styles.inputWrapper, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Type</Text>
                    <View style={styles.statusToggleContainer}>
                      {COMPONENT_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.statusToggleOption,
                            componentFormData.componentType === type && styles.statusToggleOptionActive
                          ]}
                          onPress={() => setComponentFormData({ ...componentFormData, componentType: type })}
                        >
                          <Text style={[
                            styles.statusToggleText,
                            componentFormData.componentType === type && styles.statusToggleTextActive
                          ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Status</Text>
                    <View style={styles.statusToggleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.statusToggleOption,
                          componentFormData.status === 'AVAILABLE' && styles.statusToggleOptionActive
                        ]}
                        onPress={() => setComponentFormData({ ...componentFormData, status: 'AVAILABLE' })}
                      >
                        <Text style={[
                          styles.statusToggleText,
                          componentFormData.status === 'AVAILABLE' && styles.statusToggleTextActive
                        ]}>
                          Available
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.statusToggleOption,
                          componentFormData.status === 'UNAVAILABLE' && styles.statusToggleOptionInactiveActive
                        ]}
                        onPress={() => setComponentFormData({ ...componentFormData, status: 'UNAVAILABLE' })}
                      >
                        <Text style={[
                          styles.statusToggleText,
                          componentFormData.status === 'UNAVAILABLE' && styles.statusToggleTextInactive
                        ]}>
                          Unavailable
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => {
                      setEditingComponent(null);
                      setIsAddingComponent(false);
                    }}
                  >
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={handleSaveComponent}
                  >
                    <Text style={styles.btnPrimaryText}>
                      {editingComponent ? 'Save Changes' : 'Create Component'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Kit Details Modal */}
      <Modal
        visible={kitDetailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setKitDetailsModalVisible(false);
          setSelectedKit(null);
          setComponentPage(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Icon name="info" size={24} color="#1890ff" />
                <Text style={styles.modalTitle}>Kit Details</Text>
              </View>
              <TouchableOpacity onPress={() => {
                setKitDetailsModalVisible(false);
                setSelectedKit(null);
                setComponentPage(1);
              }}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedKit && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Kit Image */}
                {selectedKit.imageUrl && selectedKit.imageUrl !== 'null' && selectedKit.imageUrl !== 'undefined' ? (
                  <View style={styles.detailsImageContainer}>
                    <Image
                      source={{ uri: selectedKit.imageUrl }}
                      style={styles.detailsImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Kit Information */}
                <View style={styles.detailsSection}>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Kit ID:</Text>
                    <Text style={styles.detailsValue}>#{selectedKit.id}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Kit Name:</Text>
                    <Text style={[styles.detailsValue, styles.detailsValueBold]}>
                      {selectedKit.kitName || selectedKit.name || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Type:</Text>
                    <View style={[
                      styles.badge,
                      { backgroundColor: selectedKit.type === 'LECTURER_KIT' ? '#ff4d4f15' : '#1890ff15' }
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        { color: selectedKit.type === 'LECTURER_KIT' ? '#ff4d4f' : '#1890ff' }
                      ]}>
                        {selectedKit.type || 'STUDENT_KIT'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Status:</Text>
                    <View style={[
                      styles.badge,
                      { backgroundColor: selectedKit.status === 'AVAILABLE' ? '#52c41a15' : '#faad1415' }
                    ]}>
                      <Text style={[
                        styles.badgeText,
                        { color: selectedKit.status === 'AVAILABLE' ? '#52c41a' : '#faad14' }
                      ]}>
                        {selectedKit.status || 'AVAILABLE'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Total Quantity:</Text>
                    <Text style={[styles.detailsValue, { color: '#1890ff' }]}>
                      {selectedKit.quantityTotal || 0}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Available Quantity:</Text>
                    <Text style={[styles.detailsValue, { color: '#52c41a' }]}>
                      {selectedKit.quantityAvailable || 0}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>In Use Quantity:</Text>
                    <Text style={[styles.detailsValue, { color: '#faad14' }]}>
                      {(selectedKit.quantityTotal || 0) - (selectedKit.quantityAvailable || 0)}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Total Components:</Text>
                    <Text style={styles.detailsValue}>
                      {components.length || selectedKit.components?.length || 0} components
                    </Text>
                  </View>
                  {selectedKit.description && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Description:</Text>
                      <Text style={styles.detailsValue}>
                        {selectedKit.description}
                      </Text>
                    </View>
                  )}
                  {selectedKit.createdAt && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Created At:</Text>
                      <Text style={[styles.detailsValue, styles.detailsValueSmall]}>
                        {formatDateTime(selectedKit.createdAt)}
                      </Text>
                    </View>
                  )}
                  {selectedKit.updatedAt && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Updated At:</Text>
                      <Text style={[styles.detailsValue, styles.detailsValueSmall]}>
                        {formatDateTime(selectedKit.updatedAt)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Components Section */}
                <View style={styles.componentsSection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="extension" size={20} color="#1890ff" />
                    <Text style={styles.sectionTitle}>
                      Components ({components.length || 0})
                    </Text>
                  </View>

                  {components.length > 0 ? (
                    <>
                      {(() => {
                        const startIndex = (componentPage - 1) * componentPageSize;
                        const endIndex = startIndex + componentPageSize;
                        const currentComponents = components.slice(startIndex, endIndex);
                        const totalPages = Math.ceil(components.length / componentPageSize);

                        return (
                          <>
                            <View style={styles.componentsGrid}>
                              {currentComponents.map((component, index) => (
                                <View key={component.id || index} style={styles.componentCard}>
                                  {component.imageUrl && component.imageUrl !== 'null' ? (
                                    <Image
                                      source={{ uri: component.imageUrl }}
                                      style={styles.componentImage}
                                      resizeMode="cover"
                                    />
                                  ) : (
                                    <View style={styles.componentImagePlaceholder}>
                                      <Icon name="extension" size={32} color="#fff" />
                                    </View>
                                  )}
                                  <View style={styles.componentCardContent}>
                                    <Text style={styles.componentName} numberOfLines={1}>
                                      {component.componentName || component.name || 'N/A'}
                                    </Text>
                                    {component.seriNumber && (
                                      <Text style={styles.componentSerial}>
                                        SN: {component.seriNumber}
                                      </Text>
                                    )}
                                    <View style={styles.componentBadge}>
                                      <Text style={styles.componentBadgeText}>
                                        {component.componentType || 'N/A'}
                                      </Text>
                                    </View>
                                    <View style={styles.componentDetails}>
                                      <Text style={styles.componentDetailText}>
                                        Total: {component.quantityTotal || 0}
                                      </Text>
                                      <Text style={[styles.componentDetailText, { color: '#52c41a' }]}>
                                        Available: {component.quantityAvailable || 0}
                                      </Text>
                                    </View>
                                    {component.pricePerCom > 0 && (
                                      <Text style={styles.componentPrice}>
                                        {component.pricePerCom.toLocaleString('vi-VN')} VND
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>

                            {totalPages > 1 && (
                              <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                  style={[styles.paginationButton, componentPage === 1 && styles.paginationButtonDisabled]}
                                  onPress={() => setComponentPage(Math.max(1, componentPage - 1))}
                                  disabled={componentPage === 1}
                                >
                                  <Icon name="chevron-left" size={20} color={componentPage === 1 ? "#ccc" : "#667eea"} />
                                </TouchableOpacity>
                                <Text style={styles.paginationText}>
                                  Page {componentPage} of {totalPages}
                                </Text>
                                <TouchableOpacity
                                  style={[styles.paginationButton, componentPage === totalPages && styles.paginationButtonDisabled]}
                                  onPress={() => setComponentPage(Math.min(totalPages, componentPage + 1))}
                                  disabled={componentPage === totalPages}
                                >
                                  <Icon name="chevron-right" size={20} color={componentPage === totalPages ? "#ccc" : "#667eea"} />
                                </TouchableOpacity>
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <View style={styles.emptyComponents}>
                      <Icon name="extension" size={48} color="#ccc" />
                      <Text style={styles.emptyComponentsText}>No components available</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => {
                  setKitDetailsModalVisible(false);
                  setSelectedKit(null);
                  setComponentPage(1);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Filter Modal */}
      <Modal
        visible={statusFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setStatusFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter by Status</Text>
            {['all', 'AVAILABLE', 'IN_USE', 'MAINTENANCE'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  filterStatus === status && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setFilterStatus(status);
                  setStatusFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterStatus === status && styles.filterOptionTextSelected
                ]}>
                  {status === 'all' ? 'All Status' : status}
                </Text>
                {filterStatus === status && (
                  <Icon name="check" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Type Filter Modal */}
      <Modal
        visible={typeFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTypeFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setTypeFilterModalVisible(false)}
        >
          <View style={styles.filterModalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.filterModalTitle}>Filter by Type</Text>
            {['all', 'STUDENT_KIT', 'LECTURER_KIT'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterOption,
                  filterType === type && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setFilterType(type);
                  setTypeFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filterType === type && styles.filterOptionTextSelected
                ]}>
                  {type === 'all' ? 'All Types' : type === 'STUDENT_KIT' ? 'Student Kit' : 'Lecturer Kit'}
                </Text>
                {filterType === type && (
                  <Icon name="check" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchFilterContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#2c3e50',
  },
  clearButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  filterOptionSelected: {
    backgroundColor: '#667eea15',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  filterOptionTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  kitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  kitImageContainer: {
    height: 150,
    position: 'relative',
  },
  kitImage: {
    width: '100%',
    height: '100%',
  },
  kitImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kitImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  kitCardContent: {
    padding: 12,
  },
  kitHeader: {
    marginBottom: 12,
  },
  kitInfo: {
    flex: 1,
  },
  kitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  kitBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  kitDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  kitActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerText: {
    padding: 16,
    alignItems: 'center',
  },
  footerTextContent: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addComponentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#667eea15',
    borderRadius: 8,
  },
  addComponentText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#667eea15',
    borderColor: '#667eea',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#667eea',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#52c41a15',
    borderColor: '#52c41a',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#52c41a',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  componentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  componentInfo: {
    flex: 1,
  },
  componentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  componentSerial: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  componentDetails: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  componentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  componentActionButton: {
    padding: 8,
  },
  componentForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  componentFormActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  // Kit Details Modal Styles
  detailsImageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailsImage: {
    width: '100%',
    height: '100%',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  detailsValueBold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailsValueSmall: {
    fontSize: 12,
    color: '#999',
  },
  componentsSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1890ff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  componentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  componentCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  componentImage: {
    width: '100%',
    height: 120,
  },
  componentImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  componentCardContent: {
    padding: 8,
  },
  componentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  componentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#722ed115',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  componentBadgeText: {
    fontSize: 10,
    color: '#722ed1',
    fontWeight: '600',
  },
  componentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  componentDetailText: {
    fontSize: 11,
    color: '#666',
  },
  componentPrice: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: '600',
    marginTop: 4,
  },
  emptyComponents: {
    alignItems: 'center',
    padding: 32,
  },
  emptyComponentsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    paddingVertical: 12,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // New Component Form Styles
  componentFormCard: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
  },
  componentFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  componentFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeIconBtn: {
    padding: 4,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#595959',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 15,
    color: '#262626',
    height: '100%',
  },
  statusToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    height: 48,
  },
  statusToggleOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  statusToggleOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusToggleOptionInactiveActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8c8c8c',
  },
  statusToggleTextActive: {
    color: '#52c41a',
  },
  statusToggleTextInactive: {
    color: '#ff4d4f',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  btnSecondary: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#595959',
  },
  btnPrimary: {
    flex: 2,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
    borderRadius: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AdminKits;
