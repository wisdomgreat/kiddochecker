
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, CreditCard, DollarSign, Calendar, Filter, 
  ArrowUpRight, Download, Search, PlusCircle, AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useCRMManagement } from '@/hooks/useCRMManagement';
import AddDonationDialog from './AddDonationDialog';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';

const DonationTracker = () => {
    const { donations, donationsLoading, addDonation } = useCRMManagement();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const stats = {
        total: donations.reduce((acc, d) => acc + Number(d.amount), 0),
        count: donations.length,
        avg: donations.length ? (donations.reduce((acc, d) => acc + Number(d.amount), 0) / donations.length) : 0
    };

    const filteredDonations = donations.filter(d => 
        ((d.member as any)?.profiles?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        ((d.member as any)?.profiles?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (donationsLoading) {
        return <div className="p-12 text-center text-[#2B3481] font-bold uppercase tracking-tighter animate-bounce flex items-center justify-center gap-3"><DollarSign className="h-6 w-6" /> Reconciling Church Ledger...</div>
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-8 rounded-[2rem] bg-[#353D8C] text-white border-none shadow-xl flex flex-col justify-between relative overflow-hidden group">
                    <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Total Contributions</p>
                        <h3 className="text-4xl font-bold">${stats.total.toLocaleString()}</h3>
                    </div>
                </Card>
                <Card className="p-8 rounded-[2rem] bg-card dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Transactions</p>
                        <h3 className="text-4xl font-bold text-foreground dark:text-white group-hover:text-[#353D8C] transition-colors">{stats.count}</h3>
                    </div>
                </Card>
                <Card className="p-8 rounded-[2rem] bg-card dark:bg-slate-900 border border-slate-100 dark:border-white/10 shadow-sm flex flex-col justify-between group">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Average Gift</p>
                        <h3 className="text-4xl font-bold text-foreground dark:text-white group-hover:text-[#353D8C] transition-colors">${stats.avg.toFixed(0)}</h3>
                    </div>
                </Card>
                <Button onClick={() => setIsAddOpen(true)} className="h-full rounded-[2rem] bg-emerald-500 hover:bg-emerald-600 border-none flex flex-col items-center justify-center p-8 text-white shadow-lg active:scale-95 transition-all gap-3 overflow-hidden">
                    <div className="w-12 h-12 bg-card/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest leading-none">Record New Giving</span>
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Ledger Table */}
                <div className="flex-1 bg-card dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-white/10 p-10 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground dark:text-white uppercase tracking-tight">Recent Financials</h3>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search Donor..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10 h-12 rounded-[1.2rem] bg-slate-50 border-none font-bold placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredDonations.map((donation) => (
                            <div key={donation.id} className="flex items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-[1.5rem] group hover:bg-card dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-all hover:shadow-xl hover:scale-[1.01]">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-card dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-[#353D8C] shadow-inner group-hover:bg-[#353D8C] group-hover:text-white transition-all">
                                        {(donation.member as any)?.profiles?.first_name?.[0] || 'A'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground dark:text-white uppercase tracking-tight">
                                            {donation.is_anonymous ? 'Anonymous' : `${(donation.member as any)?.profiles?.first_name} ${(donation.member as any)?.profiles?.last_name}`}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[9px] font-bold uppercase border-none bg-slate-100/50 text-slate-500 rounded-full px-2">{donation.category}</Badge>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(donation.donation_date), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-emerald-600 leading-none mb-1">+${Number(donation.amount).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{donation.payment_method}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories Distribution */}
                <Card className="w-full lg:w-80 p-10 rounded-[2.5rem] bg-indigo-600 text-white border-none shadow-2xl flex flex-col gap-8 relative overflow-hidden group">
                     <div>
                        <h4 className="font-bold text-lg uppercase tracking-tight mb-6">Funds Distribution</h4>
                        <div className="space-y-6">
                            {['Tithe', 'Offering', 'Building', 'Mission'].map((fund, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                                        <span>{fund}</span>
                                        <span>{Math.floor(Math.random() * 40) + 10}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-card/20 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} whileInView={{ width: '60%' }} className="h-full bg-card shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                     <div className="mt-auto space-y-3">
                         <div className="p-5 bg-card/10 rounded-2xl border border-white/10 backdrop-blur-md">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Next Audit</p>
                            <p className="text-sm font-bold flex items-center justify-between">April 1, 2026 <AlertCircle className="h-4 w-4 opacity-40" /></p>
                         </div>
                         <Button className="w-full h-12 bg-card text-indigo-600 font-bold rounded-xl text-xs uppercase tracking-widest shadow-xl group/btn transition-all active:scale-95">
                             GENERATE REPORT <ArrowUpRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                         </Button>
                     </div>
                </Card>
            </div>

            {/* Coming from MemberCRMDialog integration:
                Add Giving Record Dialog could be added here or integrated into Member Profile */}
            <AddDonationDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
        </div>
    );
};

export default DonationTracker;

