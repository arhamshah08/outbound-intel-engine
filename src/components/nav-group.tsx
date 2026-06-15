"use client";

import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup } from "@/components/app-shared";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

export function NavGroup({ label, items }: SidebarNavGroup) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const isActive = item.path ? pathname === item.path : false;
          const hasActiveSub = item.subItems?.some((s) => s.path && pathname === s.path);

          return (
            <Collapsible
              className="group/collapsible"
              defaultOpen={isActive || !!hasActiveSub}
              key={item.title}
              render={<SidebarMenuItem />}
            >
              {item.subItems?.length ? (
                <>
                  <CollapsibleTrigger render={<SidebarMenuButton isActive={isActive || !!hasActiveSub} />}>
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={subItem.path ? pathname === subItem.path : false}
                            render={<Link href={subItem.path ?? "#"} />}
                          >
                            {subItem.icon}
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton
                  isActive={isActive}
                  render={<Link href={item.path ?? "#"} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
