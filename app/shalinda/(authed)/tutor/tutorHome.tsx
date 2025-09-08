import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function TutorHome() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  // Guard: only tutors
  useEffect(() => {
    if (!user) router.replace("/shalinda/login");
    else if (user.role !== "tutor")
      router.replace("/shalinda/(authed)/student/studentHome");
  }, [user]);

  if (!user || user.role !== "tutor") return null;

  return (
    <RoleAwareSidebarLayout title="Tutor Home">
      <View style={styles.body}>
        <Text style={styles.title}>Tutor Home</Text>
      </View>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 20, backgroundColor: "#f3f4f6" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
});
