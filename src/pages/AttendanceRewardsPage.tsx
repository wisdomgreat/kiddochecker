
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Award, Star, Calendar, Gift, ArrowUpRight, Users, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AttendanceRewardsPage = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isTeacher = userRole === "teacher" || userRole === "teacher_assistant";
  const isParent = userRole === "parent";

  // Mock data - in production this would come from the database
  const children = [
    { 
      id: "1", 
      name: "Emma Johnson", 
      attendance: 15, 
      goal: 20, 
      badgesEarned: 3,
      streak: 5
    },
    { 
      id: "2", 
      name: "Liam Smith", 
      attendance: 18, 
      goal: 20, 
      badgesEarned: 4,
      streak: 9
    }
  ];

  const badges = [
    { id: "1", name: "Perfect Week", description: "Attended 5 days in a row", icon: "star", earned: true, date: "May 15, 2025" },
    { id: "2", name: "Punctual", description: "On time for 2 weeks", icon: "clock", earned: true, date: "May 8, 2025" },
    { id: "3", name: "Monthly Star", description: "Complete attendance for one month", icon: "calendar", earned: false },
  ];

  const milestones = [
    { days: 20, reward: "Special Certificate", status: "in-progress", progress: 75 },
    { days: 40, reward: "Recognition in Newsletter", status: "upcoming", progress: 38 },
    { days: 60, reward: "Gift Card for Parents", status: "upcoming", progress: 25 },
    { days: 100, reward: "Special Event Invitation", status: "upcoming", progress: 15 },
  ];

  const leaderboard = [
    { id: "1", name: "Rainbow Class", attendance: 95, change: "+2%" },
    { id: "2", name: "Sunshine Class", attendance: 92, change: "-1%" },
    { id: "3", name: "Star Class", attendance: 89, change: "+3%" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Rewards</h1>
            <p className="text-muted-foreground">
              {isParent 
                ? "Track your child's attendance rewards and milestones" 
                : "Incentivize attendance with achievements and rewards"
              }
            </p>
          </div>
          
          {isAdmin && (
            <Button>
              <Gift className="h-4 w-4 mr-2" />
              Configure Rewards
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:w-auto">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Badges</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Milestones</span>
            </TabsTrigger>
            {(isAdmin || isTeacher) && (
              <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Leaderboard</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <Card key={child.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle>{child.name}</CardTitle>
                    <CardDescription>
                      Attendance progress towards next reward
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{child.attendance} days</span>
                          <span>Goal: {child.goal} days</span>
                        </div>
                        <Progress value={(child.attendance / child.goal) * 100} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/10 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-primary">{child.badgesEarned}</div>
                          <div className="text-xs text-muted-foreground">Badges Earned</div>
                        </div>
                        <div className="bg-amber-100 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-amber-600">{child.streak} days</div>
                          <div className="text-xs text-muted-foreground">Current Streak</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Detailed Progress
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="h-5 w-5 mr-2 text-primary" />
                    Next Reward
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-lg">Special Certificate</h3>
                    <p className="text-sm text-muted-foreground mb-2">Award for 20 days of attendance</p>
                    <div className="flex justify-between text-sm mb-1">
                      <span>15 days completed</span>
                      <span>5 days to go</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    See All Rewards
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="badges" className="space-y-6">
            <h2 className="text-xl font-semibold">Earned Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {badges.filter(badge => badge.earned).map((badge) => (
                <Card key={badge.id} className={badge.earned ? "border-green-200 bg-green-50" : ""}>
                  <CardHeader className="pb-2 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-2">
                      {badge.icon === "star" && <Star className="h-6 w-6" />}
                      {badge.icon === "clock" && <Clock className="h-6 w-6" />}
                      {badge.icon === "calendar" && <Calendar className="h-6 w-6" />}
                    </div>
                    <CardTitle className="text-base">{badge.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    {badge.earned && (
                      <Badge variant="outline" className="mt-2 bg-green-100 text-green-800 border-green-200">
                        Earned on {badge.date}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <h2 className="text-xl font-semibold pt-4">Available Badges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {badges.filter(badge => !badge.earned).map((badge) => (
                <Card key={badge.id} className="opacity-70 hover:opacity-100 transition-opacity">
                  <CardHeader className="pb-2 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-2">
                      {badge.icon === "star" && <Star className="h-6 w-6" />}
                      {badge.icon === "clock" && <Clock className="h-6 w-6" />}
                      {badge.icon === "calendar" && <Calendar className="h-6 w-6" />}
                    </div>
                    <CardTitle className="text-base">{badge.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <Badge variant="outline" className="mt-2">
                      Not yet earned
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="milestones">
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <Card 
                  key={index} 
                  className={`${
                    milestone.status === 'in-progress' 
                      ? 'border-blue-200' 
                      : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          milestone.status === 'in-progress' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{milestone.days} Days</h3>
                          <p className="text-muted-foreground">{milestone.reward}</p>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-1/2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{milestone.status === 'in-progress' ? 'In Progress' : 'Upcoming'}</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Class Attendance Leaderboard</CardTitle>
                <CardDescription>
                  Monthly attendance percentage by class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{entry.name}</h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-lg font-bold">{entry.attendance}%</span>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${
                            entry.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {entry.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Full Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AttendanceRewardsPage;
