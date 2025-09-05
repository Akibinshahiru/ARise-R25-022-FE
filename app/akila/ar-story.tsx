import React from "react";
import { useLocalSearchParams } from "expo-router";
import ARWordStory from "../../components/IT21832826/screens/story_generation/ARWordStory";

export default function ARStoryRoute() {
  const params = useLocalSearchParams<{ word?: string }>();
  const word = (params.word as string) || "yacht";
  return <ARWordStory word={word} />;
}

