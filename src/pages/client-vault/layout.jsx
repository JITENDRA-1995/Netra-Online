import React, { useState, useEffect, useRef } from "react";
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
  Menu,
  X,
  Bell
} from "lucide-react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

import { supabase } from "../../supabase/client";
import { fetchClientProjects } from "../../supabase/database/clientVault";
import { AnimatePresence, motion } from "framer-motion";

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
  setSelectedProjectId,
  setSelectedInvoiceId,
  children 
}) {
  const { setOpenMobile, isMobile } = useSidebar();

  const [notifications, setNotifications] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [clientProjectIds, setClientProjectIds] = useState([]);
  const clientProjectIdsRef = useRef([]);

  // Fetch client projects to identify which project IDs belong to this client
  useEffect(() => {
    if (!currentClient?.id) return;
    const loadProjects = async () => {
      try {
        const data = await fetchClientProjects(currentClient.id);
        if (data) {
          const ids = data.map(p => p.id);
          setClientProjectIds(ids);
          clientProjectIdsRef.current = ids;
        }
      } catch (err) {
        console.error("Error loading client projects for notifications:", err);
      }
    };
    loadProjects();
  }, [currentClient]);

  const checkIsClientProject = async (projectId, clientId) => {
    try {
      const { data } = await supabase.from('projects').select('id, client_id').eq('id', projectId).single();
      return data && String(data.client_id) === String(clientId);
    } catch (e) {
      return false;
    }
  };

  const handleViewNotif = (notif) => {
    // 1. Dismiss/remove notification
    setNotifications(prev => prev.filter(x => x.id !== notif.id));

    // 2. Perform navigation based on notification type
    if (notif.type === 'final_invoice' || notif.type === 'micro_job_invoice') {
      // Navigate to the specific invoice
      if (setSelectedInvoiceId && notif.invoice_id) {
        setSelectedInvoiceId(notif.invoice_id);
        onTabChange("INVOICE_DETAIL");
      } else {
        onTabChange("INVOICES");
      }
    } else if (notif.type === 'communication') {
      // Navigate to the specific project's communication/chat
      if (setSelectedProjectId && notif.project_id) {
        setSelectedProjectId(notif.project_id);
      }
      onTabChange("COMMUNICATION");
    } else if (notif.type === 'new_asset') {
      // Navigate to the project's asset detail
      if (setSelectedProjectId && notif.project_id) {
        setSelectedProjectId(notif.project_id);
        onTabChange("PROJECT_DETAIL");
      } else {
        onTabChange("GLOBAL_ASSETS");
      }
    } else if (['project_ignited', 'project_completed', 'milestone_changed'].includes(notif.type)) {
      // Navigate to the specific project detail
      if (setSelectedProjectId && notif.project_id) {
        setSelectedProjectId(notif.project_id);
        onTabChange("PROJECT_DETAIL");
      } else {
        onTabChange("PROJECTS");
      }
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentClient?.id) return;

    // 1. Projects subscription (for ignition and milestones/completion)
    const projectsChannel = supabase
      .channel(`client-portal-projects-${currentClient.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async (payload) => {
        if (payload.new && String(payload.new.client_id) === String(currentClient.id)) {
          if (payload.eventType === 'INSERT') {
            const newNotif = {
              id: `ignite-${payload.new.id}-${Date.now()}`,
              project_id: payload.new.id,
              type: 'project_ignited',
              title: '🚀 Project Ignited!',
              message: `Your project "${payload.new.service || payload.new.title}" has been successfully started.`,
              timestamp: new Date()
            };
            setNotifications(prev => [newNotif, ...prev]);
            setIsMinimized(false);
            clientProjectIdsRef.current = [...new Set([...clientProjectIdsRef.current, payload.new.id])];
            setClientProjectIds(clientProjectIdsRef.current);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status === 'Completed' && payload.old?.status !== 'Completed') {
              const newNotif = {
                id: `completed-${payload.new.id}-${Date.now()}`,
                project_id: payload.new.id,
                type: 'project_completed',
                title: '🎉 Project Completed!',
                message: `Congratulations! Your project "${payload.new.service || payload.new.title}" is completed.`,
                timestamp: new Date()
              };
              setNotifications(prev => [newNotif, ...prev]);
              setIsMinimized(false);
            } else if (payload.new.progressPercent !== payload.old?.progressPercent) {
              const newNotif = {
                id: `milestone-${payload.new.id}-${payload.new.progressPercent}-${Date.now()}`,
                project_id: payload.new.id,
                type: 'milestone_changed',
                title: '🎯 Milestone Updated',
                message: `Project "${payload.new.service || payload.new.title}" progress is now at ${payload.new.progressPercent}%.`,
                timestamp: new Date()
              };
              setNotifications(prev => [newNotif, ...prev]);
              setIsMinimized(false);
            }
          }
        }
      })
      .subscribe();

    // 2. Project Media subscription (for deliverables)
    const mediaChannel = supabase
      .channel(`client-portal-media-${currentClient.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_media' }, async (payload) => {
        const newMedia = payload.new;
        if (newMedia && newMedia.uploaded_by?.toLowerCase() === 'admin') {
          const isClientProject = clientProjectIdsRef.current.includes(newMedia.project_id) || 
            await checkIsClientProject(newMedia.project_id, currentClient.id);

          if (isClientProject) {
            const newNotif = {
              id: `media-${newMedia.id}-${Date.now()}`,
              project_id: newMedia.project_id,
              type: 'new_asset',
              title: '📁 New Asset Added',
              message: `A new deliverable "${newMedia.file_name || 'file'}" is ready in your vault.`,
              timestamp: new Date()
            };
            setNotifications(prev => [newNotif, ...prev]);
            setIsMinimized(false);
          }
        }
      })
      .subscribe();

    // 3. Project Chats subscription (for communication)
    const chatsChannel = supabase
      .channel(`client-portal-chats-${currentClient.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_chats' }, async (payload) => {
        const newMsg = payload.new;
        if (newMsg && newMsg.sender?.toLowerCase() === 'admin') {
          const isClientProject = clientProjectIdsRef.current.includes(newMsg.project_id) || 
            await checkIsClientProject(newMsg.project_id, currentClient.id);

          if (isClientProject) {
            const newNotif = {
              id: `chat-${newMsg.id}-${Date.now()}`,
              project_id: newMsg.project_id,
              type: 'communication',
              title: '💬 New Message from Netra',
              message: `"${newMsg.message.substring(0, 50)}${newMsg.message.length > 50 ? '...' : ''}"`,
              timestamp: new Date()
            };
            setNotifications(prev => [newNotif, ...prev]);
            setIsMinimized(false);
          }
        }
      })
      .subscribe();

    // 4. Invoices subscription (for both regular and micro-job/CMS invoices)
    const invoicesChannel = supabase
      .channel(`client-portal-invoices-${currentClient.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, async (payload) => {
        if (!payload.new) return;

        // Match by client_id (regular/project invoices) OR client_link (CMS/micro-job invoices)
        const isForClient =
          (payload.new.client_id && String(payload.new.client_id) === String(currentClient.id)) ||
          (payload.new.client_link && String(payload.new.client_link) === String(currentClient.id));

        if (!isForClient) return;

        const isNewOrStatusChanged =
          payload.eventType === 'INSERT' ||
          (payload.eventType === 'UPDATE' && payload.new.payment_status !== payload.old?.payment_status);

        if (!isNewOrStatusChanged) return;

        // Detect micro-job / CMS invoice
        const isMicroJobInvoice =
          (Array.isArray(payload.new.micro_job_ids) && payload.new.micro_job_ids.length > 0) ||
          (typeof payload.new.micro_job_ids === 'string' && payload.new.micro_job_ids !== '[]' && payload.new.micro_job_ids !== 'null') ||
          (payload.new.invoice_no && String(payload.new.invoice_no).startsWith('CMS'));

        if (isMicroJobInvoice) {
          const grandTotal = payload.new.grand_total || payload.new.total || payload.new.amount || '—';
          const invNo = payload.new.invoice_no || payload.new.invoice_number || 'CMS';
          const payStatus = payload.new.payment_status || 'Pending';
          const newNotif = {
            id: `microjob-invoice-${payload.new.id}-${Date.now()}`,
            invoice_id: payload.new.id,
            type: 'micro_job_invoice',
            title: '🔧 Micro-Job Invoice Generated',
            message: `Invoice #${invNo} totalling ₹${grandTotal} has been issued (${payStatus}).`,
            timestamp: new Date()
          };
          setNotifications(prev => [newNotif, ...prev]);
          setIsMinimized(false);
        } else {
          const newNotif = {
            id: `invoice-${payload.new.id}-${Date.now()}`,
            invoice_id: payload.new.id,
            type: 'final_invoice',
            title: '🧾 New Invoice Details',
            message: `Invoice #${payload.new.invoice_number || payload.new.invoice_no || 'draft'} for ₹${payload.new.amount || payload.new.total} is ${payload.new.payment_status || payload.new.status || 'generated'}.`,
            timestamp: new Date()
          };
          setNotifications(prev => [newNotif, ...prev]);
          setIsMinimized(false);
        }
      })
      .subscribe();

    return () => {
      projectsChannel.unsubscribe();
      mediaChannel.unsubscribe();
      chatsChannel.unsubscribe();
      invoicesChannel.unsubscribe();
    };
  }, [currentClient]);

  const getNotifColor = (type) => {
    switch (type) {
      case 'project_ignited': return '#06b6d4'; // Cyan
      case 'milestone_changed': return '#8b5cf6'; // Purple
      case 'new_asset': return '#10b981'; // Emerald
      case 'communication': return '#3b82f6'; // Blue
      case 'project_completed': return '#eab308'; // Amber
      case 'final_invoice': return '#f43f5e'; // Rose
      case 'micro_job_invoice': return '#f97316'; // Orange
      default: return '#64748b'; // Slate
    }
  };

  const getNotifIconEmoji = (type) => {
    switch (type) {
      case 'project_ignited': return '🚀';
      case 'milestone_changed': return '🎯';
      case 'new_asset': return '📁';
      case 'communication': return '💬';
      case 'project_completed': return '🎉';
      case 'final_invoice': return '🧾';
      case 'micro_job_invoice': return '🔧';
      default: return '🔔';
    }
  };

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

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Real-time Client Portal Notification System */}
      <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-sm w-auto md:w-full z-50 pointer-events-none flex flex-col items-end gap-3">
        {/* Minimized Bubble */}
        <AnimatePresence>
          {isMinimized && notifications.length > 0 && (
            <motion.button
              initial={{ scale: 0, y: -50 }}
              animate={{ 
                scale: 1, 
                y: 0,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              exit={{ scale: 0, y: -20 }}
              onClick={() => setIsMinimized(false)}
              className={`pointer-events-auto mr-12 md:mr-16 flex items-center justify-center w-12 h-12 rounded-full shadow-lg border cursor-pointer relative active:scale-95 transition-shadow duration-300
                ${theme === 'dark' 
                  ? 'bg-slate-900/90 text-cyan-400 border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                  : 'bg-white/95 text-cyan-500 border-cyan-200 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                }`}
              style={{
                outline: 'none'
              }}
              title="Restore client notifications"
            >
              {/* Pulse Ring */}
              <span className="absolute -inset-0.5 rounded-full bg-cyan-500/10 animate-ping opacity-75" />
              
              {/* Icon */}
              <Bell className="w-5 h-5 animate-pulse" />
              
              {/* Badge Counter */}
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
                {notifications.length}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Notification Popup Stack */}
        <AnimatePresence>
          {!isMinimized && notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              className="w-full flex flex-col gap-3 pointer-events-auto"
            >
              {/* Render notifications (up to 3) */}
              {notifications.slice(0, 3).map((notif, index) => {
                const isTop = index === 0;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`relative p-4 rounded-2xl border backdrop-blur-md shadow-xl transition-all duration-300 w-full flex gap-3
                      ${theme === 'dark' 
                        ? 'bg-slate-950/95 text-slate-100 border-slate-800' 
                        : 'bg-white/95 text-slate-800 border-slate-200'
                      }`}
                  >
                    {/* Color indicator stripe */}
                    <div 
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md"
                      style={{ backgroundColor: getNotifColor(notif.type) }}
                    />
                    
                    {/* Icon container */}
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-lg"
                      style={{ 
                        background: `${getNotifColor(notif.type)}15`,
                        color: getNotifColor(notif.type)
                      }}
                    >
                      {getNotifIconEmoji(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5 text-foreground flex items-center gap-1.5">
                        {notif.title}
                        {isTop && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </h4>
                      <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => setIsMinimized(true)}
                          className={`text-[10px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1
                            ${theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'}`}
                        >
                          Minimize
                        </button>
                        <button
                          onClick={() => handleViewNotif(notif)}
                          className={`text-[10px] font-bold uppercase tracking-wider hover:underline
                            ${theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-500'}`}
                        >
                          View
                        </button>
                      </div>
                    </div>

                    {/* Close button */}
                    <button 
                      onClick={() => setNotifications(prev => prev.filter(x => x.id !== notif.id))}
                      className={`absolute top-3 right-3 p-1 rounded-md transition-colors cursor-pointer
                        ${theme === 'dark' ? 'hover:bg-white/5 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}

              {notifications.length > 3 && (
                <div className={`text-right text-[10px] font-semibold pr-2 -mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  + {notifications.length - 3} more notifications
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
