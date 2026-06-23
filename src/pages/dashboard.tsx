import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Users,
  FileText,
  Zap,
  AlertTriangle,
  Clock,
  ChevronRight,
  Plus,
  Bolt,
  Sparkles,
  CreditCard,
  TrendingUp as IncomeIcon,
  Wallet,
  Receipt,
  X,
} from "lucide-react";
import { getISTDateString } from "../lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  branding: "#00d4ff",
  web: "#8b5cf6",
  print: "#10b981",
  motion: "#f59e0b",
  illustration: "#ec4899",
  social_media: "#3b82f6",
  packaging: "#f97316",
};

const ACTIVITY_COLORS: Record<string, string> = {
  project_created: "#00d4ff",
  project_completed: "#10b981",
  invoice_sent: "#8b5cf6",
  invoice_paid: "#10b981",
  client_added: "#f59e0b",
  team_member_added: "#ec4899",
};

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const numValue = Number(value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isNaN(numValue) || !isFinite(numValue) || numValue <= 0) {
      setDisplay(isNaN(numValue) ? 0 : numValue);
      return;
    }

    const duration = 1200;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplay(numValue);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [numValue]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

interface DashboardProps {
  projects?: any[];
  clients?: any[];
  invoices?: any[];
  cashbookEntries?: any[];
  clientPortalNotifs?: any[];
  flames?: any[];
  sparks?: any[];
  onMarkFlameAsRead?: (projectId: string | number) => void;
  onSnoozeFlame?: (projectId: string | number, amount: number, unit: string) => void;
  onRedirectToProject?: (project: any) => void;
  onRedirectToClient?: (projectId: string | number | null, clientId?: string | number, type?: string) => void;
  onOpenIgnitionModal?: () => void;
  onOpenCreateClient?: () => void;
  setActiveAdminModule?: (module: string) => void;
  onDownloadInvoice?: (project: any) => void;
  onFilterProjectsByClient?: (clientName: string) => void;
  onRedirectToFinancialsProject?: (project: any) => void;
  onOpenMicroJobModal?: () => void;
  onOpenCreateInvoice?: () => void;
  onAddCashbookEntry?: (entry: any) => void;
  setFinancialTab?: (tab: string) => void;
}

export default function Dashboard({
  projects = [],
  clients = [],
  invoices = [],
  cashbookEntries = [],
  clientPortalNotifs = [],
  flames = [],
  sparks = [],
  onMarkFlameAsRead,
  onSnoozeFlame,
  onRedirectToProject,
  onRedirectToClient,
  onOpenIgnitionModal,
  onOpenCreateClient,
  setActiveAdminModule,
  onDownloadInvoice,
  onFilterProjectsByClient,
  onRedirectToFinancialsProject,
  onOpenMicroJobModal,
  onOpenCreateInvoice,
  onAddCashbookEntry,
  setFinancialTab,
}: DashboardProps) {
  const [quickEntryType, setQuickEntryType] = useState<'INCOME' | 'EXPENSE' | null>(null);
  const [revenueGranularity, setRevenueGranularity] = useState<'day' | 'month' | 'year'>('day');
  const [expenseGranularity, setExpenseGranularity] = useState<'day' | 'month' | 'year'>('day');
  const [qeAmount, setQeAmount] = useState('');
  const [qeDesc, setQeDesc] = useState('');
  const [qeCategory, setQeCategory] = useState('');
  const [qeMode, setQeMode] = useState('UPI');
  const [qeDate, setQeDate] = useState(getISTDateString());
  const [qeSubmitting, setQeSubmitting] = useState(false);

  const resolvedInvoiceNumbers = useMemo(() => {
    const mapping: Record<string, string> = {};
    
    // First, map explicitly saved invoices
    invoices.forEach(inv => {
      if (inv.rawProject && inv.rawProject.id) {
        mapping[String(inv.rawProject.id)] = inv.invoiceNo;
      } else if (inv.projectId) {
        mapping[String(inv.projectId)] = inv.invoiceNo;
      }
    });

    const getHighestInvoiceSerial = (invoicesList: any[]) => {
      let maxSerial = 22; // Start at 22, since the highest in the DB is 22
      (invoicesList || []).forEach(inv => {
        if (!inv.invoiceNo) return;
        const parts = inv.invoiceNo.split('/');
        // Ensure it is a standard project invoice (not micro-job/custom)
        if (parts.length === 3 && parts[0] === 'NG' && !parts[2].startsWith('C')) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxSerial) {
            maxSerial = num;
          }
        }
      });
      return maxSerial;
    };

    // Then, compute virtual invoice numbers for pending projects, exactly like invoices.tsx
    if (projects && projects.length > 0) {
      let nextSerial = getHighestInvoiceSerial(invoices) + 1;
      const getLocalInvoiceNumber = (date: any, serial: number) => {
        const d = new Date(date || Date.now());
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
        return `NG/${dateStr}/${serial.toString().padStart(4, '0')}`;
      };

      // Sort projects ascending by creation time to ensure stable virtual invoice numbers
      const pendingProjects = [...projects].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      
      const existingNos = new Set(invoices.map(i => i.invoiceNo));

      pendingProjects.forEach(p => {
        if (p.status !== 'Completed' && !p.isStandalone) {
          const projIdStr = String(p.id);
          // If it doesn't have an explicitly saved invoice
          if (!mapping[projIdStr]) {
            const issueDate = p.createdAt || new Date().toISOString();
            let invNo = getLocalInvoiceNumber(issueDate, nextSerial);
            while (existingNos.has(invNo)) {
              nextSerial++;
              invNo = getLocalInvoiceNumber(issueDate, nextSerial);
            }
            mapping[projIdStr] = invNo;
            existingNos.add(invNo);
            nextSerial++;
          }
        }
      });
    }

    return mapping;
  }, [invoices, projects]);

  const handleQuickEntrySubmit = async () => {
    if (!qeAmount || !qeDesc) return;
    setQeSubmitting(true);
    try {
      if (onAddCashbookEntry) {
        await onAddCashbookEntry({
          type: quickEntryType,
          date: qeDate,
          category: qeCategory,
          amount: parseFloat(qeAmount),
          mode: qeMode,
          description: qeDesc
        });
      }
      setQuickEntryType(null);
      setQeAmount('');
      setQeDesc('');
      setQeCategory('');
      setQeMode('UPI');
      setQeDate(getISTDateString());
    } catch (err) {
      console.error(err);
    }
    setQeSubmitting(false);
  };
  // Active Tab state
  const [selectedTab, setSelectedTab] = useState<'revenue' | 'projects' | 'clients' | 'invoices' | 'system_alerts'>('revenue');
  const [systemAlertTab, setSystemAlertTab] = useState<'deadlines' | 'inquiries' | 'client'>('client');

  const [activePopupData, setActivePopupData] = useState<any>(null);

  const handleBarClick = (dataPoint: any, chartType: 'INCOME' | 'EXPENSE', granularity: 'day' | 'month' | 'year') => {
    const itemData = dataPoint && (dataPoint.payload || dataPoint);
    if (!itemData || !itemData.dateKey) return;

    const dateKey = itemData.dateKey;
    let popupItems: any[] = [];
    let total = 0;

    const relevantEntries = (cashbookEntries || []).filter(e => e && e.type === chartType);

    if (granularity === 'day') {
      const dayEntries = relevantEntries.filter(e => {
        if (!e.date) return false;
        const entryDateStr = e.date.split('T')[0];
        return entryDateStr === dateKey;
      });

      popupItems = dayEntries.map(e => ({
        label: e.desc || e.description || "Payment Entry",
        value: parseFloat(e.amount) || 0,
        description: e.category
      }));
      total = popupItems.reduce((sum, item) => sum + item.value, 0);

    } else if (granularity === 'month') {
      const monthEntries = relevantEntries.filter(e => {
        if (!e.date) return false;
        const entryDateStr = e.date.split('T')[0];
        return entryDateStr.startsWith(dateKey);
      });

      const dayGroup: Record<number, number> = {};
      monthEntries.forEach(e => {
        const d = new Date(e.date);
        const dayNum = d.getDate();
        dayGroup[dayNum] = (dayGroup[dayNum] || 0) + (parseFloat(e.amount) || 0);
      });

      const parts = dateKey.split('-');
      const yearNum = parseInt(parts[0]);
      const monthNum = parseInt(parts[1]) - 1;
      const tempDate = new Date(yearNum, monthNum, 1);
      const monthShort = tempDate.toLocaleDateString('en-US', { month: 'short' });

      const daysWithData = Object.keys(dayGroup).map(Number).sort((a, b) => a - b);
      popupItems = daysWithData.map(day => {
        const dayStr = String(day).padStart(2, '0');
        return {
          label: `${dayStr} ${monthShort}`,
          value: dayGroup[day]
        };
      });
      total = popupItems.reduce((sum, item) => sum + item.value, 0);

    } else { // year
      const yearEntries = relevantEntries.filter(e => {
        if (!e.date) return false;
        const entryDateStr = e.date.split('T')[0];
        return entryDateStr.startsWith(dateKey);
      });

      const monthGroup: Record<number, number> = {};
      yearEntries.forEach(e => {
        const d = new Date(e.date);
        const mNum = d.getMonth();
        monthGroup[mNum] = (monthGroup[mNum] || 0) + (parseFloat(e.amount) || 0);
      });

      const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const activeMonths = Object.keys(monthGroup).map(Number).sort((a, b) => a - b);
      popupItems = activeMonths.map(m => ({
        label: monthsShort[m],
        value: monthGroup[m]
      }));
      total = popupItems.reduce((sum, item) => sum + item.value, 0);
    }

    let formattedTitle = '';
    if (granularity === 'day') {
      const d = new Date(dateKey);
      formattedTitle = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (granularity === 'month') {
      const parts = dateKey.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      formattedTitle = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      formattedTitle = `Year ${dateKey}`;
    }

    setActivePopupData({
      title: formattedTitle,
      type: chartType,
      granularity,
      dateKey,
      items: popupItems,
      total
    });
  };

  // 1. Calculate live statistics
  const activeProjects = projects.filter(p => p.status === 'Ongoing' || p.status === 'Active').length;
  const totalClients = clients.filter(c => c.email !== 'settings@netra.graphics').length;

  const totalRevenue = useMemo(() => {
    return (cashbookEntries || [])
      .filter(entry => entry.type === "INCOME")
      .reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  }, [cashbookEntries]);

  const pendingInvoices = useMemo(() => {
    return projects.reduce((sum, p) => {
      if ((p.status || "").toLowerCase() === "cancelled") return sum;
      const baseQuote = parseFloat(p.quote) || 0;
      const discountVal = parseFloat(p.discount) || 0;
      const finalQuote = baseQuote - discountVal;
      const isPaid = p.paymentStatus === 'paid' || (p.status || "").toLowerCase() === "completed";
      const adv = parseFloat(p.advanceAmount) || 0;
      const hasAdvance = adv > 0;
      const dues = isPaid ? 0 : (hasAdvance ? (finalQuote - adv) : finalQuote);
      return sum + Math.max(0, dues);
    }, 0);
  }, [projects]);

  const overdueInvoicesCount = useMemo(() => {
    return projects.filter(p => {
      if (p.status === 'Completed' || p.status === 'Closed' || p.status === 'Cancelled' || !p.deadline) return false;
      const parsedDate = new Date(p.deadline);
      return !isNaN(parsedDate.getTime()) && parsedDate < new Date();
    }).length;
  }, [projects]);

  // 2. Revenue Trend (Last 12 Months)
  const revenueTrend = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: 0,
        expenses: 0
      });
    }

    let hasData = false;
    (cashbookEntries || []).forEach(entry => {
      if (!entry || !entry.date) return;
      const entryDate = new Date(entry.date);
      if (isNaN(entryDate.getTime())) return;
      const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
      const mBucket = months.find(m => m.dateKey === key);
      if (mBucket) {
        hasData = true;
        const amt = parseFloat(entry.amount) || 0;
        if (entry.type === "EXPENSE") {
          mBucket.expenses += amt;
        } else {
          mBucket.revenue += amt;
        }
      }
    });

    // Fallback baseline for demo aesthetics if no real data is logged yet
    if (!hasData) {
      const baselineRevenue = [15000, 18000, 12000, 24000, 31000, 28000, 45000, 32000, 29000, 38000, 42000, 27500];
      const baselineExpenses = [8000, 9000, 6000, 11000, 14000, 13000, 19000, 15000, 13000, 16000, 17000, 12000];
      months.forEach((m, idx) => {
        m.revenue = baselineRevenue[idx % baselineRevenue.length];
        m.expenses = baselineExpenses[idx % baselineExpenses.length];
      });
    }

    return months;
  }, [cashbookEntries]);

  // Revenue chart data aggregation
  const revenueChartData = useMemo(() => {
    const now = new Date();
    let items = [];
    let hasData = false;

    if (revenueGranularity === 'day') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        items.push({
          dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: 0,
        });
      }
      (cashbookEntries || []).forEach(entry => {
        if (!entry || entry.type !== 'INCOME' || !entry.date) return;
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        const bucket = items.find(item => item.dateKey === key);
        if (bucket) {
          hasData = true;
          bucket.value += parseFloat(entry.amount) || 0;
        }
      });
      if (!hasData) {
        // Fallback baseline for daily revenue
        items.forEach((item, idx) => {
          item.value = Math.round(1500 + Math.sin(idx / 2) * 500 + (idx % 3 === 0 ? 800 : 0));
        });
      }
    } else if (revenueGranularity === 'month') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        items.push({
          dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: 0,
        });
      }
      (cashbookEntries || []).forEach(entry => {
        if (!entry || entry.type !== 'INCOME' || !entry.date) return;
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        const bucket = items.find(item => item.dateKey === key);
        if (bucket) {
          hasData = true;
          bucket.value += parseFloat(entry.amount) || 0;
        }
      });
      if (!hasData) {
        const baselineRevenue = [15000, 18000, 12000, 24000, 31000, 28000, 45000, 32000, 29000, 38000, 42000, 27500];
        items.forEach((item, idx) => {
          item.value = baselineRevenue[idx % baselineRevenue.length];
        });
      }
    } else { // 'year'
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        items.push({
          dateKey: String(year),
          label: String(year),
          value: 0,
        });
      }
      (cashbookEntries || []).forEach(entry => {
        if (!entry || entry.type !== 'INCOME' || !entry.date) return;
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        const key = String(entryDate.getFullYear());
        const bucket = items.find(item => item.dateKey === key);
        if (bucket) {
          hasData = true;
          bucket.value += parseFloat(entry.amount) || 0;
        }
      });
      if (!hasData) {
        const baselineRevenueYearly = [180000, 220000, 250000, 310000, 380000];
        items.forEach((item, idx) => {
          item.value = baselineRevenueYearly[idx % baselineRevenueYearly.length];
        });
      }
    }

    return items;
  }, [cashbookEntries, revenueGranularity]);

  // Expense chart data aggregation
  const expenseChartData = useMemo(() => {
    const now = new Date();
    let items = [];
    let hasData = false;

    if (expenseGranularity === 'day') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        items.push({
          dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: 0,
        });
      }
      (cashbookEntries || []).forEach(entry => {
        if (!entry || entry.type !== 'EXPENSE' || !entry.date) return;
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
        const bucket = items.find(item => item.dateKey === key);
        if (bucket) {
          hasData = true;
          bucket.value += parseFloat(entry.amount) || 0;
        }
      });
      if (!hasData) {
        // Fallback baseline for daily expense
        items.forEach((item, idx) => {
          item.value = Math.round(600 + Math.cos(idx / 2) * 200 + (idx % 4 === 0 ? 400 : 0));
        });
      }
    } else if (expenseGranularity === 'month') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        items.push({
          dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: 0,
        });
      }
      (cashbookEntries || []).forEach(entry => {
        if (!entry || entry.type !== 'EXPENSE' || !entry.date) return;
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        const bucket = items.find(item => item.dateKey === key);
        if (bucket) {
          hasData = true;
          bucket.value += parseFloat(entry.amount) || 0;
        }
      });
      if (!hasData) {
        const baselineExpenses = [8000, 9000, 6000, 11000, 14000, 13000, 19000, 15000, 13000, 16000, 17000, 12000];
        items.forEach((item, idx) => {
          item.value = baselineExpenses[idx % baselineExpenses.length];
        });
      }
    } else { // 'year'
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        items.push({
          dateKey: String(year),
          label: String(year),
          value: 0,
        });
      }
      (cashbookEntries || []).forEach(entry => {
        if (!entry || entry.type !== 'EXPENSE' || !entry.date) return;
        const entryDate = new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        const key = String(entryDate.getFullYear());
        const bucket = items.find(item => item.dateKey === key);
        if (bucket) {
          hasData = true;
          bucket.value += parseFloat(entry.amount) || 0;
        }
      });
      if (!hasData) {
        const baselineExpensesYearly = [90000, 110000, 120000, 145000, 185000];
        items.forEach((item, idx) => {
          item.value = baselineExpensesYearly[idx % baselineExpensesYearly.length];
        });
      }
    }

    return items;
  }, [cashbookEntries, expenseGranularity]);

  // 4. Recent Activity Logs
  const recentActivity = useMemo(() => {
    const list = projects.flatMap(p => 
      (p.activityLog || []).map((log, idx) => {
        if (!log) return null;
        const rawTime = log.time || '';
        let actDate = new Date(p.createdAt || Date.now());
        if (rawTime.includes(':')) {
          const [hours, minutes] = rawTime.split(':');
          actDate.setHours(parseInt(hours) || 12, parseInt(minutes) || 0);
        }
        return {
          id: `${p.id}-${idx}-${log.action || ''}`,
          description: `${p.service || p.name || 'Project'}: ${log.action || ''}`,
          createdAt: actDate.toISOString(),
          type: (log.action || '').toLowerCase().includes('ignite') ? 'project_created' : 'invoice_sent'
        };
      }).filter(Boolean)
    );

    return list
      .sort((a, b) => {
        const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return String(b.id || "").localeCompare(String(a.id || ""));
      })
      .slice(0, 10);
  }, [projects]);

  const getStagePercent = (stage: any) => {
    const s = String(stage || "").toLowerCase();
    if (s.includes('handover') || s.includes('completion') || s === '5') return 90;
    if (s.includes('feedback') || s.includes('review') || s === '4') return 75;
    if (s.includes('design') || s.includes('development') || s === '3') return 50;
    if (s.includes('brief') || s.includes('planning') || s === '2') return 25;
    if (s.includes('ignition') || s.includes('start') || s === '1') return 10;
    return 40;
  };

  const formatDeadline = (deadline: any) => {
    if (!deadline) return "";
    const parsed = new Date(deadline);
    if (isNaN(parsed.getTime())) return String(deadline);
    return parsed.toLocaleDateString();
  };

  const formatQuote = (quote: any) => {
    if (quote === undefined || quote === null) return "0";
    const num = parseFloat(String(quote).replace(/[^0-9.-]/g, ""));
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  const statCards = [
    {
      tabKey: "revenue" as const,
      label: "Total Revenue",
      value: totalRevenue,
      prefix: "₹",
      icon: TrendingUp,
      trend: 12.5,
      trendLabel: undefined,
      overdue: undefined,
      color: "#00d4ff",
    },
    {
      tabKey: "projects" as const,
      label: "Active Projects",
      value: activeProjects,
      prefix: undefined,
      icon: Briefcase,
      trend: projects.filter(p => {
        if (p.status !== 'Ongoing') return false;
        const pDate = new Date(p.createdAt || Date.now());
        return !isNaN(pDate.getTime()) && pDate.getMonth() === new Date().getMonth();
      }).length,
      trendLabel: "this month",
      overdue: undefined,
      color: "#8b5cf6",
    },
    {
      tabKey: "clients" as const,
      label: "Total Clients",
      value: totalClients,
      prefix: undefined,
      icon: Users,
      trend: undefined,
      trendLabel: undefined,
      overdue: undefined,
      color: "#10b981",
    },
    {
      tabKey: "invoices" as const,
      label: "Pending Invoices",
      value: pendingInvoices,
      prefix: "₹",
      icon: FileText,
      trend: undefined,
      trendLabel: undefined,
      overdue: overdueInvoicesCount,
      color: "#f59e0b",
    },
    {
      tabKey: "system_alerts" as const,
      label: "System Alerts",
      value: flames.length + sparks.length + clientPortalNotifs.filter((n: any) => !n.is_read).length,
      prefix: undefined,
      icon: AlertTriangle,
      trend: undefined,
      trendLabel: undefined,
      overdue: undefined,
      color: "#ef4444",
    },
  ];

  // Views Render Helpers
  const renderRevenueView = () => {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Stack of Charts on the left */}
          <div className="xl:col-span-2 space-y-6">
            {/* Revenue Trend Chart */}
            <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-6" style={{ borderColor: '#00d4ff20' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-foreground text-lg">Revenue Trend</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {revenueGranularity === 'day' ? '30-day overview' : revenueGranularity === 'month' ? '12-month overview' : '5-year overview'}
                  </p>
                </div>
                
                {/* Year, Month, Day selector */}
                <div className="flex bg-[#0c101d] border border-white/10 rounded-xl p-0.5 gap-1 self-end">
                  <button 
                    type="button"
                    onClick={() => setRevenueGranularity('day')} 
                    className={`px-2.5 py-1 text-3xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${revenueGranularity === 'day' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                  >
                    Day
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRevenueGranularity('month')} 
                    className={`px-2.5 py-1 text-3xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${revenueGranularity === 'month' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                  >
                    Month
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRevenueGranularity('year')} 
                    className={`px-2.5 py-1 text-3xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${revenueGranularity === 'year' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                  >
                    Year
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={revenueChartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,15,30,0.95)",
                      border: "1px solid rgba(0,212,255,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Revenue" 
                    fill="url(#revenueGrad)" 
                    radius={[6, 6, 0, 0]} 
                    background={{ fill: 'transparent', cursor: 'pointer' }}
                    onClick={(data) => handleBarClick(data, 'INCOME', revenueGranularity)} 
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expense Graph */}
            <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-6" style={{ borderColor: '#ef444420' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-foreground text-lg text-red-400">Expense Graph</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {expenseGranularity === 'day' ? '30-day expenditures (Financials Sync)' : expenseGranularity === 'month' ? '12-month expenditures (Financials Sync)' : '5-year expenditures (Financials Sync)'}
                  </p>
                </div>
                
                {/* Year, Month, Day selector */}
                <div className="flex bg-[#0c101d] border border-white/10 rounded-xl p-0.5 gap-1 self-end">
                  <button 
                    type="button"
                    onClick={() => setExpenseGranularity('day')} 
                    className={`px-2.5 py-1 text-3xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${expenseGranularity === 'day' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                  >
                    Day
                  </button>
                  <button 
                    type="button"
                    onClick={() => setExpenseGranularity('month')} 
                    className={`px-2.5 py-1 text-3xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${expenseGranularity === 'month' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                  >
                    Month
                  </button>
                  <button 
                    type="button"
                    onClick={() => setExpenseGranularity('year')} 
                    className={`px-2.5 py-1 text-3xs font-extrabold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${expenseGranularity === 'year' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-muted-foreground hover:text-white border border-transparent'}`}
                  >
                    Year
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={expenseChartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(30,10,10,0.95)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Expense" 
                    fill="url(#expenseGrad)" 
                    radius={[6, 6, 0, 0]} 
                    background={{ fill: 'transparent', cursor: 'pointer' }}
                    onClick={(data) => handleBarClick(data, 'EXPENSE', expenseGranularity)} 
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Panel on the right */}
          <div className="xl:col-span-1 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-6 flex flex-col justify-start h-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-base tracking-wide">Quick Actions</h3>
                <p className="text-3xs text-muted-foreground uppercase tracking-widest">Fast-access studio operations</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Create Project',
                  sub: 'Start New Ignition',
                  icon: Zap,
                  color: '#8b5cf6',
                  glow: 'rgba(139,92,246,0.25)',
                  border: '#8b5cf640',
                  bg: '#8b5cf610',
                  action: () => onOpenIgnitionModal && onOpenIgnitionModal(),
                },
                {
                  label: 'Log Micro Job',
                  sub: 'Log New Job',
                  icon: Bolt,
                  color: '#00d4ff',
                  glow: 'rgba(0,212,255,0.25)',
                  border: '#00d4ff40',
                  bg: '#00d4ff10',
                  action: () => {
                    if (onOpenMicroJobModal) { onOpenMicroJobModal(); }
                    else if (setActiveAdminModule) { setActiveAdminModule('PROJECTS'); }
                  },
                },
                {
                  label: 'Create Client',
                  sub: 'Add New Visionary',
                  icon: Users,
                  color: '#10b981',
                  glow: 'rgba(16,185,129,0.25)',
                  border: '#10b98140',
                  bg: '#10b98110',
                  action: () => onOpenCreateClient && onOpenCreateClient(),
                },
                {
                  label: 'Create Invoice',
                  sub: 'Create New Invoice',
                  icon: Receipt,
                  color: '#f59e0b',
                  glow: 'rgba(245,158,11,0.25)',
                  border: '#f59e0b40',
                  bg: '#f59e0b10',
                  action: () => {
                    if (onOpenCreateInvoice) { onOpenCreateInvoice(); }
                    else if (setActiveAdminModule) { setActiveAdminModule('INVOICES'); }
                  },
                },
                {
                  label: 'Log Income',
                  sub: 'New Income',
                  icon: TrendingUp,
                  color: '#34d399',
                  glow: 'rgba(52,211,153,0.25)',
                  border: '#34d39940',
                  bg: '#34d39910',
                  action: () => setQuickEntryType('INCOME'),
                },
                {
                  label: 'Log Expense',
                  sub: 'New Expense',
                  icon: Wallet,
                  color: '#f43f5e',
                  glow: 'rgba(244,63,94,0.25)',
                  border: '#f43f5e40',
                  bg: '#f43f5e10',
                  action: () => setQuickEntryType('EXPENSE'),
                },
              ].map((action) => (
                <motion.button
                  key={action.label}
                  onClick={action.action}
                  whileHover={{ scale: 1.04, boxShadow: `0 0 20px ${action.glow}` }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border cursor-pointer text-center transition-all duration-200 overflow-hidden"
                  style={{ borderColor: action.border, background: action.bg }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${action.glow}, transparent 70%)` }}
                  />
                  <div
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${action.color}18`, border: `1px solid ${action.color}35` }}
                  >
                    <action.icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                  <div className="relative z-10">
                    <div className="text-xs font-extrabold text-foreground group-hover:text-white transition-colors leading-tight">{action.label}</div>
                    <div className="text-3xs text-muted-foreground mt-0.5 tracking-wide">{action.sub}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-foreground text-lg">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity?.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: ACTIVITY_COLORS[item.type] ?? "#666", boxShadow: `0 0 6px ${ACTIVITY_COLORS[item.type] ?? "#666"}` }}
                />
                <span className="text-sm text-foreground flex-1">{item.description}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
            {recentActivity?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProjectsView = () => {
    const ongoingProjects = (projects || [])
      .filter(p => p && (p.status === 'Ongoing' || p.status === 'Active'))
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });

    return (
      <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-6" style={{ borderColor: '#8b5cf630' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-foreground text-lg text-violet-400 font-sans tracking-wide">Ongoing Projects</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Currently active studio workspaces</p>
          </div>
          <Briefcase className="w-5 h-5 text-violet-500 animate-pulse" />
        </div>

        {ongoingProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ongoingProjects.map((p) => {
              if (!p) return null;
              const progress = getStagePercent(p.stage);
              return (
                <div 
                  key={p.id || Math.random().toString()} 
                  className="rounded-xl border bg-violet-950/5 hover:bg-violet-950/10 p-5 transition-all duration-300 group flex flex-col justify-between"
                  style={{ borderColor: '#8b5cf620' }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div>
                        <h4 className="font-black text-foreground text-base group-hover:text-violet-400 transition-colors">{p.name || 'Unnamed'}</h4>
                        <span className="text-xs text-muted-foreground font-medium">{p.service || 'General Service'}</span>
                      </div>
                      <span className="text-3xs font-semibold tracking-wider uppercase bg-violet-500/15 border px-2 py-0.5 rounded text-violet-400" style={{ borderColor: '#8b5cf640' }}>
                        {p.stage || 'Ongoing'}
                      </span>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-3xs text-muted-foreground">
                        <span>Workspace Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/5 text-xs">
                    <span className="text-muted-foreground">
                      Project Value: <strong className="text-foreground font-black">₹{formatQuote(p.quote)}</strong>
                    </span>
                    {p.deadline && (
                      <span className="text-3xs text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Due: {formatDeadline(p.deadline)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-16 px-4 text-center" style={{ borderColor: '#8b5cf630' }}>
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: ["0 0 10px rgba(139,92,246,0.2)", "0 0 25px rgba(139,92,246,0.5)", "0 0 10px rgba(139,92,246,0.2)"]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              onClick={() => onOpenIgnitionModal && onOpenIgnitionModal()}
              className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mb-4 cursor-pointer group"
            >
              <Zap className="w-6 h-6 text-violet-400 group-hover:scale-125 transition-transform duration-300" />
            </motion.div>
            <h4 className="text-lg font-black text-foreground mb-1">
              No ongoing project, let's ignite a new revolution!
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Ignite your next visionary project workspace and shape the digital canvas.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(139,92,246,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenIgnitionModal && onOpenIgnitionModal()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm tracking-wider transition-all duration-300 cursor-pointer"
            >
              <span className="text-lg font-bold">+</span> IGNITE PROJECT
            </motion.button>
          </div>
        )}
      </div>
    );
  };

  const renderClientsView = () => {
    const activeClients = clients
      .filter(c => c.email !== 'settings@netra.graphics')
      .sort((a, b) => {
        const timeA = new Date(a.joinedDate || a.joined_date || 0).getTime();
        const timeB = new Date(b.joinedDate || b.joined_date || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });

    return (
      <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-6" style={{ borderColor: '#10b98130' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-foreground text-lg text-emerald-400 font-sans tracking-wide">Active Visionaries</h3>
            <p className="text-xs text-muted-foreground">List of clients associated with our studio</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCreateClient}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
            >
              + Create New Client
            </button>
            <Users className="w-5 h-5 text-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Projects</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-foreground">
              {activeClients.length > 0 ? (
                activeClients.map((client) => {
                  const clientProjectsCount = (projects || []).filter(p => (p.client?.id === client.id) || (p.name === client.name)).length;
                  return (
                    <tr key={client.id || client.email} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="py-3 px-4 font-bold">{client.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.email || 'N/A'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (onFilterProjectsByClient) {
                              onFilterProjectsByClient(client.name);
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 border text-emerald-400 text-3xs font-bold hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors cursor-pointer bg-transparent border-emerald-500/40 outline-none"
                          title={`Click to view projects for ${client.name}`}
                        >
                          {clientProjectsCount}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (setActiveAdminModule) {
                              setActiveAdminModule("CLIENTS");
                            }
                          }}
                          className="px-3 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-2xs transition-colors flex items-center gap-1 ml-auto cursor-pointer border-none"
                        >
                          View in Vault <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                    No clients found. Click "+ Create New Client" to add a client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInvoicesView = () => {
    const pendingInvoicesList = (projects || [])
      .filter(p => {
        if ((p.status || "").toLowerCase() === "cancelled") return false;
        const baseQuote = parseFloat(p.quote) || 0;
        const discountVal = parseFloat(p.discount) || 0;
        const finalQuote = baseQuote - discountVal;
        const isPaid = p.paymentStatus === 'paid' || (p.status || "").toLowerCase() === "completed";
        const adv = parseFloat(p.advanceAmount) || 0;
        const dues = isPaid ? 0 : (finalQuote - adv);
        return dues > 0;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });

    return (
      <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-6" style={{ borderColor: '#f59e0b30' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-foreground text-lg text-amber-400 font-sans tracking-wide">Pending Invoices</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Outstanding payments requiring settlement</p>
          </div>
          <FileText className="w-5 h-5 text-amber-500 animate-pulse" />
        </div>

        {pendingInvoicesList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Client / Project</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Dues Outstanding</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-foreground">
                {pendingInvoicesList.map((p) => {
                  const existingInv = (invoices || []).find(inv => String(inv.rawProject?.id) === String(p.id));
                  const safeId = p.id ? String(p.id) : Math.random().toString(36).substring(7);
                  const invoiceNo = resolvedInvoiceNumbers[String(p.id)] || `UNINVOICED`;
                  
                  const baseQuote = parseFloat(p.quote) || 0;
                  const discountVal = parseFloat(p.discount) || 0;
                  const finalQuote = baseQuote - discountVal;
                  const adv = parseFloat(p.advanceAmount) || 0;
                  const dues = finalQuote - adv;

                  return (
                    <tr key={p.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        <button
                          onClick={() => {
                            if (onRedirectToFinancialsProject) {
                              onRedirectToFinancialsProject(p);
                            }
                          }}
                          className="hover:underline hover:text-amber-300 transition-colors cursor-pointer text-left bg-transparent border-none outline-none font-mono font-bold text-amber-400"
                          title={`Click to redirect to Financials and filter by ${p.service}`}
                        >
                          {invoiceNo}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{p.name}</span>
                          <span className="text-3xs text-muted-foreground mt-0.5">{p.service}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">₹{finalQuote.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-amber-400 font-bold">₹{dues.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onDownloadInvoice) {
                              onDownloadInvoice(p);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-amber-500/20 text-amber-400 transition-colors inline-flex items-center justify-center cursor-pointer border-none bg-transparent"
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 5, 0],
                scale: [1, 1.08, 0.95, 1.05, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4"
            >
              <Zap className="w-6 h-6 text-amber-400 animate-bounce" />
            </motion.div>
            <h4 className="text-lg font-black text-foreground mb-1">
              Fully settled! No pending invoices.
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              All client balances are perfectly cleared and accounts are completely balanced. Keep up the momentum!
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderSystemAlertsView = () => {
    return (
      <div className="rounded-2xl border bg-card/40 backdrop-blur-sm p-6" style={{ borderColor: '#ef444430' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-foreground text-lg text-red-400 font-sans tracking-wide">System Alerts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Critical notifications requiring your attention.</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
        </div>

        {/* Sub-tabs for System Alerts */}
        <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
          <button
            onClick={() => setSystemAlertTab('deadlines')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${systemAlertTab === 'deadlines' ? 'bg-[#ff5e00]/10 text-[#ff5e00] border border-[#ff5e00]/20' : 'bg-transparent text-muted-foreground hover:bg-white/5 border border-transparent'}`}
          >
            PENDING DEADLINES ({flames.length})
          </button>
          <button
            onClick={() => setSystemAlertTab('inquiries')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${systemAlertTab === 'inquiries' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-transparent text-muted-foreground hover:bg-white/5 border border-transparent'}`}
          >
            NEW INQUIRIES ({sparks.length})
          </button>
          <button
            onClick={() => setSystemAlertTab('client')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${systemAlertTab === 'client' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-transparent text-muted-foreground hover:bg-white/5 border border-transparent'}`}
          >
            CLIENT PORTAL ({clientPortalNotifs.filter(n => !n.is_read).length})
          </button>
        </div>

        {/* Content based on sub-tab */}
        {systemAlertTab === 'deadlines' && (
          <div className="space-y-4">
            {flames.length > 0 ? flames.map((f: any) => (
              <div key={f.id} className="p-4 rounded-xl border border-[#ff5e00]/20 bg-[#ff5e00]/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-sm text-[#ff5e00]">{f.service}</h4>
                  <p className="text-xs text-muted-foreground">{f.name || f.clientName || 'Unknown Client'}</p>
                  <p className="text-3xs text-muted-foreground mt-1">Due: {new Date(f.deadline).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg">
                    <input 
                      type="number" 
                      min="1" 
                      defaultValue="1" 
                      id={`snooze-amt-${f.id}`} 
                      className="w-10 bg-transparent border-none text-xs text-center text-white focus:outline-none py-1"
                    />
                    <select 
                      id={`snooze-unit-${f.id}`} 
                      className="bg-transparent border-none text-xs text-muted-foreground focus:outline-none cursor-pointer py-1 pr-1"
                    >
                      <option value="HOURS" className="bg-background">Hrs</option>
                      <option value="MINS" className="bg-background">Mins</option>
                    </select>
                    <button 
                      onClick={() => {
                        const amt = (document.getElementById(`snooze-amt-${f.id}`) as HTMLInputElement)?.value;
                        const unit = (document.getElementById(`snooze-unit-${f.id}`) as HTMLSelectElement)?.value;
                        if (onSnoozeFlame) onSnoozeFlame(f.id, Number(amt), unit);
                      }}
                      className="px-2 py-1.5 border-l border-white/5 text-xs font-semibold hover:bg-white/10 text-muted-foreground hover:text-white transition-colors rounded-r-lg"
                    >
                      Snooze
                    </button>
                  </div>
                  <button 
                    onClick={() => onMarkFlameAsRead && onMarkFlameAsRead(f.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-muted-foreground transition-colors"
                  >
                    Mark Read
                  </button>
                  <button 
                    onClick={() => onRedirectToProject && onRedirectToProject(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ff5e00]/20 hover:bg-[#ff5e00]/30 text-[#ff5e00] transition-colors"
                  >
                    View Project
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <h4 className="text-sm font-black text-muted-foreground">No pending deadlines</h4>
              </div>
            )}
          </div>
        )}

        {systemAlertTab === 'inquiries' && (
          <div className="space-y-4">
            {sparks.length > 0 ? sparks.map((s: any) => (
              <div key={s.id} className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-cyan-400">{s.name}</h4>
                  <p className="text-xs text-muted-foreground">{s.email} | {s.phone}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-cyan-500/10 rounded text-cyan-400 font-semibold">{s.status || 'New'}</span>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <h4 className="text-sm font-black text-muted-foreground">No new inquiries</h4>
              </div>
            )}
          </div>
        )}

        {systemAlertTab === 'client' && (
          <div className="space-y-4">
            {clientPortalNotifs.length > 0 ? clientPortalNotifs.map((n: any) => (
              <div key={n.id} className={`p-4 rounded-xl border ${n.is_read ? 'border-white/5 bg-white/5 opacity-60' : 'border-indigo-500/20 bg-indigo-500/5'}`}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm text-foreground">{n.title || n.type}</h4>
                  <span className="text-3xs text-muted-foreground">{new Date(n.raw_date).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{n.message}</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onRedirectToClient && onRedirectToClient(n.project_id, n.client_id, n.type)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <h4 className="text-sm font-black text-muted-foreground">No client alerts currently</h4>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 animate-fade-in"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1
            className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent"
            data-testid="heading-dashboard"
          >
            Command Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-widest uppercase">
            Studio Intelligence Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-cyan-400 font-medium tracking-wider">LIVE</span>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const isActive = selectedTab === card.tabKey;
          return (
            <motion.button
              key={card.label}
              variants={itemVariants}
              onClick={() => setSelectedTab(card.tabKey)}
              className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-sm group text-left w-full transition-all duration-300 cursor-pointer text-foreground"
              style={{
                background: isActive 
                  ? `linear-gradient(135deg, ${card.color}12 0%, ${card.color}03 100%)` 
                  : `linear-gradient(135deg, ${card.color}08 0%, transparent 100%)`,
                borderColor: isActive ? card.color : `${card.color}20`,
                boxShadow: isActive ? `0 0 25px ${card.color}15, inset 0 0 10px ${card.color}08` : 'none',
              }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              data-testid={`stat-card-${card.label.toLowerCase().replace(/ /g, "-")}`}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${card.color}15, transparent 70%)`,
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                    {card.label}
                  </span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${card.color}15`, border: `1px solid ${card.color}30` }}
                  >
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <div className="text-3xl font-black text-foreground mb-1">
                  <AnimatedNumber value={card.value} prefix={card.prefix} />
                </div>
                {card.trend !== undefined && (
                  <div className="flex items-center gap-1 text-xs">
                    {card.trend >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span className={card.trend >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {card.trend >= 0 ? "+" : ""}{card.trend}%
                    </span>
                    {card.trendLabel && <span className="text-muted-foreground">{card.trendLabel}</span>}
                  </div>
                )}
                {card.overdue !== undefined && card.overdue > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="w-3 h-3 animate-bounce" />
                    <span>{card.overdue} overdue</span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Dynamic Detail Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
          variants={itemVariants}
          className="w-full"
        >
          {selectedTab === 'revenue' && renderRevenueView()}
          {selectedTab === 'projects' && renderProjectsView()}
          {selectedTab === 'clients' && renderClientsView()}
          {selectedTab === 'invoices' && renderInvoicesView()}
          {selectedTab === 'system_alerts' && renderSystemAlertsView()}
        </motion.div>
      </AnimatePresence>

      {/* Quick Entry Modal (Income/Expense) */}
      <AnimatePresence>
        {quickEntryType && (
          <div className="fixed inset-0 z-[10060] flex items-center justify-center" 
               style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#080c18] rounded-2xl p-6 max-w-sm w-[90vw] shadow-2xl"
              style={{ border: `1px solid ${quickEntryType === 'INCOME' ? '#34d39940' : '#f43f5e40'}` }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                       style={{ background: quickEntryType === 'INCOME' ? '#34d39910' : '#f43f5e10',
                                border: `1px solid ${quickEntryType === 'INCOME' ? '#34d39940' : '#f43f5e40'}` }}>
                    {quickEntryType === 'INCOME' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <Wallet className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm" style={{ color: quickEntryType === 'INCOME' ? '#34d399' : '#f43f5e' }}>
                      LOG {quickEntryType}
                    </h3>
                    <p className="text-3xs text-muted-foreground uppercase tracking-wider font-semibold">Quick entry</p>
                  </div>
                </div>
                <button onClick={() => setQuickEntryType(null)} className="text-muted-foreground hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input type="number" placeholder="Amount (₹)" value={qeAmount}
                  onChange={e => setQeAmount(e.target.value)}
                  className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50" />
                <input type="text" placeholder="Description" value={qeDesc}
                  onChange={e => setQeDesc(e.target.value)}
                  className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50" />
                <input type="text" placeholder="Category (optional)" value={qeCategory}
                  onChange={e => setQeCategory(e.target.value)}
                  className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={qeMode} onChange={e => setQeMode(e.target.value)}
                    className="h-9 px-3 bg-[#0a0f1e] border border-white/10 rounded-xl text-xs text-foreground cursor-pointer">
                    <option value="UPI">UPI / Online</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  <input type="date" value={qeDate} onChange={e => setQeDate(e.target.value)}
                    className="h-9 px-3 bg-[#0a0f1e] border border-white/10 rounded-xl text-xs text-foreground cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setQuickEntryType(null)}
                  className="flex-1 h-9 rounded-xl border border-white/10 text-muted-foreground text-xs font-semibold hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
                  CANCEL
                </button>
                <button onClick={handleQuickEntrySubmit} disabled={!qeAmount || !qeDesc || qeSubmitting}
                  className="flex-1 h-9 rounded-xl text-xs font-extrabold text-white border-none transition-colors disabled:opacity-50 cursor-pointer"
                  style={{ background: quickEntryType === 'INCOME' ? '#10b981' : '#f43f5e' }}>
                  {qeSubmitting ? 'SAVING...' : `SAVE ${quickEntryType}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chart Bar Details Popup Modal */}
      <AnimatePresence>
        {activePopupData && (
          <div 
            className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setActivePopupData(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl overflow-hidden bg-[#0a0f1e]/95 backdrop-blur-md"
              style={{ 
                borderColor: activePopupData.type === 'INCOME' ? 'rgba(0, 212, 255, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                boxShadow: activePopupData.type === 'INCOME' 
                  ? '0 10px 40px -10px rgba(0, 212, 255, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)' 
                  : '0 10px 40px -10px rgba(239, 68, 68, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Top highlight bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r"
                style={{ 
                  backgroundImage: activePopupData.type === 'INCOME' 
                    ? 'linear-gradient(90deg, transparent, #00d4ff, transparent)' 
                    : 'linear-gradient(90deg, transparent, #ef4444, transparent)'
                }}
              />

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: activePopupData.type === 'INCOME' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${activePopupData.type === 'INCOME' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}
                  >
                    {activePopupData.type === 'INCOME' ? (
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-base tracking-wide flex items-center gap-2">
                      {activePopupData.type === 'INCOME' ? 'Income Overview' : 'Expense Overview'}
                    </h3>
                    <p className="text-3xs text-muted-foreground uppercase tracking-widest mt-0.5 font-semibold">
                      {activePopupData.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePopupData(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content List */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {activePopupData.items && activePopupData.items.length > 0 ? (
                  activePopupData.items.map((item: any, idx: number) => {
                    if (activePopupData.granularity === 'day') {
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-bold text-foreground truncate">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-3xs text-muted-foreground truncate mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                          <span 
                            className="text-xs font-mono font-extrabold flex-shrink-0"
                            style={{ color: activePopupData.type === 'INCOME' ? '#00d4ff' : '#ef4444' }}
                          >
                            ₹{item.value.toLocaleString()}
                          </span>
                        </div>
                      );
                    } else if (activePopupData.granularity === 'month') {
                      // "show day - 1 to last day of month entry like "01 jun - 200 rs""
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-xs font-bold text-foreground">
                            {item.label.toLowerCase()}
                          </span>
                          <span 
                            className="text-xs font-mono font-extrabold"
                            style={{ color: activePopupData.type === 'INCOME' ? '#00d4ff' : '#ef4444' }}
                          >
                            {item.value.toLocaleString()} rs
                          </span>
                        </div>
                      );
                    } else {
                      // Yearly view: "show month wise entry details"
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                        >
                          <span className="text-xs font-bold text-foreground">
                            {item.label}
                          </span>
                          <span 
                            className="text-xs font-mono font-extrabold"
                            style={{ color: activePopupData.type === 'INCOME' ? '#00d4ff' : '#ef4444' }}
                          >
                            ₹{item.value.toLocaleString()}
                          </span>
                        </div>
                      );
                    }
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No records found for this period.
                  </div>
                )}
              </div>

              {/* Footer Total */}
              {activePopupData.items && activePopupData.items.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Period Total</span>
                  <span 
                    className="text-base font-mono font-black"
                    style={{ color: activePopupData.type === 'INCOME' ? '#00d4ff' : '#ef4444' }}
                  >
                    ₹{activePopupData.total.toLocaleString()}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
