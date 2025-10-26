import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const members = [
  { name: "Akila", path: "/akila/dashboard", colors: ["#4f46e5", "#6366f1"] },
  {
    name: "Phonological Dyslexia",
    path: "/binoosh/dashboard",
    colors: ["#ec4899", "#f472b6"],
  },
  {
    name: "Shalinda",
    path: "/shalinda/dashboard",
    colors: ["#f59e0b", "#fbbf24"],
  },
  { name: "Hiruni", path: "/hiruni/dashboard", colors: ["#4f46e5", "#6366f1"] },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>ARISE Homepage</Text>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 20,
    justifyContent: "center",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  card: {
    height: 120,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  cardText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
