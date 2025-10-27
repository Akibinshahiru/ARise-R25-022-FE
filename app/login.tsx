import { UnauthenticatedSidebarLayout } from "@/components/it21801204";
import type { RootState } from "@/store";
import { setUser, type Role } from "@/store/IT21801204/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

const API_URL =
  process.env.EXPO_PUBLIC_AUTH_API_URL ?? "http://192.168.0.195:8080";

export default function LoginScreen() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // If already logged in, go to role home
  useEffect(() => {
    if (user?.role == "tutor")
      router.replace("/home");
    else if (user?.role == "student")
      router.replace("/home");
  }, [user]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Login failed"));

      const data = await res.json();

      if (!data?.uid || !data?.idToken || !data?.role) {
        throw new Error("Invalid login response");
      }

      dispatch(
        setUser({
          uid: data.uid,
          email: data.email ?? email,
          role: data.role as Role,
          idToken: data.idToken,
        })
      );

      if (data.role === "tutor")
        router.replace("/home");
      else router.replace("/home");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnauthenticatedSidebarLayout title="Login">
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>
          {/* Decorative blobs behind (won’t block taps) */}
          <LinearGradient
            pointerEvents="none"
            colors={["#FFE6A7", "#bd092aff"] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.blobTop}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["#B5E4FF", "#D7C3FF"] as const}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.blobBottom}
          />

          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Brand */}
            <View style={styles.brandRow}>
              <Text style={styles.brand}>ARise</Text>
              <Ionicons name="sparkles" size={22} color="#6C2BD9" />
            </View>

            {/* Greeting card */}
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.greetingCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.hello}>Welcome Back 👋</Text>
                <Text style={styles.subtitle}>Please log in to continue</Text>
              </View>
              <View style={styles.emojiBadge}>
                <Text style={styles.emojiText}>🔐</Text>
              </View>
            </LinearGradient>

            {/* Inputs */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPw}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPw((s) => !s)}>
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleLogin}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={["#2563eb", "#4F46E5"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, loading && { opacity: 0.7 }]}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "Login"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!!err && <Text style={styles.errorText}>{err}</Text>}

            {/* Aux links (optional) */}
            <View style={styles.auxRow}>
              <TouchableOpacity onPress={() => router.push("/register" as any)}>
                <Text style={styles.linkText}>Create account</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </UnauthenticatedSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F7FB" },
  screen: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { padding: 20, paddingBottom: 32 },

  // blobs
  blobTop: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
    zIndex: -1,
  },
  blobBottom: {
    position: "absolute",
    bottom: -70,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    opacity: 0.25,
    zIndex: -1,
  },

  // brand + greeting
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.5,
  },
  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  hello: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  emojiBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  emojiText: { fontSize: 26 },

  // fields
  fieldWrap: { marginTop: 12 },
  label: { fontSize: 13, color: "#6b7280", marginBottom: 6, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  input: { flex: 1, fontSize: 16, color: "#111827" },

  // button
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "800" },

  // misc
  errorText: { color: "#ef4444", marginTop: 10, textAlign: "center" },
  auxRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  linkText: { color: "#4F46E5", fontSize: 14, fontWeight: "700" },
});
