
import AppLayout from "@/components/layout/AppLayout";
import ParentChildManagement from "@/components/parent/ParentChildManagement";
import { useAuth } from "@/context/CleanAuthContext";

const ParentChildrenPage = () => {
  const { isParent } = useAuth();

  if (!isParent) {
    return <div>Access denied. Parent access required.</div>;
  }

  return (
    <AppLayout>
      <ParentChildManagement />
    </AppLayout>
  );
};

export default ParentChildrenPage;
