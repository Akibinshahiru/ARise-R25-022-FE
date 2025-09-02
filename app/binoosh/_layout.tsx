import { Stack } from "expo-router";

export default function BinooshLayout() {
  return (
    <Stack
      initialRouteName="dashboard"
      screenOptions={{ headerShown: false }}
    />
  );
}
