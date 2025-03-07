
import { useState, useEffect } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecentCheckouts, checkoutChild } from "@/services/checkoutService";
import { CheckoutItem } from "@/components/check-out/SearchForm";
import { Button } from "@/components/ui/button";

// Import our components
import QrCodeScanner from "@/components/check-out/QrCodeScanner";
import SearchForm from "@/components/check-out/SearchForm";
import CheckoutTable from "@/components/check-out/CheckoutTable";
import HelpSection from "@/components/check-out/HelpSection";

const CheckOutStation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checkoutResults, setCheckoutResults] = useState<CheckoutItem[]>([]);
  const [organizationName, setOrganizationName] = useState("Your Church");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<string>("Main Entrance");
  const [deviceType, setDeviceType] = useState<string>("check-out");
  const [isChecking, setIsChecking] = useState(true);

  // Query for recent checkouts
  const { 
    data: recentCheckouts = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ['recent-checkouts'],
    queryFn: fetchRecentCheckouts,
    staleTime: 30000 // 30 seconds
  });

  // Check if organization exists and get device settings
  useEffect(() => {
    const checkOrganization = async () => {
      try {
        setIsChecking(true);
        // Use raw query since organization_settings is not in types yet
        const { data, error } = await supabase
          .from('organization_settings')
          .select('*')
          .single();
        
        if (error) throw error;
        
        if (data) {
          setOrganizationName(data.name);
        }
      } catch (error) {
        console.error("Error checking organization:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    // Check for device ID
    const savedDeviceId = localStorage.getItem('device_id');
    if (savedDeviceId) {
      setDeviceId(savedDeviceId);
      
      // Get the saved device location, if any
      const savedLocation = localStorage.getItem('device_location');
      if (savedLocation) {
        setDeviceLocation(savedLocation);
      }
      
      // Get the saved device type, if any
      const savedType = localStorage.getItem('device_type');
      if (savedType) {
        setDeviceType(savedType);
      } else {
        // Default to check-out for this page
        localStorage.setItem('device_type', 'check-out');
        setDeviceType('check-out');
      }
    } else {
      // Generate a new unique device ID
      const newDeviceId = crypto.randomUUID();
      localStorage.setItem('device_id', newDeviceId);
      setDeviceId(newDeviceId);
      
      // Set default location and type
      localStorage.setItem('device_location', deviceLocation);
      localStorage.setItem('device_type', 'check-out');
      setDeviceType('check-out');
    }
    
    checkOrganization();
  }, []);

  // Mutation for checking out a child
  const checkoutMutation = useMutation({
    mutationFn: (attendanceId: string) => checkoutChild(attendanceId),
    onSuccess: () => {
      toast({
        title: "Child checked out successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['recent-checkouts'] });
      
      // Clear search results
      setCheckoutResults([]);
    },
    onError: (error) => {
      toast({
        title: "Failed to check out child",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle checking out a child
  const handleCheckout = (attendanceId: string) => {
    checkoutMutation.mutate(attendanceId);
  };

  // Handle search results
  const handleSearchResults = (results: CheckoutItem[]) => {
    setCheckoutResults(results);
  };

  // Handle reset
  const handleReset = () => {
    setCheckoutResults([]);
  };
  
  const handleBackToLanding = () => {
    navigate("/landing");
  };
  
  const handleUpdateDeviceSettings = () => {
    const location = prompt("Enter the location of this device:", deviceLocation);
    if (location && location.trim()) {
      setDeviceLocation(location.trim());
      localStorage.setItem('device_location', location.trim());
    }
    
    toast({
      title: "Device Settings Updated",
      description: `This device is now set as: check-out at ${deviceLocation}`,
    });
  };

  // Show search results if available
  useEffect(() => {
    if (checkoutResults.length > 0) {
      toast({
        title: `Found ${checkoutResults.length} children to check out`,
        description: "Click 'Check out' to complete the process",
      });
    }
  }, [checkoutResults, toast]);

  if (error) {
    toast({
      title: "Error loading checkouts",
      description: "Please try refreshing the page",
      variant: "destructive",
    });
  }

  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-8 bg-background">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            onClick={handleBackToLanding} 
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div>
          <Button
            variant="ghost"
            onClick={handleUpdateDeviceSettings}
            className="text-gray-500 hover:text-gray-700"
          >
            <Settings className="mr-2 h-4 w-4" />
            Device Settings
          </Button>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">{organizationName}</h1>
        <p className="text-gray-600 mb-1">Check-out Station</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
          <span>Device ID: {deviceId && deviceId.substring(0, 8)}...</span>
          <span>•</span>
          <span>Location: {deviceLocation}</span>
          <span>•</span>
          <span>Type: {deviceType}</span>
        </div>
      </div>
      
      <QrCodeScanner onScanComplete={handleCheckout} />
      
      {/* Show search results if available */}
      {checkoutResults.length > 0 && (
        <CheckoutTable 
          title="Search Results" 
          data={checkoutResults}
          onCheckout={handleCheckout}
          showClearButton={true}
          onClear={handleReset}
        />
      )}
      
      <CheckoutTable 
        title="Recent Check-outs" 
        data={recentCheckouts}
        loading={isLoading}
        onCheckout={handleCheckout}
      />
      
      <SearchForm 
        onSearchResults={handleSearchResults}
        onReset={handleReset}
      />
      
      <HelpSection />
    </div>
  );
};

export default CheckOutStation;
