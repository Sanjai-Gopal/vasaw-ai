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
          href="/automation"
          onClick={onNavigate}
          className="flex items-center gap-3 px-2 py-1 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6d5a] text-white font-extrabold text-sm tracking-tight shadow-md shadow-[#ff6d5a]/30 transition-transform group-hover:scale-105">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="18" cy="18" r="3" />
              <path d="M8.7 10.7l6.6-3.4M8.7 13.3l6.6 3.4" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <p className="text-[15px] font-black tracking-tight text-slate-900 group-hover:text-[#ff6d5a] transition-colors">
                n8n
              </p>
              <span className="text-[10px] font-mono px-1 rounded bg-[#ff6d5a]/10 text-[#ff6d5a] font-bold">
                VASAW
              </span>
            </div>
            <p className="text-[10.5px] font-mono text-slate-400 font-medium">Autonomous Automation</p>
          </div>
        </Link>

        {/* Primary Action CTA: New Workflow */}
        <div className="px-1">
          <Link
            href="/automation"
            onClick={onNavigate}
            className="w-full h-9 px-3 rounded-xl bg-[#ff6d5a] hover:bg-[#ea4b35] text-white text-[13px] font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm shadow-[#ff6d5a]/25"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap font-sans font-bold">New Workflow</span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2.5 text-[9.5px] font-mono font-bold uppercase tracking-widest text-slate-400">
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
                        "group relative flex items-center justify-between rounded-xl px-3 py-2 text-[12.5px] font-medium transition-all",
                        active
                          ? "bg-[#ff6d5a]/10 text-[#ea4b35] font-bold border border-[#ff6d5a]/30 shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            active
                              ? "text-[#ff6d5a]"
                              : "text-slate-400 group-hover:text-slate-700"
                          )}
                        />
                        <span>{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase",
                              active
                                ? "bg-[#ff6d5a]/20 text-[#ea4b35]"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6d5a] animate-pulse" />
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

      {/* Operator Status & Shortcuts Footer */}
      <div className="pt-3 space-y-2.5 border-t border-slate-200/80">
        <div className="flex items-center justify-between px-2.5 text-[10.5px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            n8n core v1.78.2
          </span>
          <span className="text-slate-400 font-semibold">Active</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-7 w-7 rounded-lg border border-slate-200">
              <AvatarFallback className="bg-[#ff6d5a] text-white font-mono font-bold text-xs">
                S
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12px] font-bold text-slate-900">Sanjai Gopal</p>
              <p className="truncate text-[10px] text-slate-500 font-mono">Workspace Admin</p>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-slate-200/60 text-[9px] font-mono text-slate-600 font-bold" title="Press ? for shortcuts">
            ⌘/
          </span>
        </div>
      </div>
    </div>
  );
}