import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type WordItem = {
  id: string;
  letter: string;
  word: string;
  icon?: keyof typeof MaterialIcons.glyphMap | keyof typeof Feather.glyphMap;
};

type Props = {
  title?: string;
  words?: WordItem[];
  onSearch?: (query: string) => void;
};

const DEFAULT_DATA: WordItem[] = [
  { id: "1", letter: "Y", word: "yacht", icon: "star" },
  { id: "2", letter: "I", word: "island", icon: "star" },
  { id: "3", letter: "C", word: "colonel", icon: "star" },
  { id: "4", letter: "H", word: "have", icon: "star" },
];

export default function SurfaceDyslexia({ title = "Surface Dyslexia", words, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const data = words ?? DEFAULT_DATA;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((w) => w.word.toLowerCase().includes(q) || w.letter.toLowerCase().includes(q));
  }, [query, data]);

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        contentContainerStyle={{ paddingBottom: 24 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View>
            <Text style={styles.brand}>ARise</Text>

            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>{title}</Text>

              <View style={styles.searchRow}>
                <Ionicons name="search" size={22} color="#8b8aa6" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search"
                  placeholderTextColor="#b8b7cc"
                  value={query}
                  onChangeText={(t) => {
                    setQuery(t);
                    onSearch?.(t);
                  }}
                  style={styles.searchInput}
                />
                <Ionicons name="options" size={22} color="#8b8aa6" />
              </View>

              <View style={styles.filtersRow}>
                <Chip label="Difficulty" />
                <Chip label="Category" />
              </View>
              <View style={[styles.filtersRow, { marginTop: 12 }]}>
                <Chip label="Length" />
              </View>
            </View>
          </View>
        )}
        renderItem={({ item }) => <WordRow item={item} />}
      />
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

function WordRow({ item }: { item: WordItem }) {
  return (
    <View style={styles.rowCard}>
      <View style={styles.letterPill}>
        <Text style={styles.letter}>{item.letter}</Text>
      </View>

      <Text style={styles.word}>{item.word}</Text>

      <View style={styles.trailingIconWrap}>
        {typeof item.icon === "string" && (MaterialIcons as any).hasOwnProperty("glyphMap") && (MaterialIcons as any).glyphMap[item.icon] ? (
          <MaterialIcons name={item.icon as any} size={22} color="#6b21a8" />
        ) : (
          <Feather name={(item.icon as any) || "star"} size={22} color="#6b21a8" />
        )}
      </View>
    </View>
  );
}

const PURPLE = "#8b5cf6";
const DEEP_PURPLE = "#5b21b6";
const LILAC = "#eee5ff";
const YELLOW = "#facc15";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff7e6" },
  brand: {
    fontSize: 28,
    fontWeight: "900",
    color: DEEP_PURPLE,
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 12,
  },
  headerCard: {
    backgroundColor: PURPLE,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 12,
    elevation: 6,
  },
  headerTitle: {
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
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: DEEP_PURPLE,
  },
  filtersRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 12,
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: YELLOW,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  chipText: {
    color: DEEP_PURPLE,
    fontWeight: "800",
  },
  rowCard: {
    marginTop: 18,
    marginHorizontal: 16,
    backgroundColor: LILAC,
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
  letterPill: {
    backgroundColor: PURPLE,
    width: 64,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  letter: {
    color: "#f3e8ff",
    fontSize: 26,
    fontWeight: "900",
  },
  word: {
    flex: 1,
    color: DEEP_PURPLE,
    fontSize: 26,
    fontWeight: "900",
  },
  trailingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },
});
