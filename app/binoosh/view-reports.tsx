import { StyleSheet, Text, View } from "react-native";

export default function ViewReports() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>View Reports Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#fff" // Added background color
  },
  text: { fontSize: 20, fontWeight: "bold" },
});
