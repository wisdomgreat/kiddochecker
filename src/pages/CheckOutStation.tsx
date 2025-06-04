
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CheckOutStation = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the unified check-in kiosk with checkout tab
    navigate('/check-in-kiosk?tab=checkout', { replace: true });
  }, [navigate]);

  return null;
};

export default CheckOutStation;
