
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { GeneralSettingsFormValues } from "./schemas/generalSettingsSchema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe } from "lucide-react";

interface FeatureToggleFieldsProps {
  form: UseFormReturn<GeneralSettingsFormValues>;
}

export function FeatureToggleFields({ form }: FeatureToggleFieldsProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b">
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">Feature Management</CardTitle>
        </div>
        <CardDescription>Enable or disable specific application modules.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <FormField
          control={form.control}
          name="showCenterFinder"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-bold">Enable Location Selector</FormLabel>
                <FormDescription>
                  Show the 'Center Finder' in the sidebar and navigation.
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
      </CardContent>
    </Card>
  );
}
