import {
  Workflow,
  Sparkles,
  KeyRound,
  Activity,
  Sliders,
  Settings,
  LayoutDashboard,
  Target,
  Users,
  Globe,
  MessageSquare,
  Bot,
  Layers,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "n8n Studio",
    items: [
      { title: "Workflows", href: "/automation", icon: Workflow, badge: "canvas" },
      { title: "Templates", href: "/templates", icon: Sparkles, badge: "new" },
      { title: "Credentials", href: "/credentials", icon: KeyRound },
      { title: "Executions", href: "/executions", icon: Activity },
      { title: "Variables", href: "/variables", icon: Sliders },
    ],
  },
  {
    label: "VASAW Suite",
    items: [
      { title: "Command Center", href: "/", icon: LayoutDashboard },
      { title: "Campaigns", href: "/campaigns", icon: Target },
      { title: "Leads Engine", href: "/leads", icon: Users },
      { title: "Websites Studio", href: "/websites", icon: Globe },
      { title: "Messages & Outreach", href: "/messages", icon: MessageSquare },
      { title: "Agent Fleet", href: "/agents", icon: Bot },
    ],
  },
  {
    label: "Settings",
    items: [{ title: "Instance Config", href: "/settings", icon: Settings }],
  },
];