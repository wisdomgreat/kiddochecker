import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/CleanAuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Edit, Save, X } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  security_pin?: string;
  created_at: string;
  updated_at: string;
}

const ParentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;

      try {
        // Get profile data from profiles table
        const { data: profileData, error: profileError } = await (supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as any);

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          throw profileError;
        }

        // Combine with email from user
        const profile: Profile = {
          id: profileData.id,
          email: user.email || '',
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          address: profileData.address,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        };

        return profile;
      } catch (error: any) {
        console.error("Error in ParentProfile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        return null;
      }
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setSecurityPin(profile.security_pin || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          address: address,
          security_pin: securityPin,
        } as any)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setSecurityPin(profile.security_pin || "");
    }
  };

  const handleSaveClick = async () => {
    await updateProfileMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex justify-center items-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader className="space-y-0.5">
          <CardTitle className="text-2xl font-bold">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your home address"
              className="min-h-[100px]"
            />
          </div>

          {/* Security PIN */}
          <div className="space-y-2">
            <Label htmlFor="securityPin">Kiosk Security PIN</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="securityPin"
                  type={showPin ? "text" : "password"}
                  value={securityPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setSecurityPin(val);
                  }}
                  disabled={!isEditing}
                  placeholder="6-digit PIN"
                  className="font-mono tracking-widest text-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This 6-digit PIN will be used to check in your children at the kiosk station.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={handleCancelClick}>
                  Cancel
                </Button>
                <Button onClick={handleSaveClick} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button onClick={handleEditClick}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ParentProfile;
