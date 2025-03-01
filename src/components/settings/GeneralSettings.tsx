
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { generalSettingsSchema, defaultValues, type GeneralSettingsFormValues } from "./schemas/generalSettingsSchema";
import { ChurchInfoFields } from "./ChurchInfoFields";
import { AddressField } from "./AddressField";
import { CheckInSettingsFields } from "./CheckInSettingsFields";
import { CheckInPolicyFields } from "./CheckInPolicyFields";

const GeneralSettings = () => {
  const { toast } = useToast();

  const form = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues,
  });

  function onSubmit(values: GeneralSettingsFormValues) {
    console.log(values);
    toast({
      title: "Settings updated",
      description: "Your general settings have been saved successfully.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ChurchInfoFields form={form} />
        <AddressField form={form} />
        <CheckInSettingsFields form={form} />
        <CheckInPolicyFields form={form} />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
};

export default GeneralSettings;
