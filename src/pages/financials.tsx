import { useState } from "react";
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
  handleMarkMilestonePaid
}: FinancialsProps) {
  const { toast } = useToast();
  const [ledgerSearch, setLedgerSearch] = useState("");

  const filteredProjects = ignitionQueue.filter(p =>
    p.name.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    p.service.toLowerCase().includes(ledgerSearch.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv =>
    inv.clientName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    (inv.projectService && inv.projectService.toLowerCase().includes(ledgerSearch.toLowerCase()))
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent" data-testid="heading-financials">
            Financial Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
            Netra Empire Accounts Calibration
          </p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
          <Button
            size="sm"
            variant={financialTab === "PROJECTS" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider ${financialTab === "PROJECTS" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("PROJECTS")}
          >
            IGNITION QUEUE
          </Button>
          <Button
            size="sm"
            variant={financialTab === "CASHBOOK" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider ${financialTab === "CASHBOOK" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("CASHBOOK")}
          >
            CASHBOOK ENTRIES
          </Button>
          <Button
            size="sm"
            variant={financialTab === "INVOICES" ? "secondary" : "ghost"}
            className={`rounded-lg text-xs font-semibold tracking-wider ${financialTab === "INVOICES" ? "bg-white/10 text-emerald-400" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setFinancialTab("INVOICES")}
          >
            INVOICE VAULT
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
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9 bg-white/5 border-white/10 text-xs rounded-xl"
                    placeholder="Search ledger..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                  />
                </div>
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

            <div className="overflow-x-auto border border-white/5 rounded-xl">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    <th style={{ width: "40px" }} className="p-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded accent-emerald-400"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedBatchProjects(filteredProjects.map(p => p.id));
                          else setSelectedBatchProjects([]);
                        }}
                      />
                    </th>
                    <th className="p-4">Mission / Client</th>
                    <th className="p-4 text-left">Milestone Billings (50/50 Split)</th>
                    <th className="p-4 text-right">Target Value</th>
                    <th className="p-4 text-center">Deadline</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((p) => {
                      const baseQuote = p.quote || 0;
                      const milestoneAmt = baseQuote * 0.5;

                      // Check if deposit or retainer invoice exists in invoices array
                      const hasDepositInvoice = invoices.some(inv => inv.projectId === p.id && (inv.invoiceNo?.includes('-DEP') || inv.clientName?.toLowerCase().includes('deposit') || inv.projectService?.toLowerCase().includes('deposit')));
                      const hasRetainerInvoice = invoices.some(inv => inv.projectId === p.id && (inv.invoiceNo?.includes('-COM') || inv.clientName?.toLowerCase().includes('retainer') || inv.projectService?.toLowerCase().includes('retainer') || inv.projectService?.toLowerCase().includes('completion')));

                      const depPaid = p.paymentStatus === 'paid' || p.paymentStatus === 'part' || p.advanceAmount >= milestoneAmt;
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
                                if (e.target.checked) setSelectedBatchProjects(prev => [...prev, p.id]);
                                else setSelectedBatchProjects(prev => prev.filter(id => id !== p.id));
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
                                <span className="text-3xs text-muted-foreground uppercase font-bold tracking-wider w-16">Deposit (50%):</span>
                                {depPaid ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-3xs font-extrabold px-2 py-0">PAID</Badge>
                                ) : depInvoiced ? (
                                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-3xs font-extrabold px-2 py-0">INVOICED</Badge>
                                ) : (
                                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-3xs font-extrabold px-2 py-0">UNPAID</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-3xs text-muted-foreground uppercase font-bold tracking-wider w-16">Retainer (50%):</span>
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
                            <div>₹{baseQuote.toLocaleString()}</div>
                            <div className="text-3xs text-muted-foreground mt-0.5">₹{milestoneAmt.toLocaleString()} / milestone</div>
                          </td>
                          <td className="p-4 text-center text-muted-foreground">
                            {p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Ignition Deposit Action Button */}
                              {!depPaid && (
                                <>
                                  {!depInvoiced ? (
                                    <Button
                                      size="sm"
                                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-extrabold text-3xs py-1 px-2.5 h-7 rounded-lg"
                                      onClick={() => {
                                        const depProject = {
                                          ...p,
                                          invoiceType: 'deposit',
                                          quote: milestoneAmt,
                                          discount: 0,
                                          advanceAmount: 0,
                                          service: `Ignition Deposit (50%) - ${p.service}`
                                        };
                                        setInvoiceProject(depProject);
                                        setIsInvoicePreviewOpen(true);
                                      }}
                                    >
                                      🔥 IGNITE DEPOSIT (50%)
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
                                      💰 MARK DEPOSIT PAID
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* Delivery Retainer Action Button */}
                              {depPaid && !retPaid && (
                                <>
                                  {!retInvoiced ? (
                                    <Button
                                      size="sm"
                                      className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-extrabold text-3xs py-1 px-2.5 h-7 rounded-lg"
                                      onClick={() => {
                                        const retProject = {
                                          ...p,
                                          invoiceType: 'retainer',
                                          quote: milestoneAmt,
                                          discount: 0,
                                          advanceAmount: 0,
                                          service: `Delivery Retainer (50%) - ${p.service}`
                                        };
                                        setInvoiceProject(retProject);
                                        setIsInvoicePreviewOpen(true);
                                      }}
                                    >
                                      📄 INVOICE RETAINER (50%)
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
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* List */}
            <motion.div variants={itemVariants} className="xl:col-span-2 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4">
              <div>
                <h3 className="font-bold text-foreground text-lg">Cashbook Entries Ledger</h3>
                <p className="text-xs text-muted-foreground">Historical records of cash flow items</p>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-xl">
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
                    {cashbookEntries.length > 0 ? (
                      cashbookEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-white/[0.01] transition-colors">
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-3xs font-semibold">
                          LEDGER IS VOID OF ENTRIES
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

      {financialTab === "INVOICES" && (
        <motion.div variants={containerVariants} className="space-y-4">
          <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-foreground text-lg">Invoice Vault</h3>
                <p className="text-xs text-muted-foreground">Secure repository for generated tax invoice documents</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    className="pl-9 h-9 bg-white/5 border-white/10 text-xs rounded-xl"
                    placeholder="Search invoices..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                  />
                </div>
                {selectedVaultInvoices.length > 0 && (
                  <Button
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs"
                    onClick={() => {
                      if (window.confirm(`Delete ${selectedVaultInvoices.length} selected invoices? This action cannot be undone.`)) {
                        setInvoices(prev => prev.filter(inv => !selectedVaultInvoices.includes(inv.id)));
                        setSelectedVaultInvoices([]);
                        toast({ title: "Invoices deleted" });
                      }
                    }}
                  >
                    DELETE SELECTED ({selectedVaultInvoices.length})
                  </Button>
                )}
              </div>
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
                          if (e.target.checked) setSelectedVaultInvoices(filteredInvoices.map(inv => inv.id));
                          else setSelectedVaultInvoices([]);
                        }}
                      />
                    </th>
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Client / Project</th>
                    <th className="p-4 text-center">Issue Date</th>
                    <th className="p-4 text-right">Grand Total</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedVaultInvoices.includes(inv.id)}
                            className="rounded accent-emerald-400"
                            onChange={(e) => {
                              if (e.target.checked) setSelectedVaultInvoices(prev => [...prev, inv.id]);
                              else setSelectedVaultInvoices(prev => prev.filter(id => id !== inv.id));
                            }}
                          />
                        </td>
                        <td className="p-4 font-bold text-cyan-400">{inv.invoiceNo}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{inv.clientName}</span>
                            <span className="text-3xs text-muted-foreground mt-0.5">{inv.projectService}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">{inv.issueDate}</td>
                        <td className="p-4 text-right font-bold text-foreground">₹{inv.grandTotal.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 hover:bg-cyan-500/10 hover:text-cyan-400"
                              title="View Invoice Document"
                              onClick={() => {
                                setInvoiceProject({ ...inv.rawProject, invoiceNo: inv.invoiceNo });
                                setIsInvoicePreviewOpen(true);
                              }}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-7 h-7 hover:bg-red-500/10 hover:text-red-400"
                              title="Delete Record"
                              onClick={() => {
                                if (window.confirm("Remove this invoice record from vault?")) {
                                  setInvoices(prev => prev.filter(i => i.id !== inv.id));
                                  setSelectedVaultInvoices(prev => prev.filter(id => id !== inv.id));
                                  toast({ title: "Invoice deleted" });
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-3xs font-semibold">
                        NO INVOICES MATCHING YOUR SEARCH
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
