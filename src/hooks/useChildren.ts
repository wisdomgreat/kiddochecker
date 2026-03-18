import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { childrenService } from '@/services/childrenService';

export interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  age?: number;
  allergies?: string;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  photo_url?: string;
  points_balance?: number;
  created_at: string;
  updated_at: string;
}

export const useChildren = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();

  const isStaffRole = ['staff', 'teacher', 'teacher_assistant', 'volunteer'].includes(userRole || '');

  const { data: children = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.CHILDREN(user?.id),
    queryFn: (): Promise<Child[]> => {
      if (!user) return Promise.resolve([]);
      if (userRole === 'parent') return childrenService.getByParent(user.id);
      if (isStaffRole) return childrenService.getByAssignedClasses();
      return childrenService.getAll(); // admin / super_admin
    },
    enabled: !!user,
  });

  const addChildMutation = useMutation({
    mutationFn: (childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');
      return childrenService.create(user.id, childData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHILDREN() });
      toast({ title: 'Child added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add child', description: error.message, variant: 'destructive' });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: ({ id, ...childData }: Partial<Child> & { id: string }) =>
      childrenService.update(id, childData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHILDREN() });
      toast({ title: 'Child updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update child', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: (childId: string) => childrenService.delete(childId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHILDREN() });
      toast({ title: 'Child removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove child', description: error.message, variant: 'destructive' });
    },
  });

  return {
    children,
    isLoading,
    error,
    refetch,
    addChild: addChildMutation.mutate,
    updateChild: updateChildMutation.mutate,
    deleteChild: deleteChildMutation.mutate,
    isAddingChild: addChildMutation.isPending,
    isUpdatingChild: updateChildMutation.isPending,
    isDeletingChild: deleteChildMutation.isPending,
  };
};

export default useChildren;
