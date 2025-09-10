import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

type Props = {
  title?: string;
};

export default function SurfaceDyslexia({ title = "Surface Dyslexia" }: Props) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    // Pre-warm permission prompt so kids can start quickly
    if (!permission?.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted]);

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
    <SafeAreaView style={styles.root}>
      {/* Playful blob background using existing palette */}
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />
      <View style={styles.blobThree} />

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

          <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

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
  },
  cornerTL: { position: "absolute", left: -2, top: -2, width: 34, height: 34, borderLeftWidth: 4, borderTopWidth: 4, borderColor: YELLOW, borderTopLeftRadius: 22 },
  cornerTR: { position: "absolute", right: -2, top: -2, width: 34, height: 34, borderRightWidth: 4, borderTopWidth: 4, borderColor: YELLOW, borderTopRightRadius: 22 },
  cornerBL: { position: "absolute", left: -2, bottom: -2, width: 34, height: 34, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: YELLOW, borderBottomLeftRadius: 22 },
  cornerBR: { position: "absolute", right: -2, bottom: -2, width: 34, height: 34, borderRightWidth: 4, borderBottomWidth: 4, borderColor: YELLOW, borderBottomRightRadius: 22 },
  scannerHintRow: { position: "absolute", bottom: 40, left: 0, right: 0, alignItems: "center" },
  scannerHint: { color: "#fff", fontWeight: "800", backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
});
