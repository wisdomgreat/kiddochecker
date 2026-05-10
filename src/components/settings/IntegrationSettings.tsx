import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
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
        
      if (error && error.code !== "PGRST116") throw error;
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
        title: "Settings Saved",
        description: "Integration preferences updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save integrations.",
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20 flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/10 rounded border">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Twilio Gateway</CardTitle>
              <CardDescription>SMS alerts and broadcasts configuration.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <FormField
              control={form.control}
              name="enable_sms_pickups"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-bold">Enable SMS Gateway</FormLabel>
                    <FormDescription className="text-xs">
                      Allow outbound SMS for check-ins and broadcasts.
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="twilio_account_sid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Account SID</FormLabel>
                    <FormControl>
                      <Input placeholder="ACxxxxxxxxxxxx" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="twilio_auth_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Auth Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Outbound Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555-000-0000" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20 flex flex-row items-center gap-3">
            <div className="p-2 bg-primary/10 rounded border">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email Integration</CardTitle>
              <CardDescription>Resend API configuration for email automation.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
             <FormField
              control={form.control}
              name="enable_email_pickups"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-bold">Enable Email Gateway</FormLabel>
                    <FormDescription className="text-xs">
                      Allow digital reports and broadcasts via email.
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
              control={form.control}
              name="resend_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="re_xxxxxxxxxxxx" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resend_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Sending Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="example.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" className="min-w-[140px]" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : <LinkIcon className="h-4 w-4 mr-2" />}
            Save Integrations
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default IntegrationSettings;

