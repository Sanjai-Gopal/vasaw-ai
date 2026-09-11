"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navGroups } from "@/lib/nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Radio, Plus } from "lucide-react";

export function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col justify-between select-none">
      <div className="space-y-4">
        {/* Workspace Brand Header */}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-2 py-1 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-display font-extrabold text-sm tracking-tight shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
            V
          </div>
          <div className="leading-tight">
            <p className="text-[14.5px] font-display font-extrabold tracking-tight text-slate-950 group-hover:text-blue-600 transition-colors">
              VASAW AI
            </p>
            <p className="text-[11px] font-mono text-slate-400 font-medium">Autonomous Workspace</p>
          </div>
        </Link>

        {/* Quick Action CTA — Aligned with Stitch */}
        <div className="px-1">
          <Link
            href="/campaigns"
            onClick={onNavigate}
            className="w-full h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap font-sans font-semibold">New Campaign</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
                        active
                          ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/70 shadow-xs"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            active
                              ? "text-blue-600"
                              : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        <span>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold",
                              active
                                ? "bg-blue-100/80 text-blue-800"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Operator Status & Profile */}
      <div className="pt-4 space-y-3 border-t border-slate-200/80">
        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            us-east-1
          </span>
          <span className="text-slate-400 font-semibold">18ms</span>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2.5 flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-mono font-bold text-xs">
              S
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12.5px] font-bold text-slate-900">Sanjai</p>
            <p className="truncate text-[11px] text-slate-500 font-mono">Operator • VASAW</p>
          </div>
        </div>
      </div>
    </div>
  );
}