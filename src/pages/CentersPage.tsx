
import React from "react";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import CenterFinder from "@/components/locations/CenterFinder";

const CentersPage = () => {
  return (
    <UnifiedDashboardLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <CenterFinder />
      </div>
    </UnifiedDashboardLayout>
  );
};

export default CentersPage;

