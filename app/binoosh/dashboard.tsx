import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BinooshDashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Binoosh’s Dashboard</Text>

      {/* First row with 2 buttons */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.halfButton]}
          onPress={() => router.push("/binoosh/manage-words")}
        >
          <Text style={styles.buttonText}>Manage Words</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.halfButton]}
          onPress={() => router.push("/binoosh/manage-plans")}
        >
          <Text style={styles.buttonText}>Manage Plans</Text>
        </TouchableOpacity>
      </View>

      {/* Second row with 1 full-width button */}
      <TouchableOpacity
        style={[styles.button, styles.fullButton]}
        onPress={() => router.push("/binoosh/view-reports")}
      >
        <Text style={styles.buttonText}>View Reports</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f3f4f6",

    // Center vertically
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fullButton: {
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
