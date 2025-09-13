import { useLocalSearchParams } from "expo-router";
import React from "react";
import EpisodeStoryPlayer from "../../components/IT21832826/screens/story_generation/EpisodeStoryPlayer";

export default function ARStoryRoute() {
  const params = useLocalSearchParams<{ word?: string }>();
  const word = (params.word as string) || "yacht";
  // Open AR immediately after navigating here
  return <EpisodeStoryPlayer word={word} />;
}

