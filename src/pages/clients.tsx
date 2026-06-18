import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Building2, Mail, Phone, Calendar, Key, Copy, Share2, UserCheck, MessageSquare, Send, FileText, X, AlertCircle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../supabase/client";
import { ClientAssetVault } from "../components/ClientAssetVault";
import { igniteProject } from "../supabase/database/projects";
import { approveClientProfileUpdate, rejectClientProfileUpdate } from "../supabase/database/clients";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  joinedDate?: string;
  gst?: string;
  accessKey?: string;
  access_key?: string;
  pending_profile_update?: { name?: string; phone?: string; address?: string; } | null;
}

interface ClientsProps {
  clients: Client[];
  ignitionQueue: any[];
  onOpenCreateClient: () => void;
  onOpenEditClient: (client: Client) => void;
  onDeleteClient: (id: number) => void;
}

const INDUSTRY_COLORS = ["#00d4ff", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#f97316"];

const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } } 
};
const itemVariants = { 
  hidden: { opacity: 0, y: 16 }, 
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } 
};

export default function Clients({
  clients = [],
  ignitionQueue = [],
  onOpenCreateClient,
  onOpenEditClient,
  onDeleteClient
}: ClientsProps) {
  const [search, setSearch] = useState("");

  // States for Review Changes modal
  const [reviewClient, setReviewClient] = useState<Client | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // States for Conversation Bridge modal
  const [bridgeClient, setBridgeClient] = useState<Client | null>(null);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [bridgeProjects, setBridgeProjects] = useState<any[]>([]);
  const [selectedBridgeProject, setSelectedBridgeProject] = useState<any | null>(null);
  const [bridgeMessages, setBridgeMessages] = useState<any[]>([]);
  const [bridgeContent, setBridgeContent] = useState("");
  const [isBridgeLoading, setIsBridgeLoading] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultClient, setVaultClient] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bridgeMessages]);

  // Handle Review Approvals & Rejections
  const handleApprove = async () => {
    if (!reviewClient || !reviewClient.pending_profile_update) return;
    setIsActionLoading(true);
    try {
      await approveClientProfileUpdate(reviewClient.id, reviewClient.pending_profile_update);
      alert("Changes approved successfully! Profile will reflect updates shortly.");
      setIsReviewModalOpen(false);
      setReviewClient(null);
    } catch (err) {
      console.error(err);
      alert("Failed to approve changes.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewClient) return;
    setIsActionLoading(true);
    try {
      await rejectClientProfileUpdate(reviewClient.id);
      alert("Changes rejected successfully.");
      setIsReviewModalOpen(false);
      setReviewClient(null);
    } catch (err) {
      console.error(err);
      alert("Failed to reject changes.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Conversation Bridge project loading & general chat ignite
  const handleOpenBridge = async (client: Client) => {
    setBridgeClient(client);
    setIsBridgeModalOpen(true);
    setIsBridgeLoading(true);
    setBridgeMessages([]);
    setBridgeContent("");

    // Find client's projects
    const projects = ignitionQueue.filter(p => 
      String(p.client_id) === String(client.id) || 
      String(p.client?.id) === String(client.id) ||
      p.name?.trim().toLowerCase() === client.name?.trim().toLowerCase()
    );

    if (projects.length > 0) {
      setBridgeProjects(projects);
      setSelectedBridgeProject(projects[0]);
      setIsBridgeLoading(false);
    } else {
      // Auto-create General Support & Chat project
      try {
        const milestoneNames = ["Discovery", "Moodboard", "Sketching", "Printing", "Final Flame"];
        const savedProjCore = await igniteProject({
          name: client.name,
          service: "General Support & Chat",
          stage: 1,
          progress: 20,
          status: "Active",
          priority: "Normal",
          alertMeDays: "",
          description: "General support and direct communication channel between client and admin.",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          client_id: client.id,
          qty: 1,
          rate: 0,
          quote: 0,
          discountValue: "0",
          discountType: "rs",
          discountPercent: "0",
          discount: 0,
          advanceAmount: 0,
          paymentStatus: "paid",
          milestones: milestoneNames.map((name, idx) => ({ name, completed: name === "Discovery" }))
        });

        const newProj = {
          id: savedProjCore.id,
          name: client.name,
          service: "General Support & Chat",
          stage: 1,
          progress: 20,
          status: "Active",
          priority: "Normal",
          client_id: client.id,
          client: {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address
          }
        };

        setBridgeProjects([newProj]);
        setSelectedBridgeProject(newProj);
      } catch (err) {
        console.error("Failed to auto-create support project:", err);
        alert("Failed to initialize conversation support channel.");
        setIsBridgeModalOpen(false);
      } finally {
        setIsBridgeLoading(false);
      }
    }
  };

  // Real-time Chat Subscription for selected project in bridge modal
  useEffect(() => {
    if (!isBridgeModalOpen || !selectedBridgeProject) {
      setBridgeMessages([]);
      return;
    }

    // Load initial chat messages
    const loadChats = async () => {
      try {
        const { data, error } = await supabase
          .from('project_chats')
          .select('*')
          .eq('project_id', selectedBridgeProject.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setBridgeMessages(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadChats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`bridge-project-chat-${selectedBridgeProject.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_chats',
          filter: `project_id=eq.${selectedBridgeProject.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;
            setBridgeMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldMsg = payload.old;
            setBridgeMessages(prev => prev.filter(m => m.id !== oldMsg.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [selectedBridgeProject, isBridgeModalOpen]);

  // Send message from Admin Bridge
  const handleSendMessage = async () => {
    if (!bridgeContent.trim() || !selectedBridgeProject) return;
    const text = bridgeContent.trim();
    setBridgeContent("");
    try {
      const { data, error } = await supabase
        .from('project_chats')
        .insert([
          {
            project_id: selectedBridgeProject.id,
            sender: "admin",
            message: text
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setBridgeMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }

      await supabase
        .from('project_activity_logs')
        .insert([
          {
            project_id: selectedBridgeProject.id,
            action: `Admin sent message: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
          }
        ]);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message.");
    }
  };

  // Clear Chat history from Admin Bridge
  const handleClearBridgeChat = async () => {
    if (!selectedBridgeProject) return;
    const confirmClear = window.confirm("Are you sure you want to permanently clear the conversation history for this project/channel?");
    if (!confirmClear) return;

    try {
      const { error } = await supabase
        .from('project_chats')
        .delete()
        .eq('project_id', selectedBridgeProject.id);

      if (error) throw error;

      setBridgeMessages([]);

      await supabase
        .from('project_activity_logs')
        .insert([
          {
            project_id: selectedBridgeProject.id,
            action: `Admin cleared chat history.`
          }
        ]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
      alert("Failed to clear conversation history.");
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.email !== "settings@netra.graphics" && (
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" data-testid="heading-clients">
            Clients CRM
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">{filtered.length} total visionaries</p>
        </div>
        <Button
          onClick={onOpenCreateClient}
          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 gap-2 font-bold text-xs rounded-xl"
          data-testid="button-create-client"
        >
          <Plus className="w-4 h-4" />
          ADD NEW VISIONARY
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-white/5 border-white/10 rounded-xl text-foreground bg-[#0a0f1e]/40"
          placeholder="Search client visionaries by name, address, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-clients"
        />
      </motion.div>

      {/* Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((client, i) => {
          const color = INDUSTRY_COLORS[i % INDUSTRY_COLORS.length];
          const initials = client.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          // Dynamically compute project counts and total revenue from ignitionQueue
          const clientProjects = ignitionQueue.filter(
            (p) => p.name.trim().toLowerCase() === client.name.trim().toLowerCase()
          );
          const totalProjectsCount = clientProjects.length;
          const totalRevenueAmt = clientProjects
            .filter((p) => p.paymentStatus === "paid" || p.paymentStatus === "part")
            .reduce((sum, p) => sum + (parseFloat(p.quote) || 0), 0);

          return (
            <motion.div
              key={client.id}
              variants={itemVariants}
              className={`group relative rounded-2xl border bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all flex flex-col justify-between ${
                client.status === 'Suspended' ? 'border-red-500/20 opacity-60' : 'border-white/5'
              }`}
              style={{ background: client.status === 'Suspended' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, transparent 100%)' : `linear-gradient(135deg, ${color}03 0%, transparent 100%)` }}
              data-testid={`card-client-${client.id}`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ 
                        background: client.status === 'Suspended' ? 'rgba(239, 68, 68, 0.15)' : `${color}15`, 
                        border: client.status === 'Suspended' ? '1px solid rgba(239, 68, 68, 0.3)' : `1px solid ${color}30`, 
                        color: client.status === 'Suspended' ? '#f87171' : color 
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm">{client.name}</p>
                        {client.status === 'Suspended' && (
                          <span className="px-1.5 py-0.5 text-[8.5px] font-extrabold rounded bg-red-500/15 text-red-400 border border-red-500/20 uppercase tracking-widest">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[150px]">{client.address || "No Address"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-7 h-7 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 border border-white/5" 
                      onClick={() => onOpenEditClient(client)} 
                      data-testid={`button-edit-client-${client.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="w-7 h-7 rounded-lg hover:bg-red-500/10 hover:text-red-400 border border-white/5" 
                      onClick={() => onDeleteClient(client.id)} 
                      data-testid={`button-delete-client-${client.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground py-2 border-y border-white/5 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.joinedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Joined {client.joinedDate}</span>
                    </div>
                  )}
                  {client.gst && (
                    <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/5">
                      <span className="client-gst-badge px-2 py-0.5 text-[9px] font-extrabold rounded bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 uppercase tracking-widest">
                        GST: {client.gst}
                      </span>
                    </div>
                  )}

                  {/* Access Key Display */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-bold">
                        KEY: {client.accessKey || client.access_key || "N/A"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {client.pending_profile_update && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Review Pending Changes"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewClient(client);
                            setIsReviewModalOpen(true);
                          }}
                          className="w-6 h-6 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all relative"
                        >
                          <FileText className="w-3 h-3" />
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        title="Conversation Bridge"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBridge(client);
                        }}
                        className="w-6 h-6 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVaultClient(client);
                          setIsVaultModalOpen(true);
                        }}
                        className="w-6 h-6 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all"
                      >
                        <FolderOpen className="w-3 h-3" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        title="Copy Login Credentials"
                        onClick={(e) => {
                          e.stopPropagation();
                          const keyText = client.accessKey || client.access_key || "";
                          const textToCopy = `Portal URL: ${window.location.origin}\nEmail: ${client.email}\nPasscode: ${keyText}`;
                          navigator.clipboard.writeText(textToCopy);
                          alert("Credentials copied to clipboard!");
                        }}
                        className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-cyan-400 border border-white/5 transition-all"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {client.phone && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Share on WhatsApp"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Clean phone number: remove non-digits, and leading 0
                            let cleanPhone = client.phone.replace(/\D/g, "");
                            if (cleanPhone.startsWith("0")) {
                              cleanPhone = cleanPhone.substring(1);
                            }
                            // Prepend 91 if it's 10 digits
                            if (cleanPhone.length === 10) {
                              cleanPhone = "91" + cleanPhone;
                            }
                            const keyText = client.accessKey || client.access_key || "";
                            const message = `Hi ${client.name}, your Netra Graphics portal is active! Access it here: ${window.location.origin} using your Email: ${client.email} and Passcode: ${keyText}`;
                            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, "_blank");
                          }}
                          className="w-6 h-6 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-3xs text-muted-foreground uppercase tracking-wider">Active Missions</p>
                  <p className="text-base font-extrabold text-foreground mt-0.5">{totalProjectsCount}</p>
                </div>
                <div>
                  <p className="text-3xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                  <p className="text-base font-extrabold text-foreground mt-0.5" style={{ color }}>
                    ₹{totalRevenueAmt.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-20 text-muted-foreground border border-white/5 rounded-2xl">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="uppercase tracking-widest text-3xs font-semibold">NO VISIONARIES MATCHED CLIENTS MATRIX</p>
          </div>
        )}
      </motion.div>

      {/* Review Changes Modal */}
      <AnimatePresence>
        {isReviewModalOpen && reviewClient && reviewClient.pending_profile_update && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1e]/95 p-6 shadow-2xl backdrop-blur-md text-left overflow-hidden"
            >
              <div className="absolute top-4 right-4">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsReviewModalOpen(false)}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2 uppercase tracking-wide">
                <UserCheck className="w-5 h-5 text-amber-400" />
                Review Profile Updates
              </h3>
              <p className="text-3xs text-muted-foreground uppercase tracking-wider mb-6">
                Client: {reviewClient.name} ({reviewClient.email})
              </p>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {/* Comparison Grid */}
                <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4 text-xs">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">CURRENT INFO</div>
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">PROPOSED INFO</div>
                </div>

                {/* Name */}
                {reviewClient.pending_profile_update.name && reviewClient.pending_profile_update.name !== reviewClient.name && (
                  <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Name</span>
                      <span className="text-xs text-white/50 break-words">{reviewClient.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-amber-400 uppercase block mb-1">Name</span>
                      <span className="text-xs text-emerald-400 font-bold break-words">{reviewClient.pending_profile_update.name}</span>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {reviewClient.pending_profile_update.phone && reviewClient.pending_profile_update.phone !== reviewClient.phone && (
                  <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Phone</span>
                      <span className="text-xs text-white/50 break-words">{reviewClient.phone || "None"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-amber-400 uppercase block mb-1">Phone</span>
                      <span className="text-xs text-emerald-400 font-bold break-words">{reviewClient.pending_profile_update.phone}</span>
                    </div>
                  </div>
                )}

                {/* Address */}
                {reviewClient.pending_profile_update.address && reviewClient.pending_profile_update.address !== reviewClient.address && (
                  <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Address</span>
                      <span className="text-xs text-white/50 break-words whitespace-pre-line">{reviewClient.address || "None"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-amber-400 uppercase block mb-1">Address</span>
                      <span className="text-xs text-emerald-400 font-bold break-words whitespace-pre-line">{reviewClient.pending_profile_update.address}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8 pt-4 border-t border-white/5">
                <Button 
                  onClick={handleReject}
                  disabled={isActionLoading}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-bold py-2 rounded-xl text-xs"
                >
                  REJECT CHANGES
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={isActionLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold py-2 rounded-xl text-xs"
                >
                  {isActionLoading ? "APPROVING..." : "APPROVE CHANGES"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conversation Bridge Modal */}
      <AnimatePresence>
        {isBridgeModalOpen && bridgeClient && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setIsBridgeModalOpen(false);
                setSelectedBridgeProject(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="relative w-full max-w-3xl h-[600px] rounded-2xl border border-white/10 bg-[#0a0f1e]/95 shadow-2xl backdrop-blur-md text-left overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Conversation Bridge
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    Client: {bridgeClient.name} | Live Real-time Sync
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {bridgeProjects.length > 1 && (
                    <select
                      value={selectedBridgeProject?.id || ""}
                      onChange={(e) => {
                        const proj = bridgeProjects.find(p => String(p.id) === e.target.value);
                        if (proj) setSelectedBridgeProject(proj);
                      }}
                      className="bg-white/5 border border-white/10 text-2xs text-white rounded-lg px-2 py-1 max-w-[180px] focus:outline-none"
                    >
                      {bridgeProjects.map(p => (
                        <option key={p.id} value={p.id} className="bg-[#0a0f1e] text-white">
                          {p.service || p.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedBridgeProject && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearBridgeChat}
                      className="h-8 gap-1.5 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-lg text-2xs font-bold transition-all cursor-pointer"
                      title="Clear Chat History"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      CLEAR
                    </Button>
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => {
                      setIsBridgeModalOpen(false);
                      setSelectedBridgeProject(null);
                    }}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden flex bg-black/20">
                <div className="flex-grow flex flex-col justify-between h-full p-4 overflow-y-auto">
                  {isBridgeLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                      <span>Initializing Connection...</span>
                    </div>
                  ) : bridgeMessages.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground/35 text-[10px] uppercase tracking-widest gap-2">
                      <MessageSquare className="w-8 h-8 opacity-20" />
                      <span>No messages yet. Start conversation.</span>
                    </div>
                  ) : (
                    <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/5">
                      {bridgeMessages.map((msg) => {
                        const isAdmin = msg.sender === 'admin' || msg.sender?.toLowerCase() === 'admin';
                        const isSystem = msg.sender === 'SYSTEM';

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center my-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                                {msg.message}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={msg.id} 
                            className={`flex gap-2.5 max-w-[80%] ${isAdmin ? 'ml-auto flex-row-reverse' : ''}`}
                          >
                            <div 
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 border ${
                                isAdmin 
                                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' 
                                  : 'bg-white/5 border-white/10 text-white'
                              }`}
                            >
                              {isAdmin ? 'AD' : bridgeClient.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className={`space-y-1 ${isAdmin ? 'items-end' : ''}`}>
                              <div className={`flex items-baseline gap-1.5 ${isAdmin ? 'justify-end' : ''}`}>
                                <span className="text-[10px] font-bold text-white/70">{isAdmin ? 'Admin' : msg.sender}</span>
                                <span className="text-[8px] text-muted-foreground font-mono">
                                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                              </div>
                              <div 
                                className={`p-3 rounded-xl text-xs leading-relaxed ${
                                  isAdmin 
                                    ? 'bg-cyan-500/10 text-cyan-100 border border-cyan-500/20 rounded-tr-none' 
                                    : 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Input */}
              <div className="p-4 border-t border-white/5 bg-[#0a0f1e]">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={bridgeContent}
                    onChange={e => setBridgeContent(e.target.value)}
                    disabled={isBridgeLoading || !selectedBridgeProject}
                    placeholder={selectedBridgeProject ? "Transmit realtime message..." : "Awaiting support channel..."}
                    className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                  />
                  <Button
                    type="submit"
                    disabled={isBridgeLoading || !bridgeContent.trim() || !selectedBridgeProject}
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold rounded-xl px-4 h-10 flex-shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVaultModalOpen && vaultClient && (
          <ClientAssetVault client={vaultClient} onClose={() => setIsVaultModalOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
