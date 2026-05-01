import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Phone, MapPin, Save, Loader2, Key, QrCode, ShieldCheck, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const UserProfile = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profile) {
        setUserProfile(profile);
        form.reset({
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          phone: profile.phone || "",
          address: profile.address || "",
        });
      } else if (user) {
        // Create initial profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            first_name: user.user_metadata?.first_name || "",
            last_name: user.user_metadata?.last_name || "",
          })
          .select()
          .single();

        if (!createError && newProfile) {
          setUserProfile(newProfile);
          form.reset({
            first_name: newProfile.first_name || "",
            last_name: newProfile.last_name || ""
          });
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setUserProfile({ ...userProfile, ...data });
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  const roleLabel = (userRole || 'User').replace(/_/g, ' ').toUpperCase();

  return (
    <UnifiedDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">{userProfile?.first_name} {userProfile?.last_name}</h1>
                <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] font-bold">
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified Identity</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Account Details</CardTitle>
                    <CardDescription className="text-xs">Manage your personal information and contact settings.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">First Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="+1..." {...field} className="pl-10 h-11" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="123 Street Name..." {...field} className="pl-10 h-11" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full md:w-auto h-11 px-8 gap-2 font-bold"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Security & Access Sidebar */}
          <div className="space-y-6">
            {/* PIN for Staff/Admin */}
            {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff' || userRole === 'teacher') && userProfile?.staff_pin && (
              <Card className="bg-primary text-primary-foreground shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Kiosk PIN</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <div className="bg-white/10 rounded-lg py-4 mb-3 border border-white/10">
                    <p className="text-4xl font-black tracking-widest">{userProfile.staff_pin}</p>
                  </div>
                  <p className="text-[10px] text-primary-foreground/70 font-medium">
                    Use this PIN for overrides and check-ins at any physical station.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Access QR */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Access Badge</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                <div className="bg-white p-4 rounded-xl border mb-4">
                  <QRCodeSVG value={user?.id || ""} size={140} />
                </div>
                <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider">
                  Scan at kiosk for instant family authentication.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default UserProfile;
