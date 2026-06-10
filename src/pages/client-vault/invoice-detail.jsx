import React, { useState, useEffect } from "react";
import { fetchClientInvoiceDetail } from "../../supabase/database/clientVault";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft, Printer, Download, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function ClientInvoiceDetail({ invoiceId, onTabChange }) {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) return;

    const loadInvoiceDetail = async () => {
      try {
        setIsLoading(true);
        const data = await fetchClientInvoiceDetail(invoiceId);
        setProjectTitleAndInvoice(data);
      } catch (err) {
        console.error("Error loading invoice detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const setProjectTitleAndInvoice = (data) => {
      setInvoice(data);
    };

    loadInvoiceDetail();
  }, [invoiceId]);

  const getStatusBadge = (status) => {
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

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500 client-vault-theme">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <button 
            onClick={() => onTabChange("INVOICES")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif font-medium tracking-tight">Invoice {invoice.invoiceNumber}</h1>
            {getStatusBadge(invoice.status)}
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto border-border cursor-pointer">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button className="w-full sm:w-auto cursor-pointer" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden bg-card invoice-print">
        <CardContent className="p-8 sm:p-12 space-y-12">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="font-serif text-2xl font-medium tracking-tight mb-6">Studio.</div>
              <p className="text-sm text-muted-foreground">Netra Graphics Studio</p>
              <p className="text-sm text-muted-foreground">Gujarat, India</p>
              <p className="text-sm text-muted-foreground">contact@netragraphics.com</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm font-medium text-foreground mb-4">Billed To</p>
              <p className="text-sm text-foreground font-medium">{invoice.client?.name}</p>
              {invoice.client?.email && <p className="text-sm text-muted-foreground">{invoice.client.email}</p>}
              {invoice.client?.phone && <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>}
              {invoice.client?.address && <p className="text-sm text-muted-foreground max-w-[200px] inline-block">{invoice.client.address}</p>}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-border/50">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Invoice Date</p>
              <p className="text-sm">{invoice.createdAt ? format(new Date(invoice.createdAt), 'MMM d, yyyy') : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Due Date</p>
              <p className="text-sm font-medium text-foreground">{invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'Due on receipt'}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Project</p>
              <p className="text-sm">{invoice.projectTitle || 'General Services'}</p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-3 font-medium uppercase tracking-wider text-xs w-full">Description</th>
                  <th className="pb-3 font-medium uppercase tracking-wider text-xs text-right px-4">Qty</th>
                  <th className="pb-3 font-medium uppercase tracking-wider text-xs text-right px-4">Rate</th>
                  <th className="pb-3 font-medium uppercase tracking-wider text-xs text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {invoice.lineItems?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 text-foreground">{item.description}</td>
                    <td className="py-4 text-right px-4 text-muted-foreground">{item.quantity}</td>
                    <td className="py-4 text-right px-4 text-muted-foreground">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency || 'INR' }).format(item.unitPrice)}
                    </td>
                    <td className="py-4 text-right font-medium">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency || 'INR' }).format(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-6">
            <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency || 'INR' }).format(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-serif font-medium pt-3 border-t border-border">
                <span>Total Due</span>
                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency || 'INR' }).format(invoice.amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-12">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-muted-foreground max-w-2xl">{invoice.notes}</p>
            </div>
          )}
          
          {(invoice.status === 'sent' || invoice.status === 'pending') && (
            <div className="pt-8 flex justify-end print:hidden">
              <Button className="w-full sm:w-auto cursor-pointer" onClick={() => window.print()}>Pay Now</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
