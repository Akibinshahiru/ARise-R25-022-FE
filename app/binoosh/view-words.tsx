import { Picker } from "@react-native-picker/picker"; // ✅ installed package
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Word = {
  _id: string;
  word: string;
  wordSegmented: string;
  complexity: number;
  isPseudo: boolean;
  soundClipRef?: string | null;
};

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
      }>("http://192.168.43.137:5000/api/words");
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
      data = data.filter((w) =>
        w.word.toLowerCase().includes(search.toLowerCase())
      );
    }

    // sorting
    data.sort((a, b) => {
      if (sortBy === "word") {
        return order === "asc"
          ? a.word.localeCompare(b.word)
          : b.word.localeCompare(a.word);
      } else {
        return order === "asc"
          ? a.complexity - b.complexity
          : b.complexity - a.complexity;
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
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.search}
        placeholder="Search words..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Sorting controls */}
      <View style={styles.sortRow}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>Sort By:</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={sortBy}
              onValueChange={(v) => setSortBy(v)}
              style={styles.picker}
              dropdownIconColor="#333"
            >
              <Picker.Item label="Word" value="word" />
              <Picker.Item label="Complexity" value="complexity" />
            </Picker>
          </View>
        </View>
        <View style={styles.pickerWrapper}>
          <Text style={styles.label}>Order:</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={order}
              onValueChange={(v) => setOrder(v)}
              style={styles.picker}
              dropdownIconColor="#333"
            >
              <Picker.Item label="Ascending" value="asc" />
              <Picker.Item label="Descending" value="desc" />
            </Picker>
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
          renderItem={({ item }) => (
            <TouchableOpacity
            style={styles.item}
            onPress={() =>
                router.push({
                pathname: "/binoosh/view-word",
                params: { wordData: JSON.stringify(item) },
            })
            }

            >
              <Text style={styles.word}>{item.word}</Text>
              <Text>Segmented: {item.wordSegmented}</Text>
              <Text>Complexity: {item.complexity}</Text>
              <Text>Pseudo: {item.isPseudo ? "Yes" : "No"}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  sortRow: { flexDirection: "row", justifyContent: "space-between" },
  pickerWrapper: { flex: 1, marginHorizontal: 4 },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: { height: 55, width: "100%" },
  label: { fontWeight: "bold", marginBottom: 4 },
  item: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  word: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666" },
});
