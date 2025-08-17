
import AppLayout from "@/components/layout/AppLayout";
import ParentMessages from "@/components/parent/ParentMessages";
import { useAuth } from "@/context/CleanAuthContext";

const ParentMessagesPage = () => {
  const { isParent } = useAuth();

  if (!isParent) {
    return <div>Access denied. Parent access required.</div>;
  }

  return (
    <AppLayout>
      <ParentMessages />
    </AppLayout>
  );
};

export default ParentMessagesPage;
