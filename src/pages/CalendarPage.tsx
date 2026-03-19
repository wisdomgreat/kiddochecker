import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Edit, Trash2, Loader2, Users, Globe } from 'lucide-react';
import { useEvents, Event } from '@/hooks/useEvents';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const CalendarPage = () => {
  const { events, isLoading, addEvent, updateEvent, deleteEvent, isAddingEvent } = useEvents();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    organizer: '',
    is_public: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      organizer: '',
      is_public: true
    });
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
      title: formData.title,
      description: formData.description || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      location: formData.location || undefined,
      organizer: formData.organizer || undefined,
      is_public: formData.is_public
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    updateEvent({
      id: selectedEvent.id,
      title: formData.title,
      description: formData.description || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      location: formData.location || undefined,
      organizer: formData.organizer || undefined,
      is_public: formData.is_public
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    deleteEvent(selectedEvent.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedEvent(null);
      }
    });
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      organizer: event.organizer || '',
      is_public: event.is_public ?? true
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  return (
    <UnifiedDashboardLayout>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar & Events</h1>
            <p className="text-muted-foreground">Manage your organization's events and schedules</p>
          </div>
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-indigo-600" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : events && events.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                initial="hidden"
                animate="show"
              >
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 }
                    }}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(event)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDeleteDialog(event)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        )}

                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            <span>{format(new Date(event.start_date), 'MMM dd, HH:mm')}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-emerald-500" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.organizer && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span>{event.organizer}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-wider">
                            <Globe className="h-3 w-3" />
                            {event.is_public ? 'Public' : 'Private'}
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {new Date(event.start_date) > new Date() ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center min-h-[300px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <CalendarIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">No Events Found</h3>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                  Create your first event to start engaging with your community.
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Event
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Summer Festival" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Tell us more about this event..." rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Start Date & Time</Label>
                  <Input id="start_date" type="datetime-local" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_date">End Date & Time (Optional)</Label>
                  <Input id="end_date" type="datetime-local" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Main Hall" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organizer">Organizer</Label>
                  <Input id="organizer" value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} placeholder="e.g. Community Center" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label>Public Visibility</Label>
                  <p className="text-xs text-muted-foreground">Visible to everyone in the mobile app and kiosk.</p>
                </div>
                <Switch checked={formData.is_public} onCheckedChange={checked => setFormData({ ...formData, is_public: checked })} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isAddingEvent} className="bg-indigo-600 hover:bg-indigo-700">
                {isAddingEvent ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditEvent} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input id="edit-title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-start_date">Start Date & Time</Label>
                  <Input id="edit-start_date" type="datetime-local" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-end_date">End Date & Time</Label>
                  <Input id="edit-end_date" type="datetime-local" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input id="edit-location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-organizer">Organizer</Label>
                  <Input id="edit-organizer" value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <Label>Public Visibility</Label>
                  <p className="text-xs text-muted-foreground">Visible to everyone in the mobile app and kiosk.</p>
                </div>
                <Switch checked={formData.is_public} onCheckedChange={checked => setFormData({ ...formData, is_public: checked })} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnifiedDashboardLayout>
  );
};

export default CalendarPage;
