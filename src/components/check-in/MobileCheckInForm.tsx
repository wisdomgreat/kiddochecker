
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { Search, UserPlus, Clock, CheckCircle } from "lucide-react";
import { useChildren } from "@/hooks/useChildren";
import { useClasses } from "@/hooks/useClasses";
import { useAttendance } from "@/hooks/useAttendance";

interface MobileCheckInFormProps {
  onSuccess?: () => void;
}

const MobileCheckInForm = ({ onSuccess }: MobileCheckInFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const { toast } = useToast();
  
  const { children, isLoading: childrenLoading } = useChildren();
  const { classes, isLoading: classesLoading } = useClasses();
  const { attendance, checkIn, isCheckingIn } = useAttendance();

  // Filter available children for check-in
  const availableChildren = children.filter(child => {
    const isAlreadyCheckedIn = attendance.some(record => 
      record.child_id === child.id && !record.checked_out_at
    );
    const matchesSearch = `${child.first_name} ${child.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return !isAlreadyCheckedIn && matchesSearch;
  });

  const handleCheckIn = async () => {
    if (!selectedChild) {
      toast({
        title: "Please select a child",
        description: "You must select a child to check in",
        variant: "destructive",
      });
      return;
    }

    try {
      await checkIn({ 
        childId: selectedChild, 
        classId: selectedClass === 'no-class' ? undefined : selectedClass 
      });
      
      setSelectedChild("");
      setSelectedClass("");
      setSearchTerm("");
      
      toast({
        title: "Check-in successful",
        description: "Child has been checked in successfully",
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: "Please try again or contact staff for assistance",
        variant: "destructive",
      });
    }
  };

  if (childrenLoading || classesLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          Quick Check-In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search child by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Child Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select Child
          </label>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a child" />
            </SelectTrigger>
            <SelectContent>
              {availableChildren.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{child.first_name} {child.last_name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      Age {child.age}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
              {availableChildren.length === 0 && (
                <SelectItem value="no-children" disabled>
                  {searchTerm ? "No matching children" : "No children available"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Class Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select Class (Optional)
          </label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-class">General Check-in</SelectItem>
              {classes.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id}>
                  <div className="flex flex-col items-start">
                    <span>{classItem.name}</span>
                    {classItem.age_range && (
                      <span className="text-xs text-gray-500">{classItem.age_range}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Check-in Button */}
        <Button 
          onClick={handleCheckIn}
          disabled={!selectedChild || isCheckingIn}
          className="w-full py-6 text-base font-medium"
          size="lg"
        >
          {isCheckingIn ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Checking In...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Check In Child
            </>
          )}
        </Button>

        {/* Status */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {availableChildren.length} children available for check-in
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileCheckInForm;

