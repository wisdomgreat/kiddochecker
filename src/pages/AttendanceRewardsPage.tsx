
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/CleanAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Gift, Plus, Edit, Trash2 } from "lucide-react";
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

  // For now, let's use mock data since rewards table doesn't exist
  const { data: rewards = [], isLoading, refetch } = useQuery({
    queryKey: ["rewards"],
    queryFn: async (): Promise<Reward[]> => {
      // Mock rewards data until rewards table is created
      return [
        {
          id: '1',
          name: 'Perfect Attendance',
          description: 'Attend all sessions in a month',
          points: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Helper Badge',
          description: 'Help clean up after class',
          points: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    },
  });

  // Mock mutations for now
  const addRewardMutation = useMutation({
    mutationFn: async (rewardData: Omit<Reward, 'id' | 'created_at' | 'updated_at'>) => {
      // Mock implementation
      console.log('Adding reward:', rewardData);
      return { id: Math.random().toString(), ...rewardData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
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
      // Mock implementation
      console.log('Updating reward:', id, rewardData);
      return { id, ...rewardData };
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
      // Mock implementation
      console.log('Deleting reward:', rewardId);
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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Attendance Rewards Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Reward
            </Button>
          </div>

          {isLoading ? (
            <p>Loading rewards...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rewards.map((reward) => (
                <Card key={reward.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {reward.name}
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReward(reward)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteRewardMutation.mutate(reward.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{reward.description}</p>
                    <div className="mt-2">
                      <Label>Points:</Label>
                      <p>{reward.points}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
