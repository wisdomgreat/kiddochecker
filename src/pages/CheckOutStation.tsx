
import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecentCheckouts, checkoutChild } from "@/services/checkoutService";
import { CheckoutItem } from "@/components/check-out/SearchForm";

// Import our new components
import QrCodeScanner from "@/components/check-out/QrCodeScanner";
import SearchForm from "@/components/check-out/SearchForm";
import CheckoutTable from "@/components/check-out/CheckoutTable";
import HelpSection from "@/components/check-out/HelpSection";

const CheckOutStation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkoutResults, setCheckoutResults] = useState<CheckoutItem[]>([]);

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

  return (
    <MainLayout>
      <Breadcrumb
        items={[
          { label: "Dashboard", path: "/" },
          { label: "Check-out Station" },
        ]}
      />
      
      <h1 className="text-2xl font-bold mb-6">Check-out Station</h1>
      
      <QrCodeScanner />
      
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
    </MainLayout>
  );
};

export default CheckOutStation;
