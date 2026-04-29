import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import UnifiedDashboardLayout from "@/components/layout/UnifiedDashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Gift, Plus, Edit, Trash2, RefreshCw, CheckCircle2, X, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface Redemption {
  id: string;
  reward_id: string;
  user_id: string;
  points_at_redemption: number;
  status: string;
  redeemed_at: string;
  reward?: { name: string };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

const AttendanceRewardsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['attendance-rewards'],
    queryFn: async (): Promise<Reward[]> => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("points", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: redemptions = [], isLoading: redemptionsLoading } = useQuery({
    queryKey: ['reward-redemptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select(`
          *,
          reward:reward_id (name),
          profiles:user_id (first_name, last_name)
        `)
        .order("redeemed_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Redemption[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.rpc("update_redemption_status", {
        p_redemption_id: id,
        p_status: status
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-redemptions"] });
      toast({ title: "Status updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addRewardMutation = useMutation({
    mutationFn: async (rewardData: Omit<Reward, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("rewards")
        .insert([rewardData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-rewards"] });
      toast({ title: "Reward added successfully" });
      setIsAddOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async ({ id, ...rewardData }: Partial<Reward> & { id: string }) => {
      const { data, error } = await supabase
        .from("rewards")
        .update(rewardData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-rewards"] });
      toast({ title: "Reward updated successfully" });
      setSelectedReward(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rewards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-rewards"] });
      toast({ title: "Reward deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-600" />
             </div>
             <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("rewardsTitle")}</h1>
                <p className="text-slate-500 font-medium italic">Incentivize attendance and track community gratitude.</p>
             </div>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="rounded-xl font-bold bg-indigo-600 shadow-indigo-100 shadow-lg px-6">
            <Plus className="mr-2 h-4 w-4" />
            {t("addNewReward")}
          </Button>
        </div>

        <Card className="bg-indigo-50/50 border-indigo-100 shadow-none rounded-[2rem]">
          <CardContent className="p-6 flex items-start gap-4">
             <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
                <Info className="h-5 w-5 text-indigo-600" />
             </div>
             <div className="space-y-1">
                <h3 className="font-bold text-indigo-900">{t('howDoPointsWork')}</h3>
                <p className="text-sm text-indigo-700 leading-relaxed">
                  Reward points are <strong>granted and thoughtfully tracked</strong> against a child's balance upon every successful check-in (5 points per session). 
                  Parents can view and redeem these points via the Parent Portal. Admins then approve or fulfill redemptions from the "{t('redemptions')}" tab below.
                </p>
             </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl h-12 bg-slate-100 p-1">
            <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Available Rewards</TabsTrigger>
            <TabsTrigger value="redemptions" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">Redemptions</TabsTrigger>
          </TabsList>

          <TabsContent value="redemptions" className="mt-6">
            <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold">Redeemed By</TableHead>
                    <TableHead className="font-bold">Reward</TableHead>
                    <TableHead className="font-bold">Points Spent</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptionsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10"><RefreshCw className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : redemptions.length > 0 ? (
                    redemptions.map((redemption) => (
                      <TableRow key={redemption.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <h4 className="font-bold text-foreground leading-tight">
                              {redemption.profiles?.first_name || 'Member'} {redemption.profiles?.last_name || ''}
                            </h4>
                            <p className="text-xs font-bold text-slate-400">
                              Redeemed {format(new Date(redemption.redeemed_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{redemption.reward?.name}</TableCell>
                        <TableCell>{redemption.points_at_redemption}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              redemption.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              redemption.status === 'fulfilled' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              "bg-slate-50 text-slate-600"
                            }
                          >
                            {redemption.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {redemption.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 h-8 rounded-lg"
                                onClick={() => updateStatusMutation.mutate({ id: redemption.id, status: 'fulfilled' })}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Fulfill
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-rose-600 hover:bg-rose-50 h-8 rounded-lg"
                                onClick={() => updateStatusMutation.mutate({ id: redemption.id, status: 'rejected' })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No redemptions found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="mt-6">
            {rewardsLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <Card key={reward.id} className="hover:shadow-md transition-shadow relative overflow-hidden group border-none shadow-xl shadow-slate-100 rounded-[2rem]">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          {reward.name}
                        </CardTitle>
                        <div className="flex gap-1 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedReward(reward)} className="rounded-xl">
                            <Edit className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this reward?")) {
                                deleteRewardMutation.mutate(reward.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {reward.description || "No description provided."}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none font-bold px-3 py-1 rounded-lg">
                          {reward.points} POINTS
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Reward Dialog */}
        <Dialog open={isAddOpen || !!selectedReward} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setSelectedReward(null); } }}>
          <DialogContent className="rounded-[2rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{selectedReward ? "Edit Reward" : "Add New Reward"}</DialogTitle>
            </DialogHeader>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get("name") as string,
                  description: formData.get("description") as string,
                  points: parseInt(formData.get("points") as string),
                };
                if (selectedReward) {
                  updateRewardMutation.mutate({ id: selectedReward.id, ...data });
                } else {
                  addRewardMutation.mutate(data);
                }
              }}
              className="space-y-4 pt-4"
            >
              <div className="space-y-2">
                <Label className="font-bold">Reward Name</Label>
                <Input name="name" defaultValue={selectedReward?.name} required className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Description</Label>
                <Textarea name="description" defaultValue={selectedReward?.description} className="rounded-xl" rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Points Required</Label>
                 <Input name="points" type="number" defaultValue={selectedReward?.points} required className="rounded-xl h-11" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-indigo-600 mt-4">
                {selectedReward ? "Update Reward" : "Create Reward"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default AttendanceRewardsPage;

