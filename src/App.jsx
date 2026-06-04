import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';
import './Login.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import Dashboard from '@/pages/dashboard';
import Projects from '@/pages/projects';
import Clients from '@/pages/clients';
import Inquiries from '@/pages/inquiries';
import Financials from '@/pages/financials';
import SettingsPage from '@/pages/settings';
import { Portfolio } from '@/pages/Portfolio';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Eye, EyeOff, Terminal, Sparkles, LogIn, ChevronRight, ShieldAlert, ArrowLeft, LayoutDashboard, Folder, Users, Inbox, FileText, Settings, LogOut, Home, Briefcase, Mail, Menu, Volume2, VolumeX, Coins } from 'lucide-react';
import InvoicesPage from '@/pages/invoices';

const queryClient = new QueryClient();
import { supabase } from './supabase/client';
import {
  getInquiries, createInquiry, updateInquiry, deleteInquiry,
  getClients, createClientProfile, verifyClientVaultKey, updateClientProfile,
  getProjects, igniteProject, updateProjectState, toggleMilestone, addProjectActivityLog, sendChatMessage, subscribeToChats, uploadMediaVaultAsset,
  getInvoices, saveInvoice, deleteInvoice
} from './supabase/database';


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
  {
    serviceId: 1, // Brand Identity (Logo)
    photos: [
      { url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80", title: "Modern Brandmark" },
      { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80", title: "Signature Logo" },
      { url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80", title: "Corporate Style Guide" }
    ]
  },
  {
    serviceId: 3, // Digital Interactive Brochures
    photos: [
      { url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80", title: "NovaTech UI Concept" },
      { url: "https://images.unsplash.com/photo-1581291518655-9523c932ded7?auto=format&fit=crop&w=800&q=80", title: "Interactive Mockups" },
      { url: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=800&q=80", title: "User Flows" }
    ]
  },
  {
    serviceId: 7, // Cinematic Video Packages
    photos: [
      { url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", title: "Motion Teaser Reel" },
      { url: "https://images.unsplash.com/photo-1542204172-e7052809f852?auto=format&fit=crop&w=800&q=80", title: "3D Motion Shaders" },
      { url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80", title: "Cinematic Cuts" }
    ]
  },
  {
    serviceId: 9, // Editorial Design
    photos: [
      { url: "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=800&q=80", title: "Strata Lookbook grid" },
      { url: "https://images.unsplash.com/photo-1547891654-e66ed7edd96c?auto=format&fit=crop&w=800&q=80", title: "Swiss Constructivist Layout" },
      { url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80", title: "Typographic Art Poster" }
    ]
  },
  {
    serviceId: 6, // Large Format Media
    photos: [
      { url: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=800&q=80", title: "Oru Water Sustainable Pack" },
      { url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80", title: "Hana Cosmetics Jar Concept" },
      { url: "https://images.unsplash.com/photo-1605615740060-5f2d472288b6?auto=format&fit=crop&w=800&q=80", title: "Textured Premium Box Mockup" }
    ]
  }
];

const defaultBankingDetails = {
  bankName: "SBI",
  accountName: "Netra Graphics",
  accountNumber: "20198798116",
  ifscCode: "SBIN0060152",
  upiId: "hiraparasavan989@okaxis"
};

const defaultAdminProfile = {
  businessName: "Netra Graphics & Designing",
  address: "Shreeji Complex, Opp. AaramGruh, Mendarda-Sasan Road, Mendarda-362260",
  phone: "+91 90161 60152",
  email: "info@netragraphics.com",
  gst: "24AAAAA0000A1Z5"
};

function App() {
  const [servicesList, setServicesList] = useState(() => {
    const saved = localStorage.getItem('netra_services');
    if (saved) {
      try {
        return JSON.parse(saved);
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
        return JSON.parse(saved);
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
        return JSON.parse(saved);
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
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved admin profile:", e);
      }
    }
    return defaultAdminProfile;
  });

  const handleSaveBankingDetails = async (newBanking) => {
    setBankingDetails(newBanking);
    localStorage.setItem('netra_banking_details', JSON.stringify(newBanking));

    // Save globally to Supabase special settings row
    try {
      const payload = {
        address: JSON.stringify({ services: servicesList, vision: visionSettings, banking: newBanking, profile: adminProfile })
      };
      await supabase
        .from('clients')
        .update(payload)
        .eq('email', 'settings@netra.graphics');
    } catch (dbErr) {
      console.error("Failed to save banking details to database:", dbErr);
    }

    toast({
      title: "Payment Details Calibrated",
      description: "Successfully updated payment instructions and digital UPI QR settings."
    });
  };

  const handleSaveAdminProfile = async (newProfile) => {
    setAdminProfile(newProfile);
    localStorage.setItem('netra_admin_profile', JSON.stringify(newProfile));

    // Save globally to Supabase special settings row
    try {
      const payload = {
        address: JSON.stringify({ services: servicesList, vision: visionSettings, banking: bankingDetails, profile: newProfile })
      };
      await supabase
        .from('clients')
        .update(payload)
        .eq('email', 'settings@netra.graphics');
    } catch (dbErr) {
      console.error("Failed to save admin profile to database:", dbErr);
    }

    toast({
      title: "Admin Profile Updated",
      description: "Successfully updated admin basic details globally."
    });
  };

  const handleSaveVisionSettings = async (newSettings) => {
    setVisionSettings(newSettings);
    localStorage.setItem('netra_vision_settings', JSON.stringify(newSettings));

    // Save globally to Supabase special settings row
    try {
      const payload = {
        address: JSON.stringify({ services: servicesList, vision: newSettings, banking: bankingDetails, profile: adminProfile })
      };
      await supabase
        .from('clients')
        .update(payload)
        .eq('email', 'settings@netra.graphics');
    } catch (dbErr) {
      console.error("Failed to save vision settings to database:", dbErr);
    }

    toast({
      title: "Vision Settings Saved",
      description: "Successfully updated the VISION page categories and slideshow assets."
    });
  };

  const handleClearAllDemoData = async () => {
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
          address: JSON.stringify({ services: defaultServices, vision: defaultVisionSettings, banking: defaultBankingDetails, profile: defaultAdminProfile })
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

    // Save update to state and localStorage
    const nextList = servicesList.map(s => s.id === calibratingService.id ? calibratingService : s);
    setServicesList(nextList);
    localStorage.setItem("netra_services", JSON.stringify(nextList));

    // Save globally to Supabase special settings row
    try {
      const payload = {
        address: JSON.stringify({ services: nextList, vision: visionSettings, banking: bankingDetails, profile: adminProfile })
      };
      await supabase
        .from('clients')
        .update(payload)
        .eq('email', 'settings@netra.graphics');
    } catch (dbErr) {
      console.error("Failed to save calibrated services to database:", dbErr);
    }

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
              localStorage.setItem('netra_services', JSON.stringify(parsed.services));
            }
            if (parsed.vision && parsed.vision.length > 0) {
              setVisionSettings(parsed.vision);
              localStorage.setItem('netra_vision_settings', JSON.stringify(parsed.vision));
            }
            if (parsed.banking) {
              setBankingDetails(parsed.banking);
              localStorage.setItem('netra_banking_details', JSON.stringify(parsed.banking));
            }
            if (parsed.profile) {
              setAdminProfile(parsed.profile);
              localStorage.setItem('netra_admin_profile', JSON.stringify(parsed.profile));
            }
          } catch (parseErr) {
            console.error("Failed to parse global settings from database:", parseErr);
          }
        } else {
          const defaultPayload = {
            name: 'System Settings',
            email: 'settings@netra.graphics',
            phone: 'SYSTEM',
            address: JSON.stringify({ services: servicesList, vision: visionSettings, banking: bankingDetails, profile: adminProfile }),
            status: 'Active',
            access_key: 'SYSTEM'
          };
          await supabase.from('clients').insert([defaultPayload]);
        }
      } catch (err) {
        console.warn("Failed to sync global settings from Supabase, running on local cache:", err);
      }
    };
    fetchGlobalSettings();
  }, []);

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
  const [isServicesActive, setIsServicesActive] = useState(false);
  const isNavVertical = isVaultActive && !isContactActive && !isServicesActive;
  const [isSuccess, setIsSuccess] = useState(false);
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
  const [isIgnitionModalOpen, setIsIgnitionModalOpen] = useState(false);
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
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved clients:", e);
      }
    }
    return [];
  });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientViewMode, setClientViewMode] = useState("LIST"); // LIST, VIEW

  const [accessKey, setAccessKey] = useState("");
  const [remarkModal, setRemarkModal] = useState({ open: false, inquiryId: null, type: null });
  const [remarkText, setRemarkText] = useState("");
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [prefillData, setPrefillData] = useState(null);
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [activeAdminModule, setActiveAdminModule] = useState(() => {
    return localStorage.getItem('netra_active_admin_module') || "DASHBOARD";
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
  const [ignitionClientType, setIgnitionClientType] = useState("NEW"); // NEW, EXISTING
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('netra_admin_active', isCommandCenterActive);
  }, [isCommandCenterActive]);

  useEffect(() => {
    localStorage.setItem('netra_client_active', isClientVaultActive);
  }, [isClientVaultActive]);

  useEffect(() => {
    localStorage.setItem('netra_active_admin_module', activeAdminModule);
  }, [activeAdminModule]);

  useEffect(() => {
    localStorage.setItem('netra_admin_grid_active', isAdminGridActive);
  }, [isAdminGridActive]);

  useEffect(() => {
    localStorage.setItem('netra_save_login_info', saveLoginInfo);
  }, [saveLoginInfo]);

  useEffect(() => {
    // Clear any previous mock database states from local storage to ensure a clean launch
    localStorage.removeItem("netra_db_state");
    localStorage.removeItem("netra_read_flames");

    const loadSupabaseData = async () => {
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

        const dbInquiries = await getInquiries();
        if (dbInquiries) {
          setInquiries(dbInquiries);
        }

        const dbProjects = await getProjects();
        if (dbProjects) {
          setIgnitionQueue(dbProjects);
        }

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
                    quote: parsed.rate * parsed.qty,
                    discount: parsed.discount,
                    advanceAmount: 0,
                    phone: parsed.phone,
                    email: parsed.email,
                    address: parsed.address,
                    gst: parsed.gst,
                    items: [{
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
      } catch (error) {
        console.error("Failed to load data from Supabase:", error);
      }
    };
    loadSupabaseData();
  }, []);

  const triggerBellPulse = () => {
    setBellPulse(true);
    setTimeout(() => setBellPulse(false), 2000);
  };

  const [readFlames, setReadFlames] = useState(() => {
    const saved = localStorage.getItem("netra_read_flames");
    return saved ? JSON.parse(saved) : [];
  });

  const sparks = inquiries.filter(q => {
    if (q.status !== "New Spark") return false;
    const createdDate = new Date(q.createdAt || q.created_at || q.date || Date.now());
    const diffTime = Date.now() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays < 5;
  });
  const flames = ignitionQueue.filter(q => {
    if (q.status === "Completed" || q.status === "Cancelled") return false;
    if (!q.deadline) return false;
    const deadline = new Date(q.deadline);
    const now = new Date();
    const diff = deadline - now;
    return diff <= 5 * 24 * 60 * 60 * 1000 && !readFlames.includes(q.id);
  });

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

  const markFlameAsRead = (projectId) => {
    setReadFlames(prev => {
      const next = [...prev, projectId];
      localStorage.setItem("netra_read_flames", JSON.stringify(next));
      return next;
    });
    toast({ title: "Alert acknowledged" });
  };

  const calculateDaysRemaining = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [invoiceProject, setInvoiceProject] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedBatchProjects, setSelectedBatchProjects] = useState([]);
  const [selectedVaultInvoices, setSelectedVaultInvoices] = useState([]);

  const getInvoiceNumber = (date, serial = 1) => {
    const d = new Date(date || Date.now());
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
    const serialStr = serial.toString().padStart(4, '0');
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
    if (invoiceProject && invoiceProject.name === name && invoiceProject.address) {
      return invoiceProject.address;
    }
    const client = clients.find(c => c.name === name);
    return client ? client.address : "Location N/A";
  };

  const saveInvoiceToVault = async (p, invNo) => {
    if (invoices.find(i => i.invoiceNo === invNo)) return;

    const newInvoice = {
      invoiceNo: invNo,
      clientName: p.name,
      projectService: p.service,
      issueDate: new Date().toISOString().split('T')[0],
      grandTotal: parseFloat(p.quote) - (parseFloat(p.advanceAmount) || 0) - (parseFloat(p.discount) || 0),
      projectId: p.id
    };

    try {
      const savedInvoice = await saveInvoice(newInvoice);
      const formattedInvoice = {
        id: savedInvoice.id,
        invoiceNo: savedInvoice.invoice_no,
        clientName: savedInvoice.client_name,
        projectService: savedInvoice.project_service,
        issueDate: new Date(savedInvoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        grandTotal: parseFloat(savedInvoice.grand_total),
        rawProject: p
      };
      setInvoices(prev => [formattedInvoice, ...prev]);
    } catch (err) {
      console.error("Failed to save invoice to Supabase:", err);
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

    const pdf = new jsPDF('p', 'mm', 'a4');
    const actions = document.querySelector('.invoice-modal-overlay .no-print');
    if (actions) actions.style.display = 'none';

    try {
      window.scrollTo(0, 0);
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

    ignitionQueue.forEach(p => {
      const baseQuote = p.quote || 0;
      const discountPct = parseFloat(p.discountPercent) || 0;
      const finalQuote = baseQuote - (baseQuote * discountPct / 100);

      const adv = parseFloat(p.advanceAmount) || 0;
      const isPaid = p.paymentStatus === 'paid' || p.status === "Completed";
      const isPart = p.paymentStatus === 'part';

      let revenueFromProject = 0;
      let duesFromProject = 0;

      if (isPaid) {
        revenueFromProject = finalQuote;
        duesFromProject = 0;
      } else if (isPart) {
        revenueFromProject = adv;
        duesFromProject = finalQuote - adv;
      } else {
        revenueFromProject = 0;
        duesFromProject = finalQuote;
      }

      totalRevenue += revenueFromProject;
      pendingDues += duesFromProject;

      const pDate = new Date(p.deadline);
      if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
        monthlyRevenue += revenueFromProject;
      }
    });

    return {
      totalRevenue,
      pendingDues,
      monthlyRevenue,
      targetProgress: Math.min((monthlyRevenue / monthlyTarget) * 100, 100)
    };
  }, [ignitionQueue, monthlyTarget]);

  // --- CASHBOOK SYSTEM ---
  const [financialTab, setFinancialTab] = useState("PROJECTS"); // PROJECTS, CASHBOOK, INVOICES
  const [isCashbookEditModalOpen, setIsCashbookEditModalOpen] = useState(false);
  const [selectedCashbookEntry, setSelectedCashbookEntry] = useState(null);
  const [customPaymentPrompt, setCustomPaymentPrompt] = useState(null);
  const [cashbookEntries, setCashbookEntries] = useState(() => {
    const saved = localStorage.getItem('netra_cashbook');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cashbook entries from localStorage:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('netra_cashbook', JSON.stringify(cashbookEntries));
  }, [cashbookEntries]);


  const cashbookMetrics = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let upiFlow = 0;
    let cashFlow = 0;

    cashbookEntries.forEach(entry => {
      const amt = parseFloat(entry.amount);
      if (entry.type === "EXPENSE") {
        totalExpense += amt;
        if (entry.mode === "UPI") upiFlow -= amt;
        if (entry.mode === "CASH") cashFlow -= amt;
      } else {
        totalIncome += amt;
        if (entry.mode === "UPI") upiFlow += amt;
        if (entry.mode === "CASH") cashFlow += amt;
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
    setShowConstruction(false);
    setSelectedService(null);
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
    if (!currentState || currentState.page !== pageName || (pageName === 'admin' && currentState.activeAdminModule !== additional.activeAdminModule)) {
      window.history.pushState({ page: pageName, ...additional }, '');
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.page) {
        setIsVaultActive(state.page === 'vision');
        setIsServicesActive(state.page === 'services');
        setIsContactActive(state.page === 'contact');
        setIsLoginActive(state.page === 'login');
        setIsCommandCenterActive(state.page === 'admin');
        setIsClientVaultActive(state.page === 'client-vault');
        setIsAdminGridActive(state.page === 'admin' || !!state.isAdminGridActive);
        if (state.activeAdminModule) {
          setActiveAdminModule(state.activeAdminModule);
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
      window.history.replaceState({ page: 'home' }, '');
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
        if (saveLoginInfo) {
          localStorage.setItem('netra_saved_client_key', accessKey);
          localStorage.setItem('netra_saved_client_pass', passphrase);
        } else {
          localStorage.removeItem('netra_saved_client_key');
          localStorage.removeItem('netra_saved_client_pass');
        }
        triggerInstantTransition(() => {
          clearAllPages();
          setIsClientVaultActive(true);
          pushPageToHistory('client-vault');
        });
      } else {
        setLoginError("Please enter your Client Access Key and Passphrase.");
      }
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('netra_admin_active');
    localStorage.removeItem('netra_client_active');
    localStorage.removeItem('netra_active_admin_module');
    localStorage.removeItem('netra_admin_grid_active');
    triggerInstantTransition(() => {
      clearAllPages();
      pushPageToHistory('home');
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

      setIgnitionQueue(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            stage: nextStage,
            status: newStatus,
            activityLog: [
              { action: actionMsg, time: new Date().toLocaleTimeString() },
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
      return {
        ...prev,
        stage: nextStage,
        status: nextStage === 4 ? "Completed" : prev.status
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

      setIgnitionQueue(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            status: newStatus,
            activityLog: [
              { action: actionMsg, time: new Date().toLocaleTimeString() },
              ...(p.activityLog || [])
            ]
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to update project status in Supabase:", err);
    }

    setSelectedKanbanProject(prev => prev ? { ...prev, status: newStatus } : null);
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
      serviceId: serviceMatch ? serviceMatch.id : ''
    });
    setIgnitionClientType("NEW");
    setIsReviewDrawerOpen(false);
    setIsIgnitionModalOpen(true);
  };

  const handleIgniteProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const serviceId = formData.get('service');
    const serviceName = services.find(s => s.id === parseInt(serviceId))?.title || "Custom Service";

    const btn = form.querySelector('.ignite-submit-btn');
    btn.innerText = "IGNITING...";

    try {
      let clientInfo;
      let clientDbId = null;

      if (ignitionClientType === "EXISTING") {
        const clientId = formData.get('existingClientId');
        const existingClient = clients.find(c => c.id === parseInt(clientId));
        if (!existingClient) return alert("Please select a valid visionary.");
        clientInfo = {
          name: existingClient.name,
          phone: existingClient.phone,
          email: existingClient.email,
          address: existingClient.address
        };
        clientDbId = existingClient.id;
      } else {
        clientInfo = {
          name: formData.get('clientName'),
          phone: formData.get('whatsapp'),
          email: formData.get('email'),
          address: formData.get('address')
        };

        // Register new client with access key passcode
        const randomAccessKey = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newClient = await createClientProfile({
          ...clientInfo,
          accessKey: randomAccessKey,
          status: 'Active'
        });

        clientDbId = newClient.id;
        setClients(prev => [...prev, newClient]);
      }

      const milestoneNames = ["Discovery", "Moodboard", "Sketching", "Final Flame"];
      const quoteVal = parseInt(formData.get('quote')) || 15000;
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

      const projectPayload = {
        name: clientInfo.name,
        service: serviceName,
        stage: 1,
        status: "Active",
        deadline: formData.get('deadline'),
        isManual: true,
        client: clientInfo,
        milestones: milestoneNames.map((name, idx) => ({ name, completed: name === "Discovery" })),
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
        ]
      };

      const savedProjCore = await igniteProject({
        ...projectPayload,
        client_id: clientDbId
      });

      const newProject = {
        ...projectPayload,
        id: savedProjCore.id
      };

      setIgnitionQueue(prev => [...prev, newProject]);
      triggerBellPulse();

      if (prefillData && prefillData.inquiryId) {
        try {
          await updateInquiry(prefillData.inquiryId, { status: 'Ignited', remarks: 'Automatically ignited into active project mission.' });
          const dbInquiries = await getInquiries();
          if (dbInquiries && dbInquiries.length > 0) {
            setInquiries(dbInquiries);
          }
        } catch (e) {
          console.error("Failed to update inquiry status on auto-ignition:", e);
        }
      }

      btn.innerText = "MISSION START";
      setTimeout(() => {
        setIsIgnitionModalOpen(false);
        btn.innerText = "IGNITE PROJECT";
        setActiveAdminModule("PROJECTS");
        setSelectedProjectTab(newProject.id);
      }, 1000);

    } catch (err) {
      console.error("Failed to ignite project:", err);
      btn.innerText = "ERROR - RETRY";
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
    const serviceId = formData.get('service');
    const serviceName = services.find(s => s.id === parseInt(serviceId))?.title || "Custom Service";

    const quoteVal = parseInt(formData.get('quote')) || 0;
    const discountVal = parseInt(formData.get('discount')) || 0;
    const advanceVal = parseInt(formData.get('advanceAmount')) || 0;
    const finalQuote = quoteVal - discountVal;
    let paymentStatus = 'unpaid';
    if (advanceVal >= finalQuote) {
      paymentStatus = 'paid';
    } else if (advanceVal > 0) {
      paymentStatus = 'part';
    }

    const discountPercentVal = ((discountVal / (quoteVal || 1)) * 100).toFixed(2);

    const updatedFields = {
      service: serviceName,
      deadline: formData.get('deadline'),
      quote: quoteVal,
      discountValue: (formData.get('discount') || '0').toString(),
      discountType: 'rs',
      discountPercent: discountPercentVal,
      discount: discountVal,
      advanceAmount: advanceVal,
      paymentStatus: paymentStatus
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
    const newEntry = {
      id: Date.now(),
      date: formData.get('date'),
      desc: formData.get('desc'),
      amount: parseFloat(formData.get('amount')),
      type: formData.get('type'),
      mode: formData.get('mode'),
      category: formData.get('category')
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
    const exists = cashbookEntries.some(entry => entry.projectId === project.id && entry.desc.startsWith(type === 'deposit' ? "Advance Payment:" : "Final Payment:"));
    if (!exists && milestoneAmt > 0) {
      const newEntry = {
        id: Date.now(),
        projectId: project.id,
        date: new Date().toISOString().split('T')[0],
        desc: desc,
        amount: milestoneAmt,
        type: "INCOME",
        mode: "UPI",
        category: "Service"
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

  const handleUpdateProjectStatusHandy = async (projectId, newPaymentStatus, newProjectStatus) => {
    const project = ignitionQueue.find(p => p.id === projectId);
    if (!project) return;

    const baseQuote = parseFloat(project.quote) || 0;
    const discountVal = parseFloat(project.discount) || 0;
    const finalQuote = baseQuote - discountVal;
    const advanceAmt = parseFloat(project.advanceAmount) || 0;

    let updatedFields = {
      paymentStatus: newPaymentStatus || project.paymentStatus,
      status: newProjectStatus || project.status,
      stage: project.stage
    };

    if (newPaymentStatus === 'paid') {
      updatedFields.status = 'Completed';
      updatedFields.stage = 4;
      
      // Log to cashbook if not exists
      const remainingAmt = finalQuote - (project.paymentStatus === 'part' ? advanceAmt : 0);
      if (remainingAmt > 0) {
        const exists = cashbookEntries.some(entry => entry.projectId === project.id && entry.desc.startsWith("Final Payment:"));
        if (!exists) {
          const newEntry = {
            id: Date.now(),
            projectId: project.id,
            date: new Date().toISOString().split('T')[0],
            desc: `Final Payment: ${project.service || project.name} - ${project.name}`,
            amount: remainingAmt,
            type: "INCOME",
            mode: "UPI",
            category: "Service"
          };
          setCashbookEntries(prev => [newEntry, ...prev]);
        }
      }
    } else if (newPaymentStatus === 'unpaid') {
      // Revert paymentStatus to unpaid, reset stage and status to Active
      updatedFields.status = newProjectStatus || 'Active';
      updatedFields.stage = 1;
      // Remove any cashbook entries associated with this project
      setCashbookEntries(prev => prev.filter(entry => entry.projectId !== project.id));
    }

    if (newProjectStatus === 'Cancelled') {
      updatedFields.status = 'Cancelled';
      updatedFields.paymentStatus = 'unpaid';
      // Remove any cashbook entries associated with this project
      setCashbookEntries(prev => prev.filter(entry => entry.projectId !== project.id));
    }

    try {
      await updateProjectState(projectId, updatedFields);
      toast({
        title: "Project Status Calibrated",
        description: `Successfully marked project as ${newPaymentStatus === 'paid' ? 'Paid' : (newProjectStatus === 'Cancelled' ? 'Cancelled' : 'Active/Unpaid')}.`
      });
    } catch (err) {
      console.warn("Failed to update project status in Supabase:", err);
    }

    setIgnitionQueue(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          ...updatedFields
        };
      }
      return p;
    }));
  };


  const handleUpdateCashbookEntry = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedEntry = {
      ...selectedCashbookEntry,
      date: formData.get('date'),
      desc: formData.get('desc'),
      amount: parseFloat(formData.get('amount')),
      type: formData.get('type'),
      mode: formData.get('mode'),
      category: formData.get('category')
    };
    setCashbookEntries(prev => prev.map(entry => entry.id === selectedCashbookEntry.id ? updatedEntry : entry));
    setIsCashbookEditModalOpen(false);
    setSelectedCashbookEntry(null);
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      if (selectedClient) {
        const clientData = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          gst: formData.get('gst') || '',
          status: selectedClient.status || 'Active'
        };
        let updatedClient;
        try {
          updatedClient = await updateClientProfile(selectedClient.id, clientData);
        } catch (dbErr) {
          console.warn("Supabase update failed, falling back to local memory:", dbErr);
          updatedClient = {
            ...selectedClient,
            ...clientData
          };
        }
        setClients(prev => {
          const next = prev.map(c => c.id === selectedClient.id ? updatedClient : c);
          localStorage.setItem("netra_clients", JSON.stringify(next));
          return next;
        });
        toast({ title: "Client Updated Successfully", description: `Updated visionary: ${clientData.name}` });
      } else {
        const randomAccessKey = Math.random().toString(36).substring(2, 8).toUpperCase();
        const clientData = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          gst: formData.get('gst') || '',
          status: 'Active',
          accessKey: randomAccessKey
        };
        let newClient;
        try {
          newClient = await createClientProfile(clientData);
        } catch (dbErr) {
          console.warn("Supabase insert failed, falling back to local memory:", dbErr);
          newClient = {
            id: Date.now(),
            ...clientData,
            joinedDate: new Date().toLocaleDateString()
          };
        }
        setClients(prev => {
          const next = [...prev, newClient];
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
  };

  const deleteClient = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO EXTINGUISH THIS CLIENT RECORD?")) {
      try {
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

  const handleSendSpark = async (e) => {
    e.preventDefault();
    const nameVal = document.getElementById('name').value;
    const emailVal = document.getElementById('email').value;
    const phoneVal = document.getElementById('phone').value;
    const visionVal = document.getElementById('vision').value;
    const serviceVal = selectedProject || "General Inquiry";

    try {
      await createInquiry({
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        service: serviceVal,
        desc: visionVal,
        status: 'New Spark'
      });
      const dbInquiries = await getInquiries();
      setInquiries(dbInquiries);
    } catch (err) {
      console.error("Error creating inquiry spark:", err);
    }

    setIsSuccess(true);
    setTimeout(() => {
      goHome();
    }, 4000);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={`app-container ${isVaultActive ? 'vault-active' : ''}`} ref={containerRef}>
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
                    <p className="v-title">Netra OS v2.4</p>
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
                <div className="menu-container">
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
              </nav>
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
                  <Portfolio
                    onContactClick={goToContact}
                    visionSettings={visionSettings}
                    servicesList={servicesList}
                  />
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

                      {/* Get Started Button */}
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
                  <div className="split-narrative">
                    {/* Left Side: The Human Connection */}
                    <div className="connection-side">
                      <motion.div
                        className="connection-reveal"
                        initial={false}
                        animate={isContactActive ? "visible" : "hidden"}
                        variants={{
                          visible: { transition: { staggerChildren: 0.2 } },
                          hidden: {}
                        }}
                      >
                        <motion.h2
                          className="contact-title"
                          variants={{
                            hidden: { opacity: 0, x: -50 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
                          }}
                        >
                          LET'S IGNITE
                        </motion.h2>
                        <motion.div
                          className="contact-details"
                          variants={{
                            hidden: { opacity: 0, x: -30 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
                          }}
                        >
                          <p className="detail-item email">hiraparasavan989@gmail.com</p>
                          <p className="detail-item phone">+91 73590 93035</p>
                          <p className="detail-item address">Shreeji Complex, Opp. AaramGruh, Mendarda-Sasan Road, Mendarda-362260</p>
                        </motion.div>
                        <motion.div
                          className="social-links"
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
                          }}
                        >
                          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="social-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                          </a>
                          <a href="https://wa.me/917359093035?text=I am interested in starting a visual revolution with Netra Graphics." target="_blank" rel="noopener noreferrer" className="social-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 4.5l-4.1 4.1" /><path d="M11 11a1 1 0 1 0 2 0 1 1 0 1 0-2 0" /><path d="M17 11a1 1 0 1 0 2 0 1 1 0 1 0-2 0" /><path d="M7 11a1 1 0 1 0 2 0 1 1 0 1 0-2 0" /></svg>
                          </a>
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Right Side: The Spark Interaction */}
                    <div className="spark-side">
                      {!isSuccess ? (
                        <form className="inquiry-form" onSubmit={handleSendSpark}>
                          <div className="form-group">
                            <input type="text" id="name" required placeholder=" " />
                            <label htmlFor="name">Name</label>
                            <div className="input-line"></div>
                          </div>
                          <div className="form-group">
                            <input type="email" id="email" required placeholder=" " />
                            <label htmlFor="email">Email</label>
                            <div className="input-line"></div>
                          </div>
                          <div className="form-group">
                            <input type="tel" id="phone" required placeholder=" " />
                            <label htmlFor="phone">Mobile / WhatsApp</label>
                            <div className="input-line"></div>
                          </div>
                          <div className="form-group custom-dropdown-wrapper" ref={dropdownRef}>
                            <div
                              className={`custom-dropdown ${selectedProject ? 'has-value' : ''}`}
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                              <span className="selected-value">{selectedProject || " "}</span>
                              <label>Project Type</label>
                              <div className="dropdown-arrow">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </div>
                              <div className="input-line"></div>
                            </div>

                            <AnimatePresence>
                              {dropdownOpen && (
                                <motion.div
                                  className="dropdown-list"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                >
                                  {services.map((s, i) => (
                                    <motion.div
                                      key={s.id}
                                      className="dropdown-item"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.03 }}
                                      onClick={() => {
                                        setSelectedProject(s.title);
                                        setDropdownOpen(false);
                                      }}
                                    >
                                      {s.title}
                                    </motion.div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="form-group">
                            <textarea id="vision" required placeholder=" " rows="1"></textarea>
                            <label htmlFor="vision">Your Vision</label>
                            <div className="input-line"></div>
                          </div>
                          <button type="submit" className="magnetic-button">
                            <span className="btn-text">SEND SPARK</span>
                            <div className="btn-glow"></div>
                          </button>
                        </form>
                      ) : (
                        <div className="success-sequence">
                          <div className="light-speed-particles">
                            {[...Array(50)].map((_, i) => (
                              <div
                                key={i}
                                className="particle"
                                style={{
                                  '--tx': `${(Math.random() - 0.5) * 1000}px`,
                                  '--ty': `${(Math.random() - 0.5) * 1000}px`,
                                  '--delay': `${Math.random() * 0.5}s`
                                }}
                              ></div>
                            ))}
                          </div>
                          <motion.div
                            className="success-logo-container"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          >
                            <div className="logo-formation">
                              <img src="/logo.png" alt="Netra Logo" className="success-brand-logo" />
                              <div className="cyan-bloom-pulse"></div>
                            </div>
                          </motion.div>
                          <h3 className="success-msg">VISION RECEIVED. PREPARING FOR REVOLUTION.</h3>
                        </div>
                      )}
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
                          setTimeout(() => {
                            triggerInstantTransition(() => {
                              clearAllPages();
                              setIsClientVaultActive(true);
                              pushPageToHistory('client-vault');
                            });
                          }, 100);
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
                    <div className="flex items-center gap-2 px-1 pb-2 select-none">
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
                    className="admin-welcome-screen"
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
                      <div className="modules-header">
                        <span className="header-bar"></span>
                        <h2>ADMINISTRATIVE MODULES</h2>
                      </div>

                      <div className="admin-cards-grid">
                        {[
                          { id: "DASHBOARD", title: "DASHBOARD", desc: "Global metrics and high-level project status.", icon: "⚡" },
                          { id: "PROJECTS", title: "PROJECTS", desc: "Active project management and media vault.", icon: "📁" },
                          { id: "INQUIRIES", title: "INQUIRIES", desc: "Managing 'Sparks' from the contact portal.", icon: "📥" },
                          { id: "CLIENTS", title: "CLIENTS", desc: "Full CRM database of the Netra network.", icon: "👥" },
                          { id: "INVOICES", title: "INVOICE VAULT", desc: "Interactive standalone invoice workspace & documents ledger.", icon: "📄" },
                          { id: "FINANCIALS", title: "FINANCIALS", desc: "Cashbook ledger, profit analytics and revenue ignition.", icon: "💰" },
                          { id: "SETTINGS", title: "SETTINGS", desc: "Calibrating the 20 service cards and pricing.", icon: "⚙️" },
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
                      <div className="active-module-header">
                        <h2 className="module-title">{activeAdminModule}</h2>
                        <div className="title-underline"></div>
                      </div>

                      <div className="module-content-area">
                        {activeAdminModule === "DASHBOARD" && (
                          <Dashboard
                            projects={ignitionQueue}
                            clients={clients}
                            invoices={invoices}
                            cashbookEntries={cashbookEntries}
                          />
                        )}

                        {activeAdminModule === "PROJECTS" && (
                          <Projects
                            projects={ignitionQueue}
                            setProjects={setIgnitionQueue}
                            clients={clients}
                            onOpenIgnitionModal={() => { setPrefillData(null); setIsIgnitionModalOpen(true); }}
                            setCustomPaymentPrompt={setCustomPaymentPrompt}
                            onDownloadInvoice={(p) => {
                              setInvoiceProject(p);
                              setIsInvoicePreviewOpen(true);
                            }}
                            handleUpdateProjectStatusHandy={handleUpdateProjectStatusHandy}
                          />

                        )}

                        {activeAdminModule === "INQUIRIES" && (
                          <Inquiries
                            inquiries={inquiries}
                            setInquiries={setInquiries}
                            services={services}
                            handleIgniteFromInquiry={handleIgniteFromInquiry}
                          />
                        )}

                        {activeAdminModule === "CLIENTS" && (
                          <Clients
                            clients={clients}
                            ignitionQueue={ignitionQueue}
                            onOpenCreateClient={() => { setSelectedClient(null); setIsClientModalOpen(true); }}
                            onOpenEditClient={(client) => { setSelectedClient(client); setIsClientModalOpen(true); }}
                            onDeleteClient={deleteClient}
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
                            monthlyTarget={monthlyTarget}
                            setMonthlyTarget={setMonthlyTarget}
                            financialTab={financialTab}
                            setFinancialTab={setFinancialTab}
                            financialMetrics={financialMetrics}
                            cashbookMetrics={cashbookMetrics}
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
                          />
                        )}
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
                                        <label>Client Email</label>
                                        <input type="email" name="email" defaultValue={prefillData?.email || ''} placeholder="Direct digital link" required />
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
                                    <select name="service" required defaultValue={prefillData?.serviceId || ''}>
                                      <option value="">Choose service...</option>
                                      {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.title}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="input-group">
                                    <label>Target Delivery Date</label>
                                    <input type="date" name="deadline" required />
                                  </div>
                                </div>

                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Estimated Quote (₹)</label>
                                    <input type="number" name="quote" placeholder="Suggested base: ₹15,000" />
                                  </div>
                                  <div className="input-group">
                                    <label>Special Discount (₹)</label>
                                    <input type="number" name="discount" placeholder="0" />
                                  </div>
                                  <div className="input-group">
                                    <label>Advance Payment (₹)</label>
                                    <input type="number" name="advanceAmount" placeholder="0" />
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
                                    <label>Email Address</label>
                                    <input type="email" name="email" defaultValue={selectedClient?.email} placeholder="Direct digital link" required />
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
                                      <select name="service" defaultValue={services.find(s => s.title === currentProject?.service)?.id} required>
                                        {services.map(s => (
                                          <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="form-row">
                                      <div className="input-group">
                                        <label>Deadline Adjustment</label>
                                        <input type="date" name="deadline" defaultValue={currentProject?.deadline} required />
                                      </div>
                                      <div className="form-row">
                                        <div className="input-group">
                                          <label>Quote Calibration (₹)</label>
                                          <input type="number" name="quote" defaultValue={currentProject?.quote} required />
                                        </div>
                                        <div className="input-group">
                                          <label>Discount Calibration (₹)</label>
                                          <input type="number" name="discount" defaultValue={currentProject?.discount} />
                                        </div>
                                        <div className="input-group">
                                          <label>Advance Payment Calibration (₹)</label>
                                          <input type="number" name="advanceAmount" defaultValue={currentProject?.advanceAmount} />
                                        </div>
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
                                    <label>Category</label>
                                    <select name="category" defaultValue={selectedCashbookEntry.category}>
                                      <option value="Software">Software</option>
                                      <option value="Hardware">Hardware</option>
                                      <option value="Marketing">Marketing</option>
                                      <option value="Salary">Salary/Wages</option>
                                      <option value="Rent">Rent</option>
                                      <option value="Service">Service Income</option>
                                      <option value="Other">Other</option>
                                    </select>
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Client Vault Placeholder */}
          <section className={`client-vault-page ${isClientVaultActive ? 'active' : ''}`}>
            <div className="vault-background client-bg"></div>
            <div className="vault-content">
              <h1 className="vision-title">CLIENT VAULT</h1>
              <p className="vision-subtitle">Secure access granted. Your brand's evolution is stored here.</p>
              <button className="vision-back-btn" onClick={goHome}>EXIT TO MAIN FRAME</button>
            </div>
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
                          <div key={idx} className={`roadmap-step ${selectedKanbanProject.completedMilestones.includes(m) ? 'done' : ''}`}>
                            <div className="step-check">
                              {selectedKanbanProject.completedMilestones.includes(m) && "✓"}
                            </div>
                            <span className="step-name">{m}</span>
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
                  </div>

                  <div className="drawer-content">
                    {notifTab === 'SPARKS' ? (
                      <div className="notif-list">
                        {sparks.length > 0 ? sparks.map(s => (
                          <div key={s.id} className="notif-card spark flex justify-between items-center" onClick={() => {
                            setActiveAdminModule("INQUIRIES");
                            setIsAdminGridActive(true);
                            setIsNotificationOpen(false);
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
                        )) : (
                          <div className="empty-state">
                            <span className="empty-icon">✧</span>
                            <p>No new sparks detected.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="notif-list">
                        {flames.length > 0 ? flames.map(f => (
                          <div key={f.id} className="notif-card flame flex justify-between items-center" onClick={() => {
                            setActiveAdminModule("DASHBOARD");
                            setIsAdminGridActive(true);
                            setIsNotificationOpen(false);
                          }}>
                            <div className="flex items-center gap-3">
                              <div className="notif-icon-box orange">🔥</div>
                              <div className="notif-info">
                                <p className="notif-msg">
                                  {new Date(f.deadline) - new Date() < 0 ? "Project Overdue: " : "Deadline approaching for "}
                                  <strong>{f.name}</strong>
                                </p>
                                <span className="notif-time">{getFlameNotifText(f)}</span>
                              </div>
                            </div>
                            <button
                              className="text-3xs uppercase tracking-wider text-orange-400 hover:text-orange-300 font-extrabold px-2.5 py-1 rounded bg-orange-400/10 border border-orange-400/20 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                markFlameAsRead(f.id);
                              }}
                            >
                              DISMISS
                            </button>
                          </div>
                        )) : (
                          <div className="empty-state">
                            <span className="empty-icon">🕯️</span>
                            <p>No urgent flames currently burning.</p>
                          </div>
                        )}
                      </div>
                    )}
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
                        const inputVal = document.getElementById('custom-payment-input').value;
                        const parsed = parseFloat(inputVal);
                        const amt = (!isNaN(parsed) && parsed > 0) ? parsed : customPaymentPrompt.defaultAmt;

                        try {
                          await updateProjectState(customPaymentPrompt.p.id, {
                            stage: 4,
                            status: "Completed",
                            paymentStatus: "paid"
                          });
                          const actionMsg = `Project marked as Completed & Final Payment of ₹${amt} Logged`;
                          await addProjectActivityLog(customPaymentPrompt.p.id, actionMsg);
                        } catch (err) {
                          console.error("Failed to sync completed project status to Supabase:", err);
                        }

                        if (amt > 0) {
                          setCashbookEntries(prev => [...prev, {
                            id: Date.now(),
                            projectId: customPaymentPrompt.p.id,
                            date: new Date().toISOString().split('T')[0],
                            desc: `Payment: ${customPaymentPrompt.p.service} - ${customPaymentPrompt.p.name}`,
                            amount: amt,
                            type: "INCOME",
                            mode: customPaymentPrompt.paymentMode,
                            category: "Project"
                          }]);
                          alert(`Payment of ₹${amt} logged to Cashbook!`);
                        }

                        setIgnitionQueue(prev => prev.map(proj =>
                          proj.id === customPaymentPrompt.p.id ? {
                            ...proj,
                            paymentStatus: 'paid',
                            status: "Completed",
                            stage: 4,
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
                              paymentStatus: 'paid'
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
                    const stableInvoiceNo = invoiceProject.invoiceNo || getInvoiceNumber(invoiceProject.createdAt, invoices.length + 1);

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
                            padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            color: '#fff', position: 'relative'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 2 }}>
                              <img
                                src="/logo.png"
                                alt="Netra Logo"
                                style={{
                                  height: '75px',
                                  width: 'auto',
                                  objectFit: 'contain',
                                  filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.35))',
                                  flexShrink: 0
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h1 style={{ margin: 0, fontSize: '2.0rem', fontWeight: '900', fontFamily: 'Urbanist, sans-serif', letterSpacing: '1px' }}>{adminProfile.businessName.toUpperCase()}</h1>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', opacity: 0.95, marginTop: '6px' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 5.92 5.92l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/>
                                    </svg>
                                    {adminProfile.phone}
                                  </span>
                                  <span>📧 {adminProfile.email}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', zIndex: 2 }}>
                              <h2 style={{ margin: 0, fontSize: '2.0rem', letterSpacing: '3px', fontWeight: '900', fontFamily: 'Urbanist, sans-serif' }}>TAX INVOICE</h2>
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
                                const clientObj = clients.find(c => c.name.trim().toLowerCase() === invoiceProject.name.trim().toLowerCase()) || invoiceProject.client;
                                const phone = invoiceProject.phone || clientObj?.phone;
                                const email = invoiceProject.email || clientObj?.email;
                                return (
                                  <>
                                    {phone && <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📞 {phone}</p>}
                                    {email && <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📧 {email}</p>}
                                  </>
                                );
                              })()}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <label style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>INVOICE DETAILS</label>
                              <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Invoice #:</strong> {stableInvoiceNo}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem' }}><strong>Issue Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
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
 
                          {/* TOTALS & FOOTER - ONLY ON LAST PAGE */}
                          {isLastPage ? (
                            <div style={{ background: '#fff', borderTop: '1px solid #eee' }}>
                              <div style={{ padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                {/* Payment Instructions */}
                                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', width: '58%', border: '1px solid #eee' }}>
                                  <div style={{ width: '80px', height: '80px', background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${encodeURIComponent(bankingDetails.upiId)}&pn=${encodeURIComponent(bankingDetails.accountName)}&am=${parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0)}&cu=INR`} alt="UPI QR" style={{ width: '100%', height: '100%' }} />
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
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#666' }}>ADVANCE PAID</span>
                                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>-₹{formatCurrencyValue(invoiceProject.advanceAmount)}</span>
                                  </div>
 
                                  <div style={{
                                    background: '#3f51b5', padding: '10px 15px', color: '#fff', borderRadius: '6px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                  }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>GRAND TOTAL</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>₹{formatCurrencyValue(parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0))}</span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ padding: '0 40px 12px' }}>
                                <div style={{ background: '#fcfcfc', border: '1px solid #f0f0f0', borderLeft: '3px solid #d32f2f', padding: '6px 12px' }}>
                                  <label style={{ fontSize: '0.5rem', color: '#888', fontWeight: '900', display: 'block' }}>AMOUNT IN WORDS</label>
                                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    {amountInWords(parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0))}
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
                                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://instagram.com/HIRAPARASAVANPHOTOGRAPHER" alt="IG QR" style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ fontSize: '0.5rem', color: '#777' }}>
                                      <strong style={{ color: '#333' }}>@HIRAPARASAVANPHOTOGRAPHER</strong>
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
                          ) : (
                            <div style={{ marginTop: 'auto', padding: '15px 40px', textAlign: 'center', color: '#bbb', fontSize: '0.7rem', borderTop: '1px solid #eee' }}>
                              CONTINUED ON PAGE {pageIdx + 2}...
                              <div style={{ textAlign: 'center', paddingTop: '6px', fontSize: '0.6rem', color: '#bbb' }}>
                                Page {pageIdx + 1} of {pages.length}
                              </div>
                            </div>
                          )}
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
                            onClick={async () => {
                              saveInvoiceToVault(invoiceProject, stableInvoiceNo);
                              // Trigger automatic PDF download first so it's ready for drag-and-drop
                              await downloadMultiPageInvoicePDF(invoiceProject, stableInvoiceNo);
                              
                              const msg = `Namaste! Your Tax Invoice (${stableInvoiceNo}) from Netra Graphics is ready. Amount: ₹${(parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0)).toLocaleString()}. Thank you!`;

                              // Look up client phone robustly
                              const rawPhone = invoiceProject.phone || (invoiceProject.client && invoiceProject.client.phone) || (() => {
                                const c = clients.find(c => c.name.toLowerCase() === invoiceProject.name.toLowerCase());
                                return c ? c.phone : '';
                              })();

                              // Clean phone and prepend country code
                              const cleanedPhone = rawPhone.replace(/\D/g, '');
                              const finalPhone = cleanedPhone.length === 10 ? '91' + cleanedPhone : cleanedPhone;

                              window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                          >
                            Send via WhatsApp
                          </button>
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
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
