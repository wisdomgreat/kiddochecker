
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Child } from "@/hooks/useChildren";

interface ChildCardProps {
  child: Child;
  onEdit?: (child: Child) => void;
  onDelete?: (childId: string) => void;
  onUpdate?: () => void;
  showActions?: boolean;
}

const ChildCard = ({ child, onEdit, onDelete, onUpdate, showActions = true }: ChildCardProps) => {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(child);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(child.id);
    }
  };

  return (
    <Card className="hover:shadow-xl dark:shadow-black/20 transition-all border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4 border-b border-slate-50 dark:border-white/5">
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
            <AvatarImage src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} />
            <AvatarFallback className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black">
              {child.first_name?.charAt(0) || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {child.first_name} {child.last_name}
          </CardTitle>
        </div>
        {showActions && (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <Edit className="h-4 w-4 text-slate-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-10 w-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {child.age && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Biological Age</span>
              <Badge className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-none px-3 py-1 font-bold">{child.age} Years</Badge>
            </div>
          )}
          
          {child.allergies && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Critical Allergies</span>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40">
                {child.allergies}
              </p>
            </div>
          )}
          
          {child.medical_info && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Medical Protocols</span>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                {child.medical_info}
              </p>
            </div>
          )}
          
          {child.emergency_contact_name && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Emergency Protocol</span>
              <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="font-bold text-slate-900 dark:text-slate-100">{child.emergency_contact_name}</p>
                {child.emergency_contact_phone && (
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">{child.emergency_contact_phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildCard;
