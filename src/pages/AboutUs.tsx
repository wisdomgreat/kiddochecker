
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/landing")}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">About KidCheck</h1>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              KidCheck is dedicated to providing safe, secure, and efficient child check-in and check-out solutions for organizations that serve children. Our mission is to enhance safety, streamline operations, and bring peace of mind to parents and staff.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Founded in 2023, KidCheck was born out of a need for better child management systems in churches, schools, and childcare facilities. Our founders, experienced in both technology and childhood education, recognized that existing solutions were often cumbersome and inadequate.
            </p>
            
            <p className="text-gray-700 mb-4">
              Starting with a small team of dedicated professionals, we developed our platform by working closely with childcare providers to understand their unique challenges. Today, KidCheck serves hundreds of organizations nationwide, continuously evolving to meet the changing needs of our clients.
            </p>
            
            <h2 className="text-xl font-semibold mb-4 mt-8">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-700 mb-2">Safety First</h3>
                <p className="text-sm text-gray-700">
                  We prioritize the safety and security of children above all else in our system design and features.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-700 mb-2">User-Focused</h3>
                <p className="text-sm text-gray-700">
                  We create intuitive, easy-to-use solutions that work for staff and parents of all technical abilities.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-700 mb-2">Continuous Improvement</h3>
                <p className="text-sm text-gray-700">
                  We constantly evolve our platform based on customer feedback and emerging best practices.
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-medium text-orange-700 mb-2">Reliability</h3>
                <p className="text-sm text-gray-700">
                  We understand that organizations rely on our system daily, so stability and uptime are paramount.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Our Team</h2>
            <p className="text-gray-700 mb-4">
              KidCheck is powered by a diverse team of professionals who are passionate about child safety and innovative technology solutions.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              {/* Team members would go here - placeholders for now */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="font-medium">Alex Johnson</h3>
                <p className="text-sm text-gray-500">CEO & Co-Founder</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="font-medium">Samantha Lee</h3>
                <p className="text-sm text-gray-500">CTO</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="font-medium">Michael Thompson</h3>
                <p className="text-sm text-gray-500">Head of Customer Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;
