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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { kitAPI, kitComponentAPI } from '../../services/api';

const AdminKits = ({ onLogout }) => {
  const navigation = useNavigation();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [componentModalVisible, setComponentModalVisible] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [editingKit, setEditingKit] = useState(null);
  const [components, setComponents] = useState([]);
  const [editingComponent, setEditingComponent] = useState(null);
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
    setComponentFormData({
      componentName: '',
      componentType: 'RED',
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
    setComponentFormData({
      componentName: component.componentName || component.name || '',
      componentType: component.componentType || 'RED',
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
      setComponentFormData({
        componentName: '',
        componentType: 'RED',
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
    <View style={styles.kitCard}>
      <View style={styles.kitHeader}>
        <View style={styles.kitInfo}>
          <Text style={styles.kitName}>{item.kitName || item.name || 'N/A'}</Text>
          <View style={styles.kitBadges}>
            <View style={[
              styles.badge,
              { backgroundColor: item.type === 'LECTURER_KIT' ? '#ff4d4f15' : '#1890ff15' }
            ]}>
              <Text style={[
                styles.badgeText,
                { color: item.type === 'LECTURER_KIT' ? '#ff4d4f' : '#1890ff' }
              ]}>
                {item.type || 'STUDENT_KIT'}
              </Text>
            </View>
            <View style={[
              styles.badge,
              { backgroundColor: item.status === 'AVAILABLE' ? '#52c41a15' : '#faad1415' }
            ]}>
              <Text style={[
                styles.badgeText,
                { color: item.status === 'AVAILABLE' ? '#52c41a' : '#faad14' }
              ]}>
                {item.status || 'AVAILABLE'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.kitDetails}>
        <View style={styles.detailRow}>
          <Icon name="inventory-2" size={16} color="#666" />
          <Text style={styles.detailText}>
            Total: {item.quantityTotal || 0} | Available: {item.quantityAvailable || 0}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="category" size={16} color="#666" />
          <Text style={styles.detailText}>
            Components: {item.components?.length || 0}
          </Text>
        </View>
      </View>

      <View style={styles.kitActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#1890ff15' }]}
          onPress={() => handleEditKit(item)}
        >
          <Icon name="edit" size={18} color="#1890ff" />
          <Text style={[styles.actionButtonText, { color: '#1890ff' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#722ed115' }]}
          onPress={() => handleManageComponents(item)}
        >
          <Icon name="settings" size={18} color="#722ed1" />
          <Text style={[styles.actionButtonText, { color: '#722ed1' }]}>Components</Text>
        </TouchableOpacity>
      </View>
  </View>
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

      <FlatList
        data={kits}
        renderItem={renderKitItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadKits} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inventory-2" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No kits available</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddKit}>
              <Text style={styles.emptyButtonText}>Add First Kit</Text>
            </TouchableOpacity>
          </View>
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

            {editingComponent && (
              <View style={styles.componentForm}>
                <Text style={styles.formSectionTitle}>Edit Component</Text>
                <TextInput
                  style={styles.input}
                  value={componentFormData.componentName}
                  onChangeText={(text) => setComponentFormData({ 
                    ...componentFormData, 
                    componentName: text 
                  })}
                  placeholder="Component name"
                />
                <View style={styles.formRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    value={componentFormData.quantityTotal.toString()}
                    onChangeText={(text) => setComponentFormData({ 
                      ...componentFormData, 
                      quantityTotal: parseInt(text) || 0 
                    })}
                    keyboardType="numeric"
                    placeholder="Quantity"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    value={componentFormData.pricePerCom.toString()}
                    onChangeText={(text) => setComponentFormData({ 
                      ...componentFormData, 
                      pricePerCom: parseInt(text) || 0 
                    })}
                    keyboardType="numeric"
                    placeholder="Price"
                  />
                </View>
                <View style={styles.componentFormActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditingComponent(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveComponent}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  kitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
});

export default AdminKits;
