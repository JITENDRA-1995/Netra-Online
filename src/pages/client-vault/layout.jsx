import React, { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "../../components/ui/sidebar";
import { 
  LayoutDashboard, 
  FolderKanban, 
  MessageSquare,
  Receipt, 
  UserCircle,
  LogOut,
  Hexagon,
  Sun,
  Moon,
  FolderOpen,
  Menu
} from "lucide-react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { WhatsNewBulb } from "../../components/WhatsNewBulb";

function ClientSidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      className="p-2.5 -ml-1 rounded-xl bg-card border border-border hover:border-primary/30 text-muted-foreground hover:text-primary shadow-sm hover:shadow transition-all duration-200 cursor-pointer flex items-center justify-center active:scale-95"
      aria-label="Toggle Menu"
    >
      <Menu className="h-5 w-5 stroke-[2.5]" />
    </button>
  );
}

const navItems = [
  { title: "Dashboard", tab: "DASHBOARD", icon: LayoutDashboard },
  { title: "Projects", tab: "PROJECTS", icon: FolderKanban },
  { title: "Asset Vault", tab: "GLOBAL_ASSETS", icon: FolderOpen },
  { title: "Communication", tab: "COMMUNICATION", icon: MessageSquare },
  { title: "Invoices", tab: "INVOICES", icon: Receipt },
  { title: "Profile", tab: "PROFILE", icon: UserCircle },
];

function ClientVaultLayoutContent({ 
  currentClient, 
  activeTab, 
  onTabChange, 
  onLogout, 
  theme,
  setTheme,
  children 
}) {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleTabChange = (tab) => {
    onTabChange(tab);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isTabActive = (itemTab) => {
    if (itemTab === "PROJECTS") {
      return ["PROJECTS", "PROJECT_DETAIL", "MESSAGES"].includes(activeTab);
    }
    if (itemTab === "INVOICES") {
      return ["INVOICES", "INVOICE_DETAIL"].includes(activeTab);
    }
    return activeTab === itemTab;
  };

  return (
    <div className={`flex min-h-screen w-full bg-background text-foreground client-vault-theme ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar className="border-r border-border bg-card">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3 font-serif">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <img src="/logo.png" alt="Netra Logo" className="h-5 w-5 object-contain" />
            </div>
            <span className="text-xs font-black tracking-widest text-foreground uppercase" style={{ letterSpacing: '0.1em' }}>NETRA GRAPHICS</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4 py-2">
          <SidebarMenu>
            {navItems.map((item) => {
              const active = isTabActive(item.tab);
              return (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton 
                    isActive={active} 
                    tooltip={item.title}
                    onClick={() => handleTabChange(item.tab)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 py-2 w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/50">
          <div className="flex flex-col gap-1">
            {/* 3. User's Profile Name */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/10 border border-border/30 mb-2">
              <Avatar className="h-9 w-9 border border-border shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {currentClient?.name?.charAt(0).toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-sm truncate">
                <span className="font-semibold text-foreground truncate" title={currentClient?.name}>
                  {currentClient?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  Client Account
                </span>
              </div>
            </div>

            {/* 2. Theme Mode */}
            <button 
              onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
              className="flex items-center gap-3 w-full text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm font-medium cursor-pointer"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>



            {/* 1. Log Out */}
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 w-full text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm font-medium cursor-pointer"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <header className="h-16 flex items-center justify-center px-6 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-10 md:hidden relative">
          <div className="absolute left-6">
            <ClientSidebarTrigger />
          </div>
          <div className="flex items-center gap-2 font-serif">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <img src="/logo.png" alt="Netra Logo" className="h-4.5 w-4.5 object-contain" />
            </div>
            <span className="text-[11px] font-black tracking-widest text-foreground uppercase" style={{ letterSpacing: '0.1em' }}>NETRA GRAPHICS</span>
          </div>
        </header>
        <div className="absolute top-3 right-6 z-50 md:top-4">
          <WhatsNewBulb isClientPortal={true} />
        </div>
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export function ClientVaultLayout(props) {
  return (
    <SidebarProvider>
      <ClientVaultLayoutContent {...props} />
    </SidebarProvider>
  );
}
