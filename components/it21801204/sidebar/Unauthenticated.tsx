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
    key: "home",
    label: "Welcome",
    href: "/",
    icon: "home-outline" as IoniconName,
  },
  {
    key: "login",
    label: "Login",
    href: "/login",
    icon: "log-in-outline" as IoniconName,
  },
  {
    key: "register",
    label: "Register",
    href: "/register",
    icon: "person-add-outline" as IoniconName,
  },
];

export function UnauthenticatedSidebarLayout({
  title = "Welcome",
  children,
}: PropsWithChildren<{ title?: string }>) {
  return (
    <SidebarProvider>
      <SidebarContainer
        items={items}
        header={
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            Menu
          </Text>
        }
        footer={<Text style={{ color: "#666" }}>Guest</Text>}
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
