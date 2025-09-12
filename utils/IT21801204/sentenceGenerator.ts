// utils/sentenceGenerator.ts

/**
 * Generate a kid-friendly sentence for a given word.
 * Replace with your API/ML service later.
 */
export function generateSentence(word: string): string {
  const templates = [
    `I saw a ${word} in the park today.`,
    `Can you spell the word ${word}?`,
    `The ${word} is very important in our story.`,
    `Let’s draw a picture of a ${word}.`,
    `My friend likes the word ${word}.`,
    `Do you know how to read ${word}?`,
    `We used the word ${word} to make a fun rhyme.`,
    `Point to the ${word} when you hear it.`,
  ];
  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}

/** Bulk helper */
export function generateSentences(words: string[]) {
  return words.map((w) => ({ word: w, sentence: generateSentence(w) }));
}
