
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GeneralSettings from "@/components/settings/GeneralSettings";
import AccountSettings from "@/components/settings/AccountSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 w-full md:w-auto gap-1">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden md:inline">{t('general')}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{t('account')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">{t('notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">{t('security')}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden md:inline">{t('appearance')}</span>
            </TabsTrigger>
          </TabsList>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {activeTab === "general" && t('generalSettings')}
                {activeTab === "account" && t('accountSettings')}
                {activeTab === "notifications" && t('notificationPreferences')}
                {activeTab === "security" && t('securitySettings')}
                {activeTab === "appearance" && t('appearanceSettings')}
              </CardTitle>
              <CardDescription>
                {activeTab === "general" && t('generalSettingsDesc')}
                {activeTab === "account" && t('accountSettingsDesc')}
                {activeTab === "notifications" && t('notificationPreferencesDesc')}
                {activeTab === "security" && t('securitySettingsDesc')}
                {activeTab === "appearance" && t('appearanceSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="general">
                <GeneralSettings />
              </TabsContent>
              <TabsContent value="account">
                <AccountSettings />
              </TabsContent>
              <TabsContent value="notifications">
                <NotificationSettings />
              </TabsContent>
              <TabsContent value="security">
                <SecuritySettings />
              </TabsContent>
              <TabsContent value="appearance">
                <AppearanceSettings />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
