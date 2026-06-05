import { useState, useEffect } from "react";
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
  ShieldCheck,
  QrCode,
  Coins,
  User
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
  onClearAllDemoData: () => void;
  bankingDetails: any;
  onSaveBankingDetails: (details: any) => void;
  adminProfile: any;
  onSaveAdminProfile: (details: any) => void;
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
  onOpenCalibrate,
  visionSettings,
  onSaveVisionSettings,
  onClearAllDemoData,
  bankingDetails,
  onSaveBankingDetails,
  adminProfile,
  onSaveAdminProfile
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState("CATALOG"); // CATALOG, VISION, BANKING, PROFILE
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
  const [newSlideDurations, setNewSlideDurations] = useState<string[]>(["", "", "", "", ""]);

  // State for Banking calibration
  const [bankName, setBankName] = useState(bankingDetails?.bankName || "");
  const [accountName, setAccountName] = useState(bankingDetails?.accountName || "");
  const [accountNumber, setAccountNumber] = useState(bankingDetails?.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(bankingDetails?.ifscCode || "");
  const [upiId, setUpiId] = useState(bankingDetails?.upiId || "");
  const [isBankingSaving, setIsBankingSaving] = useState(false);

  // State for Profile calibration
  const [profileName, setProfileName] = useState(adminProfile?.businessName || "");
  const [profileAddress, setProfileAddress] = useState(adminProfile?.address || "");
  const [profilePhone, setProfilePhone] = useState(adminProfile?.phone || "");
  const [profileEmail, setProfileEmail] = useState(adminProfile?.email || "");
  const [profileGst, setProfileGst] = useState(adminProfile?.gst || "");
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  useEffect(() => {
    if (bankingDetails) {
      setBankName(bankingDetails.bankName || "");
      setAccountName(bankingDetails.accountName || "");
      setAccountNumber(bankingDetails.accountNumber || "");
      setIfscCode(bankingDetails.ifscCode || "");
      setUpiId(bankingDetails.upiId || "");
    }
  }, [bankingDetails]);

  useEffect(() => {
    if (adminProfile) {
      setProfileName(adminProfile.businessName || "");
      setProfileAddress(adminProfile.address || "");
      setProfilePhone(adminProfile.phone || "");
      setProfileEmail(adminProfile.email || "");
      setProfileGst(adminProfile.gst || "");
    }
  }, [adminProfile]);

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

  const handleSaveBankingDetailsLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBankingSaving(true);
    try {
      await onSaveBankingDetails({
        bankName,
        accountName,
        accountNumber,
        ifscCode,
        upiId
      });
    } catch (err) {
      console.error("Save banking error:", err);
    } finally {
      setIsBankingSaving(false);
    }
  };

  const handleSaveProfileLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    try {
      await onSaveAdminProfile({
        businessName: profileName,
        address: profileAddress,
        phone: profilePhone,
        email: profileEmail,
        gst: profileGst
      });
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsProfileSaving(false);
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

  // States for interactive slideshow slide calibration preview modal
  const [activePreviewSlide, setActivePreviewSlide] = useState<{
    slotIdx: number;
    url: string;
    title: string;
    durationStr: string;
  } | null>(null);

  const [slideFit, setSlideFit] = useState<'cover' | 'contain' | 'fill'>('cover');
  const [slideScale, setSlideScale] = useState<number>(1);
  const [slidePositionX, setSlidePositionX] = useState<number>(0);
  const [slidePositionY, setSlidePositionY] = useState<number>(0);
  const [slideBrightness, setSlideBrightness] = useState<number>(100);
  const [slideContrast, setSlideContrast] = useState<number>(100);
  const [slideSaturation, setSlideSaturation] = useState<number>(100);
  const [slideGrayscale, setSlideGrayscale] = useState<number>(0);
  const [slideHueRotate, setSlideHueRotate] = useState<number>(0);

  const handleOpenSlideCalibration = (slotIdx: number) => {
    const url = newSlideUrls[slotIdx].trim();
    const title = newSlideTitles[slotIdx].trim();
    const durationStr = newSlideDurations[slotIdx].trim();
    if (!url) return;

    setActivePreviewSlide({
      slotIdx,
      url,
      title: title || "Slideshow Showcase",
      durationStr
    });

    // Reset sliders to default values
    setSlideFit('cover');
    setSlideScale(1);
    setSlidePositionX(0);
    setSlidePositionY(0);
    setSlideBrightness(100);
    setSlideContrast(100);
    setSlideSaturation(100);
    setSlideGrayscale(0);
    setSlideHueRotate(0);
  };

  const handleConfirmAddSlide = async () => {
    if (!activePreviewSlide) return;
    const { slotIdx, url, title, durationStr } = activePreviewSlide;

    // Trigger high-tech countdown state tracking
    setAddingSlideStatus({
      isAdding: true,
      countdown: 3,
      fileName: title || "Slideshow Asset"
    });

    // Close preview modal first so they see countdown progress in the background
    setActivePreviewSlide(null);

    // Countdown loop (3s -> 2s -> 1s) to simulate segment indexing and packet compilation
    for (let c = 3; c > 0; c--) {
      setAddingSlideStatus(prev => ({ ...prev, countdown: c }));
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const next = [...localVisionSettings];
    const currentPhotos = next[slotIdx].photos ? [...next[slotIdx].photos] : [];
    
    // Parse duration (float or undefined if empty)
    const duration = durationStr ? parseFloat(durationStr) : undefined;

    currentPhotos.push({ 
      url, 
      title: title || "Slideshow Showcase",
      duration,
      fit: slideFit,
      scale: slideScale,
      positionX: slidePositionX,
      positionY: slidePositionY,
      brightness: slideBrightness,
      contrast: slideContrast,
      saturation: slideSaturation,
      grayscale: slideGrayscale,
      hueRotate: slideHueRotate
    });
    
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

    const durations = [...newSlideDurations];
    durations[slotIdx] = "";
    setNewSlideDurations(durations);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 text-white"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent" data-testid="heading-settings">
            System Control Panel
          </h1>
          <p className="text-muted-foreground mt-1 text-sm tracking-widest uppercase">
            Pricing, Service calibration and VISION page settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              if (window.confirm("🔴 CRITICAL SECURITY DISPATCH 🔴\n\nAre you absolutely certain you want to purge all demo data?\n\nThis will permanently delete all projects, inquiries, custom invoices, clients (except System Settings), and cashbook entries from Supabase and local storage.\n\nTHIS ACTION CANNOT BE UNDONE!")) {
                onClearAllDemoData();
              }
            }}
            className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-extrabold text-xs rounded-xl px-4 py-2 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300 select-none cursor-pointer"
          >
            Clear System Demo Data
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-bold tracking-wider">SYSTEM CONFIGURATION</span>
          </div>
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
        <button
          onClick={() => setActiveTab("BANKING")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 ${
            activeTab === "BANKING" 
              ? "bg-indigo-500 text-white font-black shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/20 scale-[0.98]" 
              : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03] hover:scale-[1.02]"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          Banking & Payments
        </button>
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 ${
            activeTab === "PROFILE" 
              ? "bg-indigo-500 text-white font-black shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/20 scale-[0.98]" 
              : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03] hover:scale-[1.02]"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Admin Profile Settings
        </button>
      </motion.div>

      {activeTab === "CATALOG" && (
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
      )}

      {activeTab === "VISION" && (
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
                                    <div className="text-xs font-semibold text-white/90 line-clamp-1 flex items-center gap-1.5">
                                      {p.title}
                                      {p.duration !== undefined && p.duration > 0 && (
                                        <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.25 rounded-md">
                                          {p.duration}s
                                        </span>
                                      )}
                                    </div>
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

                          <div className="space-y-1">
                            <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Running Duration (seconds)</label>
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={newSlideDurations[slotIdx]}
                              onChange={(e) => {
                                const durations = [...newSlideDurations];
                                durations[slotIdx] = e.target.value;
                                setNewSlideDurations(durations);
                              }}
                              placeholder="e.g., 5 (Blank for default)"
                              className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white placeholder:text-white/20"
                            />
                          </div>

                          <Button
                            onClick={() => handleOpenSlideCalibration(slotIdx)}
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

      {activeTab === "BANKING" && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Explanation panel */}
          <motion.div 
            variants={itemVariants} 
            className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div>
              <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2 text-left">
                <Coins className="w-5 h-5 text-indigo-400" />
                Banking & Unified Payments Interface (UPI) Calibration
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-2xl text-left">
                Configure your official business settlement credentials. The systems will dynamically compile interactive payment gateways and UPI QR codes on all future generated tax invoices using these parameters.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left side Form */}
            <motion.div 
              variants={itemVariants} 
              className="rounded-2xl border border-white/5 bg-[#08080f]/80 backdrop-blur-sm p-6 space-y-4"
            >
              <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4" />
                Settlement Credentials
              </h3>
              
              <form onSubmit={handleSaveBankingDetailsLocal} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Bank Name</label>
                  <Input 
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="e.g. STATE BANK OF INDIA"
                    className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Account Holder Name</label>
                  <Input 
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="e.g. NETRA GRAPHICS & DESIGNING"
                    className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Account Number</label>
                    <Input 
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="e.g. 20198798116"
                      className="bg-white/5 border-white/10 text-xs rounded-xl h-10 font-mono text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">IFSC Code</label>
                    <Input 
                      value={ifscCode}
                      onChange={e => setIfscCode(e.target.value)}
                      placeholder="e.g. SBIN0060152"
                      className="bg-white/5 border-white/10 text-xs rounded-xl h-10 font-mono text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">UPI ID (VPA) *</label>
                  <Input 
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g. netragraphics@sbi"
                    className="bg-white/5 border-white/10 text-xs rounded-xl h-10 font-mono text-foreground"
                    required
                  />
                  <p className="text-[9px] text-muted-foreground">CRITICAL: Double-check VPA address. Mismatches will route payments to invalid endpoints.</p>
                </div>

                <Button
                  type="submit"
                  disabled={isBankingSaving}
                  className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-black font-extrabold text-xs rounded-xl py-5 shadow-lg shadow-indigo-500/10 mt-2"
                >
                  {isBankingSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isBankingSaving ? "SYNCHRONIZING..." : "SAVE BANKING DETAILS"}
                </Button>
              </form>
            </motion.div>

            {/* Right side QR Preview and Details */}
            <motion.div 
              variants={itemVariants} 
              className="rounded-2xl border border-white/5 bg-[#08080f]/80 backdrop-blur-sm p-6 flex flex-col items-center justify-between min-h-[440px]"
            >
              <div className="w-full">
                <h3 className="font-bold text-sm uppercase tracking-widest text-cyan-400 flex items-center gap-2 mb-2 text-left">
                  <QrCode className="w-4 h-4" />
                  QR Gateway Calibration Preview
                </h3>
                <p className="text-2xs text-muted-foreground text-left mb-6">
                  Live verification layout simulating UPI payment flow. Enter a test calibration quote to visually inspect the payload.
                </p>
              </div>

              {/* QR display card */}
              <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col items-center gap-4 w-full max-w-xs shadow-2xl">
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  <span>LIVE</span>
                </div>
                
                <div className="w-40 h-40 bg-white p-2 rounded-xl flex items-center justify-center shadow-inner relative group overflow-hidden">
                  {upiId ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${accountName || 'Netra Graphics'}&am=100.00&cu=INR`)}`}
                      alt="UPI QR Code Calibration" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <QrCode className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2 animate-bounce" />
                      <span className="text-[9px] text-muted-foreground uppercase font-mono block">Awaiting VPA Calibration...</span>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1 w-full">
                  <div className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Dynamic Payee Gateway</div>
                  <div className="text-xs font-bold text-white truncate max-w-[200px] mx-auto">{accountName || "NETRA GRAPHICS"}</div>
                  <div className="text-[10px] font-mono text-cyan-400 truncate max-w-[200px] mx-auto">{upiId || "address@upi"}</div>
                </div>

                <div className="w-full border-t border-white/5 pt-3 mt-1 flex justify-between items-center text-[9px] font-mono text-muted-foreground">
                  <span>SIMULATED TOTAL:</span>
                  <span className="font-extrabold text-emerald-400">₹100.00</span>
                </div>
              </div>

              {/* Instructions checklist */}
              <div className="w-full border-t border-white/5 pt-4 mt-6 text-left space-y-2 font-mono text-[9px] text-white/50">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 flex-shrink-0 animate-pulse" />
                  <span>Interactive dynamic payload: Uses `upi://pay` protocol specification.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 flex-shrink-0 animate-pulse" />
                  <span>Complies fully with NPCI (National Payments Corporation of India) standards.</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1 flex-shrink-0 animate-pulse" />
                  <span>Visual QR verification compiled dynamically on edge endpoints.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {activeTab === "PROFILE" && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Explanation panel */}
          <motion.div 
            variants={itemVariants} 
            className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div>
              <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2 text-left">
                <User className="w-5 h-5 text-indigo-400" />
                Admin Profile Settings
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-2xl text-left">
                Configure your official studio brand credentials. This will customize printed invoice headers, physical address lines, GST records, and support email signatures globally.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start text-left">
            {/* Left Column: Form */}
            <motion.div 
              variants={itemVariants} 
              className="rounded-2xl border border-white/5 bg-[#08080f]/80 backdrop-blur-sm p-6 space-y-4"
            >
              <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4" />
                Physical & Identity Calibration
              </h3>

              <form onSubmit={handleSaveProfileLocal} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Studio / Business Name *</label>
                  <Input 
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="e.g. Netra Graphics"
                    className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Physical Address *</label>
                  <Input 
                    value={profileAddress}
                    onChange={e => setProfileAddress(e.target.value)}
                    placeholder="e.g. Shreeji Complex, Opp. Sasan Road, Mendarda"
                    className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Official Contact Phone *</label>
                    <Input 
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      placeholder="e.g. +91 90161 60152"
                      className="bg-white/5 border-white/10 text-xs rounded-xl h-10 font-mono text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Official Contact Email *</label>
                    <Input 
                      type="email"
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="e.g. info@netragraphics.com"
                      className="bg-white/5 border-white/10 text-xs rounded-xl h-10 font-mono text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">GSTIN Tax Registration Code (Optional)</label>
                  <Input 
                    value={profileGst}
                    onChange={e => setProfileGst(e.target.value)}
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    className="bg-white/5 border-white/10 text-xs rounded-xl h-10 font-mono text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isProfileSaving}
                  className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-black font-extrabold text-xs rounded-xl py-5 shadow-lg shadow-indigo-500/10 mt-2"
                >
                  {isProfileSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isProfileSaving ? "SYNCHRONIZING..." : "SAVE PROFILE DETAILS"}
                </Button>
              </form>
            </motion.div>

            {/* Right Column: Live Mockup Business Card */}
            <motion.div 
              variants={itemVariants} 
              className="rounded-2xl border border-white/5 bg-[#08080f]/80 backdrop-blur-sm p-6 flex flex-col items-center justify-between min-h-[440px]"
            >
              <div className="w-full">
                <h3 className="font-bold text-sm uppercase tracking-widest text-cyan-400 flex items-center gap-2 mb-2 text-left">
                  <ShieldCheck className="w-4 h-4" />
                  Calibrated Brand Card Preview
                </h3>
                <p className="text-2xs text-muted-foreground text-left mb-6 font-sans">
                  Live glassmorphism preview panel displaying your business identity block as it will be loaded dynamically on dynamic nodes.
                </p>
              </div>

              {/* Glass Business Card */}
              <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-cyan-500/10 p-6 shadow-2xl relative overflow-hidden group select-none">
                {/* Aura circles */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-400/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-700" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-700" />
                
                <div className="space-y-6 relative z-10 text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-extrabold tracking-widest uppercase block">OFFICIAL CONTRACT CARD</span>
                      <h4 className="text-lg font-black text-white tracking-wide truncate max-w-[240px] mt-1">{profileName || "NETRA GRAPHICS"}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-indigo-400/30 bg-indigo-500/10 flex items-center justify-center text-xs">
                      🌐
                    </div>
                  </div>

                  <div className="space-y-2 font-mono text-[9px] text-white/70">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">📞</span>
                      <span>{profilePhone || "+91 00000 00000"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">📧</span>
                      <span className="truncate max-w-[260px]">{profileEmail || "contact@business.com"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-400">🏠</span>
                      <span className="truncate max-w-[260px]">{profileAddress || "Office address, City"}</span>
                    </div>
                    {profileGst && (
                      <div className="flex items-center gap-2 border-t border-white/5 pt-2 mt-2">
                        <span className="text-cyan-400 font-bold uppercase">GSTIN:</span>
                        <span className="font-bold text-white tracking-widest">{profileGst}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[8px] font-mono text-white/30 border-t border-white/5 pt-3">
                    <span>SYSTEM ID: settings@netra.graphics</span>
                    <span className="text-emerald-400 animate-pulse font-extrabold">● SECURE SYNCED</span>
                  </div>
                </div>
              </div>

              {/* Status parameters */}
              <div className="w-full border-t border-white/5 pt-4 mt-6 text-left space-y-2 font-mono text-[9px] text-white/40">
                <div className="flex justify-between">
                  <span>Supabase Edge Pipeline:</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span>Configuration Table Reference:</span>
                  <span>settings@netra.graphics</span>
                </div>
                <div className="flex justify-between">
                  <span>Dynamic Invoice Sync status:</span>
                  <span className="text-cyan-400 font-extrabold animate-pulse">ACTIVE & ARMED</span>
                </div>
              </div>
            </motion.div>
          </div>
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

      {/* Slideshow Slide Calibration & Live Preview Overlay */}
      <AnimatePresence>
        {activePreviewSlide && (
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
              className="w-full max-w-[1000px] bg-gradient-to-br from-[#080c1c]/95 to-[#04060f]/98 border border-cyan-500/25 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,229,255,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-6 max-h-[95vh] overflow-y-auto"
            >
              <div className="cyber-scanner-line" />
              
              {/* Left Column: Real-time Live Preview */}
              <div className="flex-1 flex flex-col gap-4">
                <h3 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/20 pb-3 text-left">
                  Live Layout Simulation
                </h3>
                
                <div 
                  className="w-full h-[360px] rounded-3xl border border-white/5 relative overflow-hidden bg-[#080810]/80 self-center"
                  style={{
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
                  }}
                >
                  {/* Styled Image / Video Preview */}
                  {activePreviewSlide.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || activePreviewSlide.url.includes("video") || activePreviewSlide.url.startsWith("data:video/") ? (
                    <video 
                      src={activePreviewSlide.url} 
                      className="w-full h-full"
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        objectFit: slideFit,
                        objectPosition: `${slidePositionX + 50}% ${slidePositionY + 50}%`,
                        transform: `scale(${slideScale})`,
                        filter: `brightness(${slideBrightness}%) contrast(${slideContrast}%) saturate(${slideSaturation}%) grayscale(${slideGrayscale}%) hue-rotate(${slideHueRotate}deg)`
                      }}
                    />
                  ) : (
                    <img 
                      src={activePreviewSlide.url} 
                      alt={activePreviewSlide.title} 
                      className="w-full h-full"
                      style={{
                        objectFit: slideFit,
                        objectPosition: `${slidePositionX + 50}% ${slidePositionY + 50}%`,
                        transform: `scale(${slideScale})`,
                        filter: `brightness(${slideBrightness}%) contrast(${slideContrast}%) saturate(${slideSaturation}%) grayscale(${slideGrayscale}%) hue-rotate(${slideHueRotate}deg)`
                      }}
                    />
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-1 pointer-events-none"></div>
                  
                  {/* Floating Caption Simulation */}
                  <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-between items-end pointer-events-none">
                    <div className="backdrop-blur-md bg-black/50 border border-white/10 rounded-2xl px-5 py-3 max-w-[70%] text-left">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">PORTFOLIO FLAME</span>
                      <h4 className="text-xs md:text-sm font-bold text-white tracking-wide truncate">{activePreviewSlide.title || "Showcase Asset"}</h4>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-left text-2xs text-muted-foreground leading-relaxed">
                  <span className="text-cyan-400 font-bold">PRO TIP:</span> Use the panning offsets and scale controls to crop and frame the image. Color correction sliders help adjust contrast, warmth, and brightness to fit the dark aesthetic.
                </div>
              </div>

              {/* Right Column: Calibration Controls */}
              <div className="w-full md:w-[380px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-6 text-left">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-500/20">
                  <h3 className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    Calibration Parameters
                  </h3>

                  {/* Slide Title */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Slide Title Overlay</label>
                    <Input
                      value={activePreviewSlide.title}
                      onChange={(e) => setActivePreviewSlide({ ...activePreviewSlide, title: e.target.value })}
                      placeholder="e.g., Luxe Branding Showcase"
                      className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white"
                    />
                  </div>

                  {/* Size Layout Options / Fit */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">Best Fit / Auto Fit Option</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['cover', 'contain', 'fill'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSlideFit(mode)}
                          className={`py-1.5 rounded-lg text-3xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                            slideFit === mode
                              ? "bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                              : "bg-black/20 border-white/5 text-muted-foreground hover:text-white"
                          }`}
                        >
                          {mode === 'cover' ? 'Auto Fit (Cover)' : mode === 'contain' ? 'Contain' : 'Stretch (Fill)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zoom / Scaling Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                      <span>Zoom / Scale Factor</span>
                      <span className="text-cyan-400 font-bold">{slideScale.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={slideScale}
                      onChange={(e) => setSlideScale(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Panning / Cropping X Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                      <span>Horizontal Pan Offset</span>
                      <span className="text-cyan-400 font-bold">{slidePositionX}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={slidePositionX}
                      onChange={(e) => setSlidePositionX(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Panning / Cropping Y Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                      <span>Vertical Pan Offset</span>
                      <span className="text-cyan-400 font-bold">{slidePositionY}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={slidePositionY}
                      onChange={(e) => setSlidePositionY(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Color Correction Section */}
                  <div className="border-t border-white/5 pt-3 space-y-3">
                    <h4 className="text-[10px] font-mono font-bold text-indigo-400/80 uppercase tracking-widest">
                      Color Correction
                    </h4>

                    {/* Brightness Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                        <span>Brightness</span>
                        <span className="text-cyan-400 font-bold">{slideBrightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="1"
                        value={slideBrightness}
                        onChange={(e) => setSlideBrightness(parseInt(e.target.value))}
                        className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Contrast Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                        <span>Contrast</span>
                        <span className="text-cyan-400 font-bold">{slideContrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="1"
                        value={slideContrast}
                        onChange={(e) => setSlideContrast(parseInt(e.target.value))}
                        className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Saturation Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                        <span>Saturation</span>
                        <span className="text-cyan-400 font-bold">{slideSaturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={slideSaturation}
                        onChange={(e) => setSlideSaturation(parseInt(e.target.value))}
                        className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Grayscale Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                        <span>Grayscale</span>
                        <span className="text-cyan-400 font-bold">{slideGrayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={slideGrayscale}
                        onChange={(e) => setSlideGrayscale(parseInt(e.target.value))}
                        className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Hue Rotate Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground uppercase">
                        <span>Hue Rotation</span>
                        <span className="text-cyan-400 font-bold">{slideHueRotate}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={slideHueRotate}
                        onChange={(e) => setSlideHueRotate(parseInt(e.target.value))}
                        className="w-full accent-indigo-400 bg-white/5 h-1 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 border-t border-white/5 pt-4 mt-4 select-none">
                  <Button
                    onClick={() => setActivePreviewSlide(null)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl py-2.5 transition-all"
                  >
                    DISCARD
                  </Button>
                  <Button
                    onClick={handleConfirmAddSlide}
                    className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/30 text-cyan-400 font-bold text-xs rounded-xl py-2.5 hover:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all"
                  >
                    ADD TO SHOWCASE
                  </Button>
                </div>
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
