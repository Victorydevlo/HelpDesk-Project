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

