import { StyleSheet, Text, View } from "react-native";

export default function AkilaDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Akila’s Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  text: { fontSize: 24, fontWeight: "bold" },
});
