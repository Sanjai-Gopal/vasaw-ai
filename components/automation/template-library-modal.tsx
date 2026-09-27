"use client";

import * as React from "react";
import {
  Sparkles,
  X,
  ArrowRight,
  Zap,
  Globe,
  CheckCircle2,
  Database,
  Building2,
  Mail,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlowWorkflow } from "@/lib/types/automation-flow";
import { DEFAULT_FLOW_WORKFLOWS } from "@/lib/data/automation-registry";

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (workflow: FlowWorkflow) => void;
}

export function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateLibraryModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">
                Automation Recipe Templates
              </h3>
              <p className="text-xs text-slate-400">
                Deploy battle-tested multi-agent workflows directly into your canvas in one click.
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

        {/* Templates List Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {DEFAULT_FLOW_WORKFLOWS.map((template) => (
            <div
              key={template.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/30 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                      {template.name}
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-slate-700 bg-slate-800 text-slate-300"
                    >
                      {template.nodes.length} Nodes
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                    className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                  >
                    Load into Canvas
                  </Button>
                </div>

                <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
                  {template.description}
                </p>
              </div>

              {/* Node Sequence Preview Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/60">
                {template.nodes.map((n, idx) => (
                  <React.Fragment key={n.id}>
                    <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                      {n.name}
                    </span>
                    {idx < template.nodes.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
