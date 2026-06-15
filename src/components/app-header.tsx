"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { NavUser } from "@/components/nav-user";
import { SearchIcon, FlaskConicalIcon, HistoryIcon } from "lucide-react";

const PAGE_MAP: Record<string, { title: string; icon: React.ReactNode }> = {
  "/":         { title: "Research",  icon: <SearchIcon className="h-3.5 w-3.5" /> },
  "/pipeline": { title: "Pipeline",  icon: <FlaskConicalIcon className="h-3.5 w-3.5" /> },
  "/history":  { title: "History",   icon: <HistoryIcon className="h-3.5 w-3.5" /> },
};

export function AppHeader() {
  const pathname = usePathname();
  const page = PAGE_MAP[pathname] ?? PAGE_MAP["/"];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 md:px-6"
      )}
    >
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={page} />
      </div>
      <div className="flex items-center gap-3">
        <Separator
          className="h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <NavUser />
      </div>
    </header>
  );
}
