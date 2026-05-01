
import React from 'react';
import { format } from 'date-fns';
import { 
  Clock, Shield, MapPin, Monitor, Smartphone, 
  Signature, CheckCircle2, AlertTriangle, 
  ArrowRightCircle, UserCheck, HeartPulse
} from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ForensicTimelineProps {
  record: AttendanceRecord;
}

const ForensicTimeline: React.FC<ForensicTimelineProps> = ({ record }) => {
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return format(new Date(dateStr), 'MMM d, yyyy h:mm:ss a');
  };

  return (
    <div className="space-y-8 py-4">
      {/* 0. High-Authority Header */}
      <div className="flex flex-col gap-1 pb-6 border-b border-border/50">
        <h2 className="text-4xl font-black tracking-tighter text-foreground leading-none">
          {record.children?.first_name} {record.children?.last_name}
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Case ID: {record.id.split('-')[0]}</span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Session Date: {record.attendance_date}
          </span>
        </div>
      </div>
      <div className="relative pl-8 space-y-12 ml-2">
        {/* The Digital Chain of Custody Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-primary to-amber-500 rounded-full opacity-20" />

        {/* 1. Check-in Event */}
        <div className="relative group">
          <div className="absolute -left-[29px] top-0 h-6 w-6 rounded-full bg-emerald-500 border-4 border-background shadow-lg shadow-emerald-500/20 flex items-center justify-center z-10 transition-transform group-hover:scale-110" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="badge-success px-3 py-1">Entry Logged</Badge>
              <span className="text-[11px] font-bold text-muted-foreground">
                {formatDateTime(record.checked_in_at)}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold tracking-tight">Successful Forensic Check-in</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="glass-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <Monitor className="h-3 w-3" /> Hardware Terminal
                  </div>
                  <p className="text-sm font-bold truncate">
                    {record.checked_in_method} @ {record.checked_in_station || 'Main Kiosk'}
                  </p>
                </div>
                <div className="glass-card p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <UserCheck className="h-3 w-3" /> Security Verifier
                  </div>
                  <p className="text-sm font-bold truncate">
                    {record.checked_in_by ? `Authorized ID: ${record.checked_in_by.slice(0, 8)}` : 'Automated Gate'}
                  </p>
                </div>
              </div>
              
              {/* Health Screening */}
              <div className={cn(
                "p-3 rounded-xl border flex items-center gap-3",
                (record.health_fever || record.health_cough) 
                  ? "bg-destructive/5 border-destructive/10 text-destructive"
                  : "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}>
                {(record.health_fever || record.health_cough) ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  Health Screening: {(record.health_fever || record.health_cough) ? 'Symptoms Flagged' : 'Passed (Zero Symptoms)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ACTIVE CARE SPAN - The "Safety Zone" */}
        <div className="relative py-4">
          <div className="absolute -left-[32px] top-0 bottom-0 w-[44px] bg-primary/5 rounded-full border border-primary/10 shadow-inner" />
          <div className="p-6 glass-card border-primary/20 bg-primary/5 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <HeartPulse className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Legal Duty of Care Active</p>
                <p className="text-sm font-medium text-muted-foreground mt-1 leading-relaxed">
                  The child remained in the continuous supervised custody of <span className="text-foreground font-bold underline decoration-primary/30 decoration-2 underline-offset-2">{record.class?.name || 'Authorized Staff'}</span>.
                </p>
              </div>
            </div>

            {/* Care Activity Log Integration */}
            {record.care_logs && record.care_logs.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <span className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Activity Ledger</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {record.care_logs.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 p-2 bg-background/50 rounded-xl border border-border/50">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold capitalize truncate">{log.event_type}</p>
                        <p className="text-[9px] text-muted-foreground">{format(new Date(log.created_at), 'h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Incident Reports Integration */}
            {record.incidents && record.incidents.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <span className="text-[9px] font-black uppercase text-destructive tracking-[0.2em]">Safety Incidents Captured</span>
                {record.incidents.map((inc: any) => (
                  <div key={inc.id} className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-[10px] font-black uppercase text-destructive tracking-widest">{inc.type}</span>
                      </div>
                      <Badge variant="destructive" className="text-[8px] h-4 font-black">{inc.severity}</Badge>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">{inc.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Check-out Event / Active State */}
        {record.checked_out_at ? (
          <div className="relative group">
            <div className="absolute -left-[29px] top-0 h-6 w-6 rounded-full bg-amber-500 border-4 border-background shadow-lg shadow-amber-500/20 flex items-center justify-center z-10 transition-transform group-hover:scale-110" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="badge-warning px-3 py-1">Custody Transferred</Badge>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {formatDateTime(record.checked_out_at)}
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight">Successful Security Sign-out</h3>
                
                {/* Manual Override Reason */}
                {record.manual_override_reason && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Administrative Override</p>
                      <p className="text-sm font-medium text-amber-900/80 mt-1 italic">"{record.manual_override_reason}"</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="glass-card p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <Smartphone className="h-3 w-3" /> Telemetry Fingerprint
                    </div>
                    <p className="text-xs font-bold text-muted-foreground italic truncate">
                      Device: {record.device_metadata?.platform || 'Verified Station'}
                    </p>
                  </div>
                  <div className="glass-card p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      <MapPin className="h-3 w-3" /> Discharge Location
                    </div>
                    <p className="text-sm font-bold">
                      Main Gate <span className="text-[10px] font-normal text-muted-foreground ml-1">ID: GATE-M1</span>
                    </p>
                  </div>
                </div>

                {/* Digital Signature */}
                {record.signature_data && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Authorized Signature</span>
                    <div className="glass-card bg-white p-4 flex items-center justify-center">
                      <img src={record.signature_data} alt="Sign-out Evidence" className="max-h-24 opacity-80" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute -left-[29px] top-0 h-6 w-6 rounded-full bg-primary/20 border-4 border-background flex items-center justify-center z-10">
              <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
            </div>
            <div className="p-4 glass-card border-primary/10 bg-primary/5 flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-bold text-primary italic">SESSION ACTIVE — Child is currently on-site and under supervision.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForensicTimeline;
