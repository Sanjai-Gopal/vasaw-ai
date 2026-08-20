"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, Plus, Search, X, Users, Target, Globe, Bot } from "lucide-react";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getNotifications } from "@/lib/data";
import { formatRelative } from "@/lib/utils";
import { leads } from "@/lib/data/leads";
import { campaigns } from "@/lib/data/campaigns";
import { agents } from "@/lib/data/agents";
import { websites } from "@/lib/data/websites";
import type { Notification } from "@/lib/types";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campaigns",
  "/leads": "Leads",
  "/websites": "Websites",
  "/messages": "Messages",
  "/agents": "Agents",
  "/automation": "Automation",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/leads/")) return "Lead Details";
  if (pathname.startsWith("/agents/")) return "Agent Details";
  return routeTitles[pathname] ?? "VASAW AI";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>(getNotifications());
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

  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: Array<{ label: string; href: string; icon: typeof Users; meta: string }> = [];

    leads.forEach((l) => {
      if (`${l.businessName} ${l.category} ${l.location}`.toLowerCase().includes(q)) {
        results.push({ label: l.businessName, href: `/leads/${l.id}`, icon: Users, meta: `${l.category} · ${l.location}` });
      }
    });
    campaigns.forEach((c) => {
      if (`${c.name} ${c.category} ${c.location}`.toLowerCase().includes(q)) {
        results.push({ label: c.name, href: "/campaigns", icon: Target, meta: `${c.category} · ${c.location}` });
      }
    });
    agents.forEach((a) => {
      if (`${a.name} ${a.description}`.toLowerCase().includes(q)) {
        results.push({ label: a.name, href: `/agents/${a.id}`, icon: Bot, meta: a.status });
      }
    });
    websites.forEach((w) => {
      if (`${w.businessName} ${w.category}`.toLowerCase().includes(q)) {
        results.push({ label: w.businessName, href: "/websites", icon: Globe, meta: w.status });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery]);

  const handleSearchSelect = (href: string) => {
    setSearchQuery("");
    setSearchOpen(false);
    router.push(href);
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
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar p-4 lg:block">
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
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 border-r border-sidebar-border bg-sidebar p-4 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 rounded-md p-1 text-sidebar-muted hover:bg-sidebar-accent"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden text-muted-foreground sm:inline">VASAW AI</span>
            <span className="hidden text-muted-foreground/50 sm:inline">/</span>
            <span className="font-semibold text-foreground">{getPageTitle(pathname)}</span>
          </div>

          <div className="relative ml-auto hidden w-full max-w-xs md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads, campaigns, agents…"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
            />
            {searchOpen && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
              >
                {searchResults.map((result) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.href + result.label}
                      onClick={() => handleSearchSelect(result.href)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{result.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{result.meta}</p>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
            {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-popover p-4 text-center shadow-xl"
              >
                <p className="text-sm text-muted-foreground">No results found</p>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Agents healthy
            </span>

            <Button asChild variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
              <Link href="/campaigns">
                <Plus className="h-4 w-4" />
                New Campaign
              </Link>
            </Button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={cn(
                  "relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent",
                  notifOpen && "bg-accent"
                )}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "border-b border-border px-4 py-3 transition-colors hover:bg-muted/50",
                            !n.read && "bg-muted/30"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {!n.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{n.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground/70">
                                {formatRelative(n.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border px-4 py-2.5">
                      <Link
                        href="/"
                        onClick={() => setNotifOpen(false)}
                        className="text-center text-xs font-medium text-primary hover:underline"
                      >
                        View all activity
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-[10px] text-white">
                S
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}