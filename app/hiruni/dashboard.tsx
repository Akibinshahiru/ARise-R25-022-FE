import HomeButton from "@/components/shared/HomeButton";
import { StyleSheet, Text, View } from "react-native";

export default function HiruniDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hiruni's Dashboard</Text>
      <HomeButton />
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
