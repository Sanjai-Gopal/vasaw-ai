"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, Plus, Search, X, Users, Target, Globe, Bot, Terminal, Activity } from "lucide-react";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

const routeTitles: Record<string, string> = {
  "/": "Command Center",
  "/onboarding": "Quick Start",
  "/campaigns": "Campaigns",
  "/leads": "Leads Engine",
  "/websites": "Websites Studio",
  "/messages": "Outreach & WhatsApp",
  "/agents": "Agent Fleet",
  "/automation": "Autonomous Workflows",
  "/settings": "System Config",
};

function formatRelative(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/leads/")) return "Lead Profile";
  if (pathname.startsWith("/agents/")) return "Agent Inspector";
  if (pathname.startsWith("/websites/")) return "Site Preview";
  return routeTitles[pathname] ?? "Command Center";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: "n1",
      title: "Synthesized Kovai Kitchen Website",
      description: "6 Next.js components compiled in 1.8s with clean AST pass.",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: "n2",
      title: "42 Fresh Dining Leads Ingested",
      description: "Scrape batch completed for Coimbatore zone.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
  ]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const notifRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (notifOpen || searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, searchOpen]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans selection:bg-blue-600/15 selection:text-blue-700 relative">
      {/* Background Subtle Grid & Ambient Glow */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-80 z-0" />
      <div className="fixed inset-0 ambient-glow pointer-events-none z-0" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200/80 bg-white/90 backdrop-blur-xl p-4 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 border-r border-slate-200 bg-white/95 backdrop-blur-xl p-4 lg:hidden shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-col lg:pl-64 relative z-10">
        {/* Modern Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-[12.5px]">
              <span className="text-slate-400 font-medium hidden sm:inline">Cluster</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-display font-bold text-slate-900 tracking-tight">
                {getPageTitle(pathname)}
              </span>
            </div>

            <div className="hidden md:block h-3.5 w-px bg-slate-200 ml-1" />

            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-pilot 99.98%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Quick Search */}
            <div className="relative hidden md:flex items-center" ref={searchRef}>
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads, campaigns, sites..."
                className="h-8 w-60 rounded-lg bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/90 pl-8 pr-9 text-[12px] font-sans text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
              />
              <span className="absolute right-2 px-1.5 py-0.2 rounded bg-slate-200/80 text-[9px] font-mono text-slate-600 font-bold">
                ⌘K
              </span>
            </div>

            <Button asChild size="sm" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3.5 shadow-xs shadow-blue-500/20">
              <Link href="/campaigns">
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Campaign
              </Link>
            </Button>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={cn(
                  "relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors",
                  notifOpen && "bg-slate-100 text-slate-900"
                )}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60">
                      <p className="text-[13px] font-display font-bold text-slate-950">System Telemetry</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] font-mono font-semibold text-blue-600 hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 font-sans">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "px-4 py-3 transition-colors hover:bg-slate-50/80",
                            !n.read && "bg-blue-50/30"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            {!n.read && (
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] font-semibold text-slate-900 leading-snug">{n.title}</p>
                              <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{n.description}</p>
                              <p className="mt-1 text-[10px] font-mono text-slate-400">
                                {formatRelative(n.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 text-center">
                      <Link
                        href="/"
                        onClick={() => setNotifOpen(false)}
                        className="text-center text-[11.5px] font-mono font-bold text-blue-600 hover:underline"
                      >
                        Open Live Console →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Avatar className="h-7 w-7 rounded-lg border border-slate-200">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-[11px] font-mono font-bold text-white">
                S
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}