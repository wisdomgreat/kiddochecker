
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Calendar,
  Plus,
  MapPin,
  Edit,
  Trash2,
  RefreshCcw,
  CalendarClock,
  Download,
  User,
  Globe,
  Users,
} from "lucide-react";
import { format, parseISO, isAfter, isPast, isFuture, isToday } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EventItem, EventFormValues } from "@/types/events";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const EventsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all");
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, user } = useAuth();

  // Check if user can manage events
  const canManageEvents = ["admin", "super_admin", "teacher", "staff"].includes(userRole || "");

  // Form setup for add/edit event
  const form = useForm<EventFormValues>({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      startDate: new Date(),
      endDate: null,
      organizer: "",
      isPublic: true,
    },
  });

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: true });

        if (error) throw error;

        // Transform data to match EventItem interface
        return data.map((item): EventItem => ({
          id: item.id,
          title: item.title,
          startDate: item.start_date,
          endDate: item.end_date,
          location: item.location,
          description: item.description,
          organizer: item.organizer,
          isPublic: item.is_public,
        }));
      } catch (error: any) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!user,
  });

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title: eventData.title,
            description: eventData.description,
            start_date: eventData.startDate?.toISOString(),
            end_date: eventData.endDate?.toISOString() || null,
            location: eventData.location,
            organizer: eventData.organizer,
            is_public: eventData.isPublic,
          }
        ])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsAddEventOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }: { id: string, eventData: EventFormValues }) => {
      const { data, error } = await supabase
        .from("events")
        .update({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.startDate?.toISOString(),
          end_date: eventData.endDate?.toISOString() || null,
          location: eventData.location,
          organizer: eventData.organizer,
          is_public: eventData.isPublic,
        })
        .eq("id", id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsEditEventOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Filter events based on search term and filter
  const filteredEvents = events.filter((event) => {
    const searchMatch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (event.location?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (event.organizer?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const startDate = parseISO(event.startDate);
    
    if (activeFilter === "upcoming") {
      return (isFuture(startDate) || isToday(startDate)) && searchMatch;
    }
    if (activeFilter === "past") {
      return isPast(startDate) && !isToday(startDate) && searchMatch;
    }
    return searchMatch;
  });

  // Handle form submission for add event
  const handleAddEvent = form.handleSubmit((data) => {
    addEventMutation.mutate(data);
  });

  // Handle form submission for edit event
  const handleEditEvent = form.handleSubmit((data) => {
    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, eventData: data });
    }
  });

  // Handle edit event button click
  const openEditEventDialog = (event: EventItem) => {
    setSelectedEvent(event);
    form.reset({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startDate: event.startDate ? parseISO(event.startDate) : new Date(),
      endDate: event.endDate ? parseISO(event.endDate) : null,
      organizer: event.organizer || "",
      isPublic: event.isPublic !== false, // Default to true if undefined
    });
    setIsEditEventOpen(true);
  };

  // Handle delete event button click
  const openDeleteDialog = (event: EventItem) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete event
  const confirmDeleteEvent = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  // Get event status based on dates
  const getEventStatus = (startDate: string, endDate?: string | null) => {
    const start = parseISO(startDate);
    
    if (isPast(start) && !isToday(start)) {
      return { label: "Past", class: "bg-gray-100 text-gray-800" };
    }
    
    if (isToday(start)) {
      return { label: "Today", class: "bg-blue-100 text-blue-800" };
    }
    
    const now = new Date();
    const inNextWeek = new Date(now);
    inNextWeek.setDate(now.getDate() + 7);
    
    if (isAfter(start, now) && !isAfter(start, inNextWeek)) {
      return { label: "Upcoming", class: "bg-green-100 text-green-800" };
    }
    
    return { label: "Scheduled", class: "bg-purple-100 text-purple-800" };
  };

  const eventColumns = [
    {
      key: "title" as const,
      header: "Event Details",
      render: (value: string, event: EventItem) => (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <div className="font-medium">{event.title}</div>
            {event.description && (
              <div className="text-xs text-gray-500 line-clamp-1">{event.description}</div>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "date" as const,
      header: "Date & Time",
      render: (value: string, event: EventItem) => {
        const startDate = parseISO(event.startDate);
        const status = getEventStatus(event.startDate, event.endDate);
        
        return (
          <div className="space-y-1">
            <div className="flex items-center">
              <CalendarClock size={16} className="mr-1 text-gray-500" />
              <span>{format(startDate, "MMM d, yyyy")}</span>
            </div>
            <div className="text-xs text-gray-500">
              {format(startDate, "h:mm a")}
              {event.endDate && ` - ${format(parseISO(event.endDate), "h:mm a")}`}
            </div>
            <Badge variant="outline" className={status.class}>
              {status.label}
            </Badge>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "location" as const,
      header: "Location",
      render: (value: string | null) => (
        <div>
          {value ? (
            <div className="flex items-center">
              <MapPin size={16} className="mr-1 text-gray-500" />
              <span>{value}</span>
            </div>
          ) : (
            <span className="text-gray-400">No location specified</span>
          )}
        </div>
      ),
    },
    {
      key: "organizer" as const,
      header: "Organizer",
      render: (value: string | null) => (
        <div>
          {value ? (
            <div className="flex items-center">
              <User size={16} className="mr-1 text-gray-500" />
              <span>{value}</span>
            </div>
          ) : (
            <span className="text-gray-400">Not specified</span>
          )}
        </div>
      ),
    },
    {
      key: "visibility" as const,
      header: "Visibility",
      render: (value: boolean | undefined) => (
        <div>
          {value !== false ? (
            <div className="flex items-center">
              <Globe size={16} className="mr-1 text-green-600" />
              <span className="text-sm">Public</span>
            </div>
          ) : (
            <div className="flex items-center">
              <Users size={16} className="mr-1 text-blue-600" />
              <span className="text-sm">Private</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions" as const,
      header: "Actions",
      render: (value: any, event: EventItem) => (
        <div className="flex justify-end space-x-2">
          {canManageEvents && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openEditEventDialog(event)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openDeleteDialog(event)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events Management</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          {canManageEvents && (
            <Button onClick={() => {
              form.reset(); // Reset form before opening
              setIsAddEventOpen(true);
            }}>
              <Plus className="mr-1 h-4 w-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                Manage upcoming and past events for your organization
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search events..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveFilter("all")}
            >
              All Events
            </Button>
            <Button 
              variant={activeFilter === "upcoming" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("upcoming")}
            >
              Upcoming
            </Button>
            <Button 
              variant={activeFilter === "past" ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilter("past")}
            >
              Past
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCcw className="animate-spin h-6 w-6 text-purple-600 mr-2" />
              <span>Loading events...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? "No events match your search criteria." 
                  : "Get started by adding your first event."}
              </p>
              {canManageEvents && (
                <div className="mt-6">
                  <Button onClick={() => {
                    form.reset();
                    setIsAddEventOpen(true);
                  }}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <DataTable
              columns={eventColumns}
              data={filteredEvents}
              keyExtractor={(item) => item.id}
              searchable={false}
              pagination
            />
          )}
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event for your organization. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input required placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter event description" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="organizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizer</FormLabel>
                    <FormControl>
                      <Input placeholder="Event organizer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Public Event</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this event visible to everyone
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={addEventMutation.isPending}>
                  {addEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={handleEditEvent} className="space-y-4">
              {/* Form fields same as add event */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input required placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Event location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter event description" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="organizer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizer</FormLabel>
                    <FormControl>
                      <Input placeholder="Event organizer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Public Event</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this event visible to everyone
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={updateEventMutation.isPending}>
                  {updateEventMutation.isPending ? "Updating..." : "Update Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{selectedEvent?.title}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent} className="bg-red-600 hover:bg-red-700">
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default EventsManagement;
