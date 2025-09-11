// utils/sentenceGenerator.ts

/**
 * Generate a kid-friendly sentence for a given word.
 * Later, you can replace this with an API call or ML model.
 */
export function generateSentence(word: string): string {
  const templates = [
    `I saw a ${word} in the park today.`,
    `Can you spell the word ${word}?`,
    `The ${word} is very important in our story.`,
    `Let’s draw a picture of a ${word}.`,
    `My friend likes the word ${word}.`,
    `Do you know how to read ${word}?`,
  ];

  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}

/**
 * Bulk helper: generate sentences for a list of words
 */
export function generateSentences(
  words: string[]
): { word: string; sentence: string }[] {
  return words.map((w) => ({ word: w, sentence: generateSentence(w) }));
}
