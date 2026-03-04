"use client";

import {
  Home,
  FileText,
  Shield,
  Zap,
  FlaskConical,
  TrendingUp,
  BarChart3,
  ClipboardCheck,
  ChevronsUpDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { title: "Home", icon: Home, active: true },
  { title: "Naming Convention", icon: FileText },
  { title: "Brand Safety", icon: Shield },
  { title: "Media Productivity", icon: Zap },
  { title: "Testing", icon: FlaskConical },
  { title: "ROI", icon: TrendingUp },
  { title: "Media Metrics", icon: BarChart3 },
  { title: "QA Workflow", icon: ClipboardCheck },
] as const;

function SidebarLogo() {
  const { open } = useSidebar();

  return (
    <div className={`flex items-center gap-2 ${open ? "px-2" : "justify-center"}`}>
      <div className="h-8 w-8 shrink-0 rounded-lg bg-primary" />
      {open && (
        <span className="text-sm font-semibold truncate">Adfidence AI</span>
      )}
    </div>
  );
}

function SidebarUser() {
  const { open } = useSidebar();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              JD
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">John Doe</span>
              <span className="truncate text-xs text-muted-foreground">
                john@acme.com
              </span>
            </div>
          )}
          {open && <ChevronsUpDown className="ml-auto size-4" />}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        side="top"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuItem>
          <User className="mr-2 size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-[#EAECF5] dark:bg-[#0D0D14] [&>[data-sidebar=sidebar]]:bg-transparent"
    >
      <SidebarHeader className="p-4">
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={"active" in item && item.active}
                    tooltip={item.title}
                    className="data-[active=true]:rounded-full data-[active=true]:border data-[active=true]:border-[#F5F9FF] data-[active=true]:bg-[rgba(255,255,255,0.20)] data-[active=true]:[box-shadow:0_10px_20px_0_rgba(255,255,255,0.20)_inset,0_0_0_0.5px_rgba(255,255,255,0.20)_inset,0.5px_0.5px_4px_0_rgba(255,255,255,0.40)_inset,-0.5px_-0.5px_0_0_rgba(255,255,255,0.40)_inset]"
                  >
                    <a href="#">
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Separator className="mx-2" />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarUser />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
