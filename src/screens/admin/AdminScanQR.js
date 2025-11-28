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

  useEffect(() => {
    if (permission?.granted) {
      setScannerVisible(true);
    }
  }, [permission]);

  const parseQRCodeText = (qrText) => {
    if (!qrText || typeof qrText !== 'string') {
      return null;
    }

    const lines = qrText.split('\n');
    const info = {};

    // Check if it's a borrowing request or component rental request
    if (qrText.includes('=== BORROWING REQUEST INFO ===')) {
      info.type = 'BORROWING_REQUEST';
      lines.forEach(line => {
        if (line.startsWith('Borrower ID: ')) {
          info.borrowerId = line.replace('Borrower ID: ', '').trim();
        } else if (line.startsWith('Kit ID: ')) {
          info.kitId = line.replace('Kit ID: ', '').trim();
        } else if (line.startsWith('Kit Name: ')) {
          info.kitName = line.replace('Kit Name: ', '').trim();
        } else if (line.startsWith('Request Type: ')) {
          info.requestType = line.replace('Request Type: ', '').trim();
        } else if (line.startsWith('Status: ')) {
          info.status = line.replace('Status: ', '').trim();
        }
      });
    } else if (qrText.includes('=== COMPONENT RENTAL REQUEST ===')) {
      info.type = 'COMPONENT_RENTAL';
      lines.forEach(line => {
        if (line.startsWith('Borrower ID: ')) {
          info.borrowerId = line.replace('Borrower ID: ', '').trim();
        } else if (line.startsWith('Component ID: ')) {
          info.componentId = line.replace('Component ID: ', '').trim();
        } else if (line.startsWith('Component Name: ')) {
          info.componentName = line.replace('Component Name: ', '').trim();
        } else if (line.startsWith('Status: ')) {
          info.status = line.replace('Status: ', '').trim();
        }
      });
    }

    return Object.keys(info).length > 0 ? info : null;
  };

  const findRequestByQRInfo = async (qrInfo) => {
    try {
      // Get all approved requests
      const approvedRequests = await borrowingRequestAPI.getApproved();
      
      // Find matching request
      const matchingRequest = approvedRequests.find(request => {
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
      // Parse QR code text
      const qrInfo = parseQRCodeText(data);
      
      if (!qrInfo) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid borrowing request information.',
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

      // Find the request from API
      const request = await findRequestByQRInfo(qrInfo);
      
      if (!request) {
        Alert.alert(
          'Request Not Found',
          'Could not find a matching approved borrowing request. Please make sure the request is approved.',
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

      // Navigate to Return Checking with request ID
      // First navigate to AdminMain drawer, then to ReturnKits
      navigation.navigate('AdminMain', {
        screen: 'ReturnKits',
        params: {
          requestId: request.id,
          autoOpen: true
        }
      });
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

  const openScanner = async () => {
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
            <TouchableOpacity style={styles.permissionButton} onPress={openScanner}>
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
                Point your camera at the QR code on the borrowing request to quickly navigate to the return checking page.
              </Text>
              <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
                <Icon name="camera-alt" size={24} color="#fff" />
                <Text style={styles.scanButtonText}>Start Scanning</Text>
              </TouchableOpacity>
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
});

export default AdminScanQR;

