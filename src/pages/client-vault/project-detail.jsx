import React, { useState, useEffect } from "react";
import { fetchClientProjectDetail } from "../../supabase/database/clientVault";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { 
  MessageSquare, 
  FolderOpen, 
  CheckCircle2, 
  Circle, 
  ArrowLeft,
  Calendar,
  Tag,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";

export function ClientProjectDetail({ 
  projectId, 
  onTabChange, 
  setSelectedProjectId 
}) {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const loadProjectDetail = async () => {
      try {
        setIsLoading(true);
        const data = await fetchClientProjectDetail(projectId);
        setProject(data);
      } catch (err) {
        console.error("Error loading project detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectDetail();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>Project not found.</p>
        <Button onClick={() => onTabChange("PROJECTS")} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <button 
          onClick={() => onTabChange("PROJECTS")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-serif font-medium tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground max-w-2xl">{project.description || 'No description provided.'}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-border cursor-pointer"
              onClick={() => {
                setSelectedProjectId(project.id);
                onTabChange("MESSAGES");
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Messages
            </Button>
            <Button 
              className="cursor-pointer"
              onClick={() => {
                setSelectedProjectId(project.id);
                onTabChange("ASSETS");
              }}
            >
              <FolderOpen className="h-4 w-4 mr-2" /> Assets
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Section */}
          <Card className="border-border/50">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-medium mb-1">Project Progress</h2>
                  <p className="text-sm text-muted-foreground">Current phase: <span className="capitalize font-medium text-foreground">{project.status.replace('_', ' ')}</span></p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-serif text-primary">{project.progressPercent}%</div>
                </div>
              </div>
              <Progress value={project.progressPercent} className="h-3" />
            </CardContent>
          </Card>

          {/* Milestones */}
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-medium">Timeline & Milestones</h2>
            <Card className="border-border/50">
              <CardContent className="p-6">
                {project.milestones && project.milestones.length > 0 ? (
                  <div className="space-y-8">
                    {project.milestones.map((milestone, index) => (
                      <div key={milestone.id || index} className="relative flex gap-6">
                        {/* Timeline connector line */}
                        {index !== project.milestones.length - 1 && (
                          <div className="absolute left-3 top-8 bottom-[-2rem] w-px bg-border/60"></div>
                        )}
                        
                        <div className="relative z-10 flex-shrink-0 mt-1">
                          {milestone.isCompleted ? (
                            <CheckCircle2 className="h-6 w-6 text-primary bg-background rounded-full" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground bg-background rounded-full" />
                          )}
                        </div>
                        
                        <div className={"space-y-1 pb-2 " + (milestone.isCompleted ? "opacity-100" : "opacity-70")}>
                          <h3 className="font-medium text-lg">{milestone.title}</h3>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          )}
                          {milestone.isCompleted && milestone.completedAt && (
                            <p className="text-xs text-primary font-medium mt-2">
                              Completed on {format(new Date(milestone.completedAt), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No milestones defined for this project.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {/* Project Details */}
          <Card className="border-border/50 bg-secondary/20">
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.category && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Category</p>
                    <p className="text-sm">{project.category}</p>
                  </div>
                </div>
              )}
              
              {project.deadline && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Deadline</p>
                    <p className="text-sm">{format(new Date(project.deadline), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Payment Status</p>
                  <Badge variant={project.isPaid ? "default" : "secondary"} className="mt-1">
                    {project.isPaid ? 'Fully Paid' : 'Pending Payment'}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 mt-4 text-xs text-muted-foreground">
                Created on {format(new Date(project.createdAt), 'MMM d, yyyy')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
