
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const LandingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkOrganization = async () => {
      try {
        // Use raw query since organization_settings is not in types yet
        const { count, error } = await supabase
          .from('organization_settings')
          .select('*', { count: 'exact', head: true });
          
        if (error) throw error;
        
        // If no organization exists, redirect to setup
        if (count === 0) {
          navigate('/organization-setup');
        }
      } catch (error) {
        console.error("Error checking organization:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkOrganization();
  }, [navigate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-6">
            Secure Children's Check-in
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A simple and secure way to check children in and out of your church or organization
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/check-in-kiosk')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Check-in Kiosk
            </button>
            <button 
              onClick={() => navigate('/parent-registration')}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg text-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Register as Parent
            </button>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Secure Check-in/out</h3>
              <p className="text-gray-600">
                Easy and secure process for parents to check their children in and out.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Name Tag Printing</h3>
              <p className="text-gray-600">
                Automatic name tag printing with security codes and allergy information.
              </p>
            </div>
            <div className="p-6 border rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Attendance Tracking</h3>
              <p className="text-gray-600">
                Comprehensive attendance reports and analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} ChurchCheck. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
