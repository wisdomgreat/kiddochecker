
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, Search, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ClassManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const filteredClasses = classes.filter(cls => 
    searchTerm === '' || 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Class Management</h2>
          <p className="text-gray-600">Manage classes and capacity</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            All Classes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-4">Loading classes...</div>
            ) : filteredClasses.length === 0 ? (
              <div className="col-span-full text-center py-4 text-gray-500">
                No classes found
              </div>
            ) : (
              filteredClasses.map(cls => (
                <Card key={cls.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{cls.name}</h3>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                    {cls.description && (
                      <p className="text-sm text-gray-600 mb-2">{cls.description}</p>
                    )}
                    <div className="space-y-1">
                      {cls.age_range && (
                        <Badge variant="outline" className="text-xs">
                          {cls.age_range}
                        </Badge>
                      )}
                      {cls.room && (
                        <p className="text-xs text-gray-500">Room: {cls.room}</p>
                      )}
                      {cls.capacity && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Users className="h-3 w-3 mr-1" />
                          Capacity: {cls.capacity}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassManagement;

