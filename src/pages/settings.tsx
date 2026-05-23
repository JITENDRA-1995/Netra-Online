import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Search,
  Filter,
  Sliders,
  DollarSign,
  Clock,
  Plus,
  Trash2,
  ListPlus,
  FileText,
  Zap,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
  setServicesList: React.Dispatch<React.SetStateAction<Service[]>>;
}

const CATEGORY_COLORS: Record<string, string> = {
  BRANDING: "#00d4ff",
  PRINT: "#10b981",
  DIGITAL: "#8b5cf6",
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
  setServicesList
}: SettingsProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [calibratingService, setCalibratingService] = useState<Service | null>(null);

  // Filtered Services List
  const filtered = servicesList.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
                        s.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "ALL" || s.tag.toUpperCase() === activeCategory.toUpperCase();
    return matchSearch && matchCat;
  });

  const getTagColor = (tag: string) => {
    return CATEGORY_COLORS[tag.toUpperCase()] ?? "#666";
  };

  const handleIgniteCalibration = () => {
    if (!calibratingService) return;

    // Save update to state and localStorage
    const nextList = servicesList.map(s => s.id === calibratingService.id ? calibratingService : s);
    setServicesList(nextList);
    localStorage.setItem("netra_services", JSON.stringify(nextList));

    toast({
      title: "Service Calibrated Successfully",
      description: `Updated config for: ${calibratingService.title}`
    });

    setCalibratingService(null);
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
            className="pl-9 bg-white/5 border-white/10 rounded-xl"
            placeholder="Search service cards by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
          {["ALL", "BRANDING", "PRINT", "DIGITAL", "COMMERCIAL"].map(cat => (
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
                    onClick={() => setCalibratingService({ ...s, features: s.features ? [...s.features] : [] })}
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

      {/* Service Editor Calibration Dialog */}
      <Dialog open={calibratingService !== null} onOpenChange={(open) => !open && setCalibratingService(null)}>
        {calibratingService && (
          <DialogContent className="bg-[#0a0f1e] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2 uppercase tracking-wide">
                <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
                CALIBRATE: <span className="text-glow font-black">{calibratingService.title}</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Modify deliverables, quotes, and structural parameters. Saved configuration syncs immediately with clients.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Card Title</label>
                  <Input
                    value={calibratingService.title}
                    onChange={(e) => setCalibratingService({ ...calibratingService, title: e.target.value })}
                    className="bg-white/5 border-white/10 text-xs rounded-xl text-foreground"
                    placeholder="Service title"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Icon / Emoji</label>
                  <Input
                    value={calibratingService.icon}
                    onChange={(e) => setCalibratingService({ ...calibratingService, icon: e.target.value })}
                    className="bg-white/5 border-white/10 text-xs rounded-xl text-foreground"
                    placeholder="🎨, 📖, etc."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Category Tag</label>
                  <select
                    value={calibratingService.tag}
                    onChange={(e) => setCalibratingService({ ...calibratingService, tag: e.target.value })}
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-indigo-400"
                    required
                  >
                    <option value="BRANDING">BRANDING</option>
                    <option value="PRINT">PRINT</option>
                    <option value="DIGITAL">DIGITAL</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                  </select>
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Price</label>
                  <Input
                    value={calibratingService.price}
                    onChange={(e) => setCalibratingService({ ...calibratingService, price: e.target.value })}
                    className="bg-white/5 border-white/10 text-xs rounded-xl text-foreground"
                    placeholder="₹ Price"
                    required
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Delivery Time</label>
                  <Input
                    value={calibratingService.delivery}
                    onChange={(e) => setCalibratingService({ ...calibratingService, delivery: e.target.value })}
                    className="bg-white/5 border-white/10 text-xs rounded-xl text-foreground"
                    placeholder="e.g. 5 days"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Card Description</label>
                <Textarea
                  value={calibratingService.desc}
                  onChange={(e) => setCalibratingService({ ...calibratingService, desc: e.target.value })}
                  className="bg-white/5 border-white/10 text-xs rounded-xl min-h-[70px] text-foreground"
                  placeholder="Marketing description for client vault..."
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Deliverable Features List</label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-3xs font-extrabold text-indigo-400 hover:text-indigo-300 gap-1 h-6 px-2 hover:bg-white/5 rounded-lg"
                    onClick={() => setCalibratingService({
                      ...calibratingService,
                      features: [...(calibratingService.features || []), ""]
                    })}
                  >
                    <ListPlus className="w-3 h-3" />
                    ADD FEATURE ROW
                  </Button>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 border border-white/5 p-2 rounded-xl bg-white/[0.01]">
                  {(calibratingService.features || []).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={feat}
                        onChange={(e) => {
                          const newFeatures = [...calibratingService.features];
                          newFeatures[idx] = e.target.value;
                          setCalibratingService({ ...calibratingService, features: newFeatures });
                        }}
                        className="bg-white/5 border-white/10 text-2xs rounded-lg h-8 text-foreground"
                        placeholder={`Feature line #${idx + 1}`}
                        required
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 flex-shrink-0"
                        onClick={() => {
                          const newFeatures = calibratingService.features.filter((_, i) => i !== idx);
                          setCalibratingService({ ...calibratingService, features: newFeatures });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  {(!calibratingService.features || calibratingService.features.length === 0) && (
                    <p className="text-center text-muted-foreground py-4 text-3xs uppercase font-semibold">NO FEATURES DEFINED. CLICK ADD ROW ABOVE.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  className="flex-1 border border-white/10 text-xs"
                  onClick={() => setCalibratingService(null)}
                >
                  DISCARD
                </Button>
                <Button
                  className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 font-bold text-xs"
                  onClick={handleIgniteCalibration}
                >
                  IGNITE CALIBRATION
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
export { CATEGORY_COLORS };
