import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Frontpage({ onNavigate = () => {} }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forside</Text>

      <TouchableOpacity style={styles.button} onPress={() => onNavigate('klub')}>
        <Text style={styles.buttonText}>Gå til Klub</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => onNavigate('medlem')}>
        <Text style={styles.buttonText}>Gå til Medlem</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: { fontSize: 28, marginBottom: 24 },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    width: '70%',
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16 },
});
