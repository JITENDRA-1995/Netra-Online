import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDashboardStats,
  useGetRevenueTrend,
  useGetProjectBreakdown,
  useGetRecentActivity,
} from "@/api-client";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: revenueTrend, isLoading: trendLoading } = useGetRevenueTrend();
  const { data: projectBreakdown, isLoading: breakdownLoading } = useGetProjectBreakdown();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivity();

  const statCards = stats
    ? [
        {
          label: "Total Revenue",
          value: stats.totalRevenue,
          prefix: "₹",
          icon: TrendingUp,
          trend: stats.revenueGrowth,
          color: "#00d4ff",
        },
        {
          label: "Active Projects",
          value: stats.activeProjects,
          icon: Briefcase,
          trend: stats.projectsThisMonth,
          trendLabel: "this month",
          color: "#8b5cf6",
        },
        {
          label: "Total Clients",
          value: stats.totalClients,
          icon: Users,
          color: "#10b981",
        },
        {
          label: "Pending Invoices",
          value: stats.pendingInvoices,
          prefix: "₹",
          icon: FileText,
          overdue: stats.overdueInvoicesCount,
          color: "#f59e0b",
        },
      ] as const
    : [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Skeleton className="h-32 w-full rounded-2xl" />
              </motion.div>
            ))
          : statCards.map((card, i) => (
              <motion.div
                key={card.label}
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-sm group cursor-default"
                style={{
                  background: `linear-gradient(135deg, ${card.color}08 0%, transparent 100%)`,
                  borderColor: `${card.color}20`,
                }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                data-testid={`stat-card-${card.label.toLowerCase().replace(/ /g, "-")}`}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${card.color}10, transparent 70%)`,
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                      {card.label}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
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
                      <AlertTriangle className="w-3 h-3" />
                      <span>{card.overdue} overdue</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <motion.div
          variants={itemVariants}
          className="xl:col-span-2 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-foreground text-lg">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">12-month overview</p>
            </div>
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          {trendLoading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
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
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#00d4ff" strokeWidth={2} fill="url(#revenueGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#8b5cf6" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Project Breakdown */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-foreground text-lg">By Category</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Project distribution</p>
            </div>
          </div>
          {breakdownLoading ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={projectBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    dataKey="count"
                    paddingAngle={3}
                  >
                    {projectBreakdown?.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category] ?? "#666"}
                        opacity={0.9}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,15,30,0.95)",
                      border: "1px solid rgba(0,212,255,0.2)",
                      borderRadius: "10px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {projectBreakdown?.slice(0, 4).map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[item.category] ?? "#666" }}
                      />
                      <span className="text-muted-foreground capitalize">{item.category.replace("_", " ")}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-violet-400" />
          <h3 className="font-bold text-foreground text-lg">Recent Activity</h3>
        </div>
        {activityLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity?.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                data-testid={`activity-item-${item.id}`}
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
        )}
      </motion.div>
    </motion.div>
  );
}
