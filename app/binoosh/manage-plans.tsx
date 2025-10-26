// app/binoosh/manage-plans.tsx
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ManagePlansScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Create Plan */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/binoosh/create-plan")}
      >
        <Text style={styles.buttonText}>Create Plan</Text>
      </TouchableOpacity>

      {/* View Plans */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/binoosh/view-plans")}
      >
        <Text style={styles.buttonText}>View Plans</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // vertically center
    alignItems: "center", // horizontally center
    padding: 20,
    backgroundColor: "#fff",
    gap: 20,
  },
  button: {
    width: "80%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
