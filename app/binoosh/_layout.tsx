import { Stack } from "expo-router";

export default function BinooshLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="dashboard"
        options={{ title: "Dashboard" }}
      />
      <Stack.Screen
        name="manage-words"
        options={{ title: "Manage Words"}}
      />
      <Stack.Screen
        name="create-word"
        options={{ title: "Create Word" }}
      />
      <Stack.Screen
        name="view-words"
        options={{ title: "View Words" }}
      />
      <Stack.Screen
        name="manage-plans"
        options={{ title: "Manage Plans" }}
      />
      <Stack.Screen
        name="view-reports"
        options={{ title: "Reports" }}
      />
      <Stack.Screen
        name="complexity-picker"
        options={{ title: "Complexity Picker" }}
      />
    </Stack>
  );
}
