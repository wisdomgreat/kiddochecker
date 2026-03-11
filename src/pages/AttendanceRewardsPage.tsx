
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
import { Trophy, Star, Gift, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

const AttendanceRewardsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const { data: rewards = [], isLoading, refetch } = useQuery({
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
        title: "Success",
        description: "Reward added successfully",
      });
      setIsAddOpen(false);
    },
    onError: (error: any) => {
      console.error("Error adding reward:", error);
      toast({
        title: "Error",
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
        title: "Success",
        description: "Reward updated successfully",
      });
      setSelectedReward(null);
    },
    onError: (error: any) => {
      console.error("Error updating reward:", error);
      toast({
        title: "Error",
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
        title: "Success",
        description: "Reward removed successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting reward:", error);
      toast({
        title: "Error",
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
            <h1 className="text-3xl font-bold tracking-tight">Attendance Rewards</h1>
            <p className="text-muted-foreground">
              Manage student rewards and point values.
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Reward
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      {reward.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedReward(reward)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {reward.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100">
                      {reward.points} Points
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {rewards.length === 0 && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Rewards Created</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first attendance reward.
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Reward
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Reward Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Reward</DialogTitle>
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
              <DialogTitle>Edit Reward</DialogTitle>
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="points">Points</Label>
        <Input
          id="points"
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        />
      </div>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Submitting..." : "Submit"}
      </Button>
    </div>
  );
};

export default AttendanceRewardsPage;
