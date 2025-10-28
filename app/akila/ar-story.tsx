import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import EpisodeStoryPlayer from "../../components/IT21832826/screens/story_generation/EpisodeStoryPlayer";

export default function ARStoryRoute() {
  const params = useLocalSearchParams<{ word?: string }>();
  const word = (params.word as string) || "yacht";

  return (
    <RoleAwareSidebarLayout title="AR Story Explorer">
      <View style={{ flex: 1 }}>
        <EpisodeStoryPlayer word={word} />
      </View>
    </RoleAwareSidebarLayout>
  );
}
