import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Dummy word list
const dummyWords = [
  { word: "cat", complexity: 1 },
  { word: "seven", complexity: 2 },
  { word: "banana", complexity: 3.45 },
  { word: "dinosaur", complexity: 4 },
  { word: "hippopotamus", complexity: 5 },
];

export default function ComplexityPicker() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState<string>("");

  const parsed = Number(inputValue);

  const lessOrEqual = dummyWords.filter((w) =>
    !isNaN(parsed) ? w.complexity <= parsed : false
  );
  const greater = dummyWords.filter((w) =>
    !isNaN(parsed) ? w.complexity > parsed : false
  );

  const handleConfirm = () => {
    if (!isNaN(parsed)) {
      router.push({
        pathname: "/binoosh/create-word",
        params: { complexity: parsed.toString() },
      });
    } else {
      alert("Please enter a valid number");
    }
  };

  return (
    <View style={styles.container}>
      {/* Upper list (less/equal) */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 10 }}>
        <Text style={styles.sectionTitle}>≤ Complexity</Text>
        {lessOrEqual.map((item) => (
          <TouchableOpacity
            key={item.word}
            style={styles.item}
            onPress={() => setInputValue(item.complexity.toString())}
          >
            <Text>{item.word}</Text>
            <Text style={styles.complexity}>({item.complexity})</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input field & confirm button */}
      <View style={styles.centerSection}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter complexity"
          value={inputValue}
          onChangeText={setInputValue}
        />
        <TouchableOpacity style={styles.checkButton} onPress={handleConfirm}>
          <Ionicons name="checkmark" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Lower list (greater) */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingTop: 10 }}>
        <Text style={styles.sectionTitle}> Complexity</Text>
        {greater.map((item) => (
          <TouchableOpacity
            key={item.word}
            style={styles.item}
            onPress={() => setInputValue(item.complexity.toString())}
          >
            <Text>{item.word}</Text>
            <Text style={styles.complexity}>({item.complexity})</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  list: { flex: 1, marginVertical: 8 },
  sectionTitle: { fontWeight: "bold", marginBottom: 6 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  centerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginRight: 10,
  },
  checkButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  complexity: { color: "#555" },
});
