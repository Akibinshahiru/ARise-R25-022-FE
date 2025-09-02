import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

export default function HomePage() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Dashboard</Text>

      <View style={styles.row}>
        <LinearGradient colors={["#4f46e5", "#6366f1"]} style={styles.card}>
          <Text style={styles.cardText}>Akila</Text>
        </LinearGradient>
        <LinearGradient colors={["#ec4899", "#f472b6"]} style={styles.card}>
          <Text style={styles.cardText}>Binoosh</Text>
        </LinearGradient>
      </View>

      <View style={styles.row}>
        <LinearGradient colors={["#f59e0b", "#fbbf24"]} style={styles.card}>
          <Text style={styles.cardText}>Shalinda</Text>
        </LinearGradient>
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
    flex: 0.48,
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
  cardText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
