
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { Check, LucideBarChart2, Shield, Users, MessageCircle, QrCode, Printer } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState(true);
  const { user, userRole } = useAuth();
  
  useEffect(() => {
    const checkOrganization = async () => {
      try {
        // Use raw query since organization_settings is not in types yet
        const { count, error } = await supabase
          .from('organization_settings')
          .select('*', { count: 'exact', head: true });
          
        if (error) throw error;
        
        // If no organization exists, update state
        setHasOrganization(count !== 0);
      } catch (error) {
        console.error("Error checking organization:", error);
        setHasOrganization(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkOrganization();
  }, [navigate]);

  // Redirect authenticated users based on role
  useEffect(() => {
    if (user && userRole) {
      let targetRoute = "/parent-dashboard";
      
      if (userRole === "admin") {
        targetRoute = "/admin-dashboard";
      } else if (userRole === "staff") {
        targetRoute = "/teacher-dashboard";
      }
      
      navigate(targetRoute);
    }
  }, [user, userRole, navigate]);
  
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
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">ChurchCheck</h1>
          </div>
          <div>
            <Button 
              onClick={() => navigate('/check-in-kiosk')}
              variant="ghost"
              className="mr-2"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/organization-setup')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
        <div className="max-w-4xl text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-blue-600 mb-6">
            Secure Children's Check-in System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A simple, secure, and efficient way to check children in and out of your church or organization's children's ministry
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => navigate('/organization-setup')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
              size="lg"
            >
              Create an Organization
            </Button>
            
            <Button 
              onClick={() => navigate('/check-in-kiosk')}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Powerful Features</h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
            Everything you need to manage your children's ministry check-in process efficiently and securely
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<QrCode className="h-8 w-8 text-blue-500" />}
              title="QR Code Check-in/out"
              description="Fast and secure check-in and check-out process with QR code technology"
            />
            
            <FeatureCard 
              icon={<Printer className="h-8 w-8 text-blue-500" />}
              title="Name Tag Printing"
              description="Automatic printing of name tags with security codes and allergy information"
            />
            
            <FeatureCard 
              icon={<Shield className="h-8 w-8 text-blue-500" />}
              title="Secure System"
              description="Role-based access and security measures to keep children's data safe"
            />
            
            <FeatureCard 
              icon={<LucideBarChart2 className="h-8 w-8 text-blue-500" />}
              title="Attendance Reports"
              description="Comprehensive reports and analytics for attendance tracking"
            />
            
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-blue-500" />}
              title="Family Management"
              description="Efficiently manage multiple children and authorized pickups"
            />
            
            <FeatureCard 
              icon={<MessageCircle className="h-8 w-8 text-blue-500" />}
              title="Parent Communication"
              description="Easy communication tools for updates and notifications"
            />
          </div>
        </div>
      </div>
      
      {/* Testimonials/Social Proof */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ChurchCheck</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex gap-3 mb-4">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold">Simple to Use</h3>
                  <p className="text-gray-600">
                    Intuitive interface designed for volunteers and staff of all technical abilities
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mb-4">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold">Security First</h3>
                  <p className="text-gray-600">
                    Built with child safety as a priority, including security codes and authorized pickup verification
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold">Customizable</h3>
                  <p className="text-gray-600">
                    Adapt the system to fit your organization's specific needs and workflows
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-sm border">
              <div className="flex gap-3 mb-4">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold">Real-time Updates</h3>
                  <p className="text-gray-600">
                    Monitor classroom attendance and capacity in real-time
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mb-4">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold">Data-Driven Insights</h3>
                  <p className="text-gray-600">
                    Comprehensive reporting tools to help you understand attendance trends
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold">Multi-device Support</h3>
                  <p className="text-gray-600">
                    Access from any device, allowing flexible check-in stations and monitoring
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Check-in Process?</h2>
          <p className="text-xl text-blue-100 mb-10">
            Join organizations already using ChurchCheck to create safer, more efficient children's ministries
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => navigate('/organization-setup')}
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
              size="lg"
            >
              Create an Organization
            </Button>
            
            <Button 
              onClick={() => navigate('/check-in-kiosk')}
              variant="outline"
              className="border-white text-white hover:bg-blue-700 px-8 py-6 text-lg"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="mb-8 md:mb-0">
              <h2 className="text-2xl font-bold mb-4">ChurchCheck</h2>
              <p className="text-gray-400 max-w-xs">
                Secure children's check-in system for churches and organizations
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Features</li>
                  <li>Pricing</li>
                  <li>Testimonials</li>
                  <li>FAQ</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>About</li>
                  <li>Contact</li>
                  <li>Blog</li>
                  <li>Careers</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>Help Center</li>
                  <li>Documentation</li>
                  <li>Status</li>
                  <li>Contact Support</li>
                </ul>
              </div>
            </div>
          </div>
          
          <Separator className="bg-gray-700 my-8" />
          
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} ChurchCheck. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default LandingPage;
