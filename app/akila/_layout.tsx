import { Stack } from "expo-router";

export default function AkilaLayout() {
  return (<><Stack
    initialRouteName="ar-story"
    screenOptions={{ headerShown: false }}
  />
    <Stack.Screen name="surface-dyslexia" options={{ headerShown: false }} />
    </>
  );
}
