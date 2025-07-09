
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Users, 
  Clock, 
  User,
  Phone,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

const CheckInKiosk = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'phone' | 'pin' | 'children'>('phone');
  const [children, setChildren] = useState([
    { id: '1', name: 'Emma Johnson', age: 7, class: 'Room 103', checkedIn: false },
    { id: '2', name: 'Noah Johnson', age: 5, class: 'Room 101', checkedIn: false },
  ]);
  const { toast } = useToast();

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handlePhoneSubmit = () => {
    if (phoneNumber.length >= 10) {
      setStep('pin');
    }
  };

  const handlePinSubmit = () => {
    if (pin.length === 4) {
      setStep('children');
    }
  };

  const handleCheckIn = (childId: string) => {
    setChildren(prev => prev.map(child => 
      child.id === childId ? { ...child, checkedIn: true } : child
    ));
    toast({
      title: "Check-in Successful",
      description: "Child has been checked in safely",
    });
  };

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome to ChurchCheck</h1>
            <p className="text-gray-600">Please enter your phone number to check in your children</p>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Parent Login</CardTitle>
              <p className="text-sm text-gray-600">Enter your credentials to continue</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                    className="pl-10 h-12 text-lg"
                    maxLength={14}
                  />
                </div>
              </div>

              <Button 
                onClick={handlePhoneSubmit}
                disabled={phoneNumber.length < 10}
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
              >
                Continue
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">Need help? Ask a staff member for assistance</p>
                <Button variant="link" className="text-blue-600 text-sm">
                  New Parent? Register Here
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <Button variant="ghost" className="text-gray-500 text-sm">
              Admin Access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'pin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Enter PIN</CardTitle>
              <p className="text-sm text-gray-600">Enter your 4-digit PIN to continue</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PIN</label>
                <Input
                  type="password"
                  placeholder="Enter your 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.slice(0, 4))}
                  className="h-12 text-lg text-center tracking-widest"
                  maxLength={4}
                />
              </div>

              <Button 
                onClick={handlePinSubmit}
                disabled={pin.length !== 4}
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
              >
                Verify PIN
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setStep('phone')}
                className="w-full h-12"
              >
                Back to Phone Number
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check In Your Children</h1>
          <p className="text-gray-600">Select the children you'd like to check in today</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Current time: {currentTime}</span>
          </div>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {children.map((child) => (
            <Card key={child.id} className="shadow-lg border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600">Age {child.age} • {child.class}</p>
                    </div>
                  </div>
                  {child.checkedIn && (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  )}
                </div>

                {child.checkedIn ? (
                  <div className="space-y-3">
                    <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Checked In Successfully
                    </Badge>
                    <p className="text-sm text-gray-600 text-center">
                      Checked in at {currentTime}
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleCheckIn(child.id)}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Check In {child.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setStep('phone')}
            className="px-8"
          >
            Check In Different Family
          </Button>
          <Button 
            size="lg"
            className="px-8 bg-green-600 hover:bg-green-700"
            disabled={!children.some(child => child.checkedIn)}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Complete Check-In
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2 text-orange-700">
                <HelpCircle className="h-5 w-5" />
                <span className="font-medium">Need Help?</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Ask any staff member for assistance with check-in
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckInKiosk;
