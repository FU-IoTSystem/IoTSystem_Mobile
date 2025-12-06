import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AdminLayout from '../../components/AdminLayout';
import { borrowingRequestAPI } from '../../services/api';

const AdminScanQR = ({ onLogout }) => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanMode, setScanMode] = useState(null); // 'approval' or 'return'

  const parseQRCodeText = (qrText) => {
    if (!qrText) {
      console.log('parseQRCodeText: qrText is null or undefined');
      return null;
    }
    
    // Convert to string if it's not already
    const text = typeof qrText === 'string' ? qrText : String(qrText);
    
    if (!text || text.trim().length === 0) {
      console.log('parseQRCodeText: qrText is empty');
      return null;
    }

    console.log('parseQRCodeText: Processing text:', text.substring(0, 200));

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const info = {};

    // Helper function to extract value from line
    const extractValue = (line, prefix) => {
      // Try with space after colon first (backend format)
      if (line.startsWith(prefix + ': ')) {
        return line.replace(prefix + ': ', '').trim();
      }
      // Try without space (fallback)
      if (line.startsWith(prefix + ':')) {
        return line.replace(prefix + ':', '').trim();
      }
      return null;
    };

    // Check if it's a borrowing request or component rental request
    if (text.includes('=== BORROWING REQUEST INFO ===')) {
      info.type = 'BORROWING_REQUEST';
      lines.forEach(line => {
        const borrowerId = extractValue(line, 'Borrower ID');
        if (borrowerId) info.borrowerId = borrowerId;
        
        const kitId = extractValue(line, 'Kit ID');
        if (kitId) info.kitId = kitId;
        
        const kitName = extractValue(line, 'Kit Name');
        if (kitName) info.kitName = kitName;
        
        const requestType = extractValue(line, 'Request Type');
        if (requestType) info.requestType = requestType;
        
        const status = extractValue(line, 'Status');
        if (status) info.status = status;
      });
    } else if (text.includes('=== COMPONENT RENTAL REQUEST ===')) {
      info.type = 'COMPONENT_RENTAL';
      lines.forEach(line => {
        const borrowerId = extractValue(line, 'Borrower ID');
        if (borrowerId) info.borrowerId = borrowerId;
        
        const componentId = extractValue(line, 'Component ID');
        if (componentId) info.componentId = componentId;
        
        const componentName = extractValue(line, 'Component Name');
        if (componentName) info.componentName = componentName;
        
        const status = extractValue(line, 'Status');
        if (status) info.status = status;
      });
    } else {
      console.log('parseQRCodeText: QR code does not contain expected header');
      console.log('parseQRCodeText: First 200 chars:', text.substring(0, 200));
      return null;
    }

    // Validate that we have at least borrowerId and kitId/componentId
    if (info.type === 'BORROWING_REQUEST' && (!info.borrowerId || !info.kitId)) {
      console.log('parseQRCodeText: Missing required fields for BORROWING_REQUEST');
      console.log('parseQRCodeText: Info:', info);
      return null;
    }
    
    if (info.type === 'COMPONENT_RENTAL' && (!info.borrowerId || !info.componentId)) {
      console.log('parseQRCodeText: Missing required fields for COMPONENT_RENTAL');
      console.log('parseQRCodeText: Info:', info);
      return null;
    }

    console.log('parseQRCodeText: Successfully parsed:', info);
    return Object.keys(info).length > 0 ? info : null;
  };

  const findRequestByQRInfo = async (qrInfo, mode) => {
    try {
      // For approval mode, get all requests (including pending)
      // For return mode, only get approved requests
      const requests = mode === 'approval' 
        ? await borrowingRequestAPI.getAll()
        : await borrowingRequestAPI.getApproved();
      
      // Find matching request
      const matchingRequest = requests.find(request => {
        // Match by borrower ID and kit ID
        const borrowerMatches = request.requestedBy?.id?.toString() === qrInfo.borrowerId ||
                                request.requestedBy?.id === qrInfo.borrowerId;
        
        const kitMatches = request.kit?.id?.toString() === qrInfo.kitId ||
                          request.kit?.id === qrInfo.kitId;
        
        // For component rental, check component info as well
        if (qrInfo.type === 'COMPONENT_RENTAL') {
          return borrowerMatches && request.requestType === 'BORROW_COMPONENT';
        }
        
        return borrowerMatches && kitMatches;
      });

      return matchingRequest;
    } catch (error) {
      console.error('Error finding request:', error);
      return null;
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);
    setScannerVisible(false);

    try {
      // Log the raw QR code data for debugging
      console.log('Scanned QR Code Data:', data);
      console.log('QR Code Data Type:', typeof data);
      console.log('QR Code Data Length:', data?.length);
      
      // Parse QR code text
      const qrInfo = parseQRCodeText(data);
      
      console.log('Parsed QR Info:', qrInfo);
      
      if (!qrInfo) {
        // Show more detailed error message with actual QR content
        const previewText = data && data.length > 100 
          ? data.substring(0, 100) + '...' 
          : data || 'No data';
        
        Alert.alert(
          'Invalid QR Code',
          `This QR code does not contain valid borrowing request information.\n\nQR Content Preview:\n${previewText}\n\nPlease make sure you are scanning a valid borrowing request QR code.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setLoading(false);
                setScannerVisible(true);
              }
            }
          ]
        );
        return;
      }

      // Find the request from API based on selected mode
      const request = await findRequestByQRInfo(qrInfo, scanMode);
      
      if (!request) {
        const errorMessage = scanMode === 'approval'
          ? 'Could not find a matching borrowing request.'
          : 'Could not find a matching approved borrowing request. Please make sure the request is approved.';
        
        Alert.alert(
          'Request Not Found',
          errorMessage,
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setLoading(false);
                setScannerVisible(true);
              }
            }
          ]
        );
        return;
      }

      // Navigate based on selected mode
      if (scanMode === 'approval') {
        // Navigate to Approvals screen with request ID to show detail
        navigation.navigate('AdminMain', {
          screen: 'Approvals',
          params: {
            requestId: request.id
          }
        });
      } else if (scanMode === 'return') {
        // Navigate to Return Checking with request ID
        navigation.navigate('AdminMain', {
          screen: 'ReturnKits',
          params: {
            requestId: request.id,
            autoOpen: true
          }
        });
      }
      
      // Reset states after navigation
      setScanMode(null);
      setScanned(false);
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'Error',
        'Failed to process QR code. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setLoading(false);
              setScannerVisible(true);
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    if (!permission) {
      return;
    }
    
    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan QR codes.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Grant Permission',
              onPress: async () => {
                await requestPermission();
              }
            }
          ]
        );
      }
    }
  };

  const openScanner = async (mode) => {
    if (!mode) {
      Alert.alert('Error', 'Please select a scan mode first');
      return;
    }
    
    setScanMode(mode);
    
    if (!permission) {
      // Permission is still being determined
      return;
    }
    
    if (!permission.granted) {
      const result = await requestPermission();
      if (result.granted) {
        setScanned(false);
        setScannerVisible(true);
      } else {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan QR codes.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Grant Permission',
              onPress: async () => {
                const res = await requestPermission();
                if (res.granted) {
                  setScanned(false);
                  setScannerVisible(true);
                }
              }
            }
          ]
        );
      }
    } else {
      setScanned(false);
      setScannerVisible(true);
    }
  };

  const closeScanner = () => {
    setScannerVisible(false);
    setScanned(false);
    setScanMode(null);
  };

  if (!permission) {
    return (
      <AdminLayout title="Scan QR Code">
        <View style={styles.container}>
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.messageText}>Requesting camera permission...</Text>
          </View>
        </View>
      </AdminLayout>
    );
  }

  if (!permission.granted) {
    return (
      <AdminLayout title="Scan QR Code">
        <View style={styles.container}>
          <View style={styles.centerContent}>
            <Icon name="camera-alt" size={80} color="#ccc" />
            <Text style={styles.messageText}>Camera permission is required to scan QR codes</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Scan QR Code">
      <View style={styles.container}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.messageText}>Processing QR code...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Icon name="qr-code-scanner" size={64} color="#667eea" />
              <Text style={styles.title}>Scan Borrowing Request QR Code</Text>
              <Text style={styles.description}>
                Select a mode and scan the QR code to navigate to the corresponding page.
              </Text>
              
              <View style={styles.modeSelection}>
                <TouchableOpacity 
                  style={[
                    styles.modeButton,
                    scanMode === 'approval' && styles.modeButtonActive
                  ]} 
                  onPress={() => openScanner('approval')}
                >
                  <Icon 
                    name="check-circle" 
                    size={24} 
                    color={scanMode === 'approval' ? '#fff' : '#667eea'} 
                  />
                  <Text style={[
                    styles.modeButtonText,
                    scanMode === 'approval' && styles.modeButtonTextActive
                  ]}>
                    Approval
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modeButton,
                    scanMode === 'return' && styles.modeButtonActive
                  ]} 
                  onPress={() => openScanner('return')}
                >
                  <Icon 
                    name="assignment-returned" 
                    size={24} 
                    color={scanMode === 'return' ? '#fff' : '#667eea'} 
                  />
                  <Text style={[
                    styles.modeButtonText,
                    scanMode === 'return' && styles.modeButtonTextActive
                  ]}>
                    Return
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* QR Scanner Modal */}
        <Modal
          visible={scannerVisible}
          animationType="slide"
          onRequestClose={closeScanner}
        >
          <View style={styles.scannerContainer}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <TouchableOpacity onPress={closeScanner} style={styles.closeButton}>
                <Icon name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <CameraView
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scannerHint}>
                Position the QR code within the frame
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#667eea',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scannerHint: {
    color: '#fff',
    fontSize: 14,
    marginTop: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeSelection: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#667eea',
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
});

export default AdminScanQR;
