// app/shalinda/(authed)/create-quiz.tsx
import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import type { RootState } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";

const PREPOPULATED_WORDS = [
  "Cat",
  "Calculator",
  "Man",
  "Satellite",
  "Excavator",
  "House",
  "Temple",
];

export default function CreateQuizScreen() {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.auth.user);

  // Tutor-only guard
  useEffect(() => {
    if (!user) router.replace("/shalinda/login");
    else if (user.role !== "tutor")
      router.replace("/shalinda/(authed)/student/studentHome");
  }, [user]);

  const [input, setInput] = useState("");
  const [words, setWords] = useState<string[]>(PREPOPULATED_WORDS);

  // chip colors matching the vibe in your mock
  const gradients = useMemo(
    () => [
      ["#A78BFA", "#DDD6FE", "#FDE68A"], // soft purple -> pastel yellow
      ["#FBBF24", "#FDE68A"], // warm amber -> pastel yellow
      ["#6EE7B7", "#A7F3D0"], // mint green -> soft teal
      ["#60A5FA", "#BFDBFE"], // sky blue -> light blue
      ["#F9A8D4", "#FDE68A"], // pastel pink -> light yellow
      ["#FCD34D", "#FEF9C3"], // golden yellow -> cream

      // Extra playful combos 🌈
      ["#FCA5A5", "#FDBA74"], // soft red -> peach
      ["#93C5FD", "#C4B5FD"], // baby blue -> lilac
      ["#34D399", "#6EE7B7"], // green -> mint
      ["#F472B6", "#FBCFE8"], // pink -> light rose
      ["#38BDF8", "#A5F3FC"], // aqua -> sky
      ["#FCD34D", "#FCA5A5"], // yellow -> coral
    ],
    []
  );

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
  };

  const onChange = (t: string) => {
    // if user typed a comma, commit current content immediately
    if (t.endsWith(",")) {
      commitInputToWords(t);
      return;
    }
    setInput(t);
  };

  const removeWord = (word: string) => {
    setWords((prev) =>
      prev.filter((w) => w.toLowerCase() !== word.toLowerCase())
    );
  };

  const handleGenerate = () => {
    // TODO: wire to backend or navigate to a "review" screen
    console.log("Generating quiz with words:", words);
  };

  if (!user || user.role !== "tutor") return null;

  return (
    <RoleAwareSidebarLayout title="Create Quiz">
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.container}>
            {/* Title */}
            <Text style={styles.heading}>Create Quiz</Text>
            <Text style={styles.subheading}>
              Let’s make a list of words for the quiz
            </Text>

            {/* Input */}
            <TextInput
              value={input}
              onChangeText={onChange}
              onSubmitEditing={() => commitInputToWords()}
              onBlur={() => commitInputToWords()}
              placeholder="Add a word, then type , or press return"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              returnKeyType="done"
            />

            {/* Selected Words */}
            <Text style={styles.sectionTitle}>Selected Words:</Text>

            <View style={styles.chipsWrap}>
              {words.map((w, i) => {
                const g = gradients[i % gradients.length] as any;
                return (
                  <View key={`${w}-${i}`} style={styles.chipWrap}>
                    <LinearGradient colors={g} style={styles.chip}>
                      <Text style={styles.chipText}>{w}</Text>
                    </LinearGradient>

                    {/* Close / remove button */}
                    <TouchableOpacity
                      onPress={() => removeWord(w)}
                      activeOpacity={0.8}
                      style={styles.closeBtn}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
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
                <Text style={styles.generateText}>Generate</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    paddingTop: 24,
  },

  // Title + subtitle (centered like the mock)
  heading: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
  },
  subheading: {
    marginTop: 14,
    fontSize: 18,
    textAlign: "center",
    color: "#111827",
    opacity: 0.75,
    marginBottom: 20,
  },

  // Rounded, blue-outlined input
  input: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#60A5FA",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },

  // Section header
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  // Chips layout
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chipWrap: {
    position: "relative",
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Generate button (centered, purple gradient)
  generateBtn: {
    alignSelf: "center",
    marginTop: 36,
    width: 260,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  generateText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
});
