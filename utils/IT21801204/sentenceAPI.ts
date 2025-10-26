const API_URL =
  process.env.EXPO_PUBLIC_SENTENCE_API ?? "http://192.168.0.195:8000";

export async function generateSentences(
  words: string[]
): Promise<{ word: string; sentence: string; used_word: boolean }[]> {
  try {
    const res = await fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Sentence generation failed");
    }

    const data = await res.json();
    return data.results ?? [];
  } catch (err) {
    console.error("Sentence API error:", err);
    // Fallback: just echo words
    return words.map((w) => ({
      word: w,
      sentence: `Can you use the word ${w}?`,
      used_word: true,
    }));
  }
}
