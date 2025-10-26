// app/shalinda/(authed)/create-quiz.tsx
import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import { SUGGESTED_WORDS } from "@/constants/IT21801204/words";
import type { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSelector } from "react-redux";

const PREPOPULATED_WORDS: string[] = [];

type Suggested = { word: string; common_mistakes: string[] };

// ——— tiny util: pick dark or light text for a gradient by the first stop
function pickTextColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  // relative luminance
  const [R, G, B] = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  return L > 0.6 ? "#111827" : "#ffffff";
}

export default function CreateQuizScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  // Tutor-only guard
  useEffect(() => {
    if (!user) router.replace("/shalinda/login");
    else if (user.role !== "tutor")
      router.replace("/shalinda/(authed)/student/studentHome");
  }, [user]);

  const [title, setTitle] = useState(""); // ✅ new quiz title
  const [input, setInput] = useState("");
  const [words, setWords] = useState<string[]>(PREPOPULATED_WORDS);
  const [showSuggested, setShowSuggested] = useState(true);
  const [filter, setFilter] = useState("");

  // kids-friendly pastel gradients
  const gradients = useMemo(
    () => [
      ["#4e54c8", "#8f94fb"], // purple → pastel blue
    ],
    []
  );

  const isInList = (w: string) =>
    words.some((x) => x.toLowerCase() === w.toLowerCase());

  const haptic = async () => {
    try {
      await Haptics.selectionAsync();
    } catch {}
  };

  const addWord = async (w: string) => {
    if (!isInList(w)) {
      setWords((prev) => [...prev, w]);
      haptic();
    }
  };

  const removeWord = async (w: string) => {
    setWords((prev) => prev.filter((x) => x.toLowerCase() !== w.toLowerCase()));
    haptic();
  };

  const toggleWord = async (w: string) =>
    isInList(w) ? removeWord(w) : addWord(w);

  // Add words whenever user types a comma or presses return
  const commitInputToWords = (text?: string) => {
    const src = typeof text === "string" ? text : input;
    const parts = src
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    if (!parts.length) return;

    setWords((prev) => {
      const set = new Set(prev.map((w) => w.toLowerCase()));
      const next = [...prev];
      parts.forEach((p) => {
        if (!set.has(p.toLowerCase())) next.push(p);
      });
      return next;
    });
    setInput("");
    haptic();
  };

  const onChange = (t: string) => {
    if (t.endsWith(",")) {
      commitInputToWords(t);
      return;
    }
    setInput(t);
  };

  const handleGenerate = () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a quiz title.");
      return;
    }
    if (!words.length) {
      Alert.alert("No words selected", "Please add at least one word.");
      return;
    }

    const payload = encodeURIComponent(JSON.stringify(words));
    router.push({
      pathname: "/shalinda/(authed)/tutor/quizPreview",
      params: { words: payload, title },
    });
  };

  const filteredSuggested = useMemo(() => {
    if (!filter.trim()) return SUGGESTED_WORDS;
    const f = filter.toLowerCase();
    return SUGGESTED_WORDS.filter(
      (s: Suggested) =>
        s.word.toLowerCase().includes(f) ||
        s.common_mistakes.some((m) => m.toLowerCase().includes(f))
    );
  }, [filter]);

  if (!user || user.role !== "tutor") return null;

  return (
    <RoleAwareSidebarLayout title="Create Quiz">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.container}>
              <Text style={styles.heading}>🎈 Create Quiz</Text>
              <Text style={styles.subheading}>
                Add a title and pick words for your quiz ✍️
              </Text>

              {/* Quiz Title */}
              <Text style={styles.label}>Quiz Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Enter quiz title"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              {/* Input for words */}
              <Text style={styles.label}>Add your own word</Text>
              <TextInput
                value={input}
                onChangeText={onChange}
                onSubmitEditing={() => commitInputToWords()}
                onBlur={() => commitInputToWords()}
                placeholder="Type a word, then press , or Return"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                returnKeyType="done"
              />

              {/* Selected Words */}
              <Text style={styles.sectionTitle}>
                ✅ Selected Words{" "}
                <Text style={styles.muted}>({words.length})</Text>
              </Text>
              <View style={styles.chipsWrap}>
                {words.map((w, i) => {
                  const g = gradients[i % gradients.length] as any;
                  const textColor = pickTextColor(g[0]);
                  return (
                    <View key={`${w}-${i}`} style={styles.chipWrap}>
                      <LinearGradient colors={g} style={styles.chip}>
                        <Text style={[styles.chipText, { color: textColor }]}>
                          {w}
                        </Text>
                      </LinearGradient>
                      <TouchableOpacity
                        onPress={() => removeWord(w)}
                        style={styles.closeBtn}
                      >
                        <Ionicons name="close" size={16} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Generate button */}
              <TouchableOpacity activeOpacity={0.9} onPress={handleGenerate}>
                <LinearGradient
                  colors={["#7C3AED", "#6D28D9", "#4F46E5"] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateBtn}
                >
                  <Text style={styles.generateText}>🚀 Generate</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Suggested Words */}
              <Text style={styles.sectionTitle}>
                🌟 Suggested Words{" "}
                <Text style={styles.muted}>({SUGGESTED_WORDS.length})</Text>
              </Text>
              {/* … keep your existing suggested words code … */}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RoleAwareSidebarLayout>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
  },
  subheading: {
    marginTop: 8,
    fontSize: 18,
    textAlign: "center",
    color: "#374151",
    opacity: 0.9,
    marginBottom: 16,
  },
  label: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 16,
    color: "#374151",
    fontWeight: "700",
  },
  input: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#60A5FA",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    fontSize: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  muted: { color: "#6b7280", fontWeight: "600" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chipWrap: { position: "relative" },
  chip: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 20, fontWeight: "800" },
  closeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  generateBtn: {
    alignSelf: "center",
    marginTop: 28,
    width: 280,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  generateText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  scrollContent: { paddingBottom: 48 },
});
