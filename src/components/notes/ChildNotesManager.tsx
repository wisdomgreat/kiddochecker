import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, Eye, EyeOff } from "lucide-react";

interface ChildNote {
  id: string;
  child_id: string;
  teacher_id: string;
  note_text: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  child_name?: string;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
}

const ChildNotesManager = () => {
  const { user, isTeacher, isStaff, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [newNote, setNewNote] = useState({
    note_text: "",
    note_type: "general",
    is_private: false
  });

  // Fetch children that this user can add notes for
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: ["children-for-notes"],
    queryFn: async (): Promise<Child[]> => {
      const { data, error } = await supabase
        .from('children')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!(user && (isTeacher || isStaff || isAdmin))
  });

  // Fetch notes for selected child
  const { data: notes = [], isLoading: notesLoading, refetch } = useQuery({
    queryKey: ["child-notes", selectedChild],
    queryFn: async (): Promise<ChildNote[]> => {
      if (!selectedChild) return [];
      
      const { data, error } = await supabase
        .from('child_notes')
        .select(`
          *,
          children!inner(first_name, last_name)
        `)
        .eq('child_id', selectedChild)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(note => ({
        ...note,
        child_name: `${note.children.first_name} ${note.children.last_name}`
      }));
    },
    enabled: !!selectedChild
  });

  // Add new note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: typeof newNote & { child_id: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('child_notes')
        .insert({
          child_id: noteData.child_id,
          teacher_id: user.id,
          note_text: noteData.note_text,
          note_type: noteData.note_type,
          is_private: noteData.is_private
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-notes", selectedChild] });
      setNewNote({ note_text: "", note_type: "general", is_private: false });
      toast({
        title: "Note Added",
        description: "The note has been successfully added.",
      });
    },
    onError: (error: any) => {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddNote = () => {
    if (!selectedChild || !newNote.note_text.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a child and enter a note.",
        variant: "destructive",
      });
      return;
    }

    addNoteMutation.mutate({
      ...newNote,
      child_id: selectedChild
    });
  };

  const noteTypeColors = {
    general: "bg-blue-100 text-blue-800",
    behavioral: "bg-yellow-100 text-yellow-800",
    medical: "bg-red-100 text-red-800",
    academic: "bg-green-100 text-green-800",
    parent_communication: "bg-purple-100 text-purple-800"
  };

  if (!isTeacher && !isStaff && !isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You don't have permission to manage child notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Child Notes</h1>
          <p className="text-muted-foreground">Add and manage notes for children</p>
        </div>
      </div>

      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger>
              <SelectValue placeholder="Select a child to add notes" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Add New Note */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Note Type</label>
                <Select 
                  value={newNote.note_type} 
                  onValueChange={(value) => setNewNote(prev => ({ ...prev, note_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="parent_communication">Parent Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={newNote.is_private}
                  onChange={(e) => setNewNote(prev => ({ ...prev, is_private: e.target.checked }))}
                />
                <label htmlFor="private" className="text-sm font-medium flex items-center gap-1">
                  {newNote.is_private ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Private Note (staff only)
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Note</label>
              <Textarea
                value={newNote.note_text}
                onChange={(e) => setNewNote(prev => ({ ...prev, note_text: e.target.value }))}
                placeholder="Enter your note here..."
                rows={4}
              />
            </div>
            <Button 
              onClick={handleAddNote} 
              disabled={addNoteMutation.isPending || !newNote.note_text.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              {addNoteMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing Notes */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {notesLoading ? (
              <div className="text-center py-4">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No notes found for this child.
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={noteTypeColors[note.note_type as keyof typeof noteTypeColors]}>
                          {note.note_type.replace('_', ' ')}
                        </Badge>
                        {note.is_private && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()} at{' '}
                        {new Date(note.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{note.note_text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChildNotesManager;
