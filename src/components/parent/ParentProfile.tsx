import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Edit, Save, X, Heart, ShieldCheck, Award, QrCode } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { useMembers } from "@/hooks/useMembers";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Check, PlusCircle } from "lucide-react";

interface Milestone {
  type: string;
  date: string;
  note?: string;
}

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  security_pin?: string;
  avatar_url?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

const ParentProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { members, updateMember, createMember } = useMembers();

  // Find the membership record for THIS profile
  const myMembership = members.find(m => m.profile_id === user?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [newMilestoneType, setNewMilestoneType] = useState("Baptism");
  const [newMilestoneDate, setNewMilestoneDate] = useState<Date | undefined>(new Date());

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
          security_pin: profileData.security_pin,
          avatar_url: profileData.avatar_url,
          photo_url: profileData.photo_url,
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
      setPhotoUrl(profile.photo_url || profile.avatar_url || "");
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
          photo_url: photoUrl,
          avatar_url: photoUrl,
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
      setPhotoUrl(profile.photo_url || profile.avatar_url || "");
    }
  };

  const handleSaveClick = async () => {
    await updateProfileMutation.mutateAsync();
  };

  const handleAddMilestone = () => {
    if (!myMembership || !newMilestoneDate) return;

    const currentMilestones = (myMembership.spiritual_milestones as Milestone[]) || [];
    const updatedMilestones = [
      ...currentMilestones,
      {
        type: newMilestoneType,
        date: newMilestoneDate.toISOString(),
      }
    ];

    updateMember({
      id: myMembership.id,
      spiritual_milestones: updatedMilestones
    });

    setIsMilestoneOpen(false);
    toast({
        title: "Milestone Added",
        description: `${newMilestoneType} added to your spiritual journey.`
    });
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
        <CardContent className="grid gap-6">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <Label className="text-slate-600 font-bold uppercase text-[10px] tracking-wider mb-4">Guardian Photo</Label>
            <ImageUpload
              bucket="avatars"
              defaultImage={photoUrl}
              onUpload={setPhotoUrl}
              fallbackText={firstName ? firstName[0] : "U"}
              size="xl"
              disabled={!isEditing}
            />
            <p className="text-[10px] text-slate-400 mt-3 text-center">Clear face photo required for authorized pick-up verification.</p>
          </div>

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

          {/* Kiosk QR Access */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-col items-center gap-4">
             <div className="flex items-center gap-3 self-start mb-2">
                <div className="p-2 bg-indigo-100 rounded-xl">
                    <QrCode className="h-5 w-5 text-indigo-700" />
                </div>
                <h4 className="font-bold text-foreground leading-tight">Kiosk Access QR</h4>
             </div>
             
             <div className="bg-card p-4 rounded-2xl shadow-sm border border-indigo-50">
                {user?.id ? (
                    <QRCodeSVG 
                      value={user.id} 
                      size={140} 
                      className="transition-all hover:scale-110 duration-500"
                    />
                ) : (
                    <div className="h-[140px] w-[140px] flex items-center justify-center text-slate-300">Loading...</div>
                )}
             </div>
             
             <p className="text-center text-[11px] font-bold text-slate-500 max-w-xs">
                Scan this code at any check-in kiosk to instantly identify your family and begin check-in.
             </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-card/5 my-2" />

          {/* Church Membership Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <Heart className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground leading-tight">Church Membership</h4>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Congregation Status</p>
                    </div>
                </div>
                {myMembership ? (
                    <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40 px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-tight">
                        {myMembership.membership_type} Member
                    </Badge>
                ) : (
                    <Badge variant="outline" className="border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px] tracking-tight">
                        Non-Registered
                    </Badge>
                )}
            </div>

            <div className="bg-slate-50/50 dark:bg-card/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-tighter">Joined Since</Label>
                    <p className="font-bold text-slate-700 dark:text-slate-300">{myMembership ? format(new Date(myMembership.joined_at), 'MMMM dd, yyyy') : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">Membership Type</Label>
                    <div className="flex gap-2 mt-1">
                        {['visitor', 'regular', 'registered'].map(type => {
                            const isActive = myMembership?.membership_type === type;
                            return (
                                <Button 
                                    key={type} 
                                    size="sm" 
                                    variant={isActive ? 'default' : 'outline'} 
                                    className={cn(
                                        "rounded-full h-8 px-5 text-[10px] font-bold uppercase tracking-tight transition-all duration-300",
                                        isActive 
                                            ? "bg-indigo-600 shadow-lg shadow-indigo-100 ring-2 ring-indigo-500 ring-offset-2" 
                                            : "bg-card text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-500"
                                    )}
                                    // Removed isEditing check to allow instant joining as a member
                                    onClick={() => {
                                        if (myMembership) {
                                            updateMember({ id: myMembership.id, membership_type: type as any });
                                        } else {
                                            createMember({ 
                                                profile_id: user?.id, 
                                                membership_type: type as any,
                                                status: 'active',
                                                joined_at: new Date().toISOString()
                                            });
                                        }
                                    }}
                                >
                                    {isActive && <Check className="mr-1.5 h-3 w-3" />}
                                    {type}
                                </Button>
                            );
                        })}
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-tighter">Spiritual Milestones</Label>
                    <div className="flex flex-wrap gap-3">
                        <AnimatePresence mode="popLayout">
                            {(myMembership?.spiritual_milestones as Milestone[] || []).map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Badge className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20 font-bold px-3 py-1 rounded-xl flex items-center gap-2">
                                        <Award className="h-3 w-3" />
                                        {m.type}: {format(new Date(m.date), 'yyyy')}
                                    </Badge>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        <Button 
                            variant="ghost" 
                            className="h-8 rounded-full text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-4 border border-dashed border-indigo-200"
                            onClick={() => setIsMilestoneOpen(true)}
                        >
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                            Add Milestone
                        </Button>
                    </div>
                </div>
            </div>
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

      <Dialog open={isMilestoneOpen} onOpenChange={setIsMilestoneOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Award className="h-6 w-6 text-indigo-600" />
                    Record Milestone
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-400">
                    Add a significant event to your spiritual profile.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Milestone Type</Label>
                    <Select value={newMilestoneType} onValueChange={setNewMilestoneType}>
                        <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 font-bold text-slate-700">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            <SelectItem value="Baptism" className="font-bold">Baptism</SelectItem>
                            <SelectItem value="Confirmation" className="font-bold">Confirmation</SelectItem>
                            <SelectItem value="Dedication" className="font-bold">Dedication</SelectItem>
                            <SelectItem value="Membership Class" className="font-bold">Membership Class</SelectItem>
                            <SelectItem value="Leadership Training" className="font-bold">Leadership Training</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest pl-1">Completion Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full h-12 rounded-2xl border-slate-100 bg-slate-50/50 font-bold text-left px-4",
                                    !newMilestoneDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                                {newMilestoneDate ? format(newMilestoneDate, "PPP") : "Pick a date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-[2rem] border-slate-100 shadow-2xl overflow-hidden" align="start">
                            <Calendar
                                mode="single"
                                selected={newMilestoneDate}
                                onSelect={setNewMilestoneDate}
                                initialFocus
                                className="font-bold"
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <DialogFooter className="sm:justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <Button variant="ghost" className="rounded-2xl font-bold h-12 px-6 dark:hover:bg-card/5" onClick={() => setIsMilestoneOpen(false)}>
                    Cancel
                </Button>
                <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold h-12 px-8 shadow-lg shadow-indigo-100 dark:shadow-indigo-500/20" onClick={handleAddMilestone}>
                    Save Milestone
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ParentProfile;


