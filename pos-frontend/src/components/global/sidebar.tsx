"use client";

import { Calculator, NotebookPen, Truck, ShoppingCart, Home as IconInnerShadowTop, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "@/lib/axios";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader
} from "@/components/ui/sidebar";

// ...existing code...
const main = [
  {
    title: "Dashboard",
    url: "/dashboard/db",
    icon: LayoutDashboard,
  },
  {
    title: "Point of Sale",
    url: "/dashboard/main",
    icon: Calculator,
  },
];

// Inventory Management
const inventory = [
  {
    title: "Products",
    url: "/dashboard/products",
    icon: NotebookPen,
  },
  {
    title: "Stock Movements",
    url: "/dashboard/stock",
    icon: Truck,
  },
  // {
  //   title: "Categories",
  //   url: "/dashboard/asdasda",
  //   icon: Calculator,
  // },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loadingLogout, setLoadingLogout] = useState(false);

  async function handleLogout() {
    setLoadingLogout(true);
    try {
      // call backend to clear refresh token cookie / server-side state
      await axios.post('/auth/logout');
    } catch (err) {
      // ignore network/backend errors — still clear client state and redirect
      console.warn('Logout request failed', err);
    } finally {
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } catch (e) { }
      setLoadingLogout(false);
      router.push('/login');
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className=" h-full w-full flex items-center justify-center">
                <Image src="/img/logo1.png" alt="App logo" width={50} height={50} />

              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Inventory Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventory.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account / Logout group */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left"
                    type="button"
                    disabled={loadingLogout}
                  >
                    <LogOut />
                    <span>{loadingLogout ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}