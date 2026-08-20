import {
  LayoutDashboard,
  Target,
  Users,
  Globe,
  MessageSquare,
  Bot,
  Timer,
  Settings,
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
    label: "Overview",
    items: [{ title: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "Acquisition",
    items: [
      { title: "Campaigns", href: "/campaigns", icon: Target },
      { title: "Leads", href: "/leads", icon: Users, badge: "new" },
      { title: "Websites", href: "/websites", icon: Globe },
      { title: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "Agents", href: "/agents", icon: Bot },
      { title: "Automation", href: "/automation", icon: Timer },
    ],
  },
  {
    label: "Configuration",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];