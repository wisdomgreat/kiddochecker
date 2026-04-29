
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  children: React.ReactNode;
}

export const WizardNavigation = ({ currentStep, totalSteps, stepTitle, children }: WizardNavigationProps) => {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          Step {currentStep} of {totalSteps}: {stepTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

