import { register, type Role } from "@/store/IT21801204/authSlice";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";

export default function Register() {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/shalinda/(authed)/dashboard" as any);
  }, [user]);

  const onRegister = () => {
    try {
      dispatch(register({ email, password, role }));
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    }
  };

  if (user) return null;

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Register</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10 }}
      />

      <Text>Role</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["student", "tutor"] as Role[]).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRole(r)}
            style={{
              borderWidth: 1,
              padding: 8,
              backgroundColor: role === r ? "#ddd" : "transparent",
            }}
          >
            <Text>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={onRegister}
        style={{ padding: 12, backgroundColor: "#22c55e", marginTop: 8 }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>Register</Text>
      </TouchableOpacity>

      {!!err && <Text style={{ color: "red" }}>{err}</Text>}
      <Text>
        Have an account? <Link href="/shalinda/login">Login</Link>
      </Text>
    </View>
  );
}
