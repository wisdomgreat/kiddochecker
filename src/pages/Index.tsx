
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to landing page immediately
    navigate('/landing', { replace: true });
  }, [navigate]);

  return null; // This component just redirects, no UI needed
};

export default Index;
