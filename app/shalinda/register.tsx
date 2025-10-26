// app/shalinda/register.tsx
import { UnauthenticatedSidebarLayout } from "@/components/it21801204";
import type { RootState } from "@/store";
import { setUser, type Role } from "@/store/IT21801204/authSlice";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

      if (!res.ok) throw new Error("Registration failed");

      const data = await res.json();
      console.log("Register response", data);

      if (!data?.uid || !data?.idToken) {
        throw new Error("Invalid register response");
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
        router.replace("/shalinda/(authed)/tutor/tutorHome");
      else router.replace("/shalinda/(authed)/student/studentHome");
    } catch (e: any) {
      console.dir(e, { depth: undefined });

      setErr(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnauthenticatedSidebarLayout title="Register">
      <View style={styles.container}>
        <Text style={styles.title}>Create Account ✨</Text>
        <Text style={styles.subtitle}>Join us to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Simple role toggle */}
        <View style={styles.roleRow}>
          {["student", "tutor"].map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleButton,
                role === r && { backgroundColor: "#2563eb" },
              ]}
              onPress={() => setRole(r as "student" | "tutor")}
            >
              <Text
                style={[
                  styles.roleText,
                  role === r && { color: "#fff", fontWeight: "700" },
                ]}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>
            {loading ? "Registering..." : "Register"}
          </Text>
        </TouchableOpacity>

        {!!err && <Text style={{ color: "red", marginTop: 8 }}>{err}</Text>}
      </View>
    </UnauthenticatedSidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#6b7280", marginBottom: 32 },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  roleText: {
    fontSize: 16,
    color: "#111827",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#10b981",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
