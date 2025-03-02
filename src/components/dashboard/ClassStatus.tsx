
import { UsersRound, MoreHorizontal } from "lucide-react";
import { ClassStatusItem } from "@/hooks/useDashboardData";

interface ClassStatusProps {
  classData: ClassStatusItem[];
  isLoading: boolean;
}

const ClassStatus = ({ classData, isLoading }: ClassStatusProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Class Status</h2>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading class data...</div>
        ) : (
          classData.map((classItem) => (
            <div key={classItem.id} className="glass-card p-4 rounded-lg">
              <div className="flex items-start">
                <div className="rounded-full bg-purple-100 p-2 mr-3">
                  <UsersRound size={20} className="text-purple-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{classItem.name}</h3>
                  <p className="text-sm text-gray-500">
                    {classItem.children} children, {classItem.teachers} teachers
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="rounded-full p-1 hover:bg-gray-100">
                    <MoreHorizontal size={18} className="text-gray-500" />
                  </button>
                  <div className="relative inline-block w-10 align-middle select-none">
                    <input
                      type="checkbox"
                      className="sr-only"
                      defaultChecked={classItem.active}
                    />
                    <div className="block h-6 rounded-full bg-gray-200 w-10"></div>
                    <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transform ${classItem.active ? 'translate-x-4' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4">
        <button className="btn-primary">Manage All Classes</button>
      </div>
    </div>
  );
};

export default ClassStatus;
