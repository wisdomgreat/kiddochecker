
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Clock, Users } from "lucide-react";
import { useChildren } from "@/hooks/useChildren";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";

const QuickCheckInPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const { children, isLoading } = useChildren();
  const { attendance, checkIn, isCheckingIn } = useAttendance();

  // Filter children based on search and availability
  const availableChildren = children.filter(child => {
    const isAlreadyCheckedIn = attendance.some(record => 
      record.child_id === child.id && !record.checked_out_at
    );
    const matchesSearch = searchTerm === "" || 
      `${child.first_name} ${child.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadyCheckedIn && matchesSearch;
  });

  const handleQuickCheckIn = async (childId: string, childName: string) => {
    try {
      await checkIn({ childId });
      toast({
        title: "Check-in successful",
        description: `${childName} has been checked in`,
      });
      setSearchTerm(""); // Clear search after successful check-in
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading children...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          Quick Check-In
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search children..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-2">
          {availableChildren.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {searchTerm ? "No matching children found" : "No children available for check-in"}
              </p>
            </div>
          ) : (
            availableChildren.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {child.first_name} {child.last_name}
                    </p>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      Age {child.age}
                    </Badge>
                  </div>
                  {child.allergies && (
                    <p className="text-xs text-red-600 truncate">
                      Allergies: {child.allergies}
                    </p>
                  )}
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleQuickCheckIn(child.id, `${child.first_name} ${child.last_name}`)}
                  disabled={isCheckingIn}
                  className="ml-2 flex-shrink-0"
                >
                  {isCheckingIn ? (
                    <Clock className="h-3 w-3 animate-spin" />
                  ) : (
                    "Check In"
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickCheckInPanel;

