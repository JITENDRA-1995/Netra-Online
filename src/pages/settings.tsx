import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sliders,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: number;
  title: string;
  desc: string;
  icon: string;
  tag: string;
  price: string;
  delivery: string;
  features: string[];
}

interface SettingsProps {
  servicesList: Service[];
  onOpenCalibrate: (s: Service) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  BRANDING: "#00d4ff",
  PRINT: "#10b981",
  DIGITAL: "#8b5cf6",
  VIDEO: "#ec4899",
  EVENT: "#f59e0b",
  COMMERCIAL: "#f97316",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SettingsPage({
  servicesList,
  onOpenCalibrate
}: SettingsProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  
  // Filtered Services List
  const filtered = servicesList.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
                        s.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "ALL" || 
                     (s.tag && s.tag.toUpperCase() === activeCategory.toUpperCase());
    return matchSearch && matchCat;
  });

  const getTagColor = (tag: string) => {
    return CATEGORY_COLORS[(tag || "").toUpperCase()] ?? "#666";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent" data-testid="heading-settings">
            Service Calibration
          </h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-widest uppercase">
            System pricing and parameters configuration
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5">
          <Sliders className="w-4 h-4 text-indigo-400 animate-spin-slow" />
          <span className="text-xs text-indigo-400 font-bold tracking-wider">{servicesList.length} CARDS CALIBRATED</span>
        </div>
      </motion.div>

      {/* Filter / Search Bar */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white/5 border-white/10 rounded-xl text-foreground bg-[#0a0f1e]/40"
            placeholder="Search service cards by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
          {["ALL", "BRANDING", "PRINT", "DIGITAL", "VIDEO", "EVENT", "COMMERCIAL"].map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "secondary" : "ghost"}
              className={`rounded-lg text-2xs font-semibold tracking-wider ${activeCategory === cat ? "bg-white/10 text-indigo-400" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Cards Grid */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length > 0 ? (
          filtered.map(s => {
            const color = getTagColor(s.tag);
            return (
              <motion.div
                key={s.id}
                variants={itemVariants}
                className="group relative rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all flex flex-col justify-between"
                style={{ background: `linear-gradient(135deg, ${color}03 0%, transparent 100%)` }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{s.icon || "⚡"}</span>
                    <Badge
                      className="text-3xs font-extrabold uppercase border-0 px-2.5 py-0.5 tracking-wider"
                      style={{
                        background: `${color}15`,
                        color: color
                      }}
                    >
                      {s.tag}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-1.5">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs py-2 border-y border-white/5 mb-4 text-muted-foreground">
                    <span className="font-bold text-foreground">{s.price}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {s.delivery}
                    </span>
                    <span>{s.features?.length || 0} Features</span>
                  </div>

                  <Button
                    onClick={() => onOpenCalibrate(s)}
                    className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs rounded-xl"
                  >
                    <Sliders className="w-3.5 h-3.5 mr-2" />
                    CALIBRATE SERVICE
                  </Button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-3 text-center py-20 text-muted-foreground border border-white/5 rounded-2xl">
            <Sliders className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="uppercase tracking-widest text-3xs font-semibold">NO SERVICE CARDS MATCHED CALIBRATION CRITERIA</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export { CATEGORY_COLORS };
