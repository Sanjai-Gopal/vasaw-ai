"use client";

import * as React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  MapPin,
  Trash2,
  Scissors,
  Layers,
  Zap,
  Mail,
  Globe,
  GitFork,
  Plus,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FlowNode,
  FlowConnection,
  NodeTypeDefinition,
  CanvasStickyNote,
} from "@/lib/types/automation-flow";
import { NODE_TYPE_REGISTRY } from "@/lib/data/automation-registry";
import { FlowNodeCard } from "@/components/automation/flow-node-card";

interface FlowCanvasProps {
  nodes: FlowNode[];
  connections: FlowConnection[];
  stickyNotes?: CanvasStickyNote[];
  selectedNodeId: string | null;
  isExecuting: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onOpenConfig?: (nodeId: string) => void;
  onUpdateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  onAddConnection: (connection: FlowConnection) => void;
  onDeleteConnection: (connectionId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onRunStep: (nodeId: string) => void;
  onQuickAddNode?: (nodeTypeKey: string) => void;
  onOpenPalette?: () => void;
  onAddStickyNote?: () => void;
  onUpdateStickyNote?: (noteId: string, updates: Partial<CanvasStickyNote>) => void;
  onDeleteStickyNote?: (noteId: string) => void;
}

const NODE_WIDTH = 270;
const NODE_HEIGHT = 160;

export function FlowCanvas({
  nodes,
  connections,
  stickyNotes,
  selectedNodeId,
  isExecuting,
  onSelectNode,
  onOpenConfig,
  onUpdateNodePosition,
  onAddConnection,
  onDeleteConnection,
  onDeleteNode,
  onDuplicateNode,
  onRunStep,
  onQuickAddNode,
  onOpenPalette,
  onAddStickyNote,
  onUpdateStickyNote,
  onDeleteStickyNote,
}: FlowCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);


  // Viewport transformation: pan (x, y) & zoom scale
  const [transform, setTransform] = React.useState<{ x: number; y: number; scale: number }>({
    x: 40,
    y: 60,
    scale: 1,
  });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = React.useState<string | null>(null);
  const dragStartOffset = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Panning canvas state
  const [isPanning, setIsPanning] = React.useState(false);
  const panStart = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connection in progress state
  const [connectingFrom, setConnectingFrom] = React.useState<{
    nodeId: string;
    portId: string;
  } | null>(null);
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selected cable for deletion
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string | null>(null);

  // Show minimap toggle
  const [showMinimap, setShowMinimap] = React.useState(true);

  // Handle canvas background mouse down (pan)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && (e.target as HTMLElement).tagName !== "svg") {
      return;
    }
    onSelectNode(null);
    setSelectedConnectionId(null);
    setConnectingFrom(null);

    setIsPanning(true);
    panStart.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    };
  };

  // Handle canvas mouse move (panning, dragging node, or connecting wire)
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Panning canvas
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      }));
      return;
    }

    // 2. Dragging node
    if (draggingNodeId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const rawX = (e.clientX - containerRect.left - transform.x) / transform.scale;
      const rawY = (e.clientY - containerRect.top - transform.y) / transform.scale;

      const newX = Math.round(rawX - dragStartOffset.current.x);
      const newY = Math.round(rawY - dragStartOffset.current.y);

      onUpdateNodePosition(draggingNodeId, { x: newX, y: newY });
      return;
    }

    // 3. Connecting wire in progress
    if (connectingFrom) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      setMousePos({
        x: (e.clientX - containerRect.left - transform.x) / transform.scale,
        y: (e.clientY - containerRect.top - transform.y) / transform.scale,
      });
    }
  };

  // Handle mouse up anywhere in canvas
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.3), 2.2);
      setTransform((prev) => ({ ...prev, scale: newScale }));
    } else {
      // Pan with two-finger scroll
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  // Start dragging a node
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    setConnectingFrom(null);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseCanvasX = (e.clientX - containerRect.left - transform.x) / transform.scale;
    const mouseCanvasY = (e.clientY - containerRect.top - transform.y) / transform.scale;

    dragStartOffset.current = {
      x: mouseCanvasX - node.position.x,
      y: mouseCanvasY - node.position.y,
    };

    setDraggingNodeId(nodeId);
  };

  // Start connection from output port
  const handleStartConnection = (nodeId: string, portId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingFrom({ nodeId, portId });

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setMousePos({
        x: (e.clientX - containerRect.left - transform.x) / transform.scale,
        y: (e.clientY - containerRect.top - transform.y) / transform.scale,
      });
    }
  };

  // Complete connection on input port
  const handleEndConnection = (nodeId: string, portId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connectingFrom) return;

    // Prevent connecting node to itself
    if (connectingFrom.nodeId === nodeId) {
      setConnectingFrom(null);
      return;
    }

    // Check if connection already exists
    const exists = connections.some(
      (c) =>
        c.fromNodeId === connectingFrom.nodeId &&
        c.fromPortId === connectingFrom.portId &&
        c.toNodeId === nodeId &&
        c.toPortId === portId
    );

    if (!exists) {
      onAddConnection({
        id: `c-${Date.now()}`,
        fromNodeId: connectingFrom.nodeId,
        fromPortId: connectingFrom.portId,
        toNodeId: nodeId,
        toPortId: portId,
      });
    }

    setConnectingFrom(null);
  };

  // Zoom control helpers
  const zoomIn = () =>
    setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 2.2) }));
  const zoomOut = () =>
    setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.3) }));
  const resetZoom = () => setTransform({ x: 60, y: 60, scale: 1 });

  const fitView = () => {
    if (nodes.length === 0) return;
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + NODE_WIDTH;
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) + NODE_HEIGHT;

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const width = maxX - minX + 160;
    const height = maxY - minY + 160;

    const scale = Math.min(
      Math.max(Math.min(containerWidth / width, containerHeight / height), 0.4),
      1.2
    );

    setTransform({
      x: containerWidth / 2 - ((minX + maxX) / 2) * scale,
      y: containerHeight / 2 - ((minY + maxY) / 2) * scale,
      scale,
    });
  };

  // Auto-tidy layout: arrange nodes in clean topological sequence
  const tidyNodes = () => {
    let currentX = 80;
    nodes.forEach((node) => {
      onUpdateNodePosition(node.id, { x: currentX, y: 220 });
      currentX += 340;
    });
    fitView();
  };

  // Calculate port absolute canvas coordinates
  const getPortCoords = (nodeId: string, portId: string, isOutput: boolean) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const def = NODE_TYPE_REGISTRY[node.type];
    const ports = isOutput ? def?.outputs || [] : def?.inputs || [];
    const portIndex = ports.findIndex((p) => p.id === portId);

    let yOffset = NODE_HEIGHT / 2;
    if (ports.length > 1 && portIndex >= 0) {
      yOffset = portIndex === 0 ? NODE_HEIGHT / 3 : (NODE_HEIGHT * 2) / 3;
    }

    return {
      x: isOutput ? node.position.x + NODE_WIDTH : node.position.x,
      y: node.position.y + yOffset,
    };
  };

  // Compute smooth cubic Bézier curve path string
  const computeBezierPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const dx = Math.max(Math.abs(endX - startX) * 0.5, 40);
    return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={cn(
        "relative w-full h-[740px] select-none overflow-hidden rounded-2xl border border-[#2d313c] bg-[#131418] bg-n8n-dots",
        isPanning ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      )}
    >
      {/* Background Dot Grid */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dot-grid-pattern"
            width={24 * transform.scale}
            height={24 * transform.scale}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${transform.x}, ${transform.y})`}
          >
            <circle cx="2" cy="2" r="1.5" fill="#4b5563" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid-pattern)" />
      </svg>

      {/* Transformable Canvas Workspace Layer */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Sticky Notes Layer */}
        {stickyNotes?.map((note) => {
          const colorStyles: Record<string, string> = {
            yellow: "bg-amber-950/40 border-amber-600/50 text-amber-200",
            blue: "bg-blue-950/40 border-blue-600/50 text-blue-200",
            green: "bg-emerald-950/40 border-emerald-600/50 text-emerald-200",
            pink: "bg-rose-950/40 border-rose-600/50 text-rose-200",
            purple: "bg-purple-950/40 border-purple-600/50 text-purple-200",
            slate: "bg-slate-900/60 border-slate-700/60 text-slate-300",
          };

          return (
            <div
              key={note.id}
              style={{
                transform: `translate(${note.position.x}px, ${note.position.y}px)`,
                width: note.width || 240,
                height: note.height || 160,
              }}
              className={cn(
                "absolute left-0 top-0 rounded-2xl border p-3.5 shadow-lg backdrop-blur-xs flex flex-col justify-between group pointer-events-auto z-0",
                colorStyles[note.color] || colorStyles.yellow
              )}
            >
              <textarea
                value={note.text}
                onChange={(e) => onUpdateStickyNote?.(note.id, { text: e.target.value })}
                placeholder="Sticky note description..."
                className="w-full flex-1 bg-transparent resize-none border-none outline-none font-sans text-xs leading-relaxed"
              />
              <div className="flex items-center justify-between pt-1 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-mono opacity-60">Sticky Note</span>
                <button
                  onClick={() => onDeleteStickyNote?.(note.id)}
                  className="text-[10px] text-rose-400 hover:text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {/* SVG Cable Layer */}
        <svg
          className="absolute inset-0 overflow-visible pointer-events-none"
          style={{ width: 1, height: 1 }}
        >
          <defs>
            <linearGradient id="cable-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f5666" />
              <stop offset="100%" stopColor="#636c7e" />
            </linearGradient>

            <linearGradient id="cable-active-pulse" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff6d5a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Render All Established Connections */}
          {connections.map((conn) => {
            const start = getPortCoords(conn.fromNodeId, conn.fromPortId, true);
            const end = getPortCoords(conn.toNodeId, conn.toPortId, false);
            const path = computeBezierPath(start.x, start.y, end.x, end.y);

            const isBranchTrue = conn.fromPortId === "true";
            const isBranchFalse = conn.fromPortId === "false";
            const isSelected = selectedConnectionId === conn.id;

            const strokeColor = isSelected
              ? "#ff6d5a"
              : isBranchTrue
              ? "#10b981"
              : isBranchFalse
              ? "#f43f5e"
              : isExecuting
              ? "url(#cable-active-pulse)"
              : "#5a6273";

            return (
              <g key={conn.id} className="pointer-events-auto">
                {/* Thick Invisible Hover Hitbox */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={22}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConnectionId(conn.id);
                  }}
                />

                {/* Cable Outer Shadow / Glow */}
                <path
                  d={path}
                  fill="none"
                  stroke={isExecuting ? "rgba(255, 109, 90, 0.4)" : "rgba(0, 0, 0, 0.4)"}
                  strokeWidth={6}
                />

                {/* Main Cable Line */}
                <path
                  d={path}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3.5 : isExecuting ? 3 : 2.5}
                  strokeDasharray={isSelected ? "5,5" : undefined}
                  className={cn("transition-all duration-150", isExecuting && "animate-flow-dash")}
                />

                {/* Flowing animated pulse data particle when executing */}
                {isExecuting && (
                  <circle r="4.5" fill="#ff6d5a" filter="drop-shadow(0 0 6px #ff6d5a)">
                    <animateMotion
                      dur="1.2s"
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                )}

                {/* Mid-point Delete Button on Cable Selection */}
                {isSelected && (
                  <foreignObject
                    x={(start.x + end.x) / 2 - 14}
                    y={(start.y + end.y) / 2 - 14}
                    width={28}
                    height={28}
                    className="overflow-visible"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConnection(conn.id);
                        setSelectedConnectionId(null);
                      }}
                      className="w-7 h-7 rounded-full bg-[#ff6d5a] text-white flex items-center justify-center hover:bg-[#ea4b35] shadow-lg cursor-pointer"
                      title="Delete Cable Connection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </foreignObject>
                )}
              </g>
            );
          })}

          {/* Active Drag-to-Connect Cable Line */}
          {connectingFrom && (
            <path
              d={computeBezierPath(
                getPortCoords(connectingFrom.nodeId, connectingFrom.portId, true).x,
                getPortCoords(connectingFrom.nodeId, connectingFrom.portId, true).y,
                mousePos.x,
                mousePos.y
              )}
              fill="none"
              stroke="#ff6d5a"
              strokeWidth={2.5}
              strokeDasharray="6,6"
              className="animate-pulse pointer-events-none"
            />
          )}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            style={{
              transform: `translate(${node.position.x}px, ${node.position.y}px)`,
            }}
            className="absolute left-0 top-0 transition-transform duration-75 z-10"
          >
            <FlowNodeCard
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={onSelectNode}
              onOpenConfig={onOpenConfig}
              onRunStep={onRunStep}
              onDelete={onDeleteNode}
              onDuplicate={onDuplicateNode}
              onStartConnection={handleStartConnection}
              onEndConnection={handleEndConnection}
              isConnecting={Boolean(connectingFrom)}
            />
          </div>
        ))}
      </div>

      {/* Floating Quick Action Tray (Top Left) */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#191a21]/95 border border-[#2d313c] shadow-2xl backdrop-blur-md">
        <span className="text-[10px] font-mono uppercase font-bold text-slate-400 px-2 select-none">
          n8n Studio
        </span>

        {/* Open Node Palette (Tab) */}
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff6d5a] hover:bg-[#ea4b35] text-white text-xs font-bold transition-all shadow-sm shadow-[#ff6d5a]/25 cursor-pointer active:scale-95"
          title="Add Node to Canvas (Tab)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add node</span>
        </button>

        {/* Add Sticky Note */}
        <button
          onClick={onAddStickyNote}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
          title="Add Sticky Note to Canvas"
        >
          <StickyNote className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sticky Note</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={() => onQuickAddNode?.("trigger_webhook")}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          title="Quick add Webhook Trigger"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Webhook</span>
        </button>
        <button
          onClick={() => onQuickAddNode?.("action_resend_email")}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          title="Quick add Email Dispatcher"
        >
          <Mail className="w-3.5 h-3.5 text-blue-400" />
          <span>Email</span>
        </button>
      </div>


      {/* Floating Canvas Controls Toolbar (Bottom Left) */}
      <div className="absolute bottom-5 left-5 z-30 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md text-slate-300">
        <button
          onClick={zoomIn}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono px-2 py-0.5 font-semibold text-slate-300 min-w-[50px] text-center">
          {Math.round(transform.scale * 100)}%
        </span>

        <button
          onClick={zoomOut}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={resetZoom}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reset to 100%"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={fitView}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={tidyNodes}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1"
          title="Auto-align Layout"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-mono hidden sm:inline">Tidy</span>
        </button>
      </div>

      {/* Floating Canvas Minimap (Bottom Right) */}
      {showMinimap && nodes.length > 0 && (
        <div className="absolute bottom-5 right-5 z-30 w-44 h-28 rounded-xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden p-1.5 select-none hidden md:block">
          <div className="w-full h-full relative bg-slate-950/70 rounded-lg overflow-hidden border border-slate-800/80">
            {nodes.map((node) => {
              // Map canvas coordinates to minimap coordinates
              const mapX = Math.min(Math.max((node.position.x / 2400) * 140, 4), 136);
              const mapY = Math.min(Math.max((node.position.y / 1200) * 80, 4), 76);

              return (
                <div
                  key={node.id}
                  style={{ left: `${mapX}px`, top: `${mapY}px` }}
                  className={cn(
                    "absolute w-4 h-2 rounded-xs transition-colors",
                    node.id === selectedNodeId ? "bg-blue-400 ring-1 ring-blue-300" : "bg-slate-600"
                  )}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
