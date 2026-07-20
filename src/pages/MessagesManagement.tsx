import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Inbox, Send, Bell, Search, Reply, Megaphone,
  Clock, CheckCheck, CircleDot, SquarePen
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import DashboardShell from '@/components/dashboard/DashboardShell';

// ── helpers ──────────────────────────────────────────────────────────────────

const formatMsgTime = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

const avatarInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

// ── Compose Dialog ────────────────────────────────────────────────────────────

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: { subject: string; content: string; recipient_type: string };
  onSend: (data: { subject: string; content: string; recipient_role: string }) => Promise<void>;
}

const ComposeDialog = ({ open, onOpenChange, initial, onSend }: ComposeDialogProps) => {
  const [form, setForm] = useState(
    initial ?? { subject: '', content: '', recipient_type: 'all' }
  );
  const [loading, setLoading] = useState(false);

  // sync if initial changes (e.g. reply)
  React.useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSend({
        subject: form.subject || 'No Subject',
        content: form.content,
        recipient_role: form.recipient_type !== 'all' ? form.recipient_type : 'all',
      });
      onOpenChange(false);
      setForm({ subject: '', content: '', recipient_type: 'all' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border border-border/70">
        <DialogHeader className="px-6 py-5 border-b border-border/50 bg-muted/30">
          <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
            <SquarePen className="h-4 w-4 text-primary" />
            New Broadcast
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                To
              </Label>
              <Select
                value={form.recipient_type}
                onValueChange={(v) => setForm((f) => ({ ...f, recipient_type: v }))}
              >
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="parents">Parents only</SelectItem>
                  <SelectItem value="staff">Staff &amp; Admins</SelectItem>
                  <SelectItem value="teachers">Teachers only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compose-subject" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Subject
              </Label>
              <Input
                id="compose-subject"
                placeholder="Enter subject…"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="h-9 text-[13px]"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="compose-content" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Message
            </Label>
            <Textarea
              id="compose-content"
              placeholder="Write your message…"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={7}
              className="text-[13px] resize-none"
              required
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Discard
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {loading ? 'Sending…' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── Message Row ───────────────────────────────────────────────────────────────

const MessageRow = ({
  message,
  isSelected,
  onClick,
}: {
  message: any;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const senderName = message.sender
    ? `${message.sender.first_name ?? ''} ${message.sender.last_name ?? ''}`.trim()
    : 'System';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-border/40 transition-colors',
        isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'hover:bg-muted/50',
        !message.is_read && !isSelected && 'bg-blue-50/60 dark:bg-blue-950/20'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5',
        message.is_broadcast ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
      )}>
        {message.is_broadcast
          ? <Bell className="h-3.5 w-3.5" />
          : avatarInitials(message.sender?.first_name, message.sender?.last_name)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn(
            'text-[13px] truncate leading-none',
            !message.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground'
          )}>
            {senderName || (message.is_broadcast ? 'Broadcast' : 'Admin')}
          </p>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">
            {formatMsgTime(message.created_at)}
          </span>
        </div>
        <p className={cn(
          'text-[12px] mt-0.5 truncate',
          !message.is_read ? 'text-foreground font-medium' : 'text-muted-foreground'
        )}>
          {message.subject || '(no subject)'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {message.content}
        </p>
      </div>

      {/* Unread dot */}
      {!message.is_read && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </button>
  );
};

// ── Message Detail Panel ──────────────────────────────────────────────────────

const MessageDetail = ({
  message,
  onMarkRead,
  onReply,
}: {
  message: any;
  onMarkRead: (m: any) => void;
  onReply: (m: any) => void;
}) => {
  const senderName = message.sender
    ? `${message.sender.first_name ?? ''} ${message.sender.last_name ?? ''}`.trim()
    : 'System';

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div className="px-6 py-4 border-b border-border/50 flex-shrink-0">
        <h2 className="text-[15px] font-semibold text-foreground mb-3">
          {message.subject || '(no subject)'}
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground">
              {avatarInitials(message.sender?.first_name, message.sender?.last_name)}
            </div>
            <div>
              <p className="text-[13px] font-medium leading-none">{senderName || 'Admin'}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(message.created_at), "MMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!message.is_read && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-[11px] gap-1"
                onClick={() => onMarkRead(message)}
              >
                <CheckCheck className="h-3 w-3" />
                Mark read
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 px-3 text-[11px] gap-1"
              onClick={() => onReply(message)}
            >
              <Reply className="h-3 w-3" />
              Reply
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {message.is_broadcast && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-700/30">
            <Bell className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              Broadcast — sent to {message.recipient_role || 'all users'}
            </p>
          </div>
        )}
        <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
};

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'inbox' | 'sent' | 'broadcast';

const NAV_TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'broadcast', label: 'Broadcasts', icon: Bell },
];

// ── Main Component ────────────────────────────────────────────────────────────

const MessagesManagement = () => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, markAsRead } = useMessages();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitial, setComposeInitial] = useState<any>(undefined);

  const handleSend = async (data: any) => {
    try {
      await sendMessage(data);
    } catch {
      // handled in hook
    }
  };

  const handleReply = (message: any) => {
    setComposeInitial({
      subject: message.subject?.startsWith('Re:') ? message.subject : `Re: ${message.subject || 'Message'}`,
      content: `\n\n— Original —\n${message.content}`,
      recipient_type: 'all',
    });
    setComposeOpen(true);
  };

  const handleMarkRead = async (message: any) => {
    await markAsRead(message);
    setSelected((prev: any) => prev?.id === message.id ? { ...prev, is_read: true } : prev);
  };

  const q = search.toLowerCase();
  const filtered = messages.filter((m: any) =>
    !q ||
    m.subject?.toLowerCase().includes(q) ||
    m.content?.toLowerCase().includes(q) ||
    m.sender?.first_name?.toLowerCase().includes(q) ||
    m.sender?.last_name?.toLowerCase().includes(q)
  );

  const inbox = filtered.filter((m: any) =>
    m.recipient_id === user?.id || (m.recipient_role && m.sender_id !== user?.id)
  );
  const sent = filtered.filter((m: any) => m.sender_id === user?.id);
  const broadcasts = filtered.filter((m: any) => m.is_broadcast);

  const lists: Record<Tab, any[]> = { inbox, sent, broadcast: broadcasts };
  const currentList = lists[activeTab];
  const unreadCount = inbox.filter((m: any) => !m.is_read).length;

  const tabCounts: Record<Tab, number | null> = {
    inbox: unreadCount > 0 ? unreadCount : null,
    sent: null,
    broadcast: null,
  };

  return (
    <DashboardShell
      title="Messages"
      subtitle="Communication hub"
      action={
        <Button
          size="sm"
          onClick={() => { setComposeInitial(undefined); setComposeOpen(true); }}
          className="gap-2"
        >
          <SquarePen className="h-3.5 w-3.5" />
          New Message
        </Button>
      }
    >
      {/* 3-column inbox layout */}
      <div className="bg-card border border-border/70 rounded-xl overflow-hidden flex h-[calc(100vh-200px)] min-h-[560px]">

        {/* ── Column 1: Tabs + Search ────────────────────────────── */}
        <div className="w-48 flex-shrink-0 border-r border-border/50 flex flex-col bg-muted/30">
          <div className="p-3 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-[12px] bg-background border-border/50"
              />
            </div>
          </div>
          <nav className="p-2 space-y-0.5">
            {NAV_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSelected(null); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  activeTab === id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
                {tabCounts[id] != null && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                    {tabCounts[id]}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Quick broadcast templates (shown in broadcasts tab or sidebar) */}
          <div className="mt-auto p-3 border-t border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Send</p>
            {[
              { label: 'Service update', type: 'all' },
              { label: 'Emergency alert', type: 'all' },
              { label: 'Event reminder', type: 'parents' },
            ].map((tmpl) => (
              <button
                key={tmpl.label}
                onClick={() => {
                  setComposeInitial({ subject: tmpl.label, content: '', recipient_type: tmpl.type });
                  setComposeOpen(true);
                }}
                className="w-full text-left px-2 py-1.5 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Column 2: Message list ─────────────────────────────── */}
        <div className={cn(
          'flex flex-col border-r border-border/50 overflow-y-auto custom-scrollbar',
          selected ? 'w-72 flex-shrink-0' : 'flex-1'
        )}>
          {/* List header */}
          <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between flex-shrink-0">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
              {activeTab === 'inbox' ? 'Inbox' : activeTab === 'sent' ? 'Sent' : 'Broadcasts'}
            </p>
            <span className="text-[11px] text-muted-foreground">{currentList.length} items</span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-[13px]">Loading…</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-12">
              <Inbox className="h-8 w-8 opacity-20" />
              <p className="text-[13px] font-medium">Nothing here yet</p>
              {activeTab === 'inbox' && (
                <p className="text-[11px]">Messages you receive will appear here</p>
              )}
            </div>
          ) : (
            currentList.map((msg: any) => (
              <MessageRow
                key={msg.id}
                message={msg}
                isSelected={selected?.id === msg.id}
                onClick={() => {
                  setSelected(msg);
                  if (!msg.is_read) markAsRead(msg);
                }}
              />
            ))
          )}
        </div>

        {/* ── Column 3: Detail pane ─────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {selected ? (
            <MessageDetail
              message={selected}
              onMarkRead={handleMarkRead}
              onReply={handleReply}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Inbox className="h-5 w-5 opacity-40" />
              </div>
              <p className="text-[13px] font-medium">Select a message to read</p>
              <p className="text-[11px]">or compose a new one</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose dialog */}
      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        initial={composeInitial}
        onSend={handleSend}
      />
    </DashboardShell>
  );
};

export default MessagesManagement;
