"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";

export function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col gap-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-wide">VASAW AI</p>
          <p className="text-[11px] text-sidebar-muted">Business Automation</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-cyan-400" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active
                          ? "text-primary"
                          : "text-sidebar-muted group-hover:text-sidebar-foreground"
                      )}
                    />
                    {item.title}
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-cyan-400 text-white">
              GR
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">Gogul Raj</p>
            <p className="truncate text-xs text-sidebar-muted">Founder · Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
}