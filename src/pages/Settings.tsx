
import { useState } from "react";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GeneralSettings from "@/components/settings/GeneralSettings";
import AccountSettings from "@/components/settings/AccountSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import CentersSettings from "@/components/settings/CentersSettings";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, MapPin, Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const { t } = useTranslation();

  const tabItems = [
    { value: "general", label: t('general'), icon: SettingsIcon },
    { value: "account", label: t('account'), icon: User },
    { value: "notifications", label: t('notifications'), icon: Bell },
    { value: "security", label: t('security'), icon: Shield },
    { value: "appearance", label: t('appearance'), icon: Palette },
    { value: "locations", label: "Locations", icon: MapPin },
  ];

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-12 max-w-6xl mx-auto py-8 px-4 sm:px-6">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-indigo-500/20">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-foreground dark:text-white tracking-tighter uppercase italic leading-none">
                {t('settings')}
              </h1>
            </div>
            <div className="flex items-center gap-3 ml-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Configure Experience</p>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em]">Personalized Terminal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-card/5 rounded-2xl border border-slate-200 dark:border-white/5">
             <div className="px-4 py-2 bg-card dark:bg-card/10 rounded-xl shadow-sm border border-white/50 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Active Node: {activeTab}</span>
             </div>
          </div>
        </motion.div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-10">
          <TabsList className="flex flex-wrap h-auto bg-transparent border-none gap-3 p-0 md:justify-start">
            {tabItems.map((item) => (
              <TabsTrigger 
                key={item.value}
                value={item.value} 
                className={cn(
                  "flex items-center gap-3 px-8 h-14 rounded-[1.5rem] transition-all duration-300 font-bold uppercase tracking-widest text-[10px] border-none shadow-none",
                  activeTab === item.value 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-500/20 translate-y-[-2px]" 
                    : "bg-card dark:bg-slate-900 text-slate-400 hover:bg-indigo-50 dark:hover:bg-card/5 hover:text-indigo-600"
                )}
              >
                <item.icon className={cn("h-4 w-4", activeTab === item.value ? "text-white" : "text-slate-400")} />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="bg-card dark:bg-slate-900 rounded-[2.5rem] border-none shadow-[LRB] dark:shadow-black/60 shadow-slate-200/50 overflow-hidden group">
                <div className="relative overflow-hidden">
                  <CardHeader className="p-12 pb-6 border-b border-slate-50 dark:border-white/5 relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                       <div className="w-2 h-2 rounded-full bg-indigo-500" />
                       <CardTitle className="text-3xl font-bold text-foreground dark:text-white uppercase italic tracking-tighter">
                          {activeTab === "general" && t('generalSettings')}
                          {activeTab === "account" && t('accountSettings')}
                          {activeTab === "notifications" && t('notificationPreferences')}
                          {activeTab === "security" && t('securitySettings')}
                           {activeTab === "appearance" && t('appearanceSettings')}
                           {activeTab === "locations" && "Location Management"}
                        </CardTitle>
                    </div>
                    <CardDescription className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed max-w-2xl">
                      {activeTab === "general" && t('generalSettingsDesc')}
                      {activeTab === "account" && t('accountSettingsDesc')}
                      {activeTab === "notifications" && t('notificationPreferencesDesc')}
                      {activeTab === "security" && t('securitySettingsDesc')}
                       {activeTab === "appearance" && t('appearanceSettingsDesc')}
                       {activeTab === "locations" && "Manage organization locations and center finder visibility."}
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-600/5 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity opacity-0 group-hover:opacity-100 duration-1000" />
                </div>

                <CardContent className="p-12">
                  <TabsContent value="general" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <GeneralSettings />
                  </TabsContent>
                  <TabsContent value="account" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <AccountSettings />
                  </TabsContent>
                  <TabsContent value="notifications" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <NotificationSettings />
                  </TabsContent>
                  <TabsContent value="security" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <SecuritySettings />
                  </TabsContent>
                   <TabsContent value="appearance" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <AppearanceSettings />
                  </TabsContent>
                  <TabsContent value="locations" className="mt-0 border-none p-0 focus-visible:ring-0">
                    <CentersSettings />
                  </TabsContent>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Tabs>
        
        {/* Footer info section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-6 p-10 bg-slate-50 dark:bg-card/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5"
        >
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-xl bg-card dark:bg-slate-900 flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-indigo-500" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-foreground dark:text-white uppercase tracking-widest">Global Encryption Active</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">All settings are synchronized across devices</p>
             </div>
          </div>
          <button className="flex items-center gap-2 group">
             <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">Documentation</span>
             <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default Settings;

