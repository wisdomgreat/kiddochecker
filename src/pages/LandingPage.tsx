
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
  LogIn,
  CheckCircle,
  Star,
  ArrowRight
} from 'lucide-react';
import LandingNavigation from '@/components/layout/LandingNavigation';
import LandingFooter from '@/components/layout/LandingFooter';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: 'Quick Check-In/Out',
      description: 'Lightning-fast child check-in and check-out with digital tracking and security'
    },
    {
      icon: QrCode,
      title: 'QR Code System',
      description: 'Secure QR code scanning for seamless and contactless check-out process'
    },
    {
      icon: Shield,
      title: 'Maximum Security',
      description: 'Advanced security features and protocols to keep your children completely safe'
    },
    {
      icon: MessageSquare,
      title: 'Family Communication',
      description: 'Direct messaging between parents, staff, and administration for better coordination'
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Stay updated with calendar events, activities, and important announcements'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Access the complete system from any device, anywhere, anytime with ease'
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: 'Streamlined Operations',
      description: 'Reduce administrative overhead and focus on what matters most - caring for children'
    },
    {
      icon: Star,
      title: 'Peace of Mind',
      description: 'Parents and staff can rest assured knowing children are safe and accounted for'
    },
    {
      icon: Users,
      title: 'Better Communication',
      description: 'Keep families connected with real-time updates and seamless messaging'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <LandingNavigation />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Safe & Secure
            <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Child Check-In System
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your childcare facility with our comprehensive, secure, and user-friendly 
            check-in/out system. Keep children safe, parents informed, and staff organized.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/parent-registration">
              <Button size="lg" className="text-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white">
                <UserPlus className="h-5 w-5 mr-2" />
                Get Started as Parent
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-purple-200 text-purple-700 hover:bg-purple-50">
                <LogIn className="h-5 w-5 mr-2" />
                Staff Login
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Real-time Updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Mobile Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything Your Facility Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for modern childcare facilities and busy families
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose KidCheck?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of families and facilities who trust us with their most precious assets
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Facility?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families using KidCheck for safe, secure, and efficient childcare management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/parent-registration">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white text-purple-600 hover:bg-gray-100">
                <UserPlus className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link to="/check-in-kiosk">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 text-white border-white hover:bg-white hover:text-purple-600">
                <QrCode className="h-5 w-5 mr-2" />
                Try Kiosk Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
