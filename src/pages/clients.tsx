import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Building2, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  useListClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  getListClientsQueryKey,
} from "@/api-client";
import type { Client } from "@/api-client";

const clientSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  company: z.string().min(1, "Company required"),
  phone: z.string().optional(),
  industry: z.string().optional(),
});
type ClientFormData = z.infer<typeof clientSchema>;

const INDUSTRY_COLORS = ["#00d4ff", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#f97316"];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Clients() {
  const { data: clients, isLoading } = useListClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", company: "", phone: "", industry: "" },
  });

  const filtered = (clients ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditingClient(null);
    form.reset({ name: "", email: "", company: "", phone: "", industry: "" });
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    form.reset({ name: client.name, email: client.email, company: client.company, phone: client.phone ?? "", industry: client.industry ?? "" });
    setDialogOpen(true);
  }

  async function onSubmit(data: ClientFormData) {
    if (editingClient) {
      updateClient.mutate(
        { id: editingClient.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Client updated" });
          },
        }
      );
    } else {
      createClient.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Client added" });
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteClient.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Client removed" });
        },
      }
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" data-testid="heading-clients">
            Clients
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">{filtered.length} total</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 gap-2"
          data-testid="button-create-client"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-white/5 border-white/10"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-clients"
        />
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client, i) => {
            const color = INDUSTRY_COLORS[i % INDUSTRY_COLORS.length];
            const initials = client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={client.id}
                variants={itemVariants}
                className="group relative rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all"
                style={{ background: `linear-gradient(135deg, ${color}05 0%, transparent 100%)` }}
                data-testid={`card-client-${client.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${color}20`, border: `1px solid ${color}30`, color }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {client.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-cyan-500/10 hover:text-cyan-400" onClick={() => openEdit(client)} data-testid={`button-edit-client-${client.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleDelete(client.id)} data-testid={`button-delete-client-${client.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.industry && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs" style={{ background: `${color}15`, color }}>
                      {client.industry}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Projects</p>
                    <p className="text-lg font-bold text-foreground">{client.totalProjects}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-foreground" style={{ color }}>
                      ₹{client.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No clients found</p>
            </div>
          )}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0f1e] border-white/10 max-w-md" data-testid="dialog-client-form">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-client-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} className="bg-white/5 border-white/10" data-testid="input-client-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-client-company" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-client-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl><Input {...field} className="bg-white/5 border-white/10" data-testid="input-client-industry" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" className="flex-1 border border-white/10" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400" disabled={createClient.isPending || updateClient.isPending} data-testid="button-submit-client">
                  {editingClient ? "Save Changes" : "Add Client"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
