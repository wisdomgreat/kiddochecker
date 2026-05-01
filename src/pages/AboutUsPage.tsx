
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

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Common Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
               <h4 className="font-bold text-lg mb-2">How safe is my child?</h4>
               <p className="text-gray-600 text-sm">Every child is issued a unique security code. Only authorized guardians with a matching digital or physical ticket can perform a check-out.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
               <h4 className="font-bold text-lg mb-2">Can I use my phone to check in?</h4>
               <p className="text-gray-600 text-sm">Yes! You can use our secure QR codes or register your phone's NFC for a "Tap & Go" experience at the kiosk.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
               <h4 className="font-bold text-lg mb-2">What if I lose my pick-up ticket?</h4>
               <p className="text-gray-600 text-sm">Our staff can perform a manual override after verifying your government-issued ID against the family profile.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
               <h4 className="font-bold text-lg mb-2">Is there an age limit for self-check?</h4>
               <p className="text-gray-600 text-sm">Older youth can be granted self-check permissions by parents, allowing them to log their own attendance via a secure personal PIN.</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">Need more detailed help? Log in to view our full Platform Guide.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;

