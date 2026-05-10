
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { OrganizationDetailsStep } from "./OrganizationDetailsStep";
import { AdminAccountStep } from "./AdminAccountStep";
import { AppearanceStep } from "./AppearanceStep";
import { WizardNavigation } from "./WizardNavigation";
import { useOrganizationCreation } from "@/hooks/useOrganizationCreation";
import { validation } from "@/utils/validation";

const organizationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().min(1, "Last name is required"),
  adminEmail: z.string().email("Please enter a valid email address"),
  adminPhone: z.string().optional(),
  adminPassword: z.string().superRefine((val, ctx) => {
    const result = validation.password(val);
    if (!result.isValid) {
      result.errors.forEach((err) => {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
      });
    }
  }),
  primaryColor: z.string().default("#6366f1"),
  fontFamily: z.string().default("Inter"),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationWizardProps {
  onComplete: () => void;
}

export const OrganizationWizard = ({ onComplete }: OrganizationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const { createOrganization, isSubmitting } = useOrganizationCreation(onComplete);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organizationName: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminPhone: "",
      adminPassword: "",
      primaryColor: "#6366f1",
      fontFamily: "Inter",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const steps = [
    {
      title: "Organization Details",
      component: (
        <OrganizationDetailsStep
          form={form}
          logoPreview={logoPreview}
          handleLogoChange={handleLogoChange}
          onNext={() => setCurrentStep(2)}
        />
      ),
    },
    {
      title: "Admin Account",
      component: (
        <AdminAccountStep
          form={form}
          onBack={() => setCurrentStep(1)}
          onNext={() => setCurrentStep(3)}
        />
      ),
    },
    {
      title: "Appearance",
      component: (
        <AppearanceStep
          form={form}
          onBack={() => setCurrentStep(2)}
          isSubmitting={isSubmitting}
        />
      ),
    },
  ];

  return (
    <WizardNavigation
      currentStep={currentStep}
      totalSteps={steps.length}
      stepTitle={steps[currentStep - 1].title}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(createOrganization)}>
          {steps[currentStep - 1].component}
        </form>
      </Form>
    </WizardNavigation>
  );
};

export default OrganizationWizard;

