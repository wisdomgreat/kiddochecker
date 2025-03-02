
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  Users, 
  Calendar, 
  BarChart2, 
  Shield, 
  ArrowRight,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <h1 className="text-5xl font-bold text-blue-600 mb-6">ChurchCheck</h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10">
          A secure and efficient check-in system for your church's children ministry
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/check-in-kiosk")}
          >
            Try Check-in Kiosk
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          {showAdminLogin ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/check-in-kiosk")}
              >
                Parent Login
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/settings")}
              >
                Staff Login
                <LogIn className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowAdminLogin(true)}
            >
              Sign In
              <LogIn className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<CheckCircle className="h-10 w-10 text-green-500" />}
              title="Easy Check-in"
              description="Fast and secure process for parents to check-in their children with QR codes and name tags."
            />
            
            <FeatureCard 
              icon={<Users className="h-10 w-10 text-blue-500" />}
              title="Class Management"
              description="Organize classes by age groups, assign teachers, and track attendance."
            />
            
            <FeatureCard 
              icon={<Shield className="h-10 w-10 text-purple-500" />}
              title="Secure Check-out"
              description="Ensure children are only released to authorized guardians with verification."
            />
            
            <FeatureCard 
              icon={<Calendar className="h-10 w-10 text-red-500" />}
              title="Event Planning"
              description="Schedule special events and manage registrations with ease."
            />
            
            <FeatureCard 
              icon={<BarChart2 className="h-10 w-10 text-amber-500" />}
              title="Analytics"
              description="Comprehensive reports on attendance, growth trends, and ministry insights."
            />
            
            <FeatureCard 
              icon={<Users className="h-10 w-10 text-teal-500" />}
              title="Family Management"
              description="Keep track of family relationships and emergency contacts in one place."
            />
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="bg-blue-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Trusted by Churches</h2>
          
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <p className="text-xl italic text-gray-600 mb-6">
              "ChurchCheck has completely transformed our Sunday morning check-in process. 
              It's reliable, secure, and our volunteers love how easy it is to use!"
            </p>
            <p className="font-medium text-gray-800">Pastor Michael, Grace Community Church</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">ChurchCheck</h3>
              <p className="text-gray-400">Secure check-in for your ministry</p>
            </div>
            
            <div className="flex gap-6">
              <Link to="/check-in-kiosk" className="text-gray-300 hover:text-white">
                Try Now
              </Link>
              <Link to="/settings" className="text-gray-300 hover:text-white">
                Staff Login
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ChurchCheck. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex items-center">
        {icon}
        <CardTitle className="mt-4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
};

export default LandingPage;
