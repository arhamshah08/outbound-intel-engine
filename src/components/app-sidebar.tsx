import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/nav-group";
import { footerNavLinks, navGroups } from "@/components/app-shared";
import { NavUser } from "@/components/nav-user";
import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="h-14 justify-center">
        <SidebarMenuButton render={<Link href="/" />}>
          <span className="font-semibold tracking-tight">Outbound Intel</span>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="mb-1">
          {footerNavLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="text-muted-foreground"
                size="sm"
                render={<a href={item.path} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
