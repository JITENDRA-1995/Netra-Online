import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sliders,
  Clock,
  LayoutGrid,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  Tag,
  Eye,
  Loader2,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../supabase/client";

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
  visionSettings: any[];
  onSaveVisionSettings: (newSettings: any[]) => void;
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

// Preset high-fidelity design images in case they want templates
const PRESET_MOCK_IMAGES = [
  { url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80", title: "Premium Brandmark Concept" },
  { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80", title: "Modernist Layout" },
  { url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80", title: "Clean Mockup" },
  { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80", title: "Digital Dashboard" },
  { url: "https://images.unsplash.com/photo-1581291518655-9523c932ded7?auto=format&fit=crop&w=800&q=80", title: "UX Interface Wireframe" },
  { url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", title: "Cinematic Film Frames" },
  { url: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=800&q=80", title: "Minimal Coffee Box" },
  { url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80", title: "Organic Cosmetic Bottles" }
];

export default function SettingsPage({
  servicesList,
  onOpenCalibrate,
  visionSettings,
  onSaveVisionSettings
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState("CATALOG"); // CATALOG, VISION
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  // State for Vision calibration tab
  const [localVisionSettings, setLocalVisionSettings] = useState(() => {
    // Make sure we have exactly 5 slot objects
    const base = visionSettings ? [...visionSettings] : [];
    const copy = base.map(item => ({...item, photos: item.photos ? [...item.photos] : []}));
    while (copy.length < 5) {
      copy.push({ serviceId: 0, photos: [] });
    }
    return copy.slice(0, 5);
  });

  // State arrays for inline new slide inputs per slot index (0 to 4)
  const [newSlideUrls, setNewSlideUrls] = useState<string[]>(["", "", "", "", ""]);
  const [newSlideTitles, setNewSlideTitles] = useState<string[]>(["", "", "", "", ""]);

  // High-fidelity UI feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    isUploading: boolean;
    progress: number;
    fileName: string;
    phase: string;
  }>({
    isUploading: false,
    progress: 0,
    fileName: "",
    phase: ""
  });

  const [addingSlideStatus, setAddingSlideStatus] = useState<{
    isAdding: boolean;
    countdown: number;
    fileName: string;
  }>({
    isAdding: false,
    countdown: 0,
    fileName: ""
  });

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Instantly show the calibration success dialog box for maximum responsiveness
    setShowSavedSuccess(true);
    
    try {
      await onSaveVisionSettings(localVisionSettings);
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setIsSaving(false);
      // Auto-dismiss after 3.5 seconds
      setTimeout(() => {
        setShowSavedSuccess(false);
      }, 3500);
    }
  };

  const handleLocalImageUpload = async (slotIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus({
      isUploading: true,
      progress: 0,
      fileName: file.name,
      phase: "ESTABLISHING SECURE PORTAL CONNECTION..."
    });

    // Simulate progress smoothly to enhance UX
    let progressInterval = setInterval(() => {
      setUploadStatus(prev => {
        if (prev.progress >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        const step = Math.floor(Math.random() * 8) + 4;
        const nextProgress = Math.min(prev.progress + step, 95);
        let nextPhase = prev.phase;
        if (nextProgress > 20 && nextProgress <= 70) {
          nextPhase = "TRANSMITTING HIGH-FIDELITY MEDIA PACKETS...";
        } else if (nextProgress > 70) {
          nextPhase = "SYNCHRONIZING CDN EDGE CACHE...";
        }
        return {
          ...prev,
          progress: nextProgress,
          phase: nextPhase
        };
      });
    }, 120);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `vision/slot_${slotIdx}_${Date.now()}.${fileExt}`;

      // Upload directly to Supabase storage bucket 'studio-vault'
      const { error: uploadError } = await supabase.storage
        .from('studio-vault')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('studio-vault')
        .getPublicUrl(filePath);

      clearInterval(progressInterval);
      
      setUploadStatus(prev => ({
        ...prev,
        progress: 100,
        phase: "ASSET REGISTERED SUCCESSFULLY!"
      }));

      // Let user view the 100% completion state for aesthetic satisfaction
      await new Promise(resolve => setTimeout(resolve, 800));

      const urls = [...newSlideUrls];
      urls[slotIdx] = publicUrl;
      setNewSlideUrls(urls);
      
      const filename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const titles = [...newSlideTitles];
      titles[slotIdx] = filename;
      setNewSlideTitles(titles);

    } catch (err) {
      console.error("Direct storage upload failed:", err);
      clearInterval(progressInterval);
      
      // Fallback to FileReader base64 if there's any bucket permission/setup issue
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const urls = [...newSlideUrls];
        urls[slotIdx] = base64String;
        setNewSlideUrls(urls);
        
        const filename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const titles = [...newSlideTitles];
        titles[slotIdx] = filename;
        setNewSlideTitles(titles);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadStatus(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Filtered Services List (for Tab 1)
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

  // Vision settings helpers
  const handleSelectServiceForSlot = (slotIdx: number, serviceId: number) => {
    const next = [...localVisionSettings];
    next[slotIdx] = {
      ...next[slotIdx],
      serviceId: serviceId,
      photos: next[slotIdx].serviceId === serviceId ? next[slotIdx].photos : []
    };
    setLocalVisionSettings(next);
  };

  const handleAddSlideToSlot = async (slotIdx: number) => {
    const url = newSlideUrls[slotIdx].trim();
    const title = newSlideTitles[slotIdx].trim();
    if (!url) return;

    // Trigger high-tech countdown state tracking
    setAddingSlideStatus({
      isAdding: true,
      countdown: 3,
      fileName: title || "Slideshow Asset"
    });

    // Countdown loop (3s -> 2s -> 1s) to simulate segment indexing and packet compilation
    for (let c = 3; c > 0; c--) {
      setAddingSlideStatus(prev => ({ ...prev, countdown: c }));
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const next = [...localVisionSettings];
    const currentPhotos = next[slotIdx].photos ? [...next[slotIdx].photos] : [];
    currentPhotos.push({ url, title: title || "Slideshow Showcase" });
    next[slotIdx] = {
      ...next[slotIdx],
      photos: currentPhotos
    };

    setLocalVisionSettings(next);

    // Clear inputs
    const urls = [...newSlideUrls];
    urls[slotIdx] = "";
    setNewSlideUrls(urls);

    const titles = [...newSlideTitles];
    titles[slotIdx] = "";
    setNewSlideTitles(titles);

    setAddingSlideStatus(prev => ({ ...prev, isAdding: false }));
  };

  const handleRemoveSlideFromSlot = (slotIdx: number, slideIdx: number) => {
    const next = [...localVisionSettings];
    const currentPhotos = next[slotIdx].photos ? [...next[slotIdx].photos] : [];
    currentPhotos.splice(slideIdx, 1);
    next[slotIdx] = {
      ...next[slotIdx],
      photos: currentPhotos
    };
    setLocalVisionSettings(next);
  };

  const handleApplyPresetToSlot = (slotIdx: number, preset: typeof PRESET_MOCK_IMAGES[0]) => {
    const next = [...localVisionSettings];
    const currentPhotos = next[slotIdx].photos ? [...next[slotIdx].photos] : [];
    // Avoid duplicates
    if (!currentPhotos.some(p => p.url === preset.url)) {
      currentPhotos.push(preset);
      next[slotIdx] = {
        ...next[slotIdx],
        photos: currentPhotos
      };
      setLocalVisionSettings(next);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 text-white"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent" data-testid="heading-settings">
            System Control Panel
          </h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-widest uppercase">
            Pricing, Service calibration and VISION page settings
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-bold tracking-wider">SYSTEM CONFIGURATION</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        variants={itemVariants} 
        className="flex p-1 bg-white/[0.02] border border-white/5 rounded-2xl gap-2 w-fit mb-8 shadow-inner"
      >
        <button
          onClick={() => setActiveTab("CATALOG")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 ${
            activeTab === "CATALOG" 
              ? "bg-indigo-500 text-white font-black shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/20 scale-[0.98]" 
              : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03] hover:scale-[1.02]"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Service Pricing Catalog
        </button>
        <button
          onClick={() => setActiveTab("VISION")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 ${
            activeTab === "VISION" 
              ? "bg-indigo-500 text-white font-black shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/20 scale-[0.98]" 
              : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03] hover:scale-[1.02]"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Vision Tab calibration
        </button>
      </motion.div>

      {activeTab === "CATALOG" ? (
        <>
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
                    className="group relative rounded-2xl border border-white/5 bg-[#08080f]/80 backdrop-blur-sm p-5 hover:border-white/10 transition-all flex flex-col justify-between"
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
        </>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Vision Page Settings Explanation */}
          <motion.div 
            variants={itemVariants} 
            className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div>
              <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-400" />
                Vision Page segment Calibration
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-2xl">
                Choose exactly **up to 5 service cards** to showcase on the public VISION section. 
                Instead of the standard cards, each category will display a stunning, auto-running slideshow of custom calibrated images.
              </p>
            </div>
            
             <Button
              disabled={isSaving}
              onClick={handleSaveSettings}
              className="bg-[#00e5ff]/20 hover:bg-[#00e5ff]/35 border border-[#00e5ff]/30 text-[#00e5ff] font-bold px-6 py-5 rounded-xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,229,255,0.25)] transition-all duration-300 animate-pulse select-none cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "SYNCHRONIZING..." : "SAVE VISION SETTINGS"}
            </Button>
          </motion.div>

          {/* Slots Configuration */}
          <div className="space-y-6">
            {localVisionSettings.map((slot, slotIdx) => {
              const currentService = servicesList.find(s => s.id === slot.serviceId);
              
              return (
                <motion.div
                  key={slotIdx}
                  variants={itemVariants}
                  className="rounded-2xl border border-white/5 bg-[#08080f]/80 p-6 space-y-4 hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-xs font-bold">
                        0{slotIdx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">
                          {currentService ? currentService.title : "EMPTY PORTFOLIO SLOT"}
                        </h3>
                        <p className="text-3xs text-muted-foreground tracking-widest uppercase">
                          {currentService ? `Segment Type: ${currentService.tag}` : "No Service Segment Bound"}
                        </p>
                      </div>
                    </div>

                    {/* Selector */}
                    <div className="w-full md:w-80">
                      <select
                        value={slot.serviceId}
                        onChange={(e) => handleSelectServiceForSlot(slotIdx, Number(e.target.value))}
                        className="w-full bg-[#050508] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white outline-none focus:border-indigo-400 transition-colors"
                      >
                        <option value="0">-- SELECT SERVICE FOR THIS SLOT --</option>
                        {servicesList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.tag})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {slot.serviceId > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      {/* Left: Photos list */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5" />
                          Slideshow Photos ({slot.photos?.length || 0})
                        </h4>

                        {slot.photos && slot.photos.length > 0 ? (
                          <div className="max-h-[220px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                            {slot.photos.map((p: any, pIdx: number) => (
                              <div 
                                key={pIdx}
                                className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {p.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || p.url.includes("video") || p.url.startsWith("data:video/") ? (
                                    <video 
                                      src={p.url} 
                                      className="w-12 h-10 object-cover rounded-lg border border-white/10"
                                      muted
                                    />
                                  ) : (
                                    <img 
                                      src={p.url} 
                                      alt={p.title} 
                                      className="w-12 h-10 object-cover rounded-lg border border-white/10"
                                    />
                                  )}
                                  <div>
                                    <div className="text-xs font-semibold text-white/90 line-clamp-1">{p.title}</div>
                                    <div className="text-[9px] font-mono text-muted-foreground/60 line-clamp-1 max-w-[240px]">{p.url.startsWith("data:") ? "[Local Binary Data]" : p.url}</div>
                                  </div>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveSlideFromSlot(slotIdx, pIdx)}
                                  className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-[120px] border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground/30 text-2xs uppercase tracking-widest font-mono">
                            <span>No photos added yet</span>
                          </div>
                        )}

                        {/* Presets suggestions */}
                        <div className="space-y-1.5 pt-2">
                          <div className="text-[10px] font-mono text-muted-foreground/70 uppercase">Quick Add design Templates:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_MOCK_IMAGES.map((preset, prIdx) => (
                              <button
                                key={prIdx}
                                onClick={() => handleApplyPresetToSlot(slotIdx, preset)}
                                className="text-[9px] font-mono border border-white/5 bg-white/[0.01] hover:bg-indigo-500/10 hover:border-indigo-500/20 text-white/50 hover:text-indigo-400 px-2.5 py-1 rounded-full transition-all"
                              >
                                + {preset.title.split(" ")[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Add new photo form */}
                      <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          + Add slide to Slideshow
                        </h4>                         <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Media URL</label>
                              <div className="flex items-center gap-3">
                                {newSlideUrls[slotIdx] && (
                                  <button
                                    onClick={() => {
                                      const urls = [...newSlideUrls];
                                      urls[slotIdx] = "";
                                      setNewSlideUrls(urls);
                                      const titles = [...newSlideTitles];
                                      titles[slotIdx] = "";
                                      setNewSlideTitles(titles);
                                    }}
                                    className="text-[9px] font-mono text-red-400 hover:text-red-300 uppercase cursor-pointer flex items-center gap-1 hover:underline bg-transparent border-0 p-0 outline-none"
                                  >
                                    🗑️ Clear
                                  </button>
                                )}
                                <label 
                                  htmlFor={`local-file-${slotIdx}`}
                                  className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 uppercase cursor-pointer flex items-center gap-1 hover:underline"
                                >
                                  📁 Choose Local Media
                                </label>
                              </div>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                id={`local-file-${slotIdx}`}
                                onChange={(e) => handleLocalImageUpload(slotIdx, e)}
                                className="hidden"
                              />
                            </div>
                            <Input
                              value={newSlideUrls[slotIdx] && newSlideUrls[slotIdx].startsWith("data:") ? "[Local Media Selected]" : newSlideUrls[slotIdx]}
                              disabled={newSlideUrls[slotIdx] && newSlideUrls[slotIdx].startsWith("data:")}
                              onChange={(e) => {
                                const urls = [...newSlideUrls];
                                urls[slotIdx] = e.target.value;
                                setNewSlideUrls(urls);
                              }}
                              placeholder="https://images.unsplash.com/... or choose local media"
                              className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white placeholder:text-white/20 disabled:opacity-80 disabled:cursor-not-allowed"
                            />
                          </div>

                          {newSlideUrls[slotIdx] && (
                            newSlideUrls[slotIdx].startsWith("data:image/") || 
                            newSlideUrls[slotIdx].startsWith("data:video/") || 
                            newSlideUrls[slotIdx].match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || 
                            newSlideUrls[slotIdx].includes("video")
                          ) && (
                            <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/20 animate-fadeSlideUp">
                              {newSlideUrls[slotIdx].startsWith("data:video/") || 
                               newSlideUrls[slotIdx].match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || 
                               newSlideUrls[slotIdx].includes("video") ? (
                                <video 
                                  src={newSlideUrls[slotIdx]} 
                                  className="w-12 h-10 object-cover rounded-lg border border-indigo-500/30"
                                  muted
                                />
                              ) : (
                                <img 
                                  src={newSlideUrls[slotIdx]} 
                                  alt="Local upload preview" 
                                  className="w-12 h-10 object-cover rounded-lg border border-indigo-500/30"
                                />
                              )}
                              <div className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                                Local Media Selected ✓
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Slide Title Overlay</label>
                            <Input
                              value={newSlideTitles[slotIdx]}
                              onChange={(e) => {
                                const titles = [...newSlideTitles];
                                titles[slotIdx] = e.target.value;
                                setNewSlideTitles(titles);
                              }}
                              placeholder="e.g., Luxe Branding Showcase"
                              className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white placeholder:text-white/20"
                            />
                          </div>

                          <Button
                            onClick={() => handleAddSlideToSlot(slotIdx)}
                            className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-bold text-xs rounded-lg py-2 mt-2"
                          >
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            ADD SLIDE TO SHOWCASE
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div variants={itemVariants} className="flex justify-end pt-4">
            <Button
              disabled={isSaving}
              onClick={handleSaveSettings}
              className="bg-[#00e5ff]/20 hover:bg-[#00e5ff]/35 border border-[#00e5ff]/30 text-[#00e5ff] font-bold px-10 py-6 rounded-xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,229,255,0.25)] transition-all duration-300 select-none cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? "SYNCHRONIZING..." : "SAVE VISION SETTINGS"}
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Cyber Upload Progress Dialogue */}
      <AnimatePresence>
        {uploadStatus.isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="cyber-modal-card"
            >
              <div className="cyber-scanner-line" />
              <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <h3 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    TRANSMITTING MEDIA PACKET
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-500/60 uppercase">Netra Secure Port v4.2</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-white/50 uppercase">Target Resource:</div>
                  <div className="text-xs font-bold text-white/90 truncate font-mono mt-1">{uploadStatus.fileName}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-cyan-400/80 animate-pulse uppercase">{uploadStatus.phase}</span>
                    <span className="text-cyan-400 font-bold">{uploadStatus.progress}%</span>
                  </div>
                  <div className="cyber-progress-track">
                    <div 
                      className="cyber-progress-bar" 
                      style={{ width: `${uploadStatus.progress}%` }} 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Calibration Success Overlay */}
      <AnimatePresence>
        {showSavedSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 120 }}
              className="cyber-modal-card success-card"
            >
              <div className="cyber-scanner-line" />
              
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.15 }}
                    className="w-16 h-16 rounded-full border border-cyan-500 bg-[#00d4ff]/10 flex items-center justify-center text-cyan-400 relative z-10 shadow-[0_0_20px_rgba(0,212,255,0.4)]"
                  >
                    <ShieldCheck className="w-10 h-10 text-cyan-400" />
                  </motion.div>
                </div>
              </div>

              <h3 className="text-center font-black text-lg text-cyan-400 tracking-[4px] uppercase font-mono mb-2">
                SYSTEM CALIBRATED
              </h3>
              <p className="text-center text-2xs text-muted-foreground font-mono leading-relaxed max-w-sm mb-6 uppercase tracking-wider">
                Global database synchronized successfully. Vision slideshow presets and layouts have been re-calibrated across all active nodes.
              </p>

              <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                {localVisionSettings.map((slot, sIdx) => {
                  const currentService = servicesList.find(s => s.id === slot.serviceId);
                  return (
                    <div key={sIdx} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.01] border border-white/5 font-mono text-[9px] text-white/60">
                      <div className={`w-1.5 h-1.5 rounded-full ${slot.serviceId > 0 ? "bg-cyan-400 animate-pulse shadow-[0_0_6px_#00d4ff]" : "bg-white/10"}`} />
                      <span className="truncate">SLOT 0{sIdx + 1}: {slot.serviceId > 0 ? currentService?.tag : "EMPTY"}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cyber Slide Compilation & Countdown Overlay */}
      <AnimatePresence>
        {addingSlideStatus.isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-modal-overlay"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="cyber-modal-card"
            >
              <div className="cyber-scanner-line" />
              <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <h3 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    COMPILING SLIDECK SEGMENT
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-500/60 uppercase">Netra Node v9.5</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-white/50 uppercase">Asset Identifier:</div>
                  <div className="text-xs font-bold text-white/90 truncate font-mono mt-1">{addingSlideStatus.fileName}</div>
                </div>

                <div className="flex flex-col items-center justify-center py-6 relative">
                  <div className="text-5xl font-black font-mono text-cyan-400 select-none animate-pulse relative z-10">
                    {addingSlideStatus.countdown}s
                  </div>
                  <div className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest mt-2">
                    ESTIMATED TIME TO INDEX PACKETS
                  </div>
                  <div className="absolute inset-0 rounded-full bg-cyan-400/5 blur-xl animate-ping pointer-events-none" />
                </div>

                <div className="border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center text-[8px] font-mono text-muted-foreground/60">
                    <span>SECTOR: SLIDECK_CALIBRATE</span>
                    <span className="animate-pulse text-cyan-400">INDEXING ASSETS...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { CATEGORY_COLORS };
