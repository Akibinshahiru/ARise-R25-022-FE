import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Button,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function CreateWordScreen() {
  const router = useRouter();
  const [word, setWord] = useState("");
  const [segmented, setSegmented] = useState("");
  const [complexity, setComplexity] = useState<number | null>(null);
  const [isPseudo, setIsPseudo] = useState(false);
  const [soundClip, setSoundClip] = useState<any | null>(null);

  const pickAudio = () => {
    // Later you can integrate expo-document-picker or expo-av
    alert("Pick audio not implemented yet");
  };

  const handleSave = () => {
    // 🚨 TODO: Call backend API to save word
    console.log({
      word,
      segmented,
      complexity,
      isPseudo,
      soundClip,
    });
    alert("Word saved (placeholder)");
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Word */}
      <TextInput
        style={styles.input}
        placeholder="Enter Word"
        value={word}
        onChangeText={setWord}
      />

      {/* Segmented Word */}
      <TextInput
        style={styles.input}
        placeholder="Segmented Word (e.g., sev-en)"
        value={segmented}
        onChangeText={setSegmented}
      />

      {/* Complexity Picker link */}
      <TouchableOpacity
        onPress={() => router.push("/binoosh/complexity-picker")}
      >
        <Text style={styles.link}>
          {complexity !== null
            ? `Complexity: ${complexity}`
            : "Pick Complexity"}
        </Text>
      </TouchableOpacity>

      {/* Pseudo toggle */}
      <View style={styles.row}>
        <Text>Is Pseudo?</Text>
        <Switch value={isPseudo} onValueChange={setIsPseudo} />
      </View>

      {/* Attach audio (only if not pseudo) */}
      {!isPseudo && (
        <Button title="Attach Sound Clip" onPress={pickAudio} />
      )}

      {/* Save button */}
      <View style={{ marginTop: 30 }}>
        <Button title="Save Word" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 20, backgroundColor: "#ffff" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: { color: "#3b82f6", fontWeight: "bold", marginTop: 8 },
});
