import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import ModernLayout from "@/components/layout/ModernLayout";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Gift, Plus, Edit, Trash2, RefreshCw, CheckCircle2, X } from "lucide-react";
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
  child_id: string;
  user_id: string;
  points_spent: number;
  status: string;
  redeemed_at: string;
  reward: { name: string };
  child: { first_name: string; last_name: string };
  parent: { first_name: string; last_name: string };
}

const AttendanceRewardsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ["rewards"],
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
    queryKey: ["redemptions"],
    queryFn: async (): Promise<Redemption[]> => {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select(`
          *,
          reward:rewards(name),
          child:children(first_name, last_name),
          parent:profiles(first_name, last_name)
        `)
        .order("redeemed_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as any;
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
      queryClient.invalidateQueries({ queryKey: ["redemptions"] });
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
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast({
        title: t("rewardAdded"),
      });
      setIsAddOpen(false);
    },
    onError: (error: any) => {
      console.error("Error adding reward:", error);
      toast({
        title: t("loading"),
        description: error.message || "Failed to add reward",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast({
        title: t("rewardUpdated"),
      });
      setSelectedReward(null);
    },
    onError: (error: any) => {
      console.error("Error updating reward:", error);
      toast({
        title: t("loading"),
        description: error.message || "Failed to update reward",
        variant: "destructive",
      });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from("rewards")
        .delete()
        .eq("id", rewardId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast({
        title: t("rewardRemoved"),
      });
    },
    onError: (error: any) => {
      console.error("Error deleting reward:", error);
      toast({
        title: t("loading"),
        description: error.message || "Failed to remove reward",
        variant: "destructive",
      });
    },
  });

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("rewardsTitle")}</h1>
            <p className="text-muted-foreground">
              {t("rewardsSubtitle")}
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addNewReward")}
          </Button>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl h-12 bg-slate-100 p-1">
            <TabsTrigger value="available" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Available Rewards</TabsTrigger>
            <TabsTrigger value="redemptions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Redemptions</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            {rewardsLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((reward) => (
                  <Card key={reward.id} className="hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          {reward.name}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedReward(reward)}>
                            <Edit className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm(t("deleteRewardConfirm"))) {
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
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                          {reward.points} {t("points")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {rewards.length === 0 && !rewardsLoading && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">{t("noRewards")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("noRewardsDesc")}
                  </p>
                  <Button onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("addFirstReward")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="redemptions" className="mt-6">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reward</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redemptionsLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : redemptions.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No redemptions found.</TableCell></TableRow>
                  ) : redemptions.map((red) => (
                    <TableRow key={red.id}>
                      <TableCell className="font-medium">{red.reward?.name || 'Unknown Reward'}</TableCell>
                      <TableCell>{red.child?.first_name} {red.child?.last_name}</TableCell>
                      <TableCell>{red.parent?.first_name} {red.parent?.last_name}</TableCell>
                      <TableCell>{format(new Date(red.redeemed_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          red.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          red.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }>
                          {red.status.charAt(0).toUpperCase() + red.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {red.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => updateStatusMutation.mutate({ id: red.id, status: 'fulfilled' })}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Fulfill
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateStatusMutation.mutate({ id: red.id, status: 'rejected' })}>
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Reward Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addNewReward")}</DialogTitle>
            </DialogHeader>
            <AddEditRewardForm
              onSubmit={(values) => {
                addRewardMutation.mutate(values as Omit<Reward, 'id' | 'created_at' | 'updated_at'>);
              }}
              isLoading={addRewardMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Reward Dialog */}
        <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("editReward")}</DialogTitle>
            </DialogHeader>
            <AddEditRewardForm
              reward={selectedReward}
              onSubmit={(values) => {
                updateRewardMutation.mutate({ id: selectedReward!.id, ...values });
              }}
              isLoading={updateRewardMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ModernLayout>
  );
};

interface AddEditRewardFormProps {
  reward?: Reward | null;
  onSubmit: (values: Partial<Reward>) => void;
  isLoading: boolean;
}

const AddEditRewardForm = ({ reward, onSubmit, isLoading }: AddEditRewardFormProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(reward?.name || "");
  const [description, setDescription] = useState(reward?.description || "");
  const [points, setPoints] = useState(reward?.points?.toString() || "");

  const handleSubmit = () => {
    onSubmit({
      name,
      description,
      points: parseInt(points),
    });
  };

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="name">{t("rewardName")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="description">{t("rewardDescription")}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="points">{t("rewardPoints")}</Label>
        <Input
          id="points"
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        />
      </div>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? t("loading") : "Submit"}
      </Button>
    </div>
  );
};

export default AttendanceRewardsPage;
