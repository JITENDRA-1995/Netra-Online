import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Trash2,
  Pencil,
  FileText,
  DollarSign,
  AlertCircle,
  Calendar,
  Coins,
  CreditCard,
  Percent,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getISTDateString } from "@/lib/utils";
import { deleteInvoice, deleteCashbookEntry } from "@/supabase/database";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FinancialsProps {
  ignitionQueue: any[];
  setIgnitionQueue: React.Dispatch<React.SetStateAction<any[]>>;
  cashbookEntries: any[];
  setCashbookEntries: React.Dispatch<React.SetStateAction<any[]>>;
  invoices: any[];
  setInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  clients?: any[];
  monthlyTarget: number;
  setMonthlyTarget: (t: number) => void;
  financialTab: string;
  setFinancialTab: (t: string) => void;
  financialMetrics: {
    totalRevenue: number;
    pendingDues: number;
    monthlyRevenue: number;
    targetProgress: number;
  };
  cashbookMetrics: {
    totalExpense: number;
    totalIncome: number;
    netFlow: number;
    upiFlow: number;
    cashFlow: number;
  };
  setCustomPaymentPrompt: (p: any) => void;
  setIsCashbookEditModalOpen: (b: boolean) => void;
  setSelectedCashbookEntry: (e: any) => void;
  setIsInvoicePreviewOpen: (b: boolean) => void;
  setInvoiceProject: (p: any) => void;
  selectedBatchProjects: any[];
  setSelectedBatchProjects: React.Dispatch<React.SetStateAction<any[]>>;
  selectedVaultInvoices: any[];
  setSelectedVaultInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  handleAddCashbookEntry: (e: any) => void;
  handleMarkMilestonePaid?: (p: any, type: 'deposit' | 'retainer') => void;
  handleUpdateProjectStatusHandy?: (projectId: number, newProjectStatus: string) => void;
  highlightedCashbookId?: number | null;
  ledgerSearch?: string;
  setLedgerSearch?: (s: string) => void;
  redirectFilterClient?: string;
  setRedirectFilterClient?: (s: string) => void;
  redirectFilterService?: string;
  setRedirectFilterService?: (s: string) => void;
  trashItems?: any[];
  setTrashItems?: React.Dispatch<React.SetStateAction<any[]>>;
  onRedirectToProjectEdit?: (projectId: number) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Financials({
  ignitionQueue,
  setIgnitionQueue,
  cashbookEntries,
  setCashbookEntries,
  invoices,
  setInvoices,
  clients = [],
  monthlyTarget,
  setMonthlyTarget,
  financialTab,
  setFinancialTab,
  financialMetrics,
  cashbookMetrics,
  setCustomPaymentPrompt,
  setIsCashbookEditModalOpen,
  setSelectedCashbookEntry,
  setIsInvoicePreviewOpen,
  setInvoiceProject,
  selectedBatchProjects,
  setSelectedBatchProjects,
  selectedVaultInvoices,
  setSelectedVaultInvoices,
  handleAddCashbookEntry,
  handleMarkMilestonePaid,
  handleUpdateProjectStatusHandy,
  highlightedCashbookId,
  ledgerSearch,
  setLedgerSearch,
  redirectFilterClient,
  setRedirectFilterClient,
  redirectFilterService,
  setRedirectFilterService,
  trashItems = [],
  setTrashItems,
  onRedirectToProjectEdit
}: FinancialsProps) {
  const { toast } = useToast();
  const [localSearch, setLocalSearch] = useState("");
  const [cashbookMode, setCashbookMode] = useState<"INCOME" | "EXPENSE">("INCOME");

  // Billings sorting state
  const [projSortField, setProjSortField] = useState<"service" | "targetValue" | "deadline" | null>(null);
  const [projSortDirection, setProjSortDirection] = useState<"asc" | "desc">("asc");

  const handleToggleProjSort = (field: "service" | "targetValue" | "deadline") => {
    if (projSortField === field) {
      setProjSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setProjSortField(field);
      setProjSortDirection("asc");
    }
  };

  // Cashbook sorting state
  const [cashbookSortField, setCashbookSortField] = useState<"date" | "desc" | "mode" | "amount" | null>("date");
  const [cashbookSortDirection, setCashbookSortDirection] = useState<"asc" | "desc">("desc");

  const handleToggleCashbookSort = (field: "date" | "desc" | "mode" | "amount") => {
    if (cashbookSortField === field) {
      setCashbookSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setCashbookSortField(field);
      setCashbookSortDirection("asc");
    }
  };

  const currentSearch = ledgerSearch !== undefined ? ledgerSearch : localSearch;
  const changeSearch = setLedgerSearch ? setLedgerSearch : setLocalSearch;

  // Filter states
  const [projClient, setProjClient] = useState<string>("all");
  const [projService, setProjService] = useState<string>("all");

  // Apply redirect filter from dashboard when props change
  useEffect(() => {
    if (redirectFilterClient && redirectFilterClient !== '') {
      setProjClient(redirectFilterClient);
      if (setRedirectFilterClient) setRedirectFilterClient('');
    }
  }, [redirectFilterClient]);

  useEffect(() => {
    if (redirectFilterService && redirectFilterService !== '') {
      setProjService(redirectFilterService);
      if (setRedirectFilterService) setRedirectFilterService('');
    }
  }, [redirectFilterService]);

  // Income Ledger Filters
  const [incSearch, setIncSearch] = useState("");
  const [incClient, setIncClient] = useState("all");
  const [incCategory, setIncCategory] = useState("all");

  // Expense Ledger Filters
  const [expSearch, setExpSearch] = useState("");
  const [expClient, setExpClient] = useState("all");
  const [expCategory, setExpCategory] = useState("all");

  // Date range filters for cashbook entries
  const [cashbookStartDate, setCashbookStartDate] = useState("");
  const [cashbookEndDate, setCashbookEndDate] = useState("");


  const upToDateQueue = useMemo(() => {
    return (ignitionQueue || []).map((p: any) => {
      let clientName = p.clientName || p.name;
      const liveClient = p.client 
        ? clients.find(c => 
            (p.client.id && String(c.id) === String(p.client.id)) ||
            (p.client.email && c.email && c.email.toLowerCase() === p.client.email.toLowerCase()) ||
            (p.client.phone && c.phone && c.phone === p.client.phone)
          )
        : null;
      if (liveClient) {
        clientName = liveClient.name;
      }
      return {
        ...p,
        clientName
      };
    });
  }, [ignitionQueue, clients]);

  const upToDateCashbookEntries = useMemo(() => {
    return (cashbookEntries || []).map((entry: any) => {
      let desc = entry.desc;
      if (entry.invoiceId) {
        const inv = invoices.find((i: any) => String(i.id) === String(entry.invoiceId));
        if (inv) {
          const oldClientName = inv.clientName;
          const liveClientName = clients.find(c => String(c.id) === String(inv.clientLink))?.name || inv.clientName;
          if (desc && oldClientName && liveClientName && oldClientName !== liveClientName) {
            desc = desc.replace(oldClientName, liveClientName);
          }
        }
      } else if (entry.projectId) {
        const currentProj = (ignitionQueue || []).find((p: any) => String(p.id) === String(entry.projectId));
        if (currentProj) {
          const oldClientName = currentProj.name;
          const liveClient = currentProj.client 
            ? clients.find(c => 
                (currentProj.client.id && String(c.id) === String(currentProj.client.id)) ||
                (currentProj.client.email && c.email && c.email.toLowerCase() === currentProj.client.email.toLowerCase()) ||
                (currentProj.client.phone && c.phone && c.phone === currentProj.client.phone)
              )
            : null;
          const liveClientName = liveClient?.name || currentProj.client?.name || currentProj.clientName || currentProj.name;
          if (desc && oldClientName && liveClientName && oldClientName !== liveClientName) {
            desc = desc.replace(oldClientName, liveClientName);
          }
        }
      }
      return {
        ...entry,
        desc
      };
    });
  }, [cashbookEntries, invoices, clients, ignitionQueue]);

  const availableClients = useMemo(() => {
    const names = new Set<string>();
    if (clients && Array.isArray(clients)) {
      clients.forEach(c => {
        if (c && c.name && c.email !== 'settings@netra.graphics') {
          names.add(c.name);
        }
      });
    }
    if (upToDateQueue && Array.isArray(upToDateQueue)) {
      upToDateQueue.forEach(p => {
        if (p && p.clientName) names.add(p.clientName);
      });
    }
    return Array.from(names).sort();
  }, [clients, upToDateQueue]);

  const availableServices = useMemo(() => {
    const services = new Set<string>();
    if (upToDateQueue && Array.isArray(upToDateQueue)) {
      upToDateQueue.forEach(p => {
        if (p && p.service) services.add(p.service);
      });
    }
    return Array.from(services).sort();
  }, [upToDateQueue]);

  const availableIncomeCategories = useMemo(() => {
    const categories = new Set<string>();
    if (upToDateCashbookEntries && Array.isArray(upToDateCashbookEntries)) {
      upToDateCashbookEntries.forEach(entry => {
        if (entry && entry.type === "INCOME" && entry.category) {
          categories.add(entry.category);
        }
      });
    }
    return Array.from(categories).sort();
  }, [upToDateCashbookEntries]);

  const availableExpenseCategories = useMemo(() => {
    const categories = new Set<string>();
    if (upToDateCashbookEntries && Array.isArray(upToDateCashbookEntries)) {
      upToDateCashbookEntries.forEach(entry => {
        if (entry && entry.type === "EXPENSE" && entry.category) {
          categories.add(entry.category);
        }
      });
    }
    return Array.from(categories).sort();
  }, [upToDateCashbookEntries]);

  // Filter logic
  const filteredProjects = useMemo(() => {
    const filtered = upToDateQueue.filter(p => {
      // 1. Global text search
      if (currentSearch) {
        const query = currentSearch.toLowerCase();
        const matchesQuery =
          p.clientName.toLowerCase().includes(query) ||
          p.service.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // 2. Client dropdown filter
      if (projClient !== "all") {
        if (p.clientName.toLowerCase() !== projClient.toLowerCase()) return false;
      }

      // 3. Service dropdown filter
      if (projService !== "all") {
        if (p.service.toLowerCase() !== projService.toLowerCase()) return false;
      }

      return true;
    });

    if (projSortField) {
      filtered.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        switch (projSortField) {
          case "service":
            valA = (a.service || "").toLowerCase();
            valB = (b.service || "").toLowerCase();
            break;
          case "targetValue":
            valA = (parseFloat(a.quote) || 0) - (parseFloat(a.discount) || 0);
            valB = (parseFloat(b.quote) || 0) - (parseFloat(b.discount) || 0);
            break;
          case "deadline":
            valA = a.deadline ? new Date(a.deadline).getTime() : 0;
            valB = b.deadline ? new Date(b.deadline).getTime() : 0;
            break;
        }

        if (valA < valB) return projSortDirection === "asc" ? -1 : 1;
        if (valA > valB) return projSortDirection === "asc" ? 1 : -1;
        
        // Fallback sorting: if values are equal, sort by id descending (latest first)
        return (b.id || 0) - (a.id || 0);
      });
    } else {
      // Default: sort latest projects first
      filtered.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
    }

    return filtered;
  }, [upToDateQueue, currentSearch, projClient, projService, projSortField, projSortDirection]);

  const filteredIncomeEntries = useMemo(() => {
    const filtered = upToDateCashbookEntries.filter(entry => {
      if (entry.type !== "INCOME") return false;

      // 1. Search text
      if (incSearch) {
        const query = incSearch.toLowerCase();
        const matchesQuery =
          (entry.desc || "").toLowerCase().includes(query) ||
          (entry.category || "").toLowerCase().includes(query) ||
          ((entry.mode || "").toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // 2. Client dropdown filter (client name in entry.desc)
      if (incClient !== "all") {
        const clientQuery = incClient.toLowerCase();
        if (!(entry.desc || "").toLowerCase().includes(clientQuery)) return false;
      }

      // 3. Category dropdown filter
      if (incCategory !== "all") {
        if ((entry.category || "").toLowerCase() !== (incCategory || "").toLowerCase()) return false;
      }

      // 4. Date range filter
      if (cashbookStartDate && entry.date < cashbookStartDate) return false;
      if (cashbookEndDate && entry.date > cashbookEndDate) return false;

      return true;
    });

    if (cashbookSortField) {
      filtered.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        switch (cashbookSortField) {
          case "date":
            valA = a.date ? new Date(a.date).getTime() : 0;
            valB = b.date ? new Date(b.date).getTime() : 0;
            break;
          case "desc":
            valA = (a.desc || "").toLowerCase();
            valB = (b.desc || "").toLowerCase();
            break;
          case "mode":
            valA = (a.mode || "").toLowerCase();
            valB = (b.mode || "").toLowerCase();
            break;
          case "amount":
            valA = a.amount || 0;
            valB = b.amount || 0;
            break;
        }

        if (valA < valB) return cashbookSortDirection === "asc" ? -1 : 1;
        if (valA > valB) return cashbookSortDirection === "asc" ? 1 : -1;
        
        // Fallback sorting: if values are equal, sort by date descending, then id descending (latest first)
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
    }

    return filtered;
  }, [upToDateCashbookEntries, incSearch, incClient, incCategory, cashbookSortField, cashbookSortDirection, cashbookStartDate, cashbookEndDate]);

  const filteredExpenseEntries = useMemo(() => {
    const filtered = upToDateCashbookEntries.filter(entry => {
      if (entry.type !== "EXPENSE") return false;

      // 1. Search text
      if (expSearch) {
        const query = expSearch.toLowerCase();
        const matchesQuery =
          (entry.desc || "").toLowerCase().includes(query) ||
          (entry.category || "").toLowerCase().includes(query) ||
          ((entry.mode || "").toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // 2. Client dropdown filter (client name in entry.desc)
      if (expClient !== "all") {
        const clientQuery = expClient.toLowerCase();
        if (!(entry.desc || "").toLowerCase().includes(clientQuery)) return false;
      }

      // 3. Category dropdown filter
      if (expCategory !== "all") {
        if ((entry.category || "").toLowerCase() !== (expCategory || "").toLowerCase()) return false;
      }

      // 4. Date range filter
      if (cashbookStartDate && entry.date < cashbookStartDate) return false;
      if (cashbookEndDate && entry.date > cashbookEndDate) return false;

      return true;
    });

    if (cashbookSortField) {
      filtered.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        switch (cashbookSortField) {
          case "date":
            valA = a.date ? new Date(a.date).getTime() : 0;
            valB = b.date ? new Date(b.date).getTime() : 0;
            break;
          case "desc":
            valA = (a.desc || "").toLowerCase();
            valB = (b.desc || "").toLowerCase();
            break;
          case "mode":
            valA = (a.mode || "").toLowerCase();
            valB = (b.mode || "").toLowerCase();
            break;
          case "amount":
            valA = a.amount || 0;
            valB = b.amount || 0;
            break;
        }

        if (valA < valB) return cashbookSortDirection === "asc" ? -1 : 1;
        if (valA > valB) return cashbookSortDirection === "asc" ? 1 : -1;
        
        // Fallback sorting: if values are equal, sort by date descending, then id descending (latest first)
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
    }

    return filtered;
  }, [upToDateCashbookEntries, expSearch, expClient, expCategory, cashbookSortField, cashbookSortDirection, cashbookStartDate, cashbookEndDate]);

  const filteredIncomeTotal = useMemo(() => {
    return filteredIncomeEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  }, [filteredIncomeEntries]);

  const filteredExpenseTotal = useMemo(() => {
    return filteredExpenseEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  }, [filteredExpenseEntries]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalEntryType, setModalEntryType] = useState<"INCOME" | "EXPENSE">("INCOME");

  const [selectedCategoryVal, setSelectedCategoryVal] = useState("");

  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [newCatNameInput, setNewCatNameInput] = useState("");
  const [editCatTab, setEditCatTab] = useState<"INCOME" | "EXPENSE">("INCOME");

  const handleRenameCategory = (oldName: string, newName: string, type: "INCOME" | "EXPENSE") => {
    if (!newName.trim()) return;
    if (oldName === newName) {
      setEditingCategoryName(null);
      return;
    }
    setCashbookEntries(prev => prev.map(entry => {
      if (entry.type === type && entry.category === oldName) {
        return { ...entry, category: newName.trim() };
      }
      return entry;
    }));
    if (selectedCategoryVal === oldName) {
      setSelectedCategoryVal(newName.trim());
    }
    toast({
      title: "Category Renamed",
      description: `Successfully renamed "${oldName}" to "${newName.trim()}" in all matching entries.`
    });
    setEditingCategoryName(null);
  };

  const handleDeleteCategory = (catName: string, type: "INCOME" | "EXPENSE") => {
    if (window.confirm(`Are you sure you want to delete the category "${catName}"? All matching cashbook entries will be reassigned to "Other".`)) {
      setCashbookEntries(prev => prev.map(entry => {
        if (entry.type === type && entry.category === catName) {
          return { ...entry, category: "Other" };
        }
        return entry;
      }));
      if (selectedCategoryVal === catName) {
        setSelectedCategoryVal("Other");
      }
      toast({
        title: "Category Deleted",
        description: `Successfully removed category "${catName}" and reassigned affected entries to "Other".`
      });
    }
  };

  const incomeCategories = useMemo(() => {
    const defaults = ["Service", "Other"];
    const set = new Set(defaults);
    (cashbookEntries || []).forEach(e => {
      if (e.type === "INCOME" && e.category) {
        set.add(e.category);
      }
    });
    return Array.from(set);
  }, [cashbookEntries]);

  const expenseCategories = useMemo(() => {
    const defaults = ["Software", "Hardware", "Marketing", "Salary", "Rent", "Other"];
    const set = new Set(defaults);
    (cashbookEntries || []).forEach(e => {
      if (e.type === "EXPENSE" && e.category) {
        set.add(e.category);
      }
    });
    return Array.from(set);
  }, [cashbookEntries]);

  const getCategoryLabel = (cat: string) => {
    if (cat === "Service") return "Service Income";
    if (cat === "Salary") return "Salary/Wages";
    return cat;
  };

  useEffect(() => {
    if (isAddModalOpen) {
      setSelectedCategoryVal(modalEntryType === "INCOME" ? "Service" : "Software");
    } else {
      setSelectedCategoryVal("");
    }
  }, [isAddModalOpen, modalEntryType]);

  const monthlyFlowData = useMemo(() => {
    const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        monthName: `${monthsList[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
        Income: 0,
        Expense: 0
      });
    }

    if (cashbookEntries && Array.isArray(cashbookEntries)) {
      cashbookEntries.forEach(entry => {
        if (!entry || !entry.date) return;
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        const bucket = last6Months.find(m => m.key === key);
        if (bucket) {
          const amt = parseFloat(entry.amount) || 0;
          if (entry.type === "INCOME") {
            bucket.Income += amt;
          } else if (entry.type === "EXPENSE") {
            bucket.Expense += amt;
          }
        }
      });
    }

    return last6Months;
  }, [cashbookEntries]);

  const expenseCategoryData = useMemo(() => {
    const breakdown: Record<string, number> = {};
    if (cashbookEntries && Array.isArray(cashbookEntries)) {
      cashbookEntries.forEach(entry => {
        if (entry && entry.type === "EXPENSE") {
          const cat = entry.category || "Other";
          breakdown[cat] = (breakdown[cat] || 0) + (parseFloat(entry.amount) || 0);
        }
      });
    }
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    return Object.entries(breakdown)
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? (value / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [cashbookEntries]);

  const categoryColors: Record<string, string> = {
    Software: "from-cyan-500 to-blue-500",
    Hardware: "from-violet-500 to-fuchsia-500",
    Marketing: "from-amber-500 to-orange-500",
    Salary: "from-emerald-500 to-teal-500",
    Rent: "from-rose-500 to-pink-500",
    Service: "from-cyan-400 to-emerald-400",
    Other: "from-slate-500 to-zinc-500"
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <style>{`
        @keyframes glowingPulse {
          0% { background-color: rgba(16, 185, 129, 0.05); box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.1); }
          50% { background-color: rgba(16, 185, 129, 0.25); box-shadow: inset 0 0 20px rgba(16, 185, 129, 0.4); }
          100% { background-color: rgba(16, 185, 129, 0.05); box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.1); }
        }
      `}</style>
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent" data-testid="heading-financials">
            Financial Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
            Netra Empire Accounts Calibration
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
          <Button
            size="sm"
            variant={financialTab === "OVERVIEW" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider shrink-0 w-full sm:w-auto justify-center ${financialTab === "OVERVIEW" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("OVERVIEW")}
          >
            FINANCIAL OVERVIEW
          </Button>
          <Button
            size="sm"
            variant={financialTab === "PROJECTS" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider shrink-0 w-full sm:w-auto justify-center ${financialTab === "PROJECTS" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("PROJECTS")}
          >
            IGNITION QUEUE
          </Button>
          <Button
            size="sm"
            variant={financialTab === "CASHBOOK" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider shrink-0 w-full sm:w-auto justify-center ${financialTab === "CASHBOOK" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("CASHBOOK")}
          >
            CASHBOOK ENTRIES
          </Button>
        </div>
      </motion.div>

      {/* Main Content Areas based on Tab */}
      {financialTab === "OVERVIEW" && (
        <motion.div variants={containerVariants} className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Total Revenue */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/[0.02] backdrop-blur-sm group cursor-default"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-emerald-500/10 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">TOTAL REVENUE</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
                <div className="text-3xl font-black text-foreground mb-1">
                  ₹{financialMetrics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Combined income in local storage model</p>
              </div>
            </motion.div>

            {/* 2. Pending Dues */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-cyan-500/20 bg-cyan-500/[0.02] backdrop-blur-sm group cursor-default"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-cyan-500/10 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">PENDING DUES</span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/15 border border-cyan-500/30">
                    <AlertCircle className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <div className="text-3xl font-black text-foreground mb-1">
                  ₹{financialMetrics.pendingDues.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Across active client configurations</p>
              </div>
            </motion.div>

            {/* 3. Monthly Target */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-violet-500/20 bg-violet-500/[0.02] backdrop-blur-sm group cursor-default"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-radial from-violet-500/10 to-transparent" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">MONTHLY TARGET</span>
                    <button
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-bold cursor-pointer"
                      onClick={() => {
                        const t = prompt("Set New Monthly Target (₹):", String(monthlyTarget));
                        if (t && !isNaN(Number(t))) setMonthlyTarget(parseInt(t));
                      }}
                    >
                      ✎ CALIBRATE
                    </button>
                  </div>
                  <div className="text-2xl font-black text-foreground mb-1 flex items-baseline gap-1.5">
                    ₹{financialMetrics.monthlyRevenue.toLocaleString()}
                    <span className="text-xs text-muted-foreground font-normal">/ ₹{(monthlyTarget / 1000).toFixed(0)}k</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-violet-400 font-bold">{Math.round(financialMetrics.targetProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${financialMetrics.targetProgress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 4. Net Cashflow */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-card/40 backdrop-blur-sm group cursor-default"
            >
              <div className="relative z-10">
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">NET CASHFLOW</span>
                <div className={`text-3xl font-black mt-2 ${cashbookMetrics.netFlow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {cashbookMetrics.netFlow >= 0 ? "+" : "-"}₹{Math.abs(cashbookMetrics.netFlow).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Difference between Income & Expenses</p>
              </div>
            </motion.div>

            {/* 5. Total Expenses */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-card/40 backdrop-blur-sm group cursor-default"
            >
              <div className="relative z-10">
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">TOTAL EXPENSES</span>
                <div className="text-3xl font-black mt-2 text-rose-400">
                  ₹{cashbookMetrics.totalExpense.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total recorded outgoing payments</p>
              </div>
            </motion.div>

            {/* 6. Cash / UPI Breakdown */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-card/40 backdrop-blur-sm group cursor-default"
            >
              <div className="relative z-10 flex gap-4 justify-around h-full items-center">
                <div>
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">CASH</span>
                  <div className="text-xl font-bold mt-1 text-cyan-400">₹{cashbookMetrics.cashFlow.toLocaleString()}</div>
                </div>
                <div className="border-l border-white/5 h-10 self-center" />
                <div>
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">UPI / ONLINE</span>
                  <div className="text-xl font-bold mt-1 text-amber-400">₹{cashbookMetrics.upiFlow.toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visual Analytics Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chart */}
            <motion.div
              variants={itemVariants}
              className="xl:col-span-2 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-6"
            >
              <h3 className="font-bold text-foreground text-lg mb-1">Income & Expense Trend</h3>
              <p className="text-xs text-muted-foreground mb-6">6-month overview of financials flow</p>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyFlowData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="monthName" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "bold" }}
                    />
                    <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                    <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Breakdown */}
            <motion.div
              variants={itemVariants}
              className="xl:col-span-1 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-foreground text-lg mb-1">Expense Categories</h3>
                <p className="text-xs text-muted-foreground mb-6">Distribution of outgoing funds</p>
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                  {expenseCategoryData.map((item) => {
                    const color = categoryColors[item.name] || "from-slate-500 to-zinc-500";
                    return (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          <span className="text-muted-foreground">₹{item.value.toLocaleString()} ({Math.round(item.percent)}%)</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${item.percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {expenseCategoryData.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      No expenses logged yet
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {financialTab === "PROJECTS" && (
        <motion.div variants={containerVariants} className="space-y-6 flex flex-col h-auto sm:h-[calc(100vh-180px)]">
          {/* Ledger Table Container */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 flex flex-col flex-1 overflow-visible sm:overflow-hidden space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-foreground text-lg">Ledger & Ignition Queue</h3>
                <p className="text-xs text-muted-foreground">Calibrate contract quotes, discounts, and log transactions</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedBatchProjects.length > 0 && (
                  <Button
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs"
                    onClick={() => {
                      const selected = ignitionQueue.filter(p => selectedBatchProjects.includes(p.id));
                      const clients = [...new Set(selected.map(p => p.name))];
                      if (clients.length > 1) {
                        alert("Batch invoices can only be generated for a single client at a time.");
                        return;
                      }

                      const getDiscountAmt = (p: any) => {
                        if (p.discountType === "rs") return parseFloat(p.discountValue) || 0;
                        if (p.discountType === "%") return ((parseFloat(p.discountValue) || 0) / 100) * p.quote;
                        return parseFloat(p.discount) || 0;
                      };

                      const batchProject = {
                        ...selected[0],
                        id: `batch-${Date.now()}`,
                        service: selected.map(p => p.service).join(", "),
                        quote: selected.reduce((sum, p) => sum + (parseFloat(p.quote) || 0), 0),
                        discount: selected.reduce((sum, p) => sum + getDiscountAmt(p), 0),
                        advanceAmount: selected.reduce((sum, p) => sum + (parseFloat(p.advanceAmount) || 0), 0),
                        items: selected.map(p => ({
                          ...p,
                          discount: getDiscountAmt(p)
                        }))
                      };
                      setInvoiceProject(batchProject);
                      setIsInvoicePreviewOpen(true);
                    }}
                  >
                    GENERATE BATCH INVOICE ({selectedBatchProjects.length})
                  </Button>
                )}
              </div>
            </div>

            {/* Multi-Level Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Global Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="pl-9 h-9 bg-white/5 border-white/10 text-xs rounded-xl text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50"
                  placeholder="Global search..."
                  value={currentSearch}
                  onChange={(e) => changeSearch(e.target.value)}
                />
              </div>

              {/* Client Select */}
              <select
                value={projClient}
                onChange={(e) => setProjClient(e.target.value)}
                className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full font-bold bg-[#0a0f1e]"
              >
                <option value="all">All Clients</option>
                {availableClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>

              {/* Service Select */}
              <select
                value={projService}
                onChange={(e) => setProjService(e.target.value)}
                className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full font-bold bg-[#0a0f1e]"
              >
                <option value="all">All Services</option>
                {availableServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>

              {/* Reset Button */}
              <Button
                size="sm"
                variant="ghost"
                disabled={projClient === "all" && projService === "all" && currentSearch === ""}
                onClick={() => {
                  setProjClient("all");
                  setProjService("all");
                  changeSearch("");
                }}
                className="h-9 px-3 text-2xs font-extrabold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 rounded-xl disabled:opacity-40"
              >
                RESET FILTERS
              </Button>
            </div>

            <div className="overflow-x-auto overflow-y-auto border border-white/5 rounded-xl flex-1 scrollbar-thin mt-2">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-[#0a0f1e] z-10 border-b border-white/5">
                  <tr className="border-b border-white/5 bg-white/[0.01] text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    <th style={{ width: "40px" }} className="p-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded accent-emerald-400"
                        onChange={(e) => {
                          if (e.target.checked) {
                            const activeProjects = filteredProjects.filter(p => {
                              const st = (p.status || "Active").toLowerCase();
                              return st === "active" || st === "ongoing";
                            });
                            if (activeProjects.length > 0) {
                              alert("Warning: Active projects cannot be selected for batch invoicing. Only completed or non-active projects will be selected.");
                              const nonActiveIds = filteredProjects
                                .filter(p => {
                                  const st = (p.status || "Active").toLowerCase();
                                  return st !== "active" && st !== "ongoing";
                                })
                                .map(p => p.id);
                              setSelectedBatchProjects(nonActiveIds);
                              e.target.checked = false;
                            } else {
                              setSelectedBatchProjects(filteredProjects.map(p => p.id));
                            }
                          } else {
                            setSelectedBatchProjects([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-4 cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => handleToggleProjSort("service")}>
                      <div className="flex items-center gap-1.5">
                        <span>Mission / Client</span>
                        {projSortField === "service" ? (
                          projSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </div>
                    </th>
                    <th className="p-4 text-left">Milestone Billings (Adv / Bal)</th>
                    <th className="p-4 text-right cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => handleToggleProjSort("targetValue")}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Target Value</span>
                        {projSortField === "targetValue" ? (
                          projSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </div>
                    </th>
                    <th className="p-4 text-center cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => handleToggleProjSort("deadline")}>
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Deadline</span>
                        {projSortField === "deadline" ? (
                          projSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </div>
                    </th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((p) => {
                      const baseQuote = parseFloat(p.quote) || 0;
                      const discountVal = parseFloat(p.discount) || 0;
                      const finalQuote = baseQuote - discountVal;
                      const advanceAmt = parseFloat(p.advanceAmount) || 0;
                      const balanceAmt = Math.max(0, finalQuote - advanceAmt);

                      // Check if deposit or retainer invoice exists in invoices array
                      const hasDepositInvoice = invoices.some(inv => inv.projectId === p.id && (inv.invoiceNo?.includes('-DEP') || inv.clientName?.toLowerCase().includes('deposit') || inv.projectService?.toLowerCase().includes('deposit') || inv.clientName?.toLowerCase().includes('advance') || inv.projectService?.toLowerCase().includes('advance')));
                      const hasRetainerInvoice = invoices.some(inv => inv.projectId === p.id && (inv.invoiceNo?.includes('-COM') || inv.clientName?.toLowerCase().includes('retainer') || inv.projectService?.toLowerCase().includes('retainer') || inv.projectService?.toLowerCase().includes('completion') || inv.clientName?.toLowerCase().includes('final') || inv.projectService?.toLowerCase().includes('final')));

                      const depPaid = p.paymentStatus === 'paid' || p.paymentStatus === 'part' || advanceAmt > 0;
                      const depInvoiced = hasDepositInvoice;

                      const retPaid = p.paymentStatus === 'paid' || p.status === 'Completed';
                      const retInvoiced = hasRetainerInvoice;

                      return (
                        <tr key={p.id} className="hover:bg-white/[0.01] transition-colors text-xs">
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedBatchProjects.includes(p.id)}
                              className="rounded accent-emerald-400"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const st = (p.status || "Active").toLowerCase();
                                  if (st === "active" || st === "ongoing") {
                                    alert(`Warning: The project "${p.service}" for client "${p.name}" is Active. Active projects cannot be selected. Please complete the project before selecting.`);
                                    e.target.checked = false;
                                    return;
                                  }
                                  setSelectedBatchProjects(prev => [...prev, p.id]);
                                } else {
                                  setSelectedBatchProjects(prev => prev.filter(id => id !== p.id));
                                }
                              }}
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{p.service}</span>
                              <span className="text-xs text-muted-foreground mt-0.5">{p.clientName || p.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-left">
                            <div className="flex flex-col gap-1.5 items-start">
                              <div className="flex items-center gap-1.5">
                                <span className="text-3xs text-muted-foreground uppercase font-bold tracking-wider w-16">Advance Payment:</span>
                                {depPaid ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-3xs font-extrabold px-2 py-0">PAID</Badge>
                                ) : depInvoiced ? (
                                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-3xs font-extrabold px-2 py-0">INVOICED</Badge>
                                ) : (
                                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-3xs font-extrabold px-2 py-0">UNPAID</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-3xs text-muted-foreground uppercase font-bold tracking-wider w-16">Final Payment:</span>
                                {retPaid ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-3xs font-extrabold px-2 py-0">PAID</Badge>
                                ) : retInvoiced ? (
                                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-3xs font-extrabold px-2 py-0">INVOICED</Badge>
                                ) : (
                                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-3xs font-extrabold px-2 py-0">UNPAID</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-semibold text-foreground">
                            <div>₹{finalQuote.toLocaleString()}</div>
                            <div className="text-3xs text-muted-foreground mt-0.5">₹{advanceAmt.toLocaleString()} Adv / ₹{balanceAmt.toLocaleString()} Bal</div>
                          </td>
                          <td className="p-4 text-center text-muted-foreground">
                            {p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                className="h-7 px-1.5 bg-[#0a0f1e] border border-white/10 rounded-lg text-3xs text-foreground outline-none focus:border-cyan-400 cursor-pointer font-bold bg-[#0a0f1e]"
                                value={p.status}
                                onChange={(e) => {
                                  if (handleUpdateProjectStatusHandy) {
                                    handleUpdateProjectStatusHandy(p.id, e.target.value);
                                  }
                                }}
                                title="Quick Status Update"
                              >
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              {/* Ignition Deposit Action Button */}
                              {!depPaid && advanceAmt > 0 && (
                                <>
                                  {!depInvoiced ? (
                                    <Button
                                      size="sm"
                                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-extrabold text-3xs py-1 px-2.5 h-7 rounded-lg"
                                      onClick={() => {
                                        const depProject = {
                                          ...p,
                                          invoiceType: 'deposit',
                                          quote: advanceAmt,
                                          discount: 0,
                                          advanceAmount: 0,
                                          service: `Advance Payment - ${p.service}`
                                        };
                                        setInvoiceProject(depProject);
                                        setIsInvoicePreviewOpen(true);
                                      }}
                                    >
                                      🔥 INVOICE ADVANCE
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-extrabold text-3xs py-1 px-2.5 h-7 rounded-lg"
                                      onClick={() => {
                                        if (handleMarkMilestonePaid) {
                                          handleMarkMilestonePaid(p, 'deposit');
                                        }
                                      }}
                                    >
                                      💰 MARK ADVANCE PAID
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* Delivery Retainer Action Button */}
                              {depPaid && p.status !== 'Completed' && (
                                <>
                                  {!retInvoiced && p.paymentStatus !== 'paid' && balanceAmt > 0 ? (
                                    <Button
                                      size="sm"
                                      className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-extrabold text-3xs py-1 px-2.5 h-7 rounded-lg"
                                      onClick={() => {
                                        const retProject = {
                                          ...p,
                                          invoiceType: 'retainer'
                                        };
                                        setInvoiceProject(retProject);
                                        setIsInvoicePreviewOpen(true);
                                      }}
                                    >
                                      📄 DRAFT INVOICE
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-extrabold text-3xs py-1 px-2.5 h-7 rounded-lg"
                                      onClick={() => {
                                        if (handleMarkMilestonePaid) {
                                          handleMarkMilestonePaid(p, 'retainer');
                                        }
                                      }}
                                    >
                                      🔥 COMPLETE & PAY
                                    </Button>
                                  )}
                                </>
                              )}

                              {p.status === 'Completed' && (
                                <span className="text-3xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-lg select-none">
                                  ✓ MISSION SETTLED
                                </span>
                              )}

                              {/* Standard billing preview / workspace trigger */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-8 h-8 rounded-lg hover:bg-white/10 hover:text-white border border-white/5 ml-1"
                                title="Open Custom Invoicing Workspace"
                                onClick={() => {
                                  setInvoiceProject(p);
                                  setIsInvoicePreviewOpen(true);
                                }}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No active records found matching ledger search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {financialTab === "CASHBOOK" && (
        <motion.div variants={containerVariants} className="space-y-6 flex flex-col h-auto sm:h-[calc(100vh-180px)]">
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 flex flex-col flex-1 overflow-visible sm:overflow-hidden space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-foreground text-base">
                  {cashbookMode === "INCOME" ? "Cashbook Entries Ledger (Income)" : "Cashbook Entries Ledger (Expense)"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {cashbookMode === "INCOME" ? "Historical records of incoming payments" : "Historical records of outgoing payments"}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-between sm:justify-start">
                {/* INCOME / EXPENSE Mode Toggle */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5">
                  <button
                    onClick={() => setCashbookMode("INCOME")}
                    className={`px-3.5 py-1.5 rounded-lg text-2xs font-extrabold transition-all cursor-pointer ${
                      cashbookMode === "INCOME"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-sm"
                        : "text-muted-foreground hover:text-foreground bg-transparent border border-transparent"
                    }`}
                  >
                    INCOME
                  </button>
                  <button
                    onClick={() => setCashbookMode("EXPENSE")}
                    className={`px-3.5 py-1.5 rounded-lg text-2xs font-extrabold transition-all cursor-pointer ${
                      cashbookMode === "EXPENSE"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-sm"
                        : "text-muted-foreground hover:text-foreground bg-transparent border border-transparent"
                    }`}
                  >
                    EXPENSE
                  </button>
                </div>

                {/* Add new entry button */}
                {cashbookMode === "INCOME" ? (
                  <Button
                    size="sm"
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-2xs rounded-xl cursor-pointer py-4"
                    onClick={() => {
                      setModalEntryType("INCOME");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> NEW INCOME
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-2xs rounded-xl cursor-pointer py-4"
                    onClick={() => {
                      setModalEntryType("EXPENSE");
                      setIsAddModalOpen(true);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> NEW EXPENSE
                  </Button>
                )}
              </div>
            </div>

            {/* Separate Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 pt-2">
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 ${
                cashbookMode === "INCOME" ? "lg:grid-cols-5" : "lg:grid-cols-3"
              }`}>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                  <Input
                    className={`pl-8 h-9 bg-white/5 border-white/10 text-xs rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-0 ${
                      cashbookMode === "INCOME" ? "focus:border-emerald-500/50" : "focus:border-rose-500/50"
                    }`}
                    placeholder={cashbookMode === "INCOME" ? "Search income..." : "Search expense..."}
                    value={cashbookMode === "INCOME" ? incSearch : expSearch}
                    onChange={(e) => cashbookMode === "INCOME" ? setIncSearch(e.target.value) : setExpSearch(e.target.value)}
                  />
                </div>
                
                {/* Client and Category dropdowns only show in INCOME mode */}
                {cashbookMode === "INCOME" && (
                  <>
                    <select
                      value={incClient}
                      onChange={(e) => setIncClient(e.target.value)}
                      className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full font-bold bg-[#0a0f1e]"
                    >
                      <option value="all">All Clients</option>
                      {availableClients.map(client => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>
                    <select
                      value={incCategory}
                      onChange={(e) => setIncCategory(e.target.value)}
                      className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full font-bold bg-[#0a0f1e]"
                    >
                      <option value="all">All Categories</option>
                      {availableIncomeCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </>
                )}

                {/* Date range filters */}
                <div className={`flex items-center gap-2 bg-white/5 border border-white/10 h-9 px-3 rounded-xl ${
                  cashbookMode === "INCOME" ? "focus-within:border-emerald-500/50" : "focus-within:border-rose-500/50"
                }`}>
                  <span className="text-3xs uppercase tracking-widest text-muted-foreground font-bold pointer-events-none whitespace-nowrap select-none">From:</span>
                  <Input
                    type="date"
                    value={cashbookStartDate}
                    onChange={(e) => setCashbookStartDate(e.target.value)}
                    className="h-full bg-transparent border-none text-xs text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none w-full p-0 min-w-0"
                  />
                </div>
                <div className={`flex items-center gap-2 bg-white/5 border border-white/10 h-9 px-3 rounded-xl ${
                  cashbookMode === "INCOME" ? "focus-within:border-emerald-500/50" : "focus-within:border-rose-500/50"
                }`}>
                  <span className="text-3xs uppercase tracking-widest text-muted-foreground font-bold pointer-events-none whitespace-nowrap select-none">To:</span>
                  <Input
                    type="date"
                    value={cashbookEndDate}
                    onChange={(e) => setCashbookEndDate(e.target.value)}
                    className="h-full bg-transparent border-none text-xs text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none w-full p-0 min-w-0"
                  />
                </div>
              </div>
              
              {cashbookMode === "INCOME" ? (
                (incSearch !== "" || incClient !== "all" || incCategory !== "all" || cashbookStartDate !== "" || cashbookEndDate !== "") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIncSearch("");
                      setIncClient("all");
                      setIncCategory("all");
                      setCashbookStartDate("");
                      setCashbookEndDate("");
                    }}
                    className="h-9 px-3 text-2xs font-extrabold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 rounded-xl shrink-0"
                  >
                    RESET
                  </Button>
                )
              ) : (
                (expSearch !== "" || cashbookStartDate !== "" || cashbookEndDate !== "") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setExpSearch("");
                      setCashbookStartDate("");
                      setCashbookEndDate("");
                    }}
                    className="h-9 px-3 text-2xs font-extrabold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 rounded-xl shrink-0"
                  >
                    RESET
                  </Button>
                )
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto overflow-y-auto border border-white/5 rounded-xl flex-1 scrollbar-thin mt-2">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-[#0a0f1e] z-10 border-b border-white/5">
                  <tr className="border-b border-white/5 bg-white/[0.01] text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="p-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => handleToggleCashbookSort("date")}>
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        {cashbookSortField === "date" ? (
                          cashbookSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => handleToggleCashbookSort("desc")}>
                      <div className="flex items-center gap-1.5">
                        <span>Description / Category</span>
                        {cashbookSortField === "desc" ? (
                          cashbookSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => handleToggleCashbookSort("mode")}>
                      <div className="flex items-center gap-1.5">
                        <span>Mode</span>
                        {cashbookSortField === "mode" ? (
                          cashbookSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => handleToggleCashbookSort("amount")}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Amount</span>
                        {cashbookSortField === "amount" ? (
                          cashbookSortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {cashbookMode === "INCOME" ? (
                    filteredIncomeEntries.length > 0 ? (
                      filteredIncomeEntries.map(entry => {
                        const isHighlighted = highlightedCashbookId === entry.id;
                        return (
                          <tr
                            key={entry.id}
                            className={`hover:bg-white/[0.01] transition-colors ${isHighlighted ? 'cashbook-row-highlight' : ''}`}
                            style={isHighlighted ? {
                              animation: 'glowingPulse 2s ease-in-out infinite',
                              background: 'rgba(16, 185, 129, 0.15)',
                              borderLeft: '4px solid #10b981'
                            } : {}}
                          >
                            <td className="p-3 text-muted-foreground">{entry.date}</td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground">{entry.desc}</span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-3xs text-muted-foreground">
                                  <span>{getCategoryLabel(entry.category)}</span>
                                  {entry.details && (
                                    <>
                                      <span className="text-white/20">•</span>
                                      <span className="italic max-w-[200px] truncate" title={entry.details}>
                                        {entry.details}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="border-white/10 text-muted-foreground text-3xs font-semibold px-2 py-0 font-bold">
                                {entry.mode}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-400">
                              +₹{entry.amount.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                {(() => {
                                  const linkedProj = entry.projectId ? ignitionQueue.find(p => p.id === entry.projectId) : null;
                                  const isCompleted = linkedProj && (linkedProj.status || '').toLowerCase() === 'completed';
                                  const isCustomInvoiceEntry = !!entry.invoiceId;
                                  const isEditDisabled = isCompleted || isCustomInvoiceEntry;
                                  
                                  return (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className={`w-7 h-7 ${isEditDisabled ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-cyan-500/10 hover:text-cyan-400'}`}
                                      disabled={isEditDisabled}
                                      title={
                                        isCompleted 
                                          ? "Completed project entries cannot be edited" 
                                          : isCustomInvoiceEntry 
                                            ? "Custom invoice entries cannot be edited" 
                                            : "Edit Entry"
                                      }
                                      onClick={() => {
                                        if (isEditDisabled) return;
                                        if (entry.projectId && onRedirectToProjectEdit) {
                                          onRedirectToProjectEdit(entry.projectId);
                                        } else {
                                          setSelectedCashbookEntry(entry);
                                          setIsCashbookEditModalOpen(true);
                                        }
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  );
                                })()}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={async () => {
                                    console.log("Delete clicked (income) for ID:", entry.id);
                                    if (window.confirm(`Delete this entry: ${entry.desc}?`)) {
                                      let deleteLinkedInvoice = false;
                                      if (entry.invoiceId) {
                                        deleteLinkedInvoice = window.confirm(
                                          "This entry is linked to a Custom Invoice. Do you want to delete the Custom Invoice from the system as well?"
                                        );
                                      }

                                      if (deleteLinkedInvoice && entry.invoiceId) {
                                        try {
                                          await deleteInvoice(entry.invoiceId);
                                          if (setInvoices) {
                                            setInvoices(prev => prev.filter(inv => inv.id !== entry.invoiceId));
                                          }
                                          toast({ title: "Custom Invoice deleted from system" });
                                        } catch (err: any) {
                                          console.error("Failed to delete linked invoice:", err);
                                          toast({
                                            title: "Invoice Deletion Failed",
                                            description: err.message || "Could not delete the custom invoice.",
                                            variant: "destructive"
                                          });
                                        }
                                      }

                                      if (setTrashItems) {
                                        setTrashItems(prev => [
                                          ...prev,
                                          {
                                            id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                            type: "cashbook",
                                            deletedAt: new Date().toISOString(),
                                            data: entry
                                          }
                                        ]);
                                      }
                                      setCashbookEntries(prev => {
                                        const filtered = prev.filter(e => String(e.id) !== String(entry.id));
                                        return filtered;
                                      });
                                      toast({ title: "Cashbook entry deleted" });
                                    }
                                  }}
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
                        <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-3xs font-semibold">
                          No Income Entries Found
                        </td>
                      </tr>
                    )
                  ) : (
                    filteredExpenseEntries.length > 0 ? (
                      filteredExpenseEntries.map(entry => {
                        const isHighlighted = highlightedCashbookId === entry.id;
                        return (
                          <tr
                            key={entry.id}
                            className={`hover:bg-white/[0.01] transition-colors ${isHighlighted ? 'cashbook-row-highlight' : ''}`}
                            style={isHighlighted ? {
                              animation: 'glowingPulse 2s ease-in-out infinite',
                              background: 'rgba(16, 185, 129, 0.15)',
                              borderLeft: '4px solid #10b981'
                            } : {}}
                          >
                            <td className="p-3 text-muted-foreground">{entry.date}</td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground">{entry.desc}</span>
                                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-3xs text-muted-foreground">
                                  <span>{getCategoryLabel(entry.category)}</span>
                                  {entry.details && (
                                    <>
                                      <span className="text-white/20">•</span>
                                      <span className="italic max-w-[200px] truncate" title={entry.details}>
                                        {entry.details}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="border-white/10 text-muted-foreground text-3xs font-semibold px-2 py-0 font-bold">
                                {entry.mode}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-bold text-rose-400">
                              -₹{entry.amount.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-end gap-1">
                                {(() => {
                                  const linkedProj = entry.projectId ? ignitionQueue.find(p => p.id === entry.projectId) : null;
                                  const isCompleted = linkedProj && (linkedProj.status || '').toLowerCase() === 'completed';
                                  
                                  return (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className={`w-7 h-7 ${isCompleted ? 'opacity-30 cursor-not-allowed text-muted-foreground' : 'hover:bg-cyan-500/10 hover:text-cyan-400'}`}
                                      disabled={isCompleted}
                                      onClick={() => {
                                        if (isCompleted) return;
                                        if (entry.projectId && onRedirectToProjectEdit) {
                                          onRedirectToProjectEdit(entry.projectId);
                                        } else {
                                          setSelectedCashbookEntry(entry);
                                          setIsCashbookEditModalOpen(true);
                                        }
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                  );
                                })()}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={() => {
                                    console.log("Delete clicked (expense) for ID:", entry.id);
                                    if (window.confirm(`Delete this entry: ${entry.desc}?`)) {
                                      if (setTrashItems) {
                                        setTrashItems(prev => [
                                          ...prev,
                                          {
                                            id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                            type: "cashbook",
                                            deletedAt: new Date().toISOString(),
                                            data: entry
                                          }
                                        ]);
                                      }
                                      setCashbookEntries(prev => {
                                        const filtered = prev.filter(e => String(e.id) !== String(entry.id));
                                        return filtered;
                                      });
                                      toast({ title: "Cashbook entry deleted" });
                                    }
                                  }}
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
                        <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-3xs font-semibold">
                          No Expense Entries Found
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
                <tfoot>
                  <tr className="sticky bottom-0 bg-[#0a0f1e] border-t border-white/10 font-bold text-xs">
                    <td className="p-3 text-muted-foreground uppercase font-black tracking-wider" colSpan={3}>
                      Grand Total
                    </td>
                    <td className={`p-3 text-right font-extrabold ${cashbookMode === "INCOME" ? "text-emerald-400" : "text-rose-400"}`}>
                      {cashbookMode === "INCOME" ? "+₹" : "-₹"}
                      {(cashbookMode === "INCOME" ? filteredIncomeTotal : filteredExpenseTotal).toLocaleString()}
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Record Entry Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg cursor-pointer bg-transparent border-none outline-none font-bold"
              >
                ×
              </button>
              
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2 uppercase tracking-wider">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  Record {modalEntryType.toLowerCase()} entry
                </h3>
                <p className="text-xs text-muted-foreground">Add new {modalEntryType.toLowerCase()} transaction to the ledger</p>
              </div>

              <form
                onSubmit={(e) => {
                  handleAddCashbookEntry(e);
                  setIsAddModalOpen(false);
                }}
                className="space-y-4"
              >
                <input type="hidden" name="type" value={modalEntryType} />
                
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Date</label>
                  <Input type="date" name="date" defaultValue={getISTDateString()} required className="bg-white/5 border-white/10 text-xs rounded-xl" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Description</label>
                  <Input type="text" name="desc" placeholder={modalEntryType === "EXPENSE" ? "e.g. Adobe CC subscription" : "e.g. Logo Design Advance"} required className="bg-white/5 border-white/10 text-xs rounded-xl" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Amount (₹)</label>
                    <Input type="number" name="amount" placeholder="0" required className="bg-white/5 border-white/10 text-xs rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Mode</label>
                    <select name="mode" className="w-full h-10 px-3 bg-[#0a0f1e] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 font-bold">
                      <option value="UPI">UPI / Online</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditCatTab(modalEntryType);
                        setIsManageCategoriesOpen(true);
                      }}
                      className="text-3xs uppercase tracking-wider font-extrabold text-cyan-400 hover:text-cyan-300 bg-transparent border-none cursor-pointer p-0"
                    >
                      ⚙ Manage
                    </button>
                  </div>
                  <select
                    name="category"
                    value={selectedCategoryVal}
                    onChange={(e) => setSelectedCategoryVal(e.target.value)}
                    className="w-full h-10 px-3 bg-[#0a0f1e] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 font-bold"
                  >
                    {modalEntryType === "INCOME" ? (
                      <>
                        {incomeCategories.map(cat => (
                          <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                        ))}
                        <option value="CUSTOM">Manual Entry...</option>
                      </>
                    ) : (
                      <>
                        {expenseCategories.map(cat => (
                          <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                        ))}
                        <option value="CUSTOM">Manual Entry...</option>
                      </>
                    )}
                  </select>
                </div>

                {selectedCategoryVal === "CUSTOM" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Enter Custom Category</label>
                    <Input
                      type="text"
                      name="customCategory"
                      placeholder="e.g. Fuel, Office Supplies"
                      required
                      className="bg-white/5 border-white/10 text-xs rounded-xl"
                    />
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Additional Details</label>
                  <textarea
                    name="details"
                    placeholder="Enter optional details..."
                    className="w-full min-h-[60px] max-h-[120px] px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 font-medium resize-y"
                  />
                </div>

                <Button type="submit" className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl py-5 cursor-pointer">
                  RECORD ENTRY
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Categories Modal Overlay */}
      <AnimatePresence>
        {isManageCategoriesOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              className="w-full max-w-sm bg-[#0a0f1e] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => { setIsManageCategoriesOpen(false); setEditingCategoryName(null); }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg cursor-pointer bg-transparent border-none outline-none font-bold"
              >
                ×
              </button>
              
              <div>
                <h3 className="font-bold text-foreground text-base flex items-center gap-2 uppercase tracking-wider">
                  MANAGE CATEGORIES
                </h3>
                <p className="text-xs text-muted-foreground">Edit or delete custom ledger categories</p>
              </div>

              <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5" style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`flex-1 py-1.5 rounded-lg text-2xs font-extrabold transition-all cursor-pointer ${
                    editCatTab === 'INCOME'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent'
                  }`}
                  onClick={() => { setEditCatTab('INCOME'); setEditingCategoryName(null); }}
                >
                  INCOME
                </button>
                <button
                  type="button"
                  className={`flex-1 py-1.5 rounded-lg text-2xs font-extrabold transition-all cursor-pointer ${
                    editCatTab === 'EXPENSE'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground bg-transparent border border-transparent'
                  }`}
                  onClick={() => { setEditCatTab('EXPENSE'); setEditingCategoryName(null); }}
                >
                  EXPENSE
                </button>
              </div>

              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                {(() => {
                  const list = editCatTab === "INCOME"
                    ? incomeCategories.filter(cat => !["Service", "Other"].includes(cat))
                    : expenseCategories.filter(cat => !["Software", "Hardware", "Marketing", "Salary", "Rent", "Other"].includes(cat));

                  if (list.length === 0) {
                    return <p className="text-muted-foreground text-center text-xs py-4">No custom categories found for this type.</p>;
                  }

                  return list.map(cat => {
                    const isEditing = editingCategoryName === cat;
                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-2.5"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={newCatNameInput}
                            onChange={(e) => setNewCatNameInput(e.target.value)}
                            autoFocus
                            className="flex-1 bg-black/40 border border-white/10 text-white rounded-lg px-2 py-1 text-xs outline-none mr-2 focus:border-cyan-400"
                          />
                        ) : (
                          <span className="text-white text-xs font-bold truncate max-w-[200px]" title={cat}>{cat}</span>
                        )}

                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRenameCategory(cat, newCatNameInput, editCatTab)}
                                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-emerald-500/20 font-bold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryName(null)}
                                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-rose-500/20 font-bold"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEditingCategoryName(cat); setNewCatNameInput(cat); }}
                                className="bg-white/5 hover:bg-white/10 text-cyan-400 p-1.5 rounded-lg cursor-pointer"
                                title="Edit category name"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat, editCatTab)}
                                className="bg-white/5 hover:bg-white/10 text-rose-400 p-1.5 rounded-lg cursor-pointer"
                                title="Delete category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <Button
                type="button"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl py-4 cursor-pointer mt-2"
                onClick={() => { setIsManageCategoriesOpen(false); setEditingCategoryName(null); }}
              >
                CLOSE
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
