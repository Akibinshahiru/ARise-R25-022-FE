// components/Sidebar.tsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type SidebarItem = {
  key: string;
  label: string;
  /** Any expo-router path string like "/akila/dashboard" */
  href: string;
  /** Optional icon name from Ionicons */
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  /** Optional custom render (overrides icon+label) */
  render?: (active: boolean) => React.ReactNode;
};

type SidebarContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
  children,
  initialOpen = false,
}: {
  children: React.ReactNode;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo(() => ({ open, setOpen, toggle }), [open]);
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}

export function SidebarTrigger({
  size = 24,
  style,
  color,
}: {
  size?: number;
  color?: string;
  style?: any;
}) {
  const { toggle } = useSidebar();
  return (
    <Pressable onPress={toggle} style={[styles.trigger, style]} hitSlop={10}>
      {({ pressed }) => (
        <Ionicons
          name="menu"
          size={size}
          color={color ?? (pressed ? "#444" : "#111")}
        />
      )}
    </Pressable>
  );
}

export function SidebarContainer({
  items,
  header,
  footer,
  width = 280,
  permanent = false,
  activeTint = "#111",
  inactiveTint = "#444",
  activeBg = "#E8ECF3",
  inactiveBg = "transparent",
  backgroundColor = "#FFF",
  onNavigate,
  children,
}: {
  items: SidebarItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  permanent?: boolean; // keep the sidebar fixed at the left (useful for tablets/large screens)
  activeTint?: string;
  inactiveTint?: string;
  activeBg?: string;
  inactiveBg?: string;
  backgroundColor?: string;
  onNavigate?: (href: string) => void;
  children: React.ReactNode;
}) {
  const { open, setOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // Slide animation
  const translateX = useRef(new Animated.Value(permanent ? 0 : -width)).current;

  React.useEffect(() => {
    if (permanent) return; // fixed
    Animated.timing(translateX, {
      toValue: open ? 0 : -width,
      duration: 210,
      useNativeDriver: true,
    }).start();
  }, [open, permanent, translateX, width]);

  // Close on route change (only for overlay mode)
  React.useEffect(() => {
    if (!permanent) setOpen(false);
  }, [pathname]);

  const handleNavigate = useCallback(
    (href: string) => {
      onNavigate?.(href);
      // Using router.push with strings avoids the Link typing issue from expo-router's Href type.
      router.push(href as any);
    },
    [onNavigate, router]
  );

  const menu = (
    <SafeAreaView style={[styles.sidebar, { width, backgroundColor }]}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <View style={styles.list}>
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (pathname?.startsWith(item.href) && item.href !== "/");
          return (
            <Pressable
              key={item.key}
              onPress={() => handleNavigate(item.href)}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: active ? activeBg : inactiveBg },
                pressed && { opacity: 0.85 },
              ]}
            >
              {item.render ? (
                item.render(active)
              ) : (
                <>
                  {item.icon ? (
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={active ? activeTint : inactiveTint}
                      style={{ marginRight: 10 }}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.label,
                      { color: active ? activeTint : inactiveTint },
                    ]}
                  >
                    {item.label}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );

  if (permanent) {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        {menu}
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Overlay */}
      {open && (
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
      )}

      {/* Animated drawer */}
      <Animated.View
        style={[styles.drawer, { width, transform: [{ translateX }] }]}
      >
        {menu}
      </Animated.View>

      {/* Screen content */}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 10,
  },
  sidebar: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E6EB",
    marginBottom: 6,
    paddingHorizontal: 15,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginVertical: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E4E6EB",
    paddingHorizontal: 15,
  },
});

// Example usage (place in any screen, e.g., app/akila/dashboard.tsx)
// ---------------------------------------------------------------
// import { SidebarProvider, SidebarContainer, SidebarTrigger } from '@/components/Sidebar';
// import { View, Text } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
//
// export default function Dashboard() {
//   const items = [
//     { key: 'home', label: 'Dashboard', href: '/akila/dashboard', icon: 'grid-outline' },
//     { key: 'students', label: 'Students', href: '/akila/students', icon: 'people-outline' },
//     { key: 'reports', label: 'Reports', href: '/akila/reports', icon: 'bar-chart-outline' },
//     { key: 'settings', label: 'Settings', href: '/akila/settings', icon: 'settings-outline' },
//   ];
//
//   return (
//     <SidebarProvider>
//       <SidebarContainer
//         items={items}
//         header={<Text style={{ fontSize: 18, fontWeight: '700' }}>Akila Panel</Text>}
//         footer={<Text style={{ color: '#666' }}>v1.0.0</Text>}
//       >
//         {/* Top bar */}
//         <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
//           <SidebarTrigger />
//           <Text style={{ fontSize: 20, fontWeight: '700' }}>Dashboard</Text>
//         </View>
//
//         {/* Your screen body here */}
//         <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
//           <Text>Content…</Text>
//         </View>
//       </SidebarContainer>
//     </SidebarProvider>
//   );
// }
