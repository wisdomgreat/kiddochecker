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
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { Settings, Building, Palette, Shield, Clock, Users, Mail, ExternalLink, HardDrive, FileWarning, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
            <p className="text-muted-foreground">
              Configure your organization preferences and branding.
            </p>
          </div>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <Building className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="checkin">
              <Clock className="h-4 w-4 mr-2" />
              Check-in
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Mail className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="storage">
              <HardDrive className="h-4 w-4 mr-2" />
              Storage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                  <div className="space-y-1">
                    <Label className="text-base font-bold text-slate-900 leading-none">Enable Center Finder</Label>
                    <p className="text-sm text-slate-500">Enable the public locator map for your centers</p>
                  </div>
                  <Switch
                    checked={formData.show_center_finder}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_center_finder: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex space-x-2 mt-2">
                    {['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.primary_color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Font Family</Label>
                  <Select value={formData.font_family} onValueChange={(value) => setFormData({ ...formData, font_family: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Check-in Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Check-in System</Label>
                    <p className="text-sm text-muted-foreground">Allow children to be checked in and out</p>
                  </div>
                  <Switch
                    checked={formData.check_in_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, check_in_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Check-out</Label>
                    <p className="text-sm text-muted-foreground">Automatically check out children at closing time</p>
                  </div>
                  <Switch
                    checked={formData.auto_checkout}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_checkout: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Print Name Tags</Label>
                    <p className="text-sm text-muted-foreground">Automatically print name tags during check-in</p>
                  </div>
                  <Switch
                    checked={formData.print_name_tags}
                    onCheckedChange={(checked) => setFormData({ ...formData, print_name_tags: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require PIN for Check-out</Label>
                    <p className="text-sm text-muted-foreground">Require PIN verification for child pickup</p>
                  </div>
                  <Switch
                    checked={formData.require_pin}
                    onCheckedChange={(checked) => setFormData({ ...formData, require_pin: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Digital Signature on Checkout</Label>
                    <p className="text-sm text-muted-foreground">Require a digital signature for child pickup</p>
                  </div>
                  <Switch
                    checked={formData.require_checkout_signature}
                    onCheckedChange={(checked) => setFormData({ ...formData, require_checkout_signature: checked })}
                  />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={formData.email_notifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                  </div>
                  <Switch
                    checked={formData.sms_notifications}
                    onCheckedChange={(checked) => setFormData({ ...formData, sms_notifications: checked })}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => navigate('/admin/email-templates')}
                  >
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Manage Email Templates
                    </div>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.session_timeout}
                    onChange={(e) => setFormData({ ...formData, session_timeout: parseInt(e.target.value) })}
                    min="5"
                    max="120"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Users will be logged out after this period of inactivity
                  </p>
                </div>
                <div>
                  <Label>Backup Frequency</Label>
                  <Select value={formData.backup_frequency} onValueChange={(value) => setFormData({ ...formData, backup_frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 border-t">
                  <Label htmlFor="google_maps_key">Google Maps API Key</Label>
                  <Input
                    id="google_maps_key"
                    type="password"
                    value={formData.google_maps_api_key}
                    onChange={(e) => setFormData({ ...formData, google_maps_api_key: e.target.value })}
                    placeholder="AIza..."
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Required for the Center Finder map feature.
                  </p>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-indigo-600" />
                  <CardTitle>File Resource Manager (Quota)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Global Upload Quota (KB)</Label>
                        <Input 
                            type="number" 
                            value={formData.max_upload_size_kb} 
                            onChange={e => setFormData({...formData, max_upload_size_kb: parseInt(e.target.value)})}
                        />
                        <p className="text-xs text-slate-500 italic">Default is 200KB per file.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Enforcement Policy</Label>
                        <Select value={formData.upload_limit_type} onValueChange={(val: any) => setFormData({...formData, upload_limit_type: val})}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hard">Hard Limit (Block Upload)</SelectItem>
                                <SelectItem value="soft">Soft Limit (Log & Warn)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>

                 <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <Label className="font-bold">File Screen (Administrative Filters)</Label>
                    </div>
                    <Textarea 
                        placeholder="exe, bat, sh, php..."
                        value={formData.blocked_extensions}
                        onChange={e => setFormData({...formData, blocked_extensions: e.target.value})}
                        rows={3}
                    />
                    <p className="text-xs text-slate-500">Comma-separated list of blocked extensions. Mirrored from Windows Server FSRM.</p>
                 </div>

                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <FileWarning className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-xs text-amber-800 space-y-1">
                        <p className="font-bold">Security Note</p>
                        <p>Hard limits strictly prevent uploads exceeding the quota. Soft limits allow the file but generate a system warning for administrative review.</p>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
};

export default OrganizationSettings;