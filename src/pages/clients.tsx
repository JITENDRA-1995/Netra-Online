import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Building2, Mail, Phone, Calendar, Key, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
              className="group relative rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all flex flex-col justify-between"
              style={{ background: `linear-gradient(135deg, ${color}03 0%, transparent 100%)` }}
              data-testid={`card-client-${client.id}`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{client.name}</p>
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
    </motion.div>
  );
}
