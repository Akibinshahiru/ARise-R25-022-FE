import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * ARise — Login
 * Role-based navigation:
 *  - Student  → /surface-dyslexia
 *  - Tutor    → /iep
 */

const ROUTES = {
  student: "/akila/surface-dyslexia",
  tutor: "/akila/iep",
} as const;

// Demo accounts (unchanged)
const DEMO_USERS = [
  { role: "Student" as const, email: "student@demo.com", password: "abcd1234" },
  { role: "Tutor" as const, email: "tutor@demo.com", password: "abcd1234" },
];

type Role = "Student" | "Tutor";

export default function LoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [role, setRole] = useState<Role>("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional: set a friendly header title even if your folder is /akila/*
  useEffect(() => {
    navigation.setOptions?.({ title: "Welcome to ARise" });
  }, [navigation]);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length >= 4 && !busy,
    [email, password, busy]
  );

  const autofill = (which: Role) => {
    const found = DEMO_USERS.find((u) => u.role === which)!;
    setRole(which);
    setEmail(found.email);
    setPassword(found.password);
  };

  const handleLogin = async () => {
    setError(null);
    if (!canSubmit) return;
    setBusy(true);
    try {
      await Haptics.selectionAsync();
      // Simulate latency
      await new Promise((r) => setTimeout(r, 650));

      const match = DEMO_USERS.find(
        (u) =>
          u.role === role &&
          u.email.toLowerCase() === email.trim().toLowerCase() &&
          u.password === password
      );

      if (!match) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError("Invalid credentials. Try the demo accounts or tap Autofill.");
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 🔀 Route by role
      if (role === "Student") {
        router.replace(ROUTES.student);
      } else {
        router.replace(ROUTES.tutor);
      }
    } catch (e) {
      console.error(e);
      setError("Unexpected error. Please try again.");
      Alert.alert("Login", "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={["#a78bfa", "#93c5fd", "#86efac"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 22 }}>
          {/* Brand */}
          <View style={styles.brandWrap}>
            <View style={styles.logoBadge}>
              <Ionicons name="planet" size={32} />
            </View>
            <Text style={styles.brandTitle}>ARise</Text>
            <Text style={styles.brandSubtitle}>Play • Read • Explore</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Role toggle */}
            <View style={styles.roleToggle}>
              {(["Student", "Tutor"] as Role[]).map((r) => {
                const active = r === role;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={[styles.rolePill, active && styles.rolePillActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons
                      name={r === "Student" ? "happy" : "school"}
                      size={16}
                      style={{ opacity: active ? 1 : 0.6 }}
                    />
                    <Text style={[styles.roleText, active && styles.roleTextActive]}>
                      {r}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Inputs */}
            <View style={styles.inputWrap}>
              <Ionicons name="mail" size={18} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="username"
                placeholderTextColor="rgba(0,0,0,0.35)"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed" size={18} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="password"
                secureTextEntry={!showPassword}
                textContentType="password"
                placeholderTextColor="rgba(0,0,0,0.35)"
                style={styles.input}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                <Ionicons name={showPassword ? "eye" : "eye-off"} size={18} />
              </Pressable>
            </View>

            {/* Options */}
            <View style={styles.optionsRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Switch value={remember} onValueChange={setRemember} />
                <Text style={styles.optionText}>Remember me</Text>
              </View>
              <Pressable onPress={() => autofill(role)}>
                <Text style={[styles.optionText, { textDecorationLine: "underline" }]}>
                  Autofill {role}
                </Text>
              </Pressable>
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#7f1d1d" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              style={[styles.cta, !canSubmit && { opacity: 0.5 }]}
              disabled={!canSubmit}
              onPress={handleLogin}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="log-in" size={18} />
                  <Text style={styles.ctaText}>
                    Enter as {role}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Demo creds */}
            <View style={styles.demoCreds}>
              <Text style={styles.demoTitle}>Demo accounts</Text>
              {DEMO_USERS.map((u) => (
                <Pressable key={u.email} onPress={() => autofill(u.role)} style={styles.demoRow}>
                  <Ionicons name={u.role === "Tutor" ? "school" : "happy"} size={16} />
                  <Text style={styles.demoText}>
                    {u.role}: {u.email} / {u.password}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={{ alignItems: "center", marginTop: 14 }}>
            <Text style={{ fontSize: 12, opacity: 0.7 }}>v0.1 • Offline Demo</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandWrap: { alignItems: "center", marginBottom: 12 },
  logoBadge: {
    backgroundColor: "rgba(255,255,255,0.65)",
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 10,
    color: "#111827",
  },
  brandSubtitle: { fontSize: 14, opacity: 0.7 },
  card: {
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 24,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  roleToggle: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 16,
    padding: 6,
    flexDirection: "row",
    gap: 6,
  },
  rolePill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rolePillActive: { backgroundColor: "#ffffff" },
  roleText: { fontWeight: "600", opacity: 0.65 },
  roleTextActive: { opacity: 1 },
  inputWrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  inputIcon: { opacity: 0.6, marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
  optionsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { fontSize: 13, opacity: 0.7 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 10,
  },
  errorText: { color: "#7f1d1d", fontSize: 13 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 14,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  demoCreds: {
    marginTop: 6,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 14,
    padding: 10,
    gap: 6,
  },
  demoTitle: { fontSize: 12, fontWeight: "700", opacity: 0.7 },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  demoText: { fontSize: 12, opacity: 0.8 },
});
