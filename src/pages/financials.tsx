import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
}: FinancialsProps) {
  const { toast } = useToast();
  const [localSearch, setLocalSearch] = useState("");

  // Scroll-pin refs: metricsRef = the stats cards row, ledgerRef = the cashbook table wrapper
  const metricsRef = useRef<HTMLDivElement>(null);
  const ledgerRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(false);

  // Scroll-pinning: freeze outer scroll when metrics cards are above viewport, let ledger scroll
  useEffect(() => {
    if (financialTab !== 'CASHBOOK') return;

    // The admin vault page is the outer scrollable container
    const scrollContainer = document.querySelector('.admin-vault-page') as HTMLElement | null;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const metrics = metricsRef.current;
      const ledger = ledgerRef.current;
      if (!metrics || !ledger) return;

      const metricsRect = metrics.getBoundingClientRect();

      if (!isPinnedRef.current) {
        // The card row's BOTTOM edge has gone above 0 (top of viewport) — pin it
        if (metricsRect.bottom <= 8) {
          isPinnedRef.current = true;
          // Freeze the outer container at current scroll position
          scrollContainer.style.overflowY = 'hidden';
          // Give focus to ledger so mouse-wheel works on it
          ledger.style.overflowY = 'auto';
          ledger.style.maxHeight = `calc(100vh - 64px)`; // 64px = admin header height
          ledger.focus();
        }
      } else {
        // Already pinned — check if ledger has been scrolled back to top
        if (ledger.scrollTop === 0 && metricsRect.bottom <= 8) {
          // User tried to scroll up in ledger past top — unpin
          isPinnedRef.current = false;
          scrollContainer.style.overflowY = 'auto';
          ledger.style.overflowY = 'auto';
        }
      }
    };

    // Also handle wheel event for the ledger to propagate up when at top
    const handleLedgerWheel = (e: WheelEvent) => {
      const ledger = ledgerRef.current;
      if (!ledger || !isPinnedRef.current) return;

      // If scrolling up and already at top of ledger, unpin outer scroll
      if (e.deltaY < 0 && ledger.scrollTop === 0) {
        isPinnedRef.current = false;
        scrollContainer.style.overflowY = 'auto';
        ledger.style.overflowY = 'auto';
      }
    };

    const ledger = ledgerRef.current;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    if (ledger) ledger.addEventListener('wheel', handleLedgerWheel, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (ledger) ledger.removeEventListener('wheel', handleLedgerWheel);
      // Reset scroll container on unmount
      scrollContainer.style.overflowY = 'auto';
      isPinnedRef.current = false;
    };
  }, [financialTab]);

  const currentSearch = ledgerSearch !== undefined ? ledgerSearch : localSearch;
  const changeSearch = setLedgerSearch ? setLedgerSearch : setLocalSearch;

  // Filter states
  const [projClient, setProjClient] = useState<string>("all");
  const [projService, setProjService] = useState<string>("all");
  const [projManualService, setProjManualService] = useState<string>("");

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

  const [cashClient, setCashClient] = useState<string>("all");
  const [cashCategory, setCashCategory] = useState<string>("all");
  const [cashManualService, setCashManualService] = useState<string>("");

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

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    if (cashbookEntries && Array.isArray(cashbookEntries)) {
      cashbookEntries.forEach(entry => {
        if (entry && entry.category) categories.add(entry.category);
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

      // 4. Service manual filter
      if (projManualService) {
        const manualQuery = projManualService.toLowerCase();
        if (!p.service.toLowerCase().includes(manualQuery)) return false;
      }

      return true;
    });
  }, [ignitionQueue, currentSearch, projClient, projService, projManualService]);

  const filteredCashbookEntries = useMemo(() => {
    return cashbookEntries.filter(entry => {
      // 1. Global text search
      if (currentSearch) {
        const query = currentSearch.toLowerCase();
        const matchesQuery =
          entry.desc.toLowerCase().includes(query) ||
          entry.category.toLowerCase().includes(query) ||
          (entry.mode && entry.mode.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // 2. Client dropdown filter (client name in entry.desc)
      if (cashClient !== "all") {
        const clientQuery = cashClient.toLowerCase();
        if (!entry.desc.toLowerCase().includes(clientQuery)) return false;
      }

      // 3. Category dropdown filter
      if (cashCategory !== "all") {
        if (entry.category.toLowerCase() !== cashCategory.toLowerCase()) return false;
      }

      // 4. Manual service/category/desc filter
      if (cashManualService) {
        const manualQuery = cashManualService.toLowerCase();
        const matchesManual =
          entry.desc.toLowerCase().includes(manualQuery) ||
          entry.category.toLowerCase().includes(manualQuery);
        if (!matchesManual) return false;
      }

      return true;
    });
  }, [cashbookEntries, currentSearch, cashClient, cashCategory, cashManualService]);

  const filteredInvoices = invoices.filter(inv =>
    inv.clientName.toLowerCase().includes(currentSearch.toLowerCase()) ||
    (inv.projectService && inv.projectService.toLowerCase().includes(currentSearch.toLowerCase()))
  );

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
      {financialTab === "PROJECTS" && (
        <motion.div variants={containerVariants} className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-bold"
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
          </div>

          {/* Ledger Table Container */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
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
                className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full"
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
                className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full"
              >
                <option value="all">All Services</option>
                {availableServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>

              {/* Service Manual Input */}
              <Input
                className="h-9 bg-white/5 border-white/10 text-xs rounded-xl text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50"
                placeholder="Manual service..."
                value={projManualService}
                onChange={(e) => setProjManualService(e.target.value)}
              />

              {/* Reset Button */}
              <Button
                size="sm"
                variant="ghost"
                disabled={projClient === "all" && projService === "all" && projManualService === "" && currentSearch === ""}
                onClick={() => {
                  setProjClient("all");
                  setProjService("all");
                  setProjManualService("");
                  changeSearch("");
                }}
                className="h-9 px-3 text-2xs font-extrabold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 rounded-xl disabled:opacity-40"
              >
                RESET FILTERS
              </Button>
            </div>

            <div className="overflow-x-auto border border-white/5 rounded-xl">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
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
        <motion.div variants={containerVariants} className="space-y-6">
          {/* Stats row - tracked for scroll-pinning: when this exits top, ledger gets pinned scroll */}
          <div ref={metricsRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-card/40 backdrop-blur-sm group cursor-default"
            >
              <div className="relative z-10">
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">NET CASHFLOW</span>
                <div className={`text-3xl font-black mt-2 ${cashbookMetrics.netFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {cashbookMetrics.netFlow >= 0 ? "+" : "-"}₹{Math.abs(cashbookMetrics.netFlow).toLocaleString()}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-card/40 backdrop-blur-sm group cursor-default"
            >
              <div className="relative z-10">
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">TOTAL EXPENSES</span>
                <div className="text-3xl font-black mt-2 text-rose-400">
                  ₹{cashbookMetrics.totalExpense.toLocaleString()}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-2xl p-5 border border-white/5 bg-card/40 backdrop-blur-sm group cursor-default"
            >
              <div className="relative z-10 flex gap-4 justify-around">
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

          {/* Form & Table Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Record entry form */}
            <motion.div variants={itemVariants} className="xl:col-span-1 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4">
              <div>
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  Record cashbook entry
                </h3>
                <p className="text-xs text-muted-foreground">Add income or expense for financial model logging</p>
              </div>

              <form onSubmit={handleAddCashbookEntry} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Date</label>
                  <Input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required className="bg-white/5 border-white/10 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Description</label>
                  <Input type="text" name="desc" placeholder="e.g. Adobe CC subscription" required className="bg-white/5 border-white/10 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Amount (₹)</label>
                  <Input type="number" name="amount" placeholder="0" required className="bg-white/5 border-white/10 text-xs rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Type</label>
                    <select name="type" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400">
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Mode</label>
                    <select name="mode" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400">
                      <option value="UPI">UPI / Online</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Category</label>
                  <select name="category" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400">
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Salary">Salary/Wages</option>
                    <option value="Rent">Rent</option>
                    <option value="Service">Service Income</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl py-5">
                  RECORD ENTRY
                </Button>
              </form>
            </motion.div>

            {/* List - scroll-pinned: receives focus and internal scroll when metrics are above viewport */}
            <motion.div variants={itemVariants} className="xl:col-span-2 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-foreground text-lg">Cashbook Entries Ledger</h3>
                  <p className="text-xs text-muted-foreground">Historical records of cash flow items</p>
                </div>
              </div>

              {/* Multi-Level Filters Grid for Cashbook */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
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
                  value={cashClient}
                  onChange={(e) => setCashClient(e.target.value)}
                  className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full"
                >
                  <option value="all">All Clients</option>
                  {availableClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>

                {/* Category Select */}
                <select
                  value={cashCategory}
                  onChange={(e) => setCashCategory(e.target.value)}
                  className="h-9 px-3 bg-[#0a0f1e] border border-white/10 text-xs rounded-xl text-foreground focus:border-emerald-500/50 cursor-pointer w-full"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Service Manual Input */}
                <Input
                  className="h-9 bg-white/5 border-white/10 text-xs rounded-xl text-foreground placeholder:text-muted-foreground focus:border-emerald-500/50"
                  placeholder="Manual category/desc..."
                  value={cashManualService}
                  onChange={(e) => setCashManualService(e.target.value)}
                />

                {/* Reset Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cashClient === "all" && cashCategory === "all" && cashManualService === "" && currentSearch === ""}
                  onClick={() => {
                    setCashClient("all");
                    setCashCategory("all");
                    setCashManualService("");
                    changeSearch("");
                  }}
                  className="h-9 px-3 text-2xs font-extrabold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20 rounded-xl disabled:opacity-40"
                >
                  RESET FILTERS
                </Button>
              </div>

              <div
                ref={ledgerRef}
                tabIndex={-1}
                className="overflow-x-auto border border-white/5 rounded-xl outline-none"
                style={{ overflowY: 'auto', maxHeight: '100%' }}
              >
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      <th className="p-4">Date</th>
                      <th className="p-4">Description / Category</th>
                      <th className="p-4">Mode</th>
                      <th className="p-4 text-right">Amount</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredCashbookEntries.length > 0 ? (
                      filteredCashbookEntries.map(entry => {
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
                          <td className="p-4 text-muted-foreground">{entry.date}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{entry.desc}</span>
                              <span className="text-3xs text-muted-foreground mt-0.5">{entry.category}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="border-white/10 text-muted-foreground text-3xs font-semibold px-2 py-0">
                              {entry.mode}
                            </Badge>
                          </td>
                          <td className={`p-4 text-right font-bold ${entry.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {entry.type === 'INCOME' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                          </td>
                          <td className="p-4">
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
                                  if (window.confirm("Delete this entry?")) {
                                    setCashbookEntries(prev => prev.filter(e => e.id !== entry.id));
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
                          {currentSearch || cashClient !== "all" || cashCategory !== "all" || cashManualService ? "NO MATCHING ENTRIES FOUND" : "LEDGER IS VOID OF ENTRIES"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}


    </motion.div>
  );
}
