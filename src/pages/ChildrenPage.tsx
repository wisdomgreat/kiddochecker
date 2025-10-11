import React from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Baby, UserPlus } from 'lucide-react';
import { useChildren } from '@/hooks/useChildren';
import { Badge } from '@/components/ui/badge';

const ChildrenPage = () => {
  const { children, isLoading } = useChildren();

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Children</h1>
            <p className="text-muted-foreground">Manage children information</p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Child
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading children...</p>
              </CardContent>
            </Card>
          ) : children && children.length > 0 ? (
            children.map((child: any) => (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Baby className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {child.first_name} {child.last_name}
                      </CardTitle>
                      {child.age && (
                        <Badge variant="outline" className="mt-2">
                          Age {child.age}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {child.allergies && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      <strong>Allergies:</strong> {child.allergies}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-6 text-center">
                <Baby className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Children</h3>
                <p className="text-muted-foreground mb-4">
                  Add children to get started
                </p>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
};

export default ChildrenPage;
