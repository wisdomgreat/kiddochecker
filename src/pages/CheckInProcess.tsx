import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/CleanAuthContext";
import { CheckCircle, Clock, User, MapPin, AlertTriangle } from "lucide-react";

interface CheckInProcessParams {
  childId?: string;
}

const CheckInProcess = () => {
  const { childId } = useParams<CheckInProcessParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [child, setChild] = useState<{ id: string; first_name: string; last_name: string } | null>(null);
  const [location, setLocation] = useState<{ id: string; name: string } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Fetch child data
  const { data: childData, isLoading: isChildLoading, error: childError } = useQuery({
    queryKey: ["child", childId],
    queryFn: async () => {
      if (!childId) return null;
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name')
        .eq('id', childId)
        .single();

      if (error) {
        console.error("Error fetching child:", error);
        return null;
      }
      return data;
    },
    enabled: !!childId,
  });

  // Fetch location data
  const { data: locationData, isLoading: isLocationLoading, error: locationError } = useQuery({
    queryKey: ["location"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching location:", error);
        return null;
      }
      return data;
    },
  });

  useEffect(() => {
    if (childData) {
      setChild(childData);
    }
    if (locationData) {
      setLocation(locationData);
    }
  }, [childData, locationData]);

  const checkInMutation = useMutation(
    async () => {
      if (!childId || !location?.id || !user?.id) {
        throw new Error("Missing required data for check-in.");
      }

      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            child_id: childId,
            location_id: location.id,
            checked_in_by: user.id,
            check_in_time: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error("Error during check-in:", error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Check-in Successful",
          description: `${child?.first_name} has been checked in.`,
        });
        navigate('/checkin');
      },
      onError: (error: any) => {
        console.error("Check-in failed:", error);
        toast({
          title: "Check-in Failed",
          description: error.message || "Could not check in. Please try again.",
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsCheckingIn(false);
      },
    }
  );

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    checkInMutation.mutate();
  };

  if (isChildLoading || isLocationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (childError || locationError || !child || !location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground">
                Failed to load data. Please check the child ID and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md bg-white shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Check-In Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-xl font-semibold">{child.first_name} {child.last_name}</h3>
            <p className="text-gray-500">Ready to check in at {location.name}?</p>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="h-4 w-4" />
            <span>Checked in by: {user.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Location: {location.name}</span>
          </div>
          <Button className="w-full" onClick={handleCheckIn} disabled={isCheckingIn}>
            {isCheckingIn ? "Checking In..." : "Confirm Check-In"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInProcess;

