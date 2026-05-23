import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Pencil, Trash2, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useListProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useListClients,
  getListProjectsQueryKey,
} from "@/api-client";
import type { Project } from "@/api-client";

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
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  status: z.enum(["active", "completed", "on_hold", "cancelled"]),
  category: z.enum(["branding", "web", "print", "motion", "illustration", "social_media", "packaging"]),
  clientId: z.coerce.number().min(1, "Client required"),
  deadline: z.string().min(1, "Deadline required"),
  budget: z.coerce.number().min(0),
  progress: z.coerce.number().min(0).max(100),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface ProjectsProps {
  onOpenIgnitionModal: () => void;
}

export default function Projects({ onOpenIgnitionModal }: ProjectsProps) {
  const { data: projects, isLoading } = useListProjects();
  const { data: clients } = useListClients();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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

  const filtered = (projects ?? []).filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openCreate() {
    setEditingProject(null);
    form.reset({ name: "", description: "", status: "active", category: "branding", clientId: 0, deadline: "", budget: 0, progress: 0 });
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    form.reset({
      name: project.name,
      description: project.description ?? "",
      status: project.status as ProjectFormData["status"],
      category: project.category as ProjectFormData["category"],
      clientId: project.clientId,
      deadline: project.deadline,
      budget: project.budget,
      progress: project.progress,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: ProjectFormData) {
    if (editingProject) {
      updateProject.mutate(
        { id: editingProject.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Project updated" });
          },
        }
      );
    } else {
      createProject.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
            setDialogOpen(false);
            toast({ title: "Project created" });
          },
        }
      );
    }
  }

  async function handleDelete(id: number) {
    deleteProject.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({ title: "Project deleted" });
        },
      }
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent" data-testid="heading-projects">
            Projects
          </h1>
          <p className="text-muted-foreground text-sm mt-1 tracking-widest uppercase">
            {filtered.length} {filterStatus !== "all" ? filterStatus : "total"}
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

      <motion.div variants={itemVariants} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-white/5 border-white/10"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-projects"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10" data-testid="select-filter-status">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div variants={containerVariants} className="space-y-3">
          {filtered.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              className="group relative rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm p-5 hover:border-white/10 transition-all"
              data-testid={`card-project-${project.id}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold uppercase"
                  style={{
                    background: `${CATEGORY_COLORS[project.category] ?? "#666"}15`,
                    border: `1px solid ${CATEGORY_COLORS[project.category] ?? "#666"}30`,
                    color: CATEGORY_COLORS[project.category] ?? "#666",
                  }}
                >
                  {project.category.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-foreground truncate">{project.name}</h3>
                    <Badge
                      className="text-xs capitalize border-0 px-2"
                      style={{
                        background: `${STATUS_COLORS[project.status] ?? "#666"}15`,
                        color: STATUS_COLORS[project.status] ?? "#666",
                      }}
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      className="text-xs capitalize border-0 px-2"
                      style={{
                        background: `${CATEGORY_COLORS[project.category] ?? "#666"}15`,
                        color: CATEGORY_COLORS[project.category] ?? "#666",
                      }}
                    >
                      {project.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{project.clientName ?? "—"} · Due {project.deadline}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: STATUS_COLORS[project.status] ?? "#00d4ff" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{project.progress}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-foreground">₹{project.budget.toLocaleString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 hover:bg-cyan-500/10 hover:text-cyan-400"
                      onClick={() => openEdit(project)}
                      data-testid={`button-edit-project-${project.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleDelete(project.id)}
                      data-testid={`button-delete-project-${project.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No projects found</p>
            </div>
          )}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0f1e] border-white/10 max-w-lg" data-testid="dialog-project-form">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white/5 border-white/10" data-testid="input-project-name" />
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-project-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-project-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="branding">Branding</SelectItem>
                          <SelectItem value="web">Web</SelectItem>
                          <SelectItem value="print">Print</SelectItem>
                          <SelectItem value="motion">Motion</SelectItem>
                          <SelectItem value="illustration">Illustration</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-project-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.company} — {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-white/5 border-white/10" data-testid="input-project-deadline" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white/5 border-white/10" data-testid="input-project-budget" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress ({field.value}%)</FormLabel>
                    <FormControl>
                      <Input type="range" min={0} max={100} {...field} className="bg-white/5 border-white/10 accent-cyan-400" data-testid="input-project-progress" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" className="flex-1 border border-white/10" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                  disabled={createProject.isPending || updateProject.isPending}
                  data-testid="button-submit-project"
                >
                  {editingProject ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}
