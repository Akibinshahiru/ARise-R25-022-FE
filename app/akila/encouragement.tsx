import React, { useEffect, useMemo, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function EncouragementPage() {
  const router = useRouter();
  const glow = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const { width: W, height: H } = Dimensions.get('window');
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [glow]);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, [float]);

  const stickers = useMemo(() => (
    [
      { emoji: '🌈', x: W*0.15, y: 90 },
      { emoji: '⭐', x: W*0.8, y: 140 },
      { emoji: '🐣', x: W*0.2, y: H*0.7 },
      { emoji: '💪', x: W*0.75, y: H*0.75 },
    ]
  ), [W,H]);

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={["#f0fdf4", "#f5f3ff"]} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View style={[styles.card, { shadowOpacity: glow.interpolate({ inputRange: [0,1], outputRange: [0.15, 0.35] }) as any }] }>
          <Animated.Text style={[styles.emoji, { transform: [{ translateY: float.interpolate({ inputRange:[0,1], outputRange: [0, -6] }) }] }]}>🌟💖</Animated.Text>
          <Text style={styles.title}>You’re doing great!</Text>
          <Text style={[styles.body, styles.centerText]}>Every try makes you stronger. Let’s keep practicing and have fun together.</Text>
          <Text style={[styles.body, styles.centerText]}>We believe in you — keep shining!</Text>
          <TouchableOpacity style={[styles.btn, styles.primary, { alignSelf: 'center' }]} onPress={() => router.replace('/akila/surface-dyslexia')}>
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {stickers.map((s, i) => (
        <Animated.Text key={i} style={[styles.sticker, { left: s.x, top: s.y, transform: [{ translateY: float.interpolate({ inputRange:[0,1], outputRange: [0, i%2===0 ? -8 : 8] }) }] }]}>{s.emoji}</Animated.Text>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, shadowColor: '#8B5CF6', shadowRadius: 16, width: '100%', maxWidth: 460, alignItems: 'center' },
  emoji: { fontSize: 40, marginBottom: 8 },
  title: { fontFamily: 'OpenDyslexic', fontSize: 32, fontWeight: '900', color: '#1f2937' },
  body: { fontFamily: 'OpenDyslexic', marginTop: 10, fontSize: 18, color: '#374151' },
  centerText: { textAlign: 'center' },
  btn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  primary: { backgroundColor: '#6d28d9' },
  btnText: { fontFamily: 'OpenDyslexic', color: '#fff', fontWeight: '900' },
  sticker: { position: 'absolute', fontSize: 28, opacity: 0.9 },
});
