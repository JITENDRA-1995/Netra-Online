import React, { useState, useEffect } from "react";
import { fetchClientInvoiceDetail } from "../../supabase/database/clientVault";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft, Printer, Download, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { extractDateFromInvoiceNo } from "../../lib/utils";

export function ClientInvoiceDetail({ invoiceId, onTabChange }) {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;

    const loadInvoiceDetail = async () => {
      try {
        setIsLoading(true);
        const data = await fetchClientInvoiceDetail(invoiceId);
        setInvoice(data);
      } catch (err) {
        console.error("Error loading invoice detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoiceDetail();
  }, [invoiceId]);

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

    if (n >= 10000000) {
      str += convertLessThanThousand(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convertLessThanThousand(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      str += convertLessThanThousand(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      str += convertLessThanThousand(n);
    }

    return str.replace(/\s+/g, ' ').trim() + " Only";
  };

  const handleDownloadPDF = async () => {
    const pageNode = document.querySelector('.invoice-print');
    if (!pageNode) return;

    try {
      setIsGeneratingPDF(true);
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      window.scrollTo(0, 0);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const canvas = await html2canvas(pageNode, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1000,
        windowHeight: 1400,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pageWidth = 210;
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const filename = `${invoice.client?.name.replace(/\s+/g, '_')}_${invoice.invoiceNumber.replace(/\//g, '_')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF Generation Error in client portal:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusBadge = (status) => {
    if (invoice && (invoice.projectStatus || '').toLowerCase() !== 'completed') {
      return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
    }
    switch (status) {
      case 'paid':
        return <Badge className="bg-primary/10 text-primary border-primary/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'sent':
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Invoice not found.</p>
        <Button onClick={() => onTabChange("INVOICES")} className="mt-4">
          Back to Invoices
        </Button>
      </div>
    );
  }

  const { adminProfile, bankingDetails } = invoice;
  const subtotal = invoice.subtotal || invoice.amount;
  const discount = invoice.discount || 0;
  const grandTotal = invoice.amount;
  const advance = invoice.advanceAmount || 0;
  const remaining = grandTotal - advance;
  const isCompleted = (invoice.projectStatus || '').toLowerCase() === 'completed';

  // Fixed 6 rows logic
  const rowsPerPage = 6;
  const allItems = invoice.lineItems || [];
  const blankRowsCount = Math.max(0, rowsPerPage - allItems.length);

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 client-vault-theme">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 no-print">
        <div>
          <button 
            onClick={() => onTabChange("INVOICES")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif font-medium tracking-tight">
              {!isCompleted ? "Draft Invoice" : "Invoice"} {invoice.invoiceNumber}
            </h1>
            {getStatusBadge(invoice.status)}
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            className="w-full sm:w-auto cursor-pointer" 
            onClick={handleDownloadPDF} 
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Printed Invoice Card Sheet */}
      <div 
        className="invoice-page-unit invoice-print"
        style={{
          width: '800px', height: '1130px', background: '#fff',
          borderRadius: '8px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', position: 'relative',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', margin: '0 auto 30px',
          color: '#000', fontFamily: 'sans-serif'
        }}
      >
        {/* Red & Black High Fidelity Banner */}
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
              <h1 style={{ margin: 0, fontSize: '2.0rem', fontWeight: '900', letterSpacing: '1px' }}>
                {adminProfile.businessName.toUpperCase()}
              </h1>
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
            <h2 style={{ margin: 0, fontSize: '2.0rem', letterSpacing: '3px', fontWeight: '900' }}>
              {!isCompleted ? "DRAFT INVOICE" : "TAX INVOICE"}
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9, maxWidth: '300px', marginLeft: 'auto' }}>
              {adminProfile.address}
            </p>
          </div>
        </div>

        {/* Bill To / Invoice Details */}
        <div style={{ padding: '25px 40px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '1px', fontWeight: 'bold' }}>BILL TO</label>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '1.2rem', fontWeight: '900' }}>{invoice.client?.name.toUpperCase()}</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555', maxWidth: '350px' }}>
              {invoice.client?.address || "Gujarat, India"}
            </p>
            {invoice.client?.phone && <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📞 {invoice.client.phone}</p>}
            {invoice.client?.email && <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#555' }}>📧 {invoice.client.email}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <label style={{ fontSize: '0.65rem', color: '#888', letterSpacing: '1px', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>INVOICE DETAILS</label>
            <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem' }}>
              <strong>Issue Date:</strong> {format(new Date(extractDateFromInvoiceNo(invoice.invoiceNumber, invoice.createdAt || invoice.issueDate)), 'dd-MM-yyyy')}
            </p>
          </div>
        </div>

        {/* Service Table with Watermark */}
        <div style={{ padding: '0 40px', flex: 1, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)',
            fontSize: '25rem', fontWeight: '900', color: 'rgba(0,0,0,0.02)', zIndex: 0, pointerEvents: 'none'
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
              {allItems.map((item, idx) => {
                const discountPercent = subtotal > 0 ? Math.round((discount / subtotal) * 100) : 0;
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#d32f2f', fontSize: '1.2rem' }}>•</span>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{item.description}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity || 1}</td>
                    <td style={{ textAlign: 'right', fontSize: '0.9rem' }}>₹{formatCurrencyValue(item.unitPrice)}</td>
                    <td style={{ textAlign: 'center', fontSize: '0.9rem', color: discountPercent > 0 ? '#2e7d32' : '#888', fontWeight: 'bold' }}>
                      {discountPercent > 0 ? `${discountPercent}%` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      ₹{formatCurrencyValue(item.total)}
                    </td>
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

        {/* Totals & QR Gateway */}
        <div style={{ background: '#fff', borderTop: '1px solid #eee' }}>
          <div style={{ padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Payment instructions */}
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', width: '58%', border: '1px solid #eee' }}>
              <div style={{ width: '80px', height: '80px', background: '#fff', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `upi://pay?pa=${bankingDetails.upiId}&pn=${bankingDetails.accountName}&am=${
                    isCompleted ? grandTotal : (advance > 0 ? grandTotal - advance : grandTotal)
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

            {/* Totals panel */}
            <div style={{ width: '38%', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                <span style={{ color: '#666' }}>SUBTOTAL</span>
                <span style={{ fontWeight: 'bold' }}>₹{formatCurrencyValue(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                  <span style={{ color: '#666' }}>DISCOUNT</span>
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>-₹{formatCurrencyValue(discount)}</span>
                </div>
              )}

              {isCompleted ? (
                <div style={{
                  background: '#1b5e20', padding: '10px 15px', color: '#fff', borderRadius: '6px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>GRAND TOTAL</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '900' }}>₹{formatCurrencyValue(grandTotal)}</span>
                </div>
              ) : (
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
              )}
            </div>
          </div>

          <div style={{ padding: '0 40px 12px' }}>
            <div style={{ background: '#fcfcfc', border: '1px solid #f0f0f0', borderLeft: '3px solid #d32f2f', padding: '6px 12px' }}>
              <label style={{ fontSize: '0.5rem', color: '#888', fontWeight: '900', display: 'block' }}>
                AMOUNT IN WORDS
              </label>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>
                {amountInWords(isCompleted ? grandTotal : (advance > 0 ? remaining : grandTotal))}
              </p>
            </div>
          </div>

          {/* Signatures */}
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

          {/* Footers cards */}
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
            Page 1 of 1
          </div>
        </div>
      </div>
    </div>
  );
}
