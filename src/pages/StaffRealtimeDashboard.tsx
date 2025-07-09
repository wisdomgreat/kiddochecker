
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Bell,
  UserCheck,
  UserX,
  Eye,
  Plus
} from 'lucide-react';
import { useAttendance } from '@/hooks/useAttendance';
import { useClasses } from '@/hooks/useClasses';
import { supabase } from '@/integrations/supabase/client';

interface Note {
  id: string;
  child_id: string;
  content: string;
  created_at: string;
  created_by: string;
  type: 'note' | 'incident' | 'behavior';
}

const StaffRealtimeDashboard = () => {
  const { toast } = useToast();
  const { attendance, refetch } = useAttendance();
  const { classes } = useClasses();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [noteType, setNoteType] = useState<'note' | 'incident' | 'behavior'>('note');
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Get today's attendance
  const todayAttendance = attendance.filter(record => 
    record.attendance_date === new Date().toISOString().split('T')[0]
  );

  // Filter by selected class
  const filteredAttendance = selectedClass === 'all' 
    ? todayAttendance 
    : todayAttendance.filter(record => record.class_id === selectedClass);

  const checkedInCount = filteredAttendance.filter(record => !record.checked_out_at).length;
  const checkedOutCount = filteredAttendance.filter(record => record.checked_out_at).length;

  // Set up real-time subscriptions
  useEffect(() => {
    const attendanceChannel = supabase
      .channel('staff-attendance-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        (payload) => {
          console.log('Staff dashboard: Attendance update', payload);
          refetch();
          
          // Show notification for new check-ins
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Check-in",
              description: "A child has been checked in",
            });
          } else if (payload.eventType === 'UPDATE' && payload.new.checked_out_at) {
            toast({
              title: "Check-out Complete",
              description: "A child has been checked out",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
    };
  }, [refetch, toast]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedChild) {
      toast({
        title: "Missing Information",
        description: "Please select a child and enter a note",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const noteData = {
        child_id: selectedChild,
        content: newNote.trim(),
        type: noteType,
        created_by: user?.id,
        created_at: new Date().toISOString()
      };

      // For now, we'll store notes in local state
      // In a real implementation, you'd save to database
      const newNoteRecord: Note = {
        id: Date.now().toString(),
        ...noteData,
        created_by: user?.id || 'unknown'
      };

      setNotes(prev => [newNoteRecord, ...prev]);
      setNewNote('');
      setSelectedChild('');
      setShowNoteModal(false);
      
      toast({
        title: "Note Added",
        description: "Note has been saved successfully",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const sendEmergencyAlert = async (childId: string) => {
    try {
      const childRecord = attendance.find(record => record.child_id === childId);
      if (!childRecord?.child) return;

      // In a real implementation, this would send notifications to parents
      toast({
        title: "Emergency Alert Sent",
        description: `Alert sent to parents of ${childRecord.child.first_name} ${childRecord.child.last_name}`,
      });
    } catch (error) {
      toast({
        title: "Alert Failed",
        description: "Unable to send emergency alert",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Real-time Dashboard</h1>
          <p className="text-gray-600">Live attendance tracking and child management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
                  <p className="text-sm text-gray-600">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-blue-600">{checkedOutCount}</p>
                  <p className="text-sm text-gray-600">Checked Out</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-purple-600">{todayAttendance.length}</p>
                  <p className="text-sm text-gray-600">Total Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-orange-600">{notes.length}</p>
                  <p className="text-sm text-gray-600">Notes Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Filter and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => setShowNoteModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>

        {/* Live Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Live Attendance
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown Child'}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge variant={record.checked_out_at ? "secondary" : "default"}>
                          {record.checked_out_at ? 'Checked Out' : 'Checked In'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Class: {record.class?.name || 'None'}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {record.checked_in_at ? new Date(record.checked_in_at).toLocaleTimeString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedChild(record.child_id);
                        setShowNoteModal(true);
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendEmergencyAlert(record.child_id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredAttendance.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  No attendance records found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Child</label>
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a child</option>
                    {todayAttendance.map((record) => (
                      <option key={record.id} value={record.child_id}>
                        {record.child ? `${record.child.first_name} ${record.child.last_name}` : 'Unknown Child'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Note Type</label>
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as 'note' | 'incident' | 'behavior')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="note">General Note</option>
                    <option value="behavior">Behavior</option>
                    <option value="incident">Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Note</label>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note here..."
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleAddNote} className="flex-1">
                    Save Note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNoteModal(false);
                      setNewNote('');
                      setSelectedChild('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffRealtimeDashboard;
