import type { SidebarItem } from "@/components/shared/Sidebar";
import {
  SidebarContainer,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/shared/Sidebar";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, PropsWithChildren } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const items: SidebarItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/shalinda/dashboard",
    icon: "grid-outline" as IoniconName,
  },
  {
    key: "studentHome",
    label: "Student Home",
    href: "/shalinda/(authed)/student/studentHome",
    icon: "school-outline" as IoniconName,
  },
  {
    key: "joinQuiz",
    label: "Join Quiz",
    href: "/shalinda/create-quiz",
    icon: "clipboard-outline" as IoniconName,
  },
  {
    key: "reports",
    label: "My Reports",
    href: "/shalinda/my-reports",
    icon: "document-text-outline" as IoniconName,
  },
  {
    key: "profile",
    label: "Profile",
    href: "/shalinda/profile",
    icon: "person-circle-outline" as IoniconName,
  },
];

export function StudentSidebarLayout({
  title = "Student",
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <SidebarProvider>
      <SidebarContainer
        items={items}
        header={
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            ARise (IT21801204)
          </Text>
        }
        footer={<Text style={{ color: "#666" }}>Student</Text>}
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
