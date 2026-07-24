import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, Inbox, BookOpen, Terminal, Settings as SettingsIcon,
  Sun, Moon, Search, Bell, ChevronLeft, Send, AlertTriangle, CheckCircle2,
  Clock, User, ShieldAlert, ArrowLeft, RefreshCw, Volume2, VolumeX,
  Wifi, HardDrive, Mail, Printer, KeyRound, Bug, Laptop, Monitor as MonitorIcon,
  FileText, Zap, ChevronRight, X, StickyNote, Wrench, TrendingUp, Users, Timer
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  STATIC CONFIG                                                          */
/* ---------------------------------------------------------------------- */

const PRIORITY_META = {
  Critical: { hours: 2, order: 0 },
  High: { hours: 4, order: 1 },
  Medium: { hours: 24, order: 2 },
  Low: { hours: 72, order: 3 },
};

const STATUS_LIST = ["New", "Open", "Pending", "Resolved", "Closed"];

const CATEGORY_ICON = {
  Network: Wifi, "Account Access": KeyRound, Hardware: HardDrive,
  Software: Laptop, Security: ShieldAlert, Permissions: FileText,
  "Software Request": Laptop, Onboarding: Users, Email: Mail, Print: Printer,
};

const MACROS = [
  { label: "Acknowledge & investigate", text: "Thanks for reaching out — I've logged your ticket and I'm looking into this now. I'll update you shortly." },
  { label: "Request more info", text: "Could you send a screenshot of the error, along with the exact time it happened? That'll help me narrow down the cause." },
  { label: "Password reset sent", text: "I've issued a temporary password reset. Check your email for a reset link — it expires in 15 minutes." },
  { label: "Escalating to Tier 2", text: "This needs a closer look from our Tier 2 team, so I'm escalating your ticket now. You shouldn't need to do anything further." },
  { label: "Resolved — confirming", text: "This should be fixed on our end now. Can you confirm everything's working before I close the ticket?" },
  { label: "Closing — no response", text: "We haven't heard back in a while, so I'm closing this ticket. Reply any time and I'll reopen it." },
];

const KB_ARTICLES = [
  { id: "kb-1", category: "Account Access", title: "Resetting a locked Active Directory account", snippet: "Steps to unlock and reset credentials for a locked AD account, including self-service options.", body: "1. Confirm the user's identity via employee ID.\n2. Open ADUC, locate the account, and clear the lockout flag.\n3. Trigger a temporary password and set 'change at next logon'.\n4. Advise the user MFA may need re-registration if the lockout followed a device change." },
  { id: "kb-2", category: "Network", title: "VPN failures after a Windows update", snippet: "Common causes of VPN client breakage post-update and the fix order to try.", body: "1. Check the VPN client version against the latest known-good build.\n2. Reinstall the TAP/WAN adapter if it's missing from Device Manager.\n3. Clear cached credentials and re-authenticate.\n4. If split-tunnel routes are gone, reapply the connection profile." },
  { id: "kb-3", category: "Security", title: "Identifying phishing emails: checklist", snippet: "Fast triage checklist for a reported suspicious email.", body: "1. Check the sender's actual address, not just the display name.\n2. Hover links — do they match the claimed destination?\n3. Look for urgency/threat language and unexpected attachments.\n4. If confirmed malicious: quarantine org-wide, block sender domain, notify affected users." },
  { id: "kb-4", category: "Hardware", title: "Printer error code reference", snippet: "Quick-reference for common networked printer error codes.", body: "Error 79: firmware fault — power cycle, if it recurs reflash firmware.\nError 49: internal processing error — clear queue, restart spooler.\nOffline with valid IP: check subnet match and port 9100 reachability." },
  { id: "kb-5", category: "Software", title: "Outlook stuck on 'Trying to connect'", snippet: "Resolution path for Outlook connectivity stalls.", body: "1. Verify Exchange/365 service health.\n2. Run Outlook in Safe Mode to rule out add-ins.\n3. Recreate the Outlook profile if OST repair fails.\n4. Confirm the autodiscover DNS record resolves correctly." },
  { id: "kb-6", category: "Onboarding", title: "Standard new-hire setup checklist", snippet: "Equipment and access checklist for day-one readiness.", body: "1. Provision AD + email account 48h before start date.\n2. Assign hardware asset tag and image standard build.\n3. Add to department security groups and shared drives.\n4. Schedule a 15-minute welcome/orientation call." },
  { id: "kb-7", category: "Security", title: "Malware quick-response procedure", snippet: "First actions when malware is suspected on an endpoint.", body: "1. Isolate the device from the network immediately (don't shut down — preserve memory).\n2. Run an on-demand AV/EDR scan.\n3. Check for lateral movement indicators in the SIEM.\n4. Escalate to security team if credentials may be compromised." },
  { id: "kb-8", category: "Software Request", title: "Requesting a new software license", snippet: "Procurement workflow for paid software requests.", body: "1. Confirm the request has manager approval attached.\n2. Check for an existing volume license before buying new seats.\n3. Submit to procurement with cost center code.\n4. Deploy via the software center once the license key is issued." },
];

function minutesAgo(m) { return new Date(Date.now() - m * 60000); }

function seedTickets() {
  const raw = [
    { num: 1042, subject: "Cannot connect to VPN after Windows update", requester: "Jordan Reyes", dept: "Sales", priority: "Critical", status: "Open", category: "Network", created: 35, host: "SLS-JR-0447", os: "Windows 11 23H2", ip: "10.44.12.87", desc: "My VPN client won't connect since the update installed last night. I get 'Error 809' every time I try to log in and I have a client call in an hour.",
      thread: [{ sender: "customer", text: "My VPN client won't connect since last night's update. Getting Error 809 every time. I have a client call in an hour — please help!" }] },
    { num: 1041, subject: "Password reset — locked out of AD account", requester: "Priya Nandakumar", dept: "Finance", priority: "High", status: "New", category: "Account Access", created: 12, host: "FIN-PN-1120", os: "Windows 11", ip: "10.44.8.22", desc: "Entered my password wrong too many times and now I'm completely locked out, can't access anything.",
      thread: [{ sender: "customer", text: "I'm locked out of my account, I think I mistyped my password a few times. Can someone reset it? I need to close month-end today." }] },
    { num: 1039, subject: "Printer HP-3F offline, error 79", requester: "Marcus Webb", dept: "Operations", priority: "Medium", status: "Open", category: "Hardware", created: 95, host: "OPS-MW-0212", os: "Windows 10", ip: "10.44.20.5", desc: "The 3rd floor printer is showing offline and error 79 on its display panel.",
      thread: [{ sender: "customer", text: "The printer on 3rd floor is throwing 'Error 79' on its screen and shows offline for everyone on the floor." }] },
    { num: 1037, subject: "Outlook not syncing, stuck 'Trying to connect'", requester: "Elena Cho", dept: "Marketing", priority: "Medium", status: "Pending", category: "Software", created: 260, host: "MKT-EC-0391", os: "Windows 11", ip: "10.44.15.61", desc: "Outlook has been stuck trying to connect since this morning, no new mail coming in.",
      thread: [
        { sender: "customer", text: "Outlook's been stuck on 'Trying to connect...' since 9am, I'm not getting any new mail." },
        { sender: "agent", text: "Thanks Elena — can you try opening Outlook in Safe Mode (hold Ctrl while launching) and let me know if it connects?" },
        { sender: "customer", text: "Tried that, still stuck. Waiting to hear back." },
      ] },
    { num: 1035, subject: "Suspicious email reported — possible phishing", requester: "Dan Ferris", dept: "Legal", priority: "Critical", status: "New", category: "Security", created: 6, host: "LGL-DF-0087", os: "Windows 11", ip: "10.44.3.14", desc: "Received an email claiming to be from IT asking to verify credentials via a link, looks suspicious.",
      thread: [{ sender: "customer", text: "Got an email 'from IT' asking me to verify my password through a link. Feels off, reporting it before I click anything." }] },
    { num: 1033, subject: "Laptop won't boot past BIOS screen", requester: "Aisha Bello", dept: "Engineering", priority: "High", status: "Open", category: "Hardware", created: 140, host: "ENG-AB-0509", os: "Windows 11", ip: "10.44.30.9", desc: "Laptop hangs on the manufacturer logo screen and never reaches the login page.",
      thread: [{ sender: "customer", text: "My laptop just hangs on the boot logo, never gets to the login screen. Restarted it three times already." }] },
    { num: 1030, subject: "MFA app not generating codes after phone swap", requester: "Tom Okafor", dept: "HR", priority: "High", status: "New", category: "Account Access", created: 20, host: "HR-TO-0144", os: "macOS", ip: "10.44.9.33", desc: "Got a new phone, MFA authenticator wasn't migrated, now can't log into anything.",
      thread: [{ sender: "customer", text: "I switched phones over the weekend and forgot to migrate my authenticator app. Now I can't get past MFA on anything." }] },
    { num: 1028, subject: "Request: Adobe Acrobat Pro license", requester: "Grace Lin", dept: "Design", priority: "Low", status: "Pending", category: "Software Request", created: 900, host: "DSN-GL-0261", os: "macOS", ip: "10.44.18.4", desc: "Need Acrobat Pro for editing client contract PDFs, manager approval attached.",
      thread: [{ sender: "customer", text: "Requesting an Acrobat Pro license for contract editing, my manager already approved it over email." }] },
    { num: 1025, subject: "Shared drive access denied — \\\\FS01\\Finance", requester: "Sam Whitfield", dept: "Finance", priority: "Medium", status: "Open", category: "Permissions", created: 180, host: "FIN-SW-0733", os: "Windows 10", ip: "10.44.8.40", desc: "Getting 'Access Denied' trying to open the Finance shared drive that used to work fine.",
      thread: [{ sender: "customer", text: "I'm getting 'Access Denied' on the Finance shared drive. It worked fine last week, nothing's changed on my end." }] },
    { num: 1022, subject: "Laptop running extremely slow, possible malware", requester: "Noah Kim", dept: "Support", priority: "Critical", status: "Open", category: "Security", created: 50, host: "SUP-NK-0199", os: "Windows 11", ip: "10.44.5.71", desc: "Fan constantly running, laptop very slow, a browser toolbar appeared that I didn't install.",
      thread: [{ sender: "customer", text: "My laptop's been crawling since yesterday, fan running full blast, and there's a search toolbar in my browser I never installed." }] },
    { num: 1019, subject: "External monitor no signal via dock", requester: "Lily Chen", dept: "Engineering", priority: "Low", status: "Resolved", category: "Hardware", created: 1400, host: "ENG-LC-0876", os: "Windows 11", ip: "10.44.30.22", desc: "External monitor showed 'No Signal' when docked, resolved by firmware update on the dock.",
      thread: [
        { sender: "customer", text: "External monitor says 'No Signal' whenever I dock my laptop." },
        { sender: "agent", text: "Can you check the dock's firmware version in the vendor utility? There's a known display bug pre-2.14." },
        { sender: "customer", text: "Updated it, working now, thank you!" },
        { sender: "agent", text: "Great, glad that fixed it. Marking this resolved — reply if it comes back." },
      ] },
    { num: 1015, subject: "New hire onboarding — account + equipment", requester: "Ravi Desai", dept: "HR", priority: "Medium", status: "Closed", category: "Onboarding", created: 4200, host: "HR-RD-0900", os: "Windows 11", ip: "10.44.9.5", desc: "Standard new-hire setup for a start date of this week, completed and closed.",
      thread: [
        { sender: "customer", text: "New hire starting Monday, needs full account + hardware setup." },
        { sender: "agent", text: "All set — account provisioned, laptop imaged and shipped, added to HR security group." },
      ] },
  ];
  return raw.map((t) => {
    const createdAt = minutesAgo(t.created);
    const dueAt = new Date(createdAt.getTime() + PRIORITY_META[t.priority].hours * 3600000);
    return {
      id: `TCK-${t.num}`,
      subject: t.subject,
      requester: t.requester,
      dept: t.dept,
      priority: t.priority,
      status: t.status,
      category: t.category,
      createdAt: createdAt.toISOString(),
      dueAt: dueAt.toISOString(),
      device: { host: t.host, os: t.os, ip: t.ip },
      description: t.desc,
      assigned: t.status === "New" ? "Unassigned" : "You",
      thread: t.thread.map((m, i) => ({ id: `${t.num}-${i}`, sender: m.sender, text: m.text, time: new Date(createdAt.getTime() + i * 4 * 60000).toISOString() })),
      notes: [],
    };
  });
}

const FALLBACK_REPLIES = [
  "Okay, trying that now.",
  "Still not working on my end, sorry.",
  "Oh — that actually seems to have helped, let me double check.",
  "Got it, one second.",
  "Yes, that's exactly what's happening.",
  "Thanks, I'll try that and let you know.",
];

/* ---------------------------------------------------------------------- */
/*  THEME TOKENS                                                          */
/* ---------------------------------------------------------------------- */

function theme(isDark) {
  return {
    appBg: isDark ? "bg-slate-950" : "bg-slate-100",
    panel: isDark ? "bg-slate-900" : "bg-white",
    panelAlt: isDark ? "bg-slate-900/60" : "bg-slate-50",
    border: isDark ? "border-slate-800" : "border-slate-200",
    text: isDark ? "text-slate-100" : "text-slate-900",
    textMuted: isDark ? "text-slate-400" : "text-slate-500",
    textFaint: isDark ? "text-slate-500" : "text-slate-400",
    hover: isDark ? "hover:bg-slate-800" : "hover:bg-slate-100",
    active: isDark ? "bg-slate-800" : "bg-slate-200",
    accent: "text-cyan-500",
    accentBg: isDark ? "bg-cyan-500" : "bg-cyan-600",
    input: isDark ? "bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400",
    ring: isDark ? "focus:ring-cyan-500" : "focus:ring-cyan-600",
  };
}

const PRIORITY_COLORS = {
  Critical: { dot: "bg-rose-500", text: "text-rose-500", bg: "bg-rose-500/10", ring: "ring-rose-500/30" },
  High: { dot: "bg-amber-500", text: "text-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/30" },
  Medium: { dot: "bg-sky-500", text: "text-sky-500", bg: "bg-sky-500/10", ring: "ring-sky-500/30" },
  Low: { dot: "bg-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
};

const STATUS_COLORS = {
  New: { text: "text-cyan-500", bg: "bg-cyan-500/10" },
  Open: { text: "text-amber-500", bg: "bg-amber-500/10" },
  Pending: { text: "text-violet-500", bg: "bg-violet-500/10" },
  Resolved: { text: "text-emerald-500", bg: "bg-emerald-500/10" },
  Closed: { text: "text-slate-400", bg: "bg-slate-500/10" },
};

/* ---------------------------------------------------------------------- */
/*  SMALL UI PARTS                                                        */
/* ---------------------------------------------------------------------- */

function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>{children}</span>;
}

function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority];
  return <Badge className={`${c.bg} ${c.text}`}><span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{priority}</Badge>;
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status];
  return <Badge className={`${c.bg} ${c.text}`}>{status}</Badge>;
}

function SlaTimer({ ticket, now, t, warnPct }) {
  if (ticket.status === "Resolved" || ticket.status === "Closed") {
    return <span className={`text-xs font-mono ${t.textFaint}`}>SLA closed</span>;
  }
  const due = new Date(ticket.dueAt).getTime();
  const created = new Date(ticket.createdAt).getTime();
  const total = due - created;
  const remaining = due - now;
  const pctElapsed = Math.min(100, Math.max(0, ((now - created) / total) * 100));
  const breached = remaining <= 0;
  const warning = !breached && pctElapsed >= warnPct;
  const abs = Math.abs(remaining);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const label = `${h > 0 ? h + "h " : ""}${m}m ${s}s`;
  const color = breached ? "text-rose-500" : warning ? "text-amber-500" : "text-emerald-500";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono ${color}`}>
      <Timer size={12} /> {breached ? `BREACHED ${label} ago` : `${label} left`}
    </span>
  );
}

function timeAgo(iso, now) {
  const diff = now - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ---------------------------------------------------------------------- */
/*  MAIN APP                                                               */
/* ---------------------------------------------------------------------- */

export default function HelpdeskSimulator() {
  const [ready, setReady] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [settings, setSettings] = useState({
    theme: "dark", agentName: "Agent", agentStatus: "Available",
    soundEnabled: true, autoRefresh: false, slaWarnPct: 75,
    density: "comfortable", fontSize: "medium",
  });
  const [screen, setScreen] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [queueFilter, setQueueFilter] = useState("All");
  const [queueSearch, setQueueSearch] = useState("");
  const [kbQuery, setKbQuery] = useState("");
  const [openKb, setOpenKb] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [detailTab, setDetailTab] = useState("conversation");
  const [noteText, setNoteText] = useState("");
  const [termHistory, setTermHistory] = useState([{ type: "out", text: "RELAY diagnostics terminal — type 'help' for commands." }]);
  const [termInput, setTermInput] = useState("");
  const [termTicketId, setTermTicketId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [now, setNow] = useState(Date.now());
  const termEndRef = useRef(null);
  const chatEndRef = useRef(null);

  const isDark = settings.theme === "dark";
  const t = theme(isDark);
  const density = settings.density === "compact" ? "py-2" : "py-3";
  const fontSizeClass = settings.fontSize === "small" ? "text-[13px]" : settings.fontSize === "large" ? "text-[16px]" : "text-[14px]";

  /* ---------- persistence ---------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("relay-helpdesk-state", false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setTickets(parsed.tickets && parsed.tickets.length ? parsed.tickets : seedTickets());
          setSettings((s) => ({ ...s, ...parsed.settings }));
        } else {
          setTickets(seedTickets());
        }
      } catch (e) {
        setTickets(seedTickets());
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const save = async () => {
      try {
        await window.storage.set("relay-helpdesk-state", JSON.stringify({ tickets, settings }), false);
      } catch (e) { /* non-fatal */ }
    };
    save();
  }, [tickets, settings, ready]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!settings.autoRefresh) return;
    const id = setInterval(() => pushToast("Queue refreshed", "info"), 30000);
    return () => clearInterval(id);
  }, [settings.autoRefresh]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedId, tickets, aiTyping, detailTab]);
  useEffect(() => { termEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [termHistory]);

  function pushToast(msg, kind = "info") {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, msg, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3200);
  }

  const selected = tickets.find((tk) => tk.id === selectedId) || null;

  /* ---------- derived metrics ---------- */
  const metrics = useMemo(() => {
    const byStatus = {};
    STATUS_LIST.forEach((s) => (byStatus[s] = 0));
    let breached = 0;
    tickets.forEach((tk) => {
      byStatus[tk.status] = (byStatus[tk.status] || 0) + 1;
      if (tk.status !== "Resolved" && tk.status !== "Closed" && new Date(tk.dueAt).getTime() < now) breached++;
    });
    const byCategory = {};
    tickets.forEach((tk) => (byCategory[tk.category] = (byCategory[tk.category] || 0) + 1));
    const open = tickets.filter((tk) => tk.status !== "Resolved" && tk.status !== "Closed").length;
    return { byStatus, breached, byCategory, open, total: tickets.length };
  }, [tickets, now]);

  /* ---------- ticket actions ---------- */
  function updateTicket(id, patch) {
    setTickets((ts) => ts.map((tk) => (tk.id === id ? { ...tk, ...patch } : tk)));
  }

  function changeStatus(id, status) {
    updateTicket(id, { status });
    pushToast(`${id} marked ${status}`, "success");
  }

  function changePriority(id, priority) {
    const tk = tickets.find((x) => x.id === id);
    const created = new Date(tk.createdAt).getTime();
    const dueAt = new Date(created + PRIORITY_META[priority].hours * 3600000).toISOString();
    updateTicket(id, { priority, dueAt });
    pushToast(`${id} priority set to ${priority}`, "success");
  }

  function addNote(id) {
    if (!noteText.trim()) return;
    setTickets((ts) => ts.map((tk) => (tk.id === id ? { ...tk, notes: [...tk.notes, { id: Math.random().toString(36).slice(2), text: noteText, time: new Date().toISOString() }] } : tk)));
    setNoteText("");
  }

  async function sendReply(id) {
    if (!replyText.trim()) return;
    const text = replyText;
    setReplyText("");
    const agentMsg = { id: Math.random().toString(36).slice(2), sender: "agent", text, time: new Date().toISOString() };
    setTickets((ts) => ts.map((tk) => (tk.id === id ? { ...tk, thread: [...tk.thread, agentMsg], status: tk.status === "New" ? "Open" : tk.status } : tk)));
    if (settings.soundEnabled) { /* sound cue placeholder */ }
    setAiTyping(true);
    const tk = tickets.find((x) => x.id === id);
    try {
      const systemPrompt = `You are role-playing as ${tk.requester}, a ${tk.dept} department employee in a corporate IT helpdesk TRAINING SIMULATION. Your reported issue: "${tk.description}" Stay fully in character as a realistic, moderately non-technical employee — a little frustrated or relieved depending on progress, natural everyday language, 1-3 short sentences. Never break character, never mention this is a simulation or that you are an AI.`;
      const history = [...tk.thread, agentMsg].map((m) => ({ role: m.sender === "customer" ? "assistant" : "user", content: m.text }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 200, system: systemPrompt, messages: history }),
      });
      const data = await res.json();
      const replyBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      const custText = replyBlocks || FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
      const custMsg = { id: Math.random().toString(36).slice(2), sender: "customer", text: custText, time: new Date().toISOString() };
      setTickets((ts) => ts.map((x) => (x.id === id ? { ...x, thread: [...x.thread, custMsg] } : x)));
    } catch (e) {
      const custMsg = { id: Math.random().toString(36).slice(2), sender: "customer", text: FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)], time: new Date().toISOString() };
      setTickets((ts) => ts.map((x) => (x.id === id ? { ...x, thread: [...x.thread, custMsg] } : x)));
    } finally {
      setAiTyping(false);
    }
  }

  /* ---------- diagnostics terminal ---------- */
  function runCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    const device = termTicketId ? tickets.find((tk) => tk.id === termTicketId)?.device : null;
    const host = device?.host || "WKS-GENERIC-0001";
    const ip = device?.ip || "10.44.1.100";
    const [base, ...args] = cmd.split(" ");
    let out = [];
    switch (base.toLowerCase()) {
      case "help":
        out = ["Available: ping <host>, ipconfig, nslookup <host>, tracert <host>, systeminfo, netstat, whoami, clear"];
        break;
      case "ping": {
        const target = args[0] || "8.8.8.8";
        out = [`Pinging ${target} with 32 bytes of data:`];
        for (let i = 0; i < 4; i++) out.push(`Reply from ${target}: bytes=32 time=${(8 + Math.random() * 30).toFixed(0)}ms TTL=118`);
        out.push(`Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`);
        break;
      }
      case "ipconfig":
      case "ifconfig":
        out = [`Host: ${host}`, `IPv4 Address: ${ip}`, `Subnet Mask: 255.255.255.0`, `Default Gateway: 10.44.1.1`, `DNS Servers: 10.44.0.10, 10.44.0.11`];
        break;
      case "nslookup": {
        const target = args[0] || "internal.corp.local";
        out = [`Server: dns01.corp.local`, `Address: 10.44.0.10`, ``, `Non-authoritative answer:`, `Name: ${target}`, `Address: 10.44.${Math.floor(Math.random() * 50)}.${Math.floor(Math.random() * 250)}`];
        break;
      }
      case "tracert":
      case "traceroute": {
        const target = args[0] || "internal.corp.local";
        out = [`Tracing route to ${target}:`];
        for (let i = 1; i <= 5; i++) out.push(`  ${i}  ${(2 + i * 3).toFixed(0)} ms  10.44.${i}.1`);
        out.push("Trace complete.");
        break;
      }
      case "systeminfo":
        out = [`Host Name: ${host}`, `OS: ${device?.os || "Windows 11 23H2"}`, `System Boot Time: ${new Date(now - 3600000 * 5).toLocaleString()}`, `Total Physical Memory: 16,384 MB`, `Available Physical Memory: ${(2 + Math.random() * 4).toFixed(1)} GB`];
        break;
      case "netstat":
        out = ["Proto  Local Address        Foreign Address       State", "TCP    " + ip + ":51422      13.107.42.14:443      ESTABLISHED", "TCP    " + ip + ":51500      10.44.0.20:445        ESTABLISHED"];
        break;
      case "whoami":
        out = [`corp\\${(device?.host || "user").toLowerCase()}`];
        break;
      case "clear":
        setTermHistory([{ type: "out", text: "RELAY diagnostics terminal — type 'help' for commands." }]);
        return;
      default:
        out = [`'${base}' is not recognized. Type 'help' for available commands.`];
    }
    setTermHistory((h) => [...h, { type: "in", text: cmd }, ...out.map((line) => ({ type: "out", text: line }))]);
  }

  /* ---------- filtered queue ---------- */
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((tk) => queueFilter === "All" || tk.status === queueFilter)
      .filter((tk) => {
        const q = queueSearch.toLowerCase();
        if (!q) return true;
        return tk.subject.toLowerCase().includes(q) || tk.requester.toLowerCase().includes(q) || tk.id.toLowerCase().includes(q);
      })
      .sort((a, b) => PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order || new Date(a.dueAt) - new Date(b.dueAt));
  }, [tickets, queueFilter, queueSearch]);

  const filteredKb = useMemo(() => {
    const q = kbQuery.toLowerCase();
    if (!q) return KB_ARTICLES;
    return KB_ARTICLES.filter((a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.snippet.toLowerCase().includes(q));
  }, [kbQuery]);

  async function resetSimulation() {
    const fresh = seedTickets();
    setTickets(fresh);
    setSelectedId(null);
    try { await window.storage.set("relay-helpdesk-state", JSON.stringify({ tickets: fresh, settings }), false); } catch (e) {}
    pushToast("Simulation data reset", "success");
  }

  if (!ready) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme(true).appBg} ${theme(true).text}`}>
        <div className="flex items-center gap-2 font-mono text-sm"><RefreshCw size={16} className="animate-spin" /> Loading RELAY console…</div>
      </div>
    );
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "queue", label: "Queue", icon: Inbox },
    { id: "kb", label: "Knowledge Base", icon: BookOpen },
    { id: "diagnostics", label: "Diagnostics", icon: Terminal },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className={`min-h-screen w-full ${t.appBg} ${t.text} ${fontSizeClass}`} style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* TOASTS */}
      <div className="fixed top-3 right-3 z-50 flex flex-col gap-2 w-72">
        {toasts.map((tst) => (
          <div key={tst.id} className={`px-3 py-2 rounded-lg text-sm shadow-lg border ${t.panel} ${t.border} flex items-center gap-2`}>
            {tst.kind === "success" ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Bell size={14} className="text-cyan-500" />}
            {tst.msg}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className={`hidden md:flex md:flex-col md:w-56 shrink-0 border-r ${t.border} ${t.panel}`}>
          <div className={`px-4 py-4 border-b ${t.border} flex items-center gap-2`}>
            <div className="w-7 h-7 rounded bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-xs font-mono">R/</div>
            <div>
              <div className="font-semibold text-sm leading-none">RELAY</div>
              <div className={`text-[11px] ${t.textFaint} font-mono`}>Helpdesk Simulator</div>
            </div>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-1">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => { setScreen(n.id); setSelectedId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${screen === n.id ? `${t.active} font-medium` : `${t.hover} ${t.textMuted}`}`}>
                <n.icon size={16} /> {n.label}
                {n.id === "queue" && metrics.breached > 0 && <span className="ml-auto text-[10px] font-mono bg-rose-500 text-white rounded-full px-1.5 py-0.5">{metrics.breached}</span>}
              </button>
            ))}
          </nav>
          <div className={`px-3 py-3 border-t ${t.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center"><User size={14} className="text-cyan-500" /></div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{settings.agentName}</div>
                <div className={`text-[11px] ${t.textFaint}`}>{settings.agentStatus}</div>
              </div>
            </div>
            <button onClick={() => setSettings((s) => ({ ...s, theme: isDark ? "light" : "dark" }))}
              className={`w-full flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg border ${t.border} ${t.hover}`}>
              {isDark ? <Sun size={13} /> : <Moon size={13} />} {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </aside>

        {/* MOBILE TOP BAR */}
        <header className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${t.border} ${t.panel} sticky top-0 z-30`}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-[10px] font-mono">R/</div>
            <span className="font-semibold text-sm">RELAY</span>
          </div>
          <div className="flex items-center gap-3">
            {metrics.breached > 0 && <span className="flex items-center gap-1 text-[11px] text-rose-500 font-mono"><AlertTriangle size={12} />{metrics.breached}</span>}
            <button onClick={() => setSettings((s) => ({ ...s, theme: isDark ? "light" : "dark" }))}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          {screen === "dashboard" && (
            <DashboardScreen t={t} isDark={isDark} metrics={metrics} tickets={tickets} now={now} settings={settings}
              goQueue={(f) => { setScreen("queue"); setQueueFilter(f || "All"); }} />
          )}

          {screen === "queue" && (
            <>
              {/* Desktop split view */}
              <div className="hidden md:grid md:grid-cols-[380px_1fr] h-screen">
                <QueueList t={t} tickets={filteredTickets} selectedId={selectedId} setSelectedId={setSelectedId}
                  now={now} settings={settings} queueFilter={queueFilter} setQueueFilter={setQueueFilter}
                  queueSearch={queueSearch} setQueueSearch={setQueueSearch} density={density} />
                <div className={`border-l ${t.border} overflow-y-auto`}>
                  {selected ? (
                    <TicketDetail t={t} isDark={isDark} ticket={selected} now={now} settings={settings}
                      detailTab={detailTab} setDetailTab={setDetailTab}
                      replyText={replyText} setReplyText={setReplyText} sendReply={sendReply} aiTyping={aiTyping}
                      changeStatus={changeStatus} changePriority={changePriority}
                      noteText={noteText} setNoteText={setNoteText} addNote={addNote}
                      chatEndRef={chatEndRef} goDiagnostics={() => { setTermTicketId(selected.id); setScreen("diagnostics"); }} />
                  ) : (
                    <div className={`h-full flex items-center justify-center ${t.textFaint} text-sm`}>Select a ticket to view details</div>
                  )}
                </div>
              </div>
              {/* Mobile stacked view */}
              <div className="md:hidden">
                {!selected ? (
                  <QueueList t={t} tickets={filteredTickets} selectedId={selectedId} setSelectedId={setSelectedId}
                    now={now} settings={settings} queueFilter={queueFilter} setQueueFilter={setQueueFilter}
                    queueSearch={queueSearch} setQueueSearch={setQueueSearch} density={density} mobile />
                ) : (
                  <div>
                    <button onClick={() => setSelectedId(null)} className={`flex items-center gap-1 px-4 py-3 text-sm ${t.textMuted}`}>
                      <ArrowLeft size={15} /> Back to queue
                    </button>
                    <TicketDetail t={t} isDark={isDark} ticket={selected} now={now} settings={settings}
                      detailTab={detailTab} setDetailTab={setDetailTab}
                      replyText={replyText} setReplyText={setReplyText} sendReply={sendReply} aiTyping={aiTyping}
                      changeStatus={changeStatus} changePriority={changePriority}
                      noteText={noteText} setNoteText={setNoteText} addNote={addNote}
                      chatEndRef={chatEndRef} goDiagnostics={() => { setTermTicketId(selected.id); setScreen("diagnostics"); }} />
                  </div>
                )}
              </div>
            </>
          )}

          {screen === "kb" && (
            <KbScreen t={t} isDark={isDark} kbQuery={kbQuery} setKbQuery={setKbQuery} filteredKb={filteredKb} openKb={openKb} setOpenKb={setOpenKb} />
          )}

          {screen === "diagnostics" && (
            <DiagnosticsScreen t={t} isDark={isDark} tickets={tickets} termTicketId={termTicketId} setTermTicketId={setTermTicketId}
              termHistory={termHistory} termInput={termInput} setTermInput={setTermInput} runCommand={runCommand} termEndRef={termEndRef} />
          )}

          {screen === "settings" && (
            <SettingsScreen t={t} isDark={isDark} settings={settings} setSettings={setSettings} resetSimulation={resetSimulation} pushToast={pushToast} />
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-30 border-t ${t.border} ${t.panel} flex justify-around py-2`}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => { setScreen(n.id); setSelectedId(null); }} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${screen === n.id ? "text-cyan-500" : t.textFaint}`}>
            <n.icon size={19} />
            {n.label === "Knowledge Base" ? "KB" : n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

