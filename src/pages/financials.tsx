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
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  setTrashItems
}: FinancialsProps) {
  const { toast } = useToast();
  const [localSearch, setLocalSearch] = useState("");
  const [cashbookMode, setCashbookMode] = useState<"INCOME" | "EXPENSE">("INCOME");

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

  // Derived lists for dropdowns
  const availableClients = useMemo(() => {
    const names = new Set<string>();
    if (clients && Array.isArray(clients)) {
      clients.forEach(c => {
        if (c && c.name && c.email !== 'settings@netra.graphics') {
          names.add(c.name);
        }
      });
    }
    if (ignitionQueue && Array.isArray(ignitionQueue)) {
      ignitionQueue.forEach(p => {
        if (p && p.name) names.add(p.name);
      });
    }
    return Array.from(names).sort();
  }, [clients, ignitionQueue]);

  const availableServices = useMemo(() => {
    const services = new Set<string>();
    if (ignitionQueue && Array.isArray(ignitionQueue)) {
      ignitionQueue.forEach(p => {
        if (p && p.service) services.add(p.service);
      });
    }
    return Array.from(services).sort();
  }, [ignitionQueue]);

  const availableIncomeCategories = useMemo(() => {
    const categories = new Set<string>();
    if (cashbookEntries && Array.isArray(cashbookEntries)) {
      cashbookEntries.forEach(entry => {
        if (entry && entry.type === "INCOME" && entry.category) {
          categories.add(entry.category);
        }
      });
    }
    return Array.from(categories).sort();
  }, [cashbookEntries]);

  const availableExpenseCategories = useMemo(() => {
    const categories = new Set<string>();
    if (cashbookEntries && Array.isArray(cashbookEntries)) {
      cashbookEntries.forEach(entry => {
        if (entry && entry.type === "EXPENSE" && entry.category) {
          categories.add(entry.category);
        }
      });
    }
    return Array.from(categories).sort();
  }, [cashbookEntries]);

  // Filter logic
  const filteredProjects = useMemo(() => {
    return ignitionQueue.filter(p => {
      // 1. Global text search
      if (currentSearch) {
        const query = currentSearch.toLowerCase();
        const matchesQuery =
          p.name.toLowerCase().includes(query) ||
          p.service.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // 2. Client dropdown filter
      if (projClient !== "all") {
        if (p.name.toLowerCase() !== projClient.toLowerCase()) return false;
      }

      // 3. Service dropdown filter
      if (projService !== "all") {
        if (p.service.toLowerCase() !== projService.toLowerCase()) return false;
      }

      return true;
    });
  }, [ignitionQueue, currentSearch, projClient, projService]);

  const filteredIncomeEntries = useMemo(() => {
    return cashbookEntries.filter(entry => {
      if (entry.type !== "INCOME") return false;

      // 1. Search text
      if (incSearch) {
        const query = incSearch.toLowerCase();
        const matchesQuery =
          entry.desc.toLowerCase().includes(query) ||
          entry.category.toLowerCase().includes(query) ||
          (entry.mode && entry.mode.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // 2. Client dropdown filter (client name in entry.desc)
      if (incClient !== "all") {
        const clientQuery = incClient.toLowerCase();
        if (!entry.desc.toLowerCase().includes(clientQuery)) return false;
      }

      // 3. Category dropdown filter
      if (incCategory !== "all") {
        if (entry.category.toLowerCase() !== incCategory.toLowerCase()) return false;
      }

      return true;
    });
  }, [cashbookEntries, incSearch, incClient, incCategory]);

  const filteredExpenseEntries = useMemo(() => {
    return cashbookEntries.filter(entry => {
      if (entry.type !== "EXPENSE") return false;

      // 1. Search text
      if (expSearch) {
        const query = expSearch.toLowerCase();
        const matchesQuery =
          entry.desc.toLowerCase().includes(query) ||
          entry.category.toLowerCase().includes(query) ||
          (entry.mode && entry.mode.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // 2. Client dropdown filter (client name in entry.desc)
      if (expClient !== "all") {
        const clientQuery = expClient.toLowerCase();
        if (!entry.desc.toLowerCase().includes(clientQuery)) return false;
      }

      // 3. Category dropdown filter
      if (expCategory !== "all") {
        if (entry.category.toLowerCase() !== expCategory.toLowerCase()) return false;
      }

      return true;
    });
  }, [cashbookEntries, expSearch, expClient, expCategory]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalEntryType, setModalEntryType] = useState<"INCOME" | "EXPENSE">("INCOME");

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
        <div className="flex w-full sm:w-auto overflow-x-auto scrollbar-none gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 max-w-full shrink-0">
          <Button
            size="sm"
            variant={financialTab === "OVERVIEW" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider shrink-0 ${financialTab === "OVERVIEW" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("OVERVIEW")}
          >
            FINANCIAL OVERVIEW
          </Button>
          <Button
            size="sm"
            variant={financialTab === "PROJECTS" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider shrink-0 ${financialTab === "PROJECTS" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("PROJECTS")}
          >
            IGNITION QUEUE
          </Button>
          <Button
            size="sm"
            variant={financialTab === "CASHBOOK" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider shrink-0 ${financialTab === "CASHBOOK" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
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
        <motion.div variants={containerVariants} className="space-y-6 flex flex-col h-[calc(100vh-180px)]">
          {/* Ledger Table Container */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 flex flex-col flex-1 overflow-hidden space-y-4">
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
                    <th className="p-4">Mission / Client</th>
                    <th className="p-4 text-left">Milestone Billings (Adv / Bal)</th>
                    <th className="p-4 text-right">Target Value</th>
                    <th className="p-4 text-center">Deadline</th>
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
                              <span className="text-xs text-muted-foreground mt-0.5">{p.name}</span>
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
                              {depPaid && !retPaid && balanceAmt > 0 && (
                                <>
                                  {!retInvoiced ? (
                                    <Button
                                      size="sm"
                                      className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-extrabold text-3xs py-1 px-2.5 h-7 rounded-lg"
                                      onClick={() => {
                                        const retProject = {
                                          ...p,
                                          invoiceType: 'retainer',
                                          quote: balanceAmt,
                                          discount: 0,
                                          advanceAmount: 0,
                                          service: `Final Payment - ${p.service}`
                                        };
                                        setInvoiceProject(retProject);
                                        setIsInvoicePreviewOpen(true);
                                      }}
                                    >
                                      📄 INVOICE FINAL
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

                              {depPaid && retPaid && (
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
        <motion.div variants={containerVariants} className="space-y-6 flex flex-col h-[calc(100vh-180px)]">
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 flex flex-col flex-1 overflow-hidden space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-foreground text-base">
                  {cashbookMode === "INCOME" ? "Cashbook Entries Ledger (Income)" : "Cashbook Entries Ledger (Expense)"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {cashbookMode === "INCOME" ? "Historical records of incoming payments" : "Historical records of outgoing payments"}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-2 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
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
              </div>
              
              {cashbookMode === "INCOME" ? (
                (incSearch !== "" || incClient !== "all" || incCategory !== "all") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIncSearch("");
                      setIncClient("all");
                      setIncCategory("all");
                    }}
                    className="h-9 px-3 text-2xs font-extrabold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 rounded-xl shrink-0"
                  >
                    RESET
                  </Button>
                )
              ) : (
                expSearch !== "" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setExpSearch("");
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
                    <th className="p-3">Date</th>
                    <th className="p-3">Description / Category</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3 text-right">Amount</th>
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
                                <span className="text-3xs text-muted-foreground mt-0.5">{entry.category}</span>
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
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 hover:bg-cyan-500/10 hover:text-cyan-400"
                                  onClick={() => {
                                    setSelectedCashbookEntry(entry);
                                    setIsCashbookEditModalOpen(true);
                                  }}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={() => {
                                    console.log("Delete clicked (income) for ID:", entry.id);
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
                                        console.log(`Filtered: before=${prev.length}, after=${filtered.length}`);
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
                                <span className="text-3xs text-muted-foreground mt-0.5">{entry.category}</span>
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
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 hover:bg-cyan-500/10 hover:text-cyan-400"
                                  onClick={() => {
                                    setSelectedCashbookEntry(entry);
                                    setIsCashbookEditModalOpen(true);
                                  }}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
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
                                        console.log(`Filtered: before=${prev.length}, after=${filtered.length}`);
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
                  <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required className="bg-white/5 border-white/10 text-xs rounded-xl" />
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
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Category</label>
                  <select name="category" className="w-full h-10 px-3 bg-[#0a0f1e] border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 font-bold">
                    {modalEntryType === "INCOME" ? (
                      <>
                        <option value="Service">Service Income</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Salary">Salary/Wages</option>
                        <option value="Rent">Rent</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                <Button type="submit" className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl py-5 cursor-pointer">
                  RECORD ENTRY
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </motion.div>
  );
}
