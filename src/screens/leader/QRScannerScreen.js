import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import LeaderLayout from '../../components/LeaderLayout';

const QRScannerScreen = ({ navigation }) => {
  const handleScan = () => {
    Alert.alert('QR Scanner', 'QR Scanner functionality will be implemented here');
  };

  return (
    <LeaderLayout title="QR Scanner">
      <View style={styles.container}>
        <View style={styles.scanCard}>
          <View style={styles.iconContainer}>
            <Icon name="qr-code-scanner" size={80} color="#667eea" />
          </View>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.description}>
            Point your camera at a QR code to scan and process rental requests
          </Text>
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Icon name="camera-alt" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LeaderLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#667eea15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
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
});

export default QRScannerScreen;
