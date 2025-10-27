import { Stack } from "expo-router";

export default function AkilaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="surface-dyslexia" />
      <Stack.Screen name="ar-story" />
      <Stack.Screen name="login" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="iep" />
      <Stack.Screen name="celebration" />
      <Stack.Screen name="encouragement" />
    </Stack>
  );
}
