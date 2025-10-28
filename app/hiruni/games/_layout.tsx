import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="sequential-play"
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="letter-tracing" />
      <Stack.Screen name="sound-letter" />
      <Stack.Screen name="same-different" />
      <Stack.Screen name="letter-hunt" />
      <Stack.Screen name="color-matching" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
