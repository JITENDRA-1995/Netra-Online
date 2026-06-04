import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Calendar,
  CheckCircle2,
  X,
  Printer,
  ChevronRight,
  User,
  MapPin,
  Mail,
  Phone,
  Percent,
  Coins,
  ShieldCheck,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { saveInvoice } from "@/supabase/database";

interface InvoicesPageProps {
  invoices: any[];
  setInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  clients: any[];
  cashbookEntries: any[];
  setCashbookEntries: React.Dispatch<React.SetStateAction<any[]>>;
  setIsInvoicePreviewOpen: (b: boolean) => void;
  setInvoiceProject: (p: any) => void;
  selectedVaultInvoices: any[];
  setSelectedVaultInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  bankingDetails: any;
  projects?: any[];
  services?: any[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};

export default function InvoicesPage({
  invoices,
  setInvoices,
  clients,
  cashbookEntries,
  setCashbookEntries,
  setIsInvoicePreviewOpen,
  setInvoiceProject,
  selectedVaultInvoices,
  setSelectedVaultInvoices,
  bankingDetails,
  projects = [],
  services = []
}: InvoicesPageProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [invoiceTab, setInvoiceTab] = useState<"SAVED" | "DRAFT">("SAVED");
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 = Client details, 2 = Service Details, 3 = Gateway Review

  // Form States
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingGst, setBillingGst] = useState("");
  
  const [service, setService] = useState("");
  const [qty, setQty] = useState<number>(1);
  const [rate, setRate] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [discountType, setDiscountType] = useState<"rs" | "%">("rs");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [logToCashbook, setLogToCashbook] = useState(true);
  const [includesDiscount, setIncludesDiscount] = useState(true);
  const [isServiceExpanded, setIsServiceExpanded] = useState(true);

  const serviceSuggestions = services.filter((s: any) =>
    s.title.toLowerCase().includes(service.toLowerCase())
  );

  // Tracks what the user last interacted with to prevent recursive calculations
  const [lastCalculatedBy, setLastCalculatedBy] = useState<"rate" | "total" | null>(null);

  // live calculations
  useEffect(() => {
    const qtyVal = Number(qty) || 1;
    const rateVal = parseFloat(rate);
    const discVal = parseFloat(discount) || 0;

    if (!isNaN(rateVal) && lastCalculatedBy !== "total") {
      // Calculate Total Amount from Rate
      const baseTotal = qtyVal * rateVal;
      const discountAmt = discountType === "rs" ? discVal : (baseTotal * discVal) / 100;
      const calculatedTotal = Math.max(0, baseTotal - discountAmt);
      setTotalAmount(calculatedTotal.toFixed(2));
    }
  }, [qty, rate, discount, discountType, lastCalculatedBy]);

  useEffect(() => {
    const qtyVal = Number(qty) || 1;
    const totalVal = parseFloat(totalAmount);
    const discVal = parseFloat(discount) || 0;

    if (!isNaN(totalVal) && lastCalculatedBy === "total") {
      // Calculate Rate from Total Amount
      let calculatedRate = 0;
      if (discVal > 0) {
        if (includesDiscount) {
          // Entered total already includes discount
          if (discountType === "rs") {
            calculatedRate = (totalVal + discVal) / qtyVal;
          } else {
            calculatedRate = (totalVal / (1 - discVal / 100)) / qtyVal;
          }
        } else {
          // Entered total does NOT include discount
          calculatedRate = totalVal / qtyVal;
        }
      } else {
        calculatedRate = totalVal / qtyVal;
      }
      setRate(Math.max(0, calculatedRate).toFixed(2));
    }
  }, [qty, totalAmount, discount, discountType, includesDiscount, lastCalculatedBy]);

  // Get up-to-date project info to keep status in sync dynamically
  const getUpToDateInvoice = (inv: any) => {
    if (!inv.rawProject || !inv.rawProject.id) return inv;
    const currentProj = projects.find(p => p.id === inv.rawProject.id);
    if (!currentProj) return inv;
    return {
      ...inv,
      rawProject: currentProj
    };
  };

  const upToDateInvoices = invoices.map(getUpToDateInvoice);

  const filteredInvoices = upToDateInvoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.projectService && inv.projectService.toLowerCase().includes(search.toLowerCase())) ||
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // A draft invoice is linked to a project and that project status is NOT Completed
    const isDraft = inv.rawProject && inv.rawProject.id && inv.rawProject.status && inv.rawProject.status !== 'Completed';

    if (invoiceTab === "DRAFT") {
      return isDraft;
    } else {
      return !isDraft;
    }
  });

  const getInvoiceNumber = (date: Date, serial = 1) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
    const serialStr = serial.toString().padStart(4, '0');
    return `NG/${dateStr}/${serialStr}`;
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingName || !billingAddress || !service || !totalAmount) {
      toast({ title: "Incomplete details", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    const totalVal = parseFloat(totalAmount) || 0;
    const qtyVal = Number(qty) || 1;
    const rateVal = parseFloat(rate) || (totalVal / qtyVal);
    const discVal = parseFloat(discount) || 0;

    const customInvoiceId = `custom-${Date.now()}`;
    const stableInvoiceNo = getInvoiceNumber(new Date(), invoices.length + 1);

    // Mock client data inside clientName using JSON_MOCK prefix
    const mockClientPayload = {
      name: billingName,
      address: billingAddress,
      email: billingEmail,
      phone: billingPhone,
      gst: billingGst,
      service: service,
      qty: qtyVal,
      rate: rateVal,
      discount: discVal,
      discountType: discountType,
      totalAmount: totalVal
    };

    const newInvoice = {
      invoiceNo: stableInvoiceNo,
      clientName: `JSON_MOCK:${JSON.stringify(mockClientPayload)}`,
      projectService: service,
      issueDate: new Date().toISOString().split('T')[0],
      grandTotal: totalVal,
      projectId: null
    };

    let savedInvoice;
    try {
      savedInvoice = await saveInvoice(newInvoice);
    } catch (err) {
      console.warn("Supabase insert failed. Falling back to local model creation:", err);
      // Construct a valid local fallback object
      savedInvoice = {
        id: `local-${Date.now()}`,
        invoice_no: stableInvoiceNo,
        client_name: newInvoice.clientName,
        project_service: newInvoice.projectService,
        issue_date: newInvoice.issueDate,
        grand_total: newInvoice.grandTotal
      };
    }

    try {
      const formattedInvoice = {
        id: savedInvoice.id || `local-${Date.now()}`,
        invoiceNo: savedInvoice.invoice_no || stableInvoiceNo,
        clientName: billingName,
        projectService: service,
        issueDate: new Date(savedInvoice.issue_date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        grandTotal: totalVal,
        rawProject: {
          id: savedInvoice.id || `local-${Date.now()}`,
          name: billingName,
          service: service,
          quote: rateVal * qtyVal,
          discount: discVal,
          advanceAmount: 0,
          phone: billingPhone,
          email: billingEmail,
          address: billingAddress,
          gst: billingGst,
          items: [{
            service: service,
            quote: rateVal * qtyVal,
            discount: discVal,
            qty: qtyVal,
            rate: rateVal
          }]
        }
      };

      setInvoices(prev => [formattedInvoice, ...prev]);

      // Log payment to Cashbook if checked
      if (logToCashbook) {
        const cashbookEntry = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          desc: `Custom Invoice: ${service} - ${billingName}`,
          amount: totalVal,
          type: "INCOME" as const,
          mode: "UPI" as const,
          category: "Service"
        };
        setCashbookEntries(prev => [cashbookEntry, ...prev]);
      }

      toast({ title: "Invoice Ignited Successfully", description: `Saved and logged to vault as ${stableInvoiceNo}` });

      // Trigger preview modal immediately
      setInvoiceProject(formattedInvoice.rawProject);
      setIsInvoicePreviewOpen(true);
      
      // Reset form
      setIsWorkspaceOpen(false);
      setFormStep(1);
      setBillingName("");
      setBillingAddress("");
      setBillingEmail("");
      setBillingPhone("");
      setBillingGst("");
      setService("");
      setQty(1);
      setRate("");
      setDiscount("");
      setDiscountType("rs");
      setTotalAmount("");
      setLogToCashbook(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate invoice", description: "Internal runtime rendering error.", variant: "destructive" });
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent" data-testid="heading-invoices">
            Invoice Vault
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">{filteredInvoices.length} total generated documents</p>
        </div>
        <Button
          onClick={() => setIsWorkspaceOpen(true)}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 gap-2 font-bold text-xs rounded-xl"
        >
          <Plus className="w-4 h-4" />
          CREATE NEW INVOICE
        </Button>
      </motion.div>

      {/* Standalone Create Invoice Workspace Modal */}
      <AnimatePresence>
        {isWorkspaceOpen && (
          <div className="modal-overlay z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="ignition-modal max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto"
            >
              <button
                type="button"
                className="close-modal"
                onClick={() => setIsWorkspaceOpen(false)}
              >
                ×
              </button>

              <div className="modal-header border-b border-white/5 pb-4 mb-5">
                <h2 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Standalone Invoicing Workspace
                </h2>
                <p className="text-xs text-muted-foreground">Generate complete tax invoices on-the-fly without registering clients or projects beforehand</p>
              </div>

              {/* Glowing Wizard Stepper Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center relative max-w-xl mx-auto px-4">
                  {/* Background Progress line */}
                  <div className="absolute top-4 left-0 right-0 h-[2px] bg-white/5 z-0" />
                  {/* Glowing active line */}
                  <motion.div 
                    className="absolute top-4 left-0 h-[2px] bg-gradient-to-r from-cyan-400 to-indigo-400 z-0"
                    animate={{ width: formStep === 1 ? "0%" : formStep === 2 ? "50%" : "100%" }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Step Buttons */}
                  {[
                    { step: 1, label: "Client Details", desc: "Credentials" },
                    { step: 2, label: "Service Pricing", desc: "Calibration" },
                    { step: 3, label: "Gateway Preview", desc: "Settlement" }
                  ].map((s) => {
                    const isActive = formStep >= s.step;
                    const isCurrent = formStep === s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => {
                          // Validate transitions
                          if (s.step === 2 && (!billingName || !billingAddress)) {
                            toast({ title: "Incomplete Client Credentials", description: "Name and address are required.", variant: "destructive" });
                            return;
                          }
                          if (s.step === 3 && (!billingName || !billingAddress || !service || !totalAmount)) {
                            toast({ title: "Awaiting Service Calibration", description: "Complete Step 1 & 2 details first.", variant: "destructive" });
                            return;
                          }
                          setFormStep(s.step);
                        }}
                        className="flex flex-col items-center z-10 relative focus:outline-none select-none cursor-pointer"
                      >
                        <motion.div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                            isCurrent 
                              ? "bg-cyan-400 border-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110" 
                              : isActive 
                                ? "bg-indigo-500/20 border-indigo-400 text-indigo-400" 
                                : "bg-[#0b0f1e] border-white/10 text-muted-foreground"
                          }`}
                        >
                          {s.step}
                        </motion.div>
                        <span className={`text-[9px] font-bold uppercase mt-2 tracking-widest ${isCurrent ? "text-cyan-400" : isActive ? "text-indigo-400" : "text-muted-foreground"}`}>
                          {s.label}
                        </span>
                        <span className="text-[8px] font-mono text-muted-foreground/45 uppercase mt-0.5">
                          {s.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-5">
                {/* Step 1: Client Credentials */}
                {formStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="space-y-4 text-left min-h-[300px]"
                  >
                    <div className="p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.01] backdrop-blur-sm flex items-center gap-3">
                      <User className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Step 1: Client Billing Credentials</h4>
                        <p className="text-3xs text-muted-foreground mt-0.5">Fill out office physical credentials and contacts for the printed invoice Bill-To segment.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Client Name / Business Name *</label>
                        <Input
                          value={billingName}
                          onChange={e => setBillingName(e.target.value)}
                          placeholder="e.g. Dhaval Koyani / Event Stationery"
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Billing Address *</label>
                        <Input
                          value={billingAddress}
                          onChange={e => setBillingAddress(e.target.value)}
                          placeholder="e.g. Shreeji Complex, Mendarda"
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Email Address</label>
                        <Input
                          type="email"
                          value={billingEmail}
                          onChange={e => setBillingEmail(e.target.value)}
                          placeholder="client@mail.com"
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Mobile / Whatsapp Number</label>
                        <Input
                          type="tel"
                          value={billingPhone}
                          onChange={e => setBillingPhone(e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">GSTIN (Optional)</label>
                        <Input
                          value={billingGst}
                          onChange={e => setBillingGst(e.target.value)}
                          placeholder="24AAAAA0000A1Z5"
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Service Details & Calculation */}
                {formStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="space-y-4 text-left min-h-[300px]"
                  >
                    <div className="p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.01] backdrop-blur-sm flex items-center gap-3">
                      <Coins className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Step 2: Service & Price Calibration</h4>
                        <p className="text-3xs text-muted-foreground mt-0.5">Define service catalog, total checkout amount, and dynamic pricing metrics.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Service Description *</label>
                        <Input
                          value={service}
                          onChange={e => setService(e.target.value)}
                          onFocus={() => setShowServiceSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowServiceSuggestions(false), 200)}
                          placeholder="e.g. Brand Identity (Logo) Design"
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                          autoComplete="off"
                        />
                        {showServiceSuggestions && serviceSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#0c1220]/95 backdrop-blur-md shadow-2xl z-50 text-left divide-y divide-white/5">
                            {serviceSuggestions.map((s: any) => (
                              <button
                                key={s.id}
                                type="button"
                                className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex items-center gap-2"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // prevents input blur before selection
                                  setService(s.title);
                                  setShowServiceSuggestions(false);
                                }}
                              >
                                <span className="text-sm">{s.icon}</span>
                                <span>{s.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Total Invoice Amount (₹) *</label>
                        <Input
                          type="number"
                          placeholder="Enter total quote"
                          value={totalAmount}
                          onChange={e => {
                            setTotalAmount(e.target.value);
                            setLastCalculatedBy("total");
                          }}
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Quantity *</label>
                        <Input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={e => setQty(Number(e.target.value) || 1)}
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Rate per Unit (₹)</label>
                        <Input
                          type="number"
                          placeholder="Calculated per QTY"
                          value={rate}
                          onChange={e => {
                            setRate(e.target.value);
                            setLastCalculatedBy("rate");
                          }}
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-10 text-foreground"
                        />
                      </div>

                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Discount</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                            className="bg-white/5 border-white/10 text-xs rounded-xl h-10 w-3/4 text-foreground"
                          />
                          <select
                            value={discountType}
                            onChange={e => setDiscountType(e.target.value as "rs" | "%")}
                            className="bg-[#050508] border border-white/10 text-xs rounded-xl h-10 w-1/4 outline-none text-foreground px-3 font-semibold"
                          >
                            <option value="rs">₹</option>
                            <option value="%">%</option>
                          </select>
                        </div>
                      </div>

                      {/* Ask user to confirm if total amount includes discount */}
                      {parseFloat(discount) > 0 && lastCalculatedBy === "total" && (
                        <div className="space-y-1.5 col-span-1 md:col-span-2 animate-fadeSlideUp">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Discount Calibration</label>
                          <select
                            value={includesDiscount ? "yes" : "no"}
                            onChange={e => setIncludesDiscount(e.target.value === "yes")}
                            className="w-full h-10 px-3 bg-cyan-955/20 border border-cyan-500/30 rounded-xl text-xs text-cyan-400 outline-none"
                          >
                            <option value="yes">Total entered is INCLUDING discount</option>
                            <option value="no">Total entered is EXCLUDING discount</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Gateway & Settlement Preview */}
                {formStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    className="space-y-4 text-left min-h-[300px]"
                  >
                    <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/[0.01] backdrop-blur-sm flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Step 3: Settlement Gateway Review</h4>
                        <p className="text-3xs text-muted-foreground mt-0.5">Verify payee records and simulated QR checkout endpoints before final document ignition.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                      {/* Left: Summary card */}
                      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 space-y-3 font-mono text-[10px] text-white/70">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 font-sans mb-1">Billing Summary</h4>
                        
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/40">Payee Client:</span>
                          <span className="font-bold text-white uppercase">{billingName}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/40">Address Reference:</span>
                          <span className="font-bold text-white truncate max-w-[200px]" title={billingAddress}>{billingAddress}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/40">Service Catalog:</span>
                          <span className="font-bold text-white truncate max-w-[200px]" title={service}>{service}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/40">Quantity & Rate:</span>
                          <span className="font-bold text-white">{qty} × ₹{Number(rate || (parseFloat(totalAmount) / qty)).toFixed(2)}</span>
                        </div>
                        
                        {parseFloat(discount) > 0 && (
                          <div className="flex justify-between border-b border-white/5 pb-2 text-red-400">
                            <span>Discount Calibrated:</span>
                            <span>- {discountType === "rs" ? `₹${parseFloat(discount).toFixed(2)}` : `${discount}%`}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-emerald-400 text-xs font-extrabold pt-2 mt-1 border-t border-indigo-500/20">
                          <span className="font-sans font-bold">GRAND TOTAL DUE:</span>
                          <span>₹{parseFloat(totalAmount).toFixed(2)}</span>
                        </div>

                        {/* Log to Cashbook checkbox */}
                        <div className="flex items-center gap-2.5 pt-4 select-none border-t border-white/5 mt-4">
                          <input
                            type="checkbox"
                            id="logToCashbook"
                            checked={logToCashbook}
                            onChange={e => setLogToCashbook(e.target.checked)}
                            className="rounded accent-cyan-400 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="logToCashbook" className="text-[9px] text-muted-foreground cursor-pointer text-left leading-normal">
                            Log ₹{parseFloat(totalAmount).toFixed(2)} as UPI income in global Cashbook?
                          </label>
                        </div>
                      </div>

                      {/* Right: UPI QR Simulation Card */}
                      <div className="rounded-xl border border-white/5 bg-white/[0.01] p-5 flex flex-col items-center justify-center gap-4 relative">
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          <span>DOCK QR</span>
                        </div>

                        <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shadow-inner relative group overflow-hidden">
                          {bankingDetails?.upiId ? (
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${bankingDetails.upiId}&pn=${bankingDetails.accountName}&am=${parseFloat(totalAmount)}&cu=INR`)}`}
                              alt="Settlement UPI QR Checkout" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-center p-2 text-muted-foreground/30">
                              🌐
                              <span className="text-[8px] uppercase font-mono block mt-1">Awaiting VPA...</span>
                            </div>
                          )}
                        </div>

                        <div className="text-center space-y-1 w-full">
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-semibold font-mono">Invoice Settlement Target</div>
                          <div className="text-xs font-bold text-white truncate max-w-[220px] mx-auto font-sans">{bankingDetails?.accountName || "AWAITING CONFIG"}</div>
                          <div className="text-[9px] font-mono text-cyan-400 truncate max-w-[220px] mx-auto">{bankingDetails?.upiId || "VPA uncalibrated"}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between items-center pt-5 border-t border-white/5 mt-6">
                  {/* Left Action Button */}
                  <div>
                    {formStep > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setFormStep(prev => prev - 1)}
                        className="border border-white/10 text-white hover:bg-white/5 text-xs rounded-xl px-5"
                      >
                        BACK
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsWorkspaceOpen(false)}
                        className="border border-white/5 text-muted-foreground hover:bg-white/5 text-xs rounded-xl px-5"
                      >
                        CANCEL
                      </Button>
                    )}
                  </div>

                  {/* Right Action Button */}
                  <div>
                    {formStep < 3 ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (formStep === 1) {
                            if (!billingName || !billingAddress) {
                              toast({ title: "Missing parameters", description: "Name and physical address are required.", variant: "destructive" });
                              return;
                            }
                            setFormStep(2);
                          } else if (formStep === 2) {
                            if (!service || !totalAmount) {
                              toast({ title: "Missing parameters", description: "Service catalog description and amount are required.", variant: "destructive" });
                              return;
                            }
                            setFormStep(3);
                          }
                        }}
                        className="bg-cyan-500 hover:bg-cyan-600 text-black font-extrabold text-xs rounded-xl px-6 py-2 shadow-lg shadow-cyan-500/10"
                      >
                        NEXT STEP
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-black font-extrabold text-xs rounded-xl px-8 py-5 shadow-lg shadow-cyan-500/15"
                      >
                        IGNITE TAX INVOICE ⚡
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice Vault List */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-foreground text-lg">Document Ledger</h3>
            <p className="text-xs text-muted-foreground">Secure repository for generated tax invoice documents</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tabs for Saved Invoices and Draft Invoices */}
            <div className="flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/5 mr-2">
              <Button
                variant={invoiceTab === "SAVED" ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 rounded-md text-[10px] font-bold tracking-wider px-3 ${
                  invoiceTab === "SAVED" 
                    ? "bg-white/10 text-cyan-400" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setInvoiceTab("SAVED")}
              >
                SAVED INVOICES
              </Button>
              <Button
                variant={invoiceTab === "DRAFT" ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 rounded-md text-[10px] font-bold tracking-wider px-3 ${
                  invoiceTab === "DRAFT" 
                    ? "bg-white/10 text-amber-400" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setInvoiceTab("DRAFT")}
              >
                DRAFT INVOICES
              </Button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-9 h-9 bg-white/5 border-white/10 text-xs rounded-xl"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selectedVaultInvoices.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/35 hover:to-indigo-500/35 border border-cyan-500/30 text-cyan-400 font-bold text-xs"
                  onClick={() => {
                    const selectedInvs = upToDateInvoices.filter(inv => selectedVaultInvoices.includes(inv.id));
                    const clientsList = [...new Set(selectedInvs.map(inv => inv.clientName.trim().toLowerCase()))];
                    if (clientsList.length > 1) {
                      toast({
                        title: "Multi-client selection",
                        description: "Batch invoices can only be generated for a single client at a time.",
                        variant: "destructive"
                      });
                      return;
                    }

                    const baseInvoice = selectedInvs[0];
                    const firstRaw = baseInvoice.rawProject;
                    
                    let allItemsCombined: any[] = [];
                    selectedInvs.forEach(inv => {
                      const raw = inv.rawProject;
                      if (raw && raw.items && raw.items.length > 0) {
                        raw.items.forEach((item: any) => {
                          allItemsCombined.push({
                            service: item.service,
                            quote: parseFloat(item.rate || item.quote) * (item.qty || 1),
                            discount: parseFloat(item.discount) || 0,
                            qty: item.qty || 1,
                            rate: parseFloat(item.rate || item.quote)
                          });
                        });
                      } else {
                        allItemsCombined.push({
                          service: inv.projectService || raw?.service || "Service Description",
                          quote: parseFloat(raw?.quote || inv.grandTotal),
                          discount: parseFloat(raw?.discount || 0),
                          qty: raw?.qty || 1,
                          rate: parseFloat(raw?.rate || raw?.quote || inv.grandTotal)
                        });
                      }
                    });

                    const totalQuote = allItemsCombined.reduce((sum, item) => sum + (parseFloat(item.rate || item.quote) * (item.qty || 1)), 0);
                    const totalDiscount = allItemsCombined.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
                    const totalAdvance = selectedInvs.reduce((sum, inv) => sum + (parseFloat(inv.rawProject?.advanceAmount) || 0), 0);

                    const batchProject = {
                      id: `batch-vault-${Date.now()}`,
                      name: baseInvoice.clientName,
                      phone: firstRaw?.phone || baseInvoice.phone,
                      email: firstRaw?.email || baseInvoice.email,
                      address: firstRaw?.address || baseInvoice.address,
                      gst: firstRaw?.gst || baseInvoice.gst,
                      status: firstRaw?.status || "Active",
                      service: allItemsCombined.map(i => i.service).join(", "),
                      quote: totalQuote,
                      discount: totalDiscount,
                      advanceAmount: totalAdvance,
                      items: allItemsCombined
                    };

                    setInvoiceProject(batchProject);
                    setIsInvoicePreviewOpen(true);
                    setSelectedVaultInvoices([]);
                  }}
                >
                  GENERATE BATCH INVOICE ({selectedVaultInvoices.length})
                </Button>

                <Button
                  size="sm"
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold text-xs"
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedVaultInvoices.length} selected invoices? This action cannot be undone.`)) {
                      setInvoices(prev => prev.filter(inv => !selectedVaultInvoices.includes(inv.id)));
                      setSelectedVaultInvoices([]);
                      toast({ title: "Invoices deleted" });
                    }
                  }}
                >
                  DELETE SELECTED ({selectedVaultInvoices.length})
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-white/5 rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01] text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <th style={{ width: "40px" }} className="p-4 text-center">
                  <input
                    type="checkbox"
                    className="rounded accent-cyan-400"
                    onChange={(e) => {
                      if (e.target.checked) setSelectedVaultInvoices(filteredInvoices.map(inv => inv.id));
                      else setSelectedVaultInvoices([]);
                    }}
                  />
                </th>
                <th className="p-4">Invoice No</th>
                <th className="p-4">Client / Project</th>
                <th className="p-4 text-center">Issue Date</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedVaultInvoices.includes(inv.id)}
                        className="rounded accent-cyan-400"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedVaultInvoices(prev => [...prev, inv.id]);
                          else setSelectedVaultInvoices(prev => prev.filter(id => id !== inv.id));
                        }}
                      />
                    </td>
                    <td className={`p-4 font-bold ${
                      inv.rawProject && inv.rawProject.id && inv.rawProject.status && inv.rawProject.status !== 'Completed'
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}>{inv.invoiceNo}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{inv.clientName}</span>
                        <span className="text-3xs text-muted-foreground mt-0.5">{inv.projectService}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">{inv.issueDate}</td>
                    <td className="p-4 text-right font-bold text-foreground">₹{inv.grandTotal.toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 hover:bg-cyan-500/10 hover:text-cyan-400"
                          title="View Invoice Document"
                          onClick={() => {
                            setInvoiceProject({ ...inv.rawProject, invoiceNo: inv.invoiceNo });
                            setIsInvoicePreviewOpen(true);
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 hover:bg-red-500/10 hover:text-red-400"
                          title="Delete Record"
                          onClick={() => {
                            if (window.confirm("Remove this invoice record from vault?")) {
                              setInvoices(prev => prev.filter(i => i.id !== inv.id));
                              setSelectedVaultInvoices(prev => prev.filter(id => id !== inv.id));
                              toast({ title: "Invoice deleted" });
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground uppercase tracking-widest text-3xs font-semibold">
                    {invoiceTab === "DRAFT" ? "NO TEMPORARY DRAFT INVOICES IN VAULT" : "LEDGER IS VOID OF SAVED INVOICES"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
