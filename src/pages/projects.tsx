import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, FileText } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../supabase/client";

const STATUS_COLORS: Record<string, string> = {
  active: "#00d4ff",
  ongoing: "#00d4ff",
  completed: "#10b981",
  on_hold: "#f59e0b",
  cancelled: "#ef4444",
};

const CATEGORY_COLORS: Record<string, string> = {
  branding: "#00d4ff",
  web: "#8b5cf6",
  print: "#10b981",
  motion: "#f59e0b",
  illustration: "#ec4899",
  social_media: "#3b82f6",
  packaging: "#f97316",
};

const projectSchema = z.object({
  name: z.string().min(1, "Project/Service name required"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold", "cancelled"]),
  category: z.enum(["branding", "web", "print", "motion", "illustration", "social_media", "packaging"]),
  clientId: z.coerce.number().optional(),
  deadline: z.string().min(1, "Deadline required"),
  budget: z.coerce.number().min(0),
  progress: z.coerce.number().min(0).max(100),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface ProjectsProps {
  projects?: any[];
  setProjects?: React.Dispatch<React.SetStateAction<any[]>>;
  clients?: Client[];
  onOpenIgnitionModal: () => void;
  setCustomPaymentPrompt?: (p: any) => void;
  onDownloadInvoice?: (p: any) => void;
  handleUpdateProjectStatusHandy?: (projectId: number, newProjectStatus: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Projects({
  projects = [],
  setProjects = () => {},
  clients = [],
  onOpenIgnitionModal,
  setCustomPaymentPrompt,
  onDownloadInvoice,
  handleUpdateProjectStatusHandy
}: ProjectsProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // Local React State Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [formCategory, setFormCategory] = useState("branding");
  const [formBudget, setFormBudget] = useState<number | "">(0);
  const [formProgress, setFormProgress] = useState<number | "">(0);
  const [formDeadline, setFormDeadline] = useState("");
  const [formDiscountValue, setFormDiscountValue] = useState<number | "">(0);
  const [formDiscountType, setFormDiscountType] = useState<"rs" | "%">("rs");
  const [formAdvanceAmount, setFormAdvanceAmount] = useState<number | "">(0);
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formClientPhone, setFormClientPhone] = useState("");
  const [formClientAddress, setFormClientAddress] = useState("");


  const filtered = projects.filter((p) => {
    const serviceName = p.service || p.name || "";
    const clientName = p.clientName || p.name || "";
    const matchSearch = 
      serviceName.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    
    const statusVal = (p.status || "active").toLowerCase().replace(" ", "_");
    const normalizedStatus = statusVal === "ongoing" ? "active" : statusVal;
    const matchStatus = filterStatus === "all" || normalizedStatus === filterStatus;
    
    return matchSearch && matchStatus;
  });

  function openEdit(project: any) {
    setEditingProject(project);
    
    const currentStatus = (project.status || "active").toLowerCase().replace(" ", "_");
    const formStatusVal = currentStatus === "ongoing" ? "active" : currentStatus;
    const currentCategory = (project.category || "branding").toLowerCase().replace(" ", "_");
    const budgetVal = project.budget !== undefined ? project.budget : (parseFloat(project.quote) || 0);

    setFormName(project.service || project.name || "");
    setFormDescription(project.description || project.desc || "");
    setFormStatus(["active", "completed", "on_hold", "cancelled"].includes(formStatusVal) ? formStatusVal : "active");
    setFormCategory(["branding", "web", "print", "motion", "illustration", "social_media", "packaging"].includes(currentCategory) ? currentCategory : "branding");
    setFormBudget(budgetVal);
    setFormProgress(project.progress || 0);
    const deadlineStr = project.deadline ? project.deadline.split('T')[0] : "";
    setFormDeadline(deadlineStr);
    setFormDiscountValue(parseFloat(project.discountValue) || parseFloat(project.discount) || 0);
    setFormDiscountType(project.discountType || 'rs');
    setFormAdvanceAmount(parseFloat(project.advanceAmount) || 0);
    setFormClientEmail(project.client?.email || "");
    setFormClientPhone(project.client?.phone || "");
    setFormClientAddress(project.client?.address || "");

    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editingProject && setProjects) {
      const budgetVal = typeof formBudget === "number" ? formBudget : 0;
      const discountInput = typeof formDiscountValue === "number" ? formDiscountValue : 0;
      const statusFormatted = formStatus.charAt(0).toUpperCase() + formStatus.slice(1).replace("_", " ");
      
      let discountAmt = 0;
      if (formDiscountType === "%") {
        discountAmt = (budgetVal * discountInput) / 100;
      } else {
        discountAmt = discountInput;
      }

      const advanceVal = typeof formAdvanceAmount === "number" ? formAdvanceAmount : 0;
      const finalQuote = budgetVal - discountAmt;
      let paymentStatus = 'unpaid';
      if (advanceVal >= finalQuote) {
        paymentStatus = 'paid';
      } else if (advanceVal > 0) {
        paymentStatus = 'part';
      }

      const updatedProject = {
        ...editingProject,
        service: formName,
        description: formDescription,
        desc: formDescription,
        status: statusFormatted,
        category: formCategory,
        quote: budgetVal,
        budget: budgetVal,
        deadline: formDeadline,
        progress: typeof formProgress === "number" ? formProgress : 0,
        discount: discountAmt,
        discountValue: discountInput.toString(),
        discountType: formDiscountType,
        discountPercent: formDiscountType === "%" ? discountInput.toFixed(2) : ((discountInput / (budgetVal || 1)) * 100).toFixed(2),
        advanceAmount: advanceVal,
        paymentStatus: paymentStatus,
        client: editingProject.client ? {
          ...editingProject.client,
          email: formClientEmail,
          phone: formClientPhone,
          address: formClientAddress
        } : null
      };

      try {
        // 1. Update project row
        const { error } = await supabase
          .from("projects")
          .update({
            service: updatedProject.service,
            description: updatedProject.description,
            status: updatedProject.status,
            category: updatedProject.category,
            quote: updatedProject.quote,
            deadline: updatedProject.deadline,
            progress: updatedProject.progress,
            discount: updatedProject.discount,
            discount_value: updatedProject.discountValue,
            discount_type: updatedProject.discountType,
            advance_amount: updatedProject.advanceAmount,
            payment_status: updatedProject.paymentStatus,
          })
          .eq("id", editingProject.id);
        if (error) throw error;

        // 2. Update client row if associated
        if (editingProject.client && editingProject.client.id) {
          const { error: clientErr } = await supabase
            .from("clients")
            .update({
              email: formClientEmail,
              phone: formClientPhone,
              address: formClientAddress
            })
            .eq("id", editingProject.client.id);
          if (clientErr) throw clientErr;
        }
      } catch (err: any) {
        console.error("Supabase update failed:", err);
        alert("Failed to save project to database: " + (err.message || JSON.stringify(err)));
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? updatedProject : p))
      );

      // Trigger cashbook catch-up dialog if project is newly marked as Completed
      if (statusFormatted === "Completed" && editingProject.status !== "Completed") {
        if (setCustomPaymentPrompt) {
          const discountVal = parseFloat(updatedProject.discount) || 0;
          const adv = parseFloat(updatedProject.advanceAmount) || 0;
          const finalQuote = budgetVal - discountVal;
          const remainingAmt = finalQuote - adv;

          setCustomPaymentPrompt({
            p: updatedProject,
            finalQuote: finalQuote,
            defaultAmt: remainingAmt,
            adv: adv,
            paymentMode: 'UPI'
          });
        }
      }

      setDialogOpen(false);
      toast({ title: "Project Calibration Saved", description: `Updated project: ${formName}` });
    }
  }

  async function handleDelete(id: number) {
    if (window.confirm("ARE YOU SURE YOU WANT TO TERMINATE THIS MISSION? ALL DATA FOR THIS PROJECT WILL BE PURGED.")) {
      try {
        const { error } = await supabase.from("projects").delete().eq("id", id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Supabase delete failed:", err);
        alert("Failed to delete project from database: " + (err.message || JSON.stringify(err)));
      }
      if (setProjects) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
      toast({ title: "Project terminated successfully" });
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent" data-testid="heading-projects">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
            {filtered.length} {filterStatus !== "all" ? filterStatus : "total"} active projects
          </p>
        </div>
        <Button
          onClick={onOpenIgnitionModal}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 gap-2 font-bold text-xs rounded-xl"
          data-testid="button-create-project"
        >
          <Plus className="w-4 h-4" />
          START NEW IGNITION
        </Button>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap">
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
          {["ALL", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"].map(status => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status.toLowerCase() ? "secondary" : "ghost"}
              className={`rounded-lg text-2xs font-semibold tracking-wider ${filterStatus === status.toLowerCase() ? "bg-white/10 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilterStatus(status.toLowerCase())}
            >
              {status}
            </Button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white/5 border-white/10 rounded-xl text-foreground bg-[#0a0f1e]/40"
            placeholder="Search projects by name or client visionary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-projects"
          />
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div variants={containerVariants} className="space-y-4">
        {filtered.map((project) => {
          const serviceName = project.service || project.name || "Unnamed Project";
          const clientName = project.clientName || project.name || "Unknown Client";
          const budgetVal = project.budget !== undefined ? project.budget : (parseFloat(project.quote) || 0);
          const progressVal = project.progress || 0;
          const statusVal = (project.status || "active").toLowerCase().replace(" ", "_");
          const categoryVal = (project.category || "branding").toLowerCase().replace(" ", "_");

          const statusColor = STATUS_COLORS[statusVal] ?? "#666";
          const categoryColor = CATEGORY_COLORS[categoryVal] ?? "#666";

          return (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="group relative rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all flex flex-col justify-between"
              style={{ background: `linear-gradient(135deg, ${categoryColor}03 0%, transparent 100%)` }}
              data-testid={`card-project-${project.id}`}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase"
                    style={{
                      background: `${categoryColor}15`,
                      border: `1px solid ${categoryColor}30`,
                      color: categoryColor,
                    }}
                  >
                    {categoryVal.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-foreground text-sm">{serviceName}</h3>
                      <Badge
                        className="text-3xs uppercase tracking-wider font-extrabold border-0 px-2 py-0.5"
                        style={{
                          background: `${statusColor}15`,
                          color: statusColor,
                        }}
                      >
                        {statusVal.replace("_", " ")}
                      </Badge>
                      <Badge
                        className="text-3xs uppercase tracking-wider font-extrabold border-0 px-2 py-0.5"
                        style={{
                          background: `${categoryColor}15`,
                          color: categoryColor,
                        }}
                      >
                        {categoryVal.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visionary: <strong>{clientName}</strong> {project.deadline ? `· Due ${new Date(project.deadline).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-foreground">₹{budgetVal.toLocaleString()}</span>
                  <div className="flex gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                    {statusVal === "completed" && onDownloadInvoice && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/5"
                        onClick={() => onDownloadInvoice(project)}
                        title="Download Invoice"
                        data-testid={`button-invoice-project-${project.id}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <select
                      className="h-7 px-1.5 bg-[#0c101d] border border-white/10 rounded-lg text-3xs text-foreground outline-none focus:border-cyan-400 cursor-pointer font-bold bg-[#0c101d]"
                      value={project.status}
                      onChange={(e) => {
                        if (handleUpdateProjectStatusHandy) {
                          handleUpdateProjectStatusHandy(project.id, e.target.value);
                        }
                      }}
                      title="Quick Status Update"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 border border-white/5"
                      onClick={() => openEdit(project)}
                      data-testid={`button-edit-project-${project.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 rounded-lg hover:bg-red-500/10 hover:text-red-400 border border-white/5"
                      onClick={() => handleDelete(project.id)}
                      data-testid={`button-delete-project-${project.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: statusColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressVal}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right font-semibold">{progressVal}%</span>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-20 text-muted-foreground border border-white/5 rounded-2xl">
            <Plus className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="uppercase tracking-widest text-3xs font-semibold">NO ACTIVE MISSIONS CALIBRATED</p>
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#080c18] border border-white/10 max-w-2xl w-full p-0 overflow-hidden flex flex-col max-h-[90vh]" data-testid="dialog-project-form">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-indigo-500/5 flex-shrink-0">
            <div>
              <DialogTitle className="text-foreground font-black tracking-wide text-base flex items-center gap-2">
                <span className="text-cyan-400">⚙️</span> CALIBRATE PROJECT PARAMETERS
              </DialogTitle>
              <p className="text-3xs text-muted-foreground mt-0.5 uppercase tracking-widest">Editing: {formName || 'Project'}</p>
            </div>
          </div>

          {/* Scrollable Content */}
          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Section: Basic Info */}
              <div className="space-y-3">
                <p className="text-3xs uppercase tracking-widest text-cyan-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-2">
                  📋 Basic Information
                </p>
                <div className="space-y-1">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Project / Service Title</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                    placeholder="Service tag/name"
                    list="services-list"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Mission Brief / Notes</label>
                  <Input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                    placeholder="Project objectives and notes"
                  />
                </div>
              </div>

              {/* Section: Client Contact */}
              <div className="space-y-3">
                <p className="text-3xs uppercase tracking-widest text-cyan-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-2">
                  👤 Client Contact & Billing
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Client Email (Optional)</label>
                    <Input
                      type="email"
                      value={formClientEmail}
                      onChange={(e) => setFormClientEmail(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                      placeholder="client@mail.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Client Mobile</label>
                    <Input
                      type="tel"
                      value={formClientPhone}
                      onChange={(e) => setFormClientPhone(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Billing Address</label>
                  <Input
                    value={formClientAddress}
                    onChange={(e) => setFormClientAddress(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                    placeholder="Official billing address"
                  />
                </div>
              </div>

              {/* Section: Status & Category */}
              <div className="space-y-3">
                <p className="text-3xs uppercase tracking-widest text-cyan-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-2">
                  🏷️ Status & Classification
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Status</label>
                    <select
                      className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Category</label>
                    <select
                      className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="branding">Branding</option>
                      <option value="web">Web App/UI</option>
                      <option value="print">Print Media</option>
                      <option value="motion">Motion Graphics</option>
                      <option value="illustration">Illustration</option>
                      <option value="social_media">Social Media</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Budget & Timeline */}
              <div className="space-y-3">
                <p className="text-3xs uppercase tracking-widest text-cyan-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-2">
                  💰 Budget & Timeline
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Budget (₹)</label>
                    <Input
                      type="number"
                      value={formBudget}
                      onChange={(e) => setFormBudget(e.target.value === "" ? "" : (parseInt(e.target.value) || 0))}
                      onFocus={(e) => { if (formBudget === 0) setFormBudget(""); }}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Progress (%)</label>
                    <Input
                      type="number"
                      value={formProgress}
                      onChange={(e) => setFormProgress(e.target.value === "" ? "" : Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      onFocus={(e) => { if (formProgress === 0) setFormProgress(""); }}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                      min={0} max={100}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Deadline</label>
                    <Input
                      type="date"
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl text-xs focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section: Discount & Advance */}
              <div className="space-y-3">
                <p className="text-3xs uppercase tracking-widest text-cyan-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-2">
                  🎁 Discount & Advance Payment
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Discount Value</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formDiscountValue}
                        onChange={(e) => setFormDiscountValue(e.target.value === "" ? "" : (parseFloat(e.target.value) || 0))}
                        onFocus={(e) => { if (formDiscountValue === 0) setFormDiscountValue(""); }}
                        className="bg-white/5 border-white/10 rounded-xl pr-10 focus:border-cyan-400"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs text-muted-foreground font-bold">
                        {formDiscountType === "rs" ? "₹" : "%"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Discount Type</label>
                    <select
                      className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer"
                      value={formDiscountType}
                      onChange={(e) => setFormDiscountType(e.target.value as 'rs' | '%')}
                    >
                      <option value="rs">Rupees (₹)</option>
                      <option value="%">Percentage (%)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Advance Payment Received (₹)</label>
                  <Input
                    type="number"
                    value={formAdvanceAmount}
                    onChange={(e) => setFormAdvanceAmount(e.target.value === "" ? "" : (parseFloat(e.target.value) || 0))}
                    onFocus={(e) => { if (formAdvanceAmount === 0) setFormAdvanceAmount(""); }}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                    placeholder="0"
                  />
                </div>
              </div>

            </div>

            {/* Sticky Footer Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-[#080c18] flex-shrink-0">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex-1 h-10 rounded-xl border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 hover:text-foreground transition-all"
              >
                ✕ Discard Changes
              </button>
              <button
                type="submit"
                className="flex-1 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide transition-all"
              >
                ✓ Save Calibration
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

