import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Mail, Link as LinkIcon } from "lucide-react";

interface IntegrationFormValues {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  resend_api_key: string;
  resend_domain: string;
  enable_sms_pickups: boolean;
  enable_email_pickups: boolean;
}

const IntegrationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["communication_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communication_settings")
        .select("*")
        .single();
        
      if (error && error.code !== "PGRST116") throw error; // ignore no rows
      return data || null;
    },
  });

  const form = useForm<IntegrationFormValues>({
    defaultValues: {
      twilio_account_sid: "",
      twilio_auth_token: "",
      twilio_phone_number: "",
      resend_api_key: "",
      resend_domain: "",
      enable_sms_pickups: false,
      enable_email_pickups: false,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        twilio_account_sid: config.twilio_account_sid || "",
        twilio_auth_token: config.twilio_auth_token || "",
        twilio_phone_number: config.twilio_phone_number || "",
        resend_api_key: config.resend_api_key || "",
        resend_domain: config.resend_domain || "",
        enable_sms_pickups: config.enable_sms_pickups || false,
        enable_email_pickups: config.enable_email_pickups || false,
      });
    }
  }, [config, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (values: IntegrationFormValues) => {
      if (config?.id) {
        const { error } = await supabase
          .from("communication_settings")
          .update(values as any)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("communication_settings")
          .insert([values as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication_settings"] });
      toast({
        title: "Integration Settings Saved",
        description: "Your SMS and Email configurations have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration Error",
        description: error.message || "Failed to save integrations",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: IntegrationFormValues) => {
    updateSettingsMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* SMS Integration Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <div className="bg-indigo-600 h-1" />
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center gap-4 py-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Twilio SMS Gateway</CardTitle>
              <CardDescription>Configure Twilio to send SMS alerts mapping to parent phones</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="enable_sms_pickups"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-slate-800 font-bold">Enable SMS Features</FormLabel>
                    <FormDescription>
                      Allow outbound SMS formatting at Check-In and for Manual broadcasts.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="twilio_account_sid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account SID</FormLabel>
                    <FormControl>
                      <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twilio_auth_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auth Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••••••••••" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="twilio_phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twilio Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555-019-9999" {...field} />
                  </FormControl>
                  <FormDescription>Your registered Twilio outbound number.</FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Email Integration Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <div className="bg-emerald-500 h-1" />
          <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center gap-4 py-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Mail className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Resend & Email Automation</CardTitle>
              <CardDescription>Configure email delivery for newsletters and critical digital reports</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
             <FormField
              control={form.control}
              name="enable_email_pickups"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-slate-800 font-bold">Enable Email Broadcasts</FormLabel>
                    <FormDescription>
                      Allow the message center to push digital copies or detailed alerts to authenticated parent emails.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resend_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resend API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="re_xxxxxxxxxxxxxxxx" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resend_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sending Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="yourchurch.com" {...field} />
                  </FormControl>
                  <FormDescription>Must be an authenticated domain verified inside Resend.</FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="gap-2 bg-slate-900 shadow-xl px-8 py-6 rounded-xl hover:bg-slate-800 transition-all font-bold" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
            Save Integrations
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default IntegrationSettings;
