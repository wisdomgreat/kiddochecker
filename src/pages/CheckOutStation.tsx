
import { useState, useEffect } from "react";
import { QrCode, User, Calendar, Clock, Info, Search, X } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import Breadcrumb from "@/components/ui/breadcrumb";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// Define the type for checkout data
interface CheckoutItem {
  id: string;
  name: string;
  class: string;
  status: string;
  time: string;
  child_id: string;
  attendance_id: string;
}

const CheckOutStation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [childName, setChildName] = useState("");
  const [checkoutResults, setCheckoutResults] = useState<CheckoutItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Function to fetch recent checkouts
  const fetchRecentCheckouts = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        checked_in_at,
        checked_out_at,
        children (
          id,
          first_name,
          last_name
        ),
        classes (
          name
        )
      `)
      .eq('attendance_date', today)
      .not('checked_out_at', 'is', null)
      .order('checked_out_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error("Error fetching recent checkouts:", error);
      throw error;
    }
    
    return data.map(item => ({
      id: item.id,
      name: `${item.children.first_name} ${item.children.last_name}`,
      class: item.classes?.name || "Unknown Class",
      status: "Checked out",
      time: new Date(item.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      child_id: item.children.id,
      attendance_id: item.id
    }));
  };

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
    mutationFn: async (attendanceId: string) => {
      const { data, error } = await supabase
        .from('attendance')
        .update({
          checked_out_at: new Date().toISOString(),
          checked_out_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', attendanceId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Child checked out successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['recent-checkouts'] });
      
      // Clear search results
      setCheckoutResults([]);
      setChildName("");
      setPhoneNumber("");
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

  // Function to search for children to check out
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      
      if (!phoneNumber && !childName) {
        throw new Error("Please enter either a phone number or child's name");
      }

      // Different searches depending on if we have phone or name
      let query;

      if (phoneNumber) {
        // Search by parent's phone number
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('phone', `%${phoneNumber.replace(/\D/g, '')}%`);
          
        if (profileError) throw profileError;
        
        if (!profiles || profiles.length === 0) {
          throw new Error("No parent found with this phone number");
        }
        
        // Get the parent IDs
        const parentIds = profiles.map(profile => profile.id);
        
        // Find children of these parents
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id, first_name, last_name, parent_id')
          .in('parent_id', parentIds);
          
        if (childrenError) throw childrenError;
        
        if (!children || children.length === 0) {
          throw new Error("No children found for this parent");
        }
        
        // Now get today's attendance records for these children
        const today = new Date().toISOString().split('T')[0];
        const childIds = children.map(child => child.id);
        
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            id,
            checked_in_at,
            checked_out_at,
            child_id,
            classes(name)
          `)
          .in('child_id', childIds)
          .eq('attendance_date', today)
          .is('checked_out_at', null);
          
        if (attendanceError) throw attendanceError;
        
        if (!attendance || attendance.length === 0) {
          throw new Error("No children are currently checked in for this parent");
        }
        
        // Join attendance data with children's names
        const results = attendance.map(record => {
          const child = children.find(c => c.id === record.child_id);
          return {
            id: record.id, // This is a unique ID for the row
            name: `${child?.first_name} ${child?.last_name}`,
            class: record.classes?.name || "Unknown Class",
            status: "Checked in",
            time: new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            child_id: record.child_id,
            attendance_id: record.id
          };
        });
        
        setCheckoutResults(results);
      } else if (childName) {
        // Search by child's name
        const { data: children, error: childrenError } = await supabase
          .from('children')
          .select('id, first_name, last_name')
          .or(`first_name.ilike.%${childName}%,last_name.ilike.%${childName}%`);
          
        if (childrenError) throw childrenError;
        
        if (!children || children.length === 0) {
          throw new Error("No children found with this name");
        }
        
        // Now get today's attendance records for these children
        const today = new Date().toISOString().split('T')[0];
        const childIds = children.map(child => child.id);
        
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            id,
            checked_in_at,
            checked_out_at,
            child_id,
            classes(name)
          `)
          .in('child_id', childIds)
          .eq('attendance_date', today)
          .is('checked_out_at', null);
          
        if (attendanceError) throw attendanceError;
        
        if (!attendance || attendance.length === 0) {
          throw new Error("No children with this name are currently checked in");
        }
        
        // Join attendance data with children's names
        const results = attendance.map(record => {
          const child = children.find(c => c.id === record.child_id);
          return {
            id: record.id, // This is a unique ID for the row
            name: `${child?.first_name} ${child?.last_name}`,
            class: record.classes?.name || "Unknown Class",
            status: "Checked in",
            time: new Date(record.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            child_id: record.child_id,
            attendance_id: record.id
          };
        });
        
        setCheckoutResults(results);
      }
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
      setCheckoutResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleReset = () => {
    setPhoneNumber("");
    setChildName("");
    setCheckoutResults([]);
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Strip all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted += '(' + cleaned.substring(0, 3);
      if (cleaned.length > 3) {
        formatted += ') ' + cleaned.substring(3, 6);
        if (cleaned.length > 6) {
          formatted += '-' + cleaned.substring(6, 10);
        }
      }
    }
    
    return formatted.trim();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setPhoneNumber(formattedValue);
  };
  
  const checkoutColumns = [
    {
      key: "name" as const,
      header: "Child",
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <User size={20} className="text-gray-500" />
          <span>{value}</span>
        </div>
      ),
    },
    { key: "class" as const, header: "Class" },
    { key: "status" as const, header: "Status" },
    { key: "time" as const, header: "Time" },
    {
      key: "actions" as const,
      header: "",
      render: (_: any, item: CheckoutItem) => (
        <button 
          className="p-1 rounded-full hover:bg-gray-100"
          onClick={() => handleCheckout(item.attendance_id)}
          disabled={item.status === "Checked out"}
        >
          {item.status === "Checked out" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-500"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600 hover:text-blue-800"
            >
              Check out
            </Button>
          )}
        </button>
      ),
    },
  ];

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
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-full bg-purple-100 p-3">
            <QrCode size={24} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Scan Parent QR Code</h2>
            <p className="text-gray-600">
              Please ask the parent to present their QR code for scanning to check out their child.
            </p>
          </div>
        </div>
        
        <button className="btn-primary mt-4">Manual Override</button>
      </div>
      
      {/* Show search results if available */}
      {checkoutResults.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Search Results</h2>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X size={16} className="mr-1" /> Clear Results
            </Button>
          </div>
          <DataTable
            columns={checkoutColumns}
            data={checkoutResults}
            keyExtractor={(item) => item.id}
          />
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Check-outs</h2>
        <DataTable
          columns={checkoutColumns}
          data={recentCheckouts}
          keyExtractor={(item) => item.id}
          loading={isLoading}
        />
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 animate-fade-in">
        <h2 className="text-xl font-bold mb-4">Manual Check-out</h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Phone Number
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                className="input-field"
                value={phoneNumber}
                onChange={handlePhoneChange}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
              Child's Name
            </label>
            <div className="relative">
              <input
                id="childName"
                type="text"
                placeholder="Enter child's name"
                className="input-field"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              className="btn-primary flex-1"
              onClick={handleSearch}
              disabled={(!phoneNumber && !childName) || isSearching}
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} className="mr-1" />
                  Search
                </>
              )}
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Info size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1">Need Assistance?</h2>
            <p className="text-gray-600 mb-4">
              If you're having trouble with the check-out process, please contact a staff member or administrator for help.
            </p>
            <button className="btn-primary">Contact Admin</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CheckOutStation;
