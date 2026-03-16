import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Monitor, Check, Sparkles } from "lucide-react";
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
      title: "Settings Applied",
      description: "Visual atmosphere and accessibility preferences synchronized.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/10 rounded-[2.5rem] overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5">
          <CardTitle className="text-2xl font-black font-heading flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            Visual Atmosphere
          </CardTitle>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Choose how the application looks and feels on your screen.</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Display Theme</Label>
            <RadioGroup value={theme} onValueChange={(v: any) => setTheme(v)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'light', icon: Sun, label: 'Standard Light' },
                { id: 'dark', icon: Moon, label: 'Deep Dark' },
                { id: 'system', icon: Monitor, label: 'System Sync' }
              ].map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setTheme(item.id as any)} 
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${theme === item.id ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-white/5 hover:border-indigo-200 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${theme === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className={`font-bold text-sm tracking-tight ${theme === item.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-600 dark:text-slate-400'}`}>{item.label}</span>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Color Palette</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {colorOptions.map((option) => (
                <div 
                  key={option.value}
                  onClick={() => setColorScheme(option.value)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${colorScheme === option.value ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-white/5 hover:border-indigo-200'}`}
                >
                  <div className={`h-10 w-10 rounded-full ${option.color} flex items-center justify-center shadow-lg transition-transform ${colorScheme === option.value ? 'scale-110' : 'scale-100'}`}>
                    {colorScheme === option.value && <Check className="h-5 w-5 text-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-indigo-900/10 rounded-[2.5rem] overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5">
          <CardTitle className="text-2xl font-black font-heading">Accessibility & Comfort</CardTitle>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Adjust readability and interface interaction settings.</p>
        </CardHeader>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10">
            <div className="space-y-1">
              <Label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">High Contrast</Label>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal">Improves visibility by using sharper color boundaries.</p>
            </div>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </div>

          <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10">
            <div className="space-y-1">
              <Label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Large Text</Label>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal">Scales up fonts across the platform for better legibility.</p>
            </div>
            <Switch checked={largeText} onCheckedChange={setLargeText} />
          </div>

          <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10">
            <div className="space-y-1">
              <Label className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Interface Motion</Label>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal">Toggle micro-animations and smooth transitions.</p>
            </div>
            <Switch checked={animations} onCheckedChange={setAnimations} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="rounded-2xl h-16 px-12 bg-slate-900 dark:bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 shadow-2xl transition-all active:scale-95 group">
          Apply Visual Profile
          <Sparkles className="w-4 h-4 ml-3 group-hover:rotate-12 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

export default AppearanceSettings;
