import type { RootState } from "@/store";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function AuthedLayout() {
  const user = useSelector((s: RootState) => s.auth.user);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.replace("/login");
    }
    setChecked(true);
  }, [user]);

  if (!checked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!user) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
