// app/index.tsx (or app/shalinda/home.tsx)
import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { UnauthenticatedSidebarLayout } from "@/components/it21801204";

export default function Home() {
  return (
    <UnauthenticatedSidebarLayout title="Homepage">
      <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient
          colors={["#0ea5e9", "#6366f1", "#22c55e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bg}
        >
          <CenterStage />
        </LinearGradient>
      </SafeAreaView>
    </UnauthenticatedSidebarLayout>
  );
}

function CenterStage() {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse, float]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const bob = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.centerWrap}>
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }, { translateY: bob }] }}>
        <LinearGradient
          colors={["#ffffff", "#e2e8f0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleWrap}
        >
          <Text style={styles.title}>ARise</Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
          activeOpacity={0.9}
          onPress={() => router.push("/login" as any)}
        >
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "rgba(255,255,255,0.28)" }]}
          activeOpacity={0.9}
          onPress={() => router.push("/register" as any)}
        >
          <Text style={styles.btnText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  titleWrap: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: "900",
    color: "#0b1020",
    letterSpacing: 2,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  ring: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 160,
    borderWidth: 16,
    borderColor: "rgba(255,255,255,0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.6)",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
