"use client";

import * as React from "react";
import {
  Search,
  X,
  Plus,
  Zap,
  Clock,
  Compass,
  Database,
  FileText,
  PlayCircle,
  Sparkles,
  Edit3,
  Layout,
  GitMerge,
  GitBranch,
  Globe,
  MessageSquare,
  Mail,
  Send,
  Terminal,
  GitFork,
  Code,
  Filter,
  Timer,
  Layers,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeTypeDefinition, NodeCategory } from "@/lib/types/automation-flow";
import { NODE_TYPE_REGISTRY, NODE_CATEGORIES } from "@/lib/data/automation-registry";

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Clock,
  Compass,
  Database,
  FileText,
  PlayCircle,
  Sparkles,
  Edit3,
  Layout,
  GitMerge,
  Search,
  GitBranch,
  Globe,
  MessageSquare,
  Mail,
  Send,
  Terminal,
  GitFork,
  Code,
  Filter,
  Timer,
  Layers,
};

interface NodePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNodeType: (nodeType: NodeTypeDefinition) => void;
}

export function NodePaletteModal({
  isOpen,
  onClose,
  onSelectNodeType,
}: NodePaletteModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allNodes = Object.values(NODE_TYPE_REGISTRY);

  const filteredNodes = allNodes.filter((node) => {
    const matchesCategory =
      selectedCategory === "all" || node.category === selectedCategory;
    const matchesSearch =
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.badgeText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                Add Node to Workflow
              </h3>
              <p className="text-xs text-slate-400">
                Choose from triggers, autonomous AI agents, database ops, and integrations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search nodes (e.g. Gemini, Webhook, WhatsApp, Supabase, Vercel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-800 bg-slate-900 font-sans text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {NODE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded font-mono",
                    selectedCategory === cat.id
                      ? "bg-blue-700 text-blue-100"
                      : "bg-slate-900 text-slate-400"
                  )}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Node Grid List */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredNodes.map((nodeDef) => {
            const IconComponent = ICON_MAP[nodeDef.iconName] || Layers;

            return (
              <div
                key={nodeDef.type}
                onClick={() => {
                  onSelectNodeType(nodeDef);
                  onClose();
                }}
                className="group p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 hover:border-slate-700 cursor-pointer transition-all flex items-start gap-3.5 hover:shadow-lg"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                    nodeDef.colorScheme.bg,
                    nodeDef.colorScheme.border
                  )}
                >
                  <IconComponent
                    className="w-5 h-5"
                    style={{ color: nodeDef.colorScheme.accent }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {nodeDef.name}
                    </h4>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      {nodeDef.badgeText}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {nodeDef.description}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredNodes.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-500 text-xs">
              No automation nodes found matching &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
