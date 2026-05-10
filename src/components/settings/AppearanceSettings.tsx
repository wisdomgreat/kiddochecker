import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AppearanceSettings = () => {
  const { toast } = useToast();
  const { 
    theme, setTheme, 
    colorScheme, setColorScheme, 
    highContrast, setHighContrast, 
    largeText, setLargeText,
    animations, setAnimations
  } = useTheme();

  const colorOptions = [
    { value: "purple" as const, label: "Midnight Purple", color: "bg-purple-600" },
    { value: "blue" as const, label: "Ocean Blue", color: "bg-blue-600" },
    { value: "green" as const, label: "Emerald Green", color: "bg-green-600" },
    { value: "orange" as const, label: "Sunset Orange", color: "bg-orange-600" },
  ];

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your appearance preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Display Theme</CardTitle>
          <CardDescription>Choose how the application looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={theme} onValueChange={(v: any) => setTheme(v)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'light', icon: Sun, label: 'Light Mode' },
              { id: 'dark', icon: Moon, label: 'Dark Mode' },
              { id: 'system', icon: Monitor, label: 'System' }
            ].map(item => (
              <div 
                key={item.id} 
                onClick={() => setTheme(item.id as any)} 
                className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors ${theme === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
              >
                <item.icon className={`h-4 w-4 ${theme === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${theme === item.id ? 'text-primary' : 'text-foreground'}`}>{item.label}</span>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-4">
            <Label className="text-xs font-bold text-muted-foreground uppercase">Accent Color</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colorOptions.map((option) => (
                <div 
                  key={option.value}
                  onClick={() => setColorScheme(option.value)}
                  className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition-colors ${colorScheme === option.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                >
                  <div className={`h-6 w-6 rounded-full ${option.color} flex items-center justify-center`}>
                    {colorScheme === option.value && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>Adjust font size and contrast for better readability.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-3 p-4 border rounded-md bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-bold">High Contrast</Label>
              <p className="text-xs text-muted-foreground"> Sharper colors and boundaries.</p>
            </div>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </div>

          <div className="flex flex-col gap-3 p-4 border rounded-md bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-bold">Large Text</Label>
              <p className="text-xs text-muted-foreground">Scales up fonts for legibility.</p>
            </div>
            <Switch checked={largeText} onCheckedChange={setLargeText} />
          </div>

          <div className="flex flex-col gap-3 p-4 border rounded-md bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-bold">Animations</Label>
              <p className="text-xs text-muted-foreground">Toggle UI transitions and effects.</p>
            </div>
            <Switch checked={animations} onCheckedChange={setAnimations} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-[140px]">
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default AppearanceSettings;

