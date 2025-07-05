
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestItem {
  id: string;
  category: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export const TestingChecklist = () => {
  const [testItems, setTestItems] = useState<TestItem[]>([
    // Authentication Tests
    { id: '1', category: 'Authentication', description: 'User registration with valid data', priority: 'high', completed: false },
    { id: '2', category: 'Authentication', description: 'User login with correct credentials', priority: 'high', completed: false },
    { id: '3', category: 'Authentication', description: 'User logout functionality', priority: 'high', completed: false },
    { id: '4', category: 'Authentication', description: 'Invalid login attempt handling', priority: 'high', completed: false },
    { id: '5', category: 'Authentication', description: 'Password validation rules', priority: 'medium', completed: false },

    // Role-Based Access Tests
    { id: '6', category: 'Access Control', description: 'Admin dashboard access for admin users', priority: 'high', completed: false },
    { id: '7', category: 'Access Control', description: 'Parent dashboard access for parent users', priority: 'high', completed: false },
    { id: '8', category: 'Access Control', description: 'Teacher dashboard access for staff', priority: 'high', completed: false },
    { id: '9', category: 'Access Control', description: 'Unauthorized access prevention', priority: 'high', completed: false },
    { id: '10', category: 'Access Control', description: 'Role-based navigation menu', priority: 'medium', completed: false },

    // Child Management Tests
    { id: '11', category: 'Child Management', description: 'Add new child with valid data', priority: 'high', completed: false },
    { id: '12', category: 'Child Management', description: 'Edit existing child information', priority: 'high', completed: false },
    { id: '13', category: 'Child Management', description: 'Delete child record', priority: 'medium', completed: false },
    { id: '14', category: 'Child Management', description: 'View child attendance history', priority: 'medium', completed: false },

    // Check-in/Check-out Tests
    { id: '15', category: 'Attendance', description: 'Child check-in process', priority: 'high', completed: false },
    { id: '16', category: 'Attendance', description: 'Child check-out process', priority: 'high', completed: false },
    { id: '17', category: 'Attendance', description: 'QR code scanning for check-out', priority: 'medium', completed: false },
    { id: '18', category: 'Attendance', description: 'Attendance reporting', priority: 'medium', completed: false },
    { id: '19', category: 'Attendance', description: 'Real-time attendance updates', priority: 'low', completed: false },

    // User Management Tests
    { id: '20', category: 'User Management', description: 'Admin can create new users', priority: 'high', completed: false },
    { id: '21', category: 'User Management', description: 'Admin can edit user roles', priority: 'high', completed: false },
    { id: '22', category: 'User Management', description: 'Admin can delete users', priority: 'medium', completed: false },
    { id: '23', category: 'User Management', description: 'User list filtering and search', priority: 'low', completed: false },

    // Class Management Tests
    { id: '24', category: 'Class Management', description: 'Create new class', priority: 'medium', completed: false },
    { id: '25', category: 'Class Management', description: 'Edit class information', priority: 'medium', completed: false },
    { id: '26', category: 'Class Management', description: 'Assign teachers to classes', priority: 'medium', completed: false },
    { id: '27', category: 'Class Management', description: 'View class roster', priority: 'low', completed: false },

    // UI/UX Tests
    { id: '28', category: 'UI/UX', description: 'Responsive design on mobile devices', priority: 'high', completed: false },
    { id: '29', category: 'UI/UX', description: 'Loading states display correctly', priority: 'medium', completed: false },
    { id: '30', category: 'UI/UX', description: 'Error messages are user-friendly', priority: 'medium', completed: false },
    { id: '31', category: 'UI/UX', description: 'Navigation is intuitive', priority: 'medium', completed: false },

    // Performance Tests
    { id: '32', category: 'Performance', description: 'Page load times under 3 seconds', priority: 'medium', completed: false },
    { id: '33', category: 'Performance', description: 'Large data sets load efficiently', priority: 'low', completed: false },
    { id: '34', category: 'Performance', description: 'No memory leaks detected', priority: 'low', completed: false },

    // Security Tests
    { id: '35', category: 'Security', description: 'SQL injection prevention', priority: 'high', completed: false },
    { id: '36', category: 'Security', description: 'XSS attack prevention', priority: 'high', completed: false },
    { id: '37', category: 'Security', description: 'Sensitive data encryption', priority: 'high', completed: false },
    { id: '38', category: 'Security', description: 'Session timeout handling', priority: 'medium', completed: false },
  ]);

  const toggleTestItem = (id: string) => {
    setTestItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const getStats = () => {
    const total = testItems.length;
    const completed = testItems.filter(item => item.completed).length;
    const highPriority = testItems.filter(item => item.priority === 'high').length;
    const highPriorityCompleted = testItems.filter(item => item.priority === 'high' && item.completed).length;
    
    return {
      total,
      completed,
      percentage: Math.round((completed / total) * 100),
      highPriority,
      highPriorityCompleted,
      highPriorityPercentage: Math.round((highPriorityCompleted / highPriority) * 100)
    };
  };

  const stats = getStats();
  const categories = [...new Set(testItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
                <p className="text-sm text-gray-600">Tests Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.percentage}%</p>
                <p className="text-sm text-gray-600">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.highPriorityCompleted}/{stats.highPriority}</p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {categories.map(category => {
        const categoryItems = testItems.filter(item => item.category === category);
        const categoryCompleted = categoryItems.filter(item => item.completed).length;
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {category}
                <Badge variant="outline">
                  {categoryCompleted}/{categoryItems.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleTestItem(item.id)}
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}>
                        {item.description}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        item.priority === 'high' ? 'destructive' :
                        item.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TestingChecklist;
