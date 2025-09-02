import { Stack } from "expo-router";

export default function ShalindaLayout() {
  return (
    <Stack
      initialRouteName="dashboard"
      screenOptions={{ headerShown: false }}
    />
  );
}
