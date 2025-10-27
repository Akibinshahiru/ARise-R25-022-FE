import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Config } from "../../constants/config";

type Word = {
  _id: string;
  word: string;
  wordSegmented: string;
  complexity: number;
  isPseudo: boolean;
  soundClipRef?: string | null;
};
// const ipAddress = process.env.API_BASE_URL;
const ipAddress = Config.DEVELOPMENT_API_URL;

export default function ViewWordsScreen() {
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [filtered, setFiltered] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState<"word" | "complexity">("word");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, sortBy, order, words]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const res = await axios.get<{
        count: number;
        message: string;
        words: Word[];
      }>(`${ipAddress}/api/words`);
      setWords(res.data.words);
    } catch (err: any) {
      console.error("Error fetching words:", err.message);
      alert("Failed to fetch words.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let data = [...words];

    // search filter
    if (search.trim()) {
      data = data.filter((w) => w.word.toLowerCase().includes(search.toLowerCase()));
    }

    // sorting
    data.sort((a, b) => {
      if (sortBy === "word") {
        return order === "asc" ? a.word.localeCompare(b.word) : b.word.localeCompare(a.word);
      } else {
        return order === "asc" ? a.complexity - b.complexity : b.complexity - a.complexity;
      }
    });

    setFiltered(data);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Decorative background blobs */}
      <LinearGradient colors={["#FFE6A7", "#FFB3C1"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.blobTop} />
      <LinearGradient colors={["#B5E4FF", "#D7C3FF"] as const} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.blobBottom} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand + hero */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>ARise</Text>
          <Ionicons name="library" size={22} color="#6C2BD9" />
        </View>
        <LinearGradient colors={["#7C3AED", "#4F46E5"] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Words Library</Text>
            <Text style={styles.subtitle}>Search, sort and tap a word to view.</Text>
          </View>
          <View style={styles.emojiBadge}><Text style={styles.emojiText}>📚</Text></View>
        </LinearGradient>

        {/* Search + sorting */}
        <View style={styles.formCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput style={styles.search} placeholder="Search words..." value={search} onChangeText={setSearch} />
          </View>

          <View style={styles.sortRow}>
            <View style={styles.pickerWrapper}>
              <Text style={styles.label}>Sort By</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={sortBy} onValueChange={(v) => setSortBy(v)} style={styles.picker} dropdownIconColor="#6B7280">
                  <Picker.Item label="Word" value="word" />
                  <Picker.Item label="Complexity" value="complexity" />
                </Picker>
              </View>
            </View>
            <View style={styles.pickerWrapper}>
              <Text style={styles.label}>Order</Text>
              <View style={styles.pickerBox}>
                <Picker selectedValue={order} onValueChange={(v) => setOrder(v)} style={styles.picker} dropdownIconColor="#6B7280">
                  <Picker.Item label="Ascending" value="asc" />
                  <Picker.Item label="Descending" value="desc" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* List */}
        {filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No words to display</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() =>
                  router.push({ pathname: "/binoosh/view-word", params: { wordData: JSON.stringify(item) } })
                }
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.word}>{item.word}</Text>
                  <View style={[styles.pill, { backgroundColor: "#EEF2FF" }]}>
                    <Ionicons name="star" size={12} color="#4F46E5" />
                    <Text style={styles.pillText}>{item.complexity}</Text>
                  </View>
                </View>
                <Text style={styles.itemText}>Segmented: {item.wordSegmented}</Text>
                <Text style={styles.itemText}>Pseudo: {item.isPseudo ? "Yes" : "No"}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7FB" },
  container: { padding: 20, paddingBottom: 40 },

  // Decorative blobs
  blobTop: { position: "absolute", top: -80, left: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },
  blobBottom: { position: "absolute", bottom: -70, right: -60, width: 220, height: 220, borderRadius: 120, opacity: 0.25 },

  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { fontSize: 22, fontWeight: "800", color: "#111827" },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginTop: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: "#E9D5FF", fontSize: 14, fontWeight: "600" },
  emojiBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginLeft: 12 },
  emojiText: { fontSize: 26 },

  formCard: { backgroundColor: "#ffffff", borderRadius: 16, padding: 14, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, height: 48, marginBottom: 10 },
  search: { flex: 1, fontSize: 15 },

  sortRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  pickerWrapper: { flex: 1 },
  pickerBox: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden", backgroundColor: "#F9FAFB" },
  picker: { height: 48, width: "100%", paddingVertical: 8 },
  label: { fontWeight: "800", marginBottom: 6, color: "#374151" },

  item: { padding: 14, marginVertical: 6, backgroundColor: "#ffffff", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  itemText: { color: "#374151" },
  word: { fontSize: 16, fontWeight: "800" },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: "#4F46E5", fontWeight: "800", fontSize: 12 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666" },
});

