import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Inbox, Send, Search, Reply, Clock,
  CheckCheck, SquarePen, MessageSquare,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import DashboardShell from '@/components/dashboard/DashboardShell';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtTime = (d: string) => {
  const date = new Date(d);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

const initials = (fn?: string, ln?: string) =>
  `${fn?.[0] ?? ''}${ln?.[0] ?? ''}`.toUpperCase() || '?';

const displayName = (p?: { first_name?: string; last_name?: string; email?: string }) => {
  if (!p) return 'Admin';
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return name || p.email || 'Admin';
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile { id: string; email: string; first_name?: string; last_name?: string; role: string; }

interface Message {
  id: string; content: string; created_at: string; is_read: boolean;
  recipient_id: string; sender_id: string; subject: string; updated_at: string;
  sender?: { first_name?: string; last_name?: string; email?: string };
  recipient?: { first_name?: string; last_name?: string; email?: string };
}

// ── Message Row ───────────────────────────────────────────────────────────────

const MessageRow = ({
  message, isSelected, onClick, userId,
}: { message: Message; isSelected: boolean; onClick: () => void; userId?: string }) => {
  const isIncoming = message.recipient_id === userId;
  const person = isIncoming ? message.sender : message.recipient;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-border/40 transition-colors',
        isSelected ? 'bg-rose-500/8 border-l-2 border-l-rose-500' : 'hover:bg-muted/50',
        !message.is_read && isIncoming && !isSelected ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''
      )}
    >
      <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-[11px] font-bold text-rose-600 flex-shrink-0 mt-0.5">
        {initials(person?.first_name, person?.last_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('text-[13px] truncate leading-none', !message.is_read && isIncoming ? 'font-semibold' : 'font-medium')}>
            {isIncoming ? displayName(message.sender) : `To: ${displayName(message.recipient)}`}
          </p>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">{fmtTime(message.created_at)}</span>
        </div>
        <p className={cn('text-[12px] mt-0.5 truncate', !message.is_read && isIncoming ? 'text-foreground font-medium' : 'text-muted-foreground')}>
          {message.subject || '(no subject)'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{message.content}</p>
      </div>
      {!message.is_read && isIncoming && (
        <div className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0 mt-2" />
      )}
    </button>
  );
};

// ── Message Detail ────────────────────────────────────────────────────────────

const MessageDetail = ({
  message, userId, onMarkRead, onReply,
}: { message: Message; userId?: string; onMarkRead: (id: string) => void; onReply: (m: Message) => void }) => {
  const isIncoming = message.recipient_id === userId;
  const person = isIncoming ? message.sender : message.recipient;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border/50 flex-shrink-0">
        <h2 className="text-[15px] font-semibold text-foreground mb-3">
          {message.subject || '(no subject)'}
        </h2>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-[11px] font-bold text-rose-600">
              {initials(person?.first_name, person?.last_name)}
            </div>
            <div>
              <p className="text-[13px] font-medium leading-none">
                {isIncoming ? displayName(message.sender) : `To: ${displayName(message.recipient)}`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(message.created_at), "MMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!message.is_read && isIncoming && (
              <Button size="sm" variant="outline" className="h-7 px-3 text-[11px] gap-1" onClick={() => onMarkRead(message.id)}>
                <CheckCheck className="h-3 w-3" /> Mark read
              </Button>
            )}
            {isIncoming && (
              <Button size="sm" className="h-7 px-3 text-[11px] gap-1 bg-rose-500 hover:bg-rose-600" onClick={() => onReply(message)}>
                <Reply className="h-3 w-3" /> Reply
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

// ── Compose Dialog ────────────────────────────────────────────────────────────

const ComposeDialog = ({
  open, onOpenChange, recipients, initial, onSend, sending,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; recipients: UserProfile[];
  initial?: Partial<{ recipient_id: string; subject: string; content: string }>;
  onSend: (data: { recipient_id: string; subject: string; content: string }) => Promise<void>;
  sending: boolean;
}) => {
  const [form, setForm] = useState({ recipient_id: '', subject: '', content: '' });

  useEffect(() => {
    if (initial) setForm({ recipient_id: initial.recipient_id ?? '', subject: initial.subject ?? '', content: initial.content ?? '' });
  }, [initial, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSend(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border border-border/70">
        <DialogHeader className="px-6 py-5 border-b border-border/50 bg-muted/30">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <SquarePen className="h-4 w-4 text-rose-500" />
            New Message
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">To</Label>
            <Select value={form.recipient_id} onValueChange={(v) => setForm(f => ({ ...f, recipient_id: v }))}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select recipient…" /></SelectTrigger>
              <SelectContent>
                {recipients.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || r.email} ({r.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parent-subject" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Subject</Label>
            <Input id="parent-subject" className="h-9 text-[13px]" placeholder="Enter subject…" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parent-content" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Message</Label>
            <Textarea id="parent-content" className="text-[13px] resize-none" placeholder="Write your message…" rows={7} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Discard</Button>
            <Button type="submit" size="sm" disabled={sending || !form.recipient_id} className="gap-1.5 bg-rose-500 hover:bg-rose-600">
              <Send className="h-3.5 w-3.5" />
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const FamilyConnectPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [recipients, setRecipients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitial, setComposeInitial] = useState<any>(undefined);

  useEffect(() => {
    if (user) {
      Promise.all([fetchMessages(), fetchRecipients()]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user?.id) return;
    const { data: md, error } = await supabase
      .from('messages').select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error || !md?.length) { setMessages([]); return; }

    const ids = [...new Set([...md.map(m => m.sender_id), ...md.map(m => m.recipient_id).filter(Boolean)])];
    const { data: profiles } = await supabase.from('profiles').select('id,first_name,last_name').in('id', ids);
    const { data: authUsers } = await supabase.rpc('get_users_emails', { user_ids: ids });

    setMessages(md.map(m => ({
      ...m,
      sender: (() => { const p = profiles?.find(x => x.id === m.sender_id); const a = authUsers?.find(x => x.id === m.sender_id); return (p || a) ? { first_name: p?.first_name, last_name: p?.last_name, email: a?.email } : undefined; })(),
      recipient: (() => { const p = profiles?.find(x => x.id === m.recipient_id); const a = authUsers?.find(x => x.id === m.recipient_id); return (p || a) ? { first_name: p?.first_name, last_name: p?.last_name, email: a?.email } : undefined; })(),
    })));
  };

  const fetchRecipients = async () => {
    if (!user?.id) return;
    const { data: roles } = await supabase.from('user_roles').select('user_id,role').neq('user_id', user.id);
    if (!roles?.length) { setRecipients([]); return; }
    const ids = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id,first_name,last_name').in('id', ids);
    const { data: authUsers } = await supabase.rpc('get_users_emails', { user_ids: ids });
    setRecipients(roles.map(r => {
      const p = profiles?.find(x => x.id === r.user_id);
      const a = authUsers?.find(x => x.id === r.user_id);
      return { id: r.user_id, email: a?.email || '', first_name: p?.first_name, last_name: p?.last_name, role: r.role };
    }).filter(r => r.email));
  };

  const sendMsg = async (data: { recipient_id: string; subject: string; content: string }) => {
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({ sender_id: user!.id, ...data, is_read: false });
      if (error) throw error;
      toast({ title: 'Message sent!' });
      setComposeOpen(false);
      setComposeInitial(undefined);
      setTab('sent');
      fetchMessages();
    } catch {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id: string) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    setSelected(prev => prev?.id === id ? { ...prev, is_read: true } : prev);
  };

  const handleReply = (m: Message) => {
    setComposeInitial({
      recipient_id: m.sender_id,
      subject: m.subject?.startsWith('Re:') ? m.subject : `Re: ${m.subject || 'Message'}`,
      content: `\n\n— Original —\n${m.content}`,
    });
    setComposeOpen(true);
  };

  const q = search.toLowerCase();
  const filtered = messages.filter(m =>
    !q || m.subject?.toLowerCase().includes(q) || m.content?.toLowerCase().includes(q) ||
    displayName(m.sender).toLowerCase().includes(q)
  );
  const inbox = filtered.filter(m => m.recipient_id === user?.id);
  const sent = filtered.filter(m => m.sender_id === user?.id);
  const list = tab === 'inbox' ? inbox : sent;
  const unread = inbox.filter(m => !m.is_read).length;

  return (
    <AppLayout>
      <DashboardShell
        title="Messages"
        subtitle="Stay connected with the care team"
        action={
          <Button size="sm" onClick={() => { setComposeInitial(undefined); setComposeOpen(true); }} className="gap-2 bg-rose-500 hover:bg-rose-600">
            <SquarePen className="h-3.5 w-3.5" />
            New Message
          </Button>
        }
      >
        <div className="bg-card border border-border/70 rounded-xl overflow-hidden flex h-[calc(100vh-200px)] min-h-[520px]">

          {/* ── Column 1: Nav ─────────────────────────────── */}
          <div className="w-44 flex-shrink-0 border-r border-border/50 flex flex-col bg-muted/30">
            <div className="p-3 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="h-8 pl-8 text-[12px] bg-background border-border/50" />
              </div>
            </div>
            <nav className="p-2 space-y-0.5">
              {([
                { id: 'inbox' as const, label: 'Inbox', icon: Inbox, count: unread > 0 ? unread : null },
                { id: 'sent' as const, label: 'Sent', icon: Send, count: null },
              ]).map(({ id, label, icon: Icon, count }) => (
                <button key={id} onClick={() => { setTab(id); setSelected(null); }}
                  className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                    tab === id ? 'bg-rose-500/10 text-rose-600' : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                  )}>
                  <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span>
                  {count != null && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">{count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Column 2: List ────────────────────────────── */}
          <div className={cn('flex flex-col border-r border-border/50 overflow-y-auto custom-scrollbar', selected ? 'w-64 flex-shrink-0' : 'flex-1')}>
            <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between flex-shrink-0">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{tab === 'inbox' ? 'Inbox' : 'Sent'}</p>
              <span className="text-[11px] text-muted-foreground">{list.length}</span>
            </div>
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              </div>
            ) : list.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-12">
                <MessageSquare className="h-8 w-8 opacity-20" />
                <p className="text-[13px] font-medium">No messages here</p>
              </div>
            ) : (
              list.map(msg => (
                <MessageRow key={msg.id} message={msg} isSelected={selected?.id === msg.id} userId={user?.id}
                  onClick={() => { setSelected(msg); if (!msg.is_read && msg.recipient_id === user?.id) markRead(msg.id); }} />
              ))
            )}
          </div>

          {/* ── Column 3: Detail ──────────────────────────── */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {selected ? (
              <MessageDetail message={selected} userId={user?.id} onMarkRead={markRead} onReply={handleReply} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <Inbox className="h-5 w-5 opacity-40" />
                </div>
                <p className="text-[13px] font-medium">Select a message to read</p>
              </div>
            )}
          </div>
        </div>

        <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} recipients={recipients} initial={composeInitial} onSend={sendMsg} sending={sending} />
      </DashboardShell>
    </AppLayout>
  );
};

export default FamilyConnectPage;
