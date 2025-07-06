
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  Shield, 
  Smartphone, 
  QrCode, 
  Calendar,
  MessageSquare,
  UserPlus,
  LogIn
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: 'Check-In/Out System',
      description: 'Quick and secure child check-in and check-out with digital tracking'
    },
    {
      icon: QrCode,
      title: 'QR Code Access',
      description: 'Fast QR code scanning for seamless check-out process'
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Advanced security features to keep your children safe'
    },
    {
      icon: MessageSquare,
      title: 'Family Connect',
      description: 'Direct communication between parents, staff, and administration'
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Stay updated with calendar events and important announcements'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Access the system from any device, anywhere, anytime'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">KiddoChecker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link to="/parent-registration">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Parent Registration
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Safe & Secure
            <span className="block text-blue-600">Child Check-In System</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your childcare facility with our comprehensive check-in/out system. 
            Keep children safe, parents informed, and staff organized.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/parent-registration">
              <Button size="lg" className="text-lg px-8 py-4">
                <UserPlus className="h-5 w-5 mr-2" />
                Register as Parent
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                <LogIn className="h-5 w-5 mr-2" />
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h3>
            <p className="text-xl text-gray-600">
              Powerful features designed for modern childcare facilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of families using KiddoChecker for safe, secure childcare management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/parent-registration">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                <UserPlus className="h-5 w-5 mr-2" />
                Create Parent Account
              </Button>
            </Link>
            <Link to="/check-in-kiosk">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-blue-600">
                <QrCode className="h-5 w-5 mr-2" />
                Kiosk Mode
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">KiddoChecker</span>
          </div>
          <p className="text-gray-400">
            Safe, secure, and simple child check-in management system
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
