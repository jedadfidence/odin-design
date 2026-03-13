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
  MessageCircle,
  ChevronsUpDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { useSettings } from "@/providers/Settings";

const NAV_ITEMS = [
  { title: "Home", icon: Home },
  { title: "Naming Convention", icon: FileText },
  { title: "Brand Safety", icon: Shield },
  { title: "Media Productivity", icon: Zap },
  { title: "Testing", icon: FlaskConical },
  { title: "ROI", icon: TrendingUp },
  { title: "Media Metrics", icon: BarChart3 },
  { title: "QA Workflow", icon: ClipboardCheck },
] as const;

function AdfidenceLogo({ className }: { className?: string }) {
  return (
    <img
      src="/adfidence-logo.svg"
      alt="Adfidence"
      className={cn("object-contain dark:brightness-0 dark:invert", className)}
    />
  );
}

function AdfidenceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M64.0056 52.9932C64.0056 60.4404 58.2009 66.4683 51.0295 66.4683H38.0535V0H51.0295C58.2009 0 64.0056 6.02794 64.0056 13.4751V52.9932Z"
        className="fill-[#214DA5] dark:fill-white"
      />
      <path
        d="M12.9761 0C5.80471 0 0 6.02794 0 13.4751V26.9502H25.9521V13.4751C25.9521 6.02794 20.1333 0 12.9761 0Z"
        className="fill-[#4586F7] dark:fill-white"
      />
      <path
        d="M25.9521 39.5181H0V66.4682H25.9521V39.5181Z"
        className="fill-[#4586F7] dark:fill-white"
      />
    </svg>
  );
}

function SidebarLogo() {
  const { open } = useSidebar();

  return (
    <div className="flex items-center justify-center px-2">
      {open ? (
        <AdfidenceLogo className="h-5 w-auto shrink-0" />
      ) : (
        <AdfidenceIcon className="size-5 shrink-0" />
      )}
    </div>
  );
}

function SidebarUser() {
  const { open } = useSidebar();
  const { openSettings } = useSettings();

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
        <DropdownMenuItem onClick={openSettings}>
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
  const pathname = usePathname();
  const isAiChat = pathname === "/";
  const isDashboard = pathname === "/demo";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-transparent [&>[data-sidebar=sidebar]]:bg-transparent"
    >
      <SidebarHeader className="px-2 py-4">
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isAiChat}
                  tooltip="AI Chat"
                  className="nav-glass-active"
                >
                  <Link href="/">
                    <MessageCircle style={{ stroke: "url(#ai-chat-gradient)" }} />
                    <svg width="0" height="0" className="absolute">
                      <defs>
                        <linearGradient id="ai-chat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4586F7" />
                          <stop offset="100%" stopColor="#7aaafb" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span
                      className="font-semibold bg-clip-text text-transparent"
                      style={{ backgroundImage: "linear-gradient(135deg, #4586F7, #7aaafb)" }}
                    >
                      AI Chat
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.title === "Home" && isDashboard}
                    tooltip={item.title}
                    className="nav-glass-active"
                  >
                    <Link href={item.title === "Home" ? "/demo" : "#"}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
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
