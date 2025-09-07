import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TutorHome() {
  const router = useRouter();

  const members = [
    {
      name: "Create Quiz",
      path: "/create-quiz", // <- update to your route
      colors: ["#4f46e5", "#6366f1"], // indigo gradient
    },
    {
      name: "View Past Reports",
      path: "/reports", // <- update to your route
      colors: ["#059669", "#10b981"], // green gradient
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Tutor Home</Text>

        <View style={styles.row}>
          {members.slice(0, 2).map((member) => (
            <TouchableOpacity
              key={member.name}
              style={{ flex: 0.48 }}
              onPress={() => router.push({ pathname: member.path } as any)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={member.colors as any} style={styles.card}>
                <Text style={styles.cardText}>{member.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    height: 140,
    borderRadius: 16,
    padding: 16,
    justifyContent: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
