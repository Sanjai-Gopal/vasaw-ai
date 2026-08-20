"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, Plus, Search, X } from "lucide-react";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
  return routeTitles[pathname] ?? "VASAW AI";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

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

          <div className="relative ml-auto hidden w-full max-w-xs md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search leads, campaigns…" className="pl-9" />
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

            <button
              className={cn(
                "relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
              )}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </button>

            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-[10px] text-white">
                GR
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}