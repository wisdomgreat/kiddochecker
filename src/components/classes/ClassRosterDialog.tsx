import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClassRosterDialogProps {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClassRosterDialog = ({ classId, className, open, onOpenChange }: ClassRosterDialogProps) => {
  // Fetch children in this class (via attendance)
  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['class-roster', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          child_id,
          children!inner(id, first_name, last_name, age, allergies)
        `)
        .eq('class_id', classId)
        .order('children(first_name)');

      if (error) throw error;
      
      // Get unique children
      const uniqueChildren = Array.from(
        new Map(data?.map(item => [item.child_id, item.children])).values()
      );
      
      return uniqueChildren || [];
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Class Roster: {className}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading roster...</span>
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No children enrolled in this class yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {roster.map((child: any) => (
                <div key={child.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      {child.first_name} {child.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Age: {child.age || 'N/A'}
                    </p>
                  </div>
                  {child.allergies && (
                    <Badge variant="destructive" className="ml-2">
                      Allergies: {child.allergies}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="text-sm text-muted-foreground text-center">
            Total: {roster.length} {roster.length === 1 ? 'child' : 'children'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
