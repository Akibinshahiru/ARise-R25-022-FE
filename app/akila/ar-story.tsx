import React from "react";
import { useLocalSearchParams } from "expo-router";
import EpisodeStoryPlayer from "../../components/IT21832826/screens/story_generation/EpisodeStoryPlayer";

export default function ARStoryRoute() {
  const params = useLocalSearchParams<{ word?: string }>();
  const word = (params.word as string) || "yacht";
  return <EpisodeStoryPlayer word={word} />;
}

