import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PenaltyPaymentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Penalty Payment (Mobile)</Text>
      <Text>Placeholder screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
});


