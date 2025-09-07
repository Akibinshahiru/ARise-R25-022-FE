// components/shared/HomeButton.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export default function HomeButton() {
  const router = useRouter();

  const handlePress = () => {
    Alert.alert(
      "Confirm Navigation",
      "Do you wish to go to homepage?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => router.replace("/") },
      ],
      { cancelable: true }
    );
  };

  // Icon must be wrapped in <Text> on Web to avoid raw glyph issues
  const icon = <Ionicons name="home" size={28} color="#fff" />;
  const wrappedIcon = Platform.OS === "web" ? <Text>{icon}</Text> : icon;

  return (
    <TouchableOpacity style={styles.fab} onPress={handlePress}>
      {wrappedIcon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#111827", // dark background
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",

    // shadows
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
