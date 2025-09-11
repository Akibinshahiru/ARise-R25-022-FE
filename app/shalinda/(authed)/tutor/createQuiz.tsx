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

  const [input, setInput] = useState("");
  const [words, setWords] = useState<string[]>(PREPOPULATED_WORDS);
  const [showSuggested, setShowSuggested] = useState(true);
  const [filter, setFilter] = useState("");

  // kids-friendly pastel gradients
  const gradients = useMemo(
    () => [
      ["#4e54c8", "#8f94fb"], // warm amber -> pastel yellow
    ],
    []
  );

  // Helpers
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
    // Avoid empty submissions
    if (!words.length) {
      Alert.alert("No words selected", "Please add at least one word.");
      return;
    }

    // Expo Router params must be strings — encode the JSON
    const payload = encodeURIComponent(JSON.stringify(words));
    router.push({
      pathname: "/shalinda/(authed)/tutor/quizPreview",
      params: { words: payload },
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
              {/* Title */}
              <Text
                style={styles.heading}
                accessibilityRole="header"
                accessibilityLabel="Create Quiz"
              >
                🎈 Create Quiz
              </Text>
              <Text style={styles.subheading}>
                Pick words for your quiz. Add your own too! ✍️
              </Text>

              {/* Input */}
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
                accessibilityLabel="Add custom word"
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

                      {/* Close / remove button */}
                      <TouchableOpacity
                        onPress={() => removeWord(w)}
                        activeOpacity={0.85}
                        style={styles.closeBtn}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${w}`}
                      >
                        <Ionicons name="close" size={16} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Generate button */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleGenerate}
                accessibilityRole="button"
                accessibilityLabel="Generate quiz"
              >
                <LinearGradient
                  colors={["#7C3AED", "#6D28D9", "#4F46E5"] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.generateBtn}
                >
                  <Text style={styles.generateText}>🚀 Generate</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Suggested Words header + actions */}
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>
                  🌟 Suggested Words{" "}
                  <Text style={styles.muted}>({SUGGESTED_WORDS.length})</Text>
                </Text>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => {
                    const remaining = filteredSuggested
                      .map((s) => s.word)
                      .filter((w) => !isInList(w));
                    setWords((prev) => [...prev, ...remaining]);
                    haptic();
                  }}
                  style={styles.smallPill}
                  accessibilityLabel="Add all suggested"
                >
                  <Text style={styles.smallPillText}>Add all</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const set = new Set(
                      filteredSuggested.map((s) => s.word.toLowerCase())
                    );
                    setWords((prev) =>
                      prev.filter((w) => !set.has(w.toLowerCase()))
                    );
                    haptic();
                  }}
                  style={[styles.smallPill, { backgroundColor: "#FDE68A" }]}
                  accessibilityLabel="Clear all suggested from selection"
                >
                  <Text style={[styles.smallPillText, { color: "#111827" }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Suggested filter */}
              {showSuggested && (
                <TextInput
                  value={filter}
                  onChangeText={setFilter}
                  placeholder="Search suggested… (e.g., 'thru', 'friend')"
                  placeholderTextColor="#9ca3af"
                  style={styles.search}
                  accessibilityLabel="Search suggested words"
                />
              )}

              {/* Suggested Words */}
              {showSuggested && (
                <View style={styles.suggestWrap}>
                  {filteredSuggested.map((item, i) => {
                    const g = gradients[i % gradients.length] as any;
                    const active = isInList(item.word);
                    const textColor = pickTextColor(g[0]);
                    const scale = useRef(new Animated.Value(1)).current;

                    const bounce = () => {
                      Animated.sequence([
                        Animated.timing(scale, {
                          toValue: 0.96,
                          duration: 80,
                          useNativeDriver: true,
                        }),
                        Animated.timing(scale, {
                          toValue: 1,
                          duration: 120,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    };

                    return (
                      <View key={item.word} style={styles.suggestChipWrap}>
                        <Animated.View style={{ transform: [{ scale }] }}>
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={async () => {
                              bounce();
                              await toggleWord(item.word);
                            }}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`${active ? "Remove" : "Add"} ${
                              item.word
                            }`}
                          >
                            <LinearGradient
                              colors={g}
                              style={[
                                styles.suggestChip,
                                active && styles.suggestChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.suggestText,
                                  { color: textColor },
                                ]}
                              >
                                {item.word}
                              </Text>

                              {/* small badge with count of mistakes */}
                              <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                  {item.common_mistakes.length}
                                </Text>
                              </View>

                              {active && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color={textColor}
                                  style={{ marginLeft: 6 }}
                                />
                              )}
                            </LinearGradient>
                          </TouchableOpacity>
                        </Animated.View>

                        {/* info button to show common mistakes */}
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert(
                              `Common mistakes: ${item.word}`,
                              item.common_mistakes.join(", ")
                            )
                          }
                          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                          style={styles.infoBtn}
                          accessibilityRole="button"
                          accessibilityLabel={`Show common mistakes for ${item.word}`}
                        >
                          <Ionicons
                            name="information-circle-outline"
                            size={20}
                            color="#374151"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
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
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  muted: { color: "#6b7280", fontWeight: "600" },

  rowBetween: {
    marginTop: 8,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  smallPill: {
    backgroundColor: "#BFDBFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  smallPillText: { color: "#111827", fontWeight: "800" },
  iconBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    padding: 6,
  },

  // Search
  search: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    marginBottom: 8,
    fontSize: 16,
  },

  // Suggested chips
  suggestWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    gap: 12,
  },
  suggestChipWrap: {
    position: "relative",
  },
  suggestChip: {
    paddingVertical: 14, // bigger for kids
    paddingHorizontal: 18,
    borderRadius: 18,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  suggestChipActive: {
    borderWidth: 2,
    borderColor: "#11182722",
  },
  suggestText: {
    fontSize: 18,
    fontWeight: "800",
  },
  badge: {
    marginLeft: 8,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontWeight: "800", color: "#111827" },

  infoBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  // Selected chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chipWrap: {
    position: "relative",
  },
  chip: {
    paddingVertical: 14, // bigger
    paddingHorizontal: 20,
    borderRadius: 18,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 20,
    fontWeight: "800",
  },
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

  // Generate button
  generateBtn: {
    alignSelf: "center",
    marginTop: 28,
    width: 280,
    height: 60,
    borderRadius: 18,
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
    fontSize: 22,
    fontWeight: "800",
  },

  // Scroll container
  scrollContent: {
    paddingBottom: 48, // avoids last button being hidden
  },
});
