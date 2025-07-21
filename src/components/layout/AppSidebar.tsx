
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
import { House, Calendar, CalendarDays, Users, BookUser } from "lucide-react";

const menuItems = [
  { href: "/", label: "Home", icon: House },
  { href: "/schedule", label: "일정", icon: Calendar },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/students", label: "내담자", icon: Users },
  { href: "/records", label: "상담 목록", icon: BookUser },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isRecordsPage = pathname.startsWith('/records');

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-4">
            <h1 className="text-3xl font-headline text-primary-foreground/90">WeeClass</h1>
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
        {/* Can add user profile or settings here later */}
      </SidebarFooter>
    </Sidebar>
  );
}
