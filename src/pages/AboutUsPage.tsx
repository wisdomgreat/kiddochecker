
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Heart, BookOpen } from 'lucide-react';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About KidCheck</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Making child check-in and attendance management simple, secure, and reliable for organizations everywhere.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-blue-500" />
                <CardTitle>Security First</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Built with enterprise-grade security to ensure your children's data and attendance records are always protected.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-500" />
                <CardTitle>Easy to Use</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Intuitive interface designed for busy parents, teachers, and administrators to manage attendance effortlessly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Heart className="h-8 w-8 text-pink-500" />
                <CardTitle>Family Connect</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Keep families connected with real-time updates, messaging, and activity sharing between parents and teachers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <CardTitle>Comprehensive Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Detailed attendance reports and analytics to help you understand patterns and improve your operations.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-gray-600 leading-relaxed">
                At KidCheck, we believe that managing child attendance should be simple, secure, and stress-free. 
                Our platform empowers organizations to focus on what matters most - caring for children - while we 
                handle the complexities of attendance tracking, parent communication, and regulatory compliance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
