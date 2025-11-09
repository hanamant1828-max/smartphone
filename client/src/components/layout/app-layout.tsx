import { useState } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Database,
  Upload,
  Barcode,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

export default function AppLayout({ children, currentPage = "dashboard" }: AppLayoutProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "#dashboard" },
    { id: "inventory", label: "Inventory", icon: Package, href: "#inventory" },
    { id: "pos", label: "Point of Sale", icon: ShoppingCart, href: "#pos" },
    { id: "add-product", label: "Add Product", icon: Package, href: "#add-product" },
    { id: "import-products", label: "Import Products", icon: Upload, href: "#import-products" },
    { id: "barcode-generator", label: "Barcode Generator", icon: Barcode, href: "#barcode-generator" },
    { id: "low-stock-alerts", label: "Low Stock Alerts", icon: AlertTriangle, href: "#low-stock-alerts" },
    { id: "inventory-reports", label: "Inventory Reports", icon: FileText, href: "#inventory-reports" },
    { id: "customers", label: "Customers", icon: Users, href: "#customers" },
    { id: "sales", label: "Sales History", icon: TrendingUp, href: "#sales" },
    { id: "reports", label: "Reports", icon: BarChart3, href: "#reports" },
    { id: "master-data", label: "Master Data", icon: Database, href: "#master-data" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.hash = "#login";
    window.location.reload();
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Mobile Shop</span>
                <span className="text-xs text-muted-foreground">Management System</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPage === item.id}
                  >
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-3 px-2 py-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@shop.com</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>
          <main className="flex-1 overflow-auto bg-muted/40">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}