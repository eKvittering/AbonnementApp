import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function Frontpage({ onNavigate = () => {} }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 900, useNativeDriver: true })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {/* dekorativ baggrund uden ekstra pakker */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <View style={styles.container}>
        <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
          <Text style={styles.badgeText}>DBF</Text>
        </Animated.View>

        <Text style={styles.title}>Dansk Bridge Forbund</Text>
        <Text style={styles.subtitle}>Hurtig adgang til klubber, medlemmer og medlemskaber</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => onNavigate('klub')}>
            <Text style={styles.primaryText}>Se Klubber</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.ghost]} onPress={() => onNavigate('medlem')}>
            <Text style={styles.ghostText}>Medlemmer & Medlemskaber</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Cool Udvikling • {new Date().getFullYear()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1220' },
  bgTop: { position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: '#0f172a', opacity: 0.7 },
  bgBottom: { position: 'absolute', bottom: -100, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: '#04293a', opacity: 0.65 },

  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  badge: { width: 110, height: 110, borderRadius: 56, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center', marginBottom: 18, elevation: 6 },
  badgeText: { fontSize: 36, fontWeight: '800', color: '#062e35' },

  title: { color: '#e6f6f8', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#9fb7bd', fontSize: 13, marginTop: 8, textAlign: 'center', maxWidth: width * 0.8 },

  buttons: { marginTop: 22, width: '100%', alignItems: 'center' },
  button: { width: '72%', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  primary: { backgroundColor: '#06b6d4' },
  primaryText: { color: '#062e35', fontWeight: '700', fontSize: 16 },
  ghost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'transparent' },
  ghostText: { color: '#cfeff2', fontWeight: '700', fontSize: 16 },

  footer: { position: 'absolute', bottom: 18, color: 'rgba(255,255,255,0.45)', fontSize: 12, color: '#9fb7bd' }
});