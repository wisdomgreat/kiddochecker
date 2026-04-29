
import { useNavigate } from 'react-router-dom';

export const useManagementNavigation = () => {
  const navigate = useNavigate();

  const navigateToManagement = {
    staff: () => navigate('/staff-management'),
    users: () => navigate('/user-management'),
    devices: () => navigate('/device-management'),
    classes: () => navigate('/classes-management'),
    reports: () => navigate('/reports'),
    settings: () => navigate('/settings'),
  };

  return { navigateToManagement };
};

