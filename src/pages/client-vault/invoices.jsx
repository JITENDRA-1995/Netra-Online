import React, { useState, useEffect } from "react";
import { fetchClientInvoices } from "../../supabase/database/clientVault";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Receipt, ArrowRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function ClientInvoices({ currentClient, onTabChange, setSelectedInvoiceId }) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentClient?.id) return;

    const loadInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await fetchClientInvoices(currentClient.id);
        setInvoices(data);
      } catch (err) {
        console.error("Error loading client invoices:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
  }, [currentClient]);

  const getStatusBadge = (invoice) => {
    if ((invoice.projectStatus || '').toLowerCase() !== 'completed') {
      return <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
    }
    switch (invoice.status) {
      case 'paid':
        return <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'sent':
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{invoice.status}</Badge>;
    }
  };

  const handleInvoiceClick = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    onTabChange("INVOICE_DETAIL");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 client-vault-theme">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-medium tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">Manage your billing and payment history.</p>
      </div>

      <div className="space-y-4 max-w-4xl">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2 w-1/3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>You don't have any invoices yet.</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div 
              key={invoice.id} 
              onClick={() => handleInvoiceClick(invoice.id)}
              className="block cursor-pointer group"
            >
              <Card className="border-border/50 hover:border-primary/30 transition-colors bg-card">
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        {(invoice.projectStatus || '').toLowerCase() !== 'completed' ? `Draft: ${invoice.invoiceNumber}` : invoice.invoiceNumber}
                      </span>
                      {getStatusBadge(invoice)}
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.projectTitle || 'General Design Services'}</p>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <span className="text-lg font-serif font-medium">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: invoice.currency || 'INR' }).format(invoice.amount)}
                    </span>
                    <span className="text-xs flex items-center text-muted-foreground group-hover:text-primary transition-colors">
                      {invoice.status === 'paid' && invoice.paidAt ? (
                        `Paid on ${format(new Date(invoice.paidAt), 'MMM d, yyyy')}`
                      ) : invoice.dueDate ? (
                        `Due ${format(new Date(invoice.dueDate), 'MMM d, yyyy')}`
                      ) : null}
                      <ArrowRight className="h-3 w-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
