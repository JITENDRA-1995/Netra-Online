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
  Coins
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
  setSelectedVaultInvoices
}: InvoicesPageProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

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

  const filteredInvoices = invoices.filter(inv =>
    inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
    (inv.projectService && inv.projectService.toLowerCase().includes(search.toLowerCase())) ||
    inv.invoiceNo.toLowerCase().includes(search.toLowerCase())
  );

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

    try {
      const savedInvoice = await saveInvoice(newInvoice);
      
      const formattedInvoice = {
        id: savedInvoice.id,
        invoiceNo: savedInvoice.invoice_no,
        clientName: billingName,
        projectService: service,
        issueDate: new Date(savedInvoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        grandTotal: totalVal,
        rawProject: {
          id: savedInvoice.id,
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
          type: "INCOME",
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
      toast({ title: "Failed to generate invoice", description: "Database transaction error.", variant: "destructive" });
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
          onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 gap-2 font-bold text-xs rounded-xl"
        >
          {isWorkspaceOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isWorkspaceOpen ? "CANCEL WORKSPACE" : "CREATE NEW INVOICE"}
        </Button>
      </motion.div>

      {/* Slide-out Create Invoice Workspace */}
      <AnimatePresence>
        {isWorkspaceOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1e]/40 backdrop-blur-sm p-6 space-y-6"
            >
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-extrabold text-foreground text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Standalone Invoicing Workspace
                </h3>
                <p className="text-xs text-muted-foreground">Generate complete tax invoices on-the-fly without registering clients or projects beforehand</p>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Bill To section */}
                  <div className="space-y-4 border-r border-white/5 pr-0 md:pr-5">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Client (Bill To) Information
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Client Name / Business Name *</label>
                        <Input
                          value={billingName}
                          onChange={e => setBillingName(e.target.value)}
                          placeholder="e.g. Dhaval Koyani / Event Stationery"
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Billing Address *</label>
                        <Input
                          value={billingAddress}
                          onChange={e => setBillingAddress(e.target.value)}
                          placeholder="e.g. Shreeji Complex, Mendarda"
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Email Address</label>
                          <Input
                            type="email"
                            value={billingEmail}
                            onChange={e => setBillingEmail(e.target.value)}
                            placeholder="client@mail.com"
                            className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Mobile / Whatsapp Number</label>
                          <Input
                            type="tel"
                            value={billingPhone}
                            onChange={e => setBillingPhone(e.target.value)}
                            placeholder="+91 XXXXX XXXXX"
                            className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">GSTIN (Optional)</label>
                        <Input
                          value={billingGst}
                          onChange={e => setBillingGst(e.target.value)}
                          placeholder="24AAAAA0000A1Z5"
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      Service Description & Pricing
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Service Category / Description *</label>
                        <Input
                          value={service}
                          onChange={e => setService(e.target.value)}
                          placeholder="e.g. Brand Identity (Logo) Design"
                          required
                          className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Quantity *</label>
                          <Input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={e => setQty(Number(e.target.value) || 1)}
                            required
                            className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Rate per Unit (₹)</label>
                          <Input
                            type="number"
                            placeholder="Leave empty if entering total"
                            value={rate}
                            onChange={e => {
                              setRate(e.target.value);
                              setLastCalculatedBy("rate");
                            }}
                            className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Discount</label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              placeholder="0"
                              value={discount}
                              onChange={e => setDiscount(e.target.value)}
                              className="bg-white/5 border-white/10 text-xs rounded-xl h-9 w-2/3"
                            />
                            <select
                              value={discountType}
                              onChange={e => setDiscountType(e.target.value as "rs" | "%")}
                              className="bg-white/5 border border-white/10 text-xs rounded-xl h-9 w-1/3 outline-none text-foreground"
                            >
                              <option value="rs">₹</option>
                              <option value="%">%</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Interactive rate calculations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Total Amount (₹) *</label>
                          <Input
                            type="number"
                            placeholder="Enter total quote"
                            value={totalAmount}
                            onChange={e => {
                              setTotalAmount(e.target.value);
                              setLastCalculatedBy("total");
                            }}
                            required
                            className="bg-white/5 border-white/10 text-xs rounded-xl h-9"
                          />
                        </div>

                        {/* Ask user to confirm if total amount includes discount */}
                        {parseFloat(discount) > 0 && lastCalculatedBy === "total" && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Discount Calibration</label>
                            <select
                              value={includesDiscount ? "yes" : "no"}
                              onChange={e => setIncludesDiscount(e.target.value === "yes")}
                              className="w-full h-9 px-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-2xs text-cyan-400 outline-none"
                            >
                              <option value="yes">Total enters is INCLUDING discount</option>
                              <option value="no">Total enters is EXCLUDING discount</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Log to Cashbook checkbox */}
                      <div className="flex items-center gap-2 pt-2 select-none">
                        <input
                          type="checkbox"
                          id="logToCashbook"
                          checked={logToCashbook}
                          onChange={e => setLogToCashbook(e.target.checked)}
                          className="rounded accent-cyan-400 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="logToCashbook" className="text-2xs text-muted-foreground cursor-pointer">
                          Automatically log this invoice amount as UPI Service Income in Cashbook?
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsWorkspaceOpen(false)}
                    className="border border-white/5 text-muted-foreground hover:bg-white/5 text-xs rounded-xl px-5"
                  >
                    CANCEL
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-black font-extrabold text-xs rounded-xl px-6 py-5 shadow-lg shadow-cyan-500/10"
                  >
                    PREVIEW & SAVE INVOICE
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Vault List */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-foreground text-lg">Document Ledger</h3>
            <p className="text-xs text-muted-foreground">Secure repository for generated tax invoice documents</p>
          </div>
          <div className="flex items-center gap-3">
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
                    <td className="p-4 font-bold text-cyan-400">{inv.invoiceNo}</td>
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
                    LEDGER IS VOID OF ENTRIES
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
