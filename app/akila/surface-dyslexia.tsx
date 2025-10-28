import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  title?: string;
};

export default function SurfaceDyslexia({ title = "Surface Dyslexia" }: Props) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  // Animated background + scanner chrome
  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;
  const floatC = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pre-warm permission prompt so kids can start quickly
    if (!permission?.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted]);

  // background floaters
  useEffect(() => {
    const mk = (v: Animated.Value, duration: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration, delay, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
          Animated.timing(v, { toValue: 0, duration, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        ])
      );
    const a = mk(floatA, 6500, 0), b = mk(floatB, 7200, 400), c = mk(floatC, 8000, 900);
    a.start(); b.start(); c.start();
    return () => { a.stop(); b.stop(); c.stop(); };
  }, [floatA, floatB, floatC]);

  // scanner pulse + sweep
  useEffect(() => {
    const p = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    const s = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.cubic) }),
      Animated.timing(sweep, { toValue: 0, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.cubic) }),
    ]));
    p.start(); s.start();
    return () => { p.stop(); s.stop(); };
  }, [pulse, sweep]);

  const startScanner = useCallback(async () => {
    if (!permission?.granted) {
      const p = await requestPermission();
      if (p.status !== "granted") {
        Alert.alert("Camera needed", "Please enable camera to scan the QR.");
        return;
      }
    }
    setHasScanned(false);
    setScanning(true);
  }, [permission?.granted, requestPermission]);

  const stopScanner = useCallback(() => setScanning(false), []);

  const parseWordFromQr = useCallback((payload: string): string | null => {
    try {
      const raw = (payload || "").trim();
      if (!raw) return null;

      // 1) JSON: {"word":"yacht"}
      if (raw.startsWith("{") && raw.endsWith("}")) {
        const obj = JSON.parse(raw);
        const w = obj.word || obj.Word || obj.WORD;
        if (typeof w === "string" && w.trim()) return w.trim();
      }
      // 2) URL with ?word= param
      if (/^https?:\/\//i.test(raw) || /^[a-z]+:\/\//i.test(raw)) {
        try {
          const u = new URL(raw);
          const w = u.searchParams.get("word");
          if (w && w.trim()) return w.trim();
          // also allow arise://word/yacht or similar path pattern
          const parts = u.pathname.split("/").filter(Boolean);
          const idx = parts.findIndex((p) => p.toLowerCase() === "word");
          if (idx >= 0 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);
        } catch {}
      }
      // 3) Simple plain word
      if (/^[a-zA-Z][a-zA-Z\-']{0,31}$/.test(raw)) return raw;
    } catch {}
    return null;
  }, []);

  const onBarcodeScanned = useCallback(
    (result: any) => {
      if (hasScanned) return;
      const data = String(result?.data ?? "");
      const word = parseWordFromQr(data);
      if (word) {
        setHasScanned(true);
        setScanning(false);
        router.push({ pathname: "/akila/ar-story", params: { word } } as any);
      } else {
        Alert.alert("Oops", "Couldn't find a word in that QR. Try another.");
      }
    },
    [hasScanned, parseWordFromQr, router]
  );

  const Brand = (
    <View style={styles.brandRow}>
      <Text style={styles.brand}>ARise</Text>
      <Text style={styles.brandTag}>Learn with Stories</Text>
    </View>
  );

  return (
    <RoleAwareSidebarLayout title={title}>
      <SafeAreaView style={styles.root}>
      {/* Gradient + animated playful blobs */}
      <LinearGradient colors={["#fff7e6", "#fcefe2", "#f9e6ff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.blobOne, { transform: [
        { translateY: floatA.interpolate({ inputRange: [0,1], outputRange: [0, -10] }) },
        { translateX: floatA.interpolate({ inputRange: [0,1], outputRange: [0, 8] }) },
        { scale: floatA.interpolate({ inputRange: [0,1], outputRange: [1, 1.03] }) },
      ] }]} />
      <Animated.View style={[styles.blobTwo, { transform: [
        { translateY: floatB.interpolate({ inputRange: [0,1], outputRange: [0, 12] }) },
        { translateX: floatB.interpolate({ inputRange: [0,1], outputRange: [0, -10] }) },
        { scale: floatB.interpolate({ inputRange: [0,1], outputRange: [1, 1.04] }) },
      ] }]} />
      <Animated.View style={[styles.blobThree, { transform: [
        { translateY: floatC.interpolate({ inputRange: [0,1], outputRange: [0, -8] }) },
        { translateX: floatC.interpolate({ inputRange: [0,1], outputRange: [0, 6] }) },
        { scale: floatC.interpolate({ inputRange: [0,1], outputRange: [1, 1.02] }) },
      ] }]} />

      {Brand}

      {!scanning ? (
        <View style={styles.heroCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Scan a magic QR card to start your AR story!</Text>

          <View style={styles.illustration}>
            <Text style={styles.emoji}>🌟🚀⛵</Text>
          </View>

          <TouchableOpacity style={[styles.ctaBtn, styles.primary]} onPress={startScanner} activeOpacity={0.9}>
            <Ionicons name="qr-code" size={22} color="#fff" />
            <Text style={styles.ctaText}>Open Scanner</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>Tip: Your QR should include the word. Examples: "yacht", https://example.com/ar?word=yacht, or {"{\"word\":\"yacht\"}"}</Text>
        </View>
      ) : (
        <View style={styles.scannerWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] as any }}
            onBarcodeScanned={onBarcodeScanned}
          />

          {/* Overlay with cutout */}
          <View pointerEvents="none" style={styles.mask} />

          <Animated.View
            style={[
              styles.scanFrame,
              {
                transform: [{ scale: pulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.02] }) }],
                shadowOpacity: pulse.interpolate({ inputRange: [0,1], outputRange: [0.15, 0.3] }) as any,
              },
            ]}
          >
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: sweep.interpolate({ inputRange: [0,1], outputRange: [8, 240 - 8] }) }],
                  opacity: pulse.interpolate({ inputRange: [0,1], outputRange: [0.6, 0.9] }),
                },
              ]}
            />
          </Animated.View>

          <View style={styles.scannerTopBar}>
            <TouchableOpacity onPress={stopScanner} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={24} color="#1e1b4b" />
              <Text style={styles.navBtnText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scannerHintRow}>
            <Text style={styles.scannerHint}>Align the QR inside the frame</Text>
          </View>
        </View>
      )}
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const PURPLE = "#8b5cf6";
const DEEP_PURPLE = "#5b21b6";
const LILAC = "#eee5ff";
const YELLOW = "#facc15";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff7e6" },
  brandRow: { flexDirection: "row", alignItems: "baseline", paddingHorizontal: 20, paddingTop: 8 },
  brand: { fontSize: 32, fontWeight: "900", color: DEEP_PURPLE, marginRight: 10 },
  brandTag: { fontSize: 14, fontWeight: "800", color: PURPLE },

  // Playful background blobs
  blobOne: {
    position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: LILAC, left: -60, top: -40, opacity: 0.9,
  },
  blobTwo: {
    position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: YELLOW, right: -40, top: 20, opacity: 0.8,
  },
  blobThree: {
    position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: PURPLE, right: -60, bottom: -60, opacity: 0.15,
  },

  heroCard: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: PURPLE,
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 6,
  },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  subtitle: { color: "#f5f3ff", marginTop: 8, fontWeight: "700" },
  illustration: {
    marginTop: 16,
    backgroundColor: "#f5f3ff",
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  emoji: { fontSize: 36, color: DEEP_PURPLE },
  ctaBtn: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 18,
  },
  primary: { backgroundColor: "#6b21a8" },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  hint: { color: "#f3e8ff", marginTop: 12, fontWeight: "600" },

  // Scanner screen
  scannerWrap: { flex: 1, backgroundColor: "#000" },
  scannerTopBar: { position: "absolute", top: Platform.select({ ios: 50, default: 24 }), left: 16, right: 16, flexDirection: "row", justifyContent: "flex-start" },
  navBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#e9d5ff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  navBtnText: { color: "#1e1b4b", fontWeight: "800", marginLeft: 2 },

  mask: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  scanFrame: {
    position: "absolute",
    left: 40,
    right: 40,
    top: "28%",
    height: 240,
    borderRadius: 24,
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  cornerTL: { position: "absolute", left: -2, top: -2, width: 34, height: 34, borderLeftWidth: 4, borderTopWidth: 4, borderColor: YELLOW, borderTopLeftRadius: 22 },
  cornerTR: { position: "absolute", right: -2, top: -2, width: 34, height: 34, borderRightWidth: 4, borderTopWidth: 4, borderColor: YELLOW, borderTopRightRadius: 22 },
  cornerBL: { position: "absolute", left: -2, bottom: -2, width: 34, height: 34, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: YELLOW, borderBottomLeftRadius: 22 },
  cornerBR: { position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRightWidth: 4, borderBottomWidth: 4, borderColor: YELLOW, borderBottomRightRadius: 22 },
  scanLine: { position: "absolute", left: 8, right: 8, height: 4, borderRadius: 2, backgroundColor: "rgba(250,204,21,0.6)" },
  scannerHintRow: { position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center" },
  scannerHint: { color: "#fff", fontWeight: "800", backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
});
