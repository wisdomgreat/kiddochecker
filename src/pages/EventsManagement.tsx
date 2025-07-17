import React, { useState } from 'react';
import ModernLayout from '@/components/layout/ModernLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEvents } from '@/hooks/useEvents';
import { Calendar, Plus, Edit, Trash2, MapPin, Clock, Users } from 'lucide-react';

const EventsManagement = () => {
  const { toast } = useToast();
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useEvents();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    organizer: '',
    is_public: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        toast({
          title: "Event Updated",
          description: "Event has been updated successfully.",
        });
      } else {
        await addEvent(eventData);
        toast({
          title: "Event Created",
          description: "New event has been created successfully.",
        });
      }
      setIsDialogOpen(false);
      setEditingEvent(null);
      setFormData({ title: '', description: '', start_date: '', end_date: '', location: '', organizer: '', is_public: true });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      organizer: event.organizer || '',
      is_public: event.is_public ?? true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        toast({
          title: "Event Deleted",
          description: "Event has been deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ModernLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's events and activities.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEvent(null);
                setFormData({ title: '', description: '', start_date: '', end_date: '', location: '', organizer: '', is_public: true });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date & Time</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date & Time</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="organizer">Organizer</Label>
                  <Input
                    id="organizer"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  />
                  <Label htmlFor="is_public">Public Event</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEvent ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    {event.title}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  {event.end_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-3"></span>
                      <span>to {formatDate(event.end_date)}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.organizer && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-3 w-3" />
                      <span>{event.organizer}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <Badge variant={event.is_public ? "default" : "secondary"}>
                    {event.is_public ? 'Public' : 'Private'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.start_date) > new Date() ? 'Upcoming' : 'Past'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {events.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to get started with organizing activities.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </ModernLayout>
  );
};

export default EventsManagement;