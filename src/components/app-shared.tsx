import type { ReactNode } from "react";
import {
  SearchIcon,
  FlaskConicalIcon,
  HistoryIcon,
  ZapIcon,
  HelpCircleIcon,
  SettingsIcon,
} from "lucide-react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
  {
    items: [
      {
        title: "Research",
        path: "/",
        icon: <SearchIcon />,
      },
    ],
  },
  {
    label: "Outreach",
    items: [
      {
        title: "Pipeline",
        path: "/pipeline",
        icon: <FlaskConicalIcon />,
      },
      {
        title: "History",
        path: "/history",
        icon: <HistoryIcon />,
      },
    ],
  },
];

export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Settings",
    path: "#/settings",
    icon: <SettingsIcon />,
  },
  {
    title: "Help",
    path: "#/help",
    icon: <HelpCircleIcon />,
  },
];

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  ),
  ...footerNavLinks,
];
