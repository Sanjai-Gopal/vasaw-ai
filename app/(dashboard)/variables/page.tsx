"use client";

import * as React from "react";
import {
  Sliders,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Lock,
  Braces,
  Info,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkflowVariable } from "@/lib/types/automation-flow";

const INITIAL_VARIABLES: WorkflowVariable[] = [
  {
    id: "var-1",
    key: "DEFAULT_SCRAPE_LOCATION",
    value: "Coimbatore, Tamil Nadu",
    type: "string",
    description: "Default fallback geographic target for Google Maps Apify ingestion.",
  },
  {
    id: "var-2",
    key: "MAX_EMAIL_BATCH_SIZE",
    value: "25",
    type: "number",
    description: "Maximum concurrent Resend cold emails dispatched per execution window.",
  },
  {
    id: "var-3",
    key: "QUALIFICATION_THRESHOLD",
    value: "80",
    type: "number",
    description: "Minimum Gemini opportunity score required before triggering website synthesis.",
  },
  {
    id: "var-4",
    key: "SLACK_ALERTS_ENABLED",
    value: "true",
    type: "boolean",
    description: "Whether live telemetry messages should broadcast to Slack SDR channels.",
  },
  {
    id: "var-5",
    key: "SHARED_WEBHOOK_SECRET",
    value: "••••••••••••••••",
    type: "secret",
    description: "Cryptographic HMAC salt for verifying inbound lead webhooks.",
  },
];

export default function VariablesPage() {
  const [variables, setVariables] = React.useState<WorkflowVariable[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vasaw_n8n_variables");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_VARIABLES;
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  // New variable form state
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [newType, setNewType] = React.useState<"string" | "number" | "boolean" | "secret">("string");
  const [newDescription, setNewDescription] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vasaw_n8n_variables", JSON.stringify(variables));
    }
  }, [variables]);

  const handleCopyExpression = (key: string) => {
    const expr = `{{ $vars.${key} }}`;
    navigator.clipboard.writeText(expr);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleDeleteVariable = (id: string) => {
    if (confirm("Delete this variable? Workflows referencing it in expressions will receive undefined.")) {
      setVariables((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const formattedKey = newKey.trim().toUpperCase().replace(/\s+/g, "_");
    const newVar: WorkflowVariable = {
      id: `var-${Date.now()}`,
      key: formattedKey,
      value: newValue,
      type: newType,
      description: newDescription || "Custom user-defined variable.",
    };

    setVariables((prev) => [newVar, ...prev]);
    setIsModalOpen(false);
    setNewKey("");
    setNewValue("");
    setNewDescription("");
  };

  const filteredVariables = variables.filter(
    (v) =>
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff6d5a]/15 text-[#ff6d5a] flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Variables &amp; Environment
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Reference reusable parameters across your workflow expressions via {"{{ $vars.KEY }}"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 shadow-sm shadow-[#ff6d5a]/25"
          >
            <Plus className="w-4 h-4" />
            <span>Add Variable</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search variables by key or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-4 text-xs font-sans rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#ff6d5a] transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing {filteredVariables.length} of {variables.length} variables
        </div>
      </div>

      {/* Variables Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Key (Expression Reference)</th>
                <th className="py-3 px-4 font-bold">Value</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Description</th>
                <th className="py-3 px-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredVariables.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {v.key}
                      </span>
                      <button
                        onClick={() => handleCopyExpression(v.key)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors"
                        title="Copy {{ $vars.KEY }} expression"
                      >
                        {copiedKey === v.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 max-w-xs truncate">
                    {v.type === "secret" ? (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>••••••••••••••••</span>
                      </span>
                    ) : (
                      v.value
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-[10px] font-bold uppercase">
                      {v.type}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 max-w-md truncate">
                    {v.description || "—"}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteVariable(v.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete variable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Variable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff6d5a]/15 text-[#ff6d5a] flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Add Workflow Variable</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddVariable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Variable Key Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEFAULT_LOCATION"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                  className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff6d5a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff6d5a]"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="secret">Secret (Masked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Value
                </label>
                <input
                  type="text"
                  placeholder="Value..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                  className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff6d5a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="What is this variable used for?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#ff6d5a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8.5 text-xs border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8.5 text-xs bg-[#ff6d5a] hover:bg-[#ea4b35] text-white font-bold px-4"
                >
                  Create Variable
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
