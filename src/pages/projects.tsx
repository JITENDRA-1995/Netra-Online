import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../supabase/client";

const STATUS_COLORS: Record<string, string> = {
  active: "#00d4ff",
  completed: "#10b981",
  on_hold: "#f59e0b",
  cancelled: "#ef4444",
};

const CATEGORY_COLORS: Record<string, string> = {
  branding: "#00d4ff",
  web: "#8b5cf6",
  print: "#10b981",
  motion: "#f59e0b",
  illustration: "#ec4899",
  social_media: "#3b82f6",
  packaging: "#f97316",
};

const projectSchema = z.object({
  name: z.string().min(1, "Project/Service name required"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold", "cancelled"]),
  category: z.enum(["branding", "web", "print", "motion", "illustration", "social_media", "packaging"]),
  clientId: z.coerce.number().optional(),
  deadline: z.string().min(1, "Deadline required"),
  budget: z.coerce.number().min(0),
  progress: z.coerce.number().min(0).max(100),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface ProjectsProps {
  projects?: any[];
  setProjects?: React.Dispatch<React.SetStateAction<any[]>>;
  clients?: Client[];
  onOpenIgnitionModal: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Projects({
  projects = [],
  setProjects = () => {},
  clients = [],
  onOpenIgnitionModal
}: ProjectsProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      category: "branding",
      clientId: 0,
      deadline: "",
      budget: 0,
      progress: 0,
    },
  });

  const filtered = projects.filter((p) => {
    const serviceName = p.service || p.name || "";
    const clientName = p.clientName || p.name || "";
    const matchSearch = 
      serviceName.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    
    const statusVal = (p.status || "active").toLowerCase().replace(" ", "_");
    const matchStatus = filterStatus === "all" || statusVal === filterStatus;
    
    return matchSearch && matchStatus;
  });

  function openEdit(project: any) {
    setEditingProject(project);
    
    const currentStatus = (project.status || "active").toLowerCase().replace(" ", "_");
    const currentCategory = (project.category || "branding").toLowerCase().replace(" ", "_");
    const budgetVal = project.budget !== undefined ? project.budget : (parseFloat(project.quote) || 0);

    form.reset({
      name: project.service || project.name || "",
      description: project.description || project.desc || "",
      status: (["active", "completed", "on_hold", "cancelled"].includes(currentStatus) ? currentStatus : "active") as any,
      category: (["branding", "web", "print", "motion", "illustration", "social_media", "packaging"].includes(currentCategory) ? currentCategory : "branding") as any,
      clientId: project.clientId || 0,
      deadline: project.deadline || "",
      budget: budgetVal,
      progress: project.progress || 0,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: ProjectFormData) {
    if (editingProject && setProjects) {
      const budgetVal = data.budget;
      const statusFormatted = data.status.charAt(0).toUpperCase() + data.status.slice(1).replace("_", " ");
      
      const updatedProject = {
        ...editingProject,
        service: data.name,
        description: data.description,
        desc: data.description,
        status: statusFormatted,
        category: data.category,
        quote: budgetVal,
        budget: budgetVal,
        deadline: data.deadline,
        progress: data.progress,
      };

      try {
        await supabase
          .from("projects")
          .update({
            service: updatedProject.service,
            description: updatedProject.description,
            status: updatedProject.status,
            category: updatedProject.category,
            quote: updatedProject.quote,
            deadline: updatedProject.deadline,
            progress: updatedProject.progress,
          })
          .eq("id", editingProject.id);
      } catch (err) {
        console.warn("Supabase update failed, falling back to local memory:", err);
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? updatedProject : p))
      );
      setDialogOpen(false);
      toast({ title: "Project Calibration Saved", description: `Updated project: ${data.name}` });
    }
  }

  async function handleDelete(id: number) {
    if (window.confirm("ARE YOU SURE YOU WANT TO TERMINATE THIS MISSION? ALL DATA FOR THIS PROJECT WILL BE PURGED.")) {
      try {
        await supabase.from("projects").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase delete failed, falling back to local memory:", err);
      }
      if (setProjects) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
      toast({ title: "Project terminated successfully" });
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent" data-testid="heading-projects">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
            {filtered.length} {filterStatus !== "all" ? filterStatus : "total"} active projects
          </p>
        </div>
        <Button
          onClick={onOpenIgnitionModal}
          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 gap-2 font-bold text-xs rounded-xl"
          data-testid="button-create-project"
        >
          <Plus className="w-4 h-4" />
          START NEW IGNITION
        </Button>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white/5 border-white/10 rounded-xl text-foreground bg-[#0a0f1e]/40"
            placeholder="Search projects by name or client visionary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-projects"
          />
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
          {["ALL", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"].map(status => (
            <Button
              key={status}
              size="sm"
              variant={filterStatus === status.toLowerCase() ? "secondary" : "ghost"}
              className={`rounded-lg text-2xs font-semibold tracking-wider ${filterStatus === status.toLowerCase() ? "bg-white/10 text-cyan-400" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setFilterStatus(status.toLowerCase())}
            >
              {status}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div variants={containerVariants} className="space-y-4">
        {filtered.map((project) => {
          const serviceName = project.service || project.name || "Unnamed Project";
          const clientName = project.clientName || project.name || "Unknown Client";
          const budgetVal = project.budget !== undefined ? project.budget : (parseFloat(project.quote) || 0);
          const progressVal = project.progress || 0;
          const statusVal = (project.status || "active").toLowerCase().replace(" ", "_");
          const categoryVal = (project.category || "branding").toLowerCase().replace(" ", "_");

          const statusColor = STATUS_COLORS[statusVal] ?? "#666";
          const categoryColor = CATEGORY_COLORS[categoryVal] ?? "#666";

          return (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="group relative rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all flex flex-col justify-between"
              style={{ background: `linear-gradient(135deg, ${categoryColor}03 0%, transparent 100%)` }}
              data-testid={`card-project-${project.id}`}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase"
                    style={{
                      background: `${categoryColor}15`,
                      border: `1px solid ${categoryColor}30`,
                      color: categoryColor,
                    }}
                  >
                    {categoryVal.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-foreground text-sm">{serviceName}</h3>
                      <Badge
                        className="text-3xs uppercase tracking-wider font-extrabold border-0 px-2 py-0.5"
                        style={{
                          background: `${statusColor}15`,
                          color: statusColor,
                        }}
                      >
                        {statusVal.replace("_", " ")}
                      </Badge>
                      <Badge
                        className="text-3xs uppercase tracking-wider font-extrabold border-0 px-2 py-0.5"
                        style={{
                          background: `${categoryColor}15`,
                          color: categoryColor,
                        }}
                      >
                        {categoryVal.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visionary: <strong>{clientName}</strong> {project.deadline ? `· Due ${new Date(project.deadline).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-foreground">₹{budgetVal.toLocaleString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 border border-white/5"
                      onClick={() => openEdit(project)}
                      data-testid={`button-edit-project-${project.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 rounded-lg hover:bg-red-500/10 hover:text-red-400 border border-white/5"
                      onClick={() => handleDelete(project.id)}
                      data-testid={`button-delete-project-${project.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: statusColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressVal}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right font-semibold">{progressVal}%</span>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-20 text-muted-foreground border border-white/5 rounded-2xl">
            <Plus className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="uppercase tracking-widest text-3xs font-semibold">NO ACTIVE MISSIONS CALIBRATED</p>
          </div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0f1e] border-white/10 max-w-md" data-testid="dialog-project-form">
          <DialogHeader>
            <DialogTitle className="text-foreground font-black tracking-wide">CALIBRATE PROJECT PARAMETERS</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Project / Service Title</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 rounded-xl" placeholder="Service tag/name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Mission Brief / Notes</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10 rounded-xl" placeholder="Project objectives" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Status</FormLabel>
                      <FormControl>
                        <select
                          className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 bg-[#0c101d]"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Category</FormLabel>
                      <FormControl>
                        <select
                          className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground outline-none focus:border-cyan-400 bg-[#0c101d]"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="branding">Branding</option>
                          <option value="web">Web App/UI</option>
                          <option value="print">Print Media</option>
                          <option value="motion">Motion Graphics</option>
                          <option value="illustration">Illustration</option>
                          <option value="social_media">Social Media</option>
                          <option value="packaging">Packaging</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Budget (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white/5 border-white/10 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Progress (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white/5 border-white/10 rounded-xl" min={0} max={100} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className="text-3xs uppercase tracking-widest text-muted-foreground font-semibold">Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white/5 border-white/10 rounded-xl text-xs" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" className="flex-1 border border-white/10 rounded-xl" onClick={() => setDialogOpen(false)}>Discard</Button>
                <Button type="submit" className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold">Save Calibration</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
