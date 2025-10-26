import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ManageWords() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Words</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/binoosh/create-word")}
      >
        <Text style={styles.buttonText}>Create New Word</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/binoosh/view-words")}
      >
        <Text style={styles.buttonText}>View Created Words</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  button: {
    width: "80%",
    backgroundColor: "#3b82f6",
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
