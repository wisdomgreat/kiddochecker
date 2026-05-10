import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { generalSettingsSchema, defaultValues, type GeneralSettingsFormValues } from "./schemas/generalSettingsSchema";
import { ChurchInfoFields } from "./ChurchInfoFields";
import { AddressField } from "./AddressField";
import { CheckInSettingsFields } from "./CheckInSettingsFields";
import { CheckInPolicyFields } from "./CheckInPolicyFields";
import { FeatureToggleFields } from "./FeatureToggleFields";
import { Loader2 } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";

const GeneralSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organization settings
  const { data: orgSettings, isLoading } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues,
  });

  // Update form when data is loaded
  useEffect(() => {
    if (orgSettings) {
      form.reset({
        churchName: orgSettings.name || "",
        timeZone: (orgSettings as any).timezone || "America/New_York",
        address: "",
        checkInWindow: "15",
        allowLateCheckIn: true,
        allowEarlyCheckOut: false,
        sessionLength: "60",
        logoUrl: orgSettings.logo_url || "",
        showCenterFinder: orgSettings.show_center_finder ?? true,
      });
    }
  }, [orgSettings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (values: GeneralSettingsFormValues) => {
      const { data, error } = await supabase
        .from("organization_settings")
        .update({
          name: values.churchName,
          logo_url: values.logoUrl,
          show_center_finder: values.showCenterFinder,
          timezone: values.timeZone,
        })
        .eq("id", orgSettings?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast({
        title: "Settings updated",
        description: "Your organization settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: GeneralSettingsFormValues) {
    updateSettingsMutation.mutate(values);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-slate-50/50">
              <FormLabel className="font-semibold text-lg mb-2">Organization Logo</FormLabel>
              <FormControl>
                <ImageUpload
                  defaultImage={field.value || undefined}
                  onUpload={field.onChange}
                  bucket="avatars"
                />
              </FormControl>
              <FormDescription className="text-center mt-2">
                This logo will be displayed on the check-in kiosk and dashboard. Max 150KB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <ChurchInfoFields form={form} />
        <AddressField form={form} />
        <CheckInSettingsFields form={form} />
        <CheckInPolicyFields form={form} />
        <FeatureToggleFields form={form} />
        <Button type="submit" disabled={updateSettingsMutation.isPending}>
          {updateSettingsMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Changes
        </Button>
      </form>
    </Form>
  );
};

export default GeneralSettings;

