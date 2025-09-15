import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Klub({ onBack = () => {} }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Klub-side kartoffel</Text>
      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Tilbage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6 },
  buttonText: { color: '#fff' },
});