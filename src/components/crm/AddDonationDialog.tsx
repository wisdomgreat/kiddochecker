
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { useCRMManagement } from '@/hooks/useCRMManagement';
import { useMembers } from '@/hooks/useMembers';

interface AddDonationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddDonationDialog: React.FC<AddDonationDialogProps> = ({ isOpen, onOpenChange }) => {
    const { addDonation } = useCRMManagement();
    const { members } = useMembers();
    const [formData, setFormData] = useState({
        member_id: '',
        amount: '',
        category: 'tithe',
        payment_method: 'transfer',
        notes: '',
        is_anonymous: false
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.member_id || !formData.amount) return;

        addDonation({
            member_id: formData.member_id,
            amount: parseFloat(formData.amount),
            category: formData.category,
            payment_method: formData.payment_method,
            notes: formData.notes,
            is_anonymous: formData.is_anonymous,
            donation_date: new Date().toISOString()
        }, {
            onSuccess: () => {
                onOpenChange(false);
                setFormData({ member_id: '', amount: '', category: 'tithe', payment_method: 'transfer', notes: '', is_anonymous: false });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card dark:bg-slate-950">
                <div className="bg-[#353D8C] p-8 text-white">
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight">Record Contribution</DialogTitle>
                    <DialogDescription className="text-white/80 font-medium">Log a new donation or giving for missionary work and maintenance.</DialogDescription>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Select Donor</Label>
                            <Select value={formData.member_id} onValueChange={val => setFormData({ ...formData, member_id: val })}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold shadow-inner">
                                    <SelectValue placeholder="Search members..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 rounded-xl border-none shadow-2xl">
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold">
                                            {m.profiles?.first_name} {m.profiles?.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Amount ($)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={formData.amount} 
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 border-none pl-10 font-bold text-lg" 
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Fund Category</Label>
                                <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                        {['tithe', 'offering', 'building_fund', 'missions', 'other'].map(c => <SelectItem key={c} value={c} className="font-bold capitalize">{c.replace('_', ' ')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Method</Label>
                            <Select value={formData.payment_method} onValueChange={val => setFormData({ ...formData, payment_method: val })}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    {['transfer', 'card', 'cash', 'check'].map(m => <SelectItem key={m} value={m} className="font-bold capitalize">{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1">Private Notes</Label>
                            <Input 
                                placeholder="Ref: Sunday Special..." 
                                value={formData.notes} 
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="h-12 rounded-2xl bg-slate-50 border-none px-4 font-bold" 
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14 bg-[#353D8C] hover:bg-[#2B3481] text-white rounded-[1.5rem] font-bold tracking-widest shadow-xl active:scale-95 transition-all mt-4">
                        <CheckCircle2 className="h-5 w-5 mr-2" /> RECONCILE GIVING
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddDonationDialog;

