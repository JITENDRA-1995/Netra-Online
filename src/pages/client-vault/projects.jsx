import React, { useState, useEffect } from "react";
import { fetchClientProjects } from "../../supabase/database/clientVault";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Skeleton } from "../../components/ui/skeleton";
import { FolderOpen, Clock, MessageSquare } from "lucide-react";

import { format } from "date-fns";

export function ClientProjects({ currentClient, onTabChange, setSelectedProjectId }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentClient?.id) return;

    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const data = await fetchClientProjects(currentClient.id);
        setProjects(data);
      } catch (err) {
        console.error("Error fetching client projects:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [currentClient]);

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId);
    onTabChange("PROJECT_DETAIL");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-medium tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Manage and track your active and past creative projects.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <div className="h-40 bg-muted/50 animate-pulse" />
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>You don't have any projects yet.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => handleProjectClick(project.id)}
              className="block h-full cursor-pointer group"
            >
              <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all hover:shadow-md flex flex-col h-full">
                <div className="h-40 bg-secondary flex items-center justify-center">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/30 group-hover:text-primary/30 transition-colors" />
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg group-hover:text-primary transition-colors line-clamp-1" title={project.service || project.title}>
                      {project.service || project.title}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4 mt-1">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {(project.status || 'ongoing').replace('_', ' ')}
                    </Badge>
                    {project.category && (
                      <span className="bg-secondary px-2 py-0.5 rounded-md text-[10px] text-muted-foreground">{project.category}</span>
                    )}
                  </div>
                  
                  <div className="mt-auto space-y-4">
                    {project.deadline && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    
                    {(project.service || '').toLowerCase().includes('general support') ? (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/50 opacity-60 select-none">
                          <MessageSquare className="h-3 w-3" />
                          Chat only — no project tracking
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                          <span>Progress</span>
                          <span>{project.progressPercent}%</span>
                        </div>
                        <Progress value={project.progressPercent} className="h-1.5" />
                      </div>
                    )}
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
