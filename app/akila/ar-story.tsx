import AllIEPReportsList from "@/components/IT21832826/screens/iep_reports/AllIEPReportsList";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function ARStoryRoute() {
  const params = useLocalSearchParams<{ word?: string }>();
  const word = (params.word as string) || "yacht";
  // Open AR immediately after navigating here
  return <AllIEPReportsList />;
}

