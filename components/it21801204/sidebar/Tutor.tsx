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
    key: "students",
    label: "Students",
    href: "/shalinda/students",
    icon: "people-outline" as IoniconName,
  },
  {
    key: "reports",
    label: "Reports",
    href: "/shalinda/reports",
    icon: "bar-chart-outline" as IoniconName,
  },
  {
    key: "tutorHome",
    label: "Tutor Home",
    href: "/shalinda/(authed)/tutor/tutorHome",
    icon: "briefcase-outline" as IoniconName,
  },
  {
    key: "settings",
    label: "Settings",
    href: "/shalinda/settings",
    icon: "settings-outline" as IoniconName,
  },
];

export function TutorSidebarLayout({
  title = "Tutor",
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
        footer={<Text style={{ color: "#666" }}>Tutor</Text>}
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
