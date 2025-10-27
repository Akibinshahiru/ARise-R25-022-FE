// register.tsx
import { UnauthenticatedSidebarLayout } from "@/components/it21801204";
import { setUser, type Role } from "@/store/IT21801204/authSlice";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";

const API_URL =
  process.env.EXPO_PUBLIC_AUTH_API_URL ?? "http://192.168.0.195:8080";

export default function RegisterScreen() {
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Registration failed"));
      const data = await res.json();

      if (!data?.uid || !data?.idToken) {
        throw new Error("Invalid register response");
      }

      dispatch(
        setUser({
          uid: data.uid,
          email: data.email ?? email,
          role: (data.role ?? role) as Role,
          idToken: data.idToken,
        })
      );

      if ((data.role ?? role) === "tutor")
        router.replace("/home");
      else router.replace("/home");
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnauthenticatedSidebarLayout title="Register">
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>
          {/* Decorative blobs behind (don’t block taps) */}
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
                <Text style={styles.hello}>Create Account ✨</Text>
                <Text style={styles.subtitle}>Join us to continue</Text>
              </View>
              <View style={styles.emojiBadge}>
                <Text style={styles.emojiText}>📝</Text>
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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
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
                  onSubmitEditing={handleRegister}
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

            {/* Role toggle */}
            <Text style={[styles.label, { marginTop: 14 }]}>Role</Text>
            <View style={styles.roleRow}>
              {(["student", "tutor"] as const).map((r) => {
                const active = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.9}
                    onPress={() => setRole(r)}
                    style={styles.roleButtonWrap}
                  >
                    {active ? (
                      <LinearGradient
                        colors={["#2563eb", "#4F46E5"] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.roleButtonActive}
                      >
                        <Ionicons
                          name={r === "student" ? "school-outline" : "briefcase-outline"}
                          size={16}
                          color="#fff"
                        />
                        <Text style={styles.roleTextActive}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.roleButton}>
                        <Ionicons
                          name={r === "student" ? "school-outline" : "briefcase-outline"}
                          size={16}
                          color="#6b7280"
                        />
                        <Text style={styles.roleText}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={loading || !email || !password}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={["#10B981", "#059669"] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, (loading || !email || !password) && { opacity: 0.7 }]}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Registering..." : "Register"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {!!err && <Text style={styles.errorText}>{err}</Text>}

            {/* Link to login */}
            <View style={styles.auxRow}>
              <Text style={styles.muted}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/login" as any)}>
                <Text style={styles.linkText}> Log in</Text>
              </TouchableOpacity>
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

  // role toggle
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  roleButtonWrap: { flex: 1 },
  roleButton: {
    height: 46,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  roleButtonActive: {
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  roleText: { fontSize: 14, color: "#374151", fontWeight: "700" },
  roleTextActive: { fontSize: 14, color: "#fff", fontWeight: "800" },

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
  muted: { color: "#6b7280", fontSize: 14 },
  linkText: { color: "#4F46E5", fontSize: 14, fontWeight: "700" },
});
