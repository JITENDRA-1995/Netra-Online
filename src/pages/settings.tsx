import { useState, useEffect, useRef } from "react";
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
  User,
  Database,
  Download,
  Upload,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  FileText,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../supabase/client";
import { getProjects } from "../supabase/database/projects";
import { getInvoices } from "../supabase/database/invoices";
import { getClients } from "../supabase/database/clients";

interface Service {
  id: number;
  title: string;
  desc: string;
  icon: string;
  tag: string;
  price: string;
  delivery: string;
  features: string[];
  slideshow?: any[];
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
  onAddService: (newService: Service) => void;
  onDeleteService: (serviceId: number) => void;
  onUpdateService: (s: Service) => void;
  projectsList: any[];
  invoicesList: any[];
  cashbookEntries: any[];
  clients: any[];
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  setIgnitionQueue: React.Dispatch<React.SetStateAction<any[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  setCashbookEntries: React.Dispatch<React.SetStateAction<any[]>>;
  setServicesList: React.Dispatch<React.SetStateAction<Service[]>>;
  setVisionSettings: React.Dispatch<React.SetStateAction<any[]>>;
  setBankingDetails: React.Dispatch<React.SetStateAction<any>>;
  setAdminProfile: React.Dispatch<React.SetStateAction<any>>;
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


export function BackupRestorePanel({
  servicesList,
  visionSettings,
  bankingDetails,
  adminProfile,
  projectsList,
  invoicesList,
  cashbookEntries,
  clients,
  setClients,
  setIgnitionQueue,
  setInvoices,
  setCashbookEntries,
  setServicesList,
  setVisionSettings,
  setBankingDetails,
  setAdminProfile
}: SettingsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [restoreSuccessOpen, setRestoreSuccessOpen] = useState(false);
  
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    overrides: string[];
    mismatches: string[];
    info: string[];
  }>({ overrides: [], mismatches: [], info: [] });
  
  const activeRestoreCategory = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Safe Fallback Arrays to prevent render crash if props are not loaded
  const safeProjects = projectsList || [];
  const safeInvoices = invoicesList || [];
  const safeCashbook = cashbookEntries || [];
  const safeServices = servicesList || [];
  const safeVision = visionSettings || [];
  const safeClients = clients || [];

  const downloadJSON = (data: any, filename: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleBackup = async (categoryId: string) => {
    setIsProcessing(true);
    try {
      if (categoryId === "projects") {
        const data = await getProjects();
        downloadJSON({
          type: "netra_backup_projects",
          timestamp: Date.now(),
          version: "1.0",
          data
        }, `netra_projects_backup_${Date.now()}.json`);
      } else if (categoryId === "invoices") {
        const data = await getInvoices();
        downloadJSON({
          type: "netra_backup_invoices",
          timestamp: Date.now(),
          version: "1.0",
          data
        }, `netra_invoices_backup_${Date.now()}.json`);
      } else if (categoryId === "cashbook") {
        downloadJSON({
          type: "netra_backup_cashbook",
          timestamp: Date.now(),
          version: "1.0",
          data: safeCashbook
        }, `netra_cashbook_backup_${Date.now()}.json`);
      } else if (categoryId === "services") {
        downloadJSON({
          type: "netra_backup_services",
          timestamp: Date.now(),
          version: "1.0",
          data: safeServices
        }, `netra_services_backup_${Date.now()}.json`);
      } else if (categoryId === "vision") {
        downloadJSON({
          type: "netra_backup_vision",
          timestamp: Date.now(),
          version: "1.0",
          data: safeVision
        }, `netra_vision_backup_${Date.now()}.json`);
      } else if (categoryId === "profile") {
        downloadJSON({
          type: "netra_backup_profile",
          timestamp: Date.now(),
          version: "1.0",
          data: adminProfile
        }, `netra_profile_backup_${Date.now()}.json`);
      } else if (categoryId === "banking") {
        downloadJSON({
          type: "netra_backup_banking",
          timestamp: Date.now(),
          version: "1.0",
          data: bankingDetails
        }, `netra_banking_backup_${Date.now()}.json`);
      }
    } catch (err) {
      console.error(err);
      alert(`Backup failed for ${categoryId}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerRestore = (categoryId: string) => {
    activeRestoreCategory.current = categoryId;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const category = activeRestoreCategory.current;
        if (!category) return;

        const expectedType = categories.find(c => c.id === category)?.backupType;
        if (parsed.type !== expectedType) {
          alert(`Type Mismatch: Expected backup file of type "${expectedType}", but found "${parsed.type}".`);
          return;
        }

        if (!parsed.data) {
          alert("Invalid backup file: Missing 'data' field.");
          return;
        }

        const overrides: string[] = [];
        const mismatches: string[] = [];
        const info: string[] = [];

        if (category === "projects") {
          if (!Array.isArray(parsed.data)) {
            alert("Invalid projects backup: data is not an array.");
            return;
          }
          parsed.data.forEach((proj: any) => {
            const exists = safeProjects.find(p => p.id === proj.id);
            if (exists) {
              overrides.push(`Project "${proj.name}" (ID: ${proj.id}) already exists and will be overwritten.`);
            }
            if (proj.client) {
              const clientExists = safeClients.some(c => c.id === proj.client.id || c.email === proj.client.email);
              if (!clientExists) {
                mismatches.push(`Client "${proj.client.name}" is missing in the system and will be automatically re-created.`);
              }
            }
          });
        } else if (category === "invoices") {
          if (!Array.isArray(parsed.data)) {
            alert("Invalid invoices backup: data is not an array.");
            return;
          }
          parsed.data.forEach((inv: any) => {
            const exists = safeInvoices.find(i => i.id === inv.id || i.invoiceNo === inv.invoiceNo);
            if (exists) {
              overrides.push(`Invoice #${inv.invoiceNo} (ID: ${inv.id}) already exists and will be overwritten.`);
            }
            const projId = inv.projectId || inv.project_id || inv.rawProject?.id;
            const projExists = safeProjects.some(p => p.id === projId);
            if (projId && !projExists) {
              mismatches.push(`Invoice #${inv.invoiceNo} references missing Project ID ${projId}. Restoring will create an orphaned invoice.`);
            }
          });
        } else if (category === "cashbook") {
          if (!Array.isArray(parsed.data)) {
            alert("Invalid cashbook backup: data is not an array.");
            return;
          }
          parsed.data.forEach((entry: any) => {
            const exists = safeCashbook.find(e => e.id === entry.id);
            if (exists) {
              overrides.push(`Cashbook entry "${entry.description || 'Entry'}" (Amount: ${entry.amount}) will overwrite an existing record.`);
            }
            if (entry.projectId) {
              const projExists = safeProjects.some(p => p.id === entry.projectId);
              if (!projExists) {
                mismatches.push(`Cashbook record "${entry.description}" references missing Project ID ${entry.projectId}.`);
              }
            }
          });
        } else if (category === "services") {
          if (!Array.isArray(parsed.data)) {
            alert("Invalid services backup: data is not an array.");
            return;
          }
          info.push(`This will completely replace your current service catalog (${safeServices.length} services) with ${parsed.data.length} services from the backup.`);
        } else if (category === "vision") {
          if (!Array.isArray(parsed.data)) {
            alert("Invalid vision backup: data is not an array.");
            return;
          }
          info.push("This will completely overwrite your Vision slideshow and slot settings.");
          parsed.data.forEach((slot: any, idx: number) => {
            if (slot.serviceId && slot.serviceId !== 0) {
              const serviceExists = safeServices.some(s => s.id === slot.serviceId);
              if (!serviceExists) {
                mismatches.push(`Vision Slot ${idx + 1} references service ID ${slot.serviceId} which does not exist in the active catalog.`);
              }
            }
          });
        } else if (category === "profile") {
          info.push(`This will overwrite your profile with: "${parsed.data.businessName || parsed.data.business_name || 'N/A'}"`);
        } else if (category === "banking") {
          info.push(`This will overwrite your banking settings with: "${parsed.data.bankName || parsed.data.bank_name || 'N/A'}"`);
        }

        setUploadedData(parsed);
        setAnalysisResult({ overrides, mismatches, info });
        setRestoreConfirmOpen(true);
      } catch (err) {
        alert("Failed to parse JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const executeRestore = async () => {
    if (!uploadedData || !activeRestoreCategory.current) return;
    setIsProcessing(true);
    try {
      const category = activeRestoreCategory.current;
      if (category === "projects") {
        for (const proj of uploadedData.data) {
          if (proj.client) {
            const clientExists = safeClients.some(c => c.id === proj.client.id || c.email === proj.client.email);
            if (!clientExists) {
              await supabase.from('clients').upsert({
                id: proj.client.id,
                name: proj.client.name,
                email: proj.client.email || 'recovered@netra.graphics',
                phone: proj.client.phone || 'N/A',
                address: proj.client.address || '',
                status: 'Active'
              });
            }
          }

          const serializedDesc = `JSON_METADATA:${JSON.stringify({
            qty: proj.qty || 1,
            rate: proj.rate || (proj.quote / (proj.qty || 1)),
            description: proj.description || ''
          })}`;

          const { error: pErr } = await supabase.from('projects').upsert({
            id: proj.id,
            name: proj.name,
            service: proj.service,
            stage: proj.stage,
            status: proj.status,
            quote: proj.quote,
            discount: proj.discount,
            discount_value: proj.discountValue || proj.discount_value,
            discount_type: proj.discountType || proj.discount_type,
            advance_amount: proj.advanceAmount || proj.advance_amount,
            payment_status: proj.paymentStatus || proj.payment_status,
            deadline: proj.deadline,
            client_id: proj.client?.id || proj.client_id,
            description: serializedDesc,
            category: proj.category || 'branding',
            progress: proj.progress || 0,
            created_at: proj.createdAt ? new Date(proj.createdAt).toISOString() : new Date().toISOString()
          });
          if (pErr) throw pErr;

          await supabase.from('project_milestones').delete().eq('project_id', proj.id);
          await supabase.from('project_activity_logs').delete().eq('project_id', proj.id);
          await supabase.from('project_chats').delete().eq('project_id', proj.id);
          await supabase.from('project_media').delete().eq('project_id', proj.id);

          if (proj.milestones && proj.milestones.length > 0) {
            await supabase.from('project_milestones').insert(proj.milestones.map((m: any, idx: number) => ({
              project_id: proj.id,
              name: m.name,
              completed: m.completed || false,
              position: idx
            })));
          }
          if (proj.activityLog && proj.activityLog.length > 0) {
            await supabase.from('project_activity_logs').insert(proj.activityLog.map((l: any) => ({
              project_id: proj.id,
              action: l.action,
              created_at: l.time ? new Date().toISOString() : undefined
            })));
          }
          if (proj.collaborationStream && proj.collaborationStream.length > 0) {
            await supabase.from('project_chats').insert(proj.collaborationStream.map((c: any) => ({
              project_id: proj.id,
              sender: c.sender,
              message: c.text,
              created_at: c.time ? new Date().toISOString() : undefined
            })));
          }
          if (proj.mediaVault && proj.mediaVault.length > 0) {
            await supabase.from('project_media').insert(proj.mediaVault.map((m: any) => ({
              id: m.id,
              project_id: proj.id,
              file_name: m.name,
              file_url: m.url,
              file_type: m.type
            })));
          }
        }

        const refreshedP = await getProjects();
        setIgnitionQueue(refreshedP);
        const refreshedC = await getClients();
        setClients(refreshedC.map(c => ({
          ...c,
          joinedDate: c.joined_date || c.joinedDate,
          accessKey: c.access_key || c.accessKey
        })));

      } else if (category === "invoices") {
        for (const inv of uploadedData.data) {
          const { error: iErr } = await supabase.from('invoices').upsert({
            id: inv.id,
            invoice_no: inv.invoiceNo || inv.invoice_no,
            project_id: inv.projectId || inv.project_id || inv.rawProject?.id,
            client_name: inv.clientName || inv.client_name,
            project_service: inv.projectService || inv.project_service,
            issue_date: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            grand_total: inv.grandTotal || inv.grand_total,
            created_at: inv.createdAt || undefined
          });
          if (iErr) throw iErr;
        }
        const refreshedI = await getInvoices();
        setInvoices(refreshedI);

      } else if (category === "cashbook") {
        setCashbookEntries(uploadedData.data);
        localStorage.setItem('netra_cashbook', JSON.stringify(uploadedData.data));

      } else if (category === "services") {
        setServicesList(uploadedData.data);
        localStorage.setItem('netra_services', JSON.stringify(uploadedData.data));
        const payload = {
          address: JSON.stringify({ services: uploadedData.data, vision: safeVision, banking: bankingDetails, profile: adminProfile })
        };
        await supabase.from('clients').update(payload).eq('email', 'settings@netra.graphics');

      } else if (category === "vision") {
        setVisionSettings(uploadedData.data);
        localStorage.setItem('netra_vision_settings', JSON.stringify(uploadedData.data));
        const payload = {
          address: JSON.stringify({ services: safeServices, vision: uploadedData.data, banking: bankingDetails, profile: adminProfile })
        };
        await supabase.from('clients').update(payload).eq('email', 'settings@netra.graphics');

      } else if (category === "profile") {
        setAdminProfile(uploadedData.data);
        localStorage.setItem('netra_admin_profile', JSON.stringify(uploadedData.data));
        const payload = {
          address: JSON.stringify({ services: safeServices, vision: safeVision, banking: bankingDetails, profile: uploadedData.data })
        };
        await supabase.from('clients').update(payload).eq('email', 'settings@netra.graphics');

      } else if (category === "banking") {
        setBankingDetails(uploadedData.data);
        localStorage.setItem('netra_banking_details', JSON.stringify(uploadedData.data));
        const payload = {
          address: JSON.stringify({ services: safeServices, vision: safeVision, banking: uploadedData.data, profile: adminProfile })
        };
        await supabase.from('clients').update(payload).eq('email', 'settings@netra.graphics');
      }

      setRestoreConfirmOpen(false);
      setRestoreSuccessOpen(true);
    } catch (err: any) {
      console.error(err);
      alert(`Restore failed: ${err.message || 'Unknown database error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const categories = [
    {
      id: "projects",
      name: "Projects Database",
      desc: "Backup all project details, milestones, activity logs, collaboration stream chats, and registered media files.",
      countLabel: () => `${safeProjects.length} Projects`,
      backupType: "netra_backup_projects",
      icon: <Database className="w-5 h-5 text-indigo-400" />
    },
    {
      id: "invoices",
      name: "Invoices Ledger",
      desc: "Backup all saved invoices and billing statements from the database vault.",
      countLabel: () => `${safeInvoices.length} Invoices`,
      backupType: "netra_backup_invoices",
      icon: <FileText className="w-5 h-5 text-cyan-400" />
    },
    {
      id: "cashbook",
      name: "Financial State (Cashbook)",
      desc: "Backup local cashbook ledger records, payments, and financial targets.",
      countLabel: () => `${safeCashbook.length} Records`,
      backupType: "netra_backup_cashbook",
      icon: <Coins className="w-5 h-5 text-emerald-400" />
    },
    {
      id: "services",
      name: "Service Pricing Catalog",
      desc: "Backup all active service catalog listings, tags, descriptions, and feature lists.",
      countLabel: () => `${safeServices.length} Services`,
      backupType: "netra_backup_services",
      icon: <Tag className="w-5 h-5 text-purple-400" />
    },
    {
      id: "vision",
      name: "Vision Tab Calibration",
      desc: "Backup the slideshow, slot bindings, and visual coordinates for the public studio vision showcase.",
      countLabel: () => `${safeVision.filter((v: any) => v.photos && v.photos.length > 0).length} Active Slots`,
      backupType: "netra_backup_vision",
      icon: <Eye className="w-5 h-5 text-pink-400" />
    },
    {
      id: "profile",
      name: "Admin Profile Settings",
      desc: "Backup official studio credentials, GST codes, email addresses, and contact details.",
      countLabel: () => adminProfile?.businessName ? "Configured" : "Default Settings",
      backupType: "netra_backup_profile",
      icon: <User className="w-5 h-5 text-blue-400" />
    },
    {
      id: "banking",
      name: "Banking & Payments",
      desc: "Backup official banking details, account numbers, IFSC codes, and custom UPI ID bindings.",
      countLabel: () => bankingDetails?.bankName ? "Configured" : "Default Settings",
      backupType: "netra_backup_banking",
      icon: <Sliders className="w-5 h-5 text-teal-400" />
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Intro Panel */}
      <motion.div
        variants={itemVariants}
        className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2 text-left">
            <Database className="w-5 h-5" />
            Standalone Backup & Restore Hub
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-2xl text-left">
            Manage off-site backups and restore parameters for individual application layers. Each backup is generated as a secure, structured JSON file. Restores are verified by a diagnostics system before execution.
          </p>
        </div>
      </motion.div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch text-left">
        {categories.map((cat) => (
          <motion.div
            key={cat.id}
            variants={itemVariants}
            className="rounded-2xl border border-white/5 bg-[#08080f]/80 backdrop-blur-sm p-6 flex flex-col justify-between hover:border-white/10 transition-all duration-300"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <h3 className="font-bold text-sm text-white">{cat.name}</h3>
                </div>
                <Badge className="bg-white/5 border-white/10 text-white font-mono text-[9px] px-2 py-0.5 select-none">
                  {cat.countLabel()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed min-h-[50px]">
                {cat.desc}
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => handleBackup(cat.id)}
                disabled={isProcessing}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-2xs rounded-xl py-2 flex items-center justify-center gap-1.5 cursor-pointer select-none"
              >
                <Download className="w-3 h-3" />
                BACKUP
              </Button>
              <Button
                onClick={() => triggerRestore(cat.id)}
                disabled={isProcessing}
                className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-2xs rounded-xl py-2 flex items-center justify-center gap-1.5 cursor-pointer select-none"
              >
                <Upload className="w-3 h-3" />
                RESTORE
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
      />

      {/* Validation Modal */}
      <AnimatePresence>
        {restoreConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-modal-overlay"
            style={{ zIndex: 100006 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="cyber-modal-card max-w-lg w-full bg-[#060a12]/95 border border-white/10 text-left p-6 space-y-6"
            >
              <div className="cyber-scanner-line" />
              
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="font-mono font-black text-base text-white uppercase tracking-wider">
                    RESTORE DIAGNOSTIC REPORT
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">
                    Analyzing import payload integrity
                  </p>
                </div>
              </div>

              {/* Status Report Section */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {/* Info Block */}
                {analysisResult.info.map((info, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 leading-relaxed font-sans">
                    ℹ️ {info}
                  </div>
                ))}

                {/* Overrides Block */}
                {analysisResult.overrides.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                    <div className="text-2xs font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      RECORD OVERRIDES DETECTED ({analysisResult.overrides.length})
                    </div>
                    <ul className="list-disc pl-4 text-3xs text-amber-300/80 space-y-1 font-mono leading-relaxed">
                      {analysisResult.overrides.map((ov, i) => <li key={i}>{ov}</li>)}
                    </ul>
                  </div>
                )}

                {/* Mismatches Block */}
                {analysisResult.mismatches.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2">
                    <div className="text-2xs font-mono font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      INTEGRITY WARNINGS DETECTED ({analysisResult.mismatches.length})
                    </div>
                    <ul className="list-disc pl-4 text-3xs text-red-300/80 space-y-1 font-mono leading-relaxed">
                      {analysisResult.mismatches.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}

                {analysisResult.overrides.length === 0 && analysisResult.mismatches.length === 0 && analysisResult.info.length === 0 && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400 font-bold text-center">
                    ✓ Clean Import: No conflicts or data integrity warnings detected.
                  </div>
                )}
              </div>

              {/* Warnings and confirmation prompt */}
              <div className="border-t border-white/5 pt-4 text-left space-y-2 font-mono text-[9px] text-white/40">
                <p className="text-[10px] text-red-400/90 font-extrabold uppercase animate-pulse">
                  ⚠️ WARNING: Restoring will overwrite target active configurations. This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                <Button
                  onClick={() => setRestoreConfirmOpen(false)}
                  disabled={isProcessing}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl px-4 py-2 select-none cursor-pointer"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={executeRestore}
                  disabled={isProcessing}
                  className="bg-amber-500 text-black hover:bg-amber-600 font-extrabold text-xs rounded-xl px-5 py-2 flex items-center gap-2 select-none cursor-pointer"
                >
                  {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {isProcessing ? "RESTORING..." : "CONFIRM RESTORE"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {restoreSuccessOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-modal-overlay"
            style={{ zIndex: 100006 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="cyber-modal-card max-w-sm text-center p-6 success-card"
            >
              <div className="cyber-scanner-line" />
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse" />
                  <div className="w-16 h-16 rounded-full border border-cyan-500 bg-[#00d4ff]/10 flex items-center justify-center text-cyan-400 relative z-10 shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                    <ShieldCheck className="w-10 h-10 text-cyan-400" />
                  </div>
                </div>
              </div>

              <h3 className="text-center font-black text-lg text-cyan-400 tracking-[3px] uppercase font-mono mb-2">
                RESTORE COMPLETE
              </h3>
              <p className="text-center text-2xs text-muted-foreground font-mono leading-relaxed max-w-sm mb-6 uppercase tracking-wider">
                System details successfully restored and global caches synced across all network nodes.
              </p>
              
              <Button
                onClick={() => setRestoreSuccessOpen(false)}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-bold text-xs rounded-xl py-3 cursor-pointer select-none"
              >
                DISMISS
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SettingsPage({
  servicesList,
  onOpenCalibrate,
  visionSettings,
  onSaveVisionSettings,
  onClearAllDemoData,
  bankingDetails,
  onSaveBankingDetails,
  adminProfile,
  onSaveAdminProfile,
  onAddService,
  onDeleteService,
  onUpdateService,
  projectsList,
  invoicesList,
  cashbookEntries,
  clients,
  setClients,
  setIgnitionQueue,
  setInvoices,
  setCashbookEntries,
  setServicesList,
  setVisionSettings,
  setBankingDetails,
  setAdminProfile
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
  const [profileInstagram, setProfileInstagram] = useState(adminProfile?.instagram || "");
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
      setProfileInstagram(adminProfile.instagram || "");
    }
  }, [adminProfile]);

  // Service Work Slideshow state
  const [calibratingServiceSlideshow, setCalibratingServiceSlideshow] = useState<Service | null>(null);
  const [newServiceSlideUrl, setNewServiceSlideUrl] = useState("");
  const [newServiceSlideTitle, setNewServiceSlideTitle] = useState("");
  const [newServiceSlideDuration, setNewServiceSlideDuration] = useState("");

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
        gst: profileGst,
        instagram: profileInstagram
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
      alert("Direct storage upload failed. Please verify your connection or bucket status.");
    } finally {
      setUploadStatus(prev => ({ ...prev, isUploading: false }));
    }
  };

  const handleLocalServiceMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !calibratingServiceSlideshow) return;

    setUploadStatus({
      isUploading: true,
      progress: 0,
      fileName: file.name,
      phase: "ESTABLISHING SECURE PORTAL CONNECTION..."
    });

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
      const filePath = `services/service_${calibratingServiceSlideshow.id}_${Date.now()}.${fileExt}`;

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

      await new Promise(resolve => setTimeout(resolve, 800));

      setNewServiceSlideUrl(publicUrl);
      const filename = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setNewServiceSlideTitle(filename);

    } catch (err) {
      console.error("Direct storage upload failed:", err);
      clearInterval(progressInterval);
      alert("Direct storage upload failed. Please verify your connection or bucket status.");
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

  // States for dynamic service addition
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newIcon, setNewIcon] = useState("⚡");
  const [newTag, setNewTag] = useState("BRANDING");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDelivery, setNewDelivery] = useState("");
  const [newFeatures, setNewFeatures] = useState<string[]>([""]);

  const handleAddFeatureField = () => {
    setNewFeatures([...newFeatures, ""]);
  };

  const handleRemoveFeatureField = (idx: number) => {
    setNewFeatures(newFeatures.filter((_, i) => i !== idx));
  };

  const handleFeatureFieldChange = (idx: number, val: string) => {
    const next = [...newFeatures];
    next[idx] = val;
    setNewFeatures(next);
  };

  const handleSaveNewService = () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      alert("Please enter both Title and Description.");
      return;
    }
    const filteredFeatures = newFeatures.map(f => f.trim()).filter(Boolean);
    const servicePayload: Service = {
      id: Date.now(), // Unique ID
      title: newTitle.trim(),
      desc: newDesc.trim(),
      icon: newIcon.trim() || "⚡",
      tag: newTag,
      price: newPrice.trim() || "On Quote",
      delivery: newDelivery.trim() || "Varies",
      features: filteredFeatures
    };
    onAddService(servicePayload);
    
    // Reset form fields
    setNewTitle("");
    setNewIcon("⚡");
    setNewTag("BRANDING");
    setNewDesc("");
    setNewPrice("");
    setNewDelivery("");
    setNewFeatures([""]);
    setIsAddServiceModalOpen(false);
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
    const { slotIdx, serviceId, url, title, durationStr } = activePreviewSlide;

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

    if (serviceId !== undefined) {
      const duration = durationStr ? parseFloat(durationStr) : undefined;
      const newSlide = {
        url,
        title: title || "Work Showcase",
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
      };

      if (calibratingServiceSlideshow) {
        const updatedSlides = [...(calibratingServiceSlideshow.slideshow || [])];
        updatedSlides.push(newSlide);
        setCalibratingServiceSlideshow({
          ...calibratingServiceSlideshow,
          slideshow: updatedSlides
        });
      }

      setNewServiceSlideUrl("");
      setNewServiceSlideTitle("");
      setNewServiceSlideDuration("");
      setAddingSlideStatus(prev => ({ ...prev, isAdding: false }));
      return;
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
        className="flex p-1 bg-white/[0.02] border border-white/5 rounded-2xl gap-2 w-full overflow-x-auto scrollbar-none mb-8 shadow-inner shrink-0 flex-nowrap"
      >
        <button
          onClick={() => setActiveTab("CATALOG")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 shrink-0 ${
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
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 shrink-0 ${
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
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 shrink-0 ${
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
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "PROFILE" 
              ? "bg-indigo-500 text-white font-black shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/20 scale-[0.98]" 
              : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03] hover:scale-[1.02]"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Admin Profile Settings
        </button>
        <button
          onClick={() => setActiveTab("BACKUP")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 outline-none select-none cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "BACKUP" 
              ? "bg-indigo-500 text-white font-black shadow-[0_0_15px_rgba(99,102,241,0.35)] border border-indigo-400/20 scale-[0.98]" 
              : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.03] hover:scale-[1.02]"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Backup & Restore
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

            <Button
              onClick={() => setIsAddServiceModalOpen(true)}
              className="bg-[#00e5ff]/20 hover:bg-[#00e5ff]/35 border border-[#00e5ff]/30 text-[#00e5ff] font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all duration-300 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              ADD NEW SERVICE
            </Button>
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

                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => onOpenCalibrate(s)}
                            className="flex-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs rounded-xl py-2 select-none"
                          >
                            <Sliders className="w-3.5 h-3.5 mr-2" />
                            CALIBRATE SERVICE
                          </Button>
                          <Button
                            onClick={() => {
                              if (window.confirm(`Are you absolutely sure you want to delete "${s.title}"? This will also clear any slideshow slots bound to it.`)) {
                                onDeleteService(s.id);
                              }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs rounded-xl p-2 cursor-pointer flex items-center justify-center shrink-0 select-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          onClick={() => {
                            setCalibratingServiceSlideshow({ ...s, slideshow: s.slideshow ? [...s.slideshow] : [] });
                            setNewServiceSlideUrl("");
                            setNewServiceSlideTitle("");
                            setNewServiceSlideDuration("");
                          }}
                          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-xs rounded-xl py-2 flex items-center justify-center gap-1.5 select-none"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          CALIBRATE WORK SLIDESHOW
                        </Button>
                      </div>
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

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Instagram Username (Optional)</label>
                  <Input 
                    value={profileInstagram}
                    onChange={e => setProfileInstagram(e.target.value)}
                    placeholder="e.g. hiraparasavanphotographer"
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
                    {profileInstagram && (
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400">📸</span>
                        <span className="truncate max-w-[260px]">@{profileInstagram}</span>
                      </div>
                    )}
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

      {activeTab === "BACKUP" && (
        <BackupRestorePanel
          servicesList={servicesList}
          visionSettings={visionSettings}
          bankingDetails={bankingDetails}
          adminProfile={adminProfile}
          projectsList={projectsList}
          invoicesList={invoicesList}
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
          onOpenCalibrate={onOpenCalibrate}
          onSaveVisionSettings={onSaveVisionSettings}
          onClearAllDemoData={onClearAllDemoData}
          onSaveBankingDetails={onSaveBankingDetails}
          onSaveAdminProfile={onSaveAdminProfile}
          onAddService={onAddService}
          onDeleteService={onDeleteService}
          onUpdateService={onUpdateService}
        />
      )}

      {/* Cyber Upload Progress Dialogue */}
      <AnimatePresence>
        {uploadStatus.isUploading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cyber-modal-overlay"
            style={{ zIndex: 100005 }}
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
            style={{ zIndex: 100006 }}
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
            style={{ zIndex: 100001 }}
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

      {/* Add New Service Modal Overlay */}
      <AnimatePresence>
        {isAddServiceModalOpen && (
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
              className="w-full max-w-[600px] bg-gradient-to-br from-[#080c1c]/95 to-[#04060f]/98 border border-cyan-500/25 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,229,255,0.15)] relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="cyber-scanner-line" />
              
              <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2 text-left">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-widest">
                    Add New Service Card
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="text-xs font-mono text-cyan-500/60 hover:text-cyan-400 uppercase cursor-pointer bg-transparent border-0 outline-none"
                >
                  [Close]
                </button>
              </div>

              <div className="space-y-4 text-left">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Service Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Brand Identity (Logo)"
                    className="bg-black/40 border-white/10 text-xs rounded-lg py-2 px-3 text-white placeholder:text-white/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category Tag */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block font-semibold">Category Tag</label>
                    <select
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-lg py-2 px-3 text-xs font-semibold text-white outline-none focus:border-indigo-400 transition-colors"
                    >
                      {["BRANDING", "PRINT", "DIGITAL", "VIDEO", "EVENT", "COMMERCIAL"].map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>

                  {/* Icon Emoji */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Icon Emoji</label>
                    <Input
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      placeholder="e.g., 🎨 or 🏢"
                      className="bg-black/40 border-white/10 text-xs rounded-lg py-2 px-3 text-white placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Starting Price */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Starting Price Calibration</label>
                    <Input
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="e.g., ₹5,000 or On Quote"
                      className="bg-black/40 border-white/10 text-xs rounded-lg py-2 px-3 text-white placeholder:text-white/20"
                    />
                  </div>

                  {/* Delivery Timeline */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Delivery Timeline</label>
                    <Input
                      value={newDelivery}
                      onChange={(e) => setNewDelivery(e.target.value)}
                      placeholder="e.g., 3 Days or Varies"
                      className="bg-black/40 border-white/10 text-xs rounded-lg py-2 px-3 text-white placeholder:text-white/20"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide a clear, high-impact description of the service..."
                    className="w-full bg-[#050508]/60 border border-white/10 rounded-lg py-2 px-3 text-xs font-semibold text-white outline-none focus:border-indigo-400 transition-colors h-20 resize-none placeholder:text-white/20"
                  />
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Service Features</label>
                    <button
                      type="button"
                      onClick={handleAddFeatureField}
                      className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 uppercase cursor-pointer bg-transparent border-0 p-0 outline-none"
                    >
                      + Add Feature
                    </button>
                  </div>

                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-indigo-500/20">
                    {newFeatures.map((feat, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={feat}
                          onChange={(e) => handleFeatureFieldChange(idx, e.target.value)}
                          placeholder={`Feature #${idx + 1}`}
                          className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white placeholder:text-white/20 flex-1"
                        />
                        {newFeatures.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeatureField(idx)}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-white/5 pt-4 mt-6">
                  <Button
                    onClick={() => setIsAddServiceModalOpen(false)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl py-2.5 transition-all select-none"
                  >
                    DISCARD
                  </Button>
                  <Button
                    onClick={handleSaveNewService}
                    className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/30 text-cyan-400 font-bold text-xs rounded-xl py-2.5 hover:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all select-none"
                  >
                    SAVE NEW CARD
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
            style={{ zIndex: 100005 }}
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

      {/* Service Slideshow Calibration Modal */}
      <AnimatePresence>
        {calibratingServiceSlideshow && (
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
              className="w-full max-w-[850px] bg-[#070913] border border-cyan-500/25 rounded-2xl p-6 shadow-[0_0_35px_rgba(0,229,255,0.15)] relative overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cyber-scanner-line" />

              {/* Left Column: Configured Slides List */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-left">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-cyan-400">
                    {calibratingServiceSlideshow.title} Slideshow
                  </h3>
                  <Badge className="text-3xs bg-cyan-500/10 text-cyan-400 border-0">
                    {(calibratingServiceSlideshow.slideshow || []).length} Slides
                  </Badge>
                </div>

                <div className="flex-1 max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-indigo-500/20 text-left">
                  {(calibratingServiceSlideshow.slideshow || []).length > 0 ? (
                    (calibratingServiceSlideshow.slideshow || []).map((slide, sIdx) => {
                      const isVid = slide.url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || slide.url.includes("video") || slide.url.startsWith("data:video/");
                      return (
                        <div key={sIdx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            {isVid ? (
                              <video src={slide.url} className="w-12 h-10 object-cover rounded-lg border border-white/10" muted />
                            ) : (
                              <img src={slide.url} alt={slide.title} className="w-12 h-10 object-cover rounded-lg border border-white/10" />
                            )}
                            <div>
                              <div className="text-xs font-semibold text-white/90 line-clamp-1 flex items-center gap-1.5">
                                {slide.title}
                                {slide.duration !== undefined && slide.duration > 0 && (
                                  <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.25 rounded-md font-bold">
                                    {slide.duration}s
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] font-mono text-muted-foreground/60 line-clamp-1 max-w-[200px]">
                                {slide.url.startsWith("data:") ? "[Local Media File]" : slide.url}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const updatedSlides = [...(calibratingServiceSlideshow.slideshow || [])];
                              updatedSlides.splice(sIdx, 1);
                              setCalibratingServiceSlideshow({
                                ...calibratingServiceSlideshow,
                                slideshow: updatedSlides
                              });
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-[200px] border border-white/5 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground/30 text-2xs uppercase tracking-widest font-mono">
                      <span>No photos added yet</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 border-t border-white/5 pt-4">
                  <Button
                    onClick={() => setCalibratingServiceSlideshow(null)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl py-2.5 transition-all select-none"
                  >
                    DISCARD CHANGES
                  </Button>
                  <Button
                    onClick={() => {
                      onUpdateService(calibratingServiceSlideshow);
                      setCalibratingServiceSlideshow(null);
                    }}
                    className="flex-1 bg-[#00e5ff]/25 hover:bg-[#00e5ff]/35 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs rounded-xl py-2.5 hover:shadow-[0_0_15px_rgba(0,229,255,0.25)] transition-all select-none cursor-pointer"
                  >
                    SAVE WORK SLIDESHOW
                  </Button>
                </div>
              </div>

              {/* Right Column: Add Slide Form */}
              <div className="w-full md:w-[320px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-6 text-left">
                <div className="space-y-4">
                  <h3 className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    + Add portfolio Media
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Media URL</label>
                        <div className="flex items-center gap-3">
                          {newServiceSlideUrl && (
                            <button
                              onClick={() => {
                                setNewServiceSlideUrl("");
                                setNewServiceSlideTitle("");
                              }}
                              className="text-[9px] font-mono text-red-400 hover:text-red-300 uppercase cursor-pointer flex items-center gap-1 hover:underline bg-transparent border-0 p-0 outline-none"
                            >
                              🗑️ Clear
                            </button>
                          )}
                          <label
                            htmlFor="service-local-file"
                            className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 uppercase cursor-pointer flex items-center gap-1 hover:underline"
                          >
                            📁 Choose Local File
                          </label>
                        </div>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          id="service-local-file"
                          onChange={handleLocalServiceMediaUpload}
                          className="hidden"
                        />
                      </div>
                      <Input
                        value={newServiceSlideUrl.startsWith("data:") ? "[Local Media Selected]" : newServiceSlideUrl}
                        disabled={newServiceSlideUrl.startsWith("data:")}
                        onChange={(e) => setNewServiceSlideUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... or choose local file"
                        className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white placeholder:text-white/20 disabled:opacity-85"
                      />
                    </div>

                    {newServiceSlideUrl && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                        {newServiceSlideUrl.startsWith("data:video/") || 
                         newServiceSlideUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) || 
                         newServiceSlideUrl.includes("video") ? (
                          <video src={newServiceSlideUrl} className="w-12 h-10 object-cover rounded-lg border border-indigo-500/30" muted />
                        ) : (
                          <img src={newServiceSlideUrl} alt="local preview" className="w-12 h-10 object-cover rounded-lg border border-indigo-500/30" />
                        )}
                        <div className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                          Local Media Selected ✓
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Slide Title Overlay</label>
                      <Input
                        value={newServiceSlideTitle}
                        onChange={(e) => setNewServiceSlideTitle(e.target.value)}
                        placeholder="e.g., Brand Strategy Workshop"
                        className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white placeholder:text-white/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">Running Duration (seconds)</label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={newServiceSlideDuration}
                        onChange={(e) => setNewServiceSlideDuration(e.target.value)}
                        placeholder="e.g., 5 (Blank for default)"
                        className="bg-black/40 border-white/10 text-xs rounded-lg py-1 px-3 text-white placeholder:text-white/20"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        const url = newServiceSlideUrl.trim();
                        if (!url) return;
                        // Open the visual calibration preview modal!
                        setActivePreviewSlide({
                          serviceId: calibratingServiceSlideshow.id, // Marker that we are calibrating a service slide!
                          url,
                          title: newServiceSlideTitle.trim() || "Work Showcase",
                          durationStr: newServiceSlideDuration.trim()
                        });
                        // Reset visual parameters to defaults
                        setSlideFit('cover');
                        setSlideScale(1);
                        setSlidePositionX(0);
                        setSlidePositionY(0);
                        setSlideBrightness(100);
                        setSlideContrast(100);
                        setSlideSaturation(100);
                        setSlideGrayscale(0);
                        setSlideHueRotate(0);
                      }}
                      className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-bold text-xs rounded-lg py-2 mt-2 select-none"
                    >
                      <Plus className="w-3.5 h-3.5 mr-2" />
                      ADD SLIDE TO SHOWCASE
                    </Button>
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
