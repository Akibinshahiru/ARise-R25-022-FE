// components/shalinda/RoleAwareSidebarLayout.tsx
import {
  SidebarContainer,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/shared/Sidebar";
import type { RootState } from "@/store";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

type SidebarItem = React.ComponentProps<
  typeof SidebarContainer
>["items"][number];

function itemsFor(role: "tutor" | "student" | undefined): SidebarItem[] {
  if (role === "tutor") {
    return [
      {
        key: "tutorHome",
        label: "Tutor Home",
        href: "/shalinda/(authed)/tutor/tutorHome",
        icon: "briefcase-outline" as any,
      },
      {
        key: "createQuiz",
        label: "Create Quiz",
        href: "/shalinda/(authed)/tutor/createQuiz",
        icon: "people-outline" as any,
      },
      {
        key: "viewReport",
        label: "View Report",
        href: "/shalinda/(authed)/tutor/viewReport",
        icon: "people-outline" as any,
      },
    ];
  }

  if (role === "student") {
    return [
      {
        key: "studentHome",
        label: "Student Home",
        href: "/shalinda/(authed)/student/studentHome",
        icon: "school-outline" as any,
      },
      {
        key: "courses",
        label: "My Courses",
        href: "/shalinda/(authed)/student/courses",
        icon: "book-outline" as any,
      },
    ];
  }

  // 🟢 fallback: empty array if no role yet
  return [];
}

export default function RoleAwareSidebarLayout({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  const role = useSelector((s: RootState) => s.auth.user?.role);
  const items = itemsFor(role);

  return (
    <SidebarProvider>
      <SidebarContainer
        items={items}
        header={<Text style={{ fontSize: 18, fontWeight: "700" }}>ARise</Text>}
        footer={<Text style={{ color: "#666" }}>{role}</Text>}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.topbar}>
            <SidebarTrigger />
            <Text style={styles.topbarText}>{title}</Text>
          </View>
          <View style={styles.body}>{children}</View>
        </SafeAreaView>
      </SidebarContainer>
    </SidebarProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  topbar: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8 },
  topbarText: { fontSize: 20, fontWeight: "700" },
  body: { flex: 1 },
});
