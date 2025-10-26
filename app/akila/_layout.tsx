import { Stack } from "expo-router";

export default function AkilaLayout() {
  return (
    <Stack
      initialRouteName="dashboard"
      screenOptions={{ headerShown: false }}
    />
  );
}
