import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Send,
  Sparkles,
  Zap,
  TrendingUp,
  MapPin,
  Calendar,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateInquiry, deleteInquiry } from "../supabase/database";

interface Inquiry {
  id: number;
  name: string;
  service: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  date: string;
}

interface InquiriesProps {
  inquiries: Inquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  services: any[];
  handleIgniteFromInquiry: (inq: Inquiry) => void;
}

const LOCATION_COLORS = ["#00d4ff", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Inquiries({
  inquiries,
  setInquiries,
  services,
  handleIgniteFromInquiry
}: InquiriesProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [remarkModal, setRemarkModal] = useState<{ open: boolean; inquiryId: number | null; type: "Accepted" | "Rejected" | null }>({
    open: false,
    inquiryId: null,
    type: null
  });
  const [remarkText, setRemarkText] = useState("");

  // Dynamically resolve 5-day expiration for "New Spark" status, format dates and fallbacks
  const resolvedInquiries = useMemo(() => {
    return inquiries.map((inq) => {
      const createdDate = new Date(inq.createdAt || inq.date || Date.now());
      const diffTime = Date.now() - createdDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      let status = inq.status;
      if (status === "New Spark" && diffDays >= 5) {
        status = "Expired";
      }

      const formattedDate = inq.date || createdDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      return {
        ...inq,
        status,
        date: formattedDate,
        location: inq.location || "Remote"
      };
    });
  }, [inquiries]);

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const unread = resolvedInquiries.filter(q => q.status === "New Spark").length;

    // Count top demanded service
    const counts: Record<string, number> = {};
    resolvedInquiries.forEach(q => {
      counts[q.service] = (counts[q.service] || 0) + 1;
    });
    let topService = "None";
    let max = 0;
    Object.entries(counts).forEach(([svc, cnt]) => {
      if (cnt > max) {
        max = cnt;
        topService = svc;
      }
    });

    // Conversion rate
    const ignited = resolvedInquiries.filter(q => q.status.toLowerCase().includes("ignit") || q.status.toLowerCase() === "accepted").length;
    const rate = resolvedInquiries.length > 0 ? Math.round((ignited / resolvedInquiries.length) * 100) : 84;

    return { unread, topService, rate };
  }, [resolvedInquiries]);

  // Filters
  const filtered = resolvedInquiries.filter(inq => {
    const matchSearch = inq.name.toLowerCase().includes(search.toLowerCase()) ||
                        inq.phone.includes(search);
    const matchService = filterService === "all" || inq.service === filterService;
    const matchStatus = filterStatus === "all" || inq.status === filterStatus;
    const matchDate = !filterDate || inq.date === filterDate;
    return matchSearch && matchService && matchStatus && matchDate;
  });

  const getStatusBadgeStyles = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === "new spark") return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    if (lower === "expired") return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    if (lower.includes("ignit") || lower === "accepted") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (lower.includes("extinguish") || lower === "rejected") return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  const handleSendStatus = () => {
    if (!remarkModal.inquiryId) return;
    const inq = resolvedInquiries.find(i => i.id === remarkModal.inquiryId);
    if (!inq) return;

    const actionText = remarkModal.type === "Accepted" ? "Ignited" : "Extinguished";
    const msg = `Hello ${inq.name}, update from Netra Graphics. Your inquiry for "${inq.service}" has been ${actionText}. Remark: ${remarkText}. Let's ignite the future!`;

    // Trigger WhatsApp link
    const cleanPhone = inq.phone.replace(/[\s\-\+]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');

    // Update status locally
    setInquiries(prev => prev.map(i =>
      i.id === remarkModal.inquiryId
        ? { ...i, status: remarkModal.type === "Accepted" ? "Ignited" : "Extinguished" }
        : i
    ));

    toast({
      title: `Inquiry status sent via WhatsApp`,
      description: `Status updated to ${actionText}`
    });

    // Reset Modal
    setRemarkModal({ open: false, inquiryId: null, type: null });
    setRemarkText("");
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent" data-testid="heading-inquiries">
            Inquiries Vault
          </h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-widest uppercase">
            Managing sparks from the contact portal
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs text-cyan-400 font-bold tracking-wider">{filtered.length} SPARKS DETECTED</span>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-5 border border-cyan-500/20 bg-cyan-500/[0.02] backdrop-blur-sm group cursor-default"
          whileHover={{ scale: 1.01 }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-cyan-500/5 to-transparent" />
          <div className="relative z-10">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Unread Sparks</span>
            <h2 className="text-3xl font-black text-cyan-400 mt-2 text-glow">{String(stats.unread).padStart(2, '0')}</h2>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-5 border border-violet-500/20 bg-violet-500/[0.02] backdrop-blur-sm group cursor-default"
          whileHover={{ scale: 1.01 }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-violet-500/5 to-transparent" />
          <div className="relative z-10">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Top Demand</span>
            <h2 className="text-xl font-bold text-foreground mt-2 truncate">{stats.topService}</h2>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.02] backdrop-blur-sm group cursor-default"
          whileHover={{ scale: 1.01 }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-emerald-500/5 to-transparent" />
          <div className="relative z-10">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Conversion Rate</span>
            <h2 className="text-3xl font-black text-emerald-400 mt-2 text-glow">{stats.rate}%</h2>
          </div>
        </motion.div>
      </div>

      {/* Filter / Calibration Bar */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white/5 border-white/10 rounded-xl"
            placeholder="Search identity / mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            className="h-10 bg-white/5 border border-white/10 rounded-xl text-xs px-3 text-foreground outline-none focus:border-cyan-400"
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
          >
            <option value="all">All Services</option>
            {services.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
          </select>

          <select
            className="h-10 bg-white/5 border border-white/10 rounded-xl text-xs px-3 text-foreground outline-none focus:border-cyan-400"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="New Spark">New Spark</option>
            <option value="Expired">Expired</option>
            <option value="Ignited">Ignited</option>
            <option value="Extinguished">Extinguished</option>
          </select>

          <Input
            type="date"
            className="h-10 w-36 bg-white/5 border-white/10 rounded-xl text-xs text-muted-foreground"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Grid of Inquiries */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((inq, i) => {
            const initial = inq.name.charAt(0).toUpperCase();
            const color = LOCATION_COLORS[i % LOCATION_COLORS.length];
            return (
              <motion.div
                key={inq.id}
                variants={itemVariants}
                className="group relative rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all flex flex-col justify-between"
                style={{ background: `linear-gradient(135deg, ${color}03 0%, transparent 100%)` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-foreground truncate">{inq.name}</h3>
                      <Badge className={`text-3xs tracking-wider border font-bold capitalize px-2 py-0 ${getStatusBadgeStyles(inq.status)}`}>
                        {inq.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-cyan-400 font-semibold mt-1">{inq.service}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {inq.location} · <Calendar className="w-3 h-3 flex-shrink-0" /> {inq.date}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-2xs text-muted-foreground font-mono">{inq.phone}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg border border-white/5"
                      title="Accept Spark"
                      onClick={() => {
                        // 1. Auto-Ignite project and open Ignition Modal
                        handleIgniteFromInquiry(inq);
                        
                        // 2. Update local and backend inquiry status to "Ignited"
                        updateInquiry(inq.id, { status: "Ignited" }).catch(err => {
                          console.error("Failed to update status in Supabase:", err);
                        });
                        setInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: "Ignited" } : i));
                        
                        // 3. Send positive WhatsApp greeting confirmation
                        const msg = `Namaste ${inq.name}! We have received and accepted your spark for "${inq.service}" at Netra Graphics. Our team is super excited to work with you and start the ignition process! Let's build something exceptional.`;
                        const cleanedPhone = inq.phone.replace(/\D/g, "");
                        const finalPhone = cleanedPhone.length === 10 ? "91" + cleanedPhone : cleanedPhone;
                        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                        
                        toast({
                          title: "Spark Accepted!",
                          description: "Launching WhatsApp confirmation and opening Ignition parameters."
                        });
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg border border-white/5"
                      title="Reject Spark"
                      onClick={() => {
                        // 1. Send sad/apologetic WhatsApp refusal greeting
                        const sadMsg = `Namaste ${inq.name}. We regret to inform you that we are currently unable to take on new projects for "${inq.service}" at this time due to scheduling conflicts. We hope to collaborate in the future under better alignments. Thank you for reaching out to Netra Graphics.`;
                        const cleanedPhone = inq.phone.replace(/\D/g, "");
                        const finalPhone = cleanedPhone.length === 10 ? "91" + cleanedPhone : cleanedPhone;
                        window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(sadMsg)}`, '_blank');
                        
                        // 2. Dismiss/remove the spark from local state list and delete from backend DB
                        deleteInquiry(inq.id).catch(err => {
                          console.error("Failed to delete inquiry from Supabase:", err);
                        });
                        setInquiries(prev => prev.filter(i => i.id !== inq.id));
                        
                        toast({
                          title: "Spark Dismissed",
                          description: "Sent polite WhatsApp refusion and removed spark from vault."
                        });
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg border border-white/5"
                      title="Review Details"
                      onClick={() => {
                        setSelectedInquiry(inq);
                        setIsReviewOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-16 text-muted-foreground border border-white/5 rounded-2xl">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No sparks matched your filtration</p>
          </div>
        )}
      </motion.div>

      {/* WhatsApp Status Remark Dialog */}
      <Dialog open={remarkModal.open} onOpenChange={(open) => !open && setRemarkModal({ open: false, inquiryId: null, type: null })}>
        <DialogContent className="bg-[#0a0f1e] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              ADD CALIBRATION REMARK
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Type the feedback message to the client. This will update the status locally and launch the WhatsApp status dispatch link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="Type your message to the client..."
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              className="bg-white/5 border-white/10 text-xs text-foreground min-h-[100px] rounded-xl"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 border border-white/10 text-xs"
                onClick={() => setRemarkModal({ open: false, inquiryId: null, type: null })}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 font-bold text-xs"
                onClick={handleSendStatus}
              >
                <Send className="w-3.5 h-3.5 mr-2" />
                SEND STATUS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Side Drawer Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="bg-[#050915] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 font-black uppercase text-glow">
              <Zap className="w-5 h-5 text-cyan-400" />
              Inquiry Details
            </DialogTitle>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Client</span>
                  <span className="text-foreground font-semibold">{selectedInquiry.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Service Requested</span>
                  <span className="text-cyan-400 font-semibold">{selectedInquiry.service}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Mobile Contact</span>
                  <span className="text-foreground font-mono">{selectedInquiry.phone}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Email Address</span>
                  <span className="text-foreground truncate max-w-[200px]">{selectedInquiry.email}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-muted-foreground uppercase font-bold tracking-wider">Location</span>
                  <span className="text-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-violet-400" />
                    {selectedInquiry.location}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Message Narrative</label>
                <p className="p-3 rounded-xl bg-white/5 border border-white/5 text-muted-foreground leading-relaxed text-2xs">
                  Interested in a premium &apos;{selectedInquiry.service}&apos; design calibration for our new venture in {selectedInquiry.location}. Please provide availability options and budget quotes.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    setIsReviewOpen(false);
                    handleIgniteFromInquiry(selectedInquiry);
                  }}
                  className="w-full py-6 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] focus:shadow-[0_0_20px_rgba(6,182,212,0.25)] rounded-xl"
                >
                  🚀 AUTO-IGNITE PROJECT
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
