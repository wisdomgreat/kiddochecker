import React, { useState } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/hooks/useSettings';
import { Settings, Building, Palette, Shield, Clock, Users, Mail, ExternalLink, HardDrive, FileWarning, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const OrganizationSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    primary_color: '#6366f1',
    font_family: 'Inter',
    logo_url: '',
    check_in_enabled: true,
    auto_checkout: false,
    require_pin: true,
    session_timeout: 30,
    email_notifications: true,
    sms_notifications: false,
    print_name_tags: true,
    require_checkout_signature: false,
    google_maps_api_key: '',
    show_center_finder: true,
    show_wellness_check: true, // Already present in state initialization
    max_upload_size_kb: 200,
    upload_limit_type: 'hard' as 'hard' | 'soft',
    blocked_extensions: 'exe, bat, sh, php, js, py',
    backup_frequency: 'daily'
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        address: '', // Assuming these might not be in the table yet but keeping for UI
        phone: '',
        email: '',
        primary_color: settings.primary_color || '#6366f1',
        font_family: settings.font_family || 'Inter',
        logo_url: settings.logo_url || '',
        check_in_enabled: true,
        auto_checkout: false,
        require_pin: true,
        session_timeout: 30,
        email_notifications: true,
        sms_notifications: false,
        print_name_tags: true,
        require_checkout_signature: settings.require_checkout_signature || false,
        google_maps_api_key: settings.google_maps_api_key || '',
        show_center_finder: settings.show_center_finder ?? true,
        show_wellness_check: settings.show_wellness_check ?? true,
        max_upload_size_kb: settings.max_upload_size_kb || 200,
        upload_limit_type: settings.upload_limit_type || 'hard',
        blocked_extensions: settings.blocked_extensions?.join(', ') || 'exe, bat, sh, php, js, py',
        backup_frequency: 'daily'
      });
    }
  }, [settings]);


  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        blocked_extensions: formData.blocked_extensions.split(',').map(ext => ext.trim()).filter(Boolean)
      };
      await updateSettings(payload);
      toast({
        title: "Settings Saved",
        description: "Organization settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleColorChange = (color: string) => {
    setFormData(prev => ({ ...prev, primary_color: color }));
    // Apply theme color immediately
    document.documentElement.style.setProperty('--primary', color);
  };

  return (
    <ModernLayout>
      <div className="space-y-12 pb-20">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12"
        >
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-foreground dark:text-white tracking-tighter uppercase italic leading-none">Settings</h1>
            <div className="flex items-center gap-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Organization Management</p>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em]">System Version 2.0.4</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 rounded-[1.5rem] font-bold uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            Save Configuration
          </Button>
        </motion.div>

        <Tabs defaultValue="general" className="space-y-12">
          <TabsList className="bg-slate-100 dark:bg-card/5 p-2 rounded-[2rem] h-16 w-full lg:w-max flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: "general", icon: Building, label: "Identity" },
              { id: "appearance", icon: Palette, label: "Visuals" },
              { id: "checkin", icon: Clock, label: "Operations" },
              { id: "notifications", icon: Mail, label: "Outreach" },
              { id: "security", icon: Shield, label: "Security" },
              { id: "storage", icon: HardDrive, label: "Infrastructure" },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="rounded-[1.25rem] h-12 px-6 data-[state=active]:bg-card dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-lg font-bold text-[10px] uppercase tracking-widest transition-all gap-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border-none p-10">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white uppercase italic tracking-tight">Organization Identity</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Core public information and contact details</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Organization Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold text-lg focus:ring-2 ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Physical Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="bg-slate-50 dark:bg-card/5 border-none rounded-2xl p-6 font-bold focus:ring-2 ring-indigo-500/20 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Primary Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold focus:ring-2 ring-indigo-500/20"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Public Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold focus:ring-2 ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-indigo-600 rounded-[2.5rem] shadow-2xl p-10 text-white flex flex-col justify-between relative overflow-hidden group">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold uppercase italic tracking-tight">Location Services</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80 italic">Map features and center locator</p>
                  
                  <div className="mt-12 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 pr-4">
                        <p className="font-bold uppercase tracking-widest text-[10px]">Center Finder</p>
                        <p className="text-[10px] opacity-60 leading-tight">Enable the public locator map for your centers</p>
                      </div>
                      <Switch
                        checked={formData.show_center_finder}
                        onCheckedChange={(checked) => setFormData({ ...formData, show_center_finder: checked })}
                        className="data-[state=checked]:bg-card data-[state=unchecked]:bg-indigo-400"
                      />
                    </div>
                    <div className="p-6 bg-card/10 backdrop-blur-md rounded-3xl border border-white/10">
                      <ExternalLink className="h-8 w-8 mb-4 opacity-50" />
                      <p className="text-xs font-bold leading-relaxed opacity-90">When enabled, visitors can find your locations via the kiosk or public web portal.</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-card/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-8 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border-none p-10">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white uppercase italic tracking-tight">Brand Visuals</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Customize the look and feel of your portal</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="logo_url" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Logo Source URL</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold focus:ring-2 ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Primary Branding Color</Label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                        <button
                          key={color}
                          className={cn(
                            "w-12 h-12 rounded-2xl border-4 transition-all duration-300 shadow-lg",
                            formData.primary_color === color ? 'border-indigo-100 scale-110 rotate-3' : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border-none p-10">
                <div className="mb-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white uppercase italic tracking-tight">Typography Systems</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Defined font pairings for the interface</p>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Font Family</Label>
                    <Select value={formData.font_family} onValueChange={(value) => setFormData({ ...formData, font_family: value })}>
                      <SelectTrigger className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        <SelectItem value="Inter" className="rounded-xl font-bold">Inter (Modern & Clean)</SelectItem>
                        <SelectItem value="Roboto" className="rounded-xl font-bold">Roboto (Technical)</SelectItem>
                        <SelectItem value="Open Sans" className="rounded-xl font-bold">Open Sans (Readable)</SelectItem>
                        <SelectItem value="Lato" className="rounded-xl font-bold">Lato (Round & Friendly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-8 bg-slate-50 dark:bg-card/5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center">
                    <div className="text-center italic opacity-40">
                      <Palette className="h-10 w-10 mx-auto mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Visual Preview Container</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-8 outline-none">
            <Card className="bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border-none p-10">
               <div className="mb-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white uppercase italic tracking-tight">Operational Logic</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure kiosk and session behavior</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { id: 'check_in_enabled', label: "Enable Check-in System", desc: "Allow children to be checked in and out", icon: Clock },
                    { id: 'auto_checkout', label: "Auto Check-out", desc: "Automatically check out children at closing time", icon: LogOut },
                    { id: 'print_name_tags', label: "Print Name Tags", desc: "Automatically print name tags during check-in", icon: HardDrive },
                    { id: 'require_pin', label: "Require PIN for Check-out", desc: "Require PIN verification for child pickup", icon: ShieldCheck },
                    { id: 'require_checkout_signature', label: "Digital Signature", desc: "Require a digital signature for child pickup", icon: ExternalLink },
                    { id: 'show_wellness_check', label: "Wellness Screening", desc: "Mandatory health check questions before check-in", icon: FileWarning },
                  ].map((item) => (
                    <div key={item.id} className="p-8 rounded-[2rem] bg-slate-50 dark:bg-card/5 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:bg-card dark:hover:bg-card/10 hover:shadow-xl transition-all duration-500">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-card dark:bg-slate-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <item.icon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-foreground dark:text-white uppercase tracking-tight text-sm">{item.label}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={(formData as any)[item.id]}
                        onCheckedChange={(checked) => setFormData({ ...formData, [item.id]: checked })}
                      />
                    </div>
                  ))}
               </div>
            </Card>
          </TabsContent>

          {/* Additional Tabs following same pattern */}
          <TabsContent value="security" className="space-y-8 outline-none">
            <Card className="bg-card dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-none p-10">
               <div className="mb-10">
                  <h3 className="text-2xl font-bold text-foreground dark:text-white uppercase italic tracking-tight">Security & Governance</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Manage infrastructure keys and backups</p>
               </div>
               <div className="space-y-8 max-w-2xl">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Google Maps API Key</Label>
                    <Input
                      type="password"
                      value={formData.google_maps_api_key}
                      onChange={(e) => setFormData({ ...formData, google_maps_api_key: e.target.value })}
                      placeholder="AIza..."
                      className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Session Timeout (m)</Label>
                      <Input
                        type="number"
                        value={formData.session_timeout}
                        onChange={(e) => setFormData({ ...formData, session_timeout: parseInt(e.target.value) })}
                        className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Backup Frequency</Label>
                      <Select value={formData.backup_frequency} onValueChange={(value) => setFormData({ ...formData, backup_frequency: value })}>
                        <SelectTrigger className="h-14 bg-slate-50 dark:bg-card/5 border-none rounded-2xl px-6 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          <SelectItem value="daily" className="font-bold">Daily (Recommended)</SelectItem>
                          <SelectItem value="weekly" className="font-bold">Weekly</SelectItem>
                          <SelectItem value="monthly" className="font-bold">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
               </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>

  );
};

export default OrganizationSettings;
