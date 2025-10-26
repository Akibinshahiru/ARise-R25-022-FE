import { UnauthenticatedSidebarLayout } from "@/components/it21801204";
import HomeButton from "@/components/shared/HomeButton";
import { StyleSheet, Text, View } from "react-native";

export default function ShalindaDashboard() {
  return (
    <UnauthenticatedSidebarLayout title="Welcome">
      <View style={styles.container}>
        <Text style={styles.text}>Welcome to Arise!</Text>
        <HomeButton />
      </View>
    </UnauthenticatedSidebarLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#81e5bc",
  },
  text: { fontSize: 24, fontWeight: "bold" },
});
