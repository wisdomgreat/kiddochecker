import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Key, AlertTriangle, Lock, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { ActivityLog } from "@/types/supabase";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const securitySchema = z.object({
  twoFactorEnabled: z.boolean().default(false),
  sessionTimeout: z.number().min(5).max(120),
  loginNotifications: z.boolean().default(true),
});

const SecuritySettings = () => {
  const { toast } = useToast();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const { user } = useAuth();
  const [twoFactorSetupDialogOpen, setTwoFactorSetupDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const securityForm = useForm<z.infer<typeof securitySchema>>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
    },
  });

  // Load security settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("securitySettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        securityForm.reset(settings);
      }
    } catch (error) {
      console.error("Error loading security settings", error);
    }
  }, []);

  // Get 2FA status
  useEffect(() => {
    if (user) {
      const check2FAStatus = async () => {
        try {
          const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (!error && data) {
            // If current AAL is 'aal2', 2FA is enabled
            securityForm.setValue("twoFactorEnabled", data.currentLevel === "aal2");
          }
        } catch (err) {
          console.error("Error checking 2FA status:", err);
        }
      };
      check2FAStatus();
    }
  }, [user]);

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: values.newPassword 
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
      setShowPasswordForm(false);
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function onSecuritySubmit(values: z.infer<typeof securitySchema>) {
    // Save settings to localStorage
    localStorage.setItem("securitySettings", JSON.stringify(values));
    
    // Handle 2FA setting separately
    if (values.twoFactorEnabled !== securityForm.getValues("twoFactorEnabled")) {
      if (values.twoFactorEnabled) {
        // Start 2FA setup process
        setTwoFactorSetupDialogOpen(true);
        try {
          const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
          });
          if (error) throw error;
          if (data) {
            setQrCodeUrl(data.totp.qr_code);
          }
        } catch (error: any) {
          toast({
            title: "Error setting up 2FA",
            description: error.message,
            variant: "destructive",
          });
          securityForm.setValue("twoFactorEnabled", false);
        }
      } else {
        // Disable 2FA if currently enabled
        try {
          // In a real app, this would disable 2FA
          toast({
            title: "2FA Disabled",
            description: "Two-factor authentication has been disabled.",
          });
        } catch (error: any) {
          toast({
            title: "Error disabling 2FA",
            description: error.message,
            variant: "destructive",
          });
          securityForm.setValue("twoFactorEnabled", true);
        }
      }
    }
    
    toast({
      title: "Security settings updated",
      description: "Your security preferences have been saved.",
    });
  }

  const handleVerify2FA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: 'totp',
      });
      
      if (error) throw error;
      
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        code: verificationCode,
        challengeId: data.id,
      });
      
      if (verifyError) throw verifyError;
      
      setTwoFactorSetupDialogOpen(false);
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify the code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    
    setIsLoadingActivity(true);
    setActivityDialogOpen(true);
    
    try {
      // Here we would fetch actual activity logs from the database
      // For this demo, we'll create mock activity logs
      setTimeout(() => {
        const now = new Date();
        const mockActivity: ActivityLog[] = [
          {
            id: "1",
            user_id: user.id,
            action: "Login",
            details: "Successful login from Chrome on Windows",
            timestamp: new Date(now.getTime() - 60000).toISOString(),
            userName: user.email || "Unknown User",
          },
          {
            id: "2",
            user_id: user.id,
            action: "Password Change",
            details: "Password successfully changed",
            timestamp: new Date(now.getTime() - 3600000).toISOString(),
            userName: user.email || "Unknown User",
          },
          {
            id: "3",
            user_id: user.id,
            action: "Login",
            details: "Successful login from Safari on macOS",
            timestamp: new Date(now.getTime() - 86400000).toISOString(),
            userName: user.email || "Unknown User",
          },
          {
            id: "4",
            user_id: user.id,
            action: "Profile Update",
            details: "Profile information updated",
            timestamp: new Date(now.getTime() - 259200000).toISOString(),
            userName: user.email || "Unknown User",
          },
        ];
        
        setRecentActivity(mockActivity);
        setIsLoadingActivity(false);
      }, 1000);
    } catch (error: any) {
      console.error("Error fetching activity logs:", error);
      toast({
        title: "Error",
        description: "Failed to load activity logs. Please try again.",
        variant: "destructive",
      });
      setIsLoadingActivity(false);
    }
  };

  const watchTwoFactorEnabled = securityForm.watch("twoFactorEnabled");

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Password</CardTitle>
          </div>
          <CardDescription>
            Update your password regularly to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)}>Change Password</Button>
          ) : (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormDescription>
                        Password must be at least 8 characters long.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit">Update Password</Button>
                  <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Account Security</CardTitle>
          </div>
          <CardDescription>
            Control security settings for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...securityForm}>
            <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
              <FormField
                control={securityForm.control}
                name="twoFactorEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Two-Factor Authentication</FormLabel>
                      <FormDescription>
                        Add an additional layer of security to your account.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={securityForm.control}
                name="sessionTimeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Timeout (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={120}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      How long until inactive sessions are automatically logged out.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={securityForm.control}
                name="loginNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Login Notifications</FormLabel>
                      <FormDescription>
                        Receive notifications when your account is accessed from a new device.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit">Save Security Settings</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Account Activity</CardTitle>
          </div>
          <CardDescription>
            Monitor and review your recent account activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={fetchRecentActivity}>
            <Clock className="mr-2 h-4 w-4" />
            View Recent Activity
          </Button>
        </CardContent>
      </Card>
      
      {/* Recent Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recent Account Activity</DialogTitle>
            <DialogDescription>
              Review recent actions and logins on your account.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingActivity ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              <span className="ml-2">Loading activity...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{activity.action}</h4>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(activity.timestamp), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
              
              {recentActivity.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No recent activity found.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 2FA Setup Dialog */}
      <Dialog open={twoFactorSetupDialogOpen} onOpenChange={(open) => {
        setTwoFactorSetupDialogOpen(open);
        if (!open) {
          securityForm.setValue("twoFactorEnabled", false);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCodeUrl ? (
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            ) : (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="verificationCode" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="verificationCode"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setTwoFactorSetupDialogOpen(false);
                  securityForm.setValue("twoFactorEnabled", false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleVerify2FA}>
                Verify and Enable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecuritySettings;
