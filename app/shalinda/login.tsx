import { UnauthenticatedSidebarLayout } from "@/components/it21801204";
import type { RootState } from "@/store";
import { setUser, type Role } from "@/store/IT21801204/authSlice";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

const API_URL =
  process.env.EXPO_PUBLIC_AUTH_API_URL ?? "http://192.168.1.9:8080";

export default function LoginScreen() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // If already logged in, go to role home
  useEffect(() => {
    if (user?.role === "tutor")
      router.replace("/shalinda/(authed)/tutor/tutorHome");
    else if (user?.role === "student")
      router.replace("/shalinda/(authed)/student/studentHome");
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

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      console.log(data);

      // expected: { message, uid, idToken, role, email }
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
        router.replace("/shalinda/(authed)/tutor/tutorHome");
      else router.replace("/shalinda/(authed)/student/studentHome");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnauthenticatedSidebarLayout title="Login">
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Please login to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          activeOpacity={0.9}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login"}
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
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
