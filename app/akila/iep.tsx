import RoleAwareSidebarLayout from "@/components/it21801204/RoleAwareSidebarLayout";
import AllIEPReportsList from "@/components/IT21832826/screens/iep_reports/AllIEPReportsList";
import React from "react";
import { View } from "react-native";

export default function AkilaIepPage() {
  return (
    <RoleAwareSidebarLayout title="IEP Reports">
      <View style={{ flex: 1 }}>
        <AllIEPReportsList />
      </View>
    </RoleAwareSidebarLayout>
  );
}
