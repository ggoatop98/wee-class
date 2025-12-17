
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { House, Calendar, CalendarDays, Users, BookUser, LogOut, BarChart, UserCog, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/schedule", label: "일정", icon: Calendar },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/students", label: "내담자", icon: Users },
  { href: "/records", label: "상담 목록", icon: BookUser },
  { href: "/statistics", label: "상담 통계", icon: BarChart },
  { href: "/community", label: "자유게시판", icon: MessageSquare },
  { href: "/account", label: "계정 관리", icon: UserCog },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  
  const getIsActive = (itemHref: string) => {
    if (itemHref === "/dashboard") return pathname === itemHref || pathname === "/";
    if (itemHref === "/records") return pathname.startsWith('/records');
    if (itemHref === "/community") return pathname.startsWith('/community');
    return pathname === itemHref;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-5 border-b border-sidebar-border">
          <Link href="/">
            <h1 className="text-2xl font-headline text-sidebar-foreground">Wee-Couns</h1>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={getIsActive(item.href)}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2">
            <div className="text-sm text-center text-sidebar-foreground/70 mb-2 truncate">
                {user?.email}
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
