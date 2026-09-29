"use client";

import * as React from "react";
import {
  Search,
  X,
  Zap,
  Clock,
  Database,
  Globe,
  Mail,
  Send,
  Sparkles,
  Bot,
  Filter,
  Code,
  GitFork,
  ArrowRight,
  Layers,
  ChevronRight,
  Plus,
  Server,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeTypeDefinition, NodeCategory } from "@/lib/types/automation-flow";
import { NODE_TYPE_REGISTRY, NODE_CATEGORIES } from "@/lib/data/automation-registry";

interface N8nNodeCreatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNodeType: (nodeType: NodeTypeDefinition) => void;
}

const CATEGORY_TABS: Array<{ id: string; label: string; icon: React.ElementType }> = [
  { id: "all", label: "All Nodes", icon: Layers },
  { id: "trigger", label: "Triggers", icon: Zap },
  { id: "ai", label: "AI & Agents", icon: Sparkles },
  { id: "integration", label: "Actions", icon: Globe },
  { id: "logic", label: "Flow & Code", icon: Code },
];

export function N8nNodeCreatorDrawer({
  isOpen,
  onClose,
  onSelectNodeType,
}: N8nNodeCreatorDrawerProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel (Right Side) */}
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#181a20] border-l border-[#2d313c] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 text-slate-100">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#2d313c] flex items-center justify-between bg-[#15161b]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ff6d5a]/20 text-[#ff6d5a] flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Add Node to Flow</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#2d313c] bg-[#1a1c22]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search triggers, AI, integrations, and code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#ff6d5a] transition-all"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-[#2d313c] bg-[#15161b] overflow-x-auto">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  selectedCategory === tab.id
                    ? "bg-[#ff6d5a] text-white font-bold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nodes List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              No matching nodes found.
            </div>
          ) : (
            filteredNodes.map((node) => (
              <div
                key={node.type}
                onClick={() => {
                  onSelectNodeType(node);
                  onClose();
                }}
                className="group p-3 rounded-xl bg-[#1f222a] border border-[#2d313c] hover:border-[#ff6d5a]/60 hover:bg-[#252832] transition-all cursor-pointer flex items-start justify-between gap-3 shadow-xs hover:shadow-md"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 text-white shadow-inner transition-transform group-hover:scale-105"
                    style={{ backgroundColor: node.colorScheme.accent }}
                  >
                    <Zap className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-white group-hover:text-[#ff6d5a] transition-colors truncate">
                        {node.name}
                      </h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                        {node.badgeText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {node.description}
                    </p>
                  </div>
                </div>

                <div className="self-center p-1 rounded-lg text-slate-500 group-hover:text-[#ff6d5a] transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[#2d313c] bg-[#15161b] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Tip: Press Tab anytime to reopen</span>
          <span className="text-slate-500">ESC to close</span>
        </div>
      </div>
    </div>
  );
}
