import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AkilaDashboard() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.brand}>ARise</Text>

      <LinearGradient
        colors={["#8b5cf6", "#7c3aed"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <Text style={styles.heroTitle}>Surface Dyslexia</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#8b8aa6" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search"
            placeholderTextColor="#b8b7cc"
            style={styles.searchInput}
          />
          <Ionicons name="options" size={20} color="#8b8aa6" />
        </View>

        <View style={styles.chipsRow}>
          <Chip label="Difficulty" />
          <Chip label="Category" />
        </View>
        <View style={[styles.chipsRow, { marginTop: 10 }]}>
          <Chip label="Length" />
        </View>
      </LinearGradient>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.moduleRow}
        onPress={() => router.push("/akila/surface-dyslexia")}
      >
        <View style={styles.moduleLetter}>
          <Text style={styles.moduleLetterText}>S</Text>
        </View>
        <Text style={styles.moduleTitle}>Surface Dyslexia</Text>
        <View style={styles.moduleIcon}>
          <Ionicons name="arrow-forward" size={20} color="#6b21a8" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff7e6" },
  brand: {
    fontSize: 28,
    fontWeight: "900",
    color: "#5b21b6",
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 12,
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, marginHorizontal: 8, color: "#5b21b6" },
  chipsRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  chip: {
    backgroundColor: "#facc15",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    alignSelf: "flex-start",
  },
  chipText: { fontWeight: "800", color: "#5b21b6" },
  moduleRow: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: "#eee5ff",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 3,
  },
  moduleLetter: {
    backgroundColor: "#8b5cf6",
    width: 56,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  moduleLetterText: { color: "#f3e8ff", fontWeight: "900", fontSize: 22 },
  moduleTitle: { flex: 1, fontSize: 22, fontWeight: "900", color: "#5b21b6" },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
});
