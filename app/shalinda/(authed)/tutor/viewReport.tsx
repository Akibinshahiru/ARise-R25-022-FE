import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { useSelector } from "react-redux";

export default function ViewReportScreen() {
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
    <RoleAwareSidebarLayout title="View Report">
      <SafeAreaView style={styles.safe}>
        <Text style={styles.text}>ViewReport</Text>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
});
