
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParentChildren } from '@/hooks/useChildren';
import { Calendar, Clock, FileText, MessageSquare, User, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { CircularProgress } from '@/components/ui/circular-progress';

const ParentDashboard = () => {
  const { data: children, isLoading } = useParentChildren();
  const [upcomingEvents, setUpcomingEvents] = useState([
    { id: "1", title: "Parent-Teacher Conference", date: "June 15, 2025", time: "3:30 PM - 5:00 PM" },
    { id: "2", title: "Summer Program Registration", date: "June 10, 2025", time: "All day" }
  ]);
  
  // Calculate completion percentages for rewards
  const rewardProgress = 75; // This would come from the database in a real app

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <CircularProgress size="large" className="mx-auto mb-4" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your parent dashboard
          </p>
        </div>

        {/* Children Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Card key={child.child_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>{child.first_name} {child.last_name}</CardTitle>
                <CardDescription>
                  {child.age ? `Age: ${child.age}` : "No age recorded"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-blue-600" />
                      <span>Current Class:</span>
                    </div>
                    <span className="font-medium">
                      {child.current_class_name || "Not assigned"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-green-600" />
                      <span>Status:</span>
                    </div>
                    {child.current_class_name ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        Checked In
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Checked In</Badge>
                    )}
                  </div>
                  
                  {child.allergies && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 text-amber-600" />
                        <span>Allergies:</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        Yes
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          <Card className="border-dashed hover:border-primary/50 hover:shadow-sm transition-all">
            <CardHeader>
              <CardTitle>Add Child</CardTitle>
              <CardDescription>
                Register another child to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-8">
              <Button variant="outline" className="rounded-full h-16 w-16">
                <span className="text-2xl">+</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attendance Rewards Card */}
          <Card className="md:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                Attendance Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress to next reward</span>
                    <span>{rewardProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${rewardProgress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">3</div>
                    <div className="text-xs text-muted-foreground">Badges Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-xs text-muted-foreground">Day Streak</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link to="/attendance-rewards" className="w-full">
                <Button variant="outline" className="w-full">
                  View Rewards
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Upcoming Events Card */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start p-3 border rounded-lg">
                    <div className="mr-4 mt-1">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <div className="text-sm text-muted-foreground">
                        {event.date} • {event.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Events
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-semibold pt-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/family-connect">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
              <MessageSquare className="h-6 w-6 mb-2" />
              <span>Message Teachers</span>
            </Button>
          </Link>
          <Link to="/calendar">
            <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
              <Calendar className="h-6 w-6 mb-2" />
              <span>View Calendar</span>
            </Button>
          </Link>
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
            <FileText className="h-6 w-6 mb-2" />
            <span>View Reports</span>
          </Button>
          <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center">
            <CheckCircle className="h-6 w-6 mb-2" />
            <span>Update Information</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
