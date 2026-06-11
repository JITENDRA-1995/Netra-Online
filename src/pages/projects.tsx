import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, FileText, SlidersHorizontal } from "lucide-react";
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
import { getMicroJobs, createMicroJob, linkJobsToInvoice, saveInvoice } from "../supabase/database";


const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",    // Green
  ongoing: "#10b981",   // Green
  completed: "#00d4ff",  // Cyan
  on_hold: "#f59e0b",    // Amber
  cancelled: "#ef4444",  // Red
};

const STATUS_THEMES: Record<string, {
  color: string;
  borderClass: string;
  bgGradient: string;
  glowColor: string;
  textHighlight: string;
  cardBg: string;
}> = {
  active: {
    color: "#10b981",
    borderClass: "border-emerald-500/10 group-hover:border-emerald-500/35",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, transparent 100%)",
    glowColor: "rgba(16, 185, 129, 0.03)",
    textHighlight: "text-emerald-400",
    cardBg: "bg-emerald-950/15"
  },
  ongoing: {
    color: "#10b981",
    borderClass: "border-emerald-500/10 group-hover:border-emerald-500/35",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, transparent 100%)",
    glowColor: "rgba(16, 185, 129, 0.03)",
    textHighlight: "text-emerald-400",
    cardBg: "bg-emerald-950/15"
  },
  completed: {
    color: "#00d4ff",
    borderClass: "border-cyan-500/10 group-hover:border-cyan-500/35",
    bgGradient: "linear-gradient(135deg, rgba(0, 212, 255, 0.04) 0%, transparent 100%)",
    glowColor: "rgba(0, 212, 255, 0.03)",
    textHighlight: "text-cyan-400",
    cardBg: "bg-cyan-950/15"
  },
  on_hold: {
    color: "#f59e0b",
    borderClass: "border-amber-500/10 group-hover:border-amber-500/35",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.04) 0%, transparent 100%)",
    glowColor: "rgba(245, 158, 11, 0.03)",
    textHighlight: "text-amber-400",
    cardBg: "bg-amber-950/15"
  },
  cancelled: {
    color: "#ef4444",
    borderClass: "border-red-950/30 group-hover:border-red-500/20",
    bgGradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.02) 0%, transparent 100%)",
    glowColor: "rgba(239, 68, 68, 0.01)",
    textHighlight: "text-red-400/80",
    cardBg: "bg-red-950/25 opacity-70"
  }
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
  handleUpdateProjectProgressHandy?: (projectId: number, newProgress: number) => void;
  setCashbookEntries?: React.Dispatch<React.SetStateAction<any[]>>;
  initialSearch?: string;
  onDeleteProject?: (id: number) => void;
  invoices?: any[];
  setInvoices?: React.Dispatch<React.SetStateAction<any[]>>;
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
  handleUpdateProjectStatusHandy,
  handleUpdateProjectProgressHandy,
  setCashbookEntries,
  initialSearch = "",
  onDeleteProject,
  invoices = [],
  setInvoices = () => {}
}: ProjectsProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"Missions" | "MicroJobs">("Missions");
  const [microJobs, setMicroJobs] = useState<any[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isQuickJobModalOpen, setIsQuickJobModalOpen] = useState(false);

  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const jobs = await getMicroJobs();
      setMicroJobs(jobs);
    } catch (err) {
      console.error("Failed to fetch micro-jobs:", err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    setSelectedJobIds([]);
  }, [activeTab]);


  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Quick Log Job Form States
  const [newJobClientLink, setNewJobClientLink] = useState<number | "">("");
  const [newJobTaskName, setNewJobTaskName] = useState("");
  const [newJobAmount, setNewJobAmount] = useState<number | "">("");
  const [newJobDate, setNewJobDate] = useState(() => new Date().toISOString().split('T')[0]);

  const getUniqueInvoiceNumber = () => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    let serial = invoices.length + 1;
    let invNo = `NG/${dateStr}/${String(serial).padStart(4, '0')}`;
    while (invoices.some(i => i.invoiceNo === invNo)) {
      serial++;
      invNo = `NG/${dateStr}/${String(serial).padStart(4, '0')}`;
    }
    return invNo;
  };

  const handleGenerateCumulativeInvoice = async () => {
    if (selectedJobIds.length === 0) return;
    
    const selectedJobs = unbilledJobs.filter(job => selectedJobIds.includes(job.jobId));
    const clientLinks = [...new Set(selectedJobs.map(job => job.clientLink))];
    
    if (clientLinks.length > 1) {
      toast({
        title: "Client Mismatch",
        description: "Cumulative invoices can only be generated for a single client at a time.",
        variant: "destructive"
      });
      return;
    }
    
    const targetClientLink = clientLinks[0];
    if (!targetClientLink) {
      toast({
        title: "No Client Linked",
        description: "Selected micro-jobs must be associated with a client to generate an invoice.",
        variant: "destructive"
      });
      return;
    }
    
    const firstJob = selectedJobs[0];
    const clientName = firstJob.client?.name || "Unknown Client";
    const totalAmount = selectedJobs.reduce((sum, job) => sum + job.amount, 0);
    const servicesDesc = `Cumulative Micro-Jobs: ${selectedJobs.map(job => job.taskName).join(', ')}`;
    const invoiceNo = getUniqueInvoiceNumber();
    
    try {
      // 1. Save invoice to Supabase
      const dbInvoice = await saveInvoice({
        invoiceNo,
        clientName,
        projectService: servicesDesc,
        grandTotal: totalAmount,
        clientLink: targetClientLink,
        invoiceTotal: totalAmount,
        paymentStatus: 'Pending',
        microJobIds: selectedJobIds
      });
      
      // 2. Link jobs to the invoice in Supabase
      await linkJobsToInvoice(selectedJobIds, dbInvoice.id);
      
      // 3. Construct formatted invoice and update parent state
      const formattedInvoice = {
        id: dbInvoice.id,
        invoiceNo: dbInvoice.invoice_no,
        projectId: dbInvoice.project_id,
        clientName: dbInvoice.client_name,
        projectService: dbInvoice.project_service,
        issueDate: new Date(dbInvoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        grandTotal: parseFloat(dbInvoice.grand_total),
        clientLink: dbInvoice.client_link,
        invoiceTotal: parseFloat(dbInvoice.invoice_total),
        paymentStatus: dbInvoice.payment_status || 'Pending',
        microJobIds: dbInvoice.micro_job_ids || [],
        rawProject: null
      };
      
      setInvoices(prev => [formattedInvoice, ...prev]);
      
      // 4. Clear checkboxes and refresh lists
      setSelectedJobIds([]);
      await fetchJobs();
      
      toast({
        title: "Invoice Ignited",
        description: `Cumulative invoice ${invoiceNo} generated successfully for ${clientName}.`
      });
    } catch (err: any) {
      console.error("Failed to generate cumulative invoice:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "An error occurred during invoice creation.",
        variant: "destructive"
      });
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobClientLink || !newJobTaskName || !newJobAmount) {
      toast({
        title: "Missing fields",
        description: "All fields are required.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await createMicroJob({
        clientLink: Number(newJobClientLink),
        taskName: newJobTaskName,
        amount: Number(newJobAmount),
        dateLogged: newJobDate ? new Date(newJobDate).toISOString() : undefined
      });
      
      toast({
        title: "Job Logged Successfully",
        description: `Logged "${newJobTaskName}" for client.`
      });
      
      // Reset form states
      setNewJobClientLink("");
      setNewJobTaskName("");
      setNewJobAmount("");
      setNewJobDate(new Date().toISOString().split('T')[0]);
      setIsQuickJobModalOpen(false);
      
      // Refresh list
      await fetchJobs();
    } catch (err: any) {
      console.error("Failed to create micro job:", err);
      toast({
        title: "Logging Failed",
        description: err.message || "Failed to log micro-job in database.",
        variant: "destructive"
      });
    }
  };

  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  
  // Priority and Completed Tab states
  const [showCompletedTab, setShowCompletedTab] = useState(false);
  const [sortBy, setSortBy] = useState("date_desc");
  const [formPriority, setFormPriority] = useState("Normal");

  // Layered filter states
  const [filterClient, setFilterClient] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Extract unique client visionaries
  const uniqueClients = Array.from(
    new Set(projects.map((p) => p.clientName || p.client?.name || p.name || "").filter(Boolean))
  );

  const unbilledJobs = useMemo(() => {
    return microJobs.filter(job => job.billingStatus === "Unbilled");
  }, [microJobs]);


  // Extract unique project creation months
  const uniqueMonths = Array.from(
    new Set(
      projects.map((p) => {
        if (!p.createdAt) return "";
        const date = new Date(p.createdAt);
        return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
      }).filter(Boolean)
    )
  );

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

  // QTY / Rate / Discount bidirectional state
  // formBudget = grossQuote = qty × rate  (stored in DB quote column)
  // formNetQuote = grossQuote − discount   (displayed as "Estimated Quote")
  const [formQty, setFormQty] = useState<number>(1);
  const [formRate, setFormRate] = useState<number | "">(0);
  const [formNetQuote, setFormNetQuote] = useState<number | "">(0);
  const [netQuoteUserTyped, setNetQuoteUserTyped] = useState(false);

  // 2-step wizard step
  const [editStep, setEditStep] = useState(1);

  // Qty or Rate → recalculate gross then net (discount unchanged, rate unchanged)
  useEffect(() => {
    if (!netQuoteUserTyped) {
      const qty = Number(formQty) || 1;
      const rate = Number(formRate) || 0;
      const gross = qty * rate;
      setFormBudget(gross);
      const disc = typeof formDiscountValue === "number" ? formDiscountValue : 0;
      setFormNetQuote(Math.max(0, gross - disc));
    }
  }, [formQty, formRate]);

  // Discount change → recalculate net only (rate stays fixed)
  useEffect(() => {
    const gross = typeof formBudget === "number" ? formBudget : 0;
    const disc = typeof formDiscountValue === "number" ? formDiscountValue : 0;
    setFormNetQuote(Math.max(0, gross - disc));
  }, [formDiscountValue]);

  // User types net quote → derive rate from (net + discount) / qty
  useEffect(() => {
    if (netQuoteUserTyped) {
      const net = typeof formNetQuote === "number" ? formNetQuote : 0;
      const disc = typeof formDiscountValue === "number" ? formDiscountValue : 0;
      const gross = net + disc;
      const qty = Number(formQty) || 1;
      setFormBudget(gross);
      setFormRate(parseFloat((gross / qty).toFixed(2)));
    }
  }, [formNetQuote]);


  const filtered = projects.filter((p) => {
    const serviceName = p.service || p.name || "";
    const clientName = p.clientName || p.client?.name || p.name || "";
    
    // 1. Search filter
    const matchSearch = 
      serviceName.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    
    // 2. Status filter
    const statusVal = (p.status || "active").toLowerCase().replace(" ", "_");
    const normalizedStatus = statusVal === "ongoing" ? "active" : statusVal;
    
    let matchStatus = false;
    if (showCompletedTab) {
      matchStatus = normalizedStatus === "completed";
    } else {
      if (normalizedStatus === "completed") {
        matchStatus = false;
      } else {
        matchStatus = filterStatus === "all" || normalizedStatus === filterStatus;
      }
    }

    // 3. Client visionary filter
    const matchClient = filterClient === "all" || clientName.trim().toLowerCase() === filterClient.trim().toLowerCase();

    // 4. Month filter
    let matchMonth = true;
    if (filterMonth !== "all" && p.createdAt) {
      const date = new Date(p.createdAt);
      const mStr = date.toLocaleString("en-IN", { month: "long", year: "numeric" });
      matchMonth = mStr === filterMonth;
    }

    // 5. Custom Date Range filter
    let matchDateRange = true;
    if (p.createdAt) {
      const projectTime = new Date(p.createdAt).getTime();
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (projectTime < start.getTime()) matchDateRange = false;
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (projectTime > end.getTime()) matchDateRange = false;
      }
    }
    
    return matchSearch && matchStatus && matchClient && matchMonth && matchDateRange;
  });

  const sortedAndFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "az") {
        const nameA = a.service || a.name || "";
        const nameB = b.service || b.name || "";
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "priority_desc") {
        const priorityWeight = { "High": 3, "Normal": 2, "Low": 1 };
        const wA = priorityWeight[a.priority as keyof typeof priorityWeight] || 2;
        const wB = priorityWeight[b.priority as keyof typeof priorityWeight] || 2;
        return wB - wA;
      }
      if (sortBy === "priority_asc") {
        const priorityWeight = { "High": 3, "Normal": 2, "Low": 1 };
        const wA = priorityWeight[a.priority as keyof typeof priorityWeight] || 2;
        const wB = priorityWeight[b.priority as keyof typeof priorityWeight] || 2;
        return wA - wB;
      }
      // Default: date_desc (latest first)
      const dateA = a.createdAt || 0;
      const dateB = b.createdAt || 0;
      return dateB - dateA;
    });
  }, [filtered, sortBy]);

  function openEdit(project: any) {
    setEditingProject(project);
    
    const currentStatus = (project.status || "active").toLowerCase().replace(" ", "_");
    const formStatusVal = currentStatus === "ongoing" ? "active" : currentStatus;
    const currentCategory = (project.category || "branding").toLowerCase().replace(" ", "_");
    // grossQuote = value stored in DB quote column
    const grossQuote = project.budget !== undefined ? project.budget : (parseFloat(project.quote) || 0);
    const loadedQty = Number(project.qty) || 1;
    const loadedRate = Number(project.rate) || (loadedQty > 0 ? grossQuote / loadedQty : grossQuote);
    const loadedDiscount = parseFloat(project.discountValue) || parseFloat(project.discount) || 0;
    const loadedNet = Math.max(0, grossQuote - loadedDiscount);

    setFormName(project.service || project.name || "");
    setFormDescription(project.description || project.desc || "");
    setFormStatus(["active", "completed", "on_hold", "cancelled"].includes(formStatusVal) ? formStatusVal : "active");
    setFormCategory(["branding", "web", "print", "motion", "illustration", "social_media", "packaging"].includes(currentCategory) ? currentCategory : "branding");
    setFormBudget(grossQuote);
    setFormProgress(project.progress || 0);
    setFormPriority(project.priority || "Normal");
    setFormDeadline(project.deadline ? project.deadline.split('T')[0] : "");
    setFormDiscountValue(loadedDiscount);
    setFormDiscountType(project.discountType || 'rs');
    setFormAdvanceAmount(parseFloat(project.advanceAmount) || 0);
    setFormClientEmail(project.client?.email || "");
    setFormClientPhone(project.client?.phone || "");
    setFormClientAddress(project.client?.address || "");
    setFormQty(loadedQty);
    setFormRate(parseFloat(loadedRate.toFixed(2)));
    setFormNetQuote(loadedNet);
    setNetQuoteUserTyped(false);
    setEditStep(1);
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editingProject && setProjects) {
      // grossQuote = qty × rate (stored in DB quote column)
      const qtyVal = Number(formQty) || 1;
      const rateVal = typeof formRate === "number" ? formRate : 0;
      const grossQuote = qtyVal * rateVal;
      // Always store gross in formBudget for consistency
      const budgetVal = grossQuote;
      const discountInput = typeof formDiscountValue === "number" ? formDiscountValue : 0;
      const statusFormatted = formStatus.charAt(0).toUpperCase() + formStatus.slice(1).replace("_", " ");

      // Only ₹ discount supported (matching ignition logic)
      const discountAmt = discountInput;

      const advanceVal = typeof formAdvanceAmount === "number" ? formAdvanceAmount : 0;
      // finalQuote = amount client actually pays after discount
      const finalQuote = grossQuote - discountAmt;
      let paymentStatus = 'unpaid';
      if (advanceVal >= finalQuote) {
        paymentStatus = 'paid';
      } else if (advanceVal > 0) {
        paymentStatus = 'part';
      }

      // Serialize qty/rate/priority into JSON_METADATA format (matches getProjects parser)
      const serializedDescription = `JSON_METADATA:${JSON.stringify({
        qty: qtyVal,
        rate: rateVal,
        description: formDescription,
        priority: formPriority,
        acknowledgedDeadline: editingProject?.acknowledgedDeadline || ''
      })}`;

      const updatedProject = {
        ...editingProject,
        service: formName,
        description: formDescription,
        desc: formDescription,
        qty: qtyVal,
        rate: rateVal,
        status: statusFormatted,
        category: formCategory,
        quote: budgetVal,
        budget: budgetVal,
        deadline: formDeadline,
        progress: typeof formProgress === "number" ? formProgress : 0,
        priority: formPriority,
        discount: discountAmt,
        discountValue: discountInput.toString(),
        discountType: formDiscountType,
        discountPercent: formDiscountType === "%" ? discountInput.toFixed(2) : ((discountInput / (budgetVal || 1)) * 100).toFixed(2),
        advanceAmount: advanceVal,
        paymentStatus: paymentStatus,
        acknowledgedDeadline: editingProject?.acknowledgedDeadline || '',
        client: editingProject.client ? {
          ...editingProject.client,
          email: formClientEmail,
          phone: formClientPhone,
          address: formClientAddress
        } : null
      };

      try {
        // 1. Update project row (with serialized qty/rate in description)
        const { error } = await supabase
          .from("projects")
          .update({
            service: updatedProject.service,
            description: serializedDescription,
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

      // Handle Cashbook updates on project status updates (Reversal / Cancellation)
      if (setCashbookEntries) {
        if (editingProject.status === "Completed" && statusFormatted !== "Completed") {
          // Reverted from Completed: remove final payment entry
          setCashbookEntries((prev: any[]) => prev.filter(entry => !(entry.projectId === editingProject.id && entry.isFinal)));
        } else if (statusFormatted === "Cancelled") {
          // Cancelled: remove all entries for this project
          setCashbookEntries((prev: any[]) => prev.filter(entry => entry.projectId !== editingProject.id));
        }
      }

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
    if (onDeleteProject) {
      onDeleteProject(id);
      return;
    }
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
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 6px rgba(16, 185, 129, 0.25), inset 0 0 2px rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.3);
            background-color: rgba(16, 185, 129, 0.06);
          }
          50% {
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.6), inset 0 0 5px rgba(16, 185, 129, 0.35);
            border-color: rgba(16, 185, 129, 0.75);
            background-color: rgba(16, 185, 129, 0.16);
          }
        }
        .animate-pulse-glow {
          animation: pulseGlow 1.8s infinite ease-in-out;
        }
      `}</style>
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent" data-testid="heading-projects">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
            {activeTab === "MicroJobs"
              ? `${unbilledJobs.length} unbilled micro jobs`
              : filterStatus !== "all"
              ? `${filtered.length} ${filterStatus.replace("_", " ")} projects`
              : `${projects.length} total projects`}
          </p>
        </div>
        {activeTab === "Missions" ? (
          <Button
            onClick={onOpenIgnitionModal}
            className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 gap-2 font-bold text-xs rounded-xl"
            data-testid="button-create-project"
          >
            <Plus className="w-4 h-4" />
            START NEW IGNITION
          </Button>
        ) : (
          <Button
            onClick={() => setIsQuickJobModalOpen(true)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 gap-2 font-bold text-xs rounded-xl"
            data-testid="button-log-microjob"
          >
            <Plus className="w-4 h-4" />
            LOG NEW JOB
          </Button>
        )}
      </motion.div>

      {/* Status Selector & Filters Toggle */}
      <motion.div variants={itemVariants} className="flex gap-3 items-center flex-wrap">
        {showCompletedTab ? (
          <Button
            onClick={() => {
              setActiveTab("Missions");
              setShowCompletedTab(false);
              setFilterStatus("all");
            }}
            className="h-9 px-4 text-xs font-bold rounded-xl border bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground transition-all uppercase"
          >
            ALL ACTIVE MISSIONS
          </Button>
        ) : (
          <select
            className="h-9 px-3 bg-[#0c101d]/60 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer font-bold uppercase min-w-[165px] hover:bg-white/5 transition-all"
            value={activeTab === "MicroJobs" ? "microjobs" : filterStatus}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "microjobs") {
                setActiveTab("MicroJobs");
                setShowCompletedTab(false);
              } else {
                setActiveTab("Missions");
                setShowCompletedTab(false);
                setFilterStatus(val);
              }
            }}
            data-testid="select-filter-status"
          >
            <option value="all">ALL ACTIVE MISSIONS</option>
            <option value="active">ACTIVE</option>
            <option value="on_hold">ON HOLD</option>
            <option value="cancelled">CANCELLED</option>
            {activeTab === "MicroJobs" && <option value="microjobs">MICRO-JOBS LEDGER</option>}
          </select>
        )}

        <Button
          onClick={() => {
            setActiveTab("Missions");
            if (showCompletedTab) {
              setShowCompletedTab(false);
              setFilterStatus("all");
            } else {
              setShowCompletedTab(true);
              setFilterStatus("completed");
            }
          }}
          className={`h-9 px-4 text-xs font-bold rounded-xl border transition-all ${
            activeTab === "Missions" && showCompletedTab
              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground"
          }`}
        >
          COMPLETED PROJECT
        </Button>

        <Button
          onClick={() => {
            if (activeTab === "MicroJobs") {
              setActiveTab("Missions");
            } else {
              setActiveTab("MicroJobs");
            }
          }}
          className={`h-9 px-4 text-xs font-bold rounded-xl border transition-all ${
            activeTab === "MicroJobs"
              ? "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground"
          }`}
        >
          ⚡ MICRO-JOBS LEDGER
        </Button>

        {activeTab === "Missions" && (
          <select
            className="h-9 px-3 bg-[#0c101d]/60 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer font-bold uppercase min-w-[180px] hover:bg-white/5 transition-all"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date_desc">LATEST IGNITION</option>
            <option value="az">A-Z NAME</option>
            <option value="priority_desc">PRIORITY: HIGH TO LOW</option>
            <option value="priority_asc">PRIORITY: LOW TO HIGH</option>
          </select>
        )}

        {activeTab === "Missions" && (
          <Button
            variant="ghost"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`h-9 gap-2 text-xs font-bold rounded-xl border transition-all select-none ${
              showAdvancedFilters
                ? "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showAdvancedFilters ? "HIDE FILTERS" : "SHOW FILTERS"}
          </Button>
        )}

        {/* Dynamic Matched Count */}
        <div className="flex items-center gap-2 text-3xs font-mono font-bold tracking-widest text-muted-foreground bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl uppercase ml-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            {activeTab === "MicroJobs"
              ? `UNBILLED: ${unbilledJobs.length}`
              : `MATCHED: ${filtered.length}`}
          </span>
        </div>
      </motion.div>

      {/* Collapsible Search & Filter Area */}
      <AnimatePresence>
        {activeTab === "Missions" && showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden space-y-4 w-full"
          >
            {/* Search Input (Third Attachment) */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-white/5 border border-white/10 rounded-xl text-foreground bg-[#0a0f1e]/40 h-10 w-full"
                placeholder="Search projects by name or client visionary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-projects"
              />
            </div>

            {/* Layered Advanced Filter Bar (Second Attachment) */}
            <div className="flex gap-4 flex-wrap items-center bg-[#0c101d]/40 backdrop-blur-sm border border-white/5 p-4 rounded-2xl w-full">
              {/* Client Selector */}
              <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
                <label className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">Client Name</label>
                <select
                  className="h-9 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer w-full uppercase"
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                >
                  <option value="all">ALL CLIENTS</option>
                  {uniqueClients.map(c => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div className="flex flex-col gap-1.5 min-w-[150px] flex-1">
                <label className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">Month</label>
                <select
                  className="h-9 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer w-full uppercase"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option value="all">ALL MONTHS</option>
                  {uniqueMonths.map(m => (
                    <option key={m} value={m}>{m.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1.5 min-w-[130px] flex-1">
                <label className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">Start Date</label>
                <input
                  type="date"
                  className="h-9 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer w-full"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1.5 min-w-[130px] flex-1">
                <label className="text-3xs font-bold text-muted-foreground uppercase tracking-widest">End Date</label>
                <input
                  type="date"
                  className="h-9 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer w-full"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* Reset Button */}
              {(filterClient !== "all" || filterMonth !== "all" || filterStartDate !== "" || filterEndDate !== "" || search !== "") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-4 text-2xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-xl self-end animate-fade-in"
                  onClick={() => {
                    setFilterClient("all");
                    setFilterMonth("all");
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setSearch("");
                  }}
                >
                  RESET
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {activeTab === "Missions" ? (
        <motion.div variants={containerVariants} className="space-y-4">
          {sortedAndFiltered.map((project) => {
            const serviceName = project.service || project.name || "Unnamed Project";
            const clientName = project.clientName || project.name || "Unknown Client";
            const budgetVal = project.budget !== undefined ? project.budget : (parseFloat(project.quote) || 0);
            const statusVal = (project.status || "active").toLowerCase().replace(" ", "_");
            const progressVal = statusVal === "completed" ? 100 : (project.progress || 20);
            const categoryVal = (project.category || "branding").toLowerCase().replace(" ", "_");

            const isHighPriority = project.priority === "High";
            const statusColor = isHighPriority ? "#ef4444" : (STATUS_COLORS[statusVal] ?? "#666");
            const categoryColor = CATEGORY_COLORS[categoryVal] ?? "#666";
            
            let theme = STATUS_THEMES[statusVal] ?? {
              color: statusColor,
              borderClass: "border-white/5 group-hover:border-white/10",
              bgGradient: "linear-gradient(135deg, transparent 0%, transparent 100%)",
              glowColor: "transparent",
              textHighlight: "text-foreground",
              cardBg: "bg-card/40"
            };

            if (isHighPriority) {
              theme = {
                color: "#ef4444",
                borderClass: "border-red-500/40 group-hover:border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
                bgGradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)",
                glowColor: "rgba(239, 68, 68, 0.2)",
                textHighlight: "text-red-400 font-bold",
                cardBg: "bg-[#160d0e]/80"
              };
            }

            const isProjectActive = statusVal === "active" || statusVal === "ongoing";

            return (
              <motion.div
                key={project.id}
                variants={itemVariants}
                className={`group relative rounded-2xl border backdrop-blur-sm p-5 transition-all duration-300 flex flex-col justify-between ${theme.borderClass} ${theme.cardBg}`}
                style={{ background: isHighPriority ? `linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, transparent 100%)` : `linear-gradient(135deg, ${statusColor}03 0%, transparent 100%)` }}
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
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>Visionary: <strong>{clientName}</strong></span>
                        {project.deadline && (
                          <>
                            <span>·</span>
                            {isProjectActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)] animate-pulse-glow">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                                DUE {new Date(project.deadline).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span>Due {new Date(project.deadline).toLocaleDateString()}</span>
                            )}
                          </>
                        )}
                        <span>·</span>
                        {project.priority === "High" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse-glow">
                            <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
                            HIGH PRIORITY
                          </span>
                        ) : project.priority === "Low" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            LOW PRIORITY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                            <span className="w-1 h-1 rounded-full bg-cyan-400" />
                            NORMAL PRIORITY
                          </span>
                        )}
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

                <div className="mt-5 space-y-2.5 group/progress relative">
                  {/* Progress bar line representation */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: statusColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressVal}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right font-semibold">{progressVal}%</span>
                  </div>

                  {/* Easy Progress Stepper */}
                  {statusVal !== "completed" && (
                    <div className="overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-hover/progress:max-h-12 group-hover/progress:opacity-100 pt-0 group-hover/progress:pt-2">
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        {[
                          { label: "Discover", val: 20 },
                          { label: "Define", val: 40 },
                          { label: "Design", val: 60 },
                          { label: "Print", val: 80 },
                          { label: "Deliver", val: 100 }
                        ].map((step) => {
                          const isPassedOrCurrent = progressVal >= step.val;
                          return (
                            <button
                              key={step.label}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (handleUpdateProjectProgressHandy) {
                                  handleUpdateProjectProgressHandy(project.id, step.val);
                                }
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                                isPassedOrCurrent
                                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:bg-cyan-500/20"
                                  : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                              }`}
                              title={`Set progress to ${step.val}% (${step.label})`}
                            >
                              {step.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
      ) : (
        <motion.div
          variants={containerVariants}
          className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4 text-left"
        >
          <div>
            <h3 className="font-bold text-foreground text-lg">Running Tab Operations</h3>
            <p className="text-xs text-muted-foreground">High-volume, ad-hoc task entries requiring client-linked settlements</p>
          </div>

          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <th style={{ width: "40px" }} className="p-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded accent-cyan-400"
                      checked={unbilledJobs.length > 0 && selectedJobIds.length === unbilledJobs.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobIds(unbilledJobs.map(job => job.jobId));
                        } else {
                          setSelectedJobIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4 text-center">Date Logged</th>
                  <th className="p-4">Task Description</th>
                  <th className="p-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/95">
                {isLoadingJobs ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground font-semibold">
                      LOADING LEDGER DATA...
                    </td>
                  </tr>
                ) : unbilledJobs.length > 0 ? (
                  unbilledJobs.map(job => (
                    <tr key={job.jobId} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedJobIds.includes(job.jobId)}
                          className="rounded accent-cyan-400"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedJobIds(prev => [...prev, job.jobId]);
                            } else {
                              setSelectedJobIds(prev => prev.filter(id => id !== job.jobId));
                            }
                          }}
                        />
                      </td>
                      <td className="p-4 font-bold text-foreground">
                        {job.client?.name || "Unknown Client"}
                      </td>
                      <td className="p-4 text-center text-muted-foreground">
                        {new Date(job.dateLogged).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="p-4">{job.taskName}</td>
                      <td className="p-4 text-right font-mono font-bold text-cyan-400">
                        ₹{job.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-3xs font-semibold">
                      NO UNBILLED MICRO-JOBS IN RUNNING TAB
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedJobIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl"
            >
              <div className="text-xs">
                Selected <strong className="text-cyan-400">{selectedJobIds.length}</strong> jobs. Total Cumulative sum:{" "}
                <strong className="text-cyan-400">
                  ₹{unbilledJobs
                    .filter(j => selectedJobIds.includes(j.jobId))
                    .reduce((sum, j) => sum + j.amount, 0)
                    .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <Button
                onClick={handleGenerateCumulativeInvoice}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/10 px-5"
              >
                ⚡ GENERATE CUMULATIVE INVOICE
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}


      {/* Edit Modal — 2-Step Wizard */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditStep(1); }}>
        <DialogContent className="bg-[#080c18] border border-white/10 max-w-xl w-full p-0 overflow-hidden flex flex-col max-h-[90vh]" data-testid="dialog-project-form">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-indigo-500/5 flex-shrink-0">
            <div>
              <DialogTitle className="text-foreground font-black tracking-wide text-sm flex items-center gap-2">
                <span className="text-cyan-400">⚙️</span> CALIBRATE PROJECT
              </DialogTitle>
              <p className="text-3xs text-muted-foreground mt-0.5 uppercase tracking-widest">{formName || 'Project'}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-2xs font-black border transition-all ${editStep === 1 ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>1</div>
              <div className="w-8 h-px bg-white/10"/>
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-2xs font-black border transition-all ${editStep === 2 ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>2</div>
            </div>
          </div>

          {/* All tabs and content inside ONE form — prevents Radix Dialog close on tab button click */}
          <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">

            {/* Tab bar inside the form */}
            <div className="flex border-b border-white/5 flex-shrink-0">
              <button type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditStep(1); }}
                className={`flex-1 py-2.5 text-3xs font-extrabold uppercase tracking-widest transition-all ${editStep === 1 ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-muted-foreground hover:text-foreground'}`}
              >📋 Mission Details</button>
              <button type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditStep(2); }}
                className={`flex-1 py-2.5 text-3xs font-extrabold uppercase tracking-widest transition-all ${editStep === 2 ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-muted-foreground hover:text-foreground'}`}
              >💰 Financial Matrix</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">

              {/* STEP 1 — always mounted, CSS hidden when not active */}
              <div style={{ display: editStep === 1 ? 'block' : 'none' }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Service / Project Title</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400"
                    placeholder="e.g. Logo Design, Wedding Invite..." list="services-list" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Status</label>
                    <select className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer"
                      value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="pt-2">
                      <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold block mb-1">Set Priority</label>
                      <select className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer font-bold"
                        value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Category</label>
                    <select className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer"
                      value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Deadline</label>
                    <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl text-xs focus:border-cyan-400" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Project Stage</label>
                    <select
                      className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer font-bold"
                      value={formProgress}
                      onChange={(e) => setFormProgress(parseInt(e.target.value))}
                    >
                      <option value={20}>Discover (20%)</option>
                      <option value={40}>Define (40%)</option>
                      <option value={60}>Design (60%)</option>
                      <option value={80}>Print (80%)</option>
                      <option value={100}>Deliver (100%)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-3xs uppercase tracking-widest text-cyan-400/70 font-extrabold mb-3 border-b border-white/5 pb-2">👤 Client Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Email (optional)</label>
                      <Input type="email" value={formClientEmail} onChange={(e) => setFormClientEmail(e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="client@email.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Mobile</label>
                      <Input type="tel" value={formClientPhone} onChange={(e) => setFormClientPhone(e.target.value)}
                        className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="+91 XXXXX XXXXX" />
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-3">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Billing Address</label>
                    <Input value={formClientAddress} onChange={(e) => setFormClientAddress(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="Official billing address" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Mission Brief / Notes</label>
                  <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="Project objectives and notes" />
                </div>
              </div>

              {/* STEP 2 — always mounted, CSS hidden when not active */}
              <div style={{ display: editStep === 2 ? 'block' : 'none' }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Quantity</label>
                    <Input type="number" min={1} value={formQty}
                      onChange={(e) => { setNetQuoteUserTyped(false); setFormQty(parseInt(e.target.value) || 1); }}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="1" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Rate (₹) per unit</label>
                    <Input type="number" value={formRate}
                      onChange={(e) => { setNetQuoteUserTyped(false); setFormRate(e.target.value === "" ? "" : parseFloat(e.target.value) || 0); }}
                      onFocus={() => { if (formRate === 0) setFormRate(""); }}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="Rate per unit" />
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold flex-1">Gross Quote (Qty × Rate)</span>
                  <span className="font-black text-sm text-foreground">₹{(Number(formQty) * Number(formRate) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Special Discount (₹) <span className="normal-case opacity-60">from gross</span></label>
                    <Input type="number" value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                      onFocus={() => { if (formDiscountValue === 0) setFormDiscountValue(""); }}
                      className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Estimated Quote (₹) <span className="normal-case opacity-60">after discount</span></label>
                    <Input type="number" value={formNetQuote}
                      onChange={(e) => { setNetQuoteUserTyped(true); setFormNetQuote(e.target.value === "" ? "" : parseFloat(e.target.value) || 0); }}
                      onFocus={() => { if (formNetQuote === 0) setFormNetQuote(""); }}
                      className="bg-white/5 border-cyan-500/30 rounded-xl focus:border-cyan-400 text-cyan-300" placeholder="Auto-calculated" />
                  </div>
                </div>
                <div className="grid grid-cols-3 rounded-xl border border-white/10 overflow-hidden">
                  {[
                    { label: 'Gross', val: `₹${(Number(formQty) * Number(formRate) || 0).toLocaleString('en-IN')}`, color: 'text-foreground' },
                    { label: 'Discount', val: `-₹${(typeof formDiscountValue === 'number' ? formDiscountValue : 0).toLocaleString('en-IN')}`, color: 'text-amber-400' },
                    { label: 'Net Payable', val: `₹${(typeof formNetQuote === 'number' ? formNetQuote : 0).toLocaleString('en-IN')}`, color: 'text-cyan-400' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="flex flex-col items-center py-3 bg-white/5">
                      <span className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
                      <span className={`font-black text-sm mt-0.5 ${color}`}>{val}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Advance Payment Received (₹)</label>
                  <Input type="number" value={formAdvanceAmount}
                    onChange={(e) => setFormAdvanceAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    onFocus={() => { if (formAdvanceAmount === 0) setFormAdvanceAmount(""); }}
                    className="bg-white/5 border-white/10 rounded-xl focus:border-cyan-400" placeholder="0" />
                </div>
                {(() => {
                  const net = typeof formNetQuote === 'number' ? formNetQuote : 0;
                  const adv = typeof formAdvanceAmount === 'number' ? formAdvanceAmount : 0;
                  const bal = Math.max(0, net - adv);
                  return (
                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${bal === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                      <span className="text-3xs uppercase tracking-widest font-semibold text-muted-foreground">Balance Due</span>
                      <span className={`font-black text-sm ${bal === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {bal === 0 ? '✓ Fully Paid' : `₹${bal.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-[#080c18] flex-shrink-0">
              {editStep === 1 ? (
                <>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDialogOpen(false); }}
                    className="flex-1 h-10 rounded-xl border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 hover:text-foreground transition-all">
                    ✕ Cancel
                  </button>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditStep(2); }}
                    className="flex-1 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide transition-all">
                    Next: Financial Matrix →
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditStep(1); }}
                    className="flex-1 h-10 rounded-xl border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 hover:text-foreground transition-all">
                    ← Back
                  </button>
                  <button type="submit"
                    className="flex-1 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wide transition-all">
                    ✓ Save Calibration
                  </button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Log Job Modal */}
      <Dialog open={isQuickJobModalOpen} onOpenChange={(open) => {
        setIsQuickJobModalOpen(open);
        if (!open) {
          setNewJobClientLink("");
          setNewJobTaskName("");
          setNewJobAmount("");
          setNewJobDate(new Date().toISOString().split('T')[0]);
        }
      }}>
        <DialogContent className="bg-[#080c18] border border-white/10 max-w-md w-full p-6 overflow-hidden flex flex-col" data-testid="dialog-quick-job-form">
          <DialogHeader className="pb-3 border-b border-white/10 text-left">
            <DialogTitle className="text-foreground font-black tracking-wide text-sm flex items-center gap-2">
              <span className="text-emerald-400">⚡</span> LOG NEW MICRO-JOB
            </DialogTitle>
            <p className="text-3xs text-muted-foreground uppercase tracking-widest mt-0.5">Record high-volume, ad-hoc running tab work</p>
          </DialogHeader>

          <form onSubmit={handleCreateJob} className="space-y-4 pt-3 text-left">
            {/* Client Dropdown Selector */}
            <div className="space-y-1.5">
              <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Client Visionary *</label>
              <select
                className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 cursor-pointer font-semibold uppercase transition-all"
                value={newJobClientLink}
                onChange={(e) => setNewJobClientLink(Number(e.target.value) || "")}
                required
              >
                <option value="">-- SELECT CLIENT VISIONARY --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name.toUpperCase()} ({client.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Task Name Input & Quick Selectors */}
            <div className="space-y-1.5">
              <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Task Name / Service *</label>
              
              {/* Quick selectors */}
              <div className="flex gap-2 flex-wrap pb-1.5">
                {["Printing Jobwork", "Typing Jobwork", "Scanning Jobwork", "Editing Jobwork"].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setNewJobTaskName(name)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border transition-all ${
                      newJobTaskName === name
                        ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <Input
                value={newJobTaskName}
                onChange={(e) => setNewJobTaskName(e.target.value)}
                className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs"
                placeholder="Enter custom task description..."
                required
              />
            </div>

            {/* Date input */}
            <div className="space-y-1.5">
              <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Date Logged *</label>
              <Input
                type="date"
                value={newJobDate}
                onChange={(e) => setNewJobDate(e.target.value)}
                className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs text-foreground font-semibold"
                required
              />
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Amount (₹ INR) *</label>
              <Input
                type="number"
                min={0}
                value={newJobAmount}
                onChange={(e) => setNewJobAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs text-cyan-300 font-bold"
                placeholder="0.00"
                required
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setNewJobClientLink("");
                  setNewJobTaskName("");
                  setNewJobAmount("");
                  setNewJobDate(new Date().toISOString().split('T')[0]);
                  setIsQuickJobModalOpen(false);
                }}
                className="flex-1 border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 hover:text-foreground h-10 rounded-xl"
              >
                ✕ CANCEL
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs h-10 rounded-xl shadow-lg shadow-emerald-500/10 border-none cursor-pointer"
              >
                ✓ LOG JOB
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
