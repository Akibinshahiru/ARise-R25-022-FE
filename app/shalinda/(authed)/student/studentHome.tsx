import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function StudentHome() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  // Guard: only students
  useEffect(() => {
    if (!user) router.replace("/shalinda/login");
    else if (user.role !== "student")
      router.replace("/shalinda/(authed)/tutor/tutorHome");
  }, [user]);

  if (!user || user.role !== "student") return null;

  return (
    <RoleAwareSidebarLayout title="Student Home">
      <View style={styles.body}>
        <Text style={styles.title}>Student Home</Text>
      </View>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 20, backgroundColor: "#f3f4f6" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
});
