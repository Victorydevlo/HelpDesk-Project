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
