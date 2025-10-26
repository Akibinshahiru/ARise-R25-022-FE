import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { LinearGradient } from "expo-linear-gradient";

const QUIZ_API_URL =
  process.env.EXPO_PUBLIC_QUIZ_API_URL ?? "http://192.168.0.195:8082";

export default function JoinQuizScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false); // controls camera vs UI
  const [scannedQuizId, setScannedQuizId] = useState<string | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);

  // Debounce successive scans (CameraView can fire multiple times quickly)
  const lastScanTs = useRef<number>(0);
  const DEBOUNCE_MS = 1200;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const parseQuizId = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.quizId === "string") return parsed.quizId;
      return null;
    } catch {
      // treat raw as plain quizId
      return raw?.trim() || null;
    }
  };

  const handleBarCodeScanned = async (data: string) => {
    const now = Date.now();
    if (now - lastScanTs.current < DEBOUNCE_MS) return; // debounce
    lastScanTs.current = now;

    if (scanned) return; // guard if already processing
    setScanned(true); // hide camera, show UI

    try {
      const quizId = parseQuizId(data);

      if (!quizId) {
        Alert.alert("Invalid QR", "This QR does not contain a quiz ID");
        // reset to scan again
        setScanned(false);
        return;
      }

      console.log("Scanned quizId:", quizId);
      setScannedQuizId(quizId);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Could not process QR.");
      setScanned(false); // allow scanning again
    }
  };

  // If camera permission not granted
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>No camera access</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>Scan Quiz QR</Text>

        {/* Camera box */}
        {!scanned ? (
          <View style={styles.scannerWrap}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => handleBarCodeScanned(data)}
            />
          </View>
        ) : (
          <View style={[styles.scannerWrap, styles.center]}>
            {loadingQuiz ? (
              <>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 10 }}>Loading quiz…</Text>
              </>
            ) : scannedQuizId ? (
              <View style={{ alignItems: "center", paddingHorizontal: 16 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", marginBottom: 6 }}
                >
                  Scanned Quiz ID
                </Text>
                <Text style={{ color: "#374151", marginBottom: 20 }}>
                  {scannedQuizId}
                </Text>

                {/* Start Quiz (navigate using just quizId; or use quiz.id if you fetched) */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    router.replace({
                      pathname: "/shalinda/(authed)/student/quiz/[id]",
                      params: { id: scannedQuizId },
                    })
                  }
                >
                  <LinearGradient
                    colors={["#7C3AED", "#6D28D9", "#4F46E5"] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.generateBtn}
                  >
                    <Text style={styles.generateText}>Start Quiz ✅</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Scan again */}
                <TouchableOpacity
                  style={[styles.btn, { marginTop: 14 }]}
                  onPress={() => {
                    setScanned(false);
                    setScannedQuizId(null);
                    setQuiz(null);
                    lastScanTs.current = 0;
                  }}
                >
                  <Text style={styles.btnText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text>Waiting for a valid QR…</Text>
                <TouchableOpacity
                  style={[styles.btn, { marginTop: 14 }]}
                  onPress={() => {
                    setScanned(false);
                    lastScanTs.current = 0;
                  }}
                >
                  <Text style={styles.btnText}>Back to Scanner</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Back to Student Home */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.replace("/shalinda/(authed)/student/studentHome")
          }
          accessibilityRole="button"
          accessibilityLabel="Back to Student Home"
          style={{ marginTop: 20 }}
        >
          <LinearGradient
            colors={["#7C3AED", "#6D28D9", "#4F46E5"] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateBtn}
          >
            <Text style={styles.generateText}>Back to Student Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, alignItems: "center", padding: 20 },
  heading: { fontSize: 26, fontWeight: "800", marginVertical: 16 },
  subheading: { fontSize: 16, color: "#374151", marginBottom: 24 },
  scannerWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  center: { alignItems: "center", justifyContent: "center", flex: 1 },
  generateBtn: {
    alignSelf: "center",
    width: 280,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  generateText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
