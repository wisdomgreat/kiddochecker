
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import ModernLayout from "@/components/layout/ModernLayout";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Gift, RefreshCw, Award } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  image_url?: string;
}

const ParentRewardsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

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

  const { data: myChildren = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["parent-my-children", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Set default child if not selected
  React.useEffect(() => {
    if (myChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(myChildren[0].id);
    }
  }, [myChildren, selectedChildId]);

  const selectedChild = myChildren.find((c: any) => c.id === selectedChildId);

  const redeemMutation = useMutation({
    mutationFn: async ({ rewardId }: { rewardId: string }) => {
      if (!selectedChildId || !selectedChild) throw new Error("No child selected");
      
      const { data, error } = await supabase.rpc("redeem_reward", {
        p_child_id: selectedChildId,
        p_reward_id: rewardId
      });
      
      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || "Failed to redeem reward");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-my-children"] });
      queryClient.invalidateQueries({ queryKey: ["redemptions"] });
      toast({
        title: t("redeemSuccess"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("loading"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRedeem = (reward: Reward) => {
    if (!selectedChild) return;
    
    if ((selectedChild.points_balance || 0) < reward.points) {
      toast({
        title: t("insufficientPoints"),
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(t("confirmRedeem", { rewardName: reward.name, childName: selectedChild.first_name }))) {
      redeemMutation.mutate({ rewardId: reward.id });
    }
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("rewardsTitle")}</h1>
            <p className="text-muted-foreground">
              Redeem points for child rewards.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-amber-500" />
            <Select value={selectedChildId || ""} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-[200px] h-11 rounded-xl">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {myChildren.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.first_name} ({child.points_balance || 0} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {rewardsLoading || childrenLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className="hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-amber-500" />
                    {reward.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {reward.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                      {reward.points} {t("points")}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 border-t mt-auto p-4">
                    <Button 
                        className="w-full rounded-xl bg-amber-600 hover:bg-amber-700" 
                        disabled={!selectedChild || (selectedChild.points_balance || 0) < reward.points || redeemMutation.isPending}
                        onClick={() => handleRedeem(reward)}
                    >
                        {redeemMutation.isPending ? t("loading") : t("redeem")}
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {rewards.length === 0 && !rewardsLoading && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">{t("noRewards")}</h3>
              <p className="text-muted-foreground">
                No rewards have been added by the center yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ModernLayout>
  );
};

export default ParentRewardsPage;
