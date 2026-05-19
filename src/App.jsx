import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './App.css';
import { supabase } from './supabase/client';
import { 
  getInquiries, createInquiry, updateInquiry, deleteInquiry,
  getClients, createClientProfile, verifyClientVaultKey, updateClientProfile,
  getProjects, igniteProject, updateProjectState, toggleMilestone, addProjectActivityLog, sendChatMessage, subscribeToChats, uploadMediaVaultAsset,
  getInvoices, saveInvoice, deleteInvoice 
} from './supabase/database';


const services = [
  { id: 1, title: "Brand Identity (Logo)", desc: "Crafting the soul of your business through iconic marks.", icon: "🎨" },
  { id: 2, title: "Premium Brochures", desc: "Tangible narratives that tell your brand story in print.", icon: "📖" },
  { id: 3, title: "Digital Interactive Brochures", desc: "Immersive, clickable experiences for the modern era.", icon: "🖱️" },
  { id: 4, title: "Corporate Profiles", desc: "Building authority through professional structural design.", icon: "🏢" },
  { id: 5, title: "Social Storytelling", desc: "High-impact graphics designed for digital engagement.", icon: "📱" },
  { id: 6, title: "Large Format Media", desc: "Bold visual statements for hoardings and wall graphics.", icon: "🏙️" },
  { id: 7, title: "Cinematic Video Packages", desc: "Motion design and production for a visual revolution.", icon: "🎥" },
  { id: 8, title: "Digital Invitations", desc: "Modern, elegant WhatsApp-ready invites for every event.", icon: "✉️" },
  { id: 9, title: "Editorial Design", desc: "Professional layouts for magazines and corporate newsletters.", icon: "📰" },
  { id: 10, title: "Print Masterpieces (Posters)", desc: "High-resolution visual art for physical spaces.", icon: "🖼️" },
  { id: 11, title: "Marketing Flyers", desc: "Strategic designs to spark immediate consumer interest.", icon: "🚀" },
  { id: 12, title: "Custom Calendars", desc: "365 days of your brand presence on every desk.", icon: "📅" },
  { id: 13, title: "Prestige Certificates", desc: "Designing excellence for your milestones and awards.", icon: "🏆" },
  { id: 14, title: "Culinary Menus", desc: "Visual appetizing designs for restaurants and cafes.", icon: "🍴" },
  { id: 15, title: "Festival Greetings", desc: "Cultural heritage meets high-tech celebratory art.", icon: "✨" },
  { id: 16, title: "Event Stationery", desc: "Bespoke invitation cards for every significant gathering.", icon: "🎫" },
  { id: 17, title: "Legacy Wedding Albums", desc: "Transforming your most precious memories into a visual epic.", icon: "💍" },
  { id: 18, title: "Photography", desc: "Capturing moments with cinematic precision and artistic flair.", icon: "📸" },
  { id: 19, title: "Printing Jobwork", desc: "Precision engineering for all your commercial printing needs.", icon: "🖨️" },
  { id: 20, title: "Typing Jobwork", desc: "Professional documentation and data services with meticulous accuracy.", icon: "⌨️" }
];

function App() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Initialize standard Audio stream pointing to our high-fidelity, local loop MP3
    const audio = new Audio('/ambient-loop.mp3');
    audio.loop = true;
    audio.volume = 0.2; // Warm, peaceful background volume level
    audioRef.current = audio;

    // Autoplay attempt immediately on mount
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

    // Setup global UI click sound effect handler
    const handleGlobalClick = (e) => {
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

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('scroll', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    window.addEventListener('click', handleGlobalClick);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('scroll', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('click', handleGlobalClick);
    };
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoginActive, setIsLoginActive] = useState(false);
  const [isAdminSelected, setIsAdminSelected] = useState(false);
  const [isCommandCenterActive, setIsCommandCenterActive] = useState(false);
  const [isClientVaultActive, setIsClientVaultActive] = useState(false);
  const [isIgnitionModalOpen, setIsIgnitionModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifTab, setNotifTab] = useState("SPARKS");
  const [selectedKanbanProject, setSelectedKanbanProject] = useState(null);
  const [ignitionQueue, setIgnitionQueue] = useState([
    {
      id: 1777000000001,
      name: "Aura Boutique",
      service: "Logo Designing & Identity",
      stage: 2, // Moodboard phase
      status: "Ongoing",
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isManual: true,
      client: {
        name: "Aura Boutique",
        phone: "9876543210",
        email: "aura.boutique@gmail.com",
        address: "M.G. Road, Ahmedabad, 380001"
      },
      milestones: [
        { name: "Discovery", completed: true },
        { name: "Moodboard", completed: true },
        { name: "Sketching", completed: false },
        { name: "Final Flame", completed: false }
      ],
      activityLog: [
        { action: "Project Ignited", time: "10:30 AM" },
        { action: "Discovery Completed", time: "11:45 AM" },
        { action: "Moodboard Approved by Client", time: "04:15 PM" }
      ],
      quote: 18000,
      discountValue: "2000",
      discountType: 'rs',
      discountPercent: "11.11",
      discount: 2000,
      advanceAmount: 5000,
      paymentStatus: 'part',
      mediaVault: [],
      collaborationStream: [
        { id: 1, sender: "SYSTEM", text: "Project Ignited successfully.", time: "10:30 AM" },
        { id: 2, sender: "ADMIN", text: "Moodboards uploaded to the portal.", time: "02:00 PM" },
        { id: 3, sender: "CLIENT", text: "Wow, we absolutely love the second theme! Proceeding with that.", time: "04:15 PM" }
      ]
    },
    {
      id: 1777000000002,
      name: "Apex Cybertech",
      service: "3D Motion Graphics & Animation",
      stage: 4, // Final Flame phase
      status: "Completed",
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isManual: true,
      client: {
        name: "Apex Cybertech",
        phone: "9988776655",
        email: "info@apexcyber.tech",
        address: "Cyber City, Bangalore, 560001"
      },
      milestones: [
        { name: "Discovery", completed: true },
        { name: "Moodboard", completed: true },
        { name: "Sketching", completed: true },
        { name: "Final Flame", completed: true }
      ],
      activityLog: [
        { action: "Project Ignited", time: "09:00 AM" },
        { action: "Storyboard Finalized", time: "03:00 PM" },
        { action: "3D Models Baked", time: "06:00 PM" },
        { action: "Final Render Delivered", time: "11:00 AM" }
      ],
      quote: 45000,
      discountValue: "5000",
      discountType: 'rs',
      discountPercent: "11.11",
      discount: 5000,
      advanceAmount: 20000,
      paymentStatus: 'paid',
      mediaVault: [],
      collaborationStream: [
        { id: 1, sender: "SYSTEM", text: "Project Ignited successfully.", time: "09:00 AM" },
        { id: 2, sender: "ADMIN", text: "Draft rendering is complete.", time: "05:00 PM" },
        { id: 3, sender: "CLIENT", text: "Stunning animation quality! Everything is perfect.", time: "10:30 AM" }
      ]
    }
  ]);
  const [selectedProjectTab, setSelectedProjectTab] = useState(null);
  const [projectFilter, setProjectFilter] = useState("Ongoing");
  const [expandedClientRev, setExpandedClientRev] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [inquiries, setInquiries] = useState([
    {
      id: 20001,
      name: "Rohan Sharma",
      service: "Packaging Design",
      email: "rohan@gmail.com",
      phone: "98250 12345",
      desc: "Looking for minimal, clean packaging designs for our organic honey brand.",
      status: "New Spark",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 20002,
      name: "Zoya Patel",
      service: "UI/UX Branding",
      email: "zoya@designstudio.in",
      phone: "70430 98765",
      desc: "Need full visual style guides and Figma designs for a travel startup app.",
      status: "New Spark",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);
  const [clients, setClients] = useState([
    {
      id: 10001,
      name: "Aura Boutique",
      email: "aura.boutique@gmail.com",
      phone: "9876543210",
      address: "M.G. Road, Ahmedabad, 380001",
      status: 'Active',
      joinedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
    },
    {
      id: 10002,
      name: "Apex Cybertech",
      email: "info@apexcyber.tech",
      phone: "9988776655",
      address: "Cyber City, Bangalore, 560001",
      status: 'Active',
      joinedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }
  ]);
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
  const [activeAdminModule, setActiveAdminModule] = useState("DASHBOARD");
  const [showInquiryBadge, setShowInquiryBadge] = useState(false);
  const [isAdminGridActive, setIsAdminGridActive] = useState(false);
  const [unreadSparksCount, setUnreadSparksCount] = useState(0);
  const [showSparkToast, setShowSparkToast] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);
  const [ignitionClientType, setIgnitionClientType] = useState("NEW"); // NEW, EXISTING
  const [isProjectEditModalOpen, setIsProjectEditModalOpen] = useState(false);

  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        const dbClients = await getClients();
        if (dbClients && dbClients.length > 0) {
          setClients(dbClients);
        }
        
        const dbInquiries = await getInquiries();
        if (dbInquiries && dbInquiries.length > 0) {
          setInquiries(dbInquiries);
        }
        
        const dbProjects = await getProjects();
        if (dbProjects && dbProjects.length > 0) {
          setIgnitionQueue(dbProjects);
        }
        
        const dbInvoices = await getInvoices();
        if (dbInvoices && dbInvoices.length > 0) {
          setInvoices(dbInvoices);
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
  
  const sparks = inquiries.filter(q => q.status === "New Spark");
  const flames = ignitionQueue.filter(q => {
    const deadline = new Date(q.deadline);
    const now = new Date();
    const diff = deadline - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  });

  const calculateDaysRemaining = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [invoiceProject, setInvoiceProject] = useState(null);
  const [invoices, setInvoices] = useState([
    {
      id: 1777000000003,
      invoiceNo: "NG/17052026/0001",
      clientName: "Apex Cybertech",
      projectService: "3D Motion Graphics & Animation",
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      grandTotal: 20000,
      rawProject: {
        id: 1777000000002,
        name: "Apex Cybertech",
        service: "3D Motion Graphics & Animation",
        stage: 4,
        status: "Completed",
        quote: 45000,
        discount: 5000,
        advanceAmount: 20000
      }
    }
  ]);
  const [selectedBatchProjects, setSelectedBatchProjects] = useState([]);
  const [selectedVaultInvoices, setSelectedVaultInvoices] = useState([]);

  const getInvoiceNumber = (date, serial = 1) => {
    const d = new Date(date || Date.now());
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
    const serialStr = serial.toString().padStart(4, '0');
    return `NG/${dateStr}/${serialStr}`;
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
  }, [inquiries, ignitionQueue]);

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
  const [financialTab, setFinancialTab] = useState("LEDGER"); // LEDGER, CASHBOOK
  const [isCashbookEditModalOpen, setIsCashbookEditModalOpen] = useState(false);
  const [selectedCashbookEntry, setSelectedCashbookEntry] = useState(null);
  const [customPaymentPrompt, setCustomPaymentPrompt] = useState(null);
  const [cashbookEntries, setCashbookEntries] = useState([
    { id: 1, date: new Date().toISOString().split('T')[0], desc: "Adobe CC Subscription", amount: 4500, type: "EXPENSE", mode: "UPI", category: "Software" },
    { id: 2, date: new Date().toISOString().split('T')[0], desc: "Studio Equipment Maintenance", amount: 2500, type: "EXPENSE", mode: "CASH", category: "Hardware" }
  ]);

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

  useEffect(() => {
    // Splash & Hero Timings
    const logoTimer = setTimeout(() => setLogoDrawn(true), 1800);
    const revealTimer = setTimeout(() => setRevealStarted(true), 2000);
    const headlineTimer = setTimeout(() => setHeadlineActive(true), 2600);
    const taglineTimer = setTimeout(() => setTaglineActive(true), 2900);
    const missionTimer = setTimeout(() => setMissionActive(true), 3400);
    const headerTimer = setTimeout(() => setHeaderVisible(true), 3200);
    const completionTimer = setTimeout(() => setIsFullyRevealed(true), 3500);

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

      // Transition from Hero to Vault
      if (!isVaultActive && !isContactActive && e.deltaY > 30 && missionActive) {
        setIsTransitioning(true);
        setIsVaultActive(true);
        setTimeout(() => setIsTransitioning(false), 1200);
        return;
      }
    };

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(revealTimer);
      clearTimeout(headlineTimer);
      clearTimeout(taglineTimer);
      clearTimeout(missionTimer);
      clearTimeout(headerTimer);
      clearTimeout(completionTimer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVaultActive, missionActive, isTransitioning, showConstruction]);

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
  };

  const resetForm = () => {
    setSelectedProject("");
    setDropdownOpen(false);
  };

  const clearAllPages = () => {
    setIsVaultActive(false);
    setIsContactActive(false);
    setIsLoginActive(false);
    setIsCommandCenterActive(false);
    setIsClientVaultActive(false);
    setIsAdminGridActive(false);
    setIsSuccess(false);
    resetForm();
  };

  const goHome = () => triggerSplashTransition(() => {
    clearAllPages();
  });

  const goToVault = () => triggerInstantTransition(() => {
    clearAllPages();
    setIsVaultActive(true);
  });

  const goToContact = () => triggerInstantTransition(() => {
    clearAllPages();
    setIsVaultActive(true);
    setIsContactActive(true);
  });

  const goToLogin = () => triggerInstantTransition(() => {
    clearAllPages();
    setIsLoginActive(true);
    setAccessKey("");
    setPassphrase("");
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (isAdminSelected) {
      if (accessKey === "savan@netra.com" && passphrase === "revolution2026") {
        triggerInstantTransition(() => {
          clearAllPages();
          setIsCommandCenterActive(true);
          setShowSparkToast(unreadSparksCount > 0);
        });
      } else {
        alert("ACCESS DENIED: Credentials do not match the Architect's records.");
      }
    } else {
      // Client Access
      if (accessKey && passphrase) {
        triggerInstantTransition(() => {
          clearAllPages();
          setIsClientVaultActive(true);
        });
      } else {
        alert("Please enter your Client Access Key and Passphrase.");
      }
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    triggerInstantTransition(() => {
      clearAllPages();
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
    
    try {
      await updateProjectState(projectId, nextStage, newStatus);
      const actionMsg = `Transitioned to ${kanbanColumns[nextStage-1].title}`;
      await addProjectActivityLog(projectId, actionMsg);
      
      setIgnitionQueue(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            stage: nextStage,
            status: newStatus,
            activityLog: [
              { action: actionMsg, time: new Date().toLocaleTimeString() },
              ...p.activityLog
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
    
    try {
      await updateProjectState(projectId, project.stage, newStatus);
      const actionMsg = `Status Updated to ${newStatus.toUpperCase()}`;
      await addProjectActivityLog(projectId, actionMsg);
      
      setIgnitionQueue(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            status: newStatus,
            activityLog: [
              { action: actionMsg, time: new Date().toLocaleTimeString() },
              ...p.activityLog
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
      
      const projectPayload = {
        name: clientInfo.name,
        service: serviceName,
        stage: 1,
        status: "Ongoing",
        deadline: formData.get('deadline'),
        isManual: true,
        client: clientInfo,
        milestones: milestoneNames.map((name, idx) => ({ name, completed: name === "Discovery" })),
        quote: quoteVal,
        discountValue: discountVal.toString(),
        discountType: 'rs',
        discountPercent: discountPct,
        discount: discountVal,
        advanceAmount: 0,
        paymentStatus: 'part',
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
      alert("Failed to ignite project in database.");
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
        alert("Failed to terminate project database record.");
      }
    }
  };

  const handleEditProject = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceId = formData.get('service');
    const serviceName = services.find(s => s.id === parseInt(serviceId))?.title || "Custom Service";
    
    setIgnitionQueue(prev => prev.map(p => {
      if (p.id === selectedProjectTab) {
        return {
          ...p,
          service: serviceName,
          deadline: formData.get('deadline'),
          quote: parseInt(formData.get('quote')),
          discountValue: formData.get('discount') || '0',
          discountType: 'rs',
          discountPercent: ((parseFloat(formData.get('discount'))||0) / parseInt(formData.get('quote')) * 100).toFixed(2),
          discount: parseInt(formData.get('discount')) || 0
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
          status: selectedClient.status || 'Active'
        };
        const updatedClient = await updateClientProfile(selectedClient.id, clientData);
        setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
      } else {
        const randomAccessKey = Math.random().toString(36).substring(2, 8).toUpperCase();
        const clientData = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          status: 'Active',
          accessKey: randomAccessKey
        };
        const newClient = await createClientProfile(clientData);
        setClients(prev => [...prev, newClient]);
      }
    } catch (err) {
      console.error("Failed to save client to Supabase:", err);
      alert("Failed to save client record in database.");
    }
    
    setIsClientModalOpen(false);
    setSelectedClient(null);
  };

  const deleteClient = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO EXTINGUISH THIS CLIENT RECORD?")) {
      try {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        setClients(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        console.error("Failed to delete client from Supabase:", err);
        alert("Failed to delete client record from database.");
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
    <div className="app-container" ref={containerRef}>
      {/* Global Admin Header (Only shown when a module is open) */}
      {isCommandCenterActive && isAdminGridActive && (
        <header className="admin-header header-reveal">
          <nav className="admin-nav">
            <div className="admin-branding">
              <img src="/logo.png" alt="Netra Logo" className="admin-logo-img" />
              <span className="admin-branding-text">NETRA GRAPHICS</span>
            </div>
            <div className="admin-menu">
              {["DASHBOARD", "PROJECTS", "INQUIRIES", "CLIENTS", "FINANCIALS", "SETTINGS"].map((module) => (
                <a 
                  key={module}
                  href="#" 
                  className={`admin-menu-link ${activeAdminModule === module ? 'active' : ''}`}
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setActiveAdminModule(module); 
                    setIsAdminGridActive(true); 
                    setIsIgnitionModalOpen(false); // Auto-close modal on navigation
                    if (module === "INQUIRIES") setShowInquiryBadge(false);
                  }}
                >
                  {module}
                  {module === "INQUIRIES" && (
                    <span className={`notification-badge ${showInquiryBadge ? 'visible' : 'fade-out'}`}></span>
                  )}
                </a>
              ))}
              <div className="admin-actions">
                <div className={`notification-bell-wrapper ${ ((sparks.length + flames.length) > 0 || bellPulse) ? 'has-alerts' : ''}`} onClick={() => setIsNotificationOpen(true)}>
                  <svg className="bell-icon" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                  {(sparks.length + flames.length) > 0 && (
                    <span className="bell-badge">{sparks.length + flames.length}</span>
                  )}
                </div>
                <a href="#" className="admin-menu-link logout-link" onClick={handleLogout}>LOGOUT</a>
              </div>
            </div>
          </nav>
        </header>
      )}

      {/* Fixed Public Header */}
      {!isCommandCenterActive && !isClientVaultActive && (
        <header className={`main-header ${headerVisible ? 'header-reveal' : 'header-hidden'}`}>
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
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); goHome(); }}>HOME</a>
              <span className="menu-divider"></span>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); goToVault(); }}>SERVICES</a>
              <span className="menu-divider"></span>
              <a href="#projects" className="menu-link">OUR PROJECTS</a>
              <span className="menu-divider"></span>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); goToContact(); }}>CONTACT US</a>
              <span className="menu-divider"></span>
              <a href="#" className="menu-link" onClick={(e) => { e.preventDefault(); goToLogin(); }}>LOGIN</a>
              <span className="menu-divider"></span>
              <button className="sound-toggle-btn" onClick={toggleSound} title={isPlaying ? "Mute Ambient Track" : "Play Ambient Track"}>
                <div className={`sound-waves ${isPlaying ? 'playing' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>
          </nav>
        </header>
      )}

      {/* Landing Experience */}
      {!isLoginActive && !isCommandCenterActive && !isClientVaultActive && (
        <>
          {/* Hero Page */}
          <section className={`hero-page ${isVaultActive ? 'slide-up' : ''}`}>
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

      {/* Service Vault Page */}
      <section className={`vault-page ${isVaultActive ? 'active' : ''}`} ref={vaultRef}>
        <div className="vault-background">
          <div className="embers-container">
            {emberStats.map((ember, i) => (
              <div key={i} className="ember" style={{ 
                '--left': ember.left,
                '--delay': ember.delay,
                '--duration': ember.duration
              }}></div>
            ))}
          </div>
        </div>

        <div className="vault-content">
          <div className="service-grid">
            <AnimatePresence>
              {isVaultActive && services.map((service, index) => (
                <motion.div 
                  key={service.id}
                  className="service-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onClick={() => setShowConstruction(true)}
                >
                  <div className="card-visual">{service.icon}</div>
                  <div className="card-info">
                    <h3 className="service-name">{service.title}</h3>
                    <p className="service-desc">{service.desc}</p>
                  </div>
                  <div className="inquiry-icon" data-tooltip="Booking Engine Coming Soon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Vision in Progress Overlay (Maintenance State) */}
        <AnimatePresence>
          {showConstruction && (
            <motion.div 
              className="vision-overlay"
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="vision-module">
                <div className="vision-phoenix-wrapper">
                  <img src="/image_0.png" alt="Phoenix" className="breathing-phoenix" />
                </div>
                <h2 className="vision-title">ARCHITECTING THE REVOLUTION</h2>
                <p className="vision-subtitle">This service is currently being calibrated for excellence. Stay tuned.</p>
                <button className="vision-back-btn" onClick={() => setShowConstruction(false)}>
                  BACK TO SERVICES
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        <div className="login-background">
          <div className="blurred-hero-bg">
            <div className="fluid-background dark-version">
              <div className="gradient-sphere sphere-1"></div>
              <div className="gradient-sphere sphere-2"></div>
              <div className="grid-texture"></div>
            </div>
          </div>
          {/* Cyberpunk ambient glows tailored to Netra colors */}
          <div className="login-ambient-glow glow-cyan"></div>
          <div className="login-ambient-glow glow-orange"></div>
        </div>

        <div className="login-container">
          <motion.div 
            className="frosted-login-module"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={isLoginActive ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <div className="login-header">
              <div className="login-logo-wrapper">
                <img src="/logo.png" alt="Netra Graphics" className="login-logo" />
              </div>
              <p className="login-subtitle">AUTHORIZED COGNITIVE TERMINAL</p>
            </div>

            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-form-group has-icon">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input 
                  type="email" 
                  id="accessKey" 
                  required 
                  placeholder=" " 
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                />
                <label htmlFor="accessKey">Access Key</label>
                <div className="login-input-line"></div>
              </div>

               <div className="login-form-group has-icon">
                <span className="input-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input 
                  type={showPassphrase ? "text" : "password"} 
                  id="passphrase" 
                  required 
                  placeholder=" " 
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
                <label htmlFor="passphrase">Passphrase</label>
                <div className="login-input-line"></div>
                <button 
                  type="button" 
                  className="passphrase-toggle"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                >
                  {showPassphrase ? "HIDE" : "SHOW"}
                </button>
              </div>

              <div className="access-switch-container">
                <span className={`switch-label ${!isAdminSelected ? 'active' : ''}`}>Client</span>
                <div 
                  className={`access-switch ${isAdminSelected ? 'admin' : 'client'}`}
                  onClick={() => setIsAdminSelected(!isAdminSelected)}
                >
                  <div className="switch-toggle"></div>
                </div>
                <span className={`switch-label ${isAdminSelected ? 'active' : ''}`}>Admin</span>
              </div>

              <button type="submit" className="revolution-button">
                ENTER THE REVOLUTION
              </button>

              <div className="security-badge">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                SECURE CORE INTERACTION
              </div>
            </form>
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
                      { id: "FINANCIALS", title: "FINANCIALS", desc: "Invoice generation and revenue ignition.", icon: "💰" },
                      { id: "SETTINGS", title: "SETTINGS", desc: "Calibrating the 17 service cards and pricing.", icon: "⚙️" },
                      { id: "LOGOUT", title: "LOGOUT", desc: "Safe session termination and return to Home.", icon: "🚪" }
                    ].map((card) => (
                      <div 
                        key={card.id} 
                        className={`admin-module-card ${card.id === "INQUIRIES" && unreadSparksCount > 0 ? 'magic-alert' : ''}`}
                        onClick={() => {
                          if (card.id === "LOGOUT") {
                            handleLogout({ preventDefault: () => {} });
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
                className="admin-grid-screen"
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
                      <div className="command-center-dashboard">
                        {/* Global Metrics Row */}
                        <div className="metrics-row">
                          <motion.div className="metric-tile float-module" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}}>
                            <span className="tile-label">Active Revolutions</span>
                            <span className="tile-value cyan-glow">{ignitionQueue.filter(p => p.status === 'Ongoing').length}</span>
                          </motion.div>
                          <motion.div className="metric-tile float-module" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
                            <span className="tile-label">Total Ignitions</span>
                            <span className="tile-value white-glow">{ignitionQueue.length}</span>
                          </motion.div>
                          <motion.div className="metric-tile float-module" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}}>
                            <span className="tile-label">New Sparks</span>
                            <span className="tile-value orange-glow">{inquiries.filter(i => i.status === 'New Spark').length}</span>
                          </motion.div>
                          <motion.div className="metric-tile float-module chart-tile" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.4}}>
                            <span className="tile-label">Revenue Growth</span>
                            <div className="mini-line-chart">
                              <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                                <path d="M0,25 Q15,20 30,22 T60,10 T100,5" fill="none" stroke="#00E5FF" strokeWidth="1.5" />
                              </svg>
                            </div>
                          </motion.div>
                        </div>

                        {/* Center Grid: Ignition Queue & Revenue Breakdown */}
                        <div className="center-grid">
                          <motion.div className="dashboard-module ignition-queue float-module" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.5}}>
                            <div className="module-header"><h3>IGNITION QUEUE</h3></div>
                            <table className="kanban-table">
                              <thead>
                                <tr><th>Client</th><th>Service</th><th>Progress</th></tr>
                              </thead>
                              <tbody>
                                {ignitionQueue.map((row, i) => (
                                  <tr key={i}>
                                    <td>{row.name}</td>
                                    <td className="dim-text">{row.service}</td>
                                    <td>
                                      <div className="progress-tracker">
                                        <span 
                                          className={`node ${row.stage >= 1 ? 'active' : ''}`} 
                                          onClick={() => updateIgnitionStatus(i, 1)}
                                          title="Concept Stage"
                                        >C</span>
                                        <div className={`line ${row.stage >= 2 ? 'active' : ''}`}></div>
                                        <span 
                                          className={`node ${row.stage >= 2 ? 'active' : ''}`} 
                                          onClick={() => updateIgnitionStatus(i, 2)}
                                          title="Design Stage"
                                        >D</span>
                                        <div className={`line ${row.stage >= 3 ? 'active' : ''}`}></div>
                                        <span 
                                          className={`node ${row.stage >= 3 ? 'active' : ''}`} 
                                          onClick={() => updateIgnitionStatus(i, 3)}
                                          title="Execution Stage"
                                        >E</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>

                          <div className="breakdown-column">
                            <motion.div className="dashboard-module sleek-chart float-module" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.6}}>
                              <div className="module-header"><h3>SERVICE PERFORMANCE</h3></div>
                              <div className="column-chart">
                                {[85, 65, 90, 45, 75].map((h, i) => (
                                  <div key={i} className="chart-bar" style={{height: `${h}%`}}></div>
                                ))}
                              </div>
                            </motion.div>
                            <motion.div className="dashboard-module pending-list float-module" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.7}}>
                              <div className="module-header"><h3>PENDING INVOICES</h3></div>
                              <div className="invoice-rows">
                                {ignitionQueue.filter(p => p.status !== "Completed").length > 0 ? (
                                  ignitionQueue.filter(p => p.status !== "Completed").slice(0, 5).map(p => (
                                    <div key={p.id} className="invoice-row" onClick={() => { setActiveAdminModule("FINANCIALS"); }}>
                                      <span>{p.client?.name || p.name}</span> 
                                      <span className="value orange-glow">₹{p.quote?.toLocaleString()}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="empty-notif" style={{ padding: '1rem', color: '#808080', fontSize: '0.7rem', textAlign: 'center' }}>
                                    ALL INVOICES SETTLED ✧
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        </div>

                        <motion.div className="dashboard-module service-status-tracker float-module" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.8}}>
                          <div className="module-header"><h3>SERVICE STATUS TRACKER</h3></div>
                          <div className="status-grid-scroll">
                            {services.map((s, idx) => {
                              const stats = serviceStats[idx];
                              return (
                                <div key={s.id} className="status-item">
                                  <span className="s-name">{s.title}</span>
                                  <div className="status-controls">
                                    <span className="vol-text">+{stats.growth}% MoM</span>
                                    <div className={`status-toggle ${stats.online ? 'active' : ''}`}>
                                      {stats.online ? 'ONLINE' : 'CALIBRATING'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {activeAdminModule === "PROJECTS" && (
                      <div className="project-command-terminal">
                        {/* Left Sidebar: Active Projects Selection */}
                        <div className="terminal-sidebar">
                          <div className="sidebar-header">
                            <h3>PROJECT REVOLUTIONS</h3>
                            <div className="filter-dropdown">
                              <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                                <option value="Ongoing">ONGOING</option>
                                <option value="Completed">COMPLETED</option>
                                <option value="Closed">CLOSED</option>
                              </select>
                            </div>
                          </div>
                          <div className="sidebar-project-list">
                            {(() => {
                              const filtered = ignitionQueue.filter(p => p.status === projectFilter);
                              const grouped = {};
                              filtered.forEach(p => {
                                if (!grouped[p.name]) grouped[p.name] = [];
                                grouped[p.name].push(p);
                              });
                              
                              return Object.entries(grouped).map(([clientName, projects]) => {
                                if (projects.length === 1) {
                                  const p = projects[0];
                                  return (
                                    <div 
                                      key={p.id} 
                                      className={`sidebar-project-item ${selectedProjectTab === p.id ? 'active' : ''}`}
                                      onClick={() => setSelectedProjectTab(p.id)}
                                    >
                                      <div className="p-icon">{p.name.charAt(0)}</div>
                                      <div className="p-info">
                                        <span className="p-name">{p.name}</span>
                                        <span className="p-service">{p.service} &bull; DUE: {new Date(p.deadline).toLocaleDateString()}</span>
                                      </div>
                                      {calculateDaysRemaining(p.deadline) <= 1 && p.status === 'Ongoing' && (
                                        <div className="p-alert-dot"></div>
                                      )}
                                    </div>
                                  );
                                } else {
                                  const isExpanded = expandedClientRev === clientName;
                                  return (
                                    <div key={clientName} style={{marginBottom: '0.5rem'}}>
                                      <div 
                                        className={`sidebar-project-item client-group ${projects.some(p => p.id === selectedProjectTab) ? 'active' : ''}`}
                                        onClick={() => setExpandedClientRev(isExpanded ? null : clientName)}
                                        style={{ borderLeft: projects.some(p => p.id === selectedProjectTab) ? '3px solid #00E5FF' : 'none' }}
                                      >
                                        <div className="p-icon" style={{background: 'rgba(0, 229, 255, 0.1)'}}>{clientName.charAt(0)}</div>
                                        <div className="p-info">
                                          <span className="p-name">{clientName}</span>
                                          <span className="p-service">{projects.length} Active Projects</span>
                                        </div>
                                        <div style={{marginLeft: 'auto', color: '#00e5ff', fontSize: '0.8rem', fontWeight: 'bold'}}>
                                          {isExpanded ? '▲' : '▼'}
                                        </div>
                                      </div>
                                      
                                      {isExpanded && (
                                        <div className="client-projects-sublist" style={{ marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                          {projects.map(p => (
                                            <div 
                                              key={p.id}
                                              className={`sidebar-project-item sub-item ${selectedProjectTab === p.id ? 'active' : ''}`}
                                              onClick={() => setSelectedProjectTab(p.id)}
                                              style={{ 
                                                padding: '0.8rem', 
                                                background: selectedProjectTab === p.id ? 'rgba(0, 229, 255, 0.05)' : 'transparent', 
                                                borderLeft: selectedProjectTab === p.id ? '2px solid #00E5FF' : '2px solid transparent',
                                                display: 'flex', 
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                borderRadius: '0 4px 4px 0',
                                                marginBottom: 0
                                              }}
                                            >
                                              <span style={{fontSize: '0.75rem', fontFamily: 'Poppins', color: selectedProjectTab === p.id ? '#00e5ff' : '#fff'}}>{p.service}</span>
                                              <span style={{fontSize: '0.65rem', color: '#808080'}}>{new Date(p.deadline).toLocaleDateString()}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                              });
                            })()}
                          </div>
                        </div>

                        {/* Main Workspace: Media Vault & Collaboration */}
                        <div className="terminal-workspace">
                          {ignitionQueue.find(p => p.id === selectedProjectTab) ? (
                            (() => {
                              const p = ignitionQueue.find(proj => proj.id === selectedProjectTab);
                              return (
                                <>
                                  <div className="workspace-header">
                                    <div className="project-meta">
                                      <h2>{p.name} <small>— {p.service}</small></h2>
                                      <div className="meta-data-blocks">
                                        <div className="data-block">
                                          <span className="db-label">STATUS</span>
                                          <span className="db-value meta-badge">{p.status.toUpperCase()}</span>
                                        </div>
                                        <div className="data-block">
                                          <span className="db-label">VISIONARY</span>
                                          <span className="db-value">{p.client.name}</span>
                                        </div>
                                        <div className="data-block">
                                          <span className="db-label">TARGET DELIVERY</span>
                                          <span className="db-value">{new Date(p.deadline).toLocaleDateString()}</span>
                                        </div>
                                        <div className="data-block">
                                          <span className="db-label">BUSINESS ADDRESS</span>
                                          <span className="db-value">{p.client.address || "N/A"}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="workspace-actions">
                                      <button className="action-btn" onClick={() => alert("Simulating Media Upload Integration...")}>
                                        <span className="btn-icon">📁</span> SHARE ASSET
                                      </button>
                                      <button className="action-btn" onClick={() => setIsProjectEditModalOpen(true)}>
                                        <span className="btn-icon">✎</span> EDIT MISSION
                                      </button>
                                      <button className="action-btn terminate-btn" onClick={() => deleteProject(p.id)}>
                                        <span className="btn-icon">×</span> TERMINATE
                                      </button>
                                      <button className="action-btn" onClick={() => updateProjectStatus(p.id, p.status === "Ongoing" ? "Completed" : "Ongoing")}>
                                        {p.status === "Ongoing" ? "MARK FINALIZED" : "RESTORE PROJECT"}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="workspace-grid">
                                    {/* Column 1: Media Vault */}
                                    <div className="workspace-column media-vault-column">
                                      <div className="column-header-bar">
                                        <h3>MEDIA VAULT</h3>
                                        <span className="vault-count">{p.mediaVault?.length || 0} ASSETS</span>
                                      </div>
                                      <div className="media-grid">
                                        {p.mediaVault?.map(m => (
                                          <div key={m.id} className="media-card">
                                            <div className={`media-preview ${m.type}`}>
                                              {m.type === 'image' ? <img src={m.url} alt={m.name} /> : <div className="file-placeholder">{m.type.toUpperCase()}</div>}
                                              <div className="media-overlay">
                                                <button onClick={() => window.open(m.url, '_blank')}>VIEW</button>
                                              </div>
                                            </div>
                                            <div className="media-info">
                                              <span className="m-name">{m.name}</span>
                                              <span className="m-size">{m.size}</span>
                                            </div>
                                          </div>
                                        ))}
                                        <div className="media-card add-more" onClick={() => alert("Integration point for drag-and-drop")}>
                                          <div className="add-icon">+</div>
                                          <span>ADD ASSET</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Column 2: Collaboration Pulse */}
                                    <div className="workspace-column collaboration-column">
                                      <div className="column-header-bar">
                                        <h3>COLLABORATION PULSE</h3>
                                        <span className="pulse-indicator">LIVE</span>
                                      </div>
                                      <div className="interaction-stream">
                                        {p.collaborationStream?.map(msg => (
                                          <div key={msg.id} className={`stream-message ${msg.sender.toLowerCase()}`}>
                                            <div className="msg-meta">
                                              <span className="msg-sender">{msg.sender}</span>
                                              <span className="msg-time">{msg.time}</span>
                                            </div>
                                            <p className="msg-text">{msg.text}</p>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="message-input-area">
                                        <input 
                                          type="text" 
                                          placeholder="Type a message to the visionary..." 
                                          value={chatMessage}
                                          onChange={(e) => setChatMessage(e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter' && chatMessage.trim()) {
                                              const updatedQueue = ignitionQueue.map(proj => {
                                                if (proj.id === p.id) {
                                                  return {
                                                    ...proj,
                                                    collaborationStream: [
                                                      ...proj.collaborationStream,
                                                      { id: Date.now(), sender: "ADMIN", text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                                    ]
                                                  };
                                                }
                                                return proj;
                                              });
                                              setIgnitionQueue(updatedQueue);
                                              setChatMessage("");
                                            }
                                          }}
                                        />
                                        <button className="send-msg-btn">➤</button>
                                      </div>
                                    </div>

                                    {/* Column 3: Roadmap & Activity */}
                                    <div className="workspace-column roadmap-column">
                                      <div className="column-header-bar">
                                        <h3>REVOLUTION ROADMAP</h3>
                                      </div>
                                      <div className="roadmap-stepper">
                                        {p.milestones.map((m, idx) => {
                                          const activeIndex = p.milestones.findIndex(mile => !mile.completed);
                                          const isActive = idx === activeIndex;
                                          return (
                                            <div key={idx} className={`roadmap-node ${m.completed ? 'done' : ''} ${isActive ? 'active-stage' : ''}`}>
                                              <div className="node-marker"></div>
                                            <div className="node-content">
                                              <span className="n-name">{m.name}</span>
                                              <button 
                                                className="n-toggle"
                                                onClick={() => {
                                                  const updatedQueue = ignitionQueue.map(proj => {
                                                    if (proj.id === p.id) {
                                                      const updatedMilestones = [...proj.milestones];
                                                      updatedMilestones[idx].completed = !updatedMilestones[idx].completed;
                                                      return { ...proj, milestones: updatedMilestones };
                                                    }
                                                    return proj;
                                                  });
                                                  setIgnitionQueue(updatedQueue);
                                                }}
                                              >
                                                {m.completed ? 'DONE' : 'PENDING'}
                                              </button>
                                            </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="activity-mini-log">
                                        <h4>RECENT ACTIVITY</h4>
                                        {p.activityLog.slice(0, 3).map((log, i) => (
                                          <div key={i} className="mini-log-item">
                                            <span className="l-time">{log.time}</span>
                                            <span className="l-action">{log.action}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()
                          ) : (
                            <div className="empty-workspace">
                              <div className="empty-visual">✧</div>
                              <p>SELECT A PROJECT TO BEGIN COLLABORATION</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeAdminModule === "INQUIRIES" && (
                      <div className="inquiry-vault">
                        {/* Insight Cards */}
                        <div className="insight-cards">
                          <div className="insight-card">
                            <span className="i-label">Unread Sparks</span>
                            <span className="i-value cyan-glow">09</span>
                          </div>
                          <div className="insight-card">
                            <span className="i-label">Top Demand</span>
                            <span className="i-value white-glow">Wedding Album</span>
                          </div>
                          <div className="insight-card">
                            <span className="i-label">Conversion Rate</span>
                            <span className="i-value orange-glow">84%</span>
                          </div>
                        </div>

                        {/* Calibration Bar */}
                        <div className="calibration-bar">
                          <div className="search-box">
                            <input type="text" placeholder="Search Identity / Mobile..." />
                          </div>
                          <div className="filter-group">
                            <select className="cyan-glow-select">
                              <option>All Services</option>
                              {services.map(s => <option key={s.id}>{s.title}</option>)}
                            </select>
                            <select className="cyan-glow-select">
                              <option>All Status</option>
                              <option>New Spark</option>
                              <option>Processing</option>
                              <option>Rejected</option>
                            </select>
                            <input type="date" className="cyan-glow-select" />
                          </div>
                        </div>

                        {/* Inquiry Table */}
                        <div className="vault-table-container">
                          <table className="vault-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Client Name</th>
                                <th>Service</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inquiries.map((inq) => (
                                <tr key={inq.id} className="vault-row">
                                  <td>{inq.date}</td>
                                  <td className="bold-text">{inq.name}</td>
                                  <td>{inq.service}</td>
                                  <td>{inq.location}</td>
                                  <td>
                                    <span className={`status-badge ${inq.status.toLowerCase().replace(" ", "-")}`}>
                                      {inq.status}
                                    </span>
                                  </td>
                                  <td className="actions-cell">
                                    <div className="action-icons">
                                      <button className="a-btn accept" title="Accept" onClick={() => setRemarkModal({ open: true, inquiryId: inq.id, type: 'Accepted' })}>✓</button>
                                      <button className="a-btn reject" title="Reject" onClick={() => setRemarkModal({ open: true, inquiryId: inq.id, type: 'Rejected' })}>×</button>
                                      <button className="a-btn review" title="Review" onClick={() => { setSelectedInquiry(inq); setIsReviewDrawerOpen(true); }}>👁</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Remark Overlay */}
                        <AnimatePresence>
                          {remarkModal.open && (
                            <div className="modal-overlay">
                              <motion.div 
                                className="remark-modal"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                              >
                                <h3>ADD REMARK</h3>
                                <p>For: {inquiries.find(i => i.id === remarkModal.inquiryId)?.name}</p>
                                <textarea 
                                  placeholder="Type your message to the client..."
                                  value={remarkText}
                                  onChange={(e) => setRemarkText(e.target.value)}
                                ></textarea>
                                <div className="modal-actions">
                                  <button type="button" className="cancel-mission-btn" onClick={() => setRemarkModal({ open: false, inquiryId: null, type: null })}>CANCEL</button>
                                  <button type="button" className="ignite-submit-btn" onClick={() => {
                                    const inq = inquiries.find(i => i.id === remarkModal.inquiryId);
                                    const msg = `Hello ${inq.name}, update from Netra Graphics. Your inquiry for ${inq.service} has been ${remarkModal.type}. Remark: ${remarkText}. Let's ignite the future!`;
                                    window.open(`https://wa.me/${inq.phone.replace(/\s/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                    setInquiries(inquiries.map(i => i.id === remarkModal.inquiryId ? { ...i, status: remarkModal.type === 'Accepted' ? 'Ignited' : 'Extinguished' } : i));
                                    setRemarkModal({ open: false, inquiryId: null, type: null });
                                    setRemarkText("");
                                  }}>SEND STATUS</button>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>

                        {/* Review Side Drawer */}
                        <AnimatePresence>
                          {isReviewDrawerOpen && (
                            <div className="drawer-overlay" onClick={() => setIsReviewDrawerOpen(false)}>
                              <motion.div 
                                className="review-drawer"
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button className="close-drawer" onClick={() => setIsReviewDrawerOpen(false)}>×</button>
                                <div className="drawer-content">
                                  <h3>INQUIRY DETAILS</h3>
                                  <div className="detail-item">
                                    <label>Client</label>
                                    <p>{selectedInquiry?.name}</p>
                                  </div>
                                  <div className="detail-item">
                                    <label>Service</label>
                                    <p>{selectedInquiry?.service}</p>
                                  </div>
                                  <div className="detail-item">
                                    <label>Phone</label>
                                    <p>{selectedInquiry?.phone}</p>
                                  </div>
                                  <div className="detail-item">
                                    <label>Message</label>
                                    <p className="dim-text">Interested in a premium {selectedInquiry?.service} for my new project in {selectedInquiry?.location}. Please provide availability.</p>
                                  </div>
                                  {selectedInquiry?.status !== 'Ignited' && (
                                    <div className="detail-item" style={{ marginTop: '30px' }}>
                                      <button 
                                        type="button" 
                                        className="ignite-submit-btn" 
                                        style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textShadow: '0 0 10px rgba(0,229,255,0.5)', cursor: 'pointer' }}
                                        onClick={() => handleIgniteFromInquiry(selectedInquiry)}
                                      >
                                        🚀 AUTO-IGNITE PROJECT
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {activeAdminModule === "CLIENTS" && (
                      <div className="crm-module">
                        <div className="crm-header-actions">
                          <button className="add-client-btn" onClick={() => { setClientViewMode("LIST"); setIsClientModalOpen(true); setSelectedClient(null); }}>
                            + ADD NEW CLIENT
                          </button>
                        </div>
                        
                        {clientViewMode === "LIST" ? (
                          <div className="crm-table-container">
                            <table className="crm-table">
                              <thead>
                                <tr><th>Client Name</th><th>Contact Details</th><th>Status</th><th>Actions</th></tr>
                              </thead>
                              <tbody>
                                {clients.length > 0 ? clients.map(client => (
                                  <tr key={client.id}>
                                    <td className="bold-text">{client.name}</td>
                                    <td>
                                      <div className="contact-mini">
                                        <span>{client.phone}</span>
                                        <span className="dim-text">{client.email}</span>
                                      </div>
                                    </td>
                                    <td><span className="status-badge ignited">Active</span></td>
                                    <td className="actions-cell">
                                      <div className="action-icons">
                                        <button className="a-btn review" title="View Details" onClick={() => { setSelectedClient(client); setClientViewMode("VIEW"); }}>👁</button>
                                        <button className="a-btn" title="Edit Profile" onClick={() => { setSelectedClient(client); setIsClientModalOpen(true); }}>✎</button>
                                        <button className="a-btn accept" title="Work History" onClick={() => { 
                                          setSelectedClient(client);
                                          setClientViewMode("VIEW");
                                        }}>📁</button>
                                        <button className="a-btn reject" title="Delete" onClick={() => deleteClient(client.id)}>×</button>
                                      </div>
                                    </td>
                                  </tr>
                                )) : (
                                  <tr><td colSpan="4" className="empty-row">NO CLIENTS REGISTERED IN THE NETRA NETWORK</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          /* Client Detailed View / Work History */
                          <div className="client-detailed-view">
                            <div className="view-header">
                              <button className="back-link" onClick={() => setClientViewMode("LIST")}>← BACK TO NETWORK</button>
                              <h2>{selectedClient?.name} <small>— CLIENT PROFILE</small></h2>
                            </div>
                            <div className="detail-grid">
                              <div className="detail-card">
                                <h3>CONTACT PROFILE</h3>
                                <div className="info-item"><label>PHONE</label><p>{selectedClient?.phone}</p></div>
                                <div className="info-item"><label>EMAIL</label><p>{selectedClient?.email}</p></div>
                                <div className="info-item"><label>ADDRESS</label><p>{selectedClient?.address}</p></div>
                              </div>
                              <div className="detail-card history-card">
                                <h3>WORK HISTORY</h3>
                                <div className="history-list">
                                  {ignitionQueue.filter(p => p.name === selectedClient?.name).length > 0 ? (
                                    ignitionQueue.filter(p => p.name === selectedClient?.name).map(p => (
                                      <div key={p.id} className="history-item">
                                        <span className="h-service">{p.service}</span>
                                        <span className="h-status">{p.status}</span>
                                        <span className="h-date">{new Date(p.deadline).toLocaleDateString()}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="dim-text">No previous missions recorded for this visionary.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeAdminModule === "FINANCIALS" && (
                      <div className="financial-dashboard">
                        {/* Financial Sub-Navigation */}
                        <div className="admin-sub-nav">
                          <button className={`sub-nav-btn ${financialTab === 'PROJECTS' ? 'active' : ''}`} onClick={() => setFinancialTab('PROJECTS')}>IGNITION QUEUE</button>
                          <button className={`sub-nav-btn ${financialTab === 'CASHBOOK' ? 'active' : ''}`} onClick={() => setFinancialTab('CASHBOOK')}>CASHBOOK ENTRIES</button>
                          <button className={`sub-nav-btn ${financialTab === 'INVOICES' ? 'active' : ''}`} onClick={() => setFinancialTab('INVOICES')}>INVOICE VAULT</button>
                        </div>

                        {financialTab === 'PROJECTS' && (
                          <>
                            <div className="terminal-header-bar" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className="t-left">
                                <h2 className="cyan-glow-text">IGNITION LEDGER</h2>
                                <p>Calibration of quote and payment status for active missions</p>
                              </div>
                            </div>

                            {/* Financial Analytics Grid */}
                            <div className="financial-grid">
                          <div className="fin-card total-rev">
                            <label>TOTAL REVENUE</label>
                            <h2>₹{financialMetrics.totalRevenue.toLocaleString()}</h2>
                            <div className="fin-visual">
                              <motion.div 
                                className="wave" 
                                animate={{ x: [-20, 0, -20] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              />
                            </div>
                          </div>
                          <div className="fin-card pending-due">
                            <label>PENDING DUES</label>
                            <h2>₹{financialMetrics.pendingDues.toLocaleString()}</h2>
                            <span className="due-hint">Across {ignitionQueue.filter(p => p.stage < 4).length} Active Missions</span>
                          </div>
                          <div className="fin-card target-tracker">
                            <div className="card-header-flex">
                              <label>MONTHLY TARGET</label>
                              <button className="edit-target-btn" onClick={() => {
                                const t = prompt("Set New Monthly Target (₹):", monthlyTarget);
                                if (t) setMonthlyTarget(parseInt(t));
                              }}>✎</button>
                            </div>
                            <div className="target-progress-container">
                              <motion.div 
                                className="progress-bar" 
                                initial={{ width: 0 }}
                                animate={{ width: `${financialMetrics.targetProgress}%` }}
                                transition={{ duration: 1 }}
                              />
                              <span className="progress-label">{Math.round(financialMetrics.targetProgress)}%</span>
                            </div>
                            <h2>₹{financialMetrics.monthlyRevenue.toLocaleString()} <small>/ ₹{(monthlyTarget/1000).toFixed(0)}k</small></h2>
                          </div>
                        </div>

                        {/* Invoice & Ledger Section */}
                        <div className="invoice-terminal">
                          <div className="terminal-header-bar">
                            <div className="t-left">
                              <h3>LEDGER & INVOICE VAULT</h3>
                              <p>Tracking the financial pulse of the Netra Empire</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                              <div className="terminal-search-box" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                <span style={{ color: '#0ff', fontSize: '0.8rem', marginRight: '8px' }}>$ SEARCH_CLIENT:</span>
                                <input 
                                  type="text" 
                                  placeholder="Type name..." 
                                  value={ledgerSearch}
                                  onChange={(e) => setLedgerSearch(e.target.value)}
                                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', padding: '8px 0', outline: 'none', width: '150px' }}
                                />
                              </div>
                              {selectedBatchProjects.length > 0 && (
                                  <button 
                                    className="ignite-submit-btn" 
                                    style={{ margin: 0, padding: '0.6rem 1.2rem', background: '#d32f2f', color: '#fff' }}
                                    onClick={() => {
                                      const selected = ignitionQueue.filter(p => selectedBatchProjects.includes(p.id));
                                      const clients = [...new Set(selected.map(p => p.name))];
                                      if (clients.length > 1) {
                                        alert("Batch invoices can only be generated for a single client at a time.");
                                        return;
                                      }
                                      
                                    const getDiscountAmt = (p) => {
                                      if (p.discountType === 'rs') return parseFloat(p.discountValue) || 0;
                                      if (p.discountType === '%') return ((parseFloat(p.discountValue) || 0) / 100) * p.quote;
                                      return parseFloat(p.discount) || 0;
                                    };

                                      const batchProject = {
                                        ...selected[0],
                                        id: `batch-${Date.now()}`,
                                        service: selected.map(p => p.service).join(", "),
                                        quote: selected.reduce((sum, p) => sum + (parseFloat(p.quote)||0), 0),
                                        discount: selected.reduce((sum, p) => sum + getDiscountAmt(p), 0),
                                        advanceAmount: selected.reduce((sum, p) => sum + (parseFloat(p.advanceAmount)||0), 0),
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
                                  </button>
                                )}
                            </div>
                          </div>
                          
                          <div className="crm-table-container">
                            <table className="crm-table">
                              <thead>
                                <tr>
                                  <th style={{ width: '40px' }}>
                                    <input 
                                      type="checkbox" 
                                      onChange={(e) => {
                                        const filtered = ignitionQueue.filter(p => p.name.toLowerCase().includes(ledgerSearch.toLowerCase()));
                                        if (e.target.checked) setSelectedBatchProjects(filtered.map(p => p.id));
                                        else setSelectedBatchProjects([]);
                                      }} 
                                    />
                                  </th>
                                  <th>Mission Details</th>
                                  <th>Financial Status</th>
                                  <th>Calibration Quote</th>
                                  <th>Target Date</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const filtered = ignitionQueue.filter(p => p.name.toLowerCase().includes(ledgerSearch.toLowerCase()));
                                  return filtered.length > 0 ? (
                                    filtered.map(p => (
                                      <tr key={p.id} className={selectedBatchProjects.includes(p.id) ? 'selected-row' : ''}>
                                      <td style={{ textAlign: 'center' }}>
                                        <input 
                                          type="checkbox" 
                                          checked={selectedBatchProjects.includes(p.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) setSelectedBatchProjects(prev => [...prev, p.id]);
                                            else setSelectedBatchProjects(prev => prev.filter(id => id !== p.id));
                                          }}
                                        />
                                      </td>
                                      <td>
                                        <div className="p-cell">
                                          <strong className="cyan-text">{p.service}</strong>
                                          <span className="dim-text">{p.name}</span>
                                        </div>
                                      </td>
                                      <td>
                                        <span className={`status ${p.paymentStatus === 'paid' || (!p.paymentStatus && p.status === "Completed") ? 'active' : p.paymentStatus === 'part' ? 'warning' : 'pending'}`}>
                                          {p.paymentStatus === 'paid' || (!p.paymentStatus && p.status === "Completed") ? "PAID" : p.paymentStatus === 'part' ? "PART PAID" : "UNPAID"}
                                        </span>
                                      </td>
                                      <td className="bold-text">
                                        ₹{p.quote?.toLocaleString()}
                                        
                                        <div style={{display: 'flex', gap: '4px', marginTop: '6px', alignItems: 'center'}}>
                                          <span className="dim-text" style={{fontSize: '0.7rem'}}>Disc:</span>
                                          <input 
                                            type="number" 
                                            placeholder="0" 
                                            className="ignition-input"
                                            style={{ padding: '2px 4px', fontSize: '0.7rem', width: '50px' }}
                                            value={p.discountValue || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setIgnitionQueue(prev => prev.map(proj => 
                                                proj.id === p.id ? { 
                                                  ...proj, 
                                                  discountValue: val,
                                                  discountPercent: (proj.discountType === 'rs') ? ((parseFloat(val)||0) / proj.quote * 100).toFixed(2) : parseFloat(val)||0
                                                } : proj
                                              ));
                                            }}
                                          />
                                          <select 
                                            className="ignition-input"
                                            style={{ padding: '2px', fontSize: '0.7rem' }}
                                            value={p.discountType || '%'}
                                            onChange={(e) => {
                                              const newType = e.target.value;
                                              setIgnitionQueue(prev => prev.map(proj => {
                                                if (proj.id === p.id) {
                                                  let newVal = proj.discountValue || 0;
                                                  let currentPercent = parseFloat(proj.discountPercent) || 0;
                                                  if (newType === 'rs' && proj.discountType !== 'rs') {
                                                    newVal = (currentPercent / 100) * proj.quote;
                                                  } else if (newType === '%' && proj.discountType === 'rs') {
                                                    newVal = currentPercent;
                                                  }
                                                  return { 
                                                    ...proj, 
                                                    discountType: newType,
                                                    discountValue: newVal ? parseFloat(newVal).toFixed(2) : ''
                                                  };
                                                }
                                                return proj;
                                              }));
                                            }}
                                          >
                                            <option value="%">%</option>
                                            <option value="rs">₹</option>
                                          </select>
                                        </div>

                                        {p.paymentStatus === 'part' && p.advanceAmount && (
                                          <div className="dim-text" style={{fontSize: '0.75rem', marginTop: '6px', color: '#00e5ff'}}>Adv: ₹{p.advanceAmount}</div>
                                        )}
                                      </td>
                                      <td className="dim-text">{new Date(p.deadline).toLocaleDateString()}</td>
                                      <td>
                                        <div className="action-icons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                          <select 
                                            className="ignition-input"
                                            style={{ padding: '4px', fontSize: '0.75rem', width: 'auto', minWidth: '90px' }}
                                            value={p.paymentStatus || (p.status === "Completed" ? 'paid' : 'unpaid')}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              
                                              if (val === 'paid' && p.paymentStatus !== 'paid') {
                                                const adv = parseFloat(p.advanceAmount) || 0;
                                                const baseQuote = p.quote || 0;
                                                const discountPct = parseFloat(p.discountPercent) || 0;
                                                const finalQuote = baseQuote - (baseQuote * discountPct / 100);
                                                let amt = p.paymentStatus === 'part' ? (finalQuote - adv) : finalQuote;
                                                
                                                setCustomPaymentPrompt({ p, finalQuote, defaultAmt: amt, adv, paymentMode: 'UPI' });
                                                e.target.value = p.paymentStatus || 'unpaid';
                                                return;
                                              } else if (val === 'unpaid' || val === 'part') {
                                                setCashbookEntries(prev => {
                                                  const filtered = prev.filter(entry => entry.projectId !== p.id);
                                                  if (filtered.length !== prev.length) {
                                                    alert("Related payment entries removed from Cashbook.");
                                                  }
                                                  return filtered;
                                                });
                                              }

                                              setIgnitionQueue(prev => prev.map(proj => 
                                                proj.id === p.id ? { 
                                                  ...proj, 
                                                  paymentStatus: val, 
                                                  status: val === 'paid' ? "Completed" : (proj.status === "Completed" ? "Pending" : proj.status)
                                                } : proj
                                              ));
                                            }}
                                          >
                                            <option value="unpaid">Unpaid</option>
                                            <option value="part">Part Payment</option>
                                            <option value="paid">Paid</option>
                                          </select>
                                          
                                          {p.paymentStatus === 'part' && (
                                            <div style={{display: 'flex', gap: '4px'}}>
                                              <input 
                                                type="number"
                                                className="ignition-input"
                                                style={{ padding: '4px', fontSize: '0.75rem', width: '70px' }}
                                                placeholder="Adv ₹"
                                                value={p.advanceAmount || ''}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setIgnitionQueue(prev => prev.map(proj => 
                                                    proj.id === p.id ? { ...proj, advanceAmount: val } : proj
                                                  ));
                                                }}
                                              />
                                              <button 
                                                className="a-btn accept" 
                                                title="Log Advance to Cashbook" 
                                                style={{ padding: '4px' }}
                                                onClick={() => {
                                                  const adv = parseFloat(p.advanceAmount) || 0;
                                                  if (adv > 0) {
                                                    setCashbookEntries(prev => [...prev, {
                                                      id: Date.now(),
                                                      projectId: p.id,
                                                      date: new Date().toISOString().split('T')[0],
                                                      desc: `Advance: ${p.service} - ${p.name}`,
                                                      amount: adv,
                                                      type: "INCOME",
                                                      mode: "UPI",
                                                      category: "Project"
                                                    }]);
                                                    alert(`Advance of ₹${adv} logged to Cashbook!`);
                                                  }
                                                }}
                                              >💰</button>
                                            </div>
                                          )}
                                          <button 
                                            className="a-btn review" 
                                            title="Generate Invoice"
                                            onClick={() => {
                                              setInvoiceProject(p);
                                              setIsInvoicePreviewOpen(true);
                                            }}
                                          >📄</button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No records found in current ledger sweep.</td></tr>
                                );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        </>
                      )}

                      {financialTab === 'CASHBOOK' && (
                        <div className="cashbook-dashboard">
                          <div className="financial-grid">
                            <div className="fin-card total-rev">
                              <label>NET CASHFLOW</label>
                              <h2 className={cashbookMetrics.netFlow >= 0 ? "success-text" : "danger-text"}>
                                {cashbookMetrics.netFlow >= 0 ? '+' : '-'}₹{Math.abs(cashbookMetrics.netFlow).toLocaleString()}
                              </h2>
                            </div>
                            <div className="fin-card pending-due">
                              <label>TOTAL EXPENSES</label>
                              <h2>₹{cashbookMetrics.totalExpense.toLocaleString()}</h2>
                            </div>
                            <div className="fin-card target-tracker" style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', justifyContent: 'space-around' }}>
                              <div className="flow-stat">
                                <label>CASH BALANCE</label>
                                <h3 className="cyan-text">₹{cashbookMetrics.cashFlow.toLocaleString()}</h3>
                              </div>
                              <div className="flow-stat">
                                <label>UPI BALANCE</label>
                                <h3 className="orange-glow">₹{cashbookMetrics.upiFlow.toLocaleString()}</h3>
                              </div>
                            </div>
                          </div>

                          <div className="invoice-terminal">
                            <div className="terminal-header-bar">
                              <div className="t-left">
                                <h3>CASHBOOK ENTRIES</h3>
                                <p>Record of daily income and expenses for tax reporting</p>
                              </div>
                            </div>
                            <div className="crm-workspace" style={{ padding: '2rem' }}>
                              <form className="ignition-form" onSubmit={handleAddCashbookEntry} style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '8px' }}>
                                <div className="form-row">
                                  <div className="input-group">
                                    <label>Date</label>
                                    <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                                  </div>
                                  <div className="input-group">
                                    <label>Description</label>
                                    <input type="text" name="desc" placeholder="e.g., Office Supplies" required />
                                  </div>
                                  <div className="input-group">
                                    <label>Amount (₹)</label>
                                    <input type="number" name="amount" placeholder="0" required />
                                  </div>
                                </div>
                                <div className="form-row" style={{ marginTop: '1.5rem' }}>
                                  <div className="input-group">
                                    <label>Type</label>
                                    <select name="type">
                                      <option value="EXPENSE">Expense</option>
                                      <option value="INCOME">Misc Income</option>
                                    </select>
                                  </div>
                                  <div className="input-group">
                                    <label>Payment Mode</label>
                                    <select name="mode">
                                      <option value="UPI">UPI / Online</option>
                                      <option value="CASH">Cash</option>
                                    </select>
                                  </div>
                                  <div className="input-group">
                                    <label>Category</label>
                                    <select name="category">
                                      <option value="Software">Software</option>
                                      <option value="Hardware">Hardware</option>
                                      <option value="Marketing">Marketing</option>
                                      <option value="Salary">Salary/Wages</option>
                                      <option value="Rent">Rent</option>
                                      <option value="Service">Service Income</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <button type="submit" className="ignite-submit-btn" style={{ margin: 0, alignSelf: 'flex-end' }}>RECORD ENTRY</button>
                                </div>
                              </form>

                              <table className="crm-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Description / Category</th>
                                    <th>Mode</th>
                                    <th>Amount</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cashbookEntries.length > 0 ? (
                                    cashbookEntries.map(entry => (
                                      <tr key={entry.id}>
                                        <td>{entry.date}</td>
                                        <td>
                                          <div className="p-cell">
                                            <strong>{entry.desc}</strong>
                                            <span className="dim-text">{entry.category}</span>
                                          </div>
                                        </td>
                                        <td><span className="meta-badge">{entry.mode}</span></td>
                                        <td className={entry.type === 'INCOME' ? 'success-text' : 'danger-text'}>
                                          {entry.type === 'INCOME' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                                        </td>
                                        <td>
                                          <div className="action-icons">
                                            <button className="a-btn edit" onClick={() => {
                                              setSelectedCashbookEntry(entry);
                                              setIsCashbookEditModalOpen(true);
                                            }} title="Edit Entry">✎</button>
                                            <button className="a-btn delete" onClick={() => {
                                              if(window.confirm("Delete this entry?")) setCashbookEntries(prev => prev.filter(e => e.id !== entry.id));
                                            }}>🗑️</button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr><td colSpan="5" className="empty-row">LEDGER IS VOID OF ENTRIES</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {financialTab === 'INVOICES' && (
                        <div className="invoice-vault">
                          <div className="terminal-header-bar">
                            <div className="t-left">
                              <h3>INVOICE VAULT</h3>
                              <p>Secure repository for all generated tax invoices</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                              <div className="terminal-search-box" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                <span style={{ color: '#0ff', fontSize: '0.8rem', marginRight: '8px' }}>$ SEARCH_VAULT:</span>
                                <input 
                                  type="text" 
                                  placeholder="Type name..." 
                                  value={ledgerSearch}
                                  onChange={(e) => setLedgerSearch(e.target.value)}
                                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', padding: '8px 0', outline: 'none', width: '150px' }}
                                />
                              </div>
                              {selectedVaultInvoices.length > 0 && (
                                <button 
                                  className="ignite-submit-btn" 
                                  style={{ margin: 0, padding: '0.6rem 1.2rem', background: '#d32f2f', color: '#fff' }}
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete ${selectedVaultInvoices.length} selected invoices? This action cannot be undone.`)) {
                                      setInvoices(prev => prev.filter(inv => !selectedVaultInvoices.includes(inv.id)));
                                      setSelectedVaultInvoices([]);
                                    }
                                  }}
                                >
                                  DELETE SELECTED ({selectedVaultInvoices.length})
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="crm-workspace" style={{ padding: '2rem' }}>
                             <table className="crm-table">
                               <thead>
                                 <tr>
                                   <th style={{ width: '40px' }}>
                                     <input 
                                       type="checkbox" 
                                       onChange={(e) => {
                                         const filtered = invoices.filter(inv => 
                                           inv.clientName.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
                                           inv.projectService.toLowerCase().includes(ledgerSearch.toLowerCase())
                                         );
                                         if (e.target.checked) setSelectedVaultInvoices(filtered.map(inv => inv.id));
                                         else setSelectedVaultInvoices([]);
                                       }}
                                     />
                                   </th>
                                   <th>Invoice #</th>
                                   <th>Client / Project</th>
                                   <th>Issue Date</th>
                                   <th>Grand Total</th>
                                   <th>Actions</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {(() => {
                                   const filtered = invoices.filter(inv => 
                                     inv.clientName.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
                                     inv.projectService.toLowerCase().includes(ledgerSearch.toLowerCase())
                                   );
                                   
                                   return filtered.length > 0 ? (
                                     filtered.map(inv => (
                                       <tr key={inv.id} className={selectedVaultInvoices.includes(inv.id) ? 'selected-row' : ''}>
                                         <td style={{ textAlign: 'center' }}>
                                           <input 
                                             type="checkbox" 
                                             checked={selectedVaultInvoices.includes(inv.id)}
                                             onChange={(e) => {
                                               if (e.target.checked) setSelectedVaultInvoices(prev => [...prev, inv.id]);
                                               else setSelectedVaultInvoices(prev => prev.filter(id => id !== inv.id));
                                             }}
                                           />
                                         </td>
                                         <td className="cyan-text bold-text">{inv.invoiceNo}</td>
                                         <td>
                                           <div className="p-cell">
                                             <strong>{inv.clientName}</strong>
                                             <span className="dim-text">{inv.projectService}</span>
                                           </div>
                                         </td>
                                         <td className="dim-text">{inv.issueDate}</td>
                                         <td className="bold-text">₹{inv.grandTotal.toLocaleString()}</td>
                                         <td>
                                           <div className="action-icons">
                                              <button className="a-btn review" onClick={() => {
                                                setInvoiceProject({ ...inv.rawProject, invoiceNo: inv.invoiceNo });
                                                setIsInvoicePreviewOpen(true);
                                              }} title="View/Download">📄</button>
                                              <button className="a-btn delete" onClick={() => {
                                                if(window.confirm("Remove this invoice record from vault?")) {
                                                  setInvoices(prev => prev.filter(i => i.id !== inv.id));
                                                  setSelectedVaultInvoices(prev => prev.filter(id => id !== inv.id));
                                                }
                                              }} title="Remove">🗑️</button>
                                           </div>
                                         </td>
                                       </tr>
                                     ))
                                   ) : (
                                     <tr><td colSpan="6" className="empty-row">NO INVOICES MATCHING YOUR SEARCH</td></tr>
                                   );
                                 })()}
                               </tbody>
                             </table>
                          </div>
                        </div>
                      )}
                      </div>
                    )}

                    {activeAdminModule === "SETTINGS" && (
                      <div className="service-editor">
                        <div className="editor-grid">
                          {services.slice(0, 6).map(s => (
                            <div key={s.id} className="editor-item">
                              <span>{s.title}</span>
                              <button className="edit-btn">CALIBRATE</button>
                            </div>
                          ))}
                          <div className="editor-item more">
                            <span>+ 14 More Services</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floating Action Button (Ignition Trigger) - Dashboard & Projects */}
                  {(activeAdminModule === "DASHBOARD" || activeAdminModule === "PROJECTS") && (
                    <>
                      <motion.button 
                        className="ignition-fab"
                        whileHover={{ width: '260px' }}
                        onClick={() => { setPrefillData(null); setIsIgnitionModalOpen(true); }}
                      >
                        <span className="fab-icon">+</span>
                        <span className="fab-text">START NEW IGNITION</span>
                      </motion.button>

                    </>
                  )}

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
                                  {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                  ))}
                                </select>
                                {clients.length === 0 && <p className="dim-text small-hint">No clients registered yet. Please create a new one.</p>}
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
                      <div key={s.id} className="notif-card spark" onClick={() => {
                        setActiveAdminModule("INQUIRIES");
                        setIsAdminGridActive(true);
                        setIsNotificationOpen(false);
                      }}>
                        <div className="notif-icon-box cyan">✦</div>
                        <div className="notif-info">
                          <p className="notif-msg">New inquiry from <strong>{s.name}</strong></p>
                          <span className="notif-time">{s.date}</span>
                        </div>
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
                      <div key={f.id} className="notif-card flame" onClick={() => {
                        setActiveAdminModule("DASHBOARD");
                        setIsAdminGridActive(true);
                        setIsNotificationOpen(false);
                      }}>
                        <div className="notif-icon-box orange">🔥</div>
                        <div className="notif-info">
                          <p className="notif-msg">Deadline approaching for <strong>{f.name}</strong></p>
                          <span className="notif-time">Project Calibration Required within 24h</span>
                        </div>
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
        <div className="modal-overlay" style={{zIndex: 9999}}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              maxWidth: '400px', width: '90%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto',
              background: 'rgba(5, 5, 5, 0.98)', border: '1px solid rgba(255, 255, 255, 0.05)', 
              borderTop: '2px solid #00E5FF', borderRadius: '4px' 
            }}
          >
            <h2 className="modal-title" style={{color: '#00e5ff', marginTop: '0', marginBottom: '0.8rem'}}>Log Payment</h2>
            <p className="dim-text" style={{marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4'}}>
              {customPaymentPrompt.adv > 0 
                ? `Advance of ₹${customPaymentPrompt.adv} recorded. Enter remaining amount to log for ` 
                : `No advance recorded. Enter amount to log to cashbook for `}
              <strong>{customPaymentPrompt.p.service}</strong>:
              <br/><span style={{fontSize: '0.75rem'}}>(Leave as is for full remaining amount)</span>
            </p>
            
            <div className="ignition-form">
              <div className="input-group" style={{marginBottom: '1.2rem'}}>
                <label>Payment Mode</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    className="ignition-btn"
                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: customPaymentPrompt.paymentMode === 'UPI' ? 'rgba(0, 229, 255, 0.2)' : 'transparent', border: customPaymentPrompt.paymentMode === 'UPI' ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.2)', color: customPaymentPrompt.paymentMode === 'UPI' ? '#00e5ff' : '#808080' }}
                    onClick={() => setCustomPaymentPrompt({...customPaymentPrompt, paymentMode: 'UPI'})}
                  >UPI</button>
                  <button 
                    className="ignition-btn secondary"
                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', background: customPaymentPrompt.paymentMode === 'Cash' ? 'rgba(0, 229, 255, 0.2)' : 'transparent', border: customPaymentPrompt.paymentMode === 'Cash' ? '1px solid #00E5FF' : '1px solid rgba(255,255,255,0.2)', color: customPaymentPrompt.paymentMode === 'Cash' ? '#00e5ff' : '#808080' }}
                    onClick={() => setCustomPaymentPrompt({...customPaymentPrompt, paymentMode: 'Cash'})}
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

              <div style={{display: 'flex', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap'}}>
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
              
              <div className="modal-actions" style={{marginTop: '1.5rem', display: 'flex', gap: '1rem'}}>
                <button 
                  style={{flex: 1, padding: '0.8rem', background: 'transparent', color: '#808080', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold'}} 
                  onClick={() => setCustomPaymentPrompt(null)}
                >
                  CANCEL
                </button>
                <button 
                  style={{flex: 1, padding: '0.8rem', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 'bold'}} 
                  onClick={() => {
                  const inputVal = document.getElementById('custom-payment-input').value;
                  const parsed = parseFloat(inputVal);
                  const amt = (!isNaN(parsed) && parsed > 0) ? parsed : customPaymentPrompt.defaultAmt;
                  
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
                      stage: 4
                    } : proj
                  ));
                  
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
                      discount: item.discount || 0
                    }))
                  : [{ 
                      service: invoiceProject.service, 
                      quote: invoiceProject.quote, 
                      discount: invoiceProject.discount || 0 
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
                        padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        color: '#fff', position: 'relative'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 2 }}>
                           <svg viewBox="0 0 100 125" style={{ width: '44px', height: '55px', flexShrink: 0, filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.35))' }}>
                             {/* Red square background with subtle rounded corners and clean white stroke */}
                             <rect x="0" y="0" width="100" height="100" fill="#d32f2f" stroke="#ffffff" strokeWidth="5" rx="6" />
                             {/* White diamond in center */}
                             <polygon points="50,20 80,50 50,80 20,50" fill="#ffffff" />
                             {/* White bar at the bottom */}
                             <rect x="0" y="112" width="100" height="13" fill="#ffffff" rx="2" />
                           </svg>
                           <div style={{ display: 'flex', flexDirection: 'column' }}>
                             <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', fontFamily: 'Urbanist, sans-serif', letterSpacing: '1px' }}>Netra Graphics & Designing</h1>
                             <div style={{ display: 'flex', gap: '15px', fontSize: '0.65rem', opacity: 0.9, marginTop: '3px' }}>
                               <span>📞 73590 93035</span>
                               <span>📧 hiraparasavan989@gmail.com</span>
                             </div>
                           </div>
                        </div>
                        <div style={{ textAlign: 'right', zIndex: 2 }}>
                          <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '3px', fontWeight: '200' }}>TAX INVOICE</h2>
                          <p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.7, maxWidth: '200px', marginLeft: 'auto' }}>Mendarda-Sasan Road, Mendarda, 362260</p>
                        </div>
                      </div>

                      {/* BILL TO & DETAILS */}
                      <div style={{ padding: '25px 40px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '1px', fontWeight: 'bold' }}>BILL TO</label>
                          <h3 style={{ margin: '5px 0 0 0', fontSize: '1.2rem', fontWeight: '900' }}>{invoiceProject.name.toUpperCase()}</h3>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555', maxWidth: '350px' }}>AT {getClientAddress(invoiceProject.name)}</p>
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
                                  <td style={{ textAlign: 'center', fontSize: '0.9rem' }}>1</td>
                                  <td style={{ textAlign: 'right', fontSize: '0.9rem' }}>₹{parseFloat(item.quote).toLocaleString()}</td>
                                  <td style={{ textAlign: 'center', fontSize: '0.9rem', color: discountPercent > 0 ? '#2e7d32' : '#888', fontWeight: 'bold' }}>
                                    {discountPercent > 0 ? `${discountPercent}%` : '-'}
                                  </td>
                                  <td style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold' }}>₹{(parseFloat(item.quote) - (parseFloat(item.discount) || 0)).toLocaleString()}</td>
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
                                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=hiraparasavan989@okaxis&pn=Netra%20Graphics&am=${parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0)}&cu=INR`} alt="UPI QR" style={{ width: '100%', height: '100%' }} />
                               </div>
                               <div style={{ flex: 1 }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#546e7a', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                   🏠 PAYMENT INSTRUCTIONS
                                 </div>
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.65rem' }}>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>Bank Name</span><strong style={{fontSize: '0.65rem'}}>SBI</strong></div>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>Account Name</span><strong style={{fontSize: '0.65rem'}}>Netra Graphics</strong></div>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>Account Number</span><strong style={{fontSize: '0.65rem'}}>20198798116</strong></div>
                                    <div><span style={{ color: '#888', display: 'block', fontSize: '0.55rem' }}>IFSC Code</span><strong style={{fontSize: '0.65rem'}}>SBIN0060152</strong></div>
                                 </div>
                               </div>
                            </div>

                            {/* Totals Section */}
                            <div style={{ width: '38%', textAlign: 'right' }}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                 <span style={{ color: '#666' }}>SUBTOTAL</span>
                                 <span style={{ fontWeight: 'bold' }}>₹{parseFloat(invoiceProject.quote).toLocaleString()}.00</span>
                               </div>
                               {(parseFloat(invoiceProject.discount) || 0) > 0 && (
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                   <span style={{ color: '#666' }}>DISCOUNT</span>
                                   <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>-₹{parseFloat(invoiceProject.discount).toLocaleString()}.00</span>
                                 </div>
                               )}
                               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                                 <span style={{ color: '#666' }}>ADVANCE PAID</span>
                                 <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>-₹{(parseFloat(invoiceProject.advanceAmount) || 0).toLocaleString()}.00</span>
                               </div>
                               
                               <div style={{ 
                                 background: '#3f51b5', padding: '10px 15px', color: '#fff', borderRadius: '6px', 
                                 display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                               }}>
                                 <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>GRAND TOTAL</span>
                                 <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>₹{(parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0)).toLocaleString()}.00</span>
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
                               <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: '900' }}>For Netra Graphics & Designing</h4>
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
                    <div className="no-print" style={{ position: 'fixed', bottom: '30px', right: '30px', display: 'flex', gap: '15px', zIndex: 1000 }}>
                      <button 
                        className="ignite-submit-btn" 
                        style={{ margin: 0, background: '#d32f2f', color: '#fff', padding: '12px 25px', boxShadow: '0 5px 20px rgba(211,47,47,0.4)' }}
                        onClick={() => downloadMultiPageInvoicePDF(invoiceProject, stableInvoiceNo)}
                      >
                        DOWNLOAD PDF
                      </button>
                      <button 
                        className="ignite-submit-btn" 
                        style={{ margin: 0, background: '#25D366', color: '#fff', padding: '12px 25px', boxShadow: '0 5px 20px rgba(37,211,102,0.4)' }}
                        onClick={() => {
                          saveInvoiceToVault(invoiceProject, stableInvoiceNo);
                          const msg = `Namaste! Your Tax Invoice (${stableInvoiceNo}) from Netra Graphics is ready. Amount: ₹${(parseFloat(invoiceProject.quote) - (parseFloat(invoiceProject.advanceAmount) || 0) - (parseFloat(invoiceProject.discount) || 0)).toLocaleString()}. Thank you!`;
                          window.open(`https://wa.me/91${invoiceProject.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                      >
                        SEND VIA WHATSAPP
                      </button>
                      <button 
                        className="ignite-submit-btn" 
                        style={{ margin: 0, background: '#444', color: '#fff', padding: '12px 25px' }}
                        onClick={() => {
                          setIsInvoicePreviewOpen(false);
                          setInvoiceProject(null);
                          setSelectedBatchProjects([]);
                        }}
                      >
                        CLOSE PREVIEW
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
