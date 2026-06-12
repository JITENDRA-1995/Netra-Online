import { useState, useEffect, useMemo, useCallback } from "react";
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
import { getMicroJobs, createMicroJob, linkJobsToInvoice, saveInvoice, updateMicroJob, deleteMicroJob, clearAllMicroJobs } from "../supabase/database";


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
  redirectBackToMicroJob?: number | boolean;
  setRedirectBackToMicroJob?: (val: number | boolean) => void;
  onTriggerAddClientFromMicroJob?: () => void;
  microJobs?: any[];
  setMicroJobs?: React.Dispatch<React.SetStateAction<any[]>>;
  setInvoiceDefaultTab?: (tab: "SAVED" | "DRAFT" | "CUSTOM" | "MICRO_JOB" | null) => void;
  setActiveAdminModule?: (module: string) => void;
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
  setInvoices = () => {},
  redirectBackToMicroJob = false,
  setRedirectBackToMicroJob,
  onTriggerAddClientFromMicroJob,
  microJobs = [],
  setMicroJobs = () => {},
  setInvoiceDefaultTab,
  setActiveAdminModule
}: ProjectsProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"Missions" | "MicroJobs">("Missions");
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isQuickJobModalOpen, setIsQuickJobModalOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editJobClientLink, setEditJobClientLink] = useState<number | "">("");
  const [editJobTaskName, setEditJobTaskName] = useState("");
  const [editJobAmount, setEditJobAmount] = useState<number | "">("");
  const [editJobDate, setEditJobDate] = useState("");
  const [editJobClientSearchQuery, setEditJobClientSearchQuery] = useState("");
  const [isEditJobClientDropdownOpen, setIsEditJobClientDropdownOpen] = useState(false);
  const [editJobQty, setEditJobQty] = useState<number | "">("");
  const [editJobRate, setEditJobRate] = useState<string | number>("");
  const [editJobDiscount, setEditJobDiscount] = useState<number | "">(0);
  const [editJobLastCalculatedBy, setEditJobLastCalculatedBy] = useState<"rate" | "total">("rate");

  // Delete micro-job state
  const [jobToDelete, setJobToDelete] = useState<any | null>(null);
  const [isDeleteJobModalOpen, setIsDeleteJobModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  useEffect(() => {
    if (editJobLastCalculatedBy !== "total" && isEditJobModalOpen) {
      const q = Number(editJobQty) || 1;
      const r = Number(editJobRate) || 0;
      const d = Number(editJobDiscount) || 0;
      const gross = q * r;
      setEditJobAmount(Math.max(0, gross - d));
    }
  }, [editJobQty, editJobRate, editJobDiscount, editJobLastCalculatedBy, isEditJobModalOpen]);

  useEffect(() => {
    if (editJobLastCalculatedBy === "total" && isEditJobModalOpen) {
      const amt = Number(editJobAmount) || 0;
      const d = Number(editJobDiscount) || 0;
      const gross = amt + d;
      const q = Number(editJobQty) || 1;
      setEditJobRate(parseFloat((gross / q).toFixed(2)));
    }
  }, [editJobAmount, editJobQty, editJobDiscount, editJobLastCalculatedBy, isEditJobModalOpen]);

  const openEditMicroJob = (job: any) => {
    setEditingJob(job);
    setEditJobClientLink(job.clientLink || job.client_link || "");
    setEditJobTaskName(job.taskName || job.task_name || "");
    setEditJobAmount(job.amount || "");
    setEditJobDate(job.dateLogged ? job.dateLogged.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditJobClientSearchQuery("");
    setIsEditJobClientDropdownOpen(false);
    setEditJobQty(job.qty && job.qty !== 1 ? job.qty : "");
    setEditJobRate(job.rate !== undefined ? job.rate : job.amount || "");
    setEditJobDiscount(job.discount !== undefined ? job.discount : 0);
    setEditJobLastCalculatedBy("rate");
    setIsEditJobModalOpen(true);
  };

  const handleSaveMicroJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    if (!editJobClientLink || !editJobTaskName || !editJobAmount) {
      toast({
        title: "Missing fields",
        description: "All fields are required.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateMicroJob(editingJob.jobId, {
        clientLink: Number(editJobClientLink),
        taskName: editJobTaskName,
        qty: Number(editJobQty) || 1,
        rate: Number(editJobRate) || 0,
        discount: Number(editJobDiscount) || 0,
        amount: Number(editJobAmount),
        dateLogged: editJobDate ? new Date(editJobDate).toISOString() : undefined,
        billingStatus: editingJob.billingStatus,
        invoiceLink: editingJob.invoiceLink
      });
      
      toast({
        title: "Job Updated Successfully",
        description: `Updated "${editJobTaskName}" successfully.`
      });
      
      setIsEditJobModalOpen(false);
      setEditingJob(null);
      setEditJobQty("");
      setEditJobRate("");
      setEditJobDiscount(0);
      setEditJobLastCalculatedBy("rate");
      await fetchJobs();
    } catch (err: any) {
      console.error("Failed to update micro job:", err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update micro-job in database.",
        variant: "destructive"
      });
    }
  };

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
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [newJobQty, setNewJobQty] = useState<number | "">("");
  const [newJobRate, setNewJobRate] = useState<string | number>("");
  const [newJobDiscount, setNewJobDiscount] = useState<number | "">(0);
  const [newJobLastCalculatedBy, setNewJobLastCalculatedBy] = useState<"rate" | "total">("rate");

  useEffect(() => {
    if (newJobLastCalculatedBy !== "total" && isQuickJobModalOpen) {
      const q = Number(newJobQty) || 1;
      const r = Number(newJobRate) || 0;
      const d = Number(newJobDiscount) || 0;
      const gross = q * r;
      setNewJobAmount(Math.max(0, gross - d));
    }
  }, [newJobQty, newJobRate, newJobDiscount, newJobLastCalculatedBy, isQuickJobModalOpen]);

  useEffect(() => {
    if (newJobLastCalculatedBy === "total" && isQuickJobModalOpen) {
      const amt = Number(newJobAmount) || 0;
      const d = Number(newJobDiscount) || 0;
      const gross = amt + d;
      const q = Number(newJobQty) || 1;
      setNewJobRate(parseFloat((gross / q).toFixed(2)));
    }
  }, [newJobAmount, newJobQty, newJobDiscount, newJobLastCalculatedBy, isQuickJobModalOpen]);

  const filteredClientsForJob = useMemo(() => {
    // Exclude system settings client row
    const actualClients = clients.filter(
      (c) => c.email !== "settings@netra.graphics" && c.phone !== "SYSTEM"
    );
    if (!clientSearchQuery.trim()) return actualClients;
    const q = clientSearchQuery.toLowerCase();
    return actualClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [clients, clientSearchQuery]);

  useEffect(() => {
    if (redirectBackToMicroJob && typeof redirectBackToMicroJob === "number") {
      setIsQuickJobModalOpen(true);
      setNewJobClientLink(redirectBackToMicroJob);
      if (setRedirectBackToMicroJob) {
        setRedirectBackToMicroJob(false);
      }
    }
  }, [redirectBackToMicroJob, setRedirectBackToMicroJob]);


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

  const getUniqueMicroJobInvoiceNumber = () => {
    const cmsInvoices = invoices.filter(i => i.invoiceNo && i.invoiceNo.startsWith('CMS'));
    let serial = 1;
    const serialNumbers = cmsInvoices.map(i => {
      const numStr = i.invoiceNo.substring(3); // skip 'CMS'
      const num = parseInt(numStr, 10);
      return isNaN(num) ? 0 : num;
    });
    if (serialNumbers.length > 0) {
      serial = Math.max(...serialNumbers) + 1;
    }
    let invNo = `CMS${String(serial).padStart(4, '0')}`;
    while (invoices.some(i => i.invoiceNo === invNo)) {
      serial++;
      invNo = `CMS${String(serial).padStart(4, '0')}`;
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
    const invoiceNo = getUniqueMicroJobInvoiceNumber();
    
    setIsGeneratingInvoice(true);
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

      if (setActiveAdminModule) {
        setActiveAdminModule("INVOICES");
      }
      if (setInvoiceDefaultTab) {
        setInvoiceDefaultTab("MICRO_JOB");
      }
    } catch (err: any) {
      console.error("Failed to generate cumulative invoice:", err);
      toast({
        title: "Generation Failed",
        description: err.message || "An error occurred during invoice creation.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInvoice(false);
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
        qty: Number(newJobQty) || 1,
        rate: Number(newJobRate) || 0,
        discount: Number(newJobDiscount) || 0,
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
      setNewJobQty("");
      setNewJobRate("");
      setNewJobDiscount(0);
      setNewJobLastCalculatedBy("rate");
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

  const handleDeleteMicroJob = async () => {
    if (!jobToDelete) return;
    try {
      await deleteMicroJob(jobToDelete.jobId);
      setMicroJobs(prev => prev.filter(j => j.jobId !== jobToDelete.jobId));
      setSelectedJobIds(prev => prev.filter(id => id !== jobToDelete.jobId));
      toast({ title: "Micro-Job Deleted", description: `"${jobToDelete.taskName}" has been removed from the ledger.` });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete the micro-job.", variant: "destructive" });
    } finally {
      setJobToDelete(null);
      setIsDeleteJobModalOpen(false);
    }
  };

  const handleClearAllMicroJobs = async () => {
    setIsClearingAll(true);
    try {
      // 1. Get all CMS invoices from supabase and delete them
      const microJobInvoices = invoices.filter(inv =>
        (inv.invoiceNo && inv.invoiceNo.startsWith('CMS')) ||
        (inv.microJobIds && inv.microJobIds.length > 0)
      );
      for (const inv of microJobInvoices) {
        try {
          await supabase.from('invoices').delete().eq('id', inv.id);
        } catch (e) { /* continue */ }
      }

      // 2. Clear all cashbook entries linked to micro-job invoices
      if (setCashbookEntries) {
        const invIds = new Set(microJobInvoices.map(i => i.id));
        const invNos = new Set(microJobInvoices.map(i => i.invoiceNo));
        setCashbookEntries(prev => prev.filter(entry =>
          !invIds.has(entry.invoiceId) &&
          !invNos.has(entry.invoiceNo) &&
          !microJobInvoices.some(inv => entry.desc && entry.desc.includes(inv.invoiceNo))
        ));
      }

      // 3. Remove from invoices state
      if (setInvoices) {
        setInvoices(prev => prev.filter(inv =>
          !(inv.invoiceNo && inv.invoiceNo.startsWith('CMS')) &&
          !(inv.microJobIds && inv.microJobIds.length > 0)
        ));
      }

      // 4. Clear all micro-job ledger entries
      await clearAllMicroJobs();
      setMicroJobs([]);
      setSelectedJobIds([]);

      toast({
        title: "Micro-Job Ledger Cleared",
        description: "All micro-jobs, their invoices, and related financial entries have been purged."
      });
    } catch (err: any) {
      toast({ title: "Clear Failed", description: err.message || "An error occurred while clearing micro-jobs.", variant: "destructive" });
    } finally {
      setIsClearingAll(false);
      setIsClearAllModalOpen(false);
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
  const [formAlertMeDays, setFormAlertMeDays] = useState<number | "">("");

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

  const isJobSettled = useCallback((job: any) => {
    if (!job.invoiceLink) return false;
    const inv = invoices.find((i: any) => i.id === job.invoiceLink);
    return inv ? inv.paymentStatus?.toLowerCase() === 'paid' : false;
  }, [invoices]);

  const selectedClientLink = useMemo(() => {
    if (selectedJobIds.length === 0) return null;
    const selectedJob = microJobs.find(job => selectedJobIds.includes(job.jobId));
    return selectedJob ? selectedJob.clientLink : null;
  }, [microJobs, selectedJobIds]);

  const displayedJobs = useMemo(() => {
    const unbilled = microJobs.filter(job => job.billingStatus === "Unbilled");
    if (selectedClientLink !== null) {
      return unbilled.filter(job => job.clientLink === selectedClientLink);
    }
    return unbilled;
  }, [microJobs, selectedClientLink]);

  const unbilledDisplayedJobs = useMemo(() => {
    return displayedJobs;
  }, [displayedJobs]);

  const unbilledCount = useMemo(() => {
    if (selectedClientLink !== null) {
      return microJobs.filter(job => job.clientLink === selectedClientLink && job.billingStatus === "Unbilled").length;
    }
    return unbilledJobs.length;
  }, [microJobs, unbilledJobs, selectedClientLink]);


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
    setFormAlertMeDays(project.alertMeDays !== undefined ? project.alertMeDays : "");
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
        acknowledgedDeadline: editingProject?.acknowledgedDeadline || '',
        alertMeDays: formAlertMeDays
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
        alertMeDays: formAlertMeDays,
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
              ? `${unbilledCount} unbilled micro jobs`
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
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsQuickJobModalOpen(true)}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 gap-2 font-bold text-xs rounded-xl"
              data-testid="button-log-microjob"
            >
              <Plus className="w-4 h-4" />
              LOG NEW JOB
            </Button>
            {microJobs.length > 0 && (
              <Button
                onClick={() => setIsClearAllModalOpen(true)}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 gap-2 font-bold text-xs rounded-xl"
                title="Purge all micro-jobs, invoices and financial entries"
              >
                <Trash2 className="w-4 h-4" />
                CLEAR ALL
              </Button>
            )}
          </div>
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
            <option value="microjobs">MICRO-JOBS LEDGER</option>
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
        <div className="flex items-center gap-2 ml-auto">
          {activeTab === "MicroJobs" && selectedJobIds.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setSelectedJobIds([])}
              className="h-7 px-3 text-3xs font-black tracking-widest text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl uppercase transition-all duration-200 mr-2"
            >
              CLEAR SELECTION
            </Button>
          )}
          <div className="flex items-center gap-2 text-3xs font-mono font-bold tracking-widest text-muted-foreground bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              {activeTab === "MicroJobs"
                ? `UNBILLED: ${unbilledCount}`
                : `MATCHED: ${filtered.length}`}
            </span>
          </div>
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
                      checked={unbilledDisplayedJobs.length > 0 && unbilledDisplayedJobs.every(job => selectedJobIds.includes(job.jobId))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobIds(unbilledDisplayedJobs.map(job => job.jobId));
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
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white/95">
                {isLoadingJobs ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-semibold">
                      LOADING LEDGER DATA...
                    </td>
                  </tr>
                ) : displayedJobs.length > 0 ? (
                  displayedJobs.map(job => {
                    const isBilled = job.billingStatus === 'Billed';
                    const settled = isJobSettled(job);
                    
                    return (
                      <tr key={job.jobId} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 text-center">
                          {!isBilled && (
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
                          )}
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
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span>{job.taskName}</span>
                            {settled ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">SETTLED</Badge>
                            ) : isBilled ? (
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold">BILLED</Badge>
                            ) : null}
                          </div>
                          {(job.qty > 1 || job.discount > 0) && (
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">
                              {job.qty > 1 && `Qty: ${job.qty} × ₹${job.rate}`}
                              {job.qty > 1 && job.discount > 0 && " | "}
                              {job.discount > 0 && `Discount: ₹${job.discount}`}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-cyan-400">
                          ₹{job.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!settled && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-7 h-7 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 border border-white/5"
                                onClick={() => openEditMicroJob(job)}
                                title="Edit Micro-Job"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 rounded-lg hover:bg-red-500/10 hover:text-red-400 border border-white/5"
                              onClick={() => {
                                setJobToDelete(job);
                                setIsDeleteJobModalOpen(true);
                              }}
                              title="Delete Micro-Job"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-3xs font-semibold">
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
                disabled={isGeneratingInvoice}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/10 px-5 flex items-center gap-2"
              >
                {isGeneratingInvoice ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    GENERATING INVOICE...
                  </>
                ) : (
                  <>
                    ⚡ GENERATE CUMULATIVE INVOICE
                  </>
                )}
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Deadline</label>
                    <Input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-xl text-xs focus:border-cyan-400" />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Alert Me (Days)</label>
                    <Input type="number" min="0" value={formAlertMeDays} onChange={(e) => {
                      const val = e.target.value;
                      setFormAlertMeDays(val === "" ? "" : parseInt(val));
                    }}
                      className="bg-white/5 border-white/10 rounded-xl text-xs focus:border-cyan-400" placeholder="Default: 1" />
                  </div>
                  <div className="space-y-1.5 col-span-1">
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
          setNewJobQty("");
          setNewJobRate("");
          setNewJobDiscount(0);
          setNewJobLastCalculatedBy("rate");
          setNewJobDate(new Date().toISOString().split('T')[0]);
          setClientSearchQuery("");
          setIsClientDropdownOpen(false);
        }
      }}>
        <DialogContent className="bg-[#080c18] border border-white/10 max-w-md w-full p-0 overflow-hidden flex flex-col max-h-[90vh]" data-testid="dialog-quick-job-form">
          <div className="px-6 pt-5 pb-3 border-b border-white/10 text-left flex-shrink-0">
            <DialogTitle className="text-foreground font-black tracking-wide text-sm flex items-center gap-2">
              <span className="text-emerald-400">⚡</span> LOG NEW MICRO-JOB
            </DialogTitle>
            <p className="text-3xs text-muted-foreground uppercase tracking-widest mt-0.5">Record high-volume, ad-hoc running tab work</p>
          </div>

          <form onSubmit={handleCreateJob} className="flex-1 flex flex-col min-h-0 text-left">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Integrated Searchable Client Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Client Visionary *</label>
              
              <div className="relative">
                {/* Select Trigger / Search Input */}
                <div 
                  className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl flex items-center justify-between cursor-pointer font-semibold uppercase text-xs transition-all focus-within:border-cyan-400 select-none"
                  onClick={() => setIsClientDropdownOpen(prev => !prev)}
                >
                  {isClientDropdownOpen ? (
                    <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                      <Search className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Type client name or phone..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-foreground w-full uppercase placeholder:normal-case placeholder:text-muted-foreground/40"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className={`truncate ${newJobClientLink ? "text-foreground font-bold" : "text-muted-foreground/50"}`}>
                      {newJobClientLink 
                        ? (() => {
                            const selected = clients.find(c => c.id === newJobClientLink);
                            return selected ? `${selected.name} (${selected.phone})` : "-- SELECT CLIENT VISIONARY --";
                          })()
                        : "-- SELECT CLIENT VISIONARY --"}
                    </span>
                  )}
                  <span className="text-muted-foreground/80 text-[10px] ml-2 flex-shrink-0">
                    {isClientDropdownOpen ? "▲" : "▼"}
                  </span>
                </div>

                {/* Dropdown Options List */}
                {isClientDropdownOpen && (
                  <>
                    {/* Invisible overlay to close dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsClientDropdownOpen(false);
                      }} 
                    />
                    
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 max-h-56 overflow-y-auto bg-[#080c18] border border-white/10 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
                      {filteredClientsForJob.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                          <span>-- NO MATCHING CLIENTS --</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsClientDropdownOpen(false);
                              setIsQuickJobModalOpen(false);
                              if (onTriggerAddClientFromMicroJob) {
                                onTriggerAddClientFromMicroJob();
                              }
                            }}
                            className="mt-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-2xs rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            + Add New Client
                          </button>
                        </div>
                      ) : (
                        filteredClientsForJob.map(client => {
                          const isSelected = client.id === newJobClientLink;
                          return (
                            <div
                              key={client.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewJobClientLink(client.id);
                                setIsClientDropdownOpen(false);
                              }}
                              className={`p-3 text-xs uppercase cursor-pointer transition-colors flex items-center justify-between hover:bg-cyan-500/10 hover:text-cyan-400 ${
                                isSelected 
                                  ? "bg-cyan-500/15 text-cyan-400 font-black" 
                                  : "text-foreground/90"
                              }`}
                            >
                              <span className="font-bold">{client.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono font-normal normal-case ml-2">
                                {client.phone}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
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

            {/* Pricing details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={newJobQty}
                  onChange={(e) => {
                    setNewJobLastCalculatedBy("rate");
                    setNewJobQty(e.target.value === "" ? "" : parseInt(e.target.value) || 1);
                  }}
                  className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs"
                  placeholder="1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Rate (₹) per unit *</label>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={newJobRate}
                  onChange={(e) => {
                    setNewJobLastCalculatedBy("rate");
                    setNewJobRate(e.target.value);
                  }}
                  onFocus={() => { if (Number(newJobRate) === 0) setNewJobRate(""); }}
                  className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs"
                  placeholder="Rate per unit"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold flex-1">Gross Quote (Qty × Rate)</span>
              <span className="font-black text-sm text-foreground">₹{(Number(newJobQty) * Number(newJobRate) || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Special Discount (₹)</label>
                <Input
                  type="number"
                  min={0}
                  value={newJobDiscount}
                  onChange={(e) => {
                    setNewJobLastCalculatedBy("rate");
                    setNewJobDiscount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0);
                  }}
                  onFocus={() => { if (newJobDiscount === 0) setNewJobDiscount(""); }}
                  className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Estimated Quote (₹) *</label>
                <Input
                  type="number"
                  min={0}
                  value={newJobAmount}
                  onChange={(e) => {
                    setNewJobLastCalculatedBy("total");
                    setNewJobAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0);
                  }}
                  onFocus={() => { if (newJobAmount === 0) setNewJobAmount(""); }}
                  className="bg-[#0c101d] border-cyan-500/30 rounded-xl focus:border-cyan-400 text-xs text-cyan-300 font-bold"
                  placeholder="Auto-calculated"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 rounded-xl border border-white/10 overflow-hidden">
              {[
                { label: 'Gross', val: `₹${(Number(newJobQty) * Number(newJobRate) || 0).toLocaleString('en-IN')}`, color: 'text-foreground' },
                { label: 'Discount', val: `-₹${(typeof newJobDiscount === 'number' ? newJobDiscount : 0).toLocaleString('en-IN')}`, color: 'text-amber-400' },
                { label: 'Net Payable', val: `₹${(typeof newJobAmount === 'number' ? newJobAmount : 0).toLocaleString('en-IN')}`, color: 'text-cyan-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex flex-col items-center py-2.5 bg-white/5">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
                  <span className={`font-black text-xs mt-0.5 ${color}`}>{val}</span>
                </div>
              ))}
            </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-[#080c18] flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setNewJobClientLink("");
                  setNewJobTaskName("");
                  setNewJobAmount("");
                  setNewJobQty("");
                  setNewJobRate("");
                  setNewJobDiscount(0);
                  setNewJobLastCalculatedBy("rate");
                  setNewJobDate(new Date().toISOString().split('T')[0]);
                  setClientSearchQuery("");
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

      {/* Edit Micro-Job Modal */}
      <Dialog open={isEditJobModalOpen} onOpenChange={(open) => {
        setIsEditJobModalOpen(open);
        if (!open) {
          setEditingJob(null);
          setEditJobClientLink("");
          setEditJobTaskName("");
          setEditJobAmount("");
          setEditJobDate("");
          setEditJobClientSearchQuery("");
          setIsEditJobClientDropdownOpen(false);
          setEditJobQty("");
          setEditJobRate("");
          setEditJobDiscount(0);
          setEditJobLastCalculatedBy("rate");
        }
      }}>
        <DialogContent className="bg-[#080c18] border border-white/10 max-w-md w-full p-0 overflow-hidden flex flex-col max-h-[90vh]" data-testid="dialog-edit-job-form">
          <div className="px-6 pt-5 pb-3 border-b border-white/10 text-left flex-shrink-0">
            <DialogTitle className="text-foreground font-black tracking-wide text-sm flex items-center gap-2">
              <span className="text-cyan-400">✏️</span> EDIT MICRO-JOB
            </DialogTitle>
            <p className="text-3xs text-muted-foreground uppercase tracking-widest mt-0.5">Modify logged running tab work</p>
          </div>

          <form onSubmit={handleSaveMicroJob} className="flex-1 flex flex-col min-h-0 text-left">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Integrated Searchable Client Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Client Visionary *</label>
              
              <div className="relative">
                {/* Select Trigger / Search Input */}
                <div 
                  className="w-full h-10 px-3 bg-[#0c101d] border border-white/10 rounded-xl flex items-center justify-between cursor-pointer font-semibold uppercase text-xs transition-all focus-within:border-cyan-400 select-none"
                  onClick={() => setIsEditJobClientDropdownOpen(prev => !prev)}
                >
                  {isEditJobClientDropdownOpen ? (
                    <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                      <Search className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Type client name or phone..."
                        value={editJobClientSearchQuery}
                        onChange={(e) => setEditJobClientSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-foreground w-full uppercase placeholder:normal-case placeholder:text-muted-foreground/40"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className={`truncate ${editJobClientLink ? "text-foreground font-bold" : "text-muted-foreground/50"}`}>
                      {editJobClientLink 
                        ? (() => {
                            const selected = clients.find(c => c.id === editJobClientLink);
                            return selected ? `${selected.name} (${selected.phone})` : "-- SELECT CLIENT VISIONARY --";
                          })()
                        : "-- SELECT CLIENT VISIONARY --"}
                    </span>
                  )}
                  <span className="text-muted-foreground/80 text-[10px] ml-2 flex-shrink-0">
                    {isEditJobClientDropdownOpen ? "▲" : "▼"}
                  </span>
                </div>

                {/* Dropdown Options List */}
                {isEditJobClientDropdownOpen && (
                  <>
                    {/* Invisible overlay to close dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditJobClientDropdownOpen(false);
                      }} 
                    />
                    
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 max-h-56 overflow-y-auto bg-[#080c18] border border-white/10 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
                      {(() => {
                        const actualClients = clients.filter(
                          (c) => c.email !== "settings@netra.graphics" && c.phone !== "SYSTEM"
                        );
                        const filtered = editJobClientSearchQuery.trim()
                          ? (() => {
                              const q = editJobClientSearchQuery.toLowerCase();
                              return actualClients.filter(
                                (c) =>
                                  c.name.toLowerCase().includes(q) ||
                                  c.phone.toLowerCase().includes(q)
                              );
                            })()
                          : actualClients;

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              -- NO MATCHING CLIENTS --
                            </div>
                          );
                        }

                        return filtered.map(client => {
                          const isSelected = client.id === editJobClientLink;
                          return (
                            <div
                              key={client.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditJobClientLink(client.id);
                                setIsEditJobClientDropdownOpen(false);
                              }}
                              className={`p-3 text-xs uppercase cursor-pointer transition-colors flex items-center justify-between hover:bg-cyan-500/10 hover:text-cyan-400 ${
                                isSelected 
                                  ? "bg-cyan-500/15 text-cyan-400 font-black" 
                                  : "text-foreground/90"
                              }`}
                            >
                              <span className="font-bold">{client.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono font-normal normal-case ml-2">
                                {client.phone}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Task Name Input */}
            <div className="space-y-1.5">
              <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Task Name / Service *</label>
              <Input
                value={editJobTaskName}
                onChange={(e) => setEditJobTaskName(e.target.value)}
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
                value={editJobDate}
                onChange={(e) => setEditJobDate(e.target.value)}
                className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs text-foreground font-semibold"
                required
              />
            </div>

            {/* Pricing details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={editJobQty}
                  onChange={(e) => {
                    setEditJobLastCalculatedBy("rate");
                    setEditJobQty(e.target.value === "" ? "" : parseInt(e.target.value) || 1);
                  }}
                  className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs"
                  placeholder="1"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Rate (₹) per unit *</label>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={editJobRate}
                  onChange={(e) => {
                    setEditJobLastCalculatedBy("rate");
                    setEditJobRate(e.target.value);
                  }}
                  onFocus={() => { if (Number(editJobRate) === 0) setEditJobRate(""); }}
                  className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs"
                  placeholder="Rate per unit"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold flex-1">Gross Quote (Qty × Rate)</span>
              <span className="font-black text-sm text-foreground">₹{(Number(editJobQty) * Number(editJobRate) || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Special Discount (₹)</label>
                <Input
                  type="number"
                  min={0}
                  value={editJobDiscount}
                  onChange={(e) => {
                    setEditJobLastCalculatedBy("rate");
                    setEditJobDiscount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0);
                  }}
                  onFocus={() => { if (editJobDiscount === 0) setEditJobDiscount(""); }}
                  className="bg-[#0c101d] border-white/10 rounded-xl focus:border-cyan-400 text-xs"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Estimated Quote (₹) *</label>
                <Input
                  type="number"
                  min={0}
                  value={editJobAmount}
                  onChange={(e) => {
                    setEditJobLastCalculatedBy("total");
                    setEditJobAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0);
                  }}
                  onFocus={() => { if (editJobAmount === 0) setEditJobAmount(""); }}
                  className="bg-[#0c101d] border-cyan-500/30 rounded-xl focus:border-cyan-400 text-xs text-cyan-300 font-bold"
                  placeholder="Auto-calculated"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 rounded-xl border border-white/10 overflow-hidden">
              {[
                { label: 'Gross', val: `₹${(Number(editJobQty) * Number(editJobRate) || 0).toLocaleString('en-IN')}`, color: 'text-foreground' },
                { label: 'Discount', val: `-₹${(typeof editJobDiscount === 'number' ? editJobDiscount : 0).toLocaleString('en-IN')}`, color: 'text-amber-400' },
                { label: 'Net Payable', val: `₹${(typeof editJobAmount === 'number' ? editJobAmount : 0).toLocaleString('en-IN')}`, color: 'text-cyan-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex flex-col items-center py-2.5 bg-white/5">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
                  <span className={`font-black text-xs mt-0.5 ${color}`}>{val}</span>
                </div>
              ))}
            </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/10 bg-[#080c18] flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditJobModalOpen(false);
                  setEditingJob(null);
                  setEditJobClientLink("");
                  setEditJobTaskName("");
                  setEditJobAmount("");
                  setEditJobDate("");
                  setEditJobClientSearchQuery("");
                  setIsEditJobClientDropdownOpen(false);
                  setEditJobQty("");
                  setEditJobRate("");
                  setEditJobDiscount(0);
                  setEditJobLastCalculatedBy("rate");
                }}
                className="flex-1 border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 hover:text-foreground h-10 rounded-xl"
              >
                ✕ CANCEL
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold text-xs h-10 rounded-xl shadow-lg shadow-cyan-500/10 border-none cursor-pointer"
              >
                ✓ SAVE CHANGES
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Single Micro-Job Confirmation Modal ── */}
      <AnimatePresence>
        {isDeleteJobModalOpen && jobToDelete && (
          <div className="fixed inset-0 z-[10060] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#080c18] border border-red-500/30 rounded-2xl p-6 max-w-sm w-[90vw] shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-red-400 text-sm">DELETE MICRO-JOB</h3>
                  <p className="text-3xs text-muted-foreground uppercase tracking-wider">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-xs text-white/70 mb-5">
                Are you sure you want to permanently delete{' '}
                <span className="text-white font-bold">"{jobToDelete.taskName}"</span>?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 h-9 rounded-xl"
                  onClick={() => { setIsDeleteJobModalOpen(false); setJobToDelete(null); }}
                >
                  CANCEL
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs h-9 rounded-xl border-none"
                  onClick={handleDeleteMicroJob}
                >
                  DELETE
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Clear ALL Micro-Jobs Confirmation Modal ── */}
      <AnimatePresence>
        {isClearAllModalOpen && (
          <div className="fixed inset-0 z-[10060] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#080c18] border border-red-500/40 rounded-2xl p-6 max-w-md w-[90vw] shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-red-400 text-base">CLEAR ALL MICRO-JOBS</h3>
                  <p className="text-3xs text-muted-foreground uppercase tracking-wider">Irreversible purge operation</p>
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5 space-y-1.5">
                <p className="text-xs text-white/80 font-semibold">This will permanently delete:</p>
                <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                  <li>All micro-job ledger entries</li>
                  <li>All micro-job (CMS) invoices</li>
                  <li>All financial / cashbook entries linked to those invoices</li>
                </ul>
                <p className="text-3xs text-red-400 font-bold mt-2 uppercase tracking-wider">⚠ Regular project invoices are NOT affected</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1 border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 h-10 rounded-xl"
                  onClick={() => setIsClearAllModalOpen(false)}
                  disabled={isClearingAll}
                >
                  CANCEL
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs h-10 rounded-xl border-none"
                  onClick={handleClearAllMicroJobs}
                  disabled={isClearingAll}
                >
                  {isClearingAll ? "PURGING..." : "PURGE ALL MICRO-JOBS"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
