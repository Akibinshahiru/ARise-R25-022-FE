import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import React, { useEffect, useMemo, useRef } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function CelebrationPage() {
  const router = useRouter();
  const { width: W, height: H } = Dimensions.get('window');

  // Title bounce
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [bounce]);

  // Confetti loop
  const confetti = useMemo(
    () => Array.from({ length: 40 }).map(() => ({
      x: Math.random() * W,
      delay: Math.random() * 1000,
      dur: 2000 + Math.random() * 2000,
      size: 4 + Math.random() * 6,
      color: ['#FDE68A','#A78BFA','#60A5FA','#FCA5A5','#34D399'][Math.floor(Math.random()*5)],
      rot: Math.random()*360,
    })),
    [W]
  );
  const fallVals = useRef(confetti.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const runs = fallVals.map((v, i) => {
      v.setValue(0);
      return Animated.loop(Animated.timing(v, { toValue: 1, duration: confetti[i].dur, delay: confetti[i].delay, useNativeDriver: true }));
    });
    runs.forEach(r => r.start());
    return () => runs.forEach(r => r.stop());
  }, [fallVals, confetti]);

  return (
    <RoleAwareSidebarLayout title="Celebrate Progress">
      <SafeAreaView style={styles.root}>
      <LinearGradient colors={["#fff7e6", "#f9e6ff"]} style={StyleSheet.absoluteFill} />
      {/* Confetti */}
      {confetti.map((c, i) => (
        <Animated.View key={`c-${i}`} style={{ position: 'absolute', left: c.x, top: -30, width: c.size, height: c.size, backgroundColor: c.color, borderRadius: 2,
          transform: [
            { translateY: fallVals[i].interpolate({ inputRange: [0,1], outputRange: [0, H + 60] }) },
            { rotate: fallVals[i].interpolate({ inputRange: [0,1], outputRange: ['0deg', `${c.rot}deg`] }) },
          ],
          opacity: fallVals[i].interpolate({ inputRange: [0,1], outputRange: [1, 0.8] })
        }} />
      ))}

      <View style={styles.center}>
        <Animated.Text style={[styles.emoji, { transform: [{ scale: bounce.interpolate({ inputRange: [0,1], outputRange: [1, 1.08] }) }] }]}>🥳🎉</Animated.Text>
        <Text style={styles.title}>Hooray!</Text>
        <Text style={styles.subtitle}>You did a wonderful job</Text>
        <View style={{ height: 16 }} />
        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => router.replace('/akila/surface-dyslexia')}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56 },
  title: { fontFamily: 'OpenDyslexic', fontSize: 40, fontWeight: '900', color: '#4c1d95' },
  subtitle: { fontFamily: 'OpenDyslexic', fontSize: 18, color: '#1f1147', marginTop: 6 },
  btn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  primary: { backgroundColor: '#6d28d9' },
  btnText: { fontFamily: 'OpenDyslexic', color: '#fff', fontWeight: '900' },
});
