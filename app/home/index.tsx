import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import { RootState } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";


export default function HomePage() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  useEffect(() => {    
    if (!user?.role) {
      router.replace("/login");
    }
  }, [user?.role]);
  
  const members = useMemo(
    () => [
      {
        name: "Surface Dyslexia",
        path: user?.role == "tutor" ? "/akila/iep" : "/akila/surface-dyslexia",
        colors: ["#4f46e5", "#6366f1"]
      },
      {
        name: "Phonological Dyslexia",
        path: user?.role == "tutor" ? "/binoosh/dashboard" : "/binoosh/view-challenges",
        colors: ["#ec4899", "#f472b6"],
      },
      {
        name: "Orthographic Dyslexia",
        path: user?.role == "tutor" ? "/shalinda/(authed)/tutor/tutorHome" : "/shalinda/(authed)/student/studentHome",
        colors: ["#f59e0b", "#fbbf24"],
      },
      { name: "Hiruni", path: "/hiruni/dashboard", colors: ["#4f46e5", "#6366f1"] },
    ],
    [user?.role]
  );

  return (
    <RoleAwareSidebarLayout title={`${user?.role.charAt(0).toUpperCase() + String(user?.role).slice(1)} Dashboard`}>
    <View style={styles.container}>
      <Text style={styles.heading}>Weclome to ARISE</Text>
      <View style={styles.row}>
        {members.slice(0, 2).map((member) => (
          <TouchableOpacity
            key={member.name}
            style={{ flex: 0.48 }}
            onPress={() => router.push({ pathname: member.path } as any)}
          >
            <LinearGradient colors={member.colors as any} style={styles.card}>
              <Text style={styles.cardText}>{member.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        {members.slice(2, 4).map((member) => (
          <TouchableOpacity
            key={member.name}
            style={{ flex: 0.48 }}
            onPress={() => router.push({ pathname: member.path } as any)}
          >
            <LinearGradient colors={member.colors as any} style={styles.card}>
              <Text style={styles.cardText}>{member.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",            // deep slate for contrast
    padding: 24,
    justifyContent: "center",
  },
  heading: {
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    color: "#6366f1",
    letterSpacing: 1.2,
    marginBottom: 28,
    textShadowRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  card: {
    height: 140,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",

    // Glow + depth
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 10,

    // Subtle inner border to make gradients pop
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",

    // Slight glassy feel over gradient
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
  },
  cardText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    paddingHorizontal: 8,
  },
});
