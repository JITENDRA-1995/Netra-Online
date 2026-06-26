import React, { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import './Login.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Eye, EyeOff, Terminal, Sparkles, LogIn, ChevronRight, ChevronLeft, X, ShieldAlert, ArrowLeft, LayoutDashboard, Folder, Users, Inbox, FileText, Settings, LogOut, Home, Briefcase, Mail, Menu, Volume2, VolumeX, Coins, Phone, MapPin, Pencil, Trash2 } from 'lucide-react';

// Lazy loaded page components to optimize bundle size and load performance
const Dashboard = React.lazy(() => import('@/pages/dashboard'));
const Projects = React.lazy(() => import('@/pages/projects'));
const Clients = React.lazy(() => import('@/pages/clients'));
const Inquiries = React.lazy(() => import('@/pages/inquiries'));
const Financials = React.lazy(() => import('@/pages/financials'));
const SettingsPage = React.lazy(() => import('@/pages/settings'));
const Portfolio = React.lazy(() => import('@/pages/Portfolio').then(m => ({ default: m.Portfolio })));
const InvoicesPage = React.lazy(() => import('@/pages/invoices'));

// Client Vault Components
import { ClientVaultLayout } from './pages/client-vault/layout';
import { ClientDashboard } from './pages/client-vault/dashboard';
import { ClientProjects } from './pages/client-vault/projects';
import { ClientProjectDetail } from './pages/client-vault/project-detail';
import { ClientProjectMessages } from './pages/client-vault/project-messages';
import { ClientProjectAssets } from './pages/client-vault/project-assets';
import { ClientGlobalAssets } from './pages/client-vault/global-assets';
import { ClientInvoices } from './pages/client-vault/invoices';
import { ClientInvoiceDetail } from './pages/client-vault/invoice-detail';
import { ClientProfile } from './pages/client-vault/profile';
import { WhatsNewBulb } from './components/WhatsNewBulb';
import { ClientCollaboration } from './pages/client-vault/collaboration';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full bg-[#050508]/20 backdrop-blur-sm rounded-3xl border border-white/5">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"></div>
      </div>
      <p className="text-cyan-400/80 text-xs font-mono tracking-widest uppercase animate-pulse">Initializing Module...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();
import { supabase } from './supabase/client';
import { getISTDateString } from './lib/utils';
import {
  getInquiries, createInquiry, updateInquiry, deleteInquiry,
  getClients, createClientProfile, verifyClientVaultKey, updateClientProfile,
  getProjects, igniteProject, updateProjectState, toggleMilestone, addProjectActivityLog, sendChatMessage, subscribeToChats, uploadMediaVaultAsset, subscribeToAllChats, subscribeToAllMedia,
  getInvoices, saveInvoice, deleteInvoice, updateInvoice,
  getMicroJobs
} from './supabase/database';


const safeSetLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Local Storage write failed for key "${key}":`, e);
  }
};

const defaultServices = [
  {
    id: 1,
    title: "Brand Identity (Logo)",
    desc: "Crafting the soul of your business through iconic marks.",
    icon: "🎨",
    tag: "BRANDING",
    price: "",
    delivery: "",
    features: [
      "3 Unique Design Concepts",
      "Vector Source Files (AI, SVG, PDF)",
      "Comprehensive Brand Style Guide",
      "Unlimited Revision Rounds"
    ]
  },
  {
    id: 2,
    title: "Premium Brochures",
    desc: "Tangible narratives that tell your brand story in print.",
    icon: "📖",
    tag: "PRINT",
    price: "",
    delivery: "",
    features: [
      "Bi-fold or tri-fold layouts",
      "Print-ready CMYK files",
      "Unlimited pages option",
      "Stock Imagery Included"
    ]
  },
  {
    id: 3,
    title: "Digital Interactive Brochures",
    desc: "Immersive, clickable experiences for the modern era.",
    icon: "🖱️",
    tag: "DIGITAL",
    price: "",
    delivery: "",
    features: [
      "Immersive Clickable Layouts",
      "Embedded Rich Media Support",
      "Cross-Platform PDF & Web Formats",
      "SEO Optimized Digital Output"
    ]
  },
  {
    id: 4,
    title: "Corporate Profiles",
    desc: "Building authority through professional structural design.",
    icon: "🏢",
    tag: "BRANDING",
    price: "",
    delivery: "",
    features: [
      "Professional Structured Design",
      "Corporate Color Coordination",
      "Premium Editorial Layout",
      "High-Resolution Output Ready"
    ]
  },
  {
    id: 5,
    title: "Social Storytelling",
    desc: "High-impact graphics designed for digital engagement.",
    icon: "📱",
    tag: "DIGITAL",
    price: "",
    delivery: "",
    features: [
      "High-Impact Social Graphics",
      "Custom Brand Color Theme",
      "Instagram, LinkedIn & FB Formats",
      "Source Files & Assets Included"
    ]
  },
  {
    id: 6,
    title: "Large Format Media",
    desc: "Bold visual statements for hoardings and wall graphics.",
    icon: "🏙️",
    tag: "PRINT",
    price: "",
    delivery: "",
    features: [
      "Hoardings & Wall Graphics Layouts",
      "Ultra-High Resolution Formats",
      "Custom Vector Scale Support",
      "Print Partner Coordination Prep"
    ]
  },
  {
    id: 7,
    title: "Cinematic Video Packages",
    desc: "Motion design and production for a visual revolution.",
    icon: "🎥",
    tag: "VIDEO",
    price: "",
    delivery: "",
    features: [
      "3D Motion Graphics & Animation",
      "High-Fidelity Audio Integration",
      "Premium Color Grading & Effects",
      "Full 4K Ultra-HD Output"
    ]
  },
  {
    id: 8,
    title: "Digital Invitations",
    desc: "Modern, elegant WhatsApp-ready invites for every event.",
    icon: "✉️",
    tag: "DIGITAL",
    price: "",
    delivery: "",
    features: [
      "Elegant Modern Art Styles",
      "WhatsApp & Social-Ready Formats",
      "Interactive Action Links Option",
      "Express Delivery Available"
    ]
  },
  {
    id: 9,
    title: "Editorial Design",
    desc: "Professional layouts for magazines and corporate newsletters.",
    icon: "📰",
    tag: "PRINT",
    price: "",
    delivery: "",
    features: [
      "Magazine & Newsletter Layouts",
      "Advanced Typography Grid System",
      "Sleek Modern Image Wrapping",
      "Print & Web Ready Formats"
    ]
  },
  {
    id: 10,
    title: "Print Masterpieces (Posters)",
    desc: "High-resolution visual art for physical spaces.",
    icon: "🖼️",
    tag: "PRINT",
    price: "",
    delivery: "",
    features: [
      "High-Resolution Gallery Art Quality",
      "Cyberpunk, Modern, or Classic Themes",
      "Custom Typography Treatments",
      "Ready for Canvas or Paper Print"
    ]
  },
  {
    id: 11,
    title: "Marketing Flyers",
    desc: "Strategic designs to spark immediate consumer interest.",
    icon: "🚀",
    tag: "PRINT",
    price: "",
    delivery: "",
    features: [
      "Conversion-Optimized Layouts",
      "Bold Call-to-Actions (CTAs)",
      "Double-sided Artwork Support",
      "High-speed Single Day Prep option"
    ]
  },
  {
    id: 12,
    title: "Custom Calendars",
    desc: "365 days of your brand presence on every desk.",
    icon: "📅",
    tag: "PRINT",
    price: "",
    delivery: "",
    features: [
      "12 Months of Custom Visual Themes",
      "Coordinated Brand Layout Grid",
      "Pre-marked Holidays & Events",
      "High-Res Desk & Wall Ready Sizes"
    ]
  },
  {
    id: 13,
    title: "Prestige Certificates",
    desc: "Designing excellence for your milestones and awards.",
    icon: "🏆",
    tag: "BRANDING",
    price: "",
    delivery: "",
    features: [
      "Elegant Vectors & Border Layouts",
      "Anti-forgery Micro-texture Details",
      "Bulk Dynamic Printing Prep",
      "Premium Typography Selection"
    ]
  },
  {
    id: 14,
    title: "Culinary Menus",
    desc: "Visual appetizing designs for restaurants and cafes.",
    icon: "🍴",
    tag: "PRINT",
    price: "",
    delivery: "",
    features: [
      "Appetizing & Clear Visual Layouts",
      "Coordinated Cuisine Styling",
      "Highly Legible Typography Selection",
      "Water-Resistant Material Prep Guide"
    ]
  },
  {
    id: 15,
    title: "Festival Greetings",
    desc: "Cultural heritage meets high-tech celebratory art.",
    icon: "✨",
    tag: "DIGITAL",
    price: "",
    delivery: "",
    features: [
      "Cultural Heritage Meets Tech",
      "Premium Animation Effects Support",
      "Direct Client Greeting Personalization",
      "Social Media Broadcast Ready"
    ]
  },
  {
    id: 16,
    title: "Event Stationery",
    desc: "Bespoke invitation cards for every significant gathering.",
    icon: "🎫",
    tag: "EVENT",
    price: "",
    delivery: "",
    features: [
      "Coordinated Bespoke Invitations",
      "Seating Charts & Place Cards Theme",
      "Premium RSVP Cards Artwork",
      "Unified Event Visual Identity"
    ]
  },
  {
    id: 17,
    title: "Legacy Wedding Albums",
    desc: "Transforming your most precious memories into a visual epic.",
    icon: "💍",
    tag: "EVENT",
    price: "",
    delivery: "",
    features: [
      "Premium Cinematic Story Telling Layouts",
      "Advanced Professional Photo Retouching",
      "Heavy-Duty Layflat Binding Templates",
      "Timeless Editorial Text Alignments"
    ]
  },
  {
    id: 18,
    title: "Photography",
    desc: "Capturing moments with cinematic precision and artistic flair.",
    icon: "📸",
    tag: "DIGITAL",
    price: "",
    delivery: "",
    features: [
      "Cinematic Camera Precision Hooks",
      "Premium Post-processing Styling",
      "Professional Lighting Coordination",
      "Digital High-Res Photo Delivery"
    ]
  },
  {
    id: 19,
    title: "Printing Jobwork",
    desc: "Precision engineering for all your commercial printing needs.",
    icon: "🖨️",
    tag: "COMMERCIAL",
    price: "",
    delivery: "",
    features: [
      "Precision Engineering Output Specs",
      "Industrial High-Volume Processing Prep",
      "Paper, Vinyl & Fabric Substrate Setup",
      "Exact Spot Color (Pantone) Alignments"
    ]
  },
  {
    id: 20,
    title: "Typing Jobwork",
    desc: "Professional documentation and data services with meticulous accuracy.",
    icon: "⌨️",
    tag: "COMMERCIAL",
    price: "",
    delivery: "",
    features: [
      "Meticulous Data Entry Accuracy Check",
      "Professional Multi-format Documentation",
      "Fast High-Speed Transcriptions",
      "Secure Information Confidentiality"
    ]
  }
];

const defaultVisionSettings = [
  { serviceId: 0, photos: [] },
  { serviceId: 0, photos: [] },
  { serviceId: 0, photos: [] },
  { serviceId: 0, photos: [] },
  { serviceId: 0, photos: [] }
];

const defaultBankingDetails = {
  bankName: "AXIS BANK",
  accountName: "HIRPARA SAVAN PARSOTTAMBHAI",
  accountNumber: "924010037070904",
  ifscCode: "UTIB0004734",
  upiId: "7359093035@ptaxis"
};

const defaultAdminProfile = {
  businessName: "Netra Graphics & Designing",
  address: "Shreeji Complex, Opp. AaramGruh, Mendarda-Sasan Road, Mendarda-362260",
  phone: "73590 93035",
  email: "savanhirapra@netragraphics.com",
  gst: "24AAAAA0000A1Z5",
  instagram: "hiraparasavanphotographer"
};

function ServiceSlideshowContent({ service, onClose }) {
  const photos = service.slideshow || [];
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const currentPhoto = photos && photos[index];
  const isVideo = currentPhoto && (
    currentPhoto.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || 
    currentPhoto.url.includes("video") || 
    currentPhoto.url.startsWith("data:video/")
  );
  const hasCustomDuration = currentPhoto && currentPhoto.duration !== undefined && currentPhoto.duration > 0;

  const delay = hasCustomDuration 
    ? currentPhoto.duration * 1000 
    : 5000;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setIndex((prev) => (prev + 1) % photos.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [photos.length]);

  useEffect(() => {
    if (isHovered || !photos || photos.length <= 1 || !currentPhoto) return;
    if (isVideo && !hasCustomDuration) return;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, delay);

    return () => clearTimeout(timer);
  }, [index, isHovered, photos, isVideo, hasCustomDuration, delay]);

  if (!currentPhoto) return null;

  const slideStyle = {
    objectFit: currentPhoto.fit || 'cover',
    objectPosition: `${(currentPhoto.positionX || 0) + 50}% ${(currentPhoto.positionY || 0) + 50}%`,
    transform: `scale(${currentPhoto.scale || 1})`,
    filter: `brightness(${currentPhoto.brightness || 100}%) contrast(${currentPhoto.contrast || 100}%) saturate(${currentPhoto.saturation || 100}%) grayscale(${currentPhoto.grayscale || 0}%) hue-rotate(${currentPhoto.hueRotate || 0}deg)`,
    transition: 'transform 0.4s ease, filter 0.4s ease',
    width: '100%',
    height: '100%'
  };

  return (
    <div 
      className="service-slideshow-container"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Autoplay progress bar */}
      {photos.length > 1 && !isHovered && (
        <div className="service-slideshow-progress-bar">
          {isVideo && !hasCustomDuration ? (
            <div 
              className="service-slideshow-progress-fill transition-all duration-100 ease-out"
              style={{ width: `${(videoCurrentTime / (videoDuration || 1)) * 100}%` }}
            />
          ) : (
            <motion.div 
              key={index}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: delay / 1000, ease: "linear" }}
              className="service-slideshow-progress-fill"
            />
          )}
        </div>
      )}

      {/* Close Button */}
      <button className="service-slideshow-close" onClick={onClose} title="Close Slideshow">
        <X className="w-5 h-5" />
      </button>

      {/* Mute/Unmute Toggle Button */}
      {isVideo && (
        <button 
          className="service-slideshow-mute" 
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Media Viewport */}
      <div className="service-slideshow-viewport">
        <AnimatePresence mode="wait">
          {isVideo ? (
            <motion.video
              key={index}
              src={currentPhoto.url}
              autoPlay
              loop={photos.length === 1 || hasCustomDuration}
              muted={isMuted}
              playsInline
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                if (video.duration) {
                  setVideoCurrentTime(video.currentTime);
                  setVideoDuration(video.duration);
                }
              }}
              onEnded={() => {
                if (!hasCustomDuration) {
                  setIndex((prev) => (prev + 1) % photos.length);
                }
              }}
              initial={{ opacity: 0, scale: (currentPhoto.scale || 1) * 1.03 }}
              animate={{ opacity: 1, scale: currentPhoto.scale || 1 }}
              exit={{ opacity: 0, scale: (currentPhoto.scale || 1) * 0.97 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={slideStyle}
            />
          ) : (
            <motion.img
              key={index}
              src={currentPhoto.url}
              alt={currentPhoto.title}
              initial={{ opacity: 0, scale: (currentPhoto.scale || 1) * 1.03 }}
              animate={{ opacity: 1, scale: currentPhoto.scale || 1 }}
              exit={{ opacity: 0, scale: (currentPhoto.scale || 1) * 0.97 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={slideStyle}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation chevrons */}
      {photos.length > 1 && (
        <>
          <button className="service-slideshow-nav-btn prev" onClick={handlePrev}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="service-slideshow-nav-btn next" onClick={handleNext}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Floating Caption & Slideshow Counter */}
      <div className="service-slideshow-caption">
        <div className="service-slideshow-caption-box">
          <span>{service.title} Portfolio</span>
          <h4>{currentPhoto.title || "Showcase Asset"}</h4>
        </div>
        <div className="service-slideshow-counter">
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}

const formatNotificationTime = (rawDate) => {
  if (!rawDate) return 'Just Now';
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return 'Just Now';

  // Format as e.g. "Jun 24, 12:26 AM"
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const groupNotifications = (notifs) => {
  if (!notifs || notifs.length === 0) return [];
  const groups = {};
  
  notifs.forEach(n => {
    const key = `${n.client_id || 'no-client'}-${n.project_id || 'no-project'}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(n);
  });

  const merged = Object.values(groups).map(group => {
    // Sort group members by raw_date desc to find the latest
    group.sort((a, b) => b.raw_date - a.raw_date);
    const latest = group[0];
    
    if (group.length === 1) {
      return {
        ...latest,
        ids: [latest.id],
        count: 1
      };
    }

    // Determine type, title, message based on group composition
    const types = group.map(x => x.type);
    const allCommunication = types.every(t => t === 'communication');
    const allAssets = types.every(t => t === 'new_asset');
    
    let title = latest.title;
    let message = latest.message;
    
    if (allCommunication) {
      title = `${group.length} New Messages`;
      message = latest.message;
    } else if (allAssets) {
      title = `${group.length} New Assets Uploaded`;
      message = latest.message;
    } else {
      title = `Multiple Updates (${group.length})`;
      message = `Latest: ${latest.title} - ${latest.message}`;
    }

    return {
      ...latest,
      ids: group.map(x => x.id),
      count: group.length,
      title,
      message
    };
  });

  // Sort the final merged list by the raw_date of their latest notification (descending)
  return merged.sort((a, b) => b.raw_date - a.raw_date);
};

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [invoiceDefaultTab, setInvoiceDefaultTab] = useState(null);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [trashItems, setTrashItems] = useState(() => {
    const saved = localStorage.getItem('netra_trash');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          return parsed.filter(item => {
            if (!item || !item.deletedAt) return false;
            const expiry = new Date(item.deletedAt).getTime() + 24 * 60 * 60 * 1000;
            return expiry > now;
          });
        }
      } catch (e) {
        console.error("Failed to parse saved trash items:", e);
      }
    }
    return [];
  });
  const [cashbookEntries, setCashbookEntries] = useState(() => {
    const saved = localStorage.getItem('netra_cashbook');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse cashbook entries from localStorage:", e);
      }
    }
    return [];
  });
  const [servicesList, setServicesList] = useState(() => {
    const saved = localStorage.getItem('netra_services');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse saved services:", e);
      }
    }
    return defaultServices;
  });
  const services = servicesList;
  const { toast } = useToast();

  const [visionSettings, setVisionSettings] = useState(() => {
    const saved = localStorage.getItem('netra_vision_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            ...item,
            photos: (item.photos || []).filter(p => p.url && !p.url.includes("unsplash.com"))
          }));
        }
      } catch (e) {
        console.error("Failed to parse saved vision settings:", e);
      }
    }
    return defaultVisionSettings;
  });

  const [bankingDetails, setBankingDetails] = useState(() => {
    const saved = localStorage.getItem('netra_banking_details');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {
        console.error("Failed to parse saved banking details:", e);
      }
    }
    return defaultBankingDetails;
  });

  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('netra_admin_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {
        console.error("Failed to parse saved admin profile:", e);
      }
    }
    return defaultAdminProfile;
  });

  const handleSaveBankingDetails = async (newBanking) => {
    setBankingDetails(newBanking);
    toast({
      title: "Payment Details Calibrated",
      description: "Successfully updated payment instructions and digital UPI QR settings."
    });
  };

  const handleSaveAdminProfile = async (newProfile) => {
    setAdminProfile(newProfile);
    toast({
      title: "Admin Profile Updated",
      description: "Successfully updated admin basic details globally."
    });
  };

  const handleSaveVisionSettings = async (newSettings) => {
    setVisionSettings(newSettings);
    toast({
      title: "Vision Settings Saved",
      description: "Successfully updated the VISION page categories and slideshow assets."
    });
  };

  const handleAddService = async (newService) => {
    const nextList = [...servicesList, newService];
    setServicesList(nextList);
    toast({
      title: "Service Card Added",
      description: `Successfully created "${newService.title}" dynamically.`
    });
  };

  const handleDeleteService = async (serviceId) => {
    const nextList = servicesList.filter(s => s.id !== serviceId);
    setServicesList(nextList);
    const nextVision = visionSettings.map(v => v.serviceId === serviceId ? { ...v, serviceId: 0, photos: [] } : v);
    setVisionSettings(nextVision);
    toast({
      title: "Service Card Deleted",
      description: "Successfully removed card and cleaned up slot bindings."
    });
  };

  const handleUpdateService = async (updatedService) => {
    const nextList = servicesList.map(s => s.id === updatedService.id ? updatedService : s);
    setServicesList(nextList);
    toast({
      title: "Service Slideshow Updated",
      description: `Successfully synchronized work slideshow for "${updatedService.title}".`
    });
  };

  const handleClearAllDemoData = async () => {
    const pw = prompt("🔴 SECURITY ACCESS REQUIRED 🔴\n\nPlease enter the system password to clear all demo data:");
    if (pw !== "73590@Savan") {
      alert("Incorrect password. Operation aborted.");
      return;
    }

    try {
      // 1. Purge Supabase Invoices
      const { error: invoiceErr } = await supabase
        .from('invoices')
        .delete()
        .not('id', 'is', null);

      // 2. Purge Supabase Projects
      const { error: projectErr } = await supabase
        .from('projects')
        .delete()
        .not('id', 'is', null);

      // 3. Purge Supabase Inquiries
      const { error: inquiriesErr } = await supabase
        .from('inquiries')
        .delete()
        .not('id', 'is', null);

      // 4. Purge Supabase Clients (excluding settings@netra.graphics)
      const { error: clientsErr } = await supabase
        .from('clients')
        .delete()
        .neq('email', 'settings@netra.graphics');

      if (invoiceErr || projectErr || inquiriesErr || clientsErr) {
        console.error("Purge error details:", { invoiceErr, projectErr, inquiriesErr, clientsErr });
        throw new Error("One or more database tables failed to purge.");
      }

      // Reset to original default state for services
      setServicesList(defaultServices);
      localStorage.setItem('netra_services', JSON.stringify(defaultServices));

      // Reset vision settings to defaults
      setVisionSettings(defaultVisionSettings);
      localStorage.setItem('netra_vision_settings', JSON.stringify(defaultVisionSettings));

      // Reset banking details to defaults
      setBankingDetails(defaultBankingDetails);
      localStorage.setItem('netra_banking_details', JSON.stringify(defaultBankingDetails));

      // Reset admin profile to defaults
      setAdminProfile(defaultAdminProfile);
      localStorage.setItem('netra_admin_profile', JSON.stringify(defaultAdminProfile));

      // Clean local states
      setInvoices([]);
      setIgnitionQueue([]);
      setInquiries([]);
      setClients(prev => prev.filter(c => c.email === 'settings@netra.graphics'));
      setCashbookEntries([]);
      localStorage.setItem('netra_cashbook', JSON.stringify([]));

      // Clear local storages
      localStorage.removeItem('netra_clients');
      localStorage.removeItem('netra_inquiries');
      localStorage.removeItem('netra_projects');
      localStorage.removeItem('netra_invoices');
      localStorage.removeItem('netra_banking_details');
      localStorage.removeItem('netra_admin_profile');

      // Update global Supabase settings row back to defaults
      try {
        const payload = {
          address: JSON.stringify({ services: defaultServices, vision: defaultVisionSettings, banking: defaultBankingDetails, profile: defaultAdminProfile, cashbook: [] })
        };
        await supabase
          .from('clients')
          .update(payload)
          .eq('email', 'settings@netra.graphics');
      } catch (dbErr) {
        console.error("Failed to reset database settings row:", dbErr);
      }

      toast({
        title: "Database Purged Successfully",
        description: "All projects, inquiries, custom invoices, clients, and cashbook records have been cleared from Supabase."
      });
    } catch (err) {
      console.error("Failed to purge demo data:", err);
      toast({
        title: "Purge Failed",
        description: "Database transaction error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const [calibratingService, setCalibratingService] = useState(null);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);

  const handleOpenCalibrate = (s) => {
    setCalibratingService({ ...s, features: s.features ? [...s.features] : [] });
    setIsCalibrationModalOpen(true);
  };

  const handleIgniteCalibration = async () => {
    if (!calibratingService) return;

    // Save update to state
    const nextList = servicesList.map(s => s.id === calibratingService.id ? calibratingService : s);
    setServicesList(nextList);

    toast({
      title: "Service Calibrated Successfully",
      description: `Updated config for: ${calibratingService.title}`
    });

    setIsCalibrationModalOpen(false);
    setCalibratingService(null);
  };

  const [editingService, setEditingService] = useState(null);
  const [settingsSearch, setSettingsSearch] = useState("");
  const [settingsCategory, setSettingsCategory] = useState("ALL");
  const [calibrationSuccess, setCalibrationSuccess] = useState(false);
  const [calibratingForm, setCalibratingForm] = useState(null);

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clickSoundEnabled, setClickSoundEnabled] = useState(false);

  // Refs to make current values accessible inside static useEffect closures
  const isPlayingRef = useRef(false);
  const clickSoundEnabledRef = useRef(false);
  const isSyncingFromDbRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { clickSoundEnabledRef.current = clickSoundEnabled; }, [clickSoundEnabled]);

  useEffect(() => {
    // Initialize standard Audio stream pointing to our high-fidelity, local loop MP3
    const audio = new Audio('/ambient-loop.mp3');
    audio.loop = true;
    audio.volume = 0.2; // Warm, peaceful background volume level
    audioRef.current = audio;

    // Autoplay has been paused/disabled as requested by the user until further notice
    /*
    const startPlay = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("Autoplay blocked by browser policy, waiting for first interaction:", err);
          // Keep state active in UI, interaction handler will trigger the actual audio play
          setIsPlaying(true);
        });
    };

    startPlay();

    // Setup user interaction event listeners to force play if initially blocked
    const handleFirstInteraction = () => {
      if (audio.paused) {
        audio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => console.log("Failed to play on interaction:", err));
      }
      // Remove listeners once the user interacts
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    */

    // Setup global UI click sound effect handler
    const handleGlobalClick = (e) => {
      // Only play click sounds when ambient music is on AND click sound is enabled by user
      if (!clickSoundEnabledRef.current || !isPlayingRef.current) return;
      // Check if target or its parent is an interactive menu item or button
      const target = e.target.closest('button, a, .menu-link, .admin-menu-link, .sound-toggle-btn, .notification-bell-wrapper, .vision-back-btn, [role="button"]');
      if (target) {
        try {
          const clickAudio = new Audio('/click.mp3');
          clickAudio.volume = 0.25; // Subtly satisfying digital click volume
          clickAudio.play().catch((err) => console.log("Click play blocked:", err));
        } catch (err) {
          console.log("Click sound error:", err);
        }
      }
    };

    /*
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('scroll', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    */
    window.addEventListener('click', handleGlobalClick);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      /*
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      */
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('email', 'settings@netra.graphics')
          .maybeSingle();

        if (error) throw error;

        if (data) {
          try {
            const parsed = JSON.parse(data.address);
            if (parsed.services && parsed.services.length > 0) {
              setServicesList(parsed.services);
              safeSetLocalStorage('netra_services', JSON.stringify(parsed.services));
            }
            if (parsed.vision && parsed.vision.length > 0) {
              const cleanedVision = parsed.vision.map(item => ({
                ...item,
                photos: (item.photos || []).filter(p => p.url && !p.url.includes("unsplash.com"))
              }));
              setVisionSettings(cleanedVision);
              safeSetLocalStorage('netra_vision_settings', JSON.stringify(cleanedVision));
            }
            if (parsed.banking) {
              setBankingDetails(parsed.banking);
              safeSetLocalStorage('netra_banking_details', JSON.stringify(parsed.banking));
            }
            if (parsed.profile) {
              setAdminProfile(parsed.profile);
              safeSetLocalStorage('netra_admin_profile', JSON.stringify(parsed.profile));
            }
            if (parsed.cashbook) {
              setCashbookEntries(parsed.cashbook);
              safeSetLocalStorage('netra_cashbook', JSON.stringify(parsed.cashbook));
            }
            if (parsed.trash && Array.isArray(parsed.trash)) {
              const now = Date.now();
              const validTrash = parsed.trash.filter(item => {
                if (!item || !item.deletedAt) return false;
                const expiry = new Date(item.deletedAt).getTime() + 24 * 60 * 60 * 1000;
                return expiry > now;
              });
              setTrashItems(validTrash);
              safeSetLocalStorage('netra_trash', JSON.stringify(validTrash));
            }
          } catch (parseErr) {
            console.error("Failed to parse global settings from database:", parseErr);
          }
        } else {
          const defaultPayload = {
            name: 'System Settings',
            email: 'settings@netra.graphics',
            phone: 'SYSTEM',
            address: JSON.stringify({ services: servicesList, vision: visionSettings, banking: bankingDetails, profile: adminProfile, cashbook: cashbookEntries, trash: [] }),
            status: 'Active',
            access_key: 'SYSTEM'
          };
          await supabase.from('clients').insert([defaultPayload]);
        }
      } catch (err) {
        console.warn("Failed to sync global settings from Supabase, running on local cache:", err);
      } finally {
        setIsSettingsLoaded(true);
      }
    };
    fetchGlobalSettings();
  }, []);

  // Automatic sync of global settings and cashbook entries to Supabase database & local storage
  useEffect(() => {
    if (!isSettingsLoaded) return;

    localStorage.setItem('netra_services', JSON.stringify(servicesList));
    localStorage.setItem('netra_vision_settings', JSON.stringify(visionSettings));
    localStorage.setItem('netra_banking_details', JSON.stringify(bankingDetails));
    localStorage.setItem('netra_admin_profile', JSON.stringify(adminProfile));
    localStorage.setItem('netra_cashbook', JSON.stringify(cashbookEntries));
    localStorage.setItem('netra_trash', JSON.stringify(trashItems));

    if (isSyncingFromDbRef.current) return;

    const syncToDb = async () => {
      try {
        const payload = {
          address: JSON.stringify({
            services: servicesList,
            vision: visionSettings,
            banking: bankingDetails,
            profile: adminProfile,
            cashbook: cashbookEntries,
            trash: trashItems
          })
        };
        const { error } = await supabase
          .from('clients')
          .update(payload)
          .eq('email', 'settings@netra.graphics');
        
        if (error) throw error;
      } catch (err) {
        console.warn("Failed to sync settings to Supabase:", err);
      }
    };

    const timer = setTimeout(syncToDb, 1000); // 1-second debounce to avoid database spam
    return () => clearTimeout(timer);
  }, [servicesList, visionSettings, bankingDetails, adminProfile, cashbookEntries, trashItems, isSettingsLoaded]);

  const toggleSound = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Premium volume fade-out over 300ms
      let vol = audioRef.current.volume;
      const fadeOut = setInterval(() => {
        if (vol > 0.02) {
          vol -= 0.02;
          audioRef.current.volume = Math.max(0, vol);
        } else {
          clearInterval(fadeOut);
          audioRef.current.pause();
          setIsPlaying(false);
          // When music stops, also disable click sounds
          setClickSoundEnabled(false);
        }
      }, 30);
    } else {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        // Premium volume fade-in over 300ms
        let vol = 0;
        const fadeIn = setInterval(() => {
          if (vol < 0.2) {
            vol += 0.02;
            audioRef.current.volume = Math.min(0.2, vol);
          } else {
            clearInterval(fadeIn);
          }
        }, 30);
      }).catch(err => {
        console.log("Audio play blocked by browser policy:", err);
      });
    }
  };

  const toggleClickSound = () => {
    // Click sounds can only be toggled when music is on
    if (!isPlaying) return;
    setClickSoundEnabled(prev => !prev);
  };

  const [logoDrawn, setLogoDrawn] = useState(false);
  const [revealStarted, setRevealStarted] = useState(false);
  const [headlineActive, setHeadlineActive] = useState(false);
  const [taglineActive, setTaglineActive] = useState(false);
  const [missionActive, setMissionActive] = useState(false);
  const [isFullyRevealed, setIsFullyRevealed] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [isVaultActive, setIsVaultActive] = useState(false);
  const [isContactActive, setIsContactActive] = useState(false);
  const [showConstruction, setShowConstruction] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [activeServiceSlideshow, setActiveServiceSlideshow] = useState(null);
  const [isServicesActive, setIsServicesActive] = useState(false);
  const isNavVertical = isVaultActive && !isContactActive && !isServicesActive;
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successTimerId, setSuccessTimerId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");

  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoginActive, setIsLoginActive] = useState(false);
  const [isAdminSelected, setIsAdminSelected] = useState(false);
  const [loginError, setLoginError] = useState("");
  const loginContainerRef = useRef(null);

  const loginParticles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      targetX: (Math.random() - 0.5) * 50,
      duration: Math.random() * 5 + 5,
      delay: Math.random() * 2
    }));
  }, []);

  const [isCommandCenterActive, setIsCommandCenterActive] = useState(() => {
    return localStorage.getItem('netra_admin_active') === 'true';
  });
  const [isClientVaultActive, setIsClientVaultActive] = useState(() => {
    return localStorage.getItem('netra_client_active') === 'true';
  });
  const [activeClientTab, setActiveClientTab] = useState('DASHBOARD');
  const [selectedClientProjectId, setSelectedClientProjectId] = useState(() => {
    const id = localStorage.getItem('netra_selected_client_project_id');
    return id ? parseInt(id) : null;
  });
  const [selectedClientInvoiceId, setSelectedClientInvoiceId] = useState(() => {
    const id = localStorage.getItem('netra_selected_client_invoice_id');
    return id ? parseInt(id) : null;
  });
  const [currentClient, setCurrentClient] = useState(() => {
    const saved = localStorage.getItem('netra_client_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved client session:", e);
      }
    }
    return null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("netra_client_theme") || "light";
  });

  useEffect(() => {
    localStorage.setItem("netra_client_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  const [isIgnitionModalOpen, setIsIgnitionModalOpen] = useState(false);
  const [isNotificationsMinimized, setIsNotificationsMinimized] = useState(false);
  const [ignitionQty, setIgnitionQty] = useState("");
  const [ignitionRate, setIgnitionRate] = useState("");
  const [ignitionQuote, setIgnitionQuote] = useState("");
  const [ignitionLastCalculatedBy, setIgnitionLastCalculatedBy] = useState("rate");

  useEffect(() => {
    const qtyVal = Number(ignitionQty) || 1;
    const rateVal = parseFloat(ignitionRate);
    if (!isNaN(rateVal) && ignitionLastCalculatedBy !== "quote") {
      setIgnitionQuote((qtyVal * rateVal).toFixed(2));
    }
  }, [ignitionQty, ignitionRate, ignitionLastCalculatedBy]);

  useEffect(() => {
    const qtyVal = Number(ignitionQty) || 1;
    const quoteVal = parseFloat(ignitionQuote);
    if (!isNaN(quoteVal) && ignitionLastCalculatedBy === "quote") {
      setIgnitionRate((quoteVal / qtyVal).toFixed(2));
    }
  }, [ignitionQty, ignitionQuote, ignitionLastCalculatedBy]);

  useEffect(() => {
    if (isIgnitionModalOpen) {
      setIgnitionQty(1);
      setIgnitionRate("");
      setIgnitionQuote("");
      setIgnitionLastCalculatedBy("rate");
    }
  }, [isIgnitionModalOpen]);

  // Edit Project Modal – QTY / Rate / Quote state with bidirectional calculation
  const [editQty, setEditQty] = useState(1);
  const [editRate, setEditRate] = useState("");
  const [editQuote, setEditQuote] = useState("");
  const [editLastCalculatedBy, setEditLastCalculatedBy] = useState("rate");

  // Category management states for Cashbook
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState(null);
  const [newCatNameInput, setNewCatNameInput] = useState("");
  const [editCatTab, setEditCatTab] = useState("INCOME");

  const handleRenameCategory = (oldName, newName, type) => {
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
    if (editCategoryVal === oldName) {
      setEditCategoryVal(newName.trim());
    }
    toast({
      title: "Category Renamed",
      description: `Successfully renamed "${oldName}" to "${newName.trim()}" in all matching entries.`
    });
    setEditingCategoryName(null);
  };

  const handleDeleteCategory = (catName, type) => {
    if (window.confirm(`Are you sure you want to delete the category "${catName}"? All matching cashbook entries will be reassigned to "Other".`)) {
      setCashbookEntries(prev => prev.map(entry => {
        if (entry.type === type && entry.category === catName) {
          return { ...entry, category: "Other" };
        }
        return entry;
      }));
      if (editCategoryVal === catName) {
        setEditCategoryVal("Other");
      }
      toast({
        title: "Category Deleted",
        description: `Successfully removed category "${catName}" and reassigned affected entries to "Other".`
      });
    }
  };

  // Qty or Rate changes → recalculate Quote (unless user is typing in Quote field)
  useEffect(() => {
    const qtyVal = Number(editQty) || 1;
    const rateVal = parseFloat(editRate);
    if (!isNaN(rateVal) && editLastCalculatedBy !== "quote") {
      setEditQuote((qtyVal * rateVal).toFixed(2));
    }
  }, [editQty, editRate, editLastCalculatedBy]);

  // Quote changes → recalculate Rate (when user types in Quote field)
  useEffect(() => {
    const qtyVal = Number(editQty) || 1;
    const quoteVal = parseFloat(editQuote);
    if (!isNaN(quoteVal) && editLastCalculatedBy === "quote") {
      setEditRate((quoteVal / qtyVal).toFixed(2));
    }
  }, [editQty, editQuote, editLastCalculatedBy]);

  // Populate edit state from the selected project whenever the edit modal opens
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);
  useEffect(() => {
    if (isProjectEditModalOpen) {
      const currentProj = ignitionQueue.find(p => p.id === selectedProjectTab);
      if (currentProj) {
        const loadedQty = currentProj.qty || 1;
        const loadedQuote = currentProj.quote || 0;
        const loadedRate = currentProj.rate || (loadedQty > 0 ? (loadedQuote / loadedQty) : 0);
        setEditQty(loadedQty);
        setEditRate(loadedRate.toFixed(2));
        setEditQuote(loadedQuote.toString());
        setEditLastCalculatedBy("rate");
      }
    }
  }, [isProjectEditModalOpen]);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifTab, setNotifTab] = useState("SPARKS");
  const [selectedKanbanProject, setSelectedKanbanProject] = useState(null);
  const [ignitionQueue, setIgnitionQueue] = useState([]);
  const [selectedProjectTab, setSelectedProjectTab] = useState(null);
  const [projectFilter, setProjectFilter] = useState("Ongoing");
  const [expandedClientRev, setExpandedClientRev] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('netra_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse saved clients:", e);
      }
    }
    return [];
  });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientViewMode, setClientViewMode] = useState("LIST"); // LIST, VIEW
  const [clientModalPasscode, setClientModalPasscode] = useState("");

  const [accessKey, setAccessKey] = useState("");
  const [remarkModal, setRemarkModal] = useState({ open: false, inquiryId: null, type: null });
  const [remarkText, setRemarkText] = useState("");
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [prefillData, setPrefillData] = useState(null);
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [activeAdminModule, setActiveAdminModule] = useState("DASHBOARD");
  const [remindedFlames, setRemindedFlames] = useState(() => {
    return JSON.parse(localStorage.getItem('netra_reminded_flames') || '{}');
  });
  const [showInquiryBadge, setShowInquiryBadge] = useState(false);
  const [isAdminGridActive, setIsAdminGridActive] = useState(() => {
    return localStorage.getItem('netra_admin_grid_active') === 'true';
  });
  const [saveLoginInfo, setSaveLoginInfo] = useState(() => {
    return localStorage.getItem('netra_save_login_info') === 'true';
  });
  const [unreadSparksCount, setUnreadSparksCount] = useState(0);
  const [showSparkToast, setShowSparkToast] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);
  const [hasNewConversation, setHasNewConversation] = useState(() => {
    return localStorage.getItem('netra_new_conversation') === 'true';
  });
  const [ignitionClientType, setIgnitionClientType] = useState("NEW"); // NEW, EXISTING
  // isProjectEditModalOpen is declared above with edit qty/rate state
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [projectsSearchQuery, setProjectsSearchQuery] = useState("");
  const [inquiriesSearchQuery, setInquiriesSearchQuery] = useState("");
  const [clientsSearchQuery, setClientsSearchQuery] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteStrategy, setDeleteStrategy] = useState('purge'); // 'purge' or 'keep'
  const [editingInvoiceData, setEditingInvoiceData] = useState(null);
  const [readClientNotifs, setReadClientNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('netra_read_client_notifs')) || [];
    } catch {
      return [];
    }
  });

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeClientPopups, setActiveClientPopups] = useState([]);
  const [activePopupIndex, setActivePopupIndex] = useState(0);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const [globalAssets, setGlobalAssets] = useState([]);

  const refreshGlobalAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('client_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setGlobalAssets(data);
      }
    } catch (err) {
      console.warn("Real-time global assets refresh failed:", err);
    }
  };
  const popupContainerRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const isScrollCooldownRef = useRef(false);
  const isRefreshingProjectsRef = useRef(false);
  const hasPendingProjectsRefreshRef = useRef(false);
  const [autoOpenBridgeClientId, setAutoOpenBridgeClientId] = useState(null);
  const [autoOpenBridgeProjectId, setAutoOpenBridgeProjectId] = useState(null);
  const [autoOpenReviewClientId, setAutoOpenReviewClientId] = useState(null);
  const [autoOpenVaultClientId, setAutoOpenVaultClientId] = useState(null);

  const clientPortalNotifs = useMemo(() => {
    const notifs = [];
    ignitionQueue.forEach(proj => {
      if (proj.collaborationStream && Array.isArray(proj.collaborationStream)) {
        proj.collaborationStream.forEach(chat => {
          if ((chat.sender || '').toLowerCase() !== 'admin') {
            notifs.push({
              id: `chat-${chat.id}`,
              project_id: proj.id,
              client_id: proj.client_id || proj.client?.id,
              type: 'communication',
              title: `New Message from ${chat.sender || 'Client'}`,
              message: `Project: ${proj.service} - "${chat.text}"`,
              created_at: chat.time,
              is_read: readClientNotifs.includes(`chat-${chat.id}`),
              raw_date: chat.raw_date || 0
            });
          }
        });
      }
      if (proj.mediaVault && Array.isArray(proj.mediaVault)) {
        proj.mediaVault.forEach(media => {
          if ((media.uploaded_by || '').toLowerCase() !== 'admin') {
            notifs.push({
              id: `media-${media.id}`,
              project_id: proj.id,
              client_id: proj.client_id || proj.client?.id,
              type: 'new_asset',
              title: `New Asset Uploaded`,
              message: `Project: ${proj.service} - File: ${media.name}`,
              created_at: media.time,
              is_read: readClientNotifs.includes(`media-${media.id}`),
              raw_date: media.raw_date || 0
            });
          }
        });
      }
    });

    if (globalAssets && Array.isArray(globalAssets)) {
      globalAssets.forEach(asset => {
        if (asset.uploaded_by === 'CLIENT') {
          const clientObj = clients.find(c => Number(c.id) === Number(asset.client_id));
          const clientName = clientObj?.name || 'Client';
          notifs.push({
            id: `global-asset-${asset.id}`,
            project_id: null,
            client_id: asset.client_id,
            type: 'new_global_asset',
            title: `New Asset from ${clientName}`,
            message: `Global Vault - File: ${asset.name}`,
            created_at: asset.created_at,
            is_read: readClientNotifs.includes(`global-asset-${asset.id}`),
            raw_date: new Date(asset.created_at || Date.now()).getTime()
          });
        }

        if (asset.comments && Array.isArray(asset.comments)) {
          asset.comments.forEach((comment, idx) => {
            if (comment.author === 'CLIENT') {
              const clientObj = clients.find(c => Number(c.id) === Number(asset.client_id));
              const clientName = clientObj?.name || 'Client';
              notifs.push({
                id: `global-asset-comment-${asset.id}-${idx}`,
                project_id: null,
                client_id: asset.client_id,
                type: 'global_asset_comment',
                title: `New Comment from ${clientName}`,
                message: `Global Vault - "${comment.text}"`,
                created_at: comment.created_at,
                is_read: readClientNotifs.includes(`global-asset-comment-${asset.id}-${idx}`),
                raw_date: new Date(comment.created_at || Date.now()).getTime()
              });
            }
          });
        }
      });
    }

    if (clients && Array.isArray(clients)) {
      clients.forEach(client => {
        if (client.pending_profile_update) {
          notifs.push({
            id: `profile-${client.id}`,
            project_id: null,
            client_id: client.id,
            type: 'Profile Update',
            title: `Profile Update Request`,
            message: `Client ${client.name} requested a profile update.`,
            created_at: new Date().toISOString(),
            is_read: readClientNotifs.includes(`profile-${client.id}`),
            raw_date: Date.now()
          });
        }
      });
    }

    return notifs.sort((a, b) => b.raw_date - a.raw_date);
  }, [ignitionQueue, clients, readClientNotifs, globalAssets]);

  const markClientNotifAsRead = (ids) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    setReadClientNotifs(prev => {
      const next = [...prev, ...idArray.filter(id => !prev.includes(id))];
      localStorage.setItem('netra_read_client_notifs', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('netra_admin_active', isCommandCenterActive);
  }, [isCommandCenterActive]);

  useEffect(() => {
    localStorage.setItem('netra_client_active', isClientVaultActive);
  }, [isClientVaultActive]);

  useEffect(() => {
    localStorage.setItem('netra_active_client_tab', activeClientTab);
  }, [activeClientTab]);

  useEffect(() => {
    if (selectedClientProjectId) {
      localStorage.setItem('netra_selected_client_project_id', selectedClientProjectId.toString());
    } else {
      localStorage.removeItem('netra_selected_client_project_id');
    }
  }, [selectedClientProjectId]);

  useEffect(() => {
    if (selectedClientInvoiceId) {
      localStorage.setItem('netra_selected_client_invoice_id', selectedClientInvoiceId.toString());
    } else {
      localStorage.removeItem('netra_selected_client_invoice_id');
    }
  }, [selectedClientInvoiceId]);

  useEffect(() => {
    if (currentClient) {
      localStorage.setItem('netra_client_session', JSON.stringify(currentClient));
    } else {
      localStorage.removeItem('netra_client_session');
    }
  }, [currentClient]);

  useEffect(() => {
    if (currentClient && clients.length > 0) {
      const match = clients.find(c => c.id === currentClient.id);
      if (match) {
        if (match.status === 'Suspended') {
          localStorage.removeItem('netra_client_session');
          localStorage.removeItem('netra_saved_client_key');
          localStorage.removeItem('netra_saved_client_pass');
          setCurrentClient(null);
          setIsClientVaultActive(false);
          setLoginError("ACCESS DENIED: This account has been suspended by the administrator.");
        } else {
          const hasChanges = 
            match.name !== currentClient.name ||
            match.email !== currentClient.email ||
            match.phone !== currentClient.phone ||
            match.address !== currentClient.address ||
            match.status !== currentClient.status ||
            JSON.stringify(match.pending_profile_update) !== JSON.stringify(currentClient.pending_profile_update);
            
          if (hasChanges) {
            setCurrentClient(match);
          }
        }
      }
    }
  }, [clients, currentClient]);

  const notifiedDeadlinesRef = useRef([]);

  // Project Approaching Deadlines Checker
  useEffect(() => {
    if (ignitionQueue.length === 0 || !isCommandCenterActive) return;
    if (!(adminProfile?.emailNotifications?.deadlines ?? true)) return;

    const checkDeadlines = () => {
      const now = new Date();
      ignitionQueue.forEach(project => {
        if (['completed', 'cancelled'].includes((project.status || '').toLowerCase())) return;
        if (notifiedDeadlinesRef.current.includes(project.id)) return;

        if (project.deadline) {
          const deadlineDate = new Date(project.deadline);
          const timeDiff = deadlineDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          const alertThreshold = project.alertMeDays !== undefined && project.alertMeDays !== "" ? Number(project.alertMeDays) : 3;

          if (daysDiff >= 0 && daysDiff <= alertThreshold) {
            notifiedDeadlinesRef.current.push(project.id);
            toast({
              title: "✉️ Email Notification Dispatched",
              description: `To: ${adminProfile?.email || 'contact@netragraphics.com'}\nSubject: Approaching Deadline: ${project.service}\nDeadline: ${project.deadline} (${daysDiff} days left)`,
              className: "bg-indigo-950 border-indigo-500/50 text-indigo-200"
            });
          }
        }
      });
    };

    checkDeadlines();
  }, [ignitionQueue, adminProfile, isCommandCenterActive]);

  useEffect(() => {
    localStorage.setItem('netra_active_admin_module', activeAdminModule);
  }, [activeAdminModule]);

  useEffect(() => {
    localStorage.setItem('netra_admin_grid_active', isAdminGridActive);
  }, [isAdminGridActive]);

  useEffect(() => {
    localStorage.setItem('netra_save_login_info', saveLoginInfo);
  }, [saveLoginInfo]);

  const refreshProjects = async () => {
    if (isRefreshingProjectsRef.current) {
      hasPendingProjectsRefreshRef.current = true;
      return;
    }

    isRefreshingProjectsRef.current = true;
    try {
      const dbProjects = await getProjects();
      if (dbProjects) {
        setIgnitionQueue(dbProjects);
      }
    } catch (err) {
      console.warn("Real-time projects refresh failed:", err);
    } finally {
      isRefreshingProjectsRef.current = false;
      if (hasPendingProjectsRefreshRef.current) {
        hasPendingProjectsRefreshRef.current = false;
        await refreshProjects();
      }
    }
  };

  const refreshInvoices = async () => {
    try {
      const dbInvoices = await getInvoices();
      if (dbInvoices) {
        const mappedInvoices = dbInvoices.map(inv => {
          if (inv.clientName && inv.clientName.startsWith("JSON_MOCK:")) {
            try {
              const parsed = JSON.parse(inv.clientName.substring(10));
              return {
                ...inv,
                clientName: parsed.name,
                projectService: parsed.service,
                rawProject: {
                  id: inv.id,
                  name: parsed.name,
                  service: parsed.service,
                  quote: parsed.quote || (parsed.rate * parsed.qty),
                  discount: parsed.discount || 0,
                  advanceAmount: parsed.advanceAmount || 0,
                  phone: parsed.phone,
                  email: parsed.email,
                  address: parsed.address,
                  gst: parsed.gst,
                  status: 'Completed',
                  isStandalone: true,
                  items: (parsed.items && parsed.items.length > 0) ? parsed.items : [{
                    service: parsed.service,
                    quote: parsed.rate * parsed.qty,
                    discount: parsed.discount,
                    qty: parsed.qty,
                    rate: parsed.rate
                  }]
                }
              };
            } catch (parseErr) {
              console.error("Failed to parse JSON_MOCK custom invoice:", parseErr);
            }
          }
          return inv;
        });
        setInvoices(mappedInvoices);
      }
    } catch (err) {
      console.warn("Real-time invoices refresh failed:", err);
    }
  };

  const refreshClients = async () => {
    try {
      const dbClients = await getClients();
      if (dbClients) {
        const mapped = dbClients.map(c => ({
          ...c,
          joinedDate: c.joined_date || c.joinedDate,
          accessKey: c.access_key || c.accessKey
        }));
        setClients(mapped);
        localStorage.setItem('netra_clients', JSON.stringify(mapped));
      }
    } catch (err) {
      console.warn("Real-time clients refresh failed:", err);
    }
  };

  const refreshMicroJobs = async () => {
    try {
      const dbMicroJobs = await getMicroJobs();
      if (dbMicroJobs) {
        setMicroJobs(dbMicroJobs);
      }
    } catch (err) {
      console.warn("Real-time micro jobs refresh failed:", err);
    }
  };

  useEffect(() => {
    // Clear any previous mock database states from local storage to ensure a clean launch
    localStorage.removeItem("netra_db_state");

    const loadSupabaseData = async () => {
      try {
        await refreshClients();
        
        const dbInquiries = await getInquiries();
        if (dbInquiries) {
          setInquiries(dbInquiries);
        }

        await refreshProjects();
        await refreshInvoices();
        await refreshMicroJobs();
        await refreshGlobalAssets();
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Failed to load data from Supabase:", error);
        setIsDataLoaded(true);
      }
    };
    loadSupabaseData();
  }, []);

  useEffect(() => {
    // 1. Subscribe to projects table changes
    const projectsChannel = supabase
      .channel('projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async () => {
        // Refresh both projects and invoices since invoices contain project copy/references
        await refreshProjects();
        await refreshInvoices();
      })
      .subscribe();

    // 2. Subscribe to invoices table changes
    const invoicesChannel = supabase
      .channel('invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, async () => {
        // Refresh invoices, projects (in case payment status changed), and microjobs
        await refreshInvoices();
        await refreshProjects();
        await refreshMicroJobs();
      })
      .subscribe();

    // 2b. Subscribe to micro_jobs_ledger table changes
    const microJobsChannel = supabase
      .channel('microjobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'micro_jobs_ledger' }, async () => {
        // Refresh microjobs and invoices (to update totals/billed status)
        await refreshMicroJobs();
        await refreshInvoices();
      })
      .subscribe();

    // 3. Subscribe to clients table changes (for settings & clients list)
    const clientsChannel = supabase
      .channel('clients-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, async (payload) => {
        if (payload.new && payload.new.email === 'settings@netra.graphics') {
          try {
            const parsed = JSON.parse(payload.new.address);
            isSyncingFromDbRef.current = true;

            if (parsed.services && JSON.stringify(parsed.services) !== localStorage.getItem('netra_services')) {
              setServicesList(parsed.services);
            }
            if (parsed.vision) {
              const cleanedVision = parsed.vision.map(item => ({
                ...item,
                photos: (item.photos || []).filter(p => p.url && !p.url.includes("unsplash.com"))
              }));
              if (JSON.stringify(cleanedVision) !== localStorage.getItem('netra_vision_settings')) {
                setVisionSettings(cleanedVision);
              }
            }
            if (parsed.banking && JSON.stringify(parsed.banking) !== localStorage.getItem('netra_banking_details')) {
              setBankingDetails(parsed.banking);
            }
            if (parsed.profile && JSON.stringify(parsed.profile) !== localStorage.getItem('netra_admin_profile')) {
              setAdminProfile(parsed.profile);
            }
            if (parsed.cashbook && JSON.stringify(parsed.cashbook) !== localStorage.getItem('netra_cashbook')) {
              setCashbookEntries(parsed.cashbook);
            }
            if (parsed.trash && Array.isArray(parsed.trash) && JSON.stringify(parsed.trash) !== localStorage.getItem('netra_trash')) {
              const now = Date.now();
              const validTrash = parsed.trash.filter(item => {
                if (!item || !item.deletedAt) return false;
                const expiry = new Date(item.deletedAt).getTime() + 24 * 60 * 60 * 1000;
                return expiry > now;
              });
              setTrashItems(validTrash);
            }
          } catch (parseErr) {
            console.error("Failed to parse realtime settings:", parseErr);
          } finally {
            setTimeout(() => {
              isSyncingFromDbRef.current = false;
            }, 100);
          }
        } else {
          // If any client details change, refresh clients, projects, invoices, and microjobs since they all link to client profiles
          await refreshClients();
          await refreshProjects();
          await refreshInvoices();
          await refreshMicroJobs();
        }
      })
      .subscribe();

    // 4. Subscribe to inquiries table changes
    const inquiriesChannel = supabase
      .channel('inquiries-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, async (payload) => {
        try {
          const dbInquiries = await getInquiries();
          if (dbInquiries) {
            setInquiries(dbInquiries);
          }
          const newInq = payload.new;
          if (newInq) {
            toast({
              title: "🔥 New Spark Ignited!",
              description: `${newInq.name} sent an inquiry for ${newInq.service || 'Design'}.`,
              duration: 8000
            });
            triggerBellPulse();

            // Simulate email dispatch
            if (adminProfile?.emailNotifications?.newInquiries ?? true) {
              toast({
                title: "✉️ Email Notification Dispatched",
                description: `To: ${adminProfile?.email || 'contact@netragraphics.com'}\nSubject: New Inquiry: ${newInq.name}\nService: ${newInq.service || 'General'}`,
                className: "bg-indigo-950 border-indigo-500/50 text-indigo-200"
              });
            }
          }
        } catch (err) {
          console.warn("Real-time inquiries refresh failed:", err);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, async (payload) => {
        if (payload.eventType !== 'INSERT') {
          try {
            const dbInquiries = await getInquiries();
            if (dbInquiries) {
              setInquiries(dbInquiries);
            }
          } catch (err) {
            console.warn("Real-time inquiries refresh failed:", err);
          }
        }
      })
      .subscribe();

    // 5. Subscribe to project_chats table changes globally for email notifications
    const chatsGlobalChannel = supabase
      .channel('chats-global-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_chats' }, async (payload) => {
        const newMsg = payload.new;
        if (newMsg && newMsg.sender !== 'admin' && newMsg.sender !== 'SYSTEM' && newMsg.sender?.toLowerCase() !== 'admin') {
          await refreshProjects();
          setHasNewConversation(true);
          localStorage.setItem('netra_new_conversation', 'true');
          if (adminProfile?.emailNotifications?.newMessages ?? true) {
            toast({
              title: "✉️ Email Notification Dispatched",
              description: `To: ${adminProfile?.email || 'contact@netragraphics.com'}\nSubject: New Message from ${newMsg.sender}\nMessage: "${newMsg.message.substring(0, 30)}${newMsg.message.length > 30 ? '...' : ''}"`,
              className: "bg-indigo-950 border-indigo-500/50 text-indigo-200"
            });
          }
        }
      })
      .subscribe();

    // 5b. Subscribe to project_media table changes globally for asset uploads
    const mediaGlobalChannel = supabase
      .channel('media-global-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_media' }, async (payload) => {
        const newMedia = payload.new;
        if (newMedia && newMedia.uploaded_by !== 'admin' && newMedia.uploaded_by?.toLowerCase() !== 'admin') {
          await refreshProjects();
        }
      })
      .subscribe();

    // 5c. Subscribe to client_assets table changes globally for Global Asset Vault uploads and comments
    const clientAssetsChannel = supabase
      .channel('client-assets-global-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_assets' }, async () => {
        await refreshGlobalAssets();
        triggerBellPulse();
      })
      .subscribe();

    return () => {
      if (supabase.removeChannel) {
        supabase.removeChannel(projectsChannel);
        supabase.removeChannel(invoicesChannel);
        supabase.removeChannel(clientsChannel);
        supabase.removeChannel(inquiriesChannel);
        supabase.removeChannel(microJobsChannel);
        supabase.removeChannel(chatsGlobalChannel);
        supabase.removeChannel(mediaGlobalChannel);
        supabase.removeChannel(clientAssetsChannel);
      }
    };
  }, []);

  const triggerBellPulse = () => {
    setBellPulse(true);
    setTimeout(() => setBellPulse(false), 2000);
  };

  const [readFlames, setReadFlames] = useState(() => {
    const saved = localStorage.getItem("netra_read_flames");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse netra_read_flames:", e);
      }
    }
    return [];
  });

  const sparks = inquiries.filter(q => {
    if (q.status !== "New Spark") return false;
    const createdDate = new Date(q.createdAt || q.created_at || q.date || Date.now());
    const diffTime = Date.now() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays < 5;
  });
  const flames = ignitionQueue.filter(q => {
    if (remindedFlames[q.id] && Date.now() < remindedFlames[q.id]) return false;
    if (q.status === "Completed" || q.status === "Cancelled") return false;
    if (!q.deadline) return false;
    const deadline = new Date(q.deadline);
    const now = new Date();
    const diff = deadline - now;
    const alertDays = q.alertMeDays !== undefined && q.alertMeDays !== "" ? Number(q.alertMeDays) : 1;
    const triggerDays = Math.max(1, alertDays);
    const isWithinWarning = diff <= triggerDays * 24 * 60 * 60 * 1000;
    const isAcknowledged = q.acknowledgedDeadline === q.deadline;
    return isWithinWarning && !isAcknowledged && !readFlames.includes(q.id);
  });

  const flamesHistory = ignitionQueue.filter(q => {
    if (q.status === "Completed" || q.status === "Cancelled") return false;
    if (!q.deadline) return false;
    const deadline = new Date(q.deadline);
    const now = new Date();
    const diff = deadline - now;
    const alertDays = q.alertMeDays !== undefined && q.alertMeDays !== "" ? Number(q.alertMeDays) : 1;
    const triggerDays = Math.max(1, alertDays);
    const isWithinWarning = diff <= triggerDays * 24 * 60 * 60 * 1000;
    const isAcknowledged = q.acknowledgedDeadline === q.deadline;
    return isWithinWarning && (isAcknowledged || readFlames.includes(q.id));
  });

  const sparksHistory = inquiries.filter(q => {
    return q.status === "Read" || q.status === "Ignited" || q.status === "Replied" || q.status === "Resolved";
  });

  const unreadClientNotifs = clientPortalNotifs.filter(n => !n.is_read);
  const hasUrgentAlert = flames.length > 0 || sparks.length > 0;

  useEffect(() => {
    const unread = clientPortalNotifs.filter(n => !n.is_read);
    
    // Always sync activeClientPopups with the current unread list
    setActiveClientPopups(prev => {
      const filtered = prev.filter(p => unread.some(u => u.id === p.id));
      const isUnchanged = filtered.length === prev.length && filtered.every((item, idx) => item.id === prev[idx].id);
      return isUnchanged ? prev : filtered;
    });

    if (!isDataLoaded) {
      return;
    }

    // Populate activeClientPopups with all unread notifications
    setActiveClientPopups(prev => {
      let isNewAdded = false;
      const next = [...prev];
      unread.forEach(n => {
        if (!next.some(x => x.id === n.id)) {
          next.push(n);
          isNewAdded = true;
        }
      });
      if (isNewAdded) {
        setIsNotificationsMinimized(false);
      }
      const isUnchanged = next.length === prev.length && next.every((item, idx) => item.id === prev[idx].id);
      return isUnchanged ? prev : next;
    });
  }, [clientPortalNotifs, isDataLoaded]);

  const groupedClientPopups = useMemo(() => {
    return groupNotifications(activeClientPopups);
  }, [activeClientPopups]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (groupedClientPopups.length <= 1) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Detect swipe (threshold of 40px)
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 40) {
        if (diffX < 0) {
          // Swipe left: next card
          setActivePopupIndex((prev) => (prev < groupedClientPopups.length - 1 ? prev + 1 : prev));
        } else {
          // Swipe right: previous card
          setActivePopupIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }
    } else {
      if (Math.abs(diffY) > 40) {
        if (diffY < 0) {
          // Swipe up: next card
          setActivePopupIndex((prev) => (prev < groupedClientPopups.length - 1 ? prev + 1 : prev));
        } else {
          // Swipe down: previous card
          setActivePopupIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }
    }
  };

  // Bounds-check activePopupIndex when groupedClientPopups changes
  useEffect(() => {
    if (groupedClientPopups.length === 0) {
      setActivePopupIndex(0);
    } else if (activePopupIndex >= groupedClientPopups.length) {
      setActivePopupIndex(groupedClientPopups.length - 1);
    }
  }, [groupedClientPopups.length, activePopupIndex]);

  // Non-passive wheel event listener for scroll-lock card cycling
  useEffect(() => {
    const container = popupContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (groupedClientPopups.length <= 1) return;

      // Intercept and lock page scroll when hovering/scrolling inside the deck area
      e.preventDefault();

      // Clear any existing scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // If we are in cooldown, we ignore this scroll tick but reset the timeout
      // to wait for the user to stop scrolling
      if (isScrollCooldownRef.current) {
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollCooldownRef.current = false;
        }, 150); // Reset cooldown 150ms after the last wheel event
        return;
      }

      const threshold = 10; // Ignore tiny scroll noises
      if (Math.abs(e.deltaY) < threshold) return;

      if (e.deltaY > 0) {
        // Scroll down: cycle to next popup
        setActivePopupIndex((prev) => (prev < groupedClientPopups.length - 1 ? prev + 1 : prev));
      } else if (e.deltaY < 0) {
        // Scroll up: cycle to previous popup
        setActivePopupIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      // Enter cooldown
      isScrollCooldownRef.current = true;
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollCooldownRef.current = false;
      }, 150);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      isScrollCooldownRef.current = false;
    };
  }, [
    groupedClientPopups.length,
    isCommandCenterActive,
    isAdminGridActive,
    isNotificationsMinimized,
    hasUrgentAlert,
    isWarningDismissed
  ]);

  const getPopupThemeColor = (type) => {
    switch (type) {
      case 'communication':
      case 'global_asset_comment':
        return '#00E5FF';
      case 'new_asset':
      case 'new_global_asset':
        return '#10b981';
      case 'Profile Update':
        return '#8b5cf6';
      default:
        return '#f59e0b';
    }
  };

  const getPopupIcon = (type) => {
    switch (type) {
      case 'communication':
      case 'global_asset_comment':
        return '💬';
      case 'new_asset':
      case 'new_global_asset':
        return '📁';
      case 'Profile Update':
        return '👤';
      default:
        return '🔔';
    }
  };

  const getPopupBadgeLabel = (type) => {
    switch (type) {
      case 'communication': return 'New Message';
      case 'new_asset': return 'New Asset';
      case 'Profile Update': return 'Profile Update';
      case 'new_global_asset': return 'Global Asset';
      case 'global_asset_comment': return 'Asset Comment';
      default: return 'Client Portal';
    }
  };

  const handleViewNotification = (notif) => {
    const targetIds = notif.ids || [notif.id];
    setActiveClientPopups(prev => prev.filter(x => !targetIds.includes(x.id)));
    markClientNotifAsRead(targetIds);

    if (notif.type === 'Profile Update') {
      setAutoOpenReviewClientId(notif.client_id);
      setActiveAdminModule("CLIENTS");
      setIsAdminGridActive(true);
      pushPageToHistory('admin', { activeAdminModule: 'CLIENTS', isAdminGridActive: true });
    } else if (notif.type === 'communication') {
      const project = ignitionQueue.find(p => String(p.id) === String(notif.project_id));
      const client_id = project?.client_id || project?.client?.id || notif.client_id;
      if (client_id) {
        setAutoOpenBridgeClientId(client_id);
        setAutoOpenBridgeProjectId(notif.project_id);
        setActiveAdminModule("CLIENTS");
        setIsAdminGridActive(true);
        pushPageToHistory('admin', { activeAdminModule: 'CLIENTS', isAdminGridActive: true });
      }
    } else if (notif.type === 'new_asset') {
      const project = ignitionQueue.find(p => String(p.id) === String(notif.project_id));
      const client_id = project?.client_id || project?.client?.id || notif.client_id;
      if (client_id) {
        setAutoOpenVaultClientId(client_id);
        setActiveAdminModule("CLIENTS");
        setIsAdminGridActive(true);
        pushPageToHistory('admin', { activeAdminModule: 'CLIENTS', isAdminGridActive: true });
      }
    } else if (notif.type === 'new_global_asset' || notif.type === 'global_asset_comment') {
      if (notif.client_id) {
        setAutoOpenVaultClientId(notif.client_id);
        setActiveAdminModule("CLIENTS");
        setIsAdminGridActive(true);
        pushPageToHistory('admin', { activeAdminModule: 'CLIENTS', isAdminGridActive: true });
      }
    }
  };

  const handleAckNotification = (ids) => {
    const targetIds = Array.isArray(ids) ? ids : [ids];
    setActiveClientPopups(prev => prev.filter(x => !targetIds.includes(x.id)));
    markClientNotifAsRead(targetIds);
  };

  useEffect(() => {
    setUnreadSparksCount(sparks.length);
  }, [inquiries, sparks.length]);

  useEffect(() => {
    if (activeAdminModule === 'CLIENTS') {
      setHasNewConversation(false);
      localStorage.removeItem('netra_new_conversation');
    }
  }, [activeAdminModule]);

  const hasMissedDueDate = useMemo(() => {
    return (ignitionQueue || []).some(p => {
      if (p.status === 'Completed' || p.status === 'Cancelled') return false;
      if (!p.deadline) return false;
      const deadlineDate = new Date(p.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadlineDate < today;
    });
  }, [ignitionQueue]);

  const alertStripMessages = useMemo(() => {
    const messages = [];
    if (sparks && sparks.length > 0) {
      messages.push("📥 NEW INQUIRY: A new client inquiry (Spark) has been detected.");
    }
    if (hasMissedDueDate) {
      messages.push("⚠️ OVERDUE DEADLINE: One or more active project deadlines have been missed.");
    }
    if (hasNewConversation) {
      messages.push("✉️ NEW CONVERSATION: A new reply or message stream has been received from the client portal.");
    }
    if (clients && clients.some(c => c.pending_profile_update)) {
      messages.push("👤 PROFILE UPDATE REQUEST: A client has submitted profile modifications pending review.");
    }
    if (hasUrgentAlert && isWarningDismissed) {
      messages.push("🚨 CRITICAL WARNINGS: Unresolved alerts have been acknowledged & proceeded.");
    }
    return messages;
  }, [sparks, hasMissedDueDate, hasNewConversation, clients, hasUrgentAlert, isWarningDismissed]);

  // Warning dismissal state is persistent per session and only reset on logout/login reset

  const handleSnooze = (id, amount, unit) => {
    const timeToSnooze = amount * (unit === 'HOURS' ? 60 * 60 * 1000 : 60 * 1000);
    const resumeTime = Date.now() + timeToSnooze;
    const updated = { ...remindedFlames, [id]: resumeTime };
    setRemindedFlames(updated);
    localStorage.setItem('netra_reminded_flames', JSON.stringify(updated));
    if (flames.length <= 1) {
      setIsWarningDismissed(true);
    }
  };

  const markAllAlertsAsRead = async () => {
    // 1. Mark all flames as read in database and local state
    if (flames.length > 0) {
      const flameIds = flames.map(f => f.id);
      setReadFlames(prev => {
        const next = [...prev, ...flameIds];
        localStorage.setItem("netra_read_flames", JSON.stringify(next));
        return next;
      });

      // Update in Supabase database
      for (const flame of flames) {
        try {
          await updateProjectState(flame.id, { acknowledgedDeadline: flame.deadline });
        } catch (err) {
          console.error(`Failed to update acknowledged deadline for project ${flame.id}:`, err);
        }
      }

      // Update local ignitionQueue state so UI refreshes immediately
      setIgnitionQueue(prev =>
        prev.map(p => {
          const matched = flames.find(f => f.id === p.id);
          if (matched) {
            return { ...p, acknowledgedDeadline: matched.deadline };
          }
          return p;
        })
      );
    }

    // 2. Mark all sparks as read in Supabase and locally
    if (sparks.length > 0) {
      const sparkIds = sparks.map(s => s.id);
      for (const id of sparkIds) {
        try {
          await supabase.from('inquiries').update({ status: 'Read' }).eq('id', id);
        } catch (dbErr) {
          console.warn("Supabase update failed:", dbErr);
        }
      }
      setInquiries(prev => prev.map(inq => sparkIds.includes(inq.id) ? { ...inq, status: 'Read' } : inq));
    }

    toast({ title: "All emergency alerts acknowledged" });
  };

  const getProjectClientName = (project) => {
    if (!project) return "Unknown Client";
    const liveClient = project.client 
      ? clients.find(c => 
          (project.client.id && String(c.id) === String(project.client.id)) ||
          (project.client.email && c.email && c.email.toLowerCase() === project.client.email.toLowerCase()) ||
          (project.client.phone && c.phone && c.phone === project.client.phone)
        )
      : null;
    return liveClient ? liveClient.name : (project.client?.name || project.clientName || project.name || "Unknown Client");
  };

  const getFlameNotifText = (project) => {
    if (!project.deadline) return "Project Calibration Required";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(project.deadline);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      return `OVERDUE by ${days} day${days > 1 ? 's' : ''}! Immediate Calibration Required`;
    } else if (diffDays === 0) {
      return `Due TODAY! Immediate Calibration Required`;
    } else if (diffDays === 1) {
      return `Due TOMORROW! Calibration Required`;
    } else {
      return `Due in ${diffDays} days (Calibration Required)`;
    }
  };

  const markInquiryAsRead = async (id) => {
    try {
      try {
        await supabase.from('inquiries').update({ status: 'Read' }).eq('id', id);
      } catch (dbErr) {
        console.warn("Supabase update failed, falling back to local memory:", dbErr);
      }
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: 'Read' } : inq));
      toast({ title: "Inquiry marked as read" });
    } catch (err) {
      console.error(err);
    }
  };

  const markFlameAsRead = async (projectId) => {
    const project = ignitionQueue.find(p => p.id === projectId);
    if (!project) return;

    setReadFlames(prev => {
      const next = [...prev, projectId];
      localStorage.setItem("netra_read_flames", JSON.stringify(next));
      return next;
    });

    try {
      await updateProjectState(projectId, { acknowledgedDeadline: project.deadline });
      setIgnitionQueue(prev =>
        prev.map(p => (p.id === projectId ? { ...p, acknowledgedDeadline: project.deadline } : p))
      );
    } catch (err) {
      console.error(`Failed to update acknowledged deadline for project ${projectId}:`, err);
    }

    toast({ title: "Alert acknowledged" });
  };

  const calculateDaysRemaining = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [redirectFilterClient, setRedirectFilterClient] = useState('');
  const [redirectFilterService, setRedirectFilterService] = useState('');
  const [invoiceProject, setInvoiceProject] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [microJobs, setMicroJobs] = useState([]);
  const [redirectBackToMicroJob, setRedirectBackToMicroJob] = useState(false);
  const [redirectBackToProjectEdit, setRedirectBackToProjectEdit] = useState(null);
  const [expandedWarningTab, setExpandedWarningTab] = useState('DEADLINES'); // 'DEADLINES' | 'INQUIRIES'
  const [showClientNotifHistory, setShowClientNotifHistory] = useState(false);
  const [expandedNotifGroup, setExpandedNotifGroup] = useState(null);

  // Client Portal notifications no longer reset the emergency warning overlay dismissal

  const [selectedBatchProjects, setSelectedBatchProjects] = useState([]);
  const [selectedVaultInvoices, setSelectedVaultInvoices] = useState([]);
  const [highlightedCashbookId, setHighlightedCashbookId] = useState(null);

  const getHighestInvoiceSerial = (invoicesList) => {
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

  const getUniqueInvoiceNumber = (date) => {
    const d = new Date(date || Date.now());
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
    const nextSerial = getHighestInvoiceSerial(invoices) + 1;
    const serialStr = nextSerial.toString().padStart(4, '0');
    return `NG/${dateStr}/${serialStr}`;
  };

  const formatCurrencyValue = (val) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return "0.00";
    return parsed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const amountInWords = (price) => {
    const sglDigit = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"],
      dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"],
      tensPlace = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convertLessThanThousand = (num) => {
      let temp = "";
      if (num >= 100) {
        temp += sglDigit[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
      }
      if (num >= 10 && num < 20) {
        temp += dblDigit[num - 10] + " ";
      } else if (num >= 20) {
        temp += tensPlace[Math.floor(num / 10)] + " " + sglDigit[num % 10] + " ";
      } else if (num > 0) {
        temp += sglDigit[num] + " ";
      }
      return temp;
    };

    let n = Math.floor(price);
    if (n === 0) return "Zero Only";

    let str = "";

    // Crore
    if (n >= 10000000) {
      str += convertLessThanThousand(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    // Lakh
    if (n >= 100000) {
      str += convertLessThanThousand(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    // Thousand
    if (n >= 1000) {
      str += convertLessThanThousand(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    // Hundred and units
    if (n > 0) {
      str += convertLessThanThousand(n);
    }

    // Normalize spaces and return
    return str.replace(/\s+/g, ' ').trim() + " Only";
  };

  const getClientAddress = (name) => {
    if (invoiceProject) {
      const targetClientId = invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink;
      if (targetClientId) {
        const client = clients.find(c => c.id === targetClientId);
        if (client) return client.address;
      }
    }
    if (invoiceProject && invoiceProject.name === name && invoiceProject.address) {
      return invoiceProject.address;
    }
    const client = clients.find(c => c.name === name);
    return client ? client.address : "Location N/A";
  };

  const saveInvoiceToVault = async (p, invNo) => {
    if (p.id && invoices.some(i => i.rawProject?.id === p.id)) return;
    if (invoices.some(i => i.invoiceNo === invNo)) return;

    const isCompleted = (p.status || '').toLowerCase() === 'completed';
    const subtotal = parseFloat(p.quote) || 0;
    const discount = parseFloat(p.discount) || 0;
    const advance = parseFloat(p.advanceAmount) || 0;
    const grandTotal = isCompleted ? (subtotal - discount) : (subtotal - discount - advance);

    const isBatch = p.id?.toString().startsWith('batch-') || (p.items && p.items.length > 1);

    let clientNamePayload = p.name;
    if (isBatch) {
      const mockClientPayload = {
        name: p.name,
        address: p.address || "",
        email: p.email || "",
        phone: p.phone || "",
        gst: p.gst || "",
        service: p.service,
        quote: p.quote,
        discount: p.discount || 0,
        advanceAmount: p.advanceAmount || 0,
        items: p.items || []
      };
      clientNamePayload = `JSON_MOCK:${JSON.stringify(mockClientPayload)}`;
    }

    const newInvoice = {
      invoiceNo: invNo,
      issueDate: (() => {
                                  const isCompleted = (p.status || '').toLowerCase() === 'completed';
                                  if (isCompleted) {
                                    const completionLog = (p.activityLog || p.rawProject?.activityLog || []).find(l => l.action.toLowerCase().includes('completed') || l.action.toLowerCase().includes('final payment'));
                                    if (completionLog?.raw_date) return new Date(completionLog.raw_date).toISOString();
                                  }
                                  return p.issueDate || (p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString());
                                })(),
      clientName: clientNamePayload,
      projectService: p.service,
      grandTotal: grandTotal,
      projectId: isBatch ? null : p.id
    };

    try {
      const savedInvoice = await saveInvoice(newInvoice);
      let formattedInvoice;
      if (isBatch) {
        const parsed = JSON.parse(clientNamePayload.substring(10));
        formattedInvoice = {
          id: savedInvoice.id,
          invoiceNo: savedInvoice.invoice_no,
          clientName: parsed.name,
          projectService: parsed.service,
          issueDate: new Date(savedInvoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          grandTotal: parseFloat(savedInvoice.grand_total),
          rawProject: {
            id: savedInvoice.id,
            name: parsed.name,
            service: parsed.service,
            quote: parsed.quote,
            discount: parsed.discount,
            advanceAmount: parsed.advanceAmount,
            phone: parsed.phone,
            email: parsed.email,
            address: parsed.address,
            gst: parsed.gst,
            items: parsed.items
          }
        };
      } else {
        formattedInvoice = {
          id: savedInvoice.id,
          invoiceNo: savedInvoice.invoice_no,
          clientName: savedInvoice.client_name,
          projectService: savedInvoice.project_service,
          issueDate: new Date(savedInvoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          grandTotal: parseFloat(savedInvoice.grand_total),
          rawProject: p
        };
      }
      setInvoices(prev => [formattedInvoice, ...prev]);
    } catch (err) {
      console.error("Failed to save invoice to Supabase:", err);
      toast({
        title: "Failed to Save Invoice",
        description: err.message || JSON.stringify(err),
        variant: "destructive"
      });
    }
  };

  const updateSavedInvoice = async (updated) => {
    const existing = invoices.find(inv => inv.id === updated.id || inv.invoiceNo === updated.invoiceNo);
    const isStandalone = !updated.projectId && (updated.id?.toString().startsWith('custom-') || !existing?.projectId || existing?.rawProject?.isStandalone || updated.isStandalone);

    const subtotal = parseFloat(updated.quote) || 0;
    const discount = parseFloat(updated.discount) || 0;
    const advance = parseFloat(updated.advanceAmount) || 0;
    
    const isCompleted = isStandalone || (updated.status || existing?.rawProject?.status || '').toLowerCase() === 'completed';
    const grandTotal = isCompleted ? (subtotal - discount) : (subtotal - discount - advance);

    let clientNamePayload = updated.name;
    const isCustomOrBatch = (existing && existing.clientName.startsWith("JSON_MOCK:")) || updated.items?.length > 0;
    if (isCustomOrBatch) {
      const mockClientPayload = {
        name: updated.name,
        address: updated.address || "",
        email: updated.email || "",
        phone: updated.phone || "",
        gst: updated.gst || "",
        service: updated.service,
        quote: updated.quote,
        discount: updated.discount,
        advanceAmount: updated.advanceAmount,
        status: isStandalone ? 'Completed' : (existing?.rawProject?.status || 'Active'),
        isStandalone: isStandalone ? true : undefined,
        items: updated.items || []
      };
      clientNamePayload = `JSON_MOCK:${JSON.stringify(mockClientPayload)}`;
    }

    const invoiceData = {
      invoiceNo: updated.invoiceNo,
      clientName: clientNamePayload,
      projectService: updated.service,
      grandTotal: grandTotal,
      projectId: existing ? existing.projectId : (updated.id?.toString().startsWith('custom-') ? null : updated.id)
    };

    // Update cashbook entries for this standalone/custom invoice if it exists in cashbook
    setCashbookEntries(prev => prev.map(entry => {
      const isMatch = entry.invoiceId === updated.id || (entry.invoiceNo && entry.invoiceNo === existing?.invoiceNo);
      if (isMatch) {
        return {
          ...entry,
          invoiceNo: updated.invoiceNo,
          desc: `Custom Invoice: ${updated.service} - ${updated.name} [${updated.invoiceNo}]`,
          amount: grandTotal
        };
      }
      return entry;
    }));

    if (existing) {
      try {
        await updateInvoice(existing.id, invoiceData);
        setInvoices(prev => prev.map(inv => {
          if (inv.id === existing.id) {
            return {
              ...inv,
              invoiceNo: updated.invoiceNo,
              clientName: updated.name,
              projectService: updated.service,
              grandTotal: grandTotal,
              rawProject: {
                id: inv.rawProject?.id || inv.id,
                name: updated.name,
                service: updated.service,
                quote: updated.quote,
                discount: updated.discount,
                advanceAmount: updated.advanceAmount,
                phone: updated.phone,
                email: updated.email,
                address: updated.address,
                gst: updated.gst,
                items: updated.items,
                status: isStandalone ? 'Completed' : (inv.rawProject?.status || 'Active'),
                isStandalone: isStandalone ? true : undefined
              }
            };
          }
          return inv;
        }));
        toast({ title: "Invoice details updated in vault" });
      } catch (err) {
        console.error("Failed to update invoice in Supabase:", err);
        setInvoices(prev => prev.map(inv => {
          if (inv.id === existing.id) {
            return {
              ...inv,
              invoiceNo: updated.invoiceNo,
              clientName: updated.name,
              projectService: updated.service,
              grandTotal: grandTotal,
              rawProject: {
                id: inv.rawProject?.id || inv.id,
                name: updated.name,
                service: updated.service,
                quote: updated.quote,
                discount: updated.discount,
                advanceAmount: updated.advanceAmount,
                phone: updated.phone,
                email: updated.email,
                address: updated.address,
                gst: updated.gst,
                items: updated.items,
                status: isStandalone ? 'Completed' : (inv.rawProject?.status || 'Active'),
                isStandalone: isStandalone ? true : undefined
              }
            };
          }
          return inv;
        }));
        toast({ title: "Invoice details updated locally" });
      }
    } else {
      toast({ title: "Preview updated" });
    }
  };

  const downloadInvoicePDF = async (p, invNo) => {
    const input = document.querySelector('.invoice-paper');
    if (!input) return;

    saveInvoiceToVault(p, invNo);

    // Hide actions before capturing
    const actions = input.querySelector('.no-print');
    if (actions) actions.style.display = 'none';

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(input, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      if (actions) actions.style.display = 'flex';

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = 210;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const filename = `${p.name.replace(/\s+/g, '_')}_${invNo}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      if (actions) actions.style.display = 'flex';
      alert("Failed to generate PDF. Please try again.");
    }
  };


  const downloadMultiPageInvoicePDF = async (p, invNo) => {
    const pageNodes = document.querySelectorAll('.invoice-page-unit');
    if (!pageNodes.length) return;

    saveInvoiceToVault(p, invNo);

    const actions = document.querySelector('.invoice-modal-overlay .no-print');
    if (actions) actions.style.display = 'none';

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      window.scrollTo(0, 0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      for (let i = 0; i < pageNodes.length; i++) {
        const canvas = await html2canvas(pageNodes[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1000,
          windowHeight: 1400,
          scrollX: 0,
          scrollY: 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pageWidth = 210;
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pageWidth;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      if (actions) actions.style.display = 'flex';
      pdf.save(`${p.name.replace(/\s+/g, '_')}_${invNo}.pdf`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      if (actions) actions.style.display = 'flex';
      alert("Failed to generate PDF. Please try again.");
    }
  };


  // --- STABILITY FIXES ---
  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // 1. Stable Ember Stats (Prevents jumping on mouse move)
  const emberStats = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${5 + Math.random() * 5}s`
    }));
  }, []);

  // 2. Actual Popularity Calculation (Fixes random percentage jumps)
  const serviceStats = useMemo(() => {
    return services.map(s => {
      // Count matches in Inquiries
      const inqMatches = inquiries.filter(inq =>
        s.title.toLowerCase().includes(inq.service.toLowerCase()) ||
        inq.service.toLowerCase().includes(s.title.toLowerCase())
      ).length;

      // Count matches in Projects
      const projMatches = ignitionQueue.filter(proj =>
        s.title.toLowerCase().includes(proj.service.toLowerCase()) ||
        proj.service.toLowerCase().includes(s.title.toLowerCase())
      ).length;

      // Base Growth (Deterministic based on ID to prevent hover jumps)
      const baseGrowth = 15 + (s.id * 7) % 25;

      // Weighted Popularity
      const popularity = baseGrowth + (inqMatches * 18) + (projMatches * 32);

      return {
        id: s.id,
        growth: Math.min(popularity, 98),
        online: s.id !== 19 && s.id !== 20 // Simulate some offline/calibrating services
      };
    });
  }, [inquiries, ignitionQueue, servicesList]);

  // --- FINANCIAL CALIBRATION ---
  const [monthlyTarget, setMonthlyTarget] = useState(150000);
  const financialMetrics = useMemo(() => {
    let totalRevenue = 0;
    let pendingDues = 0;
    let monthlyRevenue = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Calculate total revenue and monthly revenue from cashbook entries (INCOME type)
    cashbookEntries.forEach(entry => {
      if (entry.type !== "INCOME") return;
      const amt = parseFloat(entry.amount) || 0;
      totalRevenue += amt;

      if (entry.date) {
        const entryDate = new Date(entry.date);
        if (!isNaN(entryDate.getTime()) && entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
          monthlyRevenue += amt;
        }
      }
    });

    // 2. Calculate pending dues from ignitionQueue (unpaid portions of active projects)
    ignitionQueue.forEach(p => {
      const isCancelled = (p.status || "").toLowerCase() === "cancelled";
      if (isCancelled) return;

      const baseQuote = parseFloat(p.quote) || 0;
      const discountVal = parseFloat(p.discount) || 0;
      const finalQuote = baseQuote - discountVal;

      const adv = parseFloat(p.advanceAmount) || 0;
      const isPaid = p.paymentStatus === 'paid' || (p.status || "").toLowerCase() === "completed";
      const hasAdvance = adv > 0;

      let duesFromProject = 0;

      if (isPaid) {
        duesFromProject = 0;
      } else if (hasAdvance) {
        duesFromProject = Math.max(0, finalQuote - adv);
      } else {
        duesFromProject = finalQuote;
      }

      pendingDues += duesFromProject;
    });

    return {
      totalRevenue,
      pendingDues,
      monthlyRevenue,
      targetProgress: Math.min((monthlyRevenue / monthlyTarget) * 100, 100)
    };
  }, [ignitionQueue, cashbookEntries, monthlyTarget]);

  // --- CASHBOOK SYSTEM ---
  const [financialTab, setFinancialTab] = useState("OVERVIEW"); // OVERVIEW, PROJECTS, CASHBOOK, INVOICES
  const [isCashbookEditModalOpen, setIsCashbookEditModalOpen] = useState(false);
  const [selectedCashbookEntry, setSelectedCashbookEntry] = useState(null);
  const [customPaymentPrompt, setCustomPaymentPrompt] = useState(null);

  const [editCategoryVal, setEditCategoryVal] = useState("");

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

  const getCategoryLabel = (cat) => {
    if (cat === "Service") return "Service Income";
    if (cat === "Salary") return "Salary/Wages";
    return cat;
  };

  useEffect(() => {
    if (selectedCashbookEntry) {
      setEditCategoryVal(selectedCashbookEntry.category || "");
    } else {
      setEditCategoryVal("");
    }
  }, [selectedCashbookEntry]);


  const cashbookMetrics = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let upiFlow = 0;
    let cashFlow = 0;

    cashbookEntries.forEach(entry => {
      const amt = parseFloat(entry.amount);
      const mode = (entry.mode || "").toUpperCase();
      if (entry.type === "EXPENSE") {
        totalExpense += amt;
        if (mode === "UPI" || mode === "ONLINE") upiFlow -= amt;
        if (mode === "CASH") cashFlow -= amt;
      } else {
        totalIncome += amt;
        if (mode === "UPI" || mode === "ONLINE") upiFlow += amt;
        if (mode === "CASH") cashFlow += amt;
      }
    });

    return {
      totalExpense,
      totalIncome,
      netFlow: totalIncome - totalExpense,
      upiFlow,
      cashFlow
    };
  }, [cashbookEntries]);

  // Cashbook entries self-healing reconciler to ensure alignment with projects status
  useEffect(() => {
    if (!ignitionQueue || ignitionQueue.length === 0) return;

    let updated = false;
    let newEntries = [...cashbookEntries];

    ignitionQueue.forEach(p => {
      const isCompleted = (p.status || '').toLowerCase() === 'completed';
      const isCancelled = (p.status || '').toLowerCase() === 'cancelled';
      const subtotal = parseFloat(p.quote) || 0;
      const discount = parseFloat(p.discount) || 0;
      const advance = parseFloat(p.advanceAmount) || 0;
      const grandTotal = subtotal - discount;
      const remainingDue = grandTotal - advance;

      // A. Advance payment verification
      if (advance > 0 && !isCancelled) {
        const advanceEntryIndex = newEntries.findIndex(entry => entry.projectId === p.id && (entry.isAdvance || entry.desc.toLowerCase().startsWith('advance:') || entry.desc.toLowerCase().startsWith('advance payment:')));
        const isAdvanceInTrash = (trashItems || []).some(item => item.type === 'cashbook' && item.data && item.data.projectId === p.id && (item.data.isAdvance || (item.data.desc && (item.data.desc.toLowerCase().startsWith('advance:') || item.data.desc.toLowerCase().startsWith('advance payment:')))));
        const trueAdvanceDate = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        if (advanceEntryIndex === -1 && !isAdvanceInTrash) {
          newEntries.push({
            id: Date.now() + Math.random(),
            projectId: p.id,
            date: trueAdvanceDate,
            desc: `Advance: ${p.service} - ${p.name}`,
            amount: advance,
            type: "INCOME",
            mode: "UPI",
            category: "Project",
            isAdvance: true
          });
          updated = true;
        } else if (advanceEntryIndex !== -1 && newEntries[advanceEntryIndex].date !== trueAdvanceDate) {
          newEntries[advanceEntryIndex] = { ...newEntries[advanceEntryIndex], date: trueAdvanceDate };
          updated = true;
        }
      }

      // Deduplicate advance payment entries if there are multiple
      const advanceEntries = newEntries.filter(entry => entry.projectId === p.id && (entry.isAdvance || entry.desc.toLowerCase().startsWith('advance:') || entry.desc.toLowerCase().startsWith('advance payment:')));
      if (advanceEntries.length > 1) {
        const keepId = advanceEntries[0].id;
        newEntries = newEntries.filter(entry => {
          const isMatch = entry.projectId === p.id && (entry.isAdvance || entry.desc.toLowerCase().startsWith('advance:') || entry.desc.toLowerCase().startsWith('advance payment:'));
          if (isMatch) {
            return entry.id === keepId;
          }
          return true;
        });
        updated = true;
      }

      // B. Final payment verification
      if (isCompleted) {
        const isPromptOpenForProject = customPaymentPrompt && customPaymentPrompt.p.id === p.id;
        const finalEntriesIndex = newEntries.findIndex(entry => entry.projectId === p.id && (entry.isFinal || entry.desc.toLowerCase().startsWith('payment:') || entry.desc.toLowerCase().startsWith('final payment:')));
        const isFinalInTrash = (trashItems || []).some(item => item.type === 'cashbook' && item.data && item.data.projectId === p.id && (item.data.isFinal || (item.data.desc && (item.data.desc.toLowerCase().startsWith('payment:') || item.data.desc.toLowerCase().startsWith('final payment:')))));
        
        const completionLog = (p.activityLog || []).find(l => l.action.toLowerCase().includes('completed') || l.action.toLowerCase().includes('final payment'));
        const trueEntryDate = completionLog?.raw_date ? new Date(completionLog.raw_date).toISOString().split('T')[0] : p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        if (finalEntriesIndex === -1 && remainingDue > 0 && !isPromptOpenForProject && !isFinalInTrash) {
          newEntries.push({
            id: Date.now() + Math.random(),
            projectId: p.id,
            date: trueEntryDate,
            desc: `Payment: ${p.service} - ${p.name}`,
            amount: remainingDue,
            type: "INCOME",
            mode: "UPI",
            category: "Project",
            isFinal: true
          });
          updated = true;
        } else if (finalEntriesIndex !== -1 && newEntries[finalEntriesIndex].date !== trueEntryDate) {
          newEntries[finalEntriesIndex] = { ...newEntries[finalEntriesIndex], date: trueEntryDate };
          updated = true;
        }
      }

      // Deduplicate final payment entries if there are multiple
      const finalEntries = newEntries.filter(entry => entry.projectId === p.id && (entry.isFinal || entry.desc.toLowerCase().startsWith('payment:') || entry.desc.toLowerCase().startsWith('final payment:')));
      if (finalEntries.length > 1) {
        const keepId = finalEntries[0].id;
        newEntries = newEntries.filter(entry => {
          const isMatch = entry.projectId === p.id && (entry.isFinal || entry.desc.toLowerCase().startsWith('payment:') || entry.desc.toLowerCase().startsWith('final payment:'));
          if (isMatch) {
            return entry.id === keepId;
          }
          return true;
        });
        updated = true;
      }

      // C. Remove final payment if project is not completed
      if (!isCompleted) {
        const finalEntriesExist = newEntries.filter(entry => entry.projectId === p.id && (entry.isFinal || entry.desc.toLowerCase().startsWith('payment:') || entry.desc.toLowerCase().startsWith('final payment:')));
        if (finalEntriesExist.length > 0) {
          newEntries = newEntries.filter(entry => !(entry.projectId === p.id && (entry.isFinal || entry.desc.toLowerCase().startsWith('payment:') || entry.desc.toLowerCase().startsWith('final payment:'))));
          updated = true;
        }
      }

      // D. Remove all entries if project is cancelled
      if (isCancelled) {
        const projectEntries = newEntries.filter(entry => entry.projectId === p.id);
        if (projectEntries.length > 0) {
          newEntries = newEntries.filter(entry => entry.projectId !== p.id);
          updated = true;
        }
      }
    });

    if (updated) {
      setCashbookEntries(newEntries);
    }
  }, [ignitionQueue, cashbookEntries, trashItems, customPaymentPrompt]);

  // Reconcile cashbook entries with standalone invoices to ensure alignment
  useEffect(() => {
    if (!invoices || invoices.length === 0) return;

    let updated = false;
    let newEntries = [...cashbookEntries];

    // Filter out incorrect cashbook entries:
    // 1. "Custom Invoice" entries that are actually project-linked invoices
    // 2. Entries associated with standalone invoices that are not paid
    const filteredEntries = newEntries.filter(entry => {
      const matchingInvoice = invoices.find(inv => 
        inv.id === entry.invoiceId || 
        inv.invoiceNo === entry.invoiceNo || 
        (entry.invoiceNo && entry.desc && entry.desc.includes(inv.invoiceNo))
      );

      if (matchingInvoice) {
        // A. If it's a project-linked invoice, it shouldn't have a "Custom Invoice:" entry
        if (matchingInvoice.projectId && entry.desc && entry.desc.startsWith("Custom Invoice:")) {
          updated = true;
          return false;
        }
        // B. If it's a standalone invoice but is NOT Paid, it shouldn't be in the cashbook
        const isStandalone = !matchingInvoice.projectId || matchingInvoice.projectId === null;
        const isPaid = (matchingInvoice.paymentStatus || "").toLowerCase() === "paid";
        if (isStandalone && !isPaid) {
          updated = true;
          return false;
        }
      }
      return true;
    });
    newEntries = filteredEntries;

    invoices.forEach(inv => {
      // Standalone invoices have projectId === null
      const isStandalone = (!inv.projectId || inv.projectId === null) && inv.clientName;
      if (!isStandalone) return;

      // Only reconcile if the standalone invoice is Paid
      const isPaid = (inv.paymentStatus || "").toLowerCase() === "paid";
      if (!isPaid) return;

      // Deduplicate cashbook entries for this invoice if there are multiple matches
      const invoiceMatches = newEntries.filter(entry => 
        entry.invoiceId === inv.id || 
        (entry.invoiceNo && entry.invoiceNo === inv.invoiceNo) ||
        (entry.desc && entry.desc.includes(inv.invoiceNo))
      );
      if (invoiceMatches.length > 1) {
        const keepId = invoiceMatches[0].id;
        newEntries = newEntries.filter(entry => {
          const isMatch = entry.invoiceId === inv.id || 
                          (entry.invoiceNo && entry.invoiceNo === inv.invoiceNo) ||
                          (entry.desc && entry.desc.includes(inv.invoiceNo));
          if (isMatch) {
            return entry.id === keepId;
          }
          return true;
        });
        updated = true;
      }

      const hasEntry = newEntries.some(entry => 
        entry.invoiceId === inv.id || 
        (entry.invoiceNo && entry.invoiceNo === inv.invoiceNo) ||
        (entry.desc && entry.desc.includes(inv.invoiceNo))
      ) || (trashItems || []).some(item => 
        item.type === 'cashbook' && item.data && (
          item.data.invoiceId === inv.id ||
          (item.data.invoiceNo && item.data.invoiceNo === inv.invoiceNo) ||
          (item.data.desc && item.data.desc.includes(inv.invoiceNo))
        )
      );

      if (!hasEntry && inv.grandTotal > 0) {
        newEntries.push({
          id: Date.now() + Math.random(),
          invoiceId: inv.id,
          invoiceNo: inv.invoiceNo,
          date: (() => {
            if (!inv.issueDate) return new Date().toISOString().split('T')[0];
            const parsedDate = new Date(inv.issueDate);
            if (isNaN(parsedDate.getTime())) return new Date().toISOString().split('T')[0];
            return parsedDate.toISOString().split('T')[0];
          })(),
          desc: `Custom Invoice: ${inv.projectService} - ${inv.clientName} [${inv.invoiceNo}]`,
          amount: inv.grandTotal,
          type: "INCOME",
          mode: "UPI",
          category: "Service"
        });
        updated = true;
      }
    });

    if (updated) {
      setCashbookEntries(newEntries);
    }
  }, [invoices, cashbookEntries, trashItems]);

  const kanbanColumns = [
    { id: 1, title: "SPARK", desc: "Discovery" },
    { id: 2, title: "CALIBRATION", desc: "Design" },
    { id: 3, title: "IGNITION", desc: "Review" },
    { id: 4, title: "FINAL FLAME", desc: "Delivery" }
  ];

  const [atTop, setAtTop] = useState(false);
  const containerRef = useRef(null);
  const vaultRef = useRef(null);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Splash & Hero Timings
    const logoTimer = setTimeout(() => setLogoDrawn(true), 1800);
    const revealTimer = setTimeout(() => setRevealStarted(true), 2000);
    const headlineTimer = setTimeout(() => setHeadlineActive(true), 2600);
    const taglineTimer = setTimeout(() => setTaglineActive(true), 2900);
    const missionTimer = setTimeout(() => setMissionActive(true), 3400);
    const headerTimer = setTimeout(() => setHeaderVisible(true), 3200);
    const completionTimer = setTimeout(() => setIsFullyRevealed(true), 3500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(revealTimer);
      clearTimeout(headlineTimer);
      clearTimeout(taglineTimer);
      clearTimeout(missionTimer);
      clearTimeout(headerTimer);
      clearTimeout(completionTimer);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: ((e.clientX - left) / width) * 100,
          y: ((e.clientY - top) / height) * 100
        });
      }
    };

    const handleWheel = (e) => {
      if (isTransitioning || showConstruction) return;

      // Transition from Hero to Vault (only if no other page views are active)
      if (
        !isVaultActive &&
        !isContactActive &&
        !isServicesActive &&
        !isLoginActive &&
        !isCommandCenterActive &&
        !isClientVaultActive &&
        !isAdminGridActive &&
        e.deltaY > 30 &&
        missionActive
      ) {
        setIsTransitioning(true);
        setIsVaultActive(true);
        pushPageToHistory('vision');
        setTimeout(() => setIsTransitioning(false), 1200);
        return;
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (isTransitioning || showConstruction) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY; // Swiped up (scrolled down)

      if (
        !isVaultActive &&
        !isContactActive &&
        !isServicesActive &&
        !isLoginActive &&
        !isCommandCenterActive &&
        !isClientVaultActive &&
        !isAdminGridActive &&
        deltaY > 50 && // Swipe threshold (50px)
        missionActive
      ) {
        setIsTransitioning(true);
        setIsVaultActive(true);
        pushPageToHistory('vision');
        setTimeout(() => setIsTransitioning(false), 1200);
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    isVaultActive,
    isContactActive,
    isServicesActive,
    isLoginActive,
    isCommandCenterActive,
    isClientVaultActive,
    isAdminGridActive,
    missionActive,
    isTransitioning,
    showConstruction
  ]);

  useEffect(() => {
    if (showSparkToast) {
      const toastTimer = setTimeout(() => {
        setShowSparkToast(false);
      }, 5000);
      return () => clearTimeout(toastTimer);
    }
  }, [showSparkToast]);

  const triggerSplashTransition = (targetPageSetter) => {
    setIsTransitioning(true);
    setIsFullyRevealed(false);
    setLogoDrawn(false);
    setRevealStarted(false);
    setHeadlineActive(false);
    setTaglineActive(false);
    setMissionActive(false);
    setHeaderVisible(false);

    // Exact replica of the majestic initial loading sequence
    setTimeout(() => setLogoDrawn(true), 1800);

    setTimeout(() => {
      setRevealStarted(true);
      targetPageSetter();
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 2000);

    setTimeout(() => setHeadlineActive(true), 2600);
    setTimeout(() => setTaglineActive(true), 2900);
    setTimeout(() => setHeaderVisible(true), 3200);
    setTimeout(() => setMissionActive(true), 3400);

    setTimeout(() => {
      setIsFullyRevealed(true);
      setIsTransitioning(false);
    }, 3500);
  };

  const triggerInstantTransition = (targetPageSetter) => {
    setIsTransitioning(false);
    setIsFullyRevealed(true);
    setLogoDrawn(true);
    setRevealStarted(true);
    targetPageSetter();
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const resetForm = () => {
    setSelectedProject("");
    setDropdownOpen(false);
  };

  const clearAllPages = () => {
    setIsVaultActive(false);
    setIsContactActive(false);
    setIsServicesActive(false);
    setIsLoginActive(false);
    setIsCommandCenterActive(false);
    setIsClientVaultActive(false);
    setIsAdminGridActive(false);
    setIsSuccess(false);
    setIsWarningDismissed(false);
    setShowConstruction(false);
    setSelectedService(null);
    setActiveServiceSlideshow(null);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    if ((isVaultActive && !isTransitioning) || isServicesActive || isContactActive) {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, [isVaultActive, isServicesActive, isContactActive, isTransitioning]);

  useEffect(() => {
    if (isContactActive) {
      const el = document.querySelector('.contact-page');
      if (el) el.scrollTop = 0;
    }
  }, [isContactActive]);

  // Reset scroll positions of absolute-positioned sub-pages/panels to top when activated
  useEffect(() => {
    if (isServicesActive) {
      const el = document.querySelector('.services-page');
      if (el) el.scrollTop = 0;
    }
  }, [isServicesActive]);

  useEffect(() => {
    if (isLoginActive) {
      const el = document.querySelector('.login-page');
      if (el) el.scrollTop = 0;
    }
  }, [isLoginActive]);

  useEffect(() => {
    if (isCommandCenterActive) {
      const el = document.querySelector('.admin-vault-page');
      if (el) el.scrollTop = 0;
    }
  }, [isCommandCenterActive]);

  useEffect(() => {
    if (isClientVaultActive) {
      const el = document.querySelector('.client-vault-page');
      if (el) el.scrollTop = 0;
    }
  }, [isClientVaultActive]);

  const pushPageToHistory = (pageName, additional = {}) => {
    const currentState = window.history.state;
    const hasChanged = !currentState || 
      currentState.page !== pageName || 
      (pageName === 'admin' && currentState.activeAdminModule !== additional.activeAdminModule) ||
      currentState.serviceId !== additional.serviceId ||
      currentState.viewWork !== additional.viewWork;
    if (hasChanged) {
      window.history.pushState({ page: pageName, ...additional }, '');
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      
      // Default reset
      setSelectedService(null);
      setShowConstruction(false);
      setActiveServiceSlideshow(null);
      
      if (state && state.page) {
        const isAdminAuthenticated = localStorage.getItem('netra_admin_active') === 'true';
        const isClientAuthenticated = localStorage.getItem('netra_client_active') === 'true';
        setIsVaultActive(state.page === 'vision');
        setIsServicesActive(state.page === 'services');
        setIsContactActive(state.page === 'contact');
        
        // Handle services page popup states
        if (state.page === 'services') {
          if (state.serviceId) {
            const rawServices = localStorage.getItem('netra_services');
            const parsedServices = rawServices ? JSON.parse(rawServices) : services;
            const foundService = parsedServices.find(s => s.id === state.serviceId);
            if (foundService) {
              setSelectedService(foundService);
              setShowConstruction(true);
              if (state.viewWork) {
                setActiveServiceSlideshow(foundService);
              }
            }
          }
        }

        // Only restore admin/client pages if user is still authenticated
        const canRestoreAdmin = state.page === 'admin' && isAdminAuthenticated;
        const canRestoreClient = state.page === 'client-vault' && isClientAuthenticated;
        setIsCommandCenterActive(canRestoreAdmin);
        setIsClientVaultActive(canRestoreClient);
        setIsAdminGridActive(canRestoreAdmin || !!state.isAdminGridActive);
        if (state.activeAdminModule && canRestoreAdmin) {
          setActiveAdminModule(state.activeAdminModule);
        }
        
        // If the history has an authenticated page but auth is gone, redirect to login page
        if ((state.page === 'admin' && !isAdminAuthenticated) ||
            (state.page === 'client-vault' && !isClientAuthenticated)) {
          setIsLoginActive(true);
          // Replace this history entry with login so it won't repeat
          window.history.replaceState({ page: 'login' }, '');
        } else {
          // Only restore login page if not already authenticated
          setIsLoginActive(state.page === 'login' && !isAdminAuthenticated && !isClientAuthenticated);
        }
      } else {
        setIsVaultActive(false);
        setIsServicesActive(false);
        setIsContactActive(false);
        setIsLoginActive(false);
        setIsCommandCenterActive(false);
        setIsClientVaultActive(false);
        setIsAdminGridActive(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) {
      if (localStorage.getItem('netra_admin_active') === 'true') {
        window.history.replaceState({ page: 'admin', activeAdminModule: 'DASHBOARD', isAdminGridActive: false }, '');
      } else if (localStorage.getItem('netra_client_active') === 'true') {
        window.history.replaceState({ page: 'client-vault' }, '');
      } else {
        window.history.replaceState({ page: 'home' }, '');
      }
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const goHome = () => triggerInstantTransition(() => {
    clearAllPages();
    pushPageToHistory('home');
  });

  const goToServices = () => triggerInstantTransition(() => {
    clearAllPages();
    setIsServicesActive(true);
    pushPageToHistory('services');
  });

  const goToVision = () => triggerInstantTransition(() => {
    clearAllPages();
    setIsVaultActive(true);
    pushPageToHistory('vision');
  });

  const goToContact = () => triggerInstantTransition(() => {
    clearAllPages();
    setIsContactActive(true);
    pushPageToHistory('contact');
  });

  const goToLogin = () => triggerInstantTransition(() => {
    clearAllPages();
    setIsLoginActive(true);
    setAccessKey("");
    setPassphrase("");
    setLoginError("");
    pushPageToHistory('login');
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (isAdminSelected) {
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerText : "";
      if (btn) btn.innerText = "AUTHENTICATING...";

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: accessKey,
          password: passphrase
        });

        if (error) throw error;

        if (saveLoginInfo) {
          localStorage.setItem('netra_saved_admin_key', accessKey);
          localStorage.setItem('netra_saved_admin_pass', passphrase);
        } else {
          localStorage.removeItem('netra_saved_admin_key');
          localStorage.removeItem('netra_saved_admin_pass');
        }

        triggerInstantTransition(() => {
          clearAllPages();
          setIsCommandCenterActive(true);
          setIsAdminGridActive(false);
          pushPageToHistory('admin', { activeAdminModule: 'DASHBOARD', isAdminGridActive: false });
          setShowSparkToast(unreadSparksCount > 0);
        });
      } catch (err) {
        console.error("Login failed:", err);
        setLoginError("ACCESS DENIED: " + (err.message || "Invalid credentials"));
      } finally {
        if (btn) btn.innerText = originalText;
      }
    } else {
      // Client Access
      if (accessKey && passphrase) {
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn ? btn.innerText : "";
        if (btn) btn.innerText = "VERIFYING PASSCODE...";

        try {
          // Verify with database
          const clientData = await verifyClientVaultKey(accessKey.trim(), passphrase.trim());

          if (clientData) {
            if (clientData.status === 'Suspended') {
              setLoginError("ACCESS DENIED: This account has been suspended by the administrator.");
              return;
            }

            if (saveLoginInfo) {
              localStorage.setItem('netra_saved_client_key', accessKey);
              localStorage.setItem('netra_saved_client_pass', passphrase);
            } else {
              localStorage.removeItem('netra_saved_client_key');
              localStorage.removeItem('netra_saved_client_pass');
            }

            setCurrentClient({
              ...clientData,
              joinedDate: clientData.joined_date || clientData.joinedDate,
              accessKey: clientData.access_key || clientData.accessKey
            });

            triggerInstantTransition(() => {
              clearAllPages();
              setIsClientVaultActive(true);
              pushPageToHistory('client-vault');
            });
          } else {
            setLoginError("ACCESS DENIED: Invalid Email or Passcode.");
          }
        } catch (err) {
          console.error("Client verification error:", err);
          setLoginError("VERIFICATION ERROR: " + (err.message || "Failed to connect to database."));
        } finally {
          if (btn) btn.innerText = originalText;
        }
      } else {
        setLoginError("Please enter your Client Access Key and Passphrase.");
      }
    }
  };

  const handleLogout = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Clear all authentication tokens first
    localStorage.removeItem('netra_admin_active');
    localStorage.removeItem('netra_client_active');
    localStorage.removeItem('netra_active_admin_module');
    localStorage.removeItem('netra_admin_grid_active');
    localStorage.removeItem('netra_client_session');
    localStorage.removeItem('netra_active_client_tab');
    localStorage.removeItem('netra_selected_client_project_id');
    localStorage.removeItem('netra_selected_client_invoice_id');
    setCurrentClient(null);
    setIsClientVaultActive(false);
    setIsCommandCenterActive(false);
    setIsAdminGridActive(false);
    // Wipe the entire browser history stack and replace with a clean home state
    // so that the back button cannot navigate back into authenticated pages
    const historyDepth = window.history.length;
    for (let i = 0; i < historyDepth; i++) {
      window.history.replaceState({ page: 'home' }, '');
    }
    triggerInstantTransition(() => {
      clearAllPages();
      // Use replaceState here (not pushState) to ensure a clean single home entry
      window.history.replaceState({ page: 'home' }, '');
    });
  };

  const updateIgnitionStatus = (index, newStage) => {
    const updatedQueue = [...ignitionQueue];
    updatedQueue[index].stage = newStage;
    setIgnitionQueue(updatedQueue);
  };

  const moveProjectStage = async (projectId) => {
    const project = ignitionQueue.find(p => p.id === projectId);
    if (!project || project.stage >= 4) return;

    const nextStage = project.stage + 1;
    let newStatus = project.status;
    if (nextStage === 4) {
      newStatus = "Completed";
    }

    if (newStatus === "Completed" && project.status !== "Completed") {
      const discountVal = parseFloat(project.discount) || 0;
      const advanceVal = parseFloat(project.advanceAmount) || 0;
      const finalQuote = parseFloat(project.quote) - discountVal;
      const remainingAmt = Math.max(0, finalQuote - advanceVal);

      setCustomPaymentPrompt({
        p: project,
        finalQuote: finalQuote,
        defaultAmt: remainingAmt,
        adv: advanceVal,
        paymentMode: "UPI"
      });
      return;
    }

    try {
      await updateProjectState(projectId, { stage: nextStage, status: newStatus });
      const actionMsg = `Transitioned to ${kanbanColumns[nextStage - 1].title}`;
      await addProjectActivityLog(projectId, actionMsg);

      let maxPos = -1;
      if (newStatus === "Completed" || nextStage >= 5) maxPos = 4;
      else if (nextStage === 4) maxPos = 3;
      else if (nextStage === 3) maxPos = 2;
      else if (nextStage === 2) maxPos = 1;
      else if (nextStage === 1) maxPos = 0;

      const newMilestoneLogs = [];
      if (project && project.milestones) {
        for (let idx = 0; idx < project.milestones.length; idx++) {
          if (!project.milestones[idx].completed && idx <= maxPos) {
            const mMsg = `Milestone Achieved: ${project.milestones[idx].name}`;
            await addProjectActivityLog(projectId, mMsg);
            newMilestoneLogs.unshift({ action: mMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() });
          }
        }
      }

      setIgnitionQueue(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedMilestones = (p.milestones || []).map((m, idx) => ({
            ...m,
            completed: idx <= maxPos
          }));

          return {
            ...p,
            stage: nextStage,
            status: newStatus,
            milestones: updatedMilestones,
            activityLog: [
              ...newMilestoneLogs,
              { action: actionMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() },
              ...(p.activityLog || [])
            ]
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to update project stage in Supabase:", err);
    }

    triggerBellPulse();

    // Update the drawer view
    setSelectedKanbanProject(prev => {
      if (!prev) return null;
      const nextStage = Math.min(4, prev.stage + 1);
      const nextStatus = nextStage === 4 ? "Completed" : prev.status;

      let maxPos = -1;
      if (nextStatus === "Completed" || nextStage >= 5) maxPos = 4;
      else if (nextStage === 4) maxPos = 3;
      else if (nextStage === 3) maxPos = 2;
      else if (nextStage === 2) maxPos = 1;
      else if (nextStage === 1) maxPos = 0;

      const updatedMilestones = (prev.milestones || []).map((m, idx) => ({
        ...m,
        completed: idx <= maxPos
      }));

      return {
        ...prev,
        stage: nextStage,
        status: nextStatus,
        milestones: updatedMilestones
      };
    });
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    const project = ignitionQueue.find(p => p.id === projectId);
    if (!project) return;

    if (newStatus === "Completed" && project.status !== "Completed") {
      const discountVal = parseFloat(project.discount) || 0;
      const advanceVal = parseFloat(project.advanceAmount) || 0;
      const finalQuote = parseFloat(project.quote) - discountVal;
      const remainingAmt = Math.max(0, finalQuote - advanceVal);

      setCustomPaymentPrompt({
        p: project,
        finalQuote: finalQuote,
        defaultAmt: remainingAmt,
        adv: advanceVal,
        paymentMode: "UPI"
      });
      return;
    }

    try {
      await updateProjectState(projectId, { stage: project.stage, status: newStatus });
      const actionMsg = `Status Updated to ${newStatus.toUpperCase()}`;
      await addProjectActivityLog(projectId, actionMsg);

      let maxPos = -1;
      if (newStatus === "Completed" || project.progress >= 100 || project.stage >= 5) maxPos = 4;
      else if (project.progress >= 80 || project.stage >= 4) maxPos = 3;
      else if (project.progress >= 60 || project.stage >= 3) maxPos = 2;
      else if (project.progress >= 40 || project.stage >= 2) maxPos = 1;
      else if (project.progress >= 20 || project.stage >= 1) maxPos = 0;

      const newMilestoneLogs = [];
      if (project && project.milestones) {
        for (let idx = 0; idx < project.milestones.length; idx++) {
          if (!project.milestones[idx].completed && idx <= maxPos) {
            const mMsg = `Milestone Achieved: ${project.milestones[idx].name}`;
            await addProjectActivityLog(projectId, mMsg);
            newMilestoneLogs.unshift({ action: mMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() });
          }
        }
      }

      setIgnitionQueue(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedMilestones = (p.milestones || []).map((m, idx) => ({
            ...m,
            completed: idx <= maxPos
          }));

          return {
            ...p,
            status: newStatus,
            milestones: updatedMilestones,
            activityLog: [
              ...newMilestoneLogs,
              { action: actionMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() },
              ...(p.activityLog || [])
            ]
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to update project status in Supabase:", err);
    }

    setSelectedKanbanProject(prev => {
      if (!prev) return null;
      let maxPos = -1;
      if (newStatus === "Completed" || prev.progress >= 100 || prev.stage >= 5) maxPos = 4;
      else if (prev.progress >= 80 || prev.stage >= 4) maxPos = 3;
      else if (prev.progress >= 60 || prev.stage >= 3) maxPos = 2;
      else if (prev.progress >= 40 || prev.stage >= 2) maxPos = 1;
      else if (prev.progress >= 20 || prev.stage >= 1) maxPos = 0;

      const updatedMilestones = (prev.milestones || []).map((m, idx) => ({
        ...m,
        completed: idx <= maxPos
      }));

      return {
        ...prev,
        status: newStatus,
        milestones: updatedMilestones
      };
    });
    triggerBellPulse();
  };

  const handleIgniteFromInquiry = (inq) => {
    const serviceMatch = services.find(s =>
      s.title.toLowerCase().includes(inq.service.toLowerCase()) ||
      inq.service.toLowerCase().includes(s.title.toLowerCase())
    );
    setPrefillData({
      inquiryId: inq.id,
      clientName: inq.name,
      email: inq.email,
      phone: inq.phone || '',
      address: inq.location || '',
      serviceId: serviceMatch ? serviceMatch.id : '',
      description: inq.description || inq.desc || ''
    });
    setIgnitionClientType("NEW");
    setIsReviewDrawerOpen(false);
    setIsIgnitionModalOpen(true);
  };

  const handleIgniteProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.ignite-submit-btn');
    if (btn && btn.disabled) return;
    if (btn) {
      btn.disabled = true;
      btn.innerText = "IGNITING...";
    }
    const formData = new FormData(form);
    const serviceVal = formData.get('service');
    const serviceName = serviceVal || "Custom Service";

    try {
      let clientInfo;
      let clientDbId = null;

      // 1. Fetch fresh clients from DB to verify selection and keep local state synchronized
      const dbClients = await getClients();
      const freshClients = dbClients ? dbClients.map(c => ({
        ...c,
        joinedDate: c.joined_date || c.joinedDate,
        accessKey: c.access_key || c.accessKey
      })) : [];
      
      setClients(freshClients);
      localStorage.setItem('netra_clients', JSON.stringify(freshClients));

      if (ignitionClientType === "EXISTING") {
        const clientId = formData.get('existingClientId');
        const existingClient = freshClients.find(c => c.id === parseInt(clientId));
        if (!existingClient) {
          alert("Selected visionary no longer exists in the database. The client list has been synchronized. Please choose again.");
          btn.innerText = "IGNITE PROJECT";
          return;
        }
        clientInfo = {
          name: existingClient.name,
          phone: existingClient.phone,
          email: existingClient.email,
          address: existingClient.address
        };
        clientDbId = existingClient.id;
      } else {
        const rawName = formData.get('clientName')?.trim();
        const rawEmail = formData.get('email')?.trim();
        const rawPhone = formData.get('whatsapp')?.trim();
        const rawAddress = formData.get('address')?.trim();

        if (!rawName) {
          alert("Please enter a valid client name.");
          btn.innerText = "IGNITE PROJECT";
          return;
        }

        // Check if client with this email already exists in DB
        let existingClient = null;
        if (rawEmail) {
          existingClient = freshClients.find(c => c.email.toLowerCase() === rawEmail.toLowerCase());
        }

        if (existingClient) {
          // Auto-link project to the existing client profile
          clientInfo = {
            name: existingClient.name,
            phone: existingClient.phone,
            email: existingClient.email,
            address: existingClient.address
          };
          clientDbId = existingClient.id;
        } else {
          // Generate a unique fallback email if empty to satisfy UNIQUE NOT NULL DB constraint
          const clientEmail = rawEmail || `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}@netra.graphics`;

          clientInfo = {
            name: rawName,
            phone: rawPhone,
            email: clientEmail,
            address: rawAddress
          };

          // Register new client with access key passcode
          const randomAccessKey = Math.random().toString(36).substring(2, 8).toUpperCase();
          const newClient = await createClientProfile({
            ...clientInfo,
            accessKey: randomAccessKey,
            status: 'Active'
          });

          clientDbId = newClient.id;
          
          setClients(prev => {
            const next = [...prev, {
              ...newClient,
              joinedDate: newClient.joined_date || newClient.joinedDate,
              accessKey: newClient.access_key || newClient.accessKey
            }];
            localStorage.setItem('netra_clients', JSON.stringify(next));
            return next;
          });
        }
      }

      const milestoneNames = ["Discovery", "Moodboard", "Sketching", "Printing", "Final Flame"];
      const qtyVal = parseInt(formData.get('qty')) || 1;
      const rateVal = parseFloat(formData.get('rate')) || 0;
      const quoteVal = parseFloat(formData.get('quote')) || (qtyVal * rateVal) || 15000;
      const discountVal = parseInt(formData.get('discount')) || 0;
      const discountPct = ((discountVal / quoteVal) * 100).toFixed(2);
      const advanceVal = parseInt(formData.get('advanceAmount')) || 0;
      const finalQuote = quoteVal - discountVal;
      let paymentStatus = 'unpaid';
      if (advanceVal >= finalQuote) {
        paymentStatus = 'paid';
      } else if (advanceVal > 0) {
        paymentStatus = 'part';
      }

      const alertMeDaysInput = formData.get('alertMeDays');
      const alertMeDays = alertMeDaysInput !== null && alertMeDaysInput !== "" ? parseInt(alertMeDaysInput) : "";

      const projectPayload = {
        name: clientInfo.name,
        service: serviceName,
        stage: 1,
        progress: 20,
        status: "Active",
        priority: "Normal",
        alertMeDays: alertMeDays,
        description: formData.get('description') || prefillData?.description || '',
        deadline: formData.get('deadline'),
        isManual: true,
        client: { ...clientInfo, id: clientDbId },
        milestones: milestoneNames.map((name, idx) => ({ name, completed: name === "Discovery" })),
        qty: qtyVal,
        rate: rateVal,
        quote: quoteVal,
        discountValue: discountVal.toString(),
        discountType: 'rs',
        discountPercent: discountPct,
        discount: discountVal,
        advanceAmount: advanceVal,
        paymentStatus: paymentStatus,
        mediaVault: [],
        collaborationStream: [
          { id: 1, sender: "SYSTEM", text: "Project Ignited", time: new Date().toLocaleTimeString() }
        ],
        activityLog: [
          { action: "Project Ignited", time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() },
          { action: "Progress Updated to 20%", time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() }
        ]
      };

      const savedProjCore = await igniteProject({
        ...projectPayload,
        client_id: clientDbId
      });

      const newProject = {
        ...projectPayload,
        id: savedProjCore.id,
        createdAt: savedProjCore.created_at ? new Date(savedProjCore.created_at).getTime() : Date.now()
      };

      setIgnitionQueue(prev => {
        if (prev.some(p => p.id === newProject.id)) return prev;
        return [...prev, newProject];
      });
      triggerBellPulse();

      // Auto-generate and save draft invoice in vault
      const draftInvNo = getUniqueInvoiceNumber(newProject.createdAt);
      saveInvoiceToVault(newProject, draftInvNo);

      if (advanceVal > 0) {
        const advPaymentMethod = formData.get('advancePaymentMethod') || "UPI";
        const advanceEntry = {
          id: Date.now(),
          projectId: savedProjCore.id,
          date: getISTDateString(),
          desc: `Advance: ${serviceName} - ${clientInfo.name}`,
          amount: advanceVal,
          type: "INCOME",
          mode: advPaymentMethod,
          category: "Project",
          isAdvance: true
        };
        setCashbookEntries(prev => [advanceEntry, ...prev]);
      }

      if (prefillData && prefillData.inquiryId) {
        try {
          await updateInquiry(prefillData.inquiryId, { status: 'Ignited', remarks: 'Automatically ignited into active project mission.' });
          const dbInquiries = await getInquiries();
          if (dbInquiries && dbInquiries.length > 0) {
            setInquiries(dbInquiries);
          }

          // Send positive WhatsApp greeting confirmation
          if (prefillData.phone) {
            const msg = `Namaste ${prefillData.clientName}! We have received and accepted your spark for "${serviceName}" at Netra Graphics. Our team is super excited to work with you and start the ignition process! Let's build something exceptional.`;
            let cleanedPhone = prefillData.phone.replace(/\D/g, "");
            while (cleanedPhone.startsWith("0")) {
              cleanedPhone = cleanedPhone.substring(1);
            }
            const finalPhone = cleanedPhone.length === 10 ? "91" + cleanedPhone : cleanedPhone;
            window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
          }
        } catch (e) {
          console.error("Failed to update inquiry status on auto-ignition:", e);
        }
      }

      if (btn) btn.innerText = "MISSION START";
      setTimeout(() => {
        setIsIgnitionModalOpen(false);
        if (btn) {
          btn.disabled = false;
          btn.innerText = "IGNITE PROJECT";
        }
        setActiveAdminModule("PROJECTS");
        setSelectedProjectTab(newProject.id);
      }, 1000);

    } catch (err) {
      console.error("Failed to ignite project:", err);
      if (btn) {
        btn.disabled = false;
        btn.innerText = "ERROR - RETRY";
      }
      alert("Failed to ignite project in database: " + (err.message || err.details || JSON.stringify(err)));
    }
  };

  const deleteProject = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO TERMINATE THIS MISSION? ALL DATA FOR THIS PROJECT WILL BE PURGED.")) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        setIgnitionQueue(prev => prev.filter(p => p.id !== id));
        setSelectedProjectTab(null);
      } catch (err) {
        console.error("Failed to delete project from Supabase:", err);
        alert("Failed to terminate project database record: " + (err.message || err.details || JSON.stringify(err)));
      }
    }
  };

  // Real-time Chat Subscription Effect
  useEffect(() => {
    if (!selectedProjectTab) return;

    const subscription = subscribeToChats(selectedProjectTab, (newMsg) => {
      setIgnitionQueue(prevQueue => prevQueue.map(proj => {
        if (proj.id === selectedProjectTab) {
          if (newMsg.eventType === 'DELETE') {
            return {
              ...proj,
              collaborationStream: (proj.collaborationStream || []).filter(msg => msg.id !== newMsg.id)
            };
          }
          const exists = (proj.collaborationStream || []).some(msg => msg.id === newMsg.id);
          if (exists) return proj;
          return {
            ...proj,
            collaborationStream: [...(proj.collaborationStream || []), newMsg]
          };
        }
        return proj;
      }));
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedProjectTab]);

  // Global Real-time Subscription for Client Portal Notifications
  useEffect(() => {
    const chatSub = subscribeToAllChats((newMsg) => {
      setIgnitionQueue(prevQueue => prevQueue.map(proj => {
        if (proj.id === newMsg.project_id) {
          if (newMsg.eventType === 'DELETE') {
            return {
              ...proj,
              collaborationStream: (proj.collaborationStream || []).filter(msg => msg.id !== newMsg.id)
            };
          }
          const exists = (proj.collaborationStream || []).some(msg => msg.id === newMsg.id);
          if (exists) return proj;
          return {
            ...proj,
            collaborationStream: [...(proj.collaborationStream || []), newMsg]
          };
        }
        return proj;
      }));
    });

    const mediaSub = subscribeToAllMedia((newMedia) => {
      setIgnitionQueue(prevQueue => prevQueue.map(proj => {
        if (proj.id === newMedia.project_id) {
          const exists = (proj.mediaVault || []).some(m => m.id === newMedia.id);
          if (exists) return proj;
          return {
            ...proj,
            mediaVault: [...(proj.mediaVault || []), newMedia]
          };
        }
        return proj;
      }));
    });

    return () => {
      if (chatSub) chatSub.unsubscribe();
      if (mediaSub) mediaSub.unsubscribe();
    };
  }, []);

  // Media Vault File Upload Handler
  const handleVaultFileUpload = async (e, projectId) => {
    const file = e.target.files[0];
    if (!file) return;

    alert(`Uploading ${file.name} to secure studio vault...\nSize: ${(file.size / 1024).toFixed(1)} KB`);

    try {
      const uploadedAsset = await uploadMediaVaultAsset(projectId, file, file.name);

      setIgnitionQueue(prevQueue => prevQueue.map(proj => {
        if (proj.id === projectId) {
          return {
            ...proj,
            mediaVault: [...(proj.mediaVault || []), uploadedAsset]
          };
        }
        return proj;
      }));
      alert(`Successfully uploaded and shared: ${file.name}`);
    } catch (err) {
      console.error("Vault asset upload failed:", err);
      alert("Failed to upload file to Supabase Storage: " + (err.message || err.details || JSON.stringify(err)));
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceVal = formData.get('service');
    const serviceName = serviceVal || "Custom Service";

    // Use controlled state values for qty/rate/quote (bidirectional logic)
    const qtyVal = Number(editQty) || 1;
    const rateVal = parseFloat(editRate) || 0;
    // Quote is the gross amount (qty * rate); discount is subtracted to get final amount
    const quoteVal = parseFloat(editQuote) || (qtyVal * rateVal) || 0;
    const discountVal = parseInt(formData.get('discount')) || 0;
    // finalQuote = total amount client pays = Quote − Discount
    const finalQuote = quoteVal - discountVal;
    const advanceVal = parseInt(formData.get('advanceAmount')) || 0;
    let paymentStatus = 'unpaid';
    if (advanceVal >= finalQuote) {
      paymentStatus = 'paid';
    } else if (advanceVal > 0) {
      paymentStatus = 'part';
    }

    const discountPercentVal = ((discountVal / (quoteVal || 1)) * 100).toFixed(2);

    const alertMeDaysInput = formData.get('alertMeDays');
    const alertMeDays = alertMeDaysInput !== null && alertMeDaysInput !== "" ? parseInt(alertMeDaysInput) : "";

    const updatedFields = {
      service: serviceName,
      deadline: formData.get('deadline'),
      qty: qtyVal,
      rate: rateVal,
      quote: quoteVal,
      discountValue: (discountVal).toString(),
      discountType: 'rs',
      discountPercent: discountPercentVal,
      discount: discountVal,
      advanceAmount: advanceVal,
      paymentStatus: paymentStatus,
      alertMeDays: alertMeDays
    };

    try {
      await updateProjectState(selectedProjectTab, updatedFields);
      toast({
        title: "Project Parameters Calibrated",
        description: "Successfully updated project details in the database."
      });
    } catch (err) {
      console.error("Failed to update project details in Supabase:", err);
      alert("Failed to save calibrated project to database: " + (err.message || err.details || JSON.stringify(err)));
    }

    setIgnitionQueue(prev => prev.map(p => {
      if (p.id === selectedProjectTab) {
        return {
          ...p,
          ...updatedFields
        };
      }
      return p;
    }));
    setIsProjectEditModalOpen(false);
  };

  const handleAddCashbookEntry = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    let category = formData.get('category');
    if (category === 'CUSTOM') {
      category = formData.get('customCategory')?.trim() || 'Other';
    }
    const newEntry = {
      id: Date.now(),
      date: formData.get('date'),
      desc: formData.get('desc'),
      amount: parseFloat(formData.get('amount')),
      type: formData.get('type'),
      mode: formData.get('mode'),
      category: category,
      details: formData.get('details')?.trim() || ""
    };
    setCashbookEntries(prev => [newEntry, ...prev]);
    e.target.reset();
  };

  const handleMarkMilestonePaid = async (project, type) => {
    const baseQuote = parseFloat(project.quote) || 0;
    const discountVal = parseFloat(project.discount) || 0;
    const finalQuote = baseQuote - discountVal;
    const advanceAmt = parseFloat(project.advanceAmount) || 0;
    const balanceAmt = Math.max(0, finalQuote - advanceAmt);

    let updatedFields = {};
    let desc = "";
    let milestoneAmt = 0;

    if (type === 'deposit') {
      milestoneAmt = advanceAmt;
      updatedFields = {
        paymentStatus: balanceAmt === 0 ? 'paid' : 'part'
      };
      desc = `Advance Payment: ${project.service} - ${project.name}`;
    } else if (type === 'retainer') {
      milestoneAmt = balanceAmt;
      updatedFields = {
        paymentStatus: 'paid',
        status: 'Completed',
        stage: 4
      };
      desc = `Final Payment: ${project.service} - ${project.name}`;
    }

    // Check if cashbook entry already exists to prevent double logging
    const exists = cashbookEntries.some(entry => entry.projectId === project.id && (entry.isAdvance || entry.isFinal || entry.desc.startsWith(type === 'deposit' ? "Advance Payment:" : "Final Payment:")));
    if (!exists && milestoneAmt > 0) {
      const newEntry = {
        id: Date.now(),
        projectId: project.id,
        date: getISTDateString(),
        desc: desc,
        amount: milestoneAmt,
        type: "INCOME",
        mode: "UPI",
        category: "Service",
        isAdvance: type === 'deposit' ? true : undefined,
        isFinal: type === 'retainer' ? true : undefined
      };
      setCashbookEntries(prev => [newEntry, ...prev]);
    }

    try {
      await updateProjectState(project.id, {
        ...project,
        ...updatedFields
      });
      toast({
        title: `${type === 'deposit' ? 'Advance Payment' : 'Final Payment'} Marked Paid`,
        description: `Successfully logged ₹${milestoneAmt.toLocaleString()} service income.`
      });
    } catch (err) {
      console.warn("Failed to update project status in Supabase:", err);
    }

    if (type === 'retainer') {
      const completedProjectForInvoice = {
        ...project,
        ...updatedFields,
        status: 'Completed',
        stage: 4
      };
      const existingInvoice = invoices.find(i => i.rawProject?.id === project.id || i.projectId === project.id);
      if (!existingInvoice) {
        const invNo = getUniqueInvoiceNumber(project.createdAt);
        saveInvoiceToVault(completedProjectForInvoice, invNo);
      } else {
        const subtotal = parseFloat(project.quote) || 0;
        const discount = parseFloat(project.discount) || 0;
        const finalGrandTotal = subtotal - discount;
        try {
          await updateInvoice(existingInvoice.id, {
            ...existingInvoice,
            projectId: project.id,
            grandTotal: finalGrandTotal
          });
          setInvoices(prev => prev.map(inv => {
            if (inv.id === existingInvoice.id) {
              return {
                ...inv,
                grandTotal: finalGrandTotal,
                rawProject: completedProjectForInvoice
              };
            }
            return inv;
          }));
        } catch (err) {
          console.error("Failed to update existing draft invoice grand total in handleMarkMilestonePaid:", err);
        }
      }
    }

    setIgnitionQueue(prev => prev.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          ...updatedFields,
          status: type === 'retainer' ? 'Completed' : p.status,
          stage: type === 'retainer' ? 4 : p.stage
        };
      }
      return p;
    }));
  };

  const handleUpdateProjectStatusHandy = async (projectId, newProjectStatus) => {
    const project = ignitionQueue.find(p => p.id === projectId);
    if (!project) return;

    if (project.status === 'Completed' && newProjectStatus !== 'Completed') {
      // Reverted from Completed: remove final payment entry
      setCashbookEntries(prev => prev.filter(entry => !(entry.projectId === projectId && entry.isFinal)));
    }

    const baseQuote = parseFloat(project.quote) || 0;
    const discountVal = parseFloat(project.discount) || 0;
    const finalQuote = baseQuote - discountVal;
    const adv = parseFloat(project.advanceAmount) || 0;

    let updatedFields = {
      status: newProjectStatus,
      stage: project.stage,
      progress: project.progress,
      paymentStatus: project.paymentStatus
    };

    if (newProjectStatus === 'Completed') {
      const remainingAmt = Math.max(0, finalQuote - adv);
      setCustomPaymentPrompt({
        p: { ...project, status: 'Completed', stage: 5, progress: 100, paymentStatus: 'paid' },
        finalQuote: finalQuote,
        defaultAmt: remainingAmt,
        adv: adv,
        paymentMode: 'UPI'
      });
      return; // Return early, do not update database or state until confirmed
    } else if (newProjectStatus === 'Cancelled') {
      updatedFields.paymentStatus = 'unpaid';
      updatedFields.progress = 20;
      setCashbookEntries(prev => prev.filter(entry => entry.projectId !== project.id));
    } else if (newProjectStatus === 'Active') {
      updatedFields.stage = 1;
      if (project.status === 'Completed') {
        updatedFields.paymentStatus = adv > 0 ? 'part' : 'unpaid';
        updatedFields.progress = 20;
      }
    }

    try {
      await updateProjectState(projectId, updatedFields);
      toast({
        title: "Project Status Updated",
        description: `Successfully marked project status as ${newProjectStatus}.`
      });
    } catch (err) {
      console.warn("Failed to update project status in Supabase:", err);
    }

    setIgnitionQueue(prev => prev.map(p => {
      if (p.id === projectId) {
        const nextStatus = updatedFields.status || p.status;
        const nextStage = updatedFields.stage !== undefined ? updatedFields.stage : p.stage;
        const nextProgress = updatedFields.progress !== undefined ? updatedFields.progress : p.progress;

        let maxPos = -1;
        if (nextStatus === "Completed" || nextProgress >= 100 || nextStage >= 5) maxPos = 4;
        else if (nextProgress >= 80 || nextStage >= 4) maxPos = 3;
        else if (nextProgress >= 60 || nextStage >= 3) maxPos = 2;
        else if (nextProgress >= 40 || nextStage >= 2) maxPos = 1;
        else if (nextProgress >= 20 || nextStage >= 1) maxPos = 0;

        const newMilestoneLogs = [];
        if (p.milestones) {
          for (let idx = 0; idx < p.milestones.length; idx++) {
            if (!p.milestones[idx].completed && idx <= maxPos) {
              const mMsg = `Milestone Achieved: ${p.milestones[idx].name}`;
              addProjectActivityLog(projectId, mMsg).catch(console.warn);
              newMilestoneLogs.unshift({ action: mMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() });
            }
          }
        }

        const activityLogsToPrepend = [...newMilestoneLogs];
        if (updatedFields.progress !== undefined && updatedFields.progress !== p.progress) {
          const progMsg = `Progress Updated to ${updatedFields.progress}%`;
          addProjectActivityLog(projectId, progMsg).catch(console.warn);
          activityLogsToPrepend.unshift({ action: progMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() });
        }

        const updatedMilestones = (p.milestones || []).map((m, idx) => ({
          ...m,
          completed: idx <= maxPos
        }));

        return {
          ...p,
          ...updatedFields,
          milestones: updatedMilestones,
          activityLog: [
            ...activityLogsToPrepend,
            ...(p.activityLog || [])
          ]
        };
      }
      return p;
    }));

    setSelectedKanbanProject(prev => {
      if (prev && prev.id === projectId) {
        const nextStatus = updatedFields.status || prev.status;
        const nextStage = updatedFields.stage !== undefined ? updatedFields.stage : prev.stage;
        const nextProgress = updatedFields.progress !== undefined ? updatedFields.progress : prev.progress;

        let maxPos = -1;
        if (nextStatus === "Completed" || nextProgress >= 100 || nextStage >= 5) maxPos = 4;
        else if (nextProgress >= 80 || nextStage >= 4) maxPos = 3;
        else if (nextProgress >= 60 || nextStage >= 3) maxPos = 2;
        else if (nextProgress >= 40 || nextStage >= 2) maxPos = 1;
        else if (nextProgress >= 20 || nextStage >= 1) maxPos = 0;

        const updatedMilestones = (prev.milestones || []).map((m, idx) => ({
          ...m,
          completed: idx <= maxPos
        }));

        return {
          ...prev,
          ...updatedFields,
          milestones: updatedMilestones
        };
      }
      return prev;
    });
  };

  const handleUpdateProjectProgressHandy = async (projectId, newProgress) => {
    const project = ignitionQueue.find(p => p.id === projectId);
    if (!project) return;

    const baseQuote = parseFloat(project.quote) || 0;
    const discountVal = parseFloat(project.discount) || 0;
    const finalQuote = baseQuote - discountVal;
    const adv = parseFloat(project.advanceAmount) || 0;

    if (newProgress === 100) {
      const remainingAmt = Math.max(0, finalQuote - adv);
      setCustomPaymentPrompt({
        p: { ...project, status: 'Completed', stage: 5, progress: 100, paymentStatus: 'paid' },
        finalQuote: finalQuote,
        defaultAmt: remainingAmt,
        adv: adv,
        paymentMode: 'UPI'
      });
      return; // Return early, do not update database or state until confirmed
    }

    let updatedFields = {
      progress: newProgress
    };

    if (newProgress === 20) updatedFields.stage = 1;
    else if (newProgress === 40) updatedFields.stage = 2;
    else if (newProgress === 60) updatedFields.stage = 3;
    else if (newProgress === 80) updatedFields.stage = 4;

    try {
      await updateProjectState(projectId, updatedFields);
      
      const actionMsg = `Progress Updated to ${newProgress}%`;
      await addProjectActivityLog(projectId, actionMsg);

      let maxPos = -1;
      const nextStageCalc = updatedFields.stage !== undefined ? updatedFields.stage : project.stage;
      const nextStatusCalc = nextStageCalc === 4 && newProgress === 100 ? "Completed" : project.status;
      
      if (nextStatusCalc === "Completed" || newProgress >= 100 || nextStageCalc >= 5) maxPos = 4;
      else if (newProgress >= 80 || nextStageCalc >= 4) maxPos = 3;
      else if (newProgress >= 60 || nextStageCalc >= 3) maxPos = 2;
      else if (newProgress >= 40 || nextStageCalc >= 2) maxPos = 1;
      else if (newProgress >= 20 || nextStageCalc >= 1) maxPos = 0;

      const newMilestoneLogs = [];
      if (project.milestones) {
        for (let idx = 0; idx < project.milestones.length; idx++) {
          if (!project.milestones[idx].completed && idx <= maxPos) {
            const mMsg = `Milestone Achieved: ${project.milestones[idx].name}`;
            await addProjectActivityLog(projectId, mMsg);
            newMilestoneLogs.unshift({ action: mMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() });
          }
        }
      }

      setIgnitionQueue(prev => prev.map(p => {
        if (p.id === projectId) {
          const nextStage = updatedFields.stage !== undefined ? updatedFields.stage : p.stage;
          const nextStatus = nextStage === 4 && newProgress === 100 ? "Completed" : p.status;

          const updatedMilestones = (p.milestones || []).map((m, idx) => ({
            ...m,
            completed: idx <= maxPos
          }));

          return {
            ...p,
            ...updatedFields,
            milestones: updatedMilestones,
            activityLog: [
              ...newMilestoneLogs,
              { action: actionMsg, time: new Date().toLocaleTimeString(), raw_date: new Date().getTime() },
              ...(p.activityLog || [])
            ]
          };
        }
        return p;
      }));

      setSelectedKanbanProject(prev => {
        if (prev && prev.id === projectId) {
          const nextStage = updatedFields.stage !== undefined ? updatedFields.stage : prev.stage;
          const nextStatus = nextStage === 4 && newProgress === 100 ? "Completed" : prev.status;

          let maxPos = -1;
          if (nextStatus === "Completed" || newProgress >= 100 || nextStage >= 5) maxPos = 4;
          else if (newProgress >= 80 || nextStage >= 4) maxPos = 3;
          else if (newProgress >= 60 || nextStage >= 3) maxPos = 2;
          else if (newProgress >= 40 || nextStage >= 2) maxPos = 1;
          else if (newProgress >= 20 || nextStage >= 1) maxPos = 0;

          const updatedMilestones = (prev.milestones || []).map((m, idx) => ({
            ...m,
            completed: idx <= maxPos
          }));

          return {
            ...prev,
            ...updatedFields,
            milestones: updatedMilestones
          };
        }
        return prev;
      });
      toast({
        title: "Project Progress Calibrated",
        description: `Successfully updated progress to ${newProgress}%.`
      });
    } catch (err) {
      console.warn("Failed to update project progress in Supabase:", err);
    }
  };



  const handleUpdateCashbookEntry = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    let category = formData.get('category');
    if (category === 'CUSTOM') {
      category = formData.get('customCategory')?.trim() || 'Other';
    }
    const updatedEntry = {
      ...selectedCashbookEntry,
      date: formData.get('date'),
      desc: formData.get('desc'),
      amount: parseFloat(formData.get('amount')),
      type: formData.get('type'),
      mode: formData.get('mode'),
      category: category,
      details: formData.get('details')?.trim() || ""
    };
    setCashbookEntries(prev => prev.map(entry => entry.id === selectedCashbookEntry.id ? updatedEntry : entry));
    setIsCashbookEditModalOpen(false);
    setSelectedCashbookEntry(null);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      // 1. Fetch fresh clients from DB to check uniqueness and keep state synchronized
      const dbClients = await getClients();
      const freshClients = dbClients ? dbClients.map(c => ({
        ...c,
        joinedDate: c.joined_date || c.joinedDate,
        accessKey: c.access_key || c.accessKey
      })) : [];

      setClients(freshClients);
      localStorage.setItem('netra_clients', JSON.stringify(freshClients));

      const rawName = formData.get('name')?.trim();
      const rawEmail = formData.get('email')?.trim();
      const rawPhone = formData.get('phone')?.trim();
      const rawAddress = formData.get('address')?.trim();
      const gst = formData.get('gst') || '';
      const rawAccessKey = formData.get('accessKey')?.trim().toUpperCase();
      const rawStatus = formData.get('status') || 'Active';

      if (!rawName) {
        alert("Please enter a valid client name.");
        return;
      }

      // Generate a unique fallback email if empty to satisfy UNIQUE NOT NULL DB constraint
      const emailVal = rawEmail || `${rawName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}@netra.graphics`;
      const passcodeVal = rawAccessKey || clientModalPasscode;

      if (selectedClient) {
        // Check if another client has this email
        const duplicateClient = freshClients.find(c => c.id !== selectedClient.id && c.email.toLowerCase() === emailVal.toLowerCase());
        if (duplicateClient) {
          alert(`Error: A client with the email "${emailVal}" already exists (Client name: ${duplicateClient.name}). Please use a unique email.`);
          return;
        }

        const clientData = {
          name: rawName,
          email: emailVal,
          phone: rawPhone,
          address: rawAddress,
          gst: gst,
          status: rawStatus,
          accessKey: passcodeVal
        };

        const updatedClient = await updateClientProfile(selectedClient.id, clientData);
        
        setClients(prev => {
          const next = prev.map(c => c.id === selectedClient.id ? {
            ...updatedClient,
            joinedDate: updatedClient.joined_date || updatedClient.joinedDate,
            accessKey: updatedClient.access_key || updatedClient.accessKey,
            status: updatedClient.status || updatedClient.status
          } : c);
          localStorage.setItem("netra_clients", JSON.stringify(next));
          return next;
        });
        toast({ title: "Client Updated Successfully", description: `Updated visionary: ${clientData.name}` });
      } else {
        // Check if a client with this email already exists
        const duplicateClient = freshClients.find(c => c.email.toLowerCase() === emailVal.toLowerCase());
        if (duplicateClient) {
          alert(`Error: A client with the email "${emailVal}" already exists (Client name: ${duplicateClient.name}). Please use a unique email or edit the existing client.`);
          return;
        }

        const clientData = {
          name: rawName,
          email: emailVal,
          phone: rawPhone,
          address: rawAddress,
          gst: gst,
          status: 'Active',
          accessKey: passcodeVal || Math.random().toString(36).substring(2, 8).toUpperCase()
        };

        const newClient = await createClientProfile(clientData);

        setClients(prev => {
          const next = [...prev, {
            ...newClient,
            joinedDate: newClient.joined_date || newClient.joinedDate,
            accessKey: newClient.access_key || newClient.accessKey
          }];
          localStorage.setItem("netra_clients", JSON.stringify(next));
          return next;
        });
        toast({ title: "Client Registered Successfully", description: `Onboarded visionary: ${clientData.name}` });
      }
    } catch (err) {
      console.error("Failed to save client:", err);
      alert("Failed to save client record: " + (err.message || err.details || JSON.stringify(err)));
    }

    setIsClientModalOpen(false);
    setSelectedClient(null);
    setClientModalPasscode("");
  };

  const deleteClient = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO EXTINGUISH THIS CLIENT RECORD?")) {
      try {
        const clientToDelete = clients.find(c => c.id === id);
        if (clientToDelete) {
          setTrashItems(prev => [
            ...prev,
            {
              id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: "client",
              deletedAt: new Date().toISOString(),
              data: clientToDelete
            }
          ]);
        }
        try {
          const { error } = await supabase.from('clients').delete().eq('id', id);
          if (error) throw error;
        } catch (dbErr) {
          console.warn("Supabase delete failed, falling back to local memory:", dbErr);
        }
        setClients(prev => {
          const next = prev.filter(c => c.id !== id);
          localStorage.setItem("netra_clients", JSON.stringify(next));
          return next;
        });
        toast({ title: "Client Deleted Successfully" });
      } catch (err) {
        console.error("Failed to delete client:", err);
        alert("Failed to delete client record: " + (err.message || err.details || JSON.stringify(err)));
      }
    }
  };

  const restoreItem = async (trashId) => {
    const item = trashItems.find(it => it.id === trashId);
    if (!item) return;

    try {
      if (item.type === 'client') {
        const clientData = item.data;
        const { error } = await supabase.from('clients').insert([{
          id: clientData.id,
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          access_key: clientData.accessKey || clientData.access_key,
          status: clientData.status || 'Active',
          gst: clientData.gst || null,
          joined_date: clientData.joinedDate || clientData.joined_date || new Date().toISOString()
        }]);
        if (error) throw error;

        setClients(prev => {
          const next = [...prev, {
            ...clientData,
            joinedDate: clientData.joinedDate || clientData.joined_date || new Date().toISOString(),
            accessKey: clientData.accessKey || clientData.access_key
          }];
          localStorage.setItem("netra_clients", JSON.stringify(next));
          return next;
        });
        toast({ title: "Client Restored", description: `${clientData.name} has been recovered.` });

      } else if (item.type === 'project') {
        const { project: p, strategy, purgedInvoices, purgedEntries } = item.data;
        
        const desc = p.description || '';
        const serializedDesc = desc.startsWith("JSON_METADATA:") 
          ? desc 
          : `JSON_METADATA:${JSON.stringify({
              qty: p.qty || 1,
              rate: p.rate || (p.quote / (p.qty || 1)),
              description: desc
            })}`;

        const { error: pError } = await supabase.from('projects').insert([{
          id: p.id,
          name: p.name,
          service: p.service,
          stage: p.stage || 1,
          status: p.status || 'Ongoing',
          quote: p.quote,
          discount: p.discount || 0,
          discount_value: p.discountValue || p.discount_value,
          discount_type: p.discountType || p.discount_type || 'rs',
          advance_amount: p.advanceAmount || p.advance_amount || 0,
          payment_status: p.paymentStatus || p.payment_status || 'part',
          deadline: p.deadline,
          client_id: p.client?.id || p.client_id,
          description: serializedDesc,
          category: p.category || 'branding',
          progress: Math.max(20, p.progress || 0),
          created_at: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString()
        }]);
        if (pError) throw pError;

        if (p.milestones && p.milestones.length > 0) {
          const milestonesToInsert = p.milestones.map((m, idx) => ({
            project_id: p.id,
            name: m.name,
            completed: m.completed || false,
            position: idx
          }));
          await supabase.from('project_milestones').insert(milestonesToInsert);
        }

        if (p.activityLog && p.activityLog.length > 0) {
          const logsToInsert = p.activityLog.map(l => ({
            project_id: p.id,
            action: l.action,
            created_at: l.time ? new Date().toISOString() : undefined
          }));
          await supabase.from('project_activity_logs').insert(logsToInsert);
        }

        if (p.collaborationStream && p.collaborationStream.length > 0) {
          const chatsToInsert = p.collaborationStream.map(c => ({
            id: c.id,
            project_id: p.id,
            sender: c.sender,
            message: c.text
          }));
          await supabase.from('project_chats').insert(chatsToInsert);
        }

        if (p.mediaVault && p.mediaVault.length > 0) {
          const mediaToInsert = p.mediaVault.map(m => ({
            id: m.id,
            project_id: p.id,
            file_name: m.name,
            file_url: m.url,
            file_type: m.type
          }));
          await supabase.from('project_media').insert(mediaToInsert);
        }

        if (strategy === 'purge') {
          if (purgedInvoices && purgedInvoices.length > 0) {
            for (const inv of purgedInvoices) {
              await supabase.from('invoices').insert({
                id: inv.id,
                invoice_no: inv.invoiceNo || inv.invoice_no,
                project_id: inv.projectId || inv.project_id || p.id,
                client_name: inv.clientName || inv.client_name,
                project_service: inv.projectService || inv.project_service,
                issue_date: (inv.issueDate && !isNaN(new Date(inv.issueDate).getTime()))
                  ? getISTDateString(inv.issueDate)
                  : getISTDateString(),
                grand_total: inv.grandTotal || inv.grand_total,
                created_at: inv.createdAt ? new Date(inv.createdAt).toISOString() : undefined
              });
            }
            setInvoices(prev => [...purgedInvoices, ...prev]);
          }

          if (purgedEntries && purgedEntries.length > 0) {
            setCashbookEntries(prev => [...purgedEntries, ...prev]);
          }
        }

        setIgnitionQueue(prev => {
          if (prev.some(x => x.id === p.id)) return prev;
          return [p, ...prev];
        });
        toast({ title: "Project Restored", description: `${p.name} workspace fully restored.` });

      } else if (item.type === 'invoice') {
        const { invoice: inv, strategy, purgedEntries } = item.data;
        const { error } = await supabase.from('invoices').insert({
          id: inv.id,
          invoice_no: inv.invoiceNo || inv.invoice_no,
          project_id: inv.projectId || inv.project_id,
          client_name: inv.clientName || inv.client_name,
          project_service: inv.projectService || inv.project_service,
          issue_date: (inv.issueDate && !isNaN(new Date(inv.issueDate).getTime()))
            ? getISTDateString(inv.issueDate)
            : getISTDateString(),
          grand_total: inv.grandTotal || inv.grand_total,
          created_at: inv.createdAt ? new Date(inv.createdAt).toISOString() : undefined
        });
        if (error) throw error;

        setInvoices(prev => [inv, ...prev]);

        if (strategy === 'purge' && purgedEntries && purgedEntries.length > 0) {
          setCashbookEntries(prev => [...purgedEntries, ...prev]);
        }

        toast({ title: "Invoice Restored", description: `Invoice NG/${inv.invoiceNo} restored.` });

      } else if (item.type === 'invoice_batch') {
        const { invoices: invs, strategy, purgedEntries } = item.data;
        for (const inv of invs) {
          await supabase.from('invoices').insert({
            id: inv.id,
            invoice_no: inv.invoiceNo || inv.invoice_no,
            project_id: inv.projectId || inv.project_id,
            client_name: inv.clientName || inv.client_name,
            project_service: inv.projectService || inv.project_service,
            issue_date: (inv.issueDate && !isNaN(new Date(inv.issueDate).getTime()))
              ? getISTDateString(inv.issueDate)
              : getISTDateString(),
            grand_total: inv.grandTotal || inv.grand_total,
            created_at: inv.createdAt ? new Date(inv.createdAt).toISOString() : undefined
          });
        }

        setInvoices(prev => [...invs, ...prev]);

        if (strategy === 'purge' && purgedEntries && purgedEntries.length > 0) {
          setCashbookEntries(prev => [...purgedEntries, ...prev]);
        }

        toast({ title: "Batch Invoices Restored", description: `${invs.length} invoices restored.` });

      } else if (item.type === 'cashbook') {
        const entry = item.data;
        setCashbookEntries(prev => [entry, ...prev]);
        toast({ title: "Cashbook Record Restored", description: `${entry.desc} added back to ledger.` });
      }

      setTrashItems(prev => prev.filter(it => it.id !== trashId));

    } catch (err) {
      console.error("Failed to restore item:", err);
      toast({
        title: "Restoration Failed",
        description: err.message || "An error occurred while writing back to database.",
        variant: "destructive"
      });
    }
  };

  const handleCloseSuccessDialog = () => {
    if (successTimerId) {
      clearTimeout(successTimerId);
      setSuccessTimerId(null);
    }
    setShowSuccessDialog(false);
    goHome();
  };

  const handleSendSpark = async (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('name').value;
    const emailVal = document.getElementById('email').value;
    const phoneVal = document.getElementById('phone').value;
    const visionVal = document.getElementById('vision').value;
    
    let serviceVal = selectedProject || "General Inquiry";
    if (selectedProject === "Other / Custom Service") {
      const customInput = document.getElementById('custom-service-input');
      if (customInput && customInput.value.trim()) {
        serviceVal = customInput.value.trim();
      } else {
        serviceVal = "Custom Service";
      }
    }

    // Strip leading zeros from phone number to ensure WhatsApp redirection compatibility
    let cleanedPhoneVal = phoneVal.trim();
    while (cleanedPhoneVal.startsWith('0')) {
      cleanedPhoneVal = cleanedPhoneVal.substring(1);
    }

    try {
      await createInquiry({
        name: nameVal,
        email: emailVal,
        phone: cleanedPhoneVal,
        service: serviceVal,
        desc: visionVal,
        status: 'New Spark'
      });
      const dbInquiries = await getInquiries();
      setInquiries(dbInquiries);

      // Clear input elements
      document.getElementById('name').value = '';
      document.getElementById('email').value = '';
      document.getElementById('phone').value = '';
      document.getElementById('vision').value = '';
      setSelectedProject("");
    } catch (err) {
      console.error("Error creating inquiry spark:", err);
    }

    setShowSuccessDialog(true);
    const timer = setTimeout(() => {
      // Use the function directly to close dialog after 10s
      setShowSuccessDialog(false);
      goHome();
    }, 10000);
    setSuccessTimerId(timer);
  };


  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <datalist id="services-list">
          {services.map(s => (
            <option key={s.id} value={s.title} />
          ))}
        </datalist>
        <div className={`app-container ${isVaultActive ? 'vault-active' : ''} ${theme === 'dark' ? 'dark' : ''}`} ref={containerRef}>
          {/* Side-aligned Sidebar (Only shown when a module is open) */}
          {isCommandCenterActive && isAdminGridActive && (
            <>
              <button
                className="admin-mobile-toggle"
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                aria-label="Toggle Navigation Menu"
              >
                {isMobileSidebarOpen ? <LogOut className="w-5 h-5" style={{ transform: 'rotate(180deg)' }} /> : <Menu className="w-5 h-5" />}
              </button>
              {isMobileSidebarOpen && (
                <div
                  className="sidebar-mobile-overlay"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
              )}
              <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
                <button
                  className="sidebar-branding"
                  onClick={() => {
                    setIsAdminGridActive(false);
                    setIsMobileSidebarOpen(false);
                    pushPageToHistory('admin', { activeAdminModule: 'DASHBOARD', isAdminGridActive: false });
                  }}
                  title="Return to Administrative Modules"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                >
                  <img src="/logo.png" alt="Netra Logo" className="sidebar-logo-img" />
                  <span className="sidebar-branding-text">NETRA</span>
                </button>

                <nav className="sidebar-menu">
                  {[
                    { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
                    { id: "PROJECTS", label: "Projects", icon: Folder },
                    { id: "INQUIRIES", label: "Inquiries", icon: Inbox, badge: showInquiryBadge },
                    { id: "CLIENTS", label: "Clients", icon: Users },
                    { id: "INVOICES", label: "Invoice Vault", icon: FileText },
                    { id: "FINANCIALS", label: "Financials", icon: Coins },
                    { id: "SETTINGS", label: "Settings", icon: Settings }
                  ].map((link) => {
                    const isActive = activeAdminModule === link.id;
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.id}
                        href="#"
                        className={`sidebar-menu-link ${isActive ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveAdminModule(link.id);
                          setIsAdminGridActive(true);
                          setIsIgnitionModalOpen(false); // Auto-close modal on navigation
                          setIsMobileSidebarOpen(false); // Auto-close mobile sidebar drawer
                          if (link.id === "INQUIRIES") setShowInquiryBadge(false);
                          setProjectsSearchQuery("");
                          setInquiriesSearchQuery("");
                          pushPageToHistory('admin', { activeAdminModule: link.id, isAdminGridActive: true });
                        }}
                        data-testid={`link-sidebar-${link.label.toLowerCase()}`}
                      >
                        <Icon className={`sidebar-link-icon ${isActive ? 'text-[#00E5FF]' : ''}`} />
                        <span className="sidebar-link-label">{link.label}</span>
                        {link.badge && (
                          <span className="sidebar-notification-dot"></span>
                        )}
                      </a>
                    );
                  })}
                </nav>

                <div className="sidebar-footer">
                  <div className="sidebar-notifications-trigger" onClick={() => { setIsNotificationOpen(true); setIsMobileSidebarOpen(false); }}>
                    <div className={`notification-bell-wrapper ${((sparks.length + flames.length) > 0 || bellPulse) ? 'has-alerts' : ''}`}>
                      <svg className="bell-icon" viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                      </svg>
                      {(sparks.length + flames.length) > 0 && (
                        <span className="bell-badge">{sparks.length + flames.length}</span>
                      )}
                    </div>
                    <span className="notifications-label">SYSTEM ALERTS</span>
                  </div>

                  <a href="#" className="sidebar-logout-btn" onClick={(e) => { handleLogout(e); setIsMobileSidebarOpen(false); }}>
                    <LogOut className="w-4 h-4" />
                    <span>LOGOUT</span>
                  </a>

                  <div className="sidebar-version-tag">
                    <p className="v-title">Netra OS v2.5.1</p>
                    <p className="v-status">Systems online.</p>
                  </div>
                </div>
              </aside>
            </>
          )}

          {/* Floating Sound Controls — shown on login, admin & client vault pages where public header is hidden */}
          {(isLoginActive || isCommandCenterActive || isClientVaultActive) && (
            <div className="floating-sound-controls">
              <button
                className={`floating-sound-btn ${isPlaying ? 'active' : ''}`}
                onClick={toggleSound}
                title={isPlaying ? 'Mute Ambient Track' : 'Play Ambient Track'}
              >
                <div className={`sound-waves ${isPlaying ? 'playing' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
              <div className="floating-sound-divider" />
              <button
                className={`floating-click-btn ${clickSoundEnabled ? 'active' : ''} ${!isPlaying ? 'disabled' : ''}`}
                onClick={toggleClickSound}
                title={!isPlaying ? 'Enable music first' : clickSoundEnabled ? 'Disable Click Sounds' : 'Enable Click Sounds'}
              >
                {clickSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Fixed Public Header */}
          {!isCommandCenterActive && !isClientVaultActive && !isLoginActive && (
            <header className={`main-header ${headerVisible ? 'header-reveal' : 'header-hidden'} ${isNavVertical ? 'vision-mode nav-vertical' : ''}`}>
              <nav className="header-nav">
                <div
                  className={`branding-container ${(isVaultActive && !isContactActive && !isLoginActive) ? 'logo-middle' : ''}`}
                  onClick={goHome}
                >
                  <motion.span layout className="branding-text word-netra">NETRA</motion.span>
                  <motion.div layout className="logo-asset-wrapper">
                    <img src="/logo.png" alt="Netra Logo" className="branding-logo" />
                    <div className="radiant-glow"></div>
                  </motion.div>
                  <motion.span layout className="branding-text word-graphics">GRAPHICS</motion.span>
                </div>
                <div className="menu-container desktop-menu">
                  <a href="#" className="menu-link" title="HOME" onClick={(e) => { e.preventDefault(); goHome(); }}>
                    <Home className="menu-icon" />
                    <span className="menu-text">HOME</span>
                  </a>
                  <span className="menu-divider"></span>
                  <a href="#" className="menu-link" title="SERVICES" onClick={(e) => { e.preventDefault(); goToServices(); }}>
                    <Briefcase className="menu-icon" />
                    <span className="menu-text">SERVICES</span>
                  </a>
                  <span className="menu-divider"></span>
                  <a href="#" className="menu-link" title="VISION" onClick={(e) => { e.preventDefault(); goToVision(); }}>
                    <Eye className="menu-icon" />
                    <span className="menu-text">VISION</span>
                  </a>
                  <span className="menu-divider"></span>
                  <a href="#" className="menu-link" title="CONTACT US" onClick={(e) => { e.preventDefault(); goToContact(); }}>
                    <Mail className="menu-icon" />
                    <span className="menu-text">CONTACT US</span>
                  </a>
                  <span className="menu-divider"></span>
                  <a href="#" className="menu-link" title="LOGIN" onClick={(e) => { e.preventDefault(); goToLogin(); }}>
                    <LogIn className="menu-icon" />
                    <span className="menu-text">LOGIN</span>
                  </a>
                  <span className="menu-divider"></span>
                  <button className="sound-toggle-btn" onClick={toggleSound} title={isPlaying ? "Mute Ambient Track" : "Play Ambient Track"}>
                    <div className={`sound-waves ${isPlaying ? 'playing' : ''}`}>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </button>
                  <button
                    className={`click-sound-toggle-btn ${clickSoundEnabled ? 'active' : ''} ${!isPlaying ? 'disabled' : ''}`}
                    onClick={toggleClickSound}
                    title={!isPlaying ? "Enable music first to use click sounds" : clickSoundEnabled ? "Disable Click Sounds" : "Enable Click Sounds"}
                  >
                    {clickSoundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {/* Mobile Menu Toggle Button */}
                <button
                  className="mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </nav>

              {/* Mobile Drawer Overlay */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="mobile-menu-drawer"
                  >
                    <div className="mobile-menu-links">
                      <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goHome(); setMobileMenuOpen(false); }}>
                        <Home className="w-4 h-4" />
                        <span className="mobile-link-text">HOME</span>
                      </a>
                      <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goToServices(); setMobileMenuOpen(false); }}>
                        <Briefcase className="w-4 h-4" />
                        <span className="mobile-link-text">SERVICES</span>
                      </a>
                      <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goToVision(); setMobileMenuOpen(false); }}>
                        <Eye className="w-4 h-4" />
                        <span className="mobile-link-text">VISION</span>
                      </a>
                      <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goToContact(); setMobileMenuOpen(false); }}>
                        <Mail className="w-4 h-4" />
                        <span className="mobile-link-text">CONTACT US</span>
                      </a>
                      <a href="#" className="mobile-menu-link" onClick={(e) => { e.preventDefault(); goToLogin(); setMobileMenuOpen(false); }}>
                        <LogIn className="w-4 h-4" />
                        <span className="mobile-link-text">LOGIN</span>
                      </a>

                      <div className="mobile-menu-controls">
                        <div className="mobile-control-row">
                          <span className="control-label">Ambient Audio</span>
                          <button className="sound-toggle-btn" onClick={toggleSound} title={isPlaying ? "Mute Ambient Track" : "Play Ambient Track"}>
                            <div className={`sound-waves ${isPlaying ? 'playing' : ''}`}>
                              <span></span>
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </button>
                        </div>
                        <div className="mobile-control-row">
                          <span className="control-label">Click Sounds</span>
                          <button
                            className={`click-sound-toggle-btn ${clickSoundEnabled ? 'active' : ''} ${!isPlaying ? 'disabled' : ''}`}
                            onClick={toggleClickSound}
                          >
                            {clickSoundEnabled ? (
                              <Volume2 className="w-4 h-4" />
                            ) : (
                              <VolumeX className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>
          )}

          {/* Landing Experience */}
          {!isLoginActive && !isCommandCenterActive && !isClientVaultActive && (
            <>
              {/* Hero Page */}
              <section className={`hero-page ${isVaultActive ? 'slide-up' : ''} ${(isVaultActive && !isTransitioning) ? 'hidden-when-vault' : ''}`}>
                <div
                  className="fluid-background"
                  style={{ '--mouse-x': `${mousePos.x}%`, '--mouse-y': `${mousePos.y}%` }}
                >
                  <div className="gradient-sphere sphere-1"></div>
                  <div className="gradient-sphere sphere-2"></div>
                  <div className="grid-texture"></div>
                </div>

                <section className={`hero-section ${revealStarted ? 'clear' : 'blurred'}`}>
                  <div className="hero-content">
                    <h1 className="main-headline">
                      {"NETRA".split("").map((letter, idx) => (
                        <span key={idx} className={`stagger-letter ${headlineActive ? 'animate' : ''}`} style={{ '--delay': `${idx * 0.1}s` }}>
                          {letter}
                        </span>
                      ))}
                    </h1>
                    <div className="hero-info">
                      <p className={`hero-tagline ${taglineActive ? 'fade-in' : ''}`}>VISUAL INTELLIGENCE & DESIGN</p>
                      <div className={`mission-statement ${missionActive ? 'fade-in-blur' : ''}`}>
                        We don't just create designs—we ignite visual revolutions. <br />
                        From the spark of an idea to the flame of execution, we transform brands into legendary experiences.
                      </div>
                    </div>
                  </div>
                  <div className={`scroll-beacon ${missionActive ? 'visible' : ''}`}>
                    <div className="beacon-content">
                      <span className="arrow">↓</span>
                      <span className="beacon-text">SCROLL TO EXPLORE</span>
                    </div>
                  </div>
                </section>
              </section>

              {/* Service Vault Page / Netra-Showcase */}
              <section className={`vault-page ${isVaultActive ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`} ref={vaultRef}>
                {isVaultActive && (
                  <Suspense fallback={<PageLoader />}>
                    <Portfolio
                      onContactClick={goToContact}
                      visionSettings={visionSettings}
                      servicesList={servicesList}
                    />
                  </Suspense>
                )}
              </section>

              {/* Vision in Progress Overlay (Maintenance State) */}
              <AnimatePresence>
                {showConstruction && selectedService && (
                  <motion.div
                    className="vision-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setShowConstruction(false);
                      setSelectedService(null);
                      const currentState = window.history.state;
                      if (currentState && currentState.page === 'services' && currentState.serviceId) {
                        window.history.back();
                      }
                    }}
                  >
                    <motion.div
                      className="service-detail-popup"
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 30 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Close Button */}
                      <button
                        className="popup-close-btn"
                        onClick={() => {
                          setShowConstruction(false);
                          setSelectedService(null);
                          const currentState = window.history.state;
                          if (currentState && currentState.page === 'services' && currentState.serviceId) {
                            window.history.back();
                          }
                        }}
                        aria-label="Close details"
                      >
                        &times;
                      </button>

                      {/* Top Row: Icon and Tag */}
                      <div className="popup-header-row">
                        <div className="popup-icon-container">
                          <span className="popup-service-icon">{selectedService.icon}</span>
                        </div>
                        {selectedService.tag && (
                          <span className="popup-service-tag">{selectedService.tag}</span>
                        )}
                      </div>

                      {/* Title and Description */}
                      <h2 className="popup-service-title">{selectedService.title}</h2>
                      <p className="popup-service-desc">{selectedService.desc}</p>

                      {/* Features List */}
                      <ul className="popup-features-list">
                        {selectedService.features && selectedService.features.map((feature, i) => (
                          <li key={i} className="popup-feature-item">
                            <span className="cyan-bullet-ring">
                              <span className="cyan-bullet-dot"></span>
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Divider */}
                      <div className="popup-divider"></div>

                      {/* Footer Pricing / Delivery details */}
                      <div className="popup-footer-row">
                        <div className="popup-footer-col">
                          <span className="popup-footer-label">STARTING AT</span>
                          <span className="popup-footer-value price">{selectedService.price}</span>
                        </div>
                        <div className="popup-footer-col text-right">
                          <span className="popup-footer-label">DELIVERY</span>
                          <span className="popup-footer-value">{selectedService.delivery}</span>
                        </div>
                      </div>

                      {/* Action CTA Buttons */}
                      <div className="popup-cta-container">
                        {selectedService.slideshow && selectedService.slideshow.length > 0 && (
                          <button
                            className="popup-cta-btn secondary"
                            onClick={() => {
                              setActiveServiceSlideshow(selectedService);
                              pushPageToHistory('services', { serviceId: selectedService.id, viewWork: true });
                            }}
                          >
                            View Our Work
                          </button>
                        )}
                        <button
                          className="popup-cta-btn"
                          onClick={() => {
                            setShowConstruction(false);
                            setSelectedService(null);
                            goToContact();
                          }}
                        >
                          Get Started
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Services Catalogue Page */}
              <section className={`services-page ${isServicesActive ? 'active' : ''}`}>
                {/* Grid */}

                {/* Grid */}
                <div className="services-page-body">
                  <div className="service-grid">
                    {services.map((s, i) => (
                      <motion.div
                        key={s.id}
                        className="service-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isServicesActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => {
                          setSelectedService(s);
                          setShowConstruction(true);
                          pushPageToHistory('services', { serviceId: s.id });
                        }}
                      >
                        {s.tag && (
                          <span className="service-card-tag">{s.tag}</span>
                        )}
                        <div className="card-visual">{s.icon}</div>
                        <div className="card-info">
                          <h3 className="service-name">{s.title}</h3>
                          <p className="service-desc">{s.desc}</p>
                        </div>
                        <span className="inquiry-icon" data-tooltip="View Details">
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3 15L15 3M15 3H7M15 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Contact Portal Page */}
              <section className={`contact-page ${isContactActive ? 'active' : ''}`}>
                <div className="liquid-metal-bg" style={{ '--mouse-x': `${mousePos.x}%`, '--mouse-y': `${mousePos.y}%` }}>
                  <div className="liquid-overlay"></div>
                </div>

                <div className="contact-content">
                  <motion.div
                    className="contact-header-reveal"
                    initial="hidden"
                    animate={isContactActive ? "visible" : "hidden"}
                    variants={{
                      visible: { transition: { staggerChildren: 0.1 } },
                      hidden: {}
                    }}
                  >
                    <motion.h1
                      className="new-contact-title"
                      variants={{
                        hidden: { opacity: 0, y: -20 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                      }}
                    >
                      LET'S <span className="title-accent">IGNITE</span>
                    </motion.h1>
                    <motion.p
                      className="contact-subtitle"
                      variants={{
                        hidden: { opacity: 0, y: -10 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                      }}
                    >
                      Whether you have a fully formed brief or just a concept, we're ready to collaborate. Reach out and let's craft something extraordinary.
                    </motion.p>
                  </motion.div>

                  <div className="contact-grid-container">
                    {/* Left Column: Form Card */}
                    <div className="contact-form-card">
                      <h2 className="card-title">Send an Inquiry</h2>
                      
                      <form className="inquiry-form-new" onSubmit={handleSendSpark}>
                        <div className="form-row">
                          <div className="form-group-new">
                            <label htmlFor="name">FULL NAME</label>
                            <input type="text" id="name" required placeholder="John Doe" />
                          </div>
                          <div className="form-group-new">
                            <label htmlFor="email">EMAIL ADDRESS</label>
                            <input type="email" id="email" required placeholder="john@company.com" />
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group-new">
                            <label htmlFor="phone">MOBILE / WHATSAPP</label>
                            <input type="tel" id="phone" required placeholder="e.g. 73590 93035" />
                          </div>
                          
                          <div className="form-group-new dropdown-group" ref={dropdownRef}>
                            <label>PROJECT TYPE</label>
                            <div
                              className={`custom-dropdown-new ${selectedProject ? 'has-value' : ''}`}
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                              <span className="selected-value">{selectedProject || "Select project type..."}</span>
                              <div className="dropdown-arrow">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </div>
                            </div>
                            
                            <AnimatePresence>
                              {dropdownOpen && (
                                <motion.div
                                  className="dropdown-list-new"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                >
                                  {services.map((s, i) => (
                                    <div
                                      key={s.id}
                                      className="dropdown-item-new"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedProject(s.title);
                                        setDropdownOpen(false);
                                      }}
                                    >
                                      {s.title}
                                    </div>
                                  ))}
                                  <div
                                    className="dropdown-item-new"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProject("Other / Custom Service");
                                      setDropdownOpen(false);
                                    }}
                                  >
                                    Other / Custom Service
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        
                        {selectedProject === "Other / Custom Service" && (
                          <div className="form-group-new full-width" style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="custom-service-input">SPECIFY CUSTOM SERVICE</label>
                            <input 
                              type="text" 
                              id="custom-service-input" 
                              required 
                              placeholder="e.g. Package Designing, Custom Illustration, etc." 
                            />
                          </div>
                        )}
                        
                        <div className="form-group-new full-width">
                          <label htmlFor="vision">PROJECT DETAILS</label>
                          <textarea
                            id="vision"
                            required
                            placeholder="Tell us about your timeline, budget, and vision..."
                            rows={4}
                          ></textarea>
                        </div>
                        
                        <button type="submit" className="submit-btn-new">
                          Submit Inquiry
                        </button>
                      </form>

                    </div>

                    {/* Right Column: Contact Info */}
                    <div className="contact-info-panel">
                      <h2 className="panel-title">Contact Info</h2>
                      
                      <div className="info-items">
                        <div className="info-item-box">
                          <div className="icon-circle">
                            <Mail className="info-icon" />
                          </div>
                          <div className="info-text">
                            <span className="info-label">EMAIL</span>
                            <a href={`mailto:${adminProfile?.email || "savanhirapra@netragraphics.com"}`} className="info-value hover:underline">
                              {adminProfile?.email || "savanhirapra@netragraphics.com"}
                            </a>
                            <a href="mailto:careers@netragraphics.com" className="info-value hover:underline">
                              careers@netragraphics.com
                            </a>
                          </div>
                        </div>

                        <div className="info-item-box">
                          <div className="icon-circle">
                            <MapPin className="info-icon" />
                          </div>
                          <div className="info-text">
                            <span className="info-label">STUDIO</span>
                            {(() => {
                              const addressParts = (adminProfile?.address || "Shreeji Complex, Opp. AaramGruh, Mendarda-Sasan Road, Mendarda-362260").split(',');
                              const addressLine1 = addressParts.slice(0, 2).join(',').trim();
                              const addressLine2 = addressParts.slice(2).join(',').trim();
                              return (
                                <>
                                  <span className="info-value font-medium">{addressLine1}</span>
                                  <span className="info-value text-gray-400 text-sm">{addressLine2}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="info-item-box">
                          <div className="icon-circle">
                            <Phone className="info-icon" />
                          </div>
                          <div className="info-text">
                            <span className="info-label">PHONE</span>
                            <a href={`tel:${(adminProfile?.phone || "7359093035").replace(/[^0-9+]/g, "")}`} className="info-value hover:underline">
                              {adminProfile?.phone || "+91 73590 93035"}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* New Business Box */}
                      <div className="new-business-box">
                        <h3 className="new-business-title">New Business</h3>
                        <p className="new-business-desc">
                          We are currently accepting new projects for Q3 2026.
                        </p>
                      </div>

                      {/* Social Links (Dynamic Instagram / Whatsapp) */}
                      <div className="contact-social-row">
                        <a href={adminProfile?.instagram ? `https://www.instagram.com/${adminProfile.instagram}` : "https://www.instagram.com/"} target="_blank" rel="noopener noreferrer" className="social-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href={`https://wa.me/${(adminProfile?.phone || "917359093035").replace(/[^0-9]/g, "")}?text=I am interested in starting a visual revolution with Netra Graphics.`} target="_blank" rel="noopener noreferrer" className="social-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <footer className="contact-footer">
                  <div className="footer-watermark">
                    <img src="/image_0.png" alt="Watermark" />
                  </div>
                  <p>© 2026 NETRA GRAPHICS | MENDARDA, GUJARAT | PRECISION IN EVERY PIXEL</p>
                </footer>
              </section>
            </>
          )}

          {/* Login Module Page */}
          <section className={`login-page ${isLoginActive ? 'active' : ''}`}>
            <div
              ref={loginContainerRef}
              className="netra-bg"
            >
              {/* Background Effects */}
              <div className={`cyber-grid ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`} />

              {/* Floating Particles */}
              {loginParticles.map((p) => (
                <motion.div
                  key={p.id}
                  className={`absolute rounded-full ${!isAdminSelected ? 'bg-[#08d9d6]' : 'bg-[#ff2e63]'}`}
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    position: 'absolute',
                    top: `${p.top}%`,
                    left: `${p.left}%`,
                    opacity: 0.25,
                  }}
                  animate={{
                    y: [0, -120],
                    x: [0, p.targetX],
                    opacity: [0, 0.7, 0],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: p.delay,
                  }}
                />
              ))}

              {/* Main Container */}
              <motion.div
                className="perspective-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className={`glass-panel ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`}
                  layout
                >
                  {/* Card Scan Overlay */}
                  <div className={`scan-line-overlay ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`} />

                  {/* Header */}
                  {(() => {
                    const savedAdminKey = localStorage.getItem('netra_saved_admin_key');
                    const savedAdminPass = localStorage.getItem('netra_saved_admin_pass');
                    const savedClientKey = localStorage.getItem('netra_saved_client_key');
                    const savedClientPass = localStorage.getItem('netra_saved_client_pass');
                    const hasSavedCredentials = isAdminSelected
                      ? (!!savedAdminKey && !!savedAdminPass)
                      : (!!savedClientKey && !!savedClientPass);

                    const handleAutoLogin = async () => {
                      if (isAdminSelected) {
                        const k = localStorage.getItem('netra_saved_admin_key');
                        const p = localStorage.getItem('netra_saved_admin_pass');
                        if (k && p) {
                          setAccessKey(k);
                          setPassphrase(p);
                          setLoginError("");
                          try {
                            const { data, error } = await supabase.auth.signInWithPassword({
                              email: k,
                              password: p
                            });
                            if (error) throw error;

                            triggerInstantTransition(() => {
                              clearAllPages();
                              setIsCommandCenterActive(true);
                              setIsAdminGridActive(false);
                              pushPageToHistory('admin', { activeAdminModule: 'DASHBOARD', isAdminGridActive: false });
                              setShowSparkToast(unreadSparksCount > 0);
                            });
                          } catch (err) {
                            console.error("Auto login failed:", err);
                            setLoginError("ACCESS DENIED: " + (err.message || "Invalid credentials"));
                          }
                        }
                      } else {
                        const k = localStorage.getItem('netra_saved_client_key');
                        const p = localStorage.getItem('netra_saved_client_pass');
                        if (k && p) {
                          setAccessKey(k);
                          setPassphrase(p);
                          setLoginError("");
                          try {
                            const clientData = await verifyClientVaultKey(k.trim(), p.trim());
                            if (clientData) {
                              if (clientData.status === 'Suspended') {
                                setLoginError("ACCESS DENIED: This account has been suspended by the administrator.");
                                localStorage.removeItem('netra_saved_client_key');
                                localStorage.removeItem('netra_saved_client_pass');
                                localStorage.removeItem('netra_client_session');
                                setAccessKey("");
                                setPassphrase("");
                                return;
                              }
                              setCurrentClient({
                                ...clientData,
                                joinedDate: clientData.joined_date || clientData.joinedDate,
                                accessKey: clientData.access_key || clientData.accessKey
                              });
                              triggerInstantTransition(() => {
                                clearAllPages();
                                setIsClientVaultActive(true);
                                pushPageToHistory('client-vault');
                              });
                            } else {
                              setLoginError("ACCESS DENIED: Auto-login failed. Invalid saved credentials.");
                            }
                          } catch (err) {
                            console.error("Client auto login failed:", err);
                            setLoginError("VERIFICATION ERROR: " + (err.message || "Failed to connect to database."));
                          }
                        }
                      }
                    };

                    return (
                      <div className="login-header-group">
                        <motion.div
                          className={`login-header-icon-wrapper ${hasSavedCredentials ? 'auto-login-glow cursor-pointer' : ''}`}
                          onClick={hasSavedCredentials ? handleAutoLogin : undefined}
                          title={hasSavedCredentials ? 'Click to Sign In Automatically' : ''}
                          animate={{
                            boxShadow: hasSavedCredentials
                              ? (!isAdminSelected ? ['0 0 5px #08d9d6', '0 0 25px #08d9d6', '0 0 5px #08d9d6'] : ['0 0 5px #ff2e63', '0 0 25px #ff2e63', '0 0 5px #ff2e63'])
                              : (!isAdminSelected ? ['0 0 0px #08d9d6', '0 0 20px #08d9d6', '0 0 0px #08d9d6'] : ['0 0 0px #ff2e63', '0 0 20px #ff2e63', '0 0 0px #ff2e63'])
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          {!isAdminSelected ? <Sparkles className="w-8 h-8 text-[#08d9d6]" /> : <Terminal className="w-8 h-8 text-[#ff2e63]" />}
                        </motion.div>
                        <h1 className="login-header-title">
                          NETRA GRAPHICS
                        </h1>
                        <p className={`login-header-subtitle ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`}>
                          {!isAdminSelected ? 'CLIENT PORTAL' : 'SECURE ADMIN ACCESS'}
                        </p>
                        {hasSavedCredentials && (
                          <p
                            className="text-[10px] text-emerald-400 mt-2 font-bold cursor-pointer hover:underline tracking-widest uppercase"
                            onClick={handleAutoLogin}
                          >
                            ⚡ Click Avatar for Instant Auto Sign-in
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Mode Switcher */}
                  <div className="login-mode-switcher">
                    <motion.div
                      className="login-mode-indicator"
                      style={{
                        backgroundColor: !isAdminSelected ? 'rgba(8, 217, 214, 0.2)' : 'rgba(255, 46, 99, 0.2)'
                      }}
                      animate={{ x: !isAdminSelected ? '100%' : '0%' }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />

                    <button
                      type="button"
                      onClick={() => setIsAdminSelected(true)}
                      className="login-mode-btn"
                      style={{ color: isAdminSelected ? '#ff2e63' : 'rgba(255, 255, 255, 0.5)' }}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdminSelected(false)}
                      className="login-mode-btn"
                      style={{ color: !isAdminSelected ? '#08d9d6' : 'rgba(255, 255, 255, 0.5)' }}
                    >
                      Client
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="login-form-fields">
                    <div className="netra-input-wrapper">
                      <User className="w-4 h-4 input-icon" />
                      <input
                        type="email"
                        placeholder="Identification (Email)"
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                        className={`netra-input ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`}
                        spellCheck={false}
                        required
                      />
                    </div>

                    <div className="netra-input-wrapper">
                      <Lock className="w-4 h-4 input-icon" />
                      <input
                        type={showPassphrase ? 'text' : 'password'}
                        placeholder="Passcode"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className={`netra-input ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="passphrase-toggle-btn"
                      >
                        {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Offer to Save Login checkbox */}
                    <div className="flex flex-col gap-1.5 px-1 pb-2">
                      <div className="flex items-center gap-2 select-none">
                        <input
                          type="checkbox"
                          id="saveLoginCheckbox"
                          checked={saveLoginInfo}
                          onChange={e => setSaveLoginInfo(e.target.checked)}
                          className="rounded border-white/10 bg-white/5 cursor-pointer"
                          style={{ accentColor: !isAdminSelected ? '#08d9d6' : '#ff2e63' }}
                        />
                        <label htmlFor="saveLoginCheckbox" className="text-2xs text-white/50 cursor-pointer hover:text-white/80 transition-colors">
                          Save my login information
                        </label>
                      </div>
                      {!isAdminSelected && (
                        <p className="text-[10px] text-white/40 leading-normal italic pl-0.5 mt-0.5">
                          Don't have an account? Contact your designer for access.
                        </p>
                      )}
                    </div>

                    <AnimatePresence>
                      {loginError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          className="overflow-hidden"
                        >
                          <div className="login-inline-error">
                            <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                            <span>{loginError}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      className={`cyber-button ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`}
                    >
                      <span>Initialize Access</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Return to Home Option */}
                  <div className="login-back-to-home-container">
                    <button
                      type="button"
                      onClick={goHome}
                      className={`login-back-home-btn ${!isAdminSelected ? 'mode-client' : 'mode-admin'}`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Return to Main Frame</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Command Center (Admin View) */}
          <section className={`admin-vault-page ${isCommandCenterActive ? 'active' : ''}`}>
            <div className="admin-view-wrapper">
              <AnimatePresence mode="wait">
                {!isAdminGridActive ? (
                  /* Welcome / Administrative Modules Grid */
                  <motion.div
                    key="welcome"
                    className={`admin-welcome-screen ${hasUrgentAlert ? 'urgent-alarm-theme' : ''}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="aura-ignition-bg">
                      <div className="aura-container">
                        <div className="plasma-sphere plasma-cyan"></div>
                        <div className="plasma-sphere plasma-orange"></div>
                        <div className="plasma-sphere plasma-slate"></div>
                        <div className="aura-pulse-core"></div>
                      </div>
                      <div className="admin-grid-overlay"></div>
                    </div>
                    <div className="vault-content modules-grid-layout">
                      {hasUrgentAlert && (
                        <div 
                          className="flashing-emergency-banner animate-pulse" 
                          onClick={() => {
                            if (flames.length > 0) {
                              setProjectsSearchQuery(flames[0].service || getProjectClientName(flames[0]) || "");
                              setActiveAdminModule("PROJECTS");
                              setIsAdminGridActive(true);
                              setIsWarningDismissed(true);
                              pushPageToHistory('admin', { activeAdminModule: 'PROJECTS', isAdminGridActive: true });
                            } else if (sparks.length > 0) {
                              setInquiriesSearchQuery(sparks[0].name || sparks[0].clientName || "");
                              setActiveAdminModule("INQUIRIES");
                              setIsAdminGridActive(true);
                              setIsWarningDismissed(true);
                              pushPageToHistory('admin', { activeAdminModule: 'INQUIRIES', isAdminGridActive: true });
                            }
                          }}
                        >
                          <span className="emergency-icon">🚨</span>
                          <span className="emergency-text">EMERGENCY ALERTS DETECTED: {flames.length} DEADLINE{flames.length !== 1 ? 'S' : ''} & {sparks.length} NEW SPARK{sparks.length !== 1 ? 'S' : ''} PENDING CALIBRATION</span>
                          <span className="emergency-action-btn">CLICK TO RESOLVE</span>
                        </div>
                      )}
                      <div className="modules-header w-full justify-between pr-4">
                        <div className="flex items-center gap-4">
                          <span className="header-bar"></span>
                          <h2>ADMINISTRATIVE MODULES</h2>
                        </div>
                        <WhatsNewBulb isClientPortal={false} />
                      </div>

                      <div className="admin-cards-grid">
                        {[
                          { id: "DASHBOARD", title: "DASHBOARD", desc: "Global metrics and high-level project status.", icon: "⚡" },
                          { id: "PROJECTS", title: "PROJECTS", desc: "Active project management and media vault.", icon: "📁" },
                          { id: "INQUIRIES", title: "INQUIRIES", desc: "Managing 'Sparks' from the contact portal.", icon: "📥" },
                          { id: "CLIENTS", title: "CLIENTS", desc: "Full CRM database of the Netra network.", icon: "👥" },
                          { id: "INVOICES", title: "INVOICE VAULT", desc: "Interactive standalone invoice workspace & documents ledger.", icon: "📄" },
                          { id: "FINANCIALS", title: "FINANCIALS", desc: "Cashbook ledger, profit analytics and revenue ignition.", icon: "💰" },
                          { id: "SETTINGS", title: "SETTINGS", desc: "Configure service pricing catalogs, portfolio slideshows, banking information, and profile settings.", icon: "⚙️" },
                          { id: "LOGOUT", title: "LOGOUT", desc: "Safe session termination and return to Home.", icon: "🚪" }
                        ].map((card) => (
                          <div
                            key={card.id}
                            className={`admin-module-card ${card.id === "INQUIRIES" && unreadSparksCount > 0 ? 'magic-alert' : ''}`}
                            onClick={() => {
                              if (card.id === "LOGOUT") {
                                handleLogout({ preventDefault: () => { } });
                              } else {
                                setActiveAdminModule(card.id);
                                setIsAdminGridActive(true);
                                if (card.id === "INQUIRIES") {
                                  setUnreadSparksCount(0);
                                  setShowInquiryBadge(false);
                                }
                                pushPageToHistory('admin', { activeAdminModule: card.id, isAdminGridActive: true });
                              }
                            }}
                          >
                            <div className="card-icon">{card.icon}</div>
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-desc">{card.desc}</p>
                            {card.id === "INQUIRIES" && unreadSparksCount > 0 && (
                              <div className="card-magic-badge">NEW SPARKS</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Administrative Modules (Command Grid) */
                  <motion.div
                    key="grid"
                    className="admin-grid-screen sidebar-active"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="aura-ignition-bg">
                      <div className="aura-container">
                        <div className="plasma-sphere plasma-cyan"></div>
                        <div className="plasma-sphere plasma-orange"></div>
                        <div className="plasma-sphere plasma-slate"></div>
                        <div className="aura-pulse-core"></div>
                      </div>
                      <div className="admin-grid-overlay"></div>
                    </div>
                    <div className="vault-content grid-layout">
                      {alertStripMessages.length > 0 && (
                        <div className="w-full overflow-hidden bg-gradient-to-r from-red-950/40 via-amber-950/30 to-red-950/40 border border-red-500/20 rounded-xl px-4 py-2 flex items-center gap-3 relative mb-6 shadow-[0_0_25px_rgba(239,68,68,0.08)] backdrop-blur-md select-none group">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 font-extrabold text-[10px] tracking-wider uppercase shrink-0 animate-pulse">
                            <span>ALERT FEED</span>
                          </div>
                          <div className="relative flex-1 overflow-hidden h-5 flex items-center admin-marquee-container">
                            <div className="absolute whitespace-nowrap flex font-medium text-[11px] text-red-200/90 tracking-wide admin-marquee-scroll">
                              <span>{alertStripMessages.join("   •   ") + "   •   "}</span>
                              <span>{alertStripMessages.join("   •   ") + "   •   "}</span>
                            </div>
                          </div>

                          <style>{`
                            @keyframes adminMarquee {
                              0% { transform: translate3d(0, 0, 0); }
                              100% { transform: translate3d(-50%, 0, 0); }
                            }
                            @keyframes shimmer {
                              100% { transform: translateX(100%); }
                            }
                            .admin-marquee-scroll {
                              animation: adminMarquee 35s linear infinite;
                            }
                            .admin-marquee-container:hover .admin-marquee-scroll {
                              animation-play-state: paused;
                            }
                          `}</style>
                        </div>
                      )}



                      <div className="active-module-header">
                        <h2 className="module-title">{activeAdminModule}</h2>
                        <div className="title-underline"></div>
                      </div>

                      <div className="module-content-area">
                        <Suspense fallback={<PageLoader />}>
                          {activeAdminModule === "DASHBOARD" && (
                          <Dashboard
                            projects={ignitionQueue}
                            clients={clients}
                            invoices={invoices}
                            cashbookEntries={cashbookEntries}
                            clientPortalNotifs={clientPortalNotifs}
                            flames={flames}
                            sparks={sparks}
                            onMarkFlameAsRead={markFlameAsRead}
                            onSnoozeFlame={handleSnooze}
                            onRedirectToProject={(project) => {
                              const clientName = getProjectClientName(project);
                              if (clientName) setProjectsSearchQuery(clientName);
                              setSelectedProjectTab(project.id);
                              setActiveAdminModule("PROJECTS");
                              pushPageToHistory('admin', { activeAdminModule: "PROJECTS", isAdminGridActive: true });
                            }}
                            onRedirectToClient={(projectId, clientId, type) => {
                              let targetClientName = null;
                              const resolvedClientId = clientId || (projectId ? ignitionQueue.find(p => String(p.id) === String(projectId))?.client_id : null);
                              
                              if (resolvedClientId) {
                                const client = clients.find(c => String(c.id) === String(resolvedClientId));
                                if (client) targetClientName = client.name;
                              } else if (projectId) {
                                const project = ignitionQueue.find(p => String(p.id) === String(projectId));
                                if (project && project.client) targetClientName = project.client.name;
                              }

                              if (resolvedClientId) {
                                if (type === 'Profile Update') {
                                  setAutoOpenReviewClientId(resolvedClientId);
                                } else if (type === 'communication') {
                                  setAutoOpenBridgeClientId(resolvedClientId);
                                  setAutoOpenBridgeProjectId(projectId);
                                } else if (type === 'new_asset') {
                                  setAutoOpenVaultClientId(resolvedClientId);
                                }
                              }

                              if (targetClientName) {
                                setClientsSearchQuery(targetClientName);
                                setActiveAdminModule("CLIENTS");
                                setIsAdminGridActive(true);
                                pushPageToHistory('admin', { activeAdminModule: "CLIENTS", isAdminGridActive: true });
                              }
                            }}
                            onOpenIgnitionModal={() => { setPrefillData(null); setIsIgnitionModalOpen(true); }}
                            onOpenCreateClient={() => { setSelectedClient(null); setClientModalPasscode(Math.random().toString(36).substring(2, 8).toUpperCase()); setIsClientModalOpen(true); }}
                            setActiveAdminModule={setActiveAdminModule}
                            onDownloadInvoice={(p) => {
                              setInvoiceProject(p);
                              setIsInvoicePreviewOpen(true);
                            }}
                            onFilterProjectsByClient={(clientName) => {
                              setProjectsSearchQuery(clientName);
                              setActiveAdminModule("PROJECTS");
                              pushPageToHistory('admin', { activeAdminModule: "PROJECTS", isAdminGridActive: true });
                            }}
                            onRedirectToFinancialsProject={(p) => {
                              setLedgerSearch('');
                              setRedirectFilterClient(getProjectClientName(p) || '');
                              setRedirectFilterService(p.service || '');
                              setFinancialTab("PROJECTS");
                              setActiveAdminModule("FINANCIALS");
                              pushPageToHistory('admin', { activeAdminModule: "FINANCIALS", isAdminGridActive: true });
                            }}
                            onOpenMicroJobModal={() => {
                              setRedirectBackToMicroJob(true);
                              setActiveAdminModule("PROJECTS");
                              pushPageToHistory('admin', { activeAdminModule: "PROJECTS", isAdminGridActive: true });
                            }}
                            onOpenCreateInvoice={() => {
                              setActiveAdminModule("INVOICES");
                              pushPageToHistory('admin', { activeAdminModule: "INVOICES", isAdminGridActive: true });
                            }}
                            onAddCashbookEntry={(entry) => {
                              setCashbookEntries(prev => [entry, ...prev]);
                            }}
                            setFinancialTab={setFinancialTab}
                            isNotificationsMinimized={isNotificationsMinimized}
                            setIsNotificationsMinimized={setIsNotificationsMinimized}
                          />
                        )}

                         {activeAdminModule === "PROJECTS" && (
                          <Projects
                            projects={ignitionQueue}
                            setProjects={setIgnitionQueue}
                            clients={clients}
                            setClients={setClients}
                            invoices={invoices}
                            setInvoices={setInvoices}
                            onOpenIgnitionModal={() => { setPrefillData(null); setIsIgnitionModalOpen(true); }}
                            setCustomPaymentPrompt={setCustomPaymentPrompt}
                            onDownloadInvoice={(p) => {
                              setInvoiceProject(p);
                              setIsInvoicePreviewOpen(true);
                            }}
                            handleUpdateProjectStatusHandy={handleUpdateProjectStatusHandy}
                            handleUpdateProjectProgressHandy={handleUpdateProjectProgressHandy}
                            setCashbookEntries={setCashbookEntries}
                            initialSearch={projectsSearchQuery}
                            onDeleteProject={(id) => {
                              const proj = ignitionQueue.find(p => p.id === id);
                              if (proj) {
                                setProjectToDelete(proj);
                              }
                            }}
                            microJobs={microJobs}
                            setMicroJobs={setMicroJobs}
                            setInvoiceDefaultTab={setInvoiceDefaultTab}
                            setActiveAdminModule={setActiveAdminModule}
                            redirectBackToMicroJob={redirectBackToMicroJob}
                            setRedirectBackToMicroJob={setRedirectBackToMicroJob}
                            redirectBackToProjectEdit={redirectBackToProjectEdit}
                            setRedirectBackToProjectEdit={setRedirectBackToProjectEdit}
                          />
                        )}

                        {activeAdminModule === "INQUIRIES" && (
                          <Inquiries
                            inquiries={inquiries}
                            setInquiries={setInquiries}
                            services={services}
                            handleIgniteFromInquiry={handleIgniteFromInquiry}
                            initialSearch={inquiriesSearchQuery}
                          />
                        )}

                        {activeAdminModule === "CLIENTS" && (
                          <Clients
                            clients={clients}
                            ignitionQueue={ignitionQueue}
                            clientPortalNotifs={clientPortalNotifs}
                            onOpenCreateClient={() => { setSelectedClient(null); setClientModalPasscode(Math.random().toString(36).substring(2, 8).toUpperCase()); setIsClientModalOpen(true); }}
                            onOpenEditClient={(client) => { setSelectedClient(client); setClientModalPasscode(client.accessKey || client.access_key || ""); setIsClientModalOpen(true); }}
                            onDeleteClient={deleteClient}
                            initialSearch={clientsSearchQuery}
                            autoOpenBridgeClientId={autoOpenBridgeClientId}
                            autoOpenBridgeProjectId={autoOpenBridgeProjectId}
                            autoOpenReviewClientId={autoOpenReviewClientId}
                            autoOpenVaultClientId={autoOpenVaultClientId}
                            onCloseAutoOpen={(type) => {
                              if (type === 'bridge') {
                                setAutoOpenBridgeClientId(null);
                                setAutoOpenBridgeProjectId(null);
                              }
                              if (type === 'review') setAutoOpenReviewClientId(null);
                              if (type === 'vault') setAutoOpenVaultClientId(null);
                            }}
                          />
                        )}

                        {activeAdminModule === "INVOICES" && (
                          <InvoicesPage
                            invoices={invoices}
                            setInvoices={setInvoices}
                            clients={clients}
                            cashbookEntries={cashbookEntries}
                            setCashbookEntries={setCashbookEntries}
                            setIsInvoicePreviewOpen={setIsInvoicePreviewOpen}
                            setInvoiceProject={setInvoiceProject}
                            selectedVaultInvoices={selectedVaultInvoices}
                            setSelectedVaultInvoices={setSelectedVaultInvoices}
                            bankingDetails={bankingDetails}
                            projects={ignitionQueue}
                            services={services}
                             onEditInvoice={(inv) => {
                               const isStandalone = !inv.projectId || inv.invoiceNo?.includes('/C') || inv.rawProject?.isStandalone;
                               setEditingInvoiceData({
                                 id: inv.id,
                                 invoiceNo: inv.invoiceNo,
                                 name: inv.rawProject?.name || inv.clientName || "",
                                 address: inv.rawProject?.address || getClientAddress(inv.clientName) || "",
                                 phone: inv.rawProject?.phone || ((inv.clientLink || inv.rawProject?.client?.id) ? clients.find(c => c.id === (inv.clientLink || inv.rawProject?.client?.id)) : clients.find(c => c.name.toLowerCase() === (inv.rawProject?.name || inv.clientName || "").toLowerCase()))?.phone || "",
                                 email: inv.rawProject?.email || ((inv.clientLink || inv.rawProject?.client?.id) ? clients.find(c => c.id === (inv.clientLink || inv.rawProject?.client?.id)) : clients.find(c => c.name.toLowerCase() === (inv.rawProject?.name || inv.clientName || "").toLowerCase()))?.email || "",
                                 gst: inv.rawProject?.gst || ((inv.clientLink || inv.rawProject?.client?.id) ? clients.find(c => c.id === (inv.clientLink || inv.rawProject?.client?.id)) : clients.find(c => c.name.toLowerCase() === (inv.rawProject?.name || inv.clientName || "").toLowerCase()))?.gst || "",
                                 service: inv.projectService || inv.rawProject?.service || "",
                                 quote: inv.rawProject?.quote || inv.grandTotal || 0,
                                 discount: inv.rawProject?.discount || 0,
                                 advanceAmount: inv.rawProject?.advanceAmount || 0,
                                 qty: inv.rawProject?.qty || 1,
                                 rate: inv.rawProject?.rate || (inv.rawProject?.quote / (inv.rawProject?.qty || 1)) || inv.grandTotal || 0,
                                 items: inv.rawProject?.items || [],
                                 isStandalone: isStandalone,
                                 projectId: inv.projectId
                               });
                             }}
                             prefilledEditData={editingInvoiceData}
                             onClearEditData={() => setEditingInvoiceData(null)}
                             trashItems={trashItems}
                             setTrashItems={setTrashItems}
                             defaultTab={invoiceDefaultTab}
                             setDefaultTab={setInvoiceDefaultTab}
                             microJobs={microJobs}
                             setMicroJobs={setMicroJobs}
                             onRedirectToProjectEdit={(projectId) => {
                               setActiveAdminModule("PROJECTS");
                               setRedirectBackToProjectEdit(projectId);
                             }}
                           />
                        )}

                        {activeAdminModule === "FINANCIALS" && (
                          <Financials
                            ignitionQueue={ignitionQueue}
                            setIgnitionQueue={setIgnitionQueue}
                            cashbookEntries={cashbookEntries}
                            setCashbookEntries={setCashbookEntries}
                            invoices={invoices}
                            setInvoices={setInvoices}
                            clients={clients}
                            monthlyTarget={monthlyTarget}
                            setMonthlyTarget={setMonthlyTarget}
                            financialTab={financialTab}
                            setFinancialTab={setFinancialTab}
                            isNotificationsMinimized={isNotificationsMinimized}
                            setIsNotificationsMinimized={setIsNotificationsMinimized}
                            financialMetrics={financialMetrics}
                            cashbookMetrics={cashbookMetrics}
                            highlightedCashbookId={highlightedCashbookId}
                            ledgerSearch={ledgerSearch}
                            setLedgerSearch={setLedgerSearch}
                            redirectFilterClient={redirectFilterClient}
                            setRedirectFilterClient={setRedirectFilterClient}
                            redirectFilterService={redirectFilterService}
                            setRedirectFilterService={setRedirectFilterService}
                            setCustomPaymentPrompt={setCustomPaymentPrompt}
                            setIsCashbookEditModalOpen={setIsCashbookEditModalOpen}
                            setSelectedCashbookEntry={setSelectedCashbookEntry}
                            setIsInvoicePreviewOpen={setIsInvoicePreviewOpen}
                            setInvoiceProject={setInvoiceProject}
                            selectedBatchProjects={selectedBatchProjects}
                            setSelectedBatchProjects={setSelectedBatchProjects}
                            selectedVaultInvoices={selectedVaultInvoices}
                            setSelectedVaultInvoices={setSelectedVaultInvoices}
                            handleAddCashbookEntry={handleAddCashbookEntry}
                            handleMarkMilestonePaid={handleMarkMilestonePaid}
                            handleUpdateProjectStatusHandy={handleUpdateProjectStatusHandy}
                            trashItems={trashItems}
                            setTrashItems={setTrashItems}
                            onRedirectToProjectEdit={(projectId) => {
                              setActiveAdminModule("PROJECTS");
                              setRedirectBackToProjectEdit(projectId);
                            }}
                          />
                        )}

                        {activeAdminModule === "SETTINGS" && (
                          <SettingsPage
                            servicesList={servicesList}
                            onOpenCalibrate={handleOpenCalibrate}
                            visionSettings={visionSettings}
                            onSaveVisionSettings={handleSaveVisionSettings}
                            onClearAllDemoData={handleClearAllDemoData}
                            bankingDetails={bankingDetails}
                            onSaveBankingDetails={handleSaveBankingDetails}
                            adminProfile={adminProfile}
                            onSaveAdminProfile={handleSaveAdminProfile}
                            onAddService={handleAddService}
                            onDeleteService={handleDeleteService}
                            onUpdateService={handleUpdateService}
                            projectsList={ignitionQueue}
                            invoicesList={invoices}
                            cashbookEntries={cashbookEntries}
                            clients={clients}
                            setClients={setClients}
                            setIgnitionQueue={setIgnitionQueue}
                            setInvoices={setInvoices}
                            setCashbookEntries={setCashbookEntries}
                            setServicesList={setServicesList}
                            setVisionSettings={setVisionSettings}
                            setBankingDetails={setBankingDetails}
                            setAdminProfile={setAdminProfile}
                            trashItems={trashItems}
                            onRestoreItem={restoreItem}
                          />
                        )}
                        </Suspense>
                      </div>



                      {/* Modals - Moved outside of specific module conditionals to be globally accessible in Admin */}
                      <AnimatePresence>
                        {isIgnitionModalOpen && (
                          <div className="modal-overlay">
                            <motion.div
                              className="ignition-modal"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{
                                scale: 1.5,
                                opacity: 0,
                                filter: 'brightness(3) saturate(2)',
                                boxShadow: '0 0 100px #FF4500, 0 0 200px #00E5FF'
                              }}
                              transition={{ duration: 0.5 }}
                            >
                              <button className="close-modal" onClick={() => setIsIgnitionModalOpen(false)}>×</button>
                              <div className="modal-header">
                                <h2>MANUAL PROJECT IGNITION</h2>
                                <p>Calibrating a new visual revolution</p>
                              </div>

                              <form className="ignition-form" onSubmit={handleIgniteProject} key={prefillData ? prefillData.inquiryId || 'spark' : 'manual'}>
                                <div className="client-type-selector">
                                  <button
                                    type="button"
                                    className={`type-btn ${ignitionClientType === 'NEW' ? 'active' : ''}`}
                                    onClick={() => setIgnitionClientType('NEW')}
                                  >
                                    NEW VISIONARY
                                  </button>
                                  <button
                                    type="button"
                                    className={`type-btn ${ignitionClientType === 'EXISTING' ? 'active' : ''}`}
                                    onClick={() => setIgnitionClientType('EXISTING')}
                                  >
                                    EXISTING CLIENT
                                  </button>
                                </div>

                                {ignitionClientType === 'EXISTING' ? (
                                  <div className="input-group">
                                    <label>Select Existing Client</label>
                                    <select name="existingClientId" required>
                                      <option value="">Choose from your network...</option>
                                      {clients.filter(c => c.email !== 'settings@netra.graphics').map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                      ))}
                                    </select>
                                    {clients.filter(c => c.email !== 'settings@netra.graphics').length === 0 && <p className="dim-text small-hint">No clients registered yet. Please create a new one.</p>}
                                  </div>
                                ) : (
                                  <>
                                    <div className="form-row">
                                      <div className="input-group">
                                        <label>Client Name</label>
                                        <input type="text" name="clientName" defaultValue={prefillData?.clientName || ''} placeholder="Identity of the visionary" required />
                                      </div>
                                      <div className="input-group">
                                        <label>Client Email (Optional)</label>
                                        <input type="email" name="email" defaultValue={prefillData?.email || ''} placeholder="Direct digital link" />
                                      </div>
                                    </div>

                                    <div className="form-row">
                                      <div className="input-group">
                                        <label>Client Mobile</label>
                                        <input type="tel" name="whatsapp" defaultValue={prefillData?.phone || ''} placeholder="+91 XXXXX XXXXX" required />
                                      </div>
                                      <div className="input-group">
                                        <label>Client Billing Address</label>
                                        <input type="text" name="address" defaultValue={prefillData?.address || ''} placeholder="Official registered address" required />
                                      </div>
                                    </div>
                                  </>
                                )}

                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Select Service Calibration</label>
                                    <input
                                      type="text"
                                      name="service"
                                      list="services-list"
                                      required
                                      defaultValue={prefillData?.serviceId ? services.find(s => s.id === prefillData.serviceId)?.title : ''}
                                      placeholder="Type or select service..."
                                      className="ignition-input"
                                      style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', outline: 'none' }}
                                    />
                                  </div>
                                </div>

                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Target Delivery Date</label>
                                    <input type="date" name="deadline" required />
                                  </div>
                                  <div className="input-group">
                                    <label>Alert Me (Days Before Due)</label>
                                    <input type="number" name="alertMeDays" min="0" placeholder="Default: 1 day" style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                                  </div>
                                </div>

                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Mission Brief / Notes</label>
                                    <textarea
                                      name="description"
                                      defaultValue={prefillData?.description || ''}
                                      placeholder="Provide context, design goals, or notes for this project..."
                                      style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                                    />
                                  </div>
                                </div>
                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Quantity</label>
                                    <input
                                      type="number"
                                      name="qty"
                                      min="1"
                                      value={ignitionQty}
                                      placeholder="1"
                                      onChange={(e) => {
                                        setIgnitionQty(e.target.value === "" ? "" : parseInt(e.target.value) || "");
                                        setIgnitionLastCalculatedBy("qty");
                                      }}
                                    />
                                  </div>
                                  <div className="input-group">
                                    <label>Rate (₹)</label>
                                    <input
                                      type="number"
                                      name="rate"
                                      value={ignitionRate}
                                      onChange={(e) => {
                                        setIgnitionRate(e.target.value);
                                        setIgnitionLastCalculatedBy("rate");
                                      }}
                                      placeholder="Rate per unit"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Estimated Quote (₹)</label>
                                    <input
                                      type="number"
                                      name="quote"
                                      value={ignitionQuote}
                                      onChange={(e) => {
                                        setIgnitionQuote(e.target.value);
                                        setIgnitionLastCalculatedBy("quote");
                                      }}
                                      placeholder="Auto-calculated (Rate × Qty)"
                                      required
                                    />
                                  </div>
                                  <div className="input-group">
                                    <label>Special Discount (₹)</label>
                                    <input type="number" name="discount" placeholder="0" />
                                  </div>
                                </div>

                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Advance Payment (₹)</label>
                                    <input type="number" name="advanceAmount" placeholder="0" />
                                  </div>
                                  <div className="input-group">
                                    <label>Advance Payment Method</label>
                                    <select
                                      name="advancePaymentMethod"
                                      className="ignition-input"
                                      style={{ width: '100%', padding: '0 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', outline: 'none', height: '42px' }}
                                    >
                                      <option value="UPI">UPI / Online</option>
                                      <option value="CASH">Cash</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="modal-actions">
                                  <button type="button" className="cancel-mission-btn" onClick={() => setIsIgnitionModalOpen(false)}>
                                    CANCEL MISSION
                                  </button>
                                  <button type="submit" className="ignite-submit-btn">
                                    IGNITE PROJECT
                                  </button>
                                </div>
                              </form>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {isClientModalOpen && (
                          <div className="modal-overlay">
                            <motion.div
                              className="ignition-modal"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                            >
                              <button className="close-modal" onClick={() => { setIsClientModalOpen(false); setSelectedClient(null); }}>×</button>
                              <div className="modal-header">
                                <h2>{selectedClient ? 'EDIT CLIENT PROFILE' : 'ADD NEW CLIENT'}</h2>
                                <p>{selectedClient ? 'Updating parameters for an existing visionary' : 'Onboarding a new visionary to the Netra Graphics network'}</p>
                              </div>

                              <form className="ignition-form" onSubmit={handleAddClient}>
                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Full Name / Company</label>
                                    <input type="text" name="name" defaultValue={selectedClient?.name} placeholder="Identity of the visionary" required />
                                  </div>
                                  <div className="input-group">
                                    <label>Email Address (Optional)</label>
                                    <input type="email" name="email" defaultValue={selectedClient?.email} placeholder="Direct digital link" />
                                  </div>
                                </div>

                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Mobile Number</label>
                                    <input type="tel" name="phone" defaultValue={selectedClient?.phone} placeholder="+91 XXXXX XXXXX" required />
                                  </div>
                                  <div className="input-group">
                                    <label>Billing Address</label>
                                    <input type="text" name="address" defaultValue={selectedClient?.address} placeholder="Physical location for records" required />
                                  </div>
                                </div>

                                <div className="form-row">
                                  <div className="input-group" style={{ width: '100%' }}>
                                    <label>GST Number (Optional)</label>
                                    <input type="text" name="gst" defaultValue={selectedClient?.gst} placeholder="22AAAAA0000A1Z5" />
                                  </div>
                                </div>

                                {selectedClient && (
                                  <div className="form-row">
                                    <div className="input-group" style={{ width: '100%' }}>
                                      <label>Account Status</label>
                                      <select 
                                        name="status" 
                                        defaultValue={selectedClient?.status || 'Active'} 
                                        className="ignition-input"
                                        style={{ 
                                          width: '100%', 
                                          padding: '0 0.8rem', 
                                          background: 'rgba(255,255,255,0.05)', 
                                          border: '1px solid rgba(255,255,255,0.1)', 
                                          color: '#fff', 
                                          borderRadius: '4px', 
                                          outline: 'none', 
                                          height: '42px',
                                          marginBottom: '1rem' 
                                        }}
                                      >
                                        <option value="Active" style={{ background: '#0a0f1e', color: '#fff' }}>Active</option>
                                        <option value="Suspended" style={{ background: '#0a0f1e', color: '#fff' }}>Suspended</option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                                <div className="form-row">
                                  <div className="input-group" style={{ width: '100%' }}>
                                    <label>Vault Passcode / Access Key</label>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                      <input 
                                        type="text" 
                                        name="accessKey" 
                                        value={clientModalPasscode} 
                                        onChange={(e) => setClientModalPasscode(e.target.value.toUpperCase())} 
                                        placeholder="6-CHAR PASSCODE" 
                                        style={{ flexGrow: 1, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.15em' }}
                                        required 
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => setClientModalPasscode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                                        style={{
                                          padding: '0 16px',
                                          background: 'rgba(8, 217, 214, 0.1)',
                                          border: '1px solid rgba(8, 217, 214, 0.3)',
                                          color: '#08d9d6',
                                          fontWeight: 'bold',
                                          fontSize: '11px',
                                          borderRadius: '8px',
                                          cursor: 'pointer',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.05em',
                                          height: '42px',
                                          transition: 'all 0.2s ease-in-out'
                                        }}
                                      >
                                        Regenerate
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                <div className="modal-actions">
                                  <button type="button" className="cancel-mission-btn" onClick={() => { setIsClientModalOpen(false); setSelectedClient(null); }}>
                                    CANCEL
                                  </button>
                                  <button type="submit" className="ignite-submit-btn">
                                    {selectedClient ? 'UPDATE CLIENT' : 'REGISTER CLIENT'}
                                  </button>
                                </div>
                              </form>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {isProjectEditModalOpen && (
                          <div className="modal-overlay">
                            <motion.div
                              className="ignition-modal"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                            >
                              <button className="close-modal" onClick={() => setIsProjectEditModalOpen(false)}>×</button>
                              <div className="modal-header">
                                <h2>CALIBRATE MISSION</h2>
                                <p>Updating parameters for the current revolution</p>
                              </div>

                              {(() => {
                                const currentProject = ignitionQueue.find(p => p.id === selectedProjectTab);
                                return (
                                  <form className="ignition-form" onSubmit={handleEditProject}>
                                    <div className="input-group">
                                      <label>Service Calibration</label>
                                      <input
                                        type="text"
                                        name="service"
                                        list="services-list"
                                        defaultValue={currentProject?.service || ''}
                                        required
                                        placeholder="Type or select service..."
                                        className="ignition-input"
                                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', outline: 'none' }}
                                      />
                                    </div>

                                    <div className="form-row">
                                      <div className="input-group">
                                        <label>Deadline Adjustment</label>
                                        <input type="date" name="deadline" defaultValue={currentProject?.deadline} required />
                                      </div>
                                      <div className="input-group">
                                        <label>Alert Me (Days Before Due)</label>
                                        <input type="number" name="alertMeDays" defaultValue={currentProject?.alertMeDays} min="0" placeholder="Default: 1 day" style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                                      </div>
                                    </div>

                                    {/* QTY / Rate / Quote — bidirectional calculation */}
                                    <div className="form-row">
                                      <div className="input-group">
                                        <label>Quantity</label>
                                        <input
                                          type="number"
                                          name="qty"
                                          min="1"
                                          value={editQty}
                                          onChange={(e) => {
                                            setEditQty(parseInt(e.target.value) || 1);
                                            setEditLastCalculatedBy("qty");
                                          }}
                                          required
                                        />
                                      </div>
                                      <div className="input-group">
                                        <label>Rate (₹)</label>
                                        <input
                                          type="number"
                                          name="rate"
                                          value={editRate}
                                          onChange={(e) => {
                                            setEditRate(e.target.value);
                                            setEditLastCalculatedBy("rate");
                                          }}
                                          placeholder="Rate per unit"
                                          required
                                        />
                                      </div>
                                    </div>

                                    <div className="form-row">
                                      <div className="input-group">
                                        <label>Estimated Quote (₹) <span style={{fontSize:'0.75em', opacity:0.6}}>(Qty × Rate)</span></label>
                                        <input
                                          type="number"
                                          name="quote"
                                          value={editQuote}
                                          onChange={(e) => {
                                            setEditQuote(e.target.value);
                                            setEditLastCalculatedBy("quote");
                                          }}
                                          placeholder="Auto-calculated"
                                          required
                                        />
                                      </div>
                                      <div className="input-group">
                                        <label>Special Discount (₹) <span style={{fontSize:'0.75em', opacity:0.6}}>(subtracted from Quote)</span></label>
                                        <input type="number" name="discount" defaultValue={currentProject?.discount || 0} placeholder="0" />
                                      </div>
                                      <div className="input-group">
                                        <label>Advance Payment (₹)</label>
                                        <input type="number" name="advanceAmount" defaultValue={currentProject?.advanceAmount || 0} placeholder="0" />
                                      </div>
                                    </div>

                                    <div className="modal-actions">
                                      <button type="button" className="cancel-mission-btn" onClick={() => setIsProjectEditModalOpen(false)}>
                                        CANCEL
                                      </button>
                                      <button type="submit" className="ignite-submit-btn">
                                        SAVE CALIBRATION
                                      </button>
                                    </div>
                                  </form>
                                );
                              })()}
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                      {/* Emergency Alert Resolution Modal moved to global scope */}

                      {/* Fullscreen Alert Warning Overlay */}
                      <AnimatePresence>
                        {isAdminGridActive && hasUrgentAlert && !isWarningDismissed && (() => {
                          const activeTab = expandedWarningTab || (flames.length > 0 ? 'DEADLINES' : 'INQUIRIES');
                          return (
                            <motion.div
                              className="fullscreen-warning-overlay"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="fullscreen-warning-grid">
                                {/* Left column: Info & Actions */}
                                <div className="warning-left-panel">
                                  <div className="warning-pulse-icon">⚠️</div>
                                  <h2>CRITICAL UNRESOLVED SYSTEM ALERTS</h2>
                                  <p className="warning-desc">
                                    Active project deadlines are overdue or new client inquiries (Sparks) are pending. 
                                    Acknowledge or navigate to resolve them before interacting with sub-modules.
                                  </p>

                                  <div className="warning-actions-stack">
                                    <button 
                                      className="warning-btn primary-warning-btn"
                                      onClick={() => {
                                        setIsAdminGridActive(false);
                                        setIsWarningDismissed(false);
                                        pushPageToHistory('admin', { activeAdminModule: 'DASHBOARD', isAdminGridActive: false });
                                      }}
                                    >
                                      RETURN TO MODULES GRID
                                    </button>
                                    <button 
                                      className="warning-btn secondary-warning-btn"
                                      onClick={() => setIsWarningDismissed(true)}
                                    >
                                      ACKNOWLEDGE & PROCEED
                                    </button>
                                    <button 
                                      className="warning-btn success-warning-btn"
                                      onClick={markAllAlertsAsRead}
                                    >
                                      MARK ALL AS READ
                                    </button>
                                  </div>
                                </div>

                                {/* Right column: Horizontal tab selectors and matching list details */}
                                <div className="warning-right-panel">
                                  <div className="warning-tab-bar">
                                    <button 
                                      className={`warning-tab-btn ${activeTab === 'DEADLINES' ? 'active-deadlines' : ''}`}
                                      onClick={() => setExpandedWarningTab('DEADLINES')}
                                      type="button"
                                    >
                                      <span className="tab-title">PENDING DEADLINES</span>
                                      <span className="tab-badge bg-[#ff5e00]/20 text-[#ff5e00] border border-[#ff5e00]/30">{flames.length}</span>
                                    </button>
                                    <button 
                                      className={`warning-tab-btn ${activeTab === 'INQUIRIES' ? 'active-inquiries' : ''}`}
                                      onClick={() => setExpandedWarningTab('INQUIRIES')}
                                      type="button"
                                    >
                                      <span className="tab-title">NEW INQUIRIES</span>
                                      <span className="tab-badge bg-cyan-500/20 text-[#00E5FF] border border-cyan-500/30">{sparks.length}</span>
                                    </button>
                                  </div>

                                  <div className="warning-tab-content">
                                    {activeTab === 'DEADLINES' && (
                                      flames.length > 0 ? (
                                        <div className="expanded-warning-list flex flex-col border border-white/5 rounded-2xl p-4 bg-black/40 h-full overflow-y-auto space-y-1.5 text-left w-full">
                                          <h4 className="text-3xs uppercase tracking-widest text-[#ff5e00] font-bold mb-2 border-b border-white/5 pb-1">Select Project to Redirect:</h4>
                                          {flames.map(f => (
                                            <div 
                                              key={f.id} 
                                              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-2 text-foreground text-left w-full"
                                            >
                                              <div className="cursor-pointer flex flex-col items-start gap-1 min-w-0 w-full sm:w-auto flex-1" onClick={() => {
                                                setProjectsSearchQuery(getProjectClientName(f));
                                                setSelectedProjectTab(f.id);
                                                setActiveAdminModule("PROJECTS");
                                                setIsAdminGridActive(true);
                                                setIsWarningDismissed(true);
                                                setExpandedWarningTab(null);
                                                pushPageToHistory('admin', { activeAdminModule: 'PROJECTS', isAdminGridActive: true });
                                              }}>
                                                <span className="font-semibold truncate w-full text-left">{getProjectClientName(f)}</span>
                                                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Due {new Date(f.deadline).toLocaleDateString()}</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 sm:ml-2 w-full sm:w-auto justify-start sm:justify-end shrink-0">
                                                <input type="number" min="1" className="w-12 bg-black/50 border border-white/10 rounded px-2 py-1 text-center text-xs text-white h-7" defaultValue="1" id={`snooze-amt-${f.id}`} onClick={e => e.stopPropagation()} />
                                                <select className="bg-black/50 border border-white/10 rounded px-1.5 py-1 text-xs text-muted-foreground cursor-pointer outline-none h-7 font-semibold" id={`snooze-unit-${f.id}`} onClick={e => e.stopPropagation()}>
                                                  <option value="HOURS">Hrs</option>
                                                  <option value="MINUTES">Min</option>
                                                </select>
                                                <button className="text-3xs bg-[#ff5e00]/20 text-[#ff5e00] px-3 py-1 rounded hover:bg-[#ff5e00]/40 transition-colors uppercase font-bold h-7" onClick={(e) => {
                                                  e.stopPropagation();
                                                  const amt = document.getElementById(`snooze-amt-${f.id}`).value;
                                                  const unit = document.getElementById(`snooze-unit-${f.id}`).value;
                                                  handleSnooze(f.id, Number(amt), unit);
                                                }}>Snooze</button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="warning-empty-state">
                                          <div className="empty-icon text-[#ff5e00]">✓</div>
                                          <p className="empty-title">All Deadlines Clear</p>
                                          <p className="empty-desc">No overdue projects require your immediate calibration.</p>
                                        </div>
                                      )
                                    )}

                                    {activeTab === 'INQUIRIES' && (
                                      sparks.length > 0 ? (
                                        <div className="expanded-warning-list flex flex-col border border-white/5 rounded-2xl p-4 bg-black/40 h-full overflow-y-auto space-y-1.5 text-left w-full">
                                          <h4 className="text-3xs uppercase tracking-widest text-[#00E5FF] font-bold mb-2 border-b border-white/5 pb-1">Select Inquiry to Redirect:</h4>
                                          {sparks.map(s => (
                                            <div 
                                              key={s.id} 
                                              className="p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors text-xs flex justify-between items-center text-foreground"
                                              onClick={() => {
                                                setInquiriesSearchQuery(s.name || s.clientName);
                                                setActiveAdminModule("INQUIRIES");
                                                setIsAdminGridActive(true);
                                                setIsWarningDismissed(true);
                                                setExpandedWarningTab(null);
                                                pushPageToHistory('admin', { activeAdminModule: 'INQUIRIES', isAdminGridActive: true });
                                              }}
                                            >
                                              <div className="flex flex-col items-start gap-1 min-w-0 flex-1 pr-2">
                                                <span className="font-semibold truncate w-full text-left">{s.name || s.clientName}</span>
                                                <span className="text-[10px] text-muted-foreground truncate w-full text-left">{s.email || "No direct link"}</span>
                                              </div>
                                              <span className="text-3xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 shrink-0 whitespace-nowrap">{s.service || "General Inquiry"}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="warning-empty-state">
                                          <div className="empty-icon text-cyan-400">📥</div>
                                          <p className="empty-title">Inquiries Clear</p>
                                          <p className="empty-desc">No new Sparks require digital response calibration.</p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>

                      <AnimatePresence>
                        {isCashbookEditModalOpen && selectedCashbookEntry && (
                          <div className="modal-overlay">
                            <motion.div
                              className="ignition-modal"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                            >
                              <button className="close-modal" onClick={() => { setIsCashbookEditModalOpen(false); setSelectedCashbookEntry(null); }}>×</button>
                              <div className="modal-header">
                                <h2>EDIT CASHBOOK ENTRY</h2>
                                <p>Modifying financial records</p>
                              </div>

                              <form className="ignition-form" onSubmit={handleUpdateCashbookEntry}>
                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Date</label>
                                    <input type="date" name="date" defaultValue={selectedCashbookEntry.date} required />
                                  </div>
                                  <div className="input-group">
                                    <label>Description</label>
                                    <input type="text" name="desc" defaultValue={selectedCashbookEntry.desc} required />
                                  </div>
                                </div>
                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Amount (₹)</label>
                                    <input type="number" name="amount" defaultValue={selectedCashbookEntry.amount} required />
                                  </div>
                                  <div className="input-group">
                                    <label>Type</label>
                                    <select name="type" defaultValue={selectedCashbookEntry.type}>
                                      <option value="EXPENSE">Expense</option>
                                      <option value="INCOME">Misc Income</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Payment Mode</label>
                                    <select name="mode" defaultValue={selectedCashbookEntry.mode}>
                                      <option value="UPI">UPI / Online</option>
                                      <option value="CASH">Cash</option>
                                    </select>
                                  </div>
                                  <div className="input-group">
                                    <div className="flex justify-between items-center" style={{ marginBottom: '0.2rem' }}>
                                      <label style={{ margin: 0 }}>Category</label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditCatTab(selectedCashbookEntry.type);
                                          setIsManageCategoriesOpen(true);
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#00d4ff', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', padding: 0 }}
                                      >
                                        ⚙ Manage
                                      </button>
                                    </div>
                                    <select
                                      name="category"
                                      value={editCategoryVal}
                                      onChange={(e) => setEditCategoryVal(e.target.value)}
                                    >
                                      {selectedCashbookEntry.type === "INCOME" ? (
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
                                </div>

                                {editCategoryVal === "CUSTOM" && (
                                  <div className="form-row" style={{ marginTop: '0.5rem' }}>
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                      <label>Enter Custom Category</label>
                                      <input
                                        type="text"
                                        name="customCategory"
                                        placeholder="e.g. Fuel, Office Supplies"
                                        required
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="form-row">
                                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Additional Details</label>
                                    <textarea
                                      name="details"
                                      defaultValue={selectedCashbookEntry.details || ""}
                                      placeholder="Enter optional details..."
                                    />
                                  </div>
                                </div>

                                <div className="modal-actions">
                                  <button type="button" className="cancel-mission-btn" onClick={() => { setIsCashbookEditModalOpen(false); setSelectedCashbookEntry(null); }}>
                                    CANCEL
                                  </button>
                                  <button type="submit" className="ignite-submit-btn">
                                    UPDATE ENTRY
                                  </button>
                                </div>
                              </form>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>

                      {/* Manage Categories Modal Overlay */}
                      <AnimatePresence>
                        {isManageCategoriesOpen && (
                          <div className="modal-overlay" style={{ zIndex: 1100 }}>
                            <motion.div
                              className="ignition-modal"
                              style={{ maxWidth: '400px', width: '100%' }}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                            >
                              <button className="close-modal" onClick={() => { setIsManageCategoriesOpen(false); setEditingCategoryName(null); }}>×</button>
                              <div className="modal-header">
                                <h2>MANAGE CATEGORIES</h2>
                                <p>Edit or delete custom ledger categories</p>
                              </div>

                              <div className="client-type-selector" style={{ marginBottom: '1.2rem' }}>
                                <button
                                  type="button"
                                  className={`type-btn ${editCatTab === 'INCOME' ? 'active' : ''}`}
                                  onClick={() => { setEditCatTab('INCOME'); setEditingCategoryName(null); }}
                                >
                                  INCOME
                                </button>
                                <button
                                  type="button"
                                  className={`type-btn ${editCatTab === 'EXPENSE' ? 'active' : ''}`}
                                  onClick={() => { setEditCatTab('EXPENSE'); setEditingCategoryName(null); }}
                                >
                                  EXPENSE
                                </button>
                              </div>

                              <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '4px', marginBottom: '1rem' }} className="scrollbar-thin">
                                {(() => {
                                  const list = editCatTab === "INCOME"
                                    ? incomeCategories.filter(cat => !["Service", "Other"].includes(cat))
                                    : expenseCategories.filter(cat => !["Software", "Hardware", "Marketing", "Salary", "Rent", "Other"].includes(cat));

                                  if (list.length === 0) {
                                    return <p className="dim-text" style={{ fontSize: '11px', textAlign: 'center', padding: '1rem 0' }}>No custom categories found for this type.</p>;
                                  }

                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                      {list.map(cat => {
                                        const isEditing = editingCategoryName === cat;
                                        return (
                                          <div
                                            key={cat}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              background: 'rgba(255,255,255,0.03)',
                                              border: '1px solid rgba(255,255,255,0.05)',
                                              borderRadius: '10px',
                                              padding: '0.6rem 0.8rem',
                                            }}
                                          >
                                            {isEditing ? (
                                              <input
                                                type="text"
                                                value={newCatNameInput}
                                                onChange={(e) => setNewCatNameInput(e.target.value)}
                                                autoFocus
                                                style={{
                                                  flex: 1,
                                                  background: 'rgba(0,0,0,0.2)',
                                                  border: '1px solid rgba(255,255,255,0.1)',
                                                  color: '#fff',
                                                  borderRadius: '6px',
                                                  padding: '0.2rem 0.4rem',
                                                  fontSize: '11px',
                                                  outline: 'none',
                                                  marginRight: '0.5rem'
                                                }}
                                              />
                                            ) : (
                                              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{cat}</span>
                                            )}

                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                              {isEditing ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.25rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                                                    onClick={() => handleRenameCategory(cat, newCatNameInput, editCatTab)}
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    type="button"
                                                    style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', padding: '0.25rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                                                    onClick={() => setEditingCategoryName(null)}
                                                  >
                                                    Cancel
                                                  </button>
                                                </>
                                              ) : (
                                                <>
                                                  <button
                                                    type="button"
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#00d4ff', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={() => { setEditingCategoryName(cat); setNewCatNameInput(cat); }}
                                                    title="Edit category name"
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    style={{ background: 'rgba(244,63,94,0.05)', border: 'none', color: '#f43f5e', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={() => handleDeleteCategory(cat, editCatTab)}
                                                    title="Delete category"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>

                              <button
                                type="button"
                                className="cancel-mission-btn"
                                style={{ width: '100%', padding: '0.8rem', fontSize: '11px' }}
                                onClick={() => { setIsManageCategoriesOpen(false); setEditingCategoryName(null); }}
                              >
                                CLOSE
                              </button>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emergency Alert Resolution Modal */}
              <AnimatePresence>
                {isEmergencyModalOpen && (
                  <motion.div 
                    className="emergency-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="emergency-modal"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button className="close-modal" onClick={() => setIsEmergencyModalOpen(false)}>×</button>
                      <div className="modal-header">
                        <h2>🚨 SECURE EMERGENCY RESOLUTION</h2>
                        <p>Acknowledge critical deadlines or navigate to pending sparks</p>
                      </div>

                      <div className="emergency-modal-columns">
                        {/* Column 1: Deadlines */}
                        <div className="emergency-column">
                          <h3>⚠️ DEADLINE ALERTS ({flames.length})</h3>
                          <div className="emergency-list">
                            {flames.map(p => (
                              <div key={p.id} className="emergency-item">
                                <div className="emergency-item-info">
                                  <span className="emergency-item-title">{p.service}</span>
                                  <span className="emergency-item-detail">Visionary: {getProjectClientName(p)}</span>
                                  <span className="emergency-item-status overdue">{getFlameNotifText(p)}</span>
                                </div>
                                <div className="emergency-item-actions">
                                  <button 
                                    className="emergency-item-btn read" 
                                    onClick={() => markFlameAsRead(p.id)}
                                    title="Mark as Read"
                                  >
                                    ✓
                                  </button>
                                  <button 
                                    className="emergency-item-btn go"
                                    onClick={() => {
                                      setProjectsSearchQuery(p.service || getProjectClientName(p) || "");
                                      setActiveAdminModule("PROJECTS");
                                      setIsAdminGridActive(true);
                                      setIsWarningDismissed(true);
                                      setIsEmergencyModalOpen(false);
                                      pushPageToHistory('admin', { activeAdminModule: 'PROJECTS', isAdminGridActive: true });
                                    }}
                                    title="Go to Project"
                                  >
                                    →
                                  </button>
                                </div>
                              </div>
                            ))}
                            {flames.length === 0 && <p className="dim-text small-hint">No pending deadlines</p>}
                          </div>
                        </div>

                        {/* Column 2: New Sparks */}
                        <div className="emergency-column">
                          <h3>📥 NEW SPARKS ({sparks.length})</h3>
                          <div className="emergency-list">
                            {sparks.map(s => (
                              <div key={s.id} className="emergency-item">
                                <div className="emergency-item-info">
                                  <span className="emergency-item-title">{s.name}</span>
                                  <span className="emergency-item-detail">Service: {s.service}</span>
                                  <span className="emergency-item-status new">New Inquiry</span>
                                </div>
                                <div className="emergency-item-actions">
                                  <button 
                                    className="emergency-item-btn read"
                                    onClick={() => markInquiryAsRead(s.id)}
                                    title="Mark as Read"
                                  >
                                    ✓
                                  </button>
                                  <button 
                                    className="emergency-item-btn go"
                                    onClick={() => {
                                      setInquiriesSearchQuery(s.name || "");
                                      setActiveAdminModule("INQUIRIES");
                                      setIsAdminGridActive(true);
                                      setIsWarningDismissed(true);
                                      setIsEmergencyModalOpen(false);
                                      pushPageToHistory('admin', { activeAdminModule: 'INQUIRIES', isAdminGridActive: true });
                                    }}
                                    title="Go to Spark"
                                  >
                                    →
                                  </button>
                                </div>
                              </div>
                            ))}
                            {sparks.length === 0 && <p className="dim-text small-hint">No new inquiries</p>}
                          </div>
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button className="cancel-mission-btn" onClick={markAllAlertsAsRead}>
                          MARK ALL AS READ
                        </button>
                        <button className="ignite-submit-btn" onClick={() => setIsEmergencyModalOpen(false)}>
                          CLOSE RESOLUTION VAULT
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Real-time Client Portal Notification Popup Stack */}
              <AnimatePresence>
                {isCommandCenterActive && isAdminGridActive && !isNotificationsMinimized && groupedClientPopups.length > 0 && !(hasUrgentAlert && !isWarningDismissed) && (
                  <motion.div 
                    ref={popupContainerRef}
                    key="popup-stack-container"
                    initial={{ opacity: 0, scale: 0.9, x: "-50%", y: -30 }}
                    animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.8, 
                      x: "-50%",
                      y: -30,
                      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                    }}
                    className="client-portal-popup-container"
                    onMouseEnter={() => setIsPopupHovered(true)}
                    onMouseLeave={() => setIsPopupHovered(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ pointerEvents: groupedClientPopups.length > 0 ? 'auto' : 'none' }}
                  >
                    <AnimatePresence>
                      {groupedClientPopups.map((popup, idx) => {
                        const offset = idx - activePopupIndex;
                        const offsetSpacing = isPopupHovered ? 24 : 10;
                        const isScrolledPast = offset < 0;

                        return (
                          <motion.div
                            key={popup.id}
                            className="client-portal-popup"
                            layout
                            initial={{ opacity: 0, y: -40, scale: 0.95 }}
                            animate={{
                              opacity: isScrolledPast ? 0 : Math.max(0, 1 - offset * 0.35),
                              y: isScrolledPast ? -120 : offset * offsetSpacing,
                              scale: isScrolledPast ? 0.95 : Math.max(0.8, 1 - offset * 0.04),
                              zIndex: groupedClientPopups.length - offset,
                            }}
                            exit={{ opacity: 0, scale: 0.9, y: -40, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            style={{
                              '--glow-color': getPopupThemeColor(popup.type),
                              pointerEvents: offset === 0 ? 'auto' : 'none',
                            }}
                          >
                            <div className="popup-glow"></div>
                            <div className="popup-body">
                              <div 
                                className="popup-icon-wrapper" 
                                style={{ 
                                  color: getPopupThemeColor(popup.type),
                                  background: `${getPopupThemeColor(popup.type)}15`,
                                  borderColor: `${getPopupThemeColor(popup.type)}30`
                                }}
                              >
                                <span className="popup-icon">{getPopupIcon(popup.type)}</span>
                              </div>
                              <div className="popup-text">
                                <div className="popup-header-row">
                                  <span 
                                    className="popup-badge" 
                                    style={{ 
                                      color: getPopupThemeColor(popup.type),
                                      background: `${getPopupThemeColor(popup.type)}15`
                                    }}
                                  >
                                    {getPopupBadgeLabel(popup.type)}
                                  </span>
                                  <span className="popup-time">{formatNotificationTime(popup.raw_date)}</span>
                                </div>
                                <h4 className="popup-title">{popup.title}</h4>
                                <p className="popup-message">{popup.message}</p>
                              </div>
                            </div>
                            <div className="popup-footer">
                              {groupedClientPopups.length > 1 ? (
                                <span className="popup-stack-helper">
                                  Stack: {activePopupIndex + 1} of {groupedClientPopups.length} <span className="scroll-hint">(scroll to cycle)</span>
                                </span>
                              ) : (
                                <span className="popup-stack-helper-single">✨ Client Update</span>
                              )}
                              <div className="popup-footer-actions">
                                <button className="popup-btn ack-btn" onClick={() => setIsNotificationsMinimized(true)}>
                                  MINIMIZE
                                </button>
                                <button className="popup-btn view-btn" onClick={() => handleViewNotification(popup)}>
                                  VIEW Details
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Vertical Pagination Indicators */}
                    {groupedClientPopups.length > 1 && (
                      <div className="stack-indicators">
                        {groupedClientPopups.map((popup, idx) => (
                          <button
                            key={popup.id}
                            className={`stack-indicator-dot ${idx === activePopupIndex ? 'active' : ''}`}
                            onClick={() => setActivePopupIndex(idx)}
                            title={`Go to group ${idx + 1}`}
                            style={{ '--glow-color': getPopupThemeColor(popup.type) }}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </section>

          {/* Client Vault Layout and sub-pages */}
          <section className={`client-vault-page ${isClientVaultActive ? 'active' : ''}`}>
            {isClientVaultActive && currentClient && (
              <ClientVaultLayout
                currentClient={currentClient}
                activeTab={activeClientTab}
                onTabChange={setActiveClientTab}
                onLogout={handleLogout}
                theme={theme}
                setTheme={setTheme}
                setSelectedProjectId={setSelectedClientProjectId}
                setSelectedInvoiceId={setSelectedClientInvoiceId}
              >
                {activeClientTab === 'DASHBOARD' && (
                  <ClientDashboard
                    currentClient={currentClient}
                    onTabChange={setActiveClientTab}
                    setSelectedProjectId={setSelectedClientProjectId}
                  />
                )}
                {activeClientTab === 'PROJECTS' && (
                  <ClientProjects
                    currentClient={currentClient}
                    onTabChange={setActiveClientTab}
                    setSelectedProjectId={setSelectedClientProjectId}
                  />
                )}
                {activeClientTab === 'PROJECT_DETAIL' && (
                  <ClientProjectDetail
                    projectId={selectedClientProjectId}
                    currentClient={currentClient}
                    onTabChange={setActiveClientTab}
                    setSelectedProjectId={setSelectedClientProjectId}
                  />
                )}
                {activeClientTab === 'MESSAGES' && (
                  <ClientProjectMessages
                    projectId={selectedClientProjectId}
                    currentClient={currentClient}
                    onTabChange={setActiveClientTab}
                  />
                )}
                {activeClientTab === 'ASSETS' && (
                  <ClientProjectAssets
                    projectId={selectedClientProjectId}
                    onTabChange={setActiveClientTab}
                  />
                )}
                {activeClientTab === 'GLOBAL_ASSETS' && (
                  <ClientGlobalAssets
                    client={currentClient}
                    setActiveClientTab={setActiveClientTab}
                  />
                )}
                {activeClientTab === 'COMMUNICATION' && (
                  <ClientCollaboration
                    currentClient={currentClient}
                    selectedProjectId={selectedClientProjectId}
                    setSelectedProjectId={setSelectedClientProjectId}
                  />
                )}
                {activeClientTab === 'INVOICES' && (
                  <ClientInvoices
                    currentClient={currentClient}
                    onTabChange={setActiveClientTab}
                    setSelectedInvoiceId={setSelectedClientInvoiceId}
                  />
                )}
                {activeClientTab === 'INVOICE_DETAIL' && (
                  <ClientInvoiceDetail
                    invoiceId={selectedClientInvoiceId}
                    onTabChange={setActiveClientTab}
                  />
                )}
                {activeClientTab === 'PROFILE' && (
                  <ClientProfile
                    currentClient={currentClient}
                    setCurrentClient={setCurrentClient}
                  />
                )}
              </ClientVaultLayout>
            )}
          </section>

          {/* Cinematic Splash Overlay System */}
          {!isFullyRevealed && (
            <div className="splash-overlay" style={{ '--logo-duration': '1.8s' }}>
              <div className={`eyelid upper-lid ${revealStarted ? 'retract-up' : ''}`}></div>
              <div className={`eyelid lower-lid ${revealStarted ? 'retract-down' : ''}`}></div>
              <div className="logo-outer-container">
                <svg viewBox="0 0 100 100" className={`logo-svg ${logoDrawn ? 'bloom-active' : ''} ${revealStarted ? 'fade-out' : ''}`}>
                  <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00E5FF" /><stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                    <filter id="bloom-filter" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1" />
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur2" />
                      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur3" />
                      <feColorMatrix in="blur3" type="matrix" values="0 0 0 0 0  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="cyan-glow" />
                      <feMerge><feMergeNode in="blur1" /><feMergeNode in="blur2" /><feMergeNode in="cyan-glow" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <path className="logo-path" d="M30 75 L30 25 L70 75 L70 25" fill="none" stroke="url(#logo-gradient)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" pathLength="100" />
                </svg>
              </div>
            </div>
          )}
          {/* Project Detail Drawer */}
          <AnimatePresence>
            {selectedKanbanProject && (
              <div className="notification-drawer-overlay" onClick={() => setSelectedKanbanProject(null)}>
                <motion.div
                  className="project-detail-drawer"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="drawer-header">
                    <div className="header-label">
                      <span className="accent-bar orange"></span>
                      <h2>PROJECT BLUEPRINT</h2>
                    </div>
                    <button className="close-notif" onClick={() => setSelectedKanbanProject(null)}>✕</button>
                  </div>

                  <div className="drawer-body">
                    <section className="client-profile-section">
                      <div className="profile-header">
                        <div className="p-avatar">{selectedKanbanProject.client.name.charAt(0)}</div>
                        <div className="p-main">
                          <h3>{selectedKanbanProject.client.name}</h3>
                          <p className="p-location">{selectedKanbanProject.client.address}</p>
                        </div>
                      </div>
                      <div className="profile-details-grid">
                        <div className="pd-item">
                          <span className="pd-label">WhatsApp</span>
                          <span className="pd-value">{selectedKanbanProject.client.phone}</span>
                        </div>
                        <div className="pd-item">
                          <span className="pd-label">Email</span>
                          <span className="pd-value">{selectedKanbanProject.client.email}</span>
                        </div>
                      </div>
                    </section>

                    <section className="drawer-sub-section">
                      <h4 className="section-title">PROGRESS ROADMAP</h4>
                      <div className="roadmap-list">
                        {selectedKanbanProject.milestones.map((m, idx) => (
                          <div key={idx} className={`roadmap-step ${m.completed ? 'done' : ''}`}>
                            <div className="step-check">
                              {m.completed && "✓"}
                            </div>
                            <span className="step-name">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="drawer-sub-section">
                      <h4 className="section-title">ACTIVITY LOG</h4>
                      <div className="log-list">
                        {selectedKanbanProject.activityLog.map((log, idx) => (
                          <div key={idx} className="log-entry">
                            <div className="log-dot"></div>
                            <div className="log-info">
                              <span className="log-time">{log.time}</span>
                              <p className="log-action">{log.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="drawer-footer">
                    <div className="status-management">
                      <span className="status-label">MANAGE PROJECT STATUS</span>
                      <div className="status-buttons">
                        {selectedKanbanProject.status !== "Ongoing" && (
                          <button className="status-btn s-ongoing" onClick={() => updateProjectStatus(selectedKanbanProject.id, "Ongoing")}>RESTORE TO ONGOING</button>
                        )}
                        {selectedKanbanProject.status !== "Completed" && (
                          <button className="status-btn s-completed" onClick={() => updateProjectStatus(selectedKanbanProject.id, "Completed")}>MARK COMPLETED</button>
                        )}
                        {selectedKanbanProject.status !== "Closed" && (
                          <button className="status-btn s-closed" onClick={() => updateProjectStatus(selectedKanbanProject.id, "Closed")}>CLOSE PROJECT</button>
                        )}
                        {selectedKanbanProject.status !== "Dismissed" && (
                          <button className="status-btn s-dismissed" onClick={() => updateProjectStatus(selectedKanbanProject.id, "Dismissed")}>DISMISS PROJECT</button>
                        )}
                      </div>
                    </div>

                    {selectedKanbanProject.stage < 4 && selectedKanbanProject.status === "Ongoing" && (
                      <button
                        className="move-stage-btn"
                        onClick={() => moveProjectStage(selectedKanbanProject.id)}
                      >
                        IGNITE {kanbanColumns[selectedKanbanProject.stage].title}
                      </button>
                    )}
                    <button className="vault-link-btn" onClick={() => setSelectedKanbanProject(null)}>CLOSE BLUEPRINT</button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Notification Engine Drawer */}
          <AnimatePresence>
            {isNotificationOpen && (
              <div className="notification-drawer-overlay" onClick={() => setIsNotificationOpen(false)}>
                <motion.div
                  className="notification-drawer"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="drawer-header">
                    <div className="header-label">
                      <span className="accent-bar"></span>
                      <h2>NOTIFICATIONS</h2>
                    </div>
                    <button className="close-notif" onClick={() => setIsNotificationOpen(false)}>✕</button>
                  </div>

                  <div className="drawer-tabs">
                    <button
                      className={`tab-btn ${notifTab === 'SPARKS' ? 'active' : ''}`}
                      onClick={() => setNotifTab('SPARKS')}
                    >
                      NEW SPARKS
                      {sparks.length > 0 && <span className="tab-badge cyan">{sparks.length}</span>}
                    </button>
                    <button
                      className={`tab-btn ${notifTab === 'FLAMES' ? 'active' : ''}`}
                      onClick={() => setNotifTab('FLAMES')}
                    >
                      URGENT FLAMES
                      {flames.length > 0 && <span className="tab-badge orange">{flames.length}</span>}
                    </button>
                    <button
                      className={`tab-btn ${notifTab === 'CLIENT' ? 'active' : ''}`}
                      onClick={() => setNotifTab('CLIENT')}
                    >
                      CLIENT PORTAL
                      {unreadClientNotifs.length > 0 && <span className="tab-badge indigo">{unreadClientNotifs.length}</span>}
                    </button>
                  </div>

                  <div className="drawer-content">
                    {notifTab === 'SPARKS' ? (
                      <div className="notif-list">
                        {sparks.length > 0 && sparks.map(s => (
                          <div key={s.id} className="notif-card spark flex justify-between items-center" onClick={() => {
                            setInquiriesSearchQuery(s.name || s.clientName);
                            setActiveAdminModule("INQUIRIES");
                            setIsAdminGridActive(true);
                            setIsNotificationOpen(false);
                            pushPageToHistory('admin', { activeAdminModule: 'INQUIRIES', isAdminGridActive: true });
                          }}>
                            <div className="flex items-center gap-3">
                              <div className="notif-icon-box cyan">✦</div>
                              <div className="notif-info">
                                <p className="notif-msg">New inquiry from <strong>{s.name}</strong></p>
                                <span className="notif-time">{s.date}</span>
                              </div>
                            </div>
                            <button
                              className="text-3xs uppercase tracking-wider text-cyan-400 hover:text-cyan-300 font-extrabold px-2.5 py-1 rounded bg-cyan-400/10 border border-cyan-400/20 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                markInquiryAsRead(s.id);
                              }}
                            >
                              MARK READ
                            </button>
                          </div>
                        ))}

                        {/* Sparks History */}
                        {sparksHistory.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <h4 className="text-3xs uppercase tracking-widest text-muted-foreground font-bold mb-2 px-2">History</h4>
                            {sparksHistory.map(s => (
                              <div key={s.id} className="notif-card spark history opacity-65 flex justify-between items-center" onClick={() => {
                                setInquiriesSearchQuery(s.name || s.clientName);
                                setActiveAdminModule("INQUIRIES");
                                setIsAdminGridActive(true);
                                setIsNotificationOpen(false);
                                pushPageToHistory('admin', { activeAdminModule: 'INQUIRIES', isAdminGridActive: true });
                              }}>
                                <div className="flex items-center gap-3">
                                  <div className="notif-icon-box grayscale">✦</div>
                                  <div className="notif-info">
                                    <p className="notif-msg">Inquiry from <strong>{s.name}</strong></p>
                                    <span className="notif-time">{s.date}</span>
                                  </div>
                                </div>
                                <span className="text-3xs uppercase tracking-wider text-muted-foreground font-extrabold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                  {s.status === 'Ignited' ? 'Ignited 🔥' : 'Read'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {sparks.length === 0 && sparksHistory.length === 0 && (
                          <div className="empty-state">
                            <span className="empty-icon">✧</span>
                            <p>No sparks detected.</p>
                          </div>
                        )}
                      </div>
                    ) : notifTab === 'FLAMES' ? (
                      <div className="notif-list">
                        {flames.length > 0 && flames.map(f => (
                          <div key={f.id} className="notif-card flame flex justify-between items-center" onClick={() => {
                            setProjectsSearchQuery(getProjectClientName(f));
                            setSelectedProjectTab(f.id);
                            setActiveAdminModule("PROJECTS");
                            setIsAdminGridActive(true);
                            setIsNotificationOpen(false);
                            pushPageToHistory('admin', { activeAdminModule: 'PROJECTS', isAdminGridActive: true });
                          }}>
                            <div className="flex items-center gap-3">
                              <div className="notif-icon-box orange">🔥</div>
                              <div className="notif-info">
                                <p className="notif-msg">
                                  {new Date(f.deadline) - new Date() < 0 ? "Project Overdue: " : "Deadline approaching for "}
                                  <strong>{getProjectClientName(f)}</strong>
                                </p>
                                <span className="notif-time">{getFlameNotifText(f)}</span>
                              </div>
                            </div>
                            <button
                              className="text-3xs uppercase tracking-wider text-orange-400 hover:text-orange-300 font-extrabold px-2.5 py-1 rounded bg-orange-400/10 border border-orange-400/20 cursor-pointer"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  markFlameAsRead(f.id);
                                  setProjectsSearchQuery(getProjectClientName(f));
                                  setSelectedProjectTab(f.id);
                                  setActiveAdminModule("PROJECTS");
                                  setIsAdminGridActive(true);
                                  setIsNotificationOpen(false);
                                  pushPageToHistory('admin', { activeAdminModule: 'PROJECTS', isAdminGridActive: true });
                              }}
                            >
                              VIEW
                            </button>
                          </div>
                        ))}

                        {/* Flames History */}
                        {flamesHistory.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <h4 className="text-3xs uppercase tracking-widest text-muted-foreground font-bold mb-2 px-2">History</h4>
                            {flamesHistory.map(f => (
                              <div key={f.id} className="notif-card flame history opacity-65 flex justify-between items-center" onClick={() => {
                                setProjectsSearchQuery(getProjectClientName(f));
                                setSelectedProjectTab(f.id);
                                setActiveAdminModule("PROJECTS");
                                setIsAdminGridActive(true);
                                setIsNotificationOpen(false);
                                pushPageToHistory('admin', { activeAdminModule: 'PROJECTS', isAdminGridActive: true });
                              }}>
                                <div className="flex items-center gap-3">
                                  <div className="notif-icon-box grayscale">🔥</div>
                                  <div className="notif-info">
                                    <p className="notif-msg">
                                      {new Date(f.deadline) - new Date() < 0 ? "Project Overdue: " : "Deadline approached: "}
                                      <strong>{getProjectClientName(f)}</strong>
                                    </p>
                                    <span className="notif-time">{getFlameNotifText(f)}</span>
                                  </div>
                                </div>
                                <span className="text-3xs uppercase tracking-wider text-muted-foreground font-extrabold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                  Dismissed
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {flames.length === 0 && flamesHistory.length === 0 && (
                          <div className="empty-state">
                            <span className="empty-icon">🕯️</span>
                            <p>No urgent flames currently burning.</p>
                          </div>
                        )}
                      </div>
                    ) : notifTab === 'CLIENT' ? (
                      <div className="notif-list relative">
                        <div className="flex justify-between items-center mb-4 px-2">
                          <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Communications</span>
                          <button 
                            className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                            onClick={() => setShowClientNotifHistory(!showClientNotifHistory)}
                          >
                            {showClientNotifHistory ? "Show Unread" : "History"}
                          </button>
                        </div>
                        {(() => {
                          const visibleNotifs = clientPortalNotifs.filter(n => showClientNotifHistory ? n.is_read : !n.is_read);
                          if (visibleNotifs.length === 0) {
                            return (
                              <div className="text-center text-muted-foreground/30 py-20 flex flex-col items-center gap-4">
                                <span className="empty-icon text-indigo-500/20">✦</span>
                                <span className="text-xs uppercase tracking-widest text-balance leading-relaxed">
                                  No {showClientNotifHistory ? 'read' : 'unread'} client activity.
                                </span>
                              </div>
                            );
                          }
                          const groupedNotifs = visibleNotifs.reduce((acc, n) => {
                            const key = n.client_id ? `client-${n.client_id}` : `project-${n.project_id}`;
                            if (!acc[key]) {
                              let targetClientName = null;
                              if (n.type === 'Profile Update' || n.client_id) {
                                const client = clients.find(c => c.id === n.client_id);
                                if (client) targetClientName = client.name;
                              } else {
                                const project = ignitionQueue.find(p => p.id === n.project_id);
                                if (project && project.client) targetClientName = project.client.name;
                              }
                              acc[key] = {
                                id: key,
                                targetClientName: targetClientName || 'Unknown',
                                messages: []
                              };
                            }
                            acc[key].messages.push(n);
                            return acc;
                          }, {});

                          return Object.values(groupedNotifs).map(group => (
                            <div key={group.id} className="flex flex-col mb-3 border border-white/5 rounded-xl bg-black/20 overflow-hidden">
                              <div 
                                className="p-3 cursor-pointer hover:bg-white/5 transition-colors flex justify-between items-center"
                                onClick={() => setExpandedNotifGroup(expandedNotifGroup === group.id ? null : group.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`notif-icon-box ${showClientNotifHistory ? 'grayscale' : 'indigo'}`}>✦</div>
                                  <span className="font-bold text-sm text-indigo-300">{group.targetClientName}</span>
                                </div>
                                <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{group.messages.length}</span>
                              </div>
                              <AnimatePresence>
                                {expandedNotifGroup === group.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-white/5 bg-black/40 flex flex-col"
                                  >
                                    {group.messages.map(n => (
                                      <div 
                                        key={n.id} 
                                        className={`notif-card flex justify-between items-center border-b border-white/5 last:border-0 rounded-none m-0 bg-transparent hover:bg-white/5 transition-colors ${n.is_read ? 'opacity-65' : ''}`}
                                        onClick={() => {
                                          const allIdsInGroup = group.messages.map(m => m.id);
                                          markClientNotifAsRead(allIdsInGroup);
                                          
                                          let targetClientName = group.targetClientName;
                                          if (targetClientName && targetClientName !== 'Unknown') {
                                            setClientsSearchQuery(targetClientName);
                                            setActiveAdminModule("CLIENTS");
                                            setIsAdminGridActive(true);
                                            setIsNotificationOpen(false);
                                            pushPageToHistory('admin', { activeAdminModule: 'CLIENTS', isAdminGridActive: true });
                                          } else {
                                            setIsNotificationOpen(false);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="notif-info">
                                            <p className="notif-msg">{n.message}</p>
                                            <span className="notif-time">{n.type}</span>
                                          </div>
                                        </div>
                                        {!n.is_read && (
                                          <button
                                            className="text-3xs uppercase tracking-wider text-indigo-400 hover:text-indigo-300 font-extrabold px-2.5 py-1 rounded bg-indigo-400/10 border border-indigo-400/20 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const allIdsInGroup = group.messages.map(m => m.id);
                                              markClientNotifAsRead(allIdsInGroup);
                                            }}
                                          >
                                            MARK READ
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {customPaymentPrompt && (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  maxWidth: '400px', width: '90%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto',
                  background: 'rgba(5, 5, 5, 0.98)', border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderTop: '2px solid #00E5FF', borderRadius: '4px'
                }}
              >
                <h2 className="modal-title" style={{ color: '#00e5ff', marginTop: '0', marginBottom: '0.8rem' }}>Log Payment</h2>
                <p className="dim-text" style={{ marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {customPaymentPrompt.adv > 0
                    ? `Advance of ₹${customPaymentPrompt.adv} recorded. Enter remaining amount to log for `
                    : `No advance recorded. Enter amount to log to cashbook for `}
                  <strong>{customPaymentPrompt.p.service}</strong>:
                  <br /><span style={{ fontSize: '0.75rem' }}>(Leave as is for full remaining amount)</span>
                </p>

                <div className="ignition-form">
                  <div className="input-group" style={{ marginBottom: '1.2rem' }}>
                    <label>Payment Mode</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button
                        className="ignition-btn"
                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: customPaymentPrompt.paymentMode === 'UPI' ? 'rgba(0, 229, 255, 0.2)' : 'transparent', border: customPaymentPrompt.paymentMode === 'UPI' ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.2)', color: customPaymentPrompt.paymentMode === 'UPI' ? '#00e5ff' : '#808080' }}
                        onClick={() => setCustomPaymentPrompt({ ...customPaymentPrompt, paymentMode: 'UPI' })}
                      >UPI</button>
                      <button
                        className="ignition-btn secondary"
                        style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: customPaymentPrompt.paymentMode === 'Cash' ? 'rgba(0, 229, 255, 0.2)' : 'transparent', border: customPaymentPrompt.paymentMode === 'Cash' ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.2)', color: customPaymentPrompt.paymentMode === 'Cash' ? '#00e5ff' : '#808080' }}
                        onClick={() => setCustomPaymentPrompt({ ...customPaymentPrompt, paymentMode: 'Cash' })}
                      >CASH</button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Amount (₹)</label>
                    <input
                      type="number"
                      id="custom-payment-input"
                      className="ignition-input"
                      defaultValue={customPaymentPrompt.defaultAmt}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button
                      style={{
                        fontSize: '0.75rem', padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'
                      }}
                      onClick={() => document.getElementById('custom-payment-input').value = customPaymentPrompt.finalQuote}
                    >
                      Full (₹{customPaymentPrompt.finalQuote})
                    </button>
                    {customPaymentPrompt.adv > 0 && (
                      <>
                        <button
                          style={{
                            fontSize: '0.75rem', padding: '0.5rem 1rem',
                            background: 'rgba(0, 229, 255, 0.1)',
                            color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)',
                            borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'
                          }}
                          onClick={() => document.getElementById('custom-payment-input').value = customPaymentPrompt.defaultAmt}
                        >
                          Remaining (₹{customPaymentPrompt.defaultAmt})
                        </button>
                        <button
                          style={{
                            fontSize: '0.75rem', padding: '0.5rem 1rem',
                            background: 'rgba(255, 69, 0, 0.1)',
                            color: '#ff4500', border: '1px solid rgba(255,69,0,0.3)',
                            borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'
                          }}
                          onClick={() => document.getElementById('custom-payment-input').value = customPaymentPrompt.adv}
                        >
                          Advance (₹{customPaymentPrompt.adv})
                        </button>
                      </>
                    )}
                  </div>

                  <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <button
                      style={{ flex: 1, padding: '0.8rem', background: 'transparent', color: '#808080', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold' }}
                      onClick={() => setCustomPaymentPrompt(null)}
                    >
                      CANCEL
                    </button>
                    <button
                      style={{ flex: 1, padding: '0.8rem', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold' }}
                      onClick={async () => {
                        const inputVal = document.getElementById('custom-payment-input')?.value || '';
                        const parsed = parseFloat(inputVal);
                        const amt = (!isNaN(parsed) && parsed > 0) ? parsed : customPaymentPrompt.defaultAmt;

                        try {
                          await updateProjectState(customPaymentPrompt.p.id, {
                            stage: 4,
                            status: "Completed",
                            paymentStatus: "paid",
                            progress: 100
                          });
                          const actionMsg = `Project marked as Completed & Final Payment of ₹${amt} Logged`;
                          await addProjectActivityLog(customPaymentPrompt.p.id, actionMsg);
                        } catch (err) {
                          console.error("Failed to sync completed project status to Supabase:", err);
                        }

                        if (amt > 0) {
                          const entryId = Date.now();
                          setCashbookEntries(prev => [...prev, {
                            id: entryId,
                            projectId: customPaymentPrompt.p.id,
                            date: getISTDateString(),
                            desc: `Payment: ${customPaymentPrompt.p.service} - ${customPaymentPrompt.p.name}`,
                            amount: amt,
                            type: "INCOME",
                            mode: customPaymentPrompt.paymentMode,
                            category: "Project",
                            isFinal: true
                          }]);
                          setHighlightedCashbookId(entryId);
                          setActiveAdminModule("FINANCIALS");
                          setFinancialTab("CASHBOOK");
                          setTimeout(() => {
                            setHighlightedCashbookId(null);
                          }, 4000);
                          alert(`Payment of ₹${amt} logged to Cashbook!`);
                        } else {
                          setActiveAdminModule("FINANCIALS");
                          setFinancialTab("CASHBOOK");
                        }

                        // Auto-generate and save invoice to vault when project completes
                        const completedProjectForInvoice = {
                          ...customPaymentPrompt.p,
                          status: "Completed",
                          stage: 4,
                          paymentStatus: "paid",
                          progress: 100
                        };
                        const existingInvoice = invoices.find(i => i.rawProject?.id === customPaymentPrompt.p.id || i.projectId === customPaymentPrompt.p.id);
                        if (!existingInvoice) {
                          const invNo = getUniqueInvoiceNumber(customPaymentPrompt.p.createdAt);
                          saveInvoiceToVault(completedProjectForInvoice, invNo);
                        } else {
                          const subtotal = parseFloat(customPaymentPrompt.p.quote) || 0;
                          const discount = parseFloat(customPaymentPrompt.p.discount) || 0;
                          const finalGrandTotal = subtotal - discount;
                          try {
                            await updateInvoice(existingInvoice.id, {
                              ...existingInvoice,
                              projectId: customPaymentPrompt.p.id,
                              grandTotal: finalGrandTotal
                            });
                            setInvoices(prev => prev.map(inv => {
                              if (inv.id === existingInvoice.id) {
                                  return {
                                    ...inv,
                                    grandTotal: finalGrandTotal,
                                    rawProject: completedProjectForInvoice
                                  };
                              }
                              return inv;
                            }));
                          } catch (err) {
                            console.error("Failed to update existing draft invoice grand total:", err);
                          }
                        }

                        setIgnitionQueue(prev => prev.map(proj =>
                          proj.id === customPaymentPrompt.p.id ? {
                            ...proj,
                            paymentStatus: 'paid',
                            status: "Completed",
                            stage: 4,
                            progress: 100,
                            milestones: (proj.milestones || []).map(m => ({ ...m, completed: true })),
                            activityLog: [
                              { action: `Project marked as Completed & Final Payment of ₹${amt} Logged`, time: new Date().toLocaleTimeString() },
                              ...(proj.activityLog || [])
                            ]
                          } : proj
                        ));

                        setSelectedKanbanProject(prev => {
                          if (prev && prev.id === customPaymentPrompt.p.id) {
                            return {
                              ...prev,
                              stage: 4,
                              status: "Completed",
                              paymentStatus: 'paid',
                              progress: 100,
                              milestones: (prev.milestones || []).map(m => ({ ...m, completed: true }))
                            };
                          }
                          return prev;
                        });

                        setCustomPaymentPrompt(null);
                      }}>
                      CONFIRM
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          <AnimatePresence>
            {isInvoicePreviewOpen && invoiceProject && (
              <div className="invoice-modal-overlay" style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex',
                justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '40px 20px'
              }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="invoice-paper"
                  style={{
                    width: '100%', maxWidth: '850px', background: 'transparent', color: '#000',
                    padding: '0', borderRadius: '8px', overflow: 'visible'
                  }}
                >
                  {(() => {
                    const rowsPerPage = 6;
                    const existingInvoice = invoices.find(inv => {
                      if (invoiceProject.invoiceNo && inv.invoiceNo === invoiceProject.invoiceNo) {
                        return true;
                      }
                      if (invoiceProject.isStandalone) {
                        return inv.id === invoiceProject.id;
                      }
                      return inv.projectId === invoiceProject.id || inv.rawProject?.id === invoiceProject.id;
                    });
                    const stableInvoiceNo = existingInvoice ? existingInvoice.invoiceNo : (invoiceProject.invoiceNo || getUniqueInvoiceNumber(invoiceProject.createdAt));

                    const isMicroJobInvoice = (stableInvoiceNo && /^CMS/i.test(stableInvoiceNo)) || 
                                              (invoiceProject.projectId === 'MICRO_JOB') ||
                                              (invoiceProject.microJobIds && invoiceProject.microJobIds.length > 0) ||
                                              (existingInvoice && (
                                                (existingInvoice.invoiceNo && /^CMS/i.test(existingInvoice.invoiceNo)) ||
                                                (existingInvoice.microJobIds && existingInvoice.microJobIds.length > 0)
                                              ));

                    const isPendingMicroJob = isMicroJobInvoice && 
                      (invoiceProject.paymentStatus?.toLowerCase() === 'pending' || 
                       invoiceProject.paymentStatus?.toLowerCase() === 'unpaid' ||
                       (existingInvoice && (existingInvoice.paymentStatus?.toLowerCase() === 'pending' || existingInvoice.paymentStatus?.toLowerCase() === 'unpaid')));

                    const isStandalone = (invoiceProject.projectId === null) || invoiceProject.isStandalone || stableInvoiceNo?.includes('/C') || (invoiceProject.id && typeof invoiceProject.id === 'string' && (invoiceProject.id.startsWith('custom-') || invoiceProject.id.startsWith('local-')));
                    const isCompletedProject = (invoiceProject.status || '').toLowerCase() === 'completed';
                    const showDraftInvoiceHeader = isMicroJobInvoice ? isPendingMicroJob : (!isStandalone && !isCompletedProject);

                    // If it's a batch project, use its internal items, otherwise use single project as one item
                    const allItems = (invoiceProject.items && invoiceProject.items.length > 0)
                      ? invoiceProject.items.map(item => ({
                        service: item.service,
                        quote: item.quote,
                        discount: item.discount || 0,
                        qty: item.qty,
                        rate: item.rate
                      }))
                      : [{
                        service: invoiceProject.service,
                        quote: invoiceProject.quote,
                        discount: invoiceProject.discount || 0,
                        qty: invoiceProject.qty,
                        rate: invoiceProject.rate
                      }];

                    const pages = [];
                    for (let i = 0; i < allItems.length; i += rowsPerPage) {
                      pages.push(allItems.slice(i, i + rowsPerPage));
                    }
                    if (pages.length === 0) pages.push([]);

                    const pageRenders = pages.map((pageItems, pageIdx) => {
                      const isLastPage = pageIdx === pages.length - 1;
                      const blankRowsCount = Math.max(0, rowsPerPage - pageItems.length);
                      const pageSubtotal = pageItems.reduce((sum, item) => sum + (parseFloat(item.rate || item.quote) * (item.qty || 1)), 0);
                      const pageDiscount = pageItems.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
                      const pageTotal = pageSubtotal - pageDiscount;

                      return (
                        <div
                          key={pageIdx}
                          className="invoice-page-unit"
                          style={{
                            width: '800px', height: '1130px', background: '#fff',
                            marginBottom: '30px', borderRadius: '4px', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column', position: 'relative',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)', margin: '0 auto 30px'
                          }}
                        >
                          <div style={{
                            background: 'linear-gradient(115deg, #d32f2f 58%, #222 58.2%)',
                            padding: '12px 40px 12px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            color: '#fff', position: 'relative'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 2 }}>
                              <img
                                src="/logo.png"
                                alt="Netra Logo"
                                style={{
                                  height: '95px',
                                  width: 'auto',
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))',
                                  flexShrink: 0
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h1 style={{ margin: 0, fontSize: '2.0rem', fontWeight: '900', fontFamily: 'Urbanist, sans-serif', letterSpacing: '1px' }}>{adminProfile.businessName.toUpperCase()}</h1>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', opacity: 0.95, marginTop: '6px' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 5.92 5.92l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" />
                                    </svg>
                                    {adminProfile.phone}
                                  </span>
                                  <span>📧 {adminProfile.email}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', zIndex: 2 }}>
                              <h2 style={{ margin: 0, fontSize: '2.0rem', letterSpacing: '3px', fontWeight: '900', fontFamily: 'Urbanist, sans-serif' }}>
                                {showDraftInvoiceHeader ? "DRAFT INVOICE" : "TAX INVOICE"}
                              </h2>
                              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9, maxWidth: '300px', marginLeft: 'auto' }}>{adminProfile.address}</p>
                            </div>
                          </div>

                          {/* BILL TO & DETAILS */}
                          <div style={{ padding: '25px 40px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <label style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '1px', fontWeight: 'bold' }}>BILL TO</label>
                              <h3 style={{ margin: '5px 0 0 0', fontSize: '1.2rem', fontWeight: '900' }}>{invoiceProject.name.toUpperCase()}</h3>
                              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555', maxWidth: '350px' }}>AT {getClientAddress(invoiceProject.name)}</p>
                              {(() => {
                                const targetClientId = invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink;
                                const clientObj = (targetClientId ? clients.find(c => c.id === targetClientId) : null) || clients.find(c => c.name.trim().toLowerCase() === invoiceProject.name.trim().toLowerCase()) || invoiceProject.client;
                                const phone = invoiceProject.phone || clientObj?.phone;
                                const email = invoiceProject.email || clientObj?.email;
                                const isSystemEmail = email && email.endsWith('@netra.graphics');
                                return (
                                  <>
                                    {phone && <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📞 {phone}</p>}
                                    {email && !isSystemEmail && <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📧 {email}</p>}
                                  </>
                                );
                              })()}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <label style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>INVOICE DETAILS</label>
                              <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Invoice #:</strong> {stableInvoiceNo}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem' }}><strong>Issue Date:</strong> {(() => {
                                if (stableInvoiceNo) {
                                  const match = stableInvoiceNo.match(/(?:NG\/|CMS\/|INV-)?(\d{2})(\d{2})(\d{4})/);
                                  if (match) {
                                    const dateObj = new Date(`${match[3]}-${match[2]}-${match[1]}`);
                                    if (!isNaN(dateObj.getTime())) {
                                      return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                    }
                                  }
                                }
                                if (existingInvoice && existingInvoice.issueDate) {
                                  return existingInvoice.issueDate;
                                }
                                const isCompleted = (invoiceProject.status || '').toLowerCase() === 'completed';
                                let finalDate = invoiceProject.issueDate || invoiceProject.createdAt || Date.now();
                                if (isCompleted) {
                                  const completionLog = (invoiceProject.activityLog || invoiceProject.rawProject?.activityLog || []).find(l => l.action.toLowerCase().includes('completed') || l.action.toLowerCase().includes('final payment'));
                                  if (completionLog?.raw_date) finalDate = completionLog.raw_date;
                                }
                                return new Date(finalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                              })()}</p>
                            </div>
                          </div>

                          {/* SERVICE TABLE - FIXED 6 ROWS */}
                          <div style={{ padding: '0 40px', flex: 1, position: 'relative' }}>
                            <div style={{
                              position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)',
                              fontSize: '25rem', fontWeight: '900', color: 'rgba(0,0,0,0.02)', zIndex: 0, pointerEvents: 'none',
                              fontFamily: 'Urbanist'
                            }}>N</div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', position: 'relative', zIndex: 1 }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                                  <th style={{ padding: '10px 0', fontSize: '0.75rem', color: '#000', fontWeight: '900' }}>SERVICE DESCRIPTION</th>
                                  <th style={{ padding: '10px 0', fontSize: '0.75rem', color: '#000', textAlign: 'center', fontWeight: '900' }}>QTY</th>
                                  <th style={{ padding: '10px 0', fontSize: '0.75rem', color: '#000', textAlign: 'right', fontWeight: '900' }}>RATE</th>
                                  <th style={{ padding: '10px 0', fontSize: '0.75rem', color: '#000', textAlign: 'center', fontWeight: '900' }}>DISC (%)</th>
                                  <th style={{ padding: '10px 0', fontSize: '0.75rem', color: '#000', textAlign: 'right', fontWeight: '900' }}>TOTAL</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pageItems.map((item, idx) => {
                                  const discountPercent = item.quote > 0 ? Math.round((item.discount / item.quote) * 100) : 0;
                                  return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                      <td style={{ padding: '15px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <span style={{ color: '#d32f2f', fontSize: '1.2rem' }}>•</span>
                                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.service}</span>
                                        </div>
                                      </td>
                                      <td style={{ textAlign: 'center', fontSize: '0.9rem' }}>{item.qty || 1}</td>
                                      <td style={{ textAlign: 'right', fontSize: '0.9rem' }}>₹{formatCurrencyValue(item.rate || item.quote)}</td>
                                      <td style={{ textAlign: 'center', fontSize: '0.9rem', color: discountPercent > 0 ? '#2e7d32' : '#888', fontWeight: 'bold' }}>
                                        {discountPercent > 0 ? `${discountPercent}%` : '-'}
                                      </td>
                                      <td style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold' }}>₹{formatCurrencyValue(parseFloat(item.rate || item.quote) * (item.qty || 1) - (parseFloat(item.discount) || 0))}</td>
                                    </tr>
                                  );
                                })}
                                {Array(blankRowsCount).fill(null).map((_, idx) => (
                                  <tr key={`blank-${idx}`} style={{ height: '40px', borderBottom: '1px solid #f9f9f9' }}>
                                    <td></td><td></td><td></td><td></td><td></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* TOTALS & FOOTER - ON ALL PAGES */}
                          <div style={{ background: '#fff', borderTop: '1px solid #eee' }}>
                            <div style={{ padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              {/* Payment Instructions */}
                              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', width: '58%', border: '1px solid #eee' }}>
                                <div style={{ width: '80px', height: '80px', background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                    `upi://pay?pa=${bankingDetails.upiId}&pn=${bankingDetails.accountName}&am=${
                                      (() => {
                                        const isStandalone = invoiceProject.isStandalone || 
                                                             (invoiceProject.invoiceNo && invoiceProject.invoiceNo.includes('/C')) ||
                                                             (invoiceProject.id && typeof invoiceProject.id === 'string' && (invoiceProject.id.startsWith('custom-') || invoiceProject.id.startsWith('local-')));
                                        const subtotal = parseFloat(invoiceProject.quote) || 0;
                                        const discount = parseFloat(invoiceProject.discount) || 0;
                                        const grandTotal = subtotal - discount;
                                        if (isStandalone) {
                                          return grandTotal;
                                        }
                                        return isLastPage 
                                          ? (() => {
                                              const isCompleted = (invoiceProject.status || '').toLowerCase() === 'completed';
                                              const advance = parseFloat(invoiceProject.advanceAmount) || 0;
                                              return isCompleted ? grandTotal : (advance > 0 ? grandTotal - advance : grandTotal);
                                            })()
                                          : pageTotal;
                                      })()
                                    }&cu=INR`
                                  )}`} alt="UPI QR" style={{ width: '100%', height: '100%' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#546e7a', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                    🏠 PAYMENT INSTRUCTIONS
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>Bank Name</span><strong style={{ fontSize: '0.65rem' }}>{bankingDetails.bankName}</strong></div>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>Account Name</span><strong style={{ fontSize: '0.65rem' }}>{bankingDetails.accountName}</strong></div>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>Account Number</span><strong style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>{bankingDetails.accountNumber}</strong></div>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>IFSC Code</span><strong style={{ fontSize: '0.65rem', fontFamily: 'monospace' }}>{bankingDetails.ifscCode}</strong></div>
                                  </div>
                                </div>
                              </div>

                              {/* Totals Section */}
                              <div style={{ width: '38%', textAlign: 'right' }}>
                                {isLastPage ? (
                                  <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                      <span style={{ color: '#666' }}>SUBTOTAL</span>
                                      <span style={{ fontWeight: 'bold' }}>₹{formatCurrencyValue(invoiceProject.quote)}</span>
                                    </div>
                                    {(parseFloat(invoiceProject.discount) || 0) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                        <span style={{ color: '#666' }}>DISCOUNT</span>
                                        <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>-₹{formatCurrencyValue(invoiceProject.discount)}</span>
                                      </div>
                                    )}

                                    {(() => {
                                      const isCompleted = (invoiceProject.status || '').toLowerCase() === 'completed';
                                      const subtotal = parseFloat(invoiceProject.quote) || 0;
                                      const discount = parseFloat(invoiceProject.discount) || 0;
                                      const advance = parseFloat(invoiceProject.advanceAmount) || 0;
                                      const grandTotal = subtotal - discount;
                                      const remaining = grandTotal - advance;

                                      const showGrandTotal = isMicroJobInvoice ? !isPendingMicroJob : isCompleted;

                                      if (showGrandTotal) {
                                        // Completed / Settled: show clean Grand Total only
                                        return (
                                          <div style={{
                                            background: '#1b5e20', padding: '10px 15px', color: '#fff', borderRadius: '6px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px'
                                          }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>GRAND TOTAL</span>
                                            <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>₹{formatCurrencyValue(grandTotal)}</span>
                                          </div>
                                        );
                                      } else {
                                        // In Progress / Pending Microjob: show advance deduction + Remaining Due
                                        return (
                                          <>
                                            {advance > 0 && (
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                                                <span style={{ color: '#666' }}>ADVANCE PAID</span>
                                                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>-₹{formatCurrencyValue(advance)}</span>
                                              </div>
                                            )}
                                            <div style={{
                                              background: '#3f51b5', padding: '10px 15px', color: '#fff', borderRadius: '6px',
                                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px'
                                            }}>
                                              <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>REMAINING DUE</span>
                                              <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>₹{formatCurrencyValue(advance > 0 ? remaining : grandTotal)}</span>
                                            </div>
                                          </>
                                        );
                                      }
                                    })()}
                                  </>
                                ) : (
                                  <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                      <span style={{ color: '#666' }}>PAGE SUBTOTAL</span>
                                      <span style={{ fontWeight: 'bold' }}>₹{formatCurrencyValue(pageSubtotal)}</span>
                                    </div>
                                    {pageDiscount > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                        <span style={{ color: '#666' }}>PAGE DISCOUNT</span>
                                        <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>-₹{formatCurrencyValue(pageDiscount)}</span>
                                      </div>
                                    )}
                                    <div style={{
                                      background: '#37474f', padding: '10px 15px', color: '#fff', borderRadius: '6px',
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px'
                                    }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>PAGE TOTAL</span>
                                      <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>₹{formatCurrencyValue(pageTotal)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div style={{ padding: '0 40px 12px' }}>
                              <div style={{ background: '#fcfcfc', border: '1px solid #f0f0f0', borderLeft: '3px solid #d32f2f', padding: '6px 12px' }}>
                                <label style={{ fontSize: '0.5rem', color: '#888', fontWeight: '900', display: 'block' }}>
                                  {isLastPage ? 'AMOUNT IN WORDS' : 'PAGE TOTAL IN WORDS'}
                                </label>
                                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  {isLastPage ? (
                                    (() => {
                                      const isCompleted = (invoiceProject.status || '').toLowerCase() === 'completed';
                                      const subtotal = parseFloat(invoiceProject.quote) || 0;
                                      const discount = parseFloat(invoiceProject.discount) || 0;
                                      const advance = parseFloat(invoiceProject.advanceAmount) || 0;
                                      const grandTotal = subtotal - discount;
                                      return amountInWords(isCompleted ? grandTotal : (advance > 0 ? grandTotal - advance : grandTotal));
                                    })()
                                  ) : (
                                    amountInWords(pageTotal)
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Signatures Area */}
                            <div style={{ padding: '0 40px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '130px', borderBottom: '1px solid #333', marginBottom: '4px' }}></div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#666' }}>Receiver's Sign</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: '900' }}>For {adminProfile.businessName}</h4>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.6rem', color: '#999', fontStyle: 'italic' }}>
                                  This is a computer generated invoice hence signatory not required.
                                </p>
                              </div>
                            </div>

                            {/* FOOTER CARDS */}
                            <div style={{ padding: '0 40px 15px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                              <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.7rem', fontWeight: '900' }}>Follow Us on Instagram</h4>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  <div style={{ width: '35px', height: '35px' }}>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://instagram.com/${adminProfile?.instagram || 'HIRAPARASAVANPHOTOGRAPHER'}`} alt="IG QR" style={{ width: '100%' }} />
                                  </div>
                                  <div style={{ fontSize: '0.5rem', color: '#777' }}>
                                    <strong style={{ color: '#333' }}>@{adminProfile?.instagram ? adminProfile.instagram.toUpperCase() : 'HIRAPARASAVANPHOTOGRAPHER'}</strong>
                                  </div>
                                </div>
                              </div>
                              <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.7rem', fontWeight: '900' }}>Quality Assured Work</h4>
                                <p style={{ fontSize: '0.55rem', color: '#777', margin: 0 }}>Every project is crafted with precision and passion.</p>
                              </div>
                              <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.7rem', fontWeight: '900' }}>Thank You</h4>
                                <p style={{ fontSize: '0.55rem', color: '#777', margin: 0 }}>We value your trust in Netra Graphics.</p>
                              </div>
                            </div>

                            <div style={{ textAlign: 'center', paddingBottom: '8px', fontSize: '0.6rem', color: '#bbb' }}>
                              Page {pageIdx + 1} of {pages.length}
                            </div>
                          </div>
                        </div>
                      );
                    });

                    return (
                      <>
                        {pageRenders}
                        <div className="no-print invoice-actions-panel">
                          <button
                            className="action-btn btn-pdf"
                            onClick={() => downloadMultiPageInvoicePDF(invoiceProject, stableInvoiceNo)}
                          >
                            Download PDF
                          </button>
                          <button
                            className="action-btn btn-whatsapp"
                            onClick={() => {
                              saveInvoiceToVault(invoiceProject, stableInvoiceNo);
                              // Trigger automatic PDF download in the background so it's ready for drag-and-drop
                              downloadMultiPageInvoicePDF(invoiceProject, stableInvoiceNo);

                              const msg = `Namaste! Your Tax Invoice (${stableInvoiceNo}) from Netra Graphics is ready. Amount: ₹${(parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0)).toLocaleString()}. Thank you!`;

                              // Look up client phone robustly
                              const rawPhone = invoiceProject.phone || (invoiceProject.client && invoiceProject.client.phone) || (() => {
                                const targetClientId = invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink;
                                const c = targetClientId ? clients.find(c => c.id === targetClientId) : clients.find(c => c.name.toLowerCase() === invoiceProject.name.toLowerCase());
                                return c ? c.phone : '';
                              })();

                              // Clean phone and prepend country code
                              let cleanedPhone = rawPhone.replace(/\D/g, '');
                              while (cleanedPhone.startsWith('0')) {
                                cleanedPhone = cleanedPhone.substring(1);
                              }
                              const finalPhone = cleanedPhone.length === 10 ? '91' + cleanedPhone : cleanedPhone;

                              window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                          >
                            Send via WhatsApp
                          </button>
                            {(() => {
                              const isStandalone = (invoiceProject.projectId === null) || invoiceProject.isStandalone || stableInvoiceNo?.includes('/C') || (invoiceProject.id && typeof invoiceProject.id === 'string' && (invoiceProject.id.startsWith('custom-') || invoiceProject.id.startsWith('local-')));
                              const targetProjId = isStandalone ? null : (invoiceProject.projectId || invoiceProject.id);
                              const linkedProj = targetProjId ? ignitionQueue.find(p => p.id === targetProjId) : null;
                              const isCompletedProj = linkedProj && (linkedProj.status || '').toLowerCase() === 'completed';
                              const isPaidCustomInvoice = isStandalone && !isMicroJobInvoice && (
                                invoiceProject.paymentStatus?.toLowerCase() === 'paid' ||
                                (existingInvoice && existingInvoice.paymentStatus?.toLowerCase() === 'paid')
                              );
                              const isEditDisabled = isCompletedProj || isMicroJobInvoice || isPaidCustomInvoice;

                              return (
                                <button
                                  className={`action-btn btn-edit ${isEditDisabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
                                  disabled={isEditDisabled}
                                  title={
                                    isMicroJobInvoice
                                      ? "Cumulative micro-job invoices cannot be edited. Delete and recreate from ledger instead."
                                      : isPaidCustomInvoice
                                        ? "Paid Custom invoices cannot be edited"
                                        : isCompletedProj 
                                          ? "Completed project invoices cannot be edited" 
                                          : "Edit Details"
                                  }
                                  onClick={() => {
                                    if (isEditDisabled) return;
                                    if (!isStandalone) {
                                      setActiveAdminModule("PROJECTS");
                                      setRedirectBackToProjectEdit(targetProjId);
                                      setIsInvoicePreviewOpen(false);
                                      setInvoiceProject(null);
                                      setSelectedBatchProjects([]);
                                    } else {
                                      setEditingInvoiceData({
                                        id: existingInvoice?.id || invoiceProject.id,
                                        invoiceNo: stableInvoiceNo,
                                        name: invoiceProject.name,
                                        address: getClientAddress(invoiceProject.name),
                                        phone: invoiceProject.phone || ((invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink) ? clients.find(c => c.id === (invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink)) : clients.find(c => c.name.toLowerCase() === invoiceProject.name.toLowerCase()))?.phone || "",
                                        email: invoiceProject.email || ((invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink) ? clients.find(c => c.id === (invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink)) : clients.find(c => c.name.toLowerCase() === invoiceProject.name.toLowerCase()))?.email || "",
                                        gst: invoiceProject.gst || ((invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink) ? clients.find(c => c.id === (invoiceProject.client?.id || invoiceProject.rawProject?.client?.id || invoiceProject.clientLink)) : clients.find(c => c.name.toLowerCase() === invoiceProject.name.toLowerCase()))?.gst || "",
                                        service: invoiceProject.service,
                                        quote: invoiceProject.quote,
                                        discount: invoiceProject.discount || 0,
                                        advanceAmount: invoiceProject.advanceAmount || 0,
                                        qty: invoiceProject.qty || 1,
                                        rate: invoiceProject.rate || (invoiceProject.quote / (invoiceProject.qty || 1)),
                                        items: invoiceProject.items || [],
                                        isStandalone: isStandalone,
                                        projectId: null
                                      });
                                      setActiveAdminModule("INVOICES");
                                      setIsInvoicePreviewOpen(false);
                                    }
                                  }}
                                >
                                  Edit Details
                                </button>
                              );
                            })()}
                          <button
                            className="action-btn btn-close"
                            onClick={() => {
                              setIsInvoicePreviewOpen(false);
                              setInvoiceProject(null);
                              setSelectedBatchProjects([]);
                            }}
                          >
                            Close Preview
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCalibrationModalOpen && calibratingService && (
              <div
                className="modal-overlay"
                onClick={() => { setIsCalibrationModalOpen(false); setCalibratingService(null); }}
              >
                <motion.div
                  className="calibration-editor-modal"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="calibration-modal-header">
                    <h2>CALIBRATE: <span>{calibratingService.title}</span></h2>
                    <p>System ID: SC-{calibratingService.id.toString().padStart(3, '0')} | Modify parameters for local persistent storage</p>
                  </div>

                  <div className="calibration-modal-body">
                    <div className="calibration-form-grid">
                      <div className="calibration-form-row">
                        <div className="calibration-input-group">
                          <label>Card Title</label>
                          <input
                            type="text"
                            value={calibratingService.title}
                            onChange={e => setCalibratingService({ ...calibratingService, title: e.target.value })}
                            placeholder="Service title"
                            required
                          />
                        </div>
                        <div className="calibration-input-group">
                          <label>Icon / Emoji</label>
                          <input
                            type="text"
                            value={calibratingService.icon}
                            onChange={e => setCalibratingService({ ...calibratingService, icon: e.target.value })}
                            placeholder="🎨, 📖, etc."
                            required
                          />
                        </div>
                      </div>

                      <div className="calibration-form-row">
                        <div className="calibration-input-group">
                          <label>Tag / Category</label>
                          <select
                            value={calibratingService.tag}
                            onChange={e => setCalibratingService({ ...calibratingService, tag: e.target.value })}
                            required
                            className="bg-[#0a0f1e] text-white border border-white/10 rounded p-2"
                          >
                            <option value="BRANDING">BRANDING</option>
                            <option value="PRINT">PRINT</option>
                            <option value="DIGITAL">DIGITAL</option>
                            <option value="VIDEO">VIDEO</option>
                            <option value="EVENT">EVENT</option>
                            <option value="COMMERCIAL">COMMERCIAL</option>
                          </select>
                        </div>
                        <div className="calibration-form-row" style={{ gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
                          <div className="calibration-input-group">
                            <label>Price</label>
                            <input
                              type="text"
                              value={calibratingService.price}
                              onChange={e => setCalibratingService({ ...calibratingService, price: e.target.value })}
                              placeholder="₹ Price"
                              required
                            />
                          </div>
                          <div className="calibration-input-group">
                            <label>Delivery Time</label>
                            <input
                              type="text"
                              value={calibratingService.delivery}
                              onChange={e => setCalibratingService({ ...calibratingService, delivery: e.target.value })}
                              placeholder="e.g. 5 days"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="calibration-input-group">
                        <label>Card Description</label>
                        <textarea
                          value={calibratingService.desc}
                          onChange={e => setCalibratingService({ ...calibratingService, desc: e.target.value })}
                          placeholder="Brief marketing narrative for this card"
                          required
                          style={{ minHeight: '80px', resize: 'vertical' }}
                        />
                      </div>

                      <div>
                        <div className="features-title-row">
                          <label>Deliverable Features List</label>
                          <button
                            type="button"
                            className="add-feature-inline-btn"
                            onClick={() => setCalibratingService({
                              ...calibratingService,
                              features: [...(calibratingService.features || []), ""]
                            })}
                          >
                            + ADD FEATURE ROW
                          </button>
                        </div>

                        <div className="features-editor-list">
                          {(calibratingService.features || []).map((feat, index) => (
                            <div key={index} className="feature-input-row">
                              <input
                                type="text"
                                value={feat}
                                onChange={e => {
                                  const newFeats = [...calibratingService.features];
                                  newFeats[index] = e.target.value;
                                  setCalibratingService({ ...calibratingService, features: newFeats });
                                }}
                                placeholder={`Feature line #${index + 1}`}
                                required
                              />
                              <button
                                type="button"
                                className="delete-feature-btn"
                                onClick={() => {
                                  const newFeats = calibratingService.features.filter((_, idx) => idx !== index);
                                  setCalibratingService({ ...calibratingService, features: newFeats });
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {(!calibratingService.features || calibratingService.features.length === 0) && (
                            <p style={{ margin: '1rem 0', color: '#606060', fontSize: '0.8rem', textAlign: 'center', fontFamily: 'Poppins' }}>
                              No features defined. Click add feature row above.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="calibration-modal-footer" style={{ padding: '1rem 2rem 1.8rem 2rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="calibration-btn-secondary"
                      onClick={() => {
                        setIsCalibrationModalOpen(false);
                        setCalibratingService(null);
                      }}
                    >
                      DISCARD
                    </button>
                    <button
                      type="button"
                      className="calibration-btn-primary"
                      onClick={handleIgniteCalibration}
                    >
                      IGNITE CALIBRATION
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Project Delete Confirmation Modal */}
          <AnimatePresence>
            {projectToDelete && (
              <div className="modal-overlay z-[10005]" style={{ zIndex: 10050 }}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="ignition-modal max-w-lg w-[90vw] border border-red-500/30 bg-[#0e0a0b]/98"
                >
                  <button
                    type="button"
                    className="close-modal text-red-400 hover:text-red-300"
                    onClick={() => setProjectToDelete(null)}
                  >
                    ×
                  </button>

                  <div className="modal-header border-b border-red-500/10 pb-4 mb-5">
                    <h2 className="font-extrabold text-red-500 text-lg flex items-center gap-2">
                      ⚠️ TERMINATE MISSION & PURGE RECORD
                    </h2>
                    <p className="text-xs text-muted-foreground">Permanent deletion of database entities and financial reconciliation</p>
                  </div>

                  <div className="space-y-4 text-left text-xs text-white/80">
                    <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] space-y-1">
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Project Parameters</div>
                      <div className="text-sm font-black text-white">{(projectToDelete.service || '').toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">Client: {projectToDelete.name || ''}</div>
                    </div>

                    {/* Invoices warning */}
                    {(() => {
                      const relatedInvs = invoices.filter(inv => inv.rawProject?.id === projectToDelete.id || inv.projectId === projectToDelete.id);
                      if (relatedInvs.length === 0) return null;
                      return (
                        <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.01] space-y-1.5">
                          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">📁 Linked Invoices ({relatedInvs.length})</div>
                          <p className="text-3xs text-muted-foreground">The following generated documents will be permanently purged from the vault:</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {relatedInvs.map(inv => (
                              <span key={inv.id} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold">
                                {inv.invoiceNo}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Cashbook warning */}
                    {(() => {
                      const relatedEntries = cashbookEntries.filter(entry => entry.projectId === projectToDelete.id);
                      if (relatedEntries.length === 0) return null;
                      return (
                        <div className="p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.01] space-y-1.5">
                          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">💰 Linked Cashbook Entries ({relatedEntries.length})</div>
                          <p className="text-3xs text-muted-foreground">The following financial logs will be removed and reverted from the cashbook:</p>
                          <div className="space-y-1 divide-y divide-white/5 max-h-32 overflow-y-auto pr-1">
                            {relatedEntries.map(entry => (
                              <div key={entry.id} className="flex justify-between items-center text-[10px] py-1">
                                <span className="text-white/60 truncate max-w-[180px]">{entry.desc}</span>
                                <span className={`font-mono font-bold ${entry.type === 'EXPENSE' ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {entry.type === 'EXPENSE' ? '-' : '+'}₹{parseFloat(entry.amount).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Details Summary */}
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                      <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Financial Reconciliation Summary</div>
                      
                      <div className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                        <span className="text-white/40">Advance Payment Received:</span>
                        <span className="font-mono font-bold text-emerald-400">₹{parseFloat(projectToDelete.advanceAmount || 0).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                        <span className="text-white/40">Total Project Quote:</span>
                        <span className="font-mono font-bold text-white">₹{parseFloat(projectToDelete.quote || 0).toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-[10px] pt-1">
                        <span className="text-white/40">Total Reverted from Cashbook:</span>
                        <span className="font-mono font-bold text-red-400">
                          -₹{(() => {
                            if (deleteStrategy === 'keep' && projectToDelete.status === 'Completed') {
                              return "0";
                            }
                            const relatedEntries = cashbookEntries.filter(entry => entry.projectId === projectToDelete.id);
                            const sum = relatedEntries.reduce((acc, entry) => {
                              const amt = parseFloat(entry.amount) || 0;
                              return entry.type === 'EXPENSE' ? acc - amt : acc + amt;
                            }, 0);
                            return Math.max(0, sum).toLocaleString();
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Keep / Purge choice for Completed Projects */}
                    {projectToDelete.status === 'Completed' && (
                      <div className="p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.01] space-y-3">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Completed Project Deletion Strategy</div>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-white/80 select-none">
                            <input
                              type="radio"
                              name="deleteStrategy"
                              value="keep"
                              checked={deleteStrategy === 'keep'}
                              onChange={() => setDeleteStrategy('keep')}
                              className="accent-cyan-500"
                            />
                            <span>Keep/Preserve associated log entries and invoices in the Vault</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-[11px] text-white/80 select-none">
                            <input
                              type="radio"
                              name="deleteStrategy"
                              value="purge"
                              checked={deleteStrategy === 'purge'}
                              onChange={() => setDeleteStrategy('purge')}
                              className="accent-red-500"
                            />
                            <span className="text-red-400 font-semibold">Purge project along with associated log entries and invoices</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-5 border-t border-white/5 mt-6">
                    <button
                      type="button"
                      onClick={() => setProjectToDelete(null)}
                      className="border border-white/10 text-white hover:bg-white/5 text-xs rounded-xl px-5 h-9 bg-transparent cursor-pointer font-bold transition-all"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const targetId = projectToDelete.id;
                        try {
                          const relatedInvs = invoices.filter(inv => inv.rawProject?.id === targetId || inv.projectId === targetId);
                          const relatedEntries = cashbookEntries.filter(entry => entry.projectId === targetId);

                          const purgedInvoices = deleteStrategy === 'purge' ? relatedInvs : [];
                          const purgedEntries = deleteStrategy === 'purge' ? relatedEntries : [];

                          setTrashItems(prev => [
                            ...prev,
                            {
                              id: `trash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              type: "project",
                              deletedAt: new Date().toISOString(),
                              data: {
                                project: projectToDelete,
                                strategy: deleteStrategy,
                                purgedInvoices,
                                purgedEntries
                              }
                            }
                          ]);
                          
                          if (deleteStrategy === 'keep' && projectToDelete.status === 'Completed') {
                            // Keep strategy: unlink invoice and serialize metadata to JSON_MOCK
                            for (const inv of relatedInvs) {
                              try {
                                const mockClientPayload = {
                                  name: projectToDelete.client?.name || projectToDelete.name,
                                  address: projectToDelete.client?.address || projectToDelete.address || "",
                                  email: projectToDelete.client?.email || projectToDelete.email || "",
                                  phone: projectToDelete.client?.phone || projectToDelete.whatsapp || projectToDelete.phone || "",
                                  gst: projectToDelete.client?.gst || projectToDelete.gst || "",
                                  service: projectToDelete.service,
                                  quote: parseFloat(projectToDelete.quote) || 0,
                                  discount: parseFloat(projectToDelete.discount) || 0,
                                  advanceAmount: parseFloat(projectToDelete.advanceAmount) || 0,
                                  qty: parseFloat(projectToDelete.qty) || 1,
                                  rate: parseFloat(projectToDelete.rate) || parseFloat(projectToDelete.quote) || 0,
                                  items: projectToDelete.items || []
                                };
                                const { error: invErr } = await supabase.from('invoices').update({
                                  project_id: null,
                                  client_name: `JSON_MOCK:${JSON.stringify(mockClientPayload)}`
                                }).eq('id', inv.id);
                                if (invErr) throw invErr;
                              } catch (err) {
                                console.warn(`Failed to unlink invoice ${inv.id} before project deletion:`, err);
                              }
                            }
                          } else {
                            // Purge strategy: delete invoices from Supabase
                            for (const inv of relatedInvs) {
                              try {
                                await deleteInvoice(inv.id);
                              } catch (invErr) {
                                console.warn(`Failed to delete invoice ${inv.id} from Supabase:`, invErr);
                              }
                            }
                          }

                          // Always delete the project itself from Supabase
                          const { error: pError } = await supabase.from('projects').delete().eq('id', targetId);
                          if (pError) throw pError;

                          // Update local states
                          if (deleteStrategy === 'keep' && projectToDelete.status === 'Completed') {
                            setInvoices(prev => prev.map(inv => {
                              if (inv.rawProject?.id === targetId || inv.projectId === targetId) {
                                const mockClientPayload = {
                                  name: projectToDelete.client?.name || projectToDelete.name,
                                  address: projectToDelete.client?.address || projectToDelete.address || "",
                                  email: projectToDelete.client?.email || projectToDelete.email || "",
                                  phone: projectToDelete.client?.phone || projectToDelete.whatsapp || projectToDelete.phone || "",
                                  gst: projectToDelete.client?.gst || projectToDelete.gst || "",
                                  service: projectToDelete.service,
                                  quote: parseFloat(projectToDelete.quote) || 0,
                                  discount: parseFloat(projectToDelete.discount) || 0,
                                  advanceAmount: parseFloat(projectToDelete.advanceAmount) || 0,
                                  qty: parseFloat(projectToDelete.qty) || 1,
                                  rate: parseFloat(projectToDelete.rate) || parseFloat(projectToDelete.quote) || 0,
                                  items: projectToDelete.items || []
                                };
                                return {
                                  ...inv,
                                  clientName: mockClientPayload.name,
                                  projectId: null,
                                  rawProject: {
                                    id: inv.id,
                                    ...mockClientPayload
                                  }
                                };
                              }
                              return inv;
                            }));

                            setCashbookEntries(prev => prev.map(entry =>
                              entry.projectId === targetId ? { ...entry, projectId: null } : entry
                            ));
                            toast({ title: "Deletion Complete", description: "Project deleted. Associated invoices and cashbook records preserved in Vault/Ledger." });
                          } else {
                            setInvoices(prev => prev.filter(inv => inv.rawProject?.id !== targetId && inv.projectId !== targetId));
                            setCashbookEntries(prev => prev.filter(entry => entry.projectId !== targetId));
                            toast({ title: "Purge Complete", description: "Project, linked invoices, and cashbook records successfully deleted." });
                          }
                          
                          setIgnitionQueue(prev => prev.filter(p => p.id !== targetId));
                        } catch (err) {
                          console.error("Deletion/Purge failed:", err);
                          toast({ title: "Operation failed", description: err.message || JSON.stringify(err), variant: "destructive" });
                        } finally {
                          setProjectToDelete(null);
                          setSelectedProjectTab(null);
                        }
                      }}
                      className={deleteStrategy === 'keep' && projectToDelete.status === 'Completed' ? "bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold text-xs rounded-xl px-6 h-9 shadow-lg shadow-cyan-500/10 cursor-pointer border-none transition-all" : "bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl px-6 h-9 shadow-lg shadow-red-500/10 cursor-pointer border-none transition-all"}
                    >
                      {deleteStrategy === 'keep' && projectToDelete.status === 'Completed' ? "CONFIRM DELETION" : "CONFIRM PURGE & REVERT"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Edit Invoice Details Modal */}
          <AnimatePresence>
            {editingInvoiceData && !editingInvoiceData.isStandalone && (
              <div className="modal-overlay z-[10010]" style={{ zIndex: 10050 }}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="ignition-modal max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto"
                >
                  <button
                    type="button"
                    className="close-modal"
                    onClick={() => setEditingInvoiceData(null)}
                  >
                    ×
                  </button>

                  <div className="modal-header border-b border-white/5 pb-4 mb-5">
                    <h2 className="font-extrabold text-cyan-400 text-lg flex items-center gap-2">
                      ✏️ EDIT INVOICE DETAILS
                    </h2>
                    <p className="text-xs text-muted-foreground">Modify metadata, client credentials, and pricing catalog for this invoice</p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const updated = {
                        id: editingInvoiceData.id,
                        invoiceNo: formData.get("invoiceNo"),
                        name: formData.get("name"),
                        address: formData.get("address"),
                        phone: formData.get("phone"),
                        email: formData.get("email"),
                        gst: formData.get("gst"),
                        service: formData.get("service") || editingInvoiceData.service,
                        quote: parseFloat(formData.get("quote")) || 0,
                        discount: parseFloat(formData.get("discount")) || 0,
                        advanceAmount: parseFloat(formData.get("advanceAmount")) || 0,
                        qty: parseInt(formData.get("qty")) || 1,
                        rate: parseFloat(formData.get("rate")) || 0,
                        items: editingInvoiceData.items || []
                      };
                      
                      if (!updated.items || updated.items.length === 0) {
                        updated.quote = updated.rate * updated.qty;
                      } else {
                        updated.quote = updated.items.reduce((sum, item) => sum + (parseFloat(item.rate || item.quote) * (item.qty || 1)), 0);
                        updated.discount = updated.items.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
                      }

                      updateSavedInvoice(updated);
                      setInvoiceProject(prev => prev ? {
                        ...prev,
                        name: updated.name,
                        address: updated.address,
                        phone: updated.phone,
                        email: updated.email,
                        gst: updated.gst,
                        service: updated.service,
                        quote: updated.quote,
                        discount: updated.discount,
                        qty: updated.qty,
                        rate: updated.rate,
                        advanceAmount: updated.advanceAmount,
                        invoiceNo: updated.invoiceNo,
                        items: updated.items
                      } : null);
                      setEditingInvoiceData(null);
                    }}
                    className="space-y-4 text-left text-xs"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="input-group">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Invoice Number</label>
                        <input
                          type="text"
                          name="invoiceNo"
                          defaultValue={editingInvoiceData.invoiceNo}
                          required
                          className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                        />
                      </div>
                      <div className="input-group">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Client / Business Name</label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={editingInvoiceData.name}
                          required
                          className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                        />
                      </div>
                      <div className="input-group md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Billing Address</label>
                        <input
                          type="text"
                          name="address"
                          defaultValue={editingInvoiceData.address}
                          required
                          className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                        />
                      </div>
                      <div className="input-group">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          defaultValue={editingInvoiceData.phone}
                          className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                        />
                      </div>
                      <div className="input-group">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={editingInvoiceData.email}
                          className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                        />
                      </div>
                      <div className="input-group md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">GSTIN</label>
                        <input
                          type="text"
                          name="gst"
                          defaultValue={editingInvoiceData.gst}
                          className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                        />
                      </div>
                    </div>

                    {editingInvoiceData.items && editingInvoiceData.items.length > 0 ? (
                      <div className="border border-white/5 bg-white/[0.01] p-4 rounded-xl space-y-3">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Multiple Items Catalog</div>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {editingInvoiceData.items.map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-end border-b border-white/5 pb-3">
                              <div className="flex-1">
                                <label className="text-[8px] text-muted-foreground block mb-0.5">Description</label>
                                <input
                                  type="text"
                                  value={item.service}
                                  onChange={(e) => {
                                    const next = [...editingInvoiceData.items];
                                    next[idx].service = e.target.value;
                                    setEditingInvoiceData({ ...editingInvoiceData, items: next });
                                  }}
                                  required
                                  className="bg-white/5 border border-white/10 rounded p-1 text-white text-[11px] outline-none w-full"
                                />
                              </div>
                              <div style={{ width: '50px' }}>
                                <label className="text-[8px] text-muted-foreground block mb-0.5">Qty</label>
                                <input
                                  type="number"
                                  value={item.qty || 1}
                                  onChange={(e) => {
                                    const next = [...editingInvoiceData.items];
                                    next[idx].qty = parseInt(e.target.value) || 1;
                                    setEditingInvoiceData({ ...editingInvoiceData, items: next });
                                  }}
                                  required
                                  className="bg-white/5 border border-white/10 rounded p-1 text-white text-[11px] outline-none w-full text-center"
                                />
                              </div>
                              <div style={{ width: '80px' }}>
                                <label className="text-[8px] text-muted-foreground block mb-0.5">Rate</label>
                                <input
                                  type="number"
                                  value={item.rate || item.quote || 0}
                                  onChange={(e) => {
                                    const next = [...editingInvoiceData.items];
                                    const val = parseFloat(e.target.value) || 0;
                                    next[idx].rate = val;
                                    next[idx].quote = val * (next[idx].qty || 1);
                                    setEditingInvoiceData({ ...editingInvoiceData, items: next });
                                  }}
                                  required
                                  className="bg-white/5 border border-white/10 rounded p-1 text-white text-[11px] outline-none w-full text-right"
                                />
                              </div>
                              <div style={{ width: '80px' }}>
                                <label className="text-[8px] text-muted-foreground block mb-0.5">Disc</label>
                                <input
                                  type="number"
                                  value={item.discount || 0}
                                  onChange={(e) => {
                                    const next = [...editingInvoiceData.items];
                                    next[idx].discount = parseFloat(e.target.value) || 0;
                                    setEditingInvoiceData({ ...editingInvoiceData, items: next });
                                  }}
                                  className="bg-white/5 border border-white/10 rounded p-1 text-white text-[11px] outline-none w-full text-right"
                                />
                              </div>
                              <button
                                type="button"
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded p-1 text-[11px] h-[26px]"
                                onClick={() => {
                                  const next = editingInvoiceData.items.filter((_, i) => i !== idx);
                                  setEditingInvoiceData({ ...editingInvoiceData, items: next });
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold py-1 px-3 rounded-lg"
                          onClick={() => {
                            const next = [...(editingInvoiceData.items || []), { service: "", qty: 1, rate: 0, discount: 0, quote: 0 }];
                            setEditingInvoiceData({ ...editingInvoiceData, items: next });
                          }}
                        >
                          + ADD SERVICE ITEM
                        </button>
                      </div>
                    ) : (
                      <div className="border border-white/5 bg-white/[0.01] p-4 rounded-xl space-y-3">
                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Service Details</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="input-group md:col-span-2">
                            <label className="text-[8px] text-muted-foreground uppercase">Service Description</label>
                            <input
                              type="text"
                              name="service"
                              defaultValue={editingInvoiceData.service}
                              required
                              className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                            />
                          </div>
                          <div className="input-group">
                            <label className="text-[8px] text-muted-foreground uppercase">Quantity</label>
                            <input
                              type="number"
                              name="qty"
                              defaultValue={editingInvoiceData.qty}
                              required
                              className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                            />
                          </div>
                          <div className="input-group">
                            <label className="text-[8px] text-muted-foreground uppercase">Rate (₹)</label>
                            <input
                              type="number"
                              name="rate"
                              defaultValue={editingInvoiceData.rate}
                              required
                              className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                            />
                          </div>
                          <div className="input-group md:col-span-2">
                            <label className="text-[8px] text-muted-foreground uppercase">Discount (₹)</label>
                            <input
                              type="number"
                              name="discount"
                              defaultValue={editingInvoiceData.discount}
                              className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="input-group">
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Advance Payment Received (₹)</label>
                      <input
                        type="number"
                        name="advanceAmount"
                        defaultValue={editingInvoiceData.advanceAmount}
                        className="bg-white/5 border border-white/10 rounded p-2 text-white outline-none w-full"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-5 border-t border-white/5 mt-6">
                      <button
                        type="button"
                        onClick={() => setEditingInvoiceData(null)}
                        className="border border-white/10 text-white hover:bg-white/5 text-xs rounded-xl px-5 h-9 bg-transparent cursor-pointer font-bold transition-all"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-black font-extrabold text-xs rounded-xl px-6 h-9 shadow-lg shadow-cyan-500/10 border-none cursor-pointer transition-all"
                      >
                        SAVE INVOICE CHANGES
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Fullscreen Service Slideshow Player Modal */}
          <AnimatePresence>
            {activeServiceSlideshow && (
              <motion.div
                className="service-slideshow-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  const currentState = window.history.state;
                  if (currentState && currentState.page === 'services' && currentState.viewWork) {
                    window.history.back();
                  } else {
                    setActiveServiceSlideshow(null);
                  }
                }}
              >
                <ServiceSlideshowContent 
                  service={activeServiceSlideshow} 
                  onClose={() => {
                    const currentState = window.history.state;
                    if (currentState && currentState.page === 'services' && currentState.viewWork) {
                      window.history.back();
                    } else {
                      setActiveServiceSlideshow(null);
                    }
                  }} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Futuristic Success Dialogue Modal */}
          <AnimatePresence>
            {showSuccessDialog && (
              <motion.div
                className="futuristic-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="futuristic-modal-content"
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <div className="modal-glow-border"></div>
                  
                  <div className="success-icon-wrapper">
                    <div className="success-icon-pulse"></div>
                    <Sparkles className="success-icon-glow" />
                  </div>
                  
                  <span className="modal-transmission-label">TRANSMISSION RECEIVED</span>
                  <h3 className="modal-message-title">
                    Your inquiry submitted successfully! We get back to you soon!
                  </h3>
                  
                  <div className="countdown-bar-container">
                    <motion.div
                      className="countdown-bar-fill"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 10, ease: "linear" }}
                    />
                  </div>
                  
                  <button
                    type="button"
                    className="modal-ok-btn"
                    onClick={handleCloseSuccessDialog}
                  >
                    OK
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
