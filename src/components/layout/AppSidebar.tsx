
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
import { House, Calendar, CalendarDays, Users, BookUser, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/schedule", label: "일정", icon: Calendar },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/students", label: "내담자", icon: Users },
  { href: "/records", label: "상담 목록", icon: BookUser },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const isRecordsPage = pathname.startsWith('/records');

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-4 py-5 border-b border-sidebar-border">
            <h1 className="text-2xl font-headline text-sidebar-foreground">Wee-Couns</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === "/records" ? isRecordsPage : pathname === item.href}
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
