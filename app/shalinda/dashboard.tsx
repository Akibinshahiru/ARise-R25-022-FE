import HomeButton from "@/components/shared/HomeButton";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function ShalindaDashboard() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.text}>Shalinda’s Dashboard</Text>
        <HomeButton />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  text: { fontSize: 24, fontWeight: "bold" },
});
