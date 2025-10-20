import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { mockRentalRequests } from '../mocks';

export default function AdminRentalApprovalScreen() {
  const [items, setItems] = useState(mockRentalRequests);

  const updateStatus = (id, status) => {
    setItems(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rental Approvals</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.kitName}</Text>
            <Row label="User" value={item.userEmail} />
            <Row label="Duration" value={`${item.duration} days`} />
            <Row label="Total" value={`${item.totalCost.toLocaleString()} VND`} />
            <Row label="Status" value={item.status} />
            <View style={styles.btnRow}>
              <Button title="Approve" onPress={() => updateStatus(item.id, 'APPROVED')} color="#2ecc71" />
              <Button title="Reject" onPress={() => updateStatus(item.id, 'REJECTED')} color="#e74c3c" />
            </View>
          </View>
        )}
      />
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Button({ title, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, { backgroundColor: color }]}>
      <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f6f7fb' },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 12 },
  cardTitle: { fontWeight: '700', color: '#222', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: '#666' },
  rowValue: { color: '#222' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});


