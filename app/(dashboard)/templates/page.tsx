"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Zap,
  ArrowRight,
  CheckCircle2,
  Copy,
  Layers,
  Bot,
  Database,
  Globe,
  Mail,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlowWorkflow } from "@/lib/types/automation-flow";
import { DEFAULT_FLOW_WORKFLOWS } from "@/lib/data/automation-registry";

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = React.useState<FlowWorkflow | null>(null);

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "acquisition", label: "Lead Acquisition" },
    { id: "enrichment", label: "AI Reasoning & Scoring" },
    { id: "outreach", label: "Cold Outreach & Email" },
    { id: "crm", label: "CRM & Integrations" },
    { id: "ops", label: "DevOps & Synthesis" },
  ];

  const handleUseTemplate = (template: FlowWorkflow) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vasaw_automation_workflows");
      let currentWorkflows: FlowWorkflow[] = DEFAULT_FLOW_WORKFLOWS;
      if (saved) {
        try {
          currentWorkflows = JSON.parse(saved);
        } catch {
          // fallback
        }
      }

      const newWorkflow: FlowWorkflow = {
        ...template,
        id: `wf-inst-${Date.now()}`,
        name: `${template.name} (Clone)`,
        runsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [newWorkflow, ...currentWorkflows];
      localStorage.setItem("vasaw_automation_workflows", JSON.stringify(updated));
      router.push(`/automation?workflowId=${newWorkflow.id}`);
    }
  };

  const filteredTemplates = DEFAULT_FLOW_WORKFLOWS.filter((t) => {
    const matchesCategory =
      selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff6d5a]/15 text-[#ff6d5a] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Templates Marketplace
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Production-tested n8n automation recipes ready to deploy in 1 click
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-4 text-xs font-sans rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                selectedCategory === cat.id
                  ? "bg-[#ff6d5a]/15 text-[#ea4b35] font-bold"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff6d5a]/10 text-[#ff6d5a] flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>

                <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-[10px] font-bold uppercase">
                  {template.nodes.length} Nodes
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#ea4b35] transition-colors leading-snug">
                  {template.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {template.description}
                </p>
              </div>

              {/* Node Sequence Preview Tags */}
              <div className="pt-2">
                <p className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-1.5">
                  Pipeline Progression:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {template.nodes.slice(0, 4).map((node, i) => (
                    <span
                      key={node.id}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-mono font-medium flex items-center gap-1"
                    >
                      <span>{node.name.split(" ")[0]}</span>
                      {i < 3 && i < template.nodes.length - 1 && (
                        <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                      )}
                    </span>
                  ))}
                  {template.nodes.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-mono font-bold">
                      +{template.nodes.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(template)}
                className="h-8.5 text-xs border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Inspect
              </Button>

              <Button
                size="sm"
                onClick={() => handleUseTemplate(template)}
                className="h-8.5 text-xs bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold px-3.5 rounded-xl shadow-xs"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Template Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{previewTemplate.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Category: {previewTemplate.category.toUpperCase()} • {previewTemplate.nodes.length} Connected Nodes
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {previewTemplate.description}
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                Included Nodes in this Recipe:
              </p>
              {previewTemplate.nodes.map((n, idx) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-800">{n.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{n.type}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(null)}
                className="h-8.5 text-xs border-slate-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="h-8.5 text-xs bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold px-4 rounded-xl"
              >
                Clone into Canvas
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
