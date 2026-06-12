import React, { useState, useEffect } from "react";
import { fetchClientDashboardSummary, fetchClientProjects } from "../../supabase/database/clientVault";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Skeleton } from "../../components/ui/skeleton";
import { 
  FolderOpen, 
  CheckCircle2, 
  Receipt, 
  MessageSquare,
  ArrowRight,
  Clock,
  FileText
} from "lucide-react";
import { format } from "date-fns";

export function ClientDashboard({ currentClient, onTabChange, setSelectedProjectId }) {
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    if (!currentClient?.id) return;

    const loadData = async () => {
      try {
        setIsLoadingSummary(true);
        const summ = await fetchClientDashboardSummary(currentClient.id);
        setSummary(summ);
      } catch (err) {
        console.error("Error loading dashboard summary:", err);
      } finally {
        setIsLoadingSummary(false);
      }

      try {
        setIsLoadingProjects(true);
        const projs = await fetchClientProjects(currentClient.id);
        setProjects(projs);
      } catch (err) {
        console.error("Error loading projects:", err);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadData();
  }, [currentClient]);

  const activeProjects = projects.filter(p => !['completed', 'cancelled'].includes((p.status || '').toLowerCase()));

  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId);
    onTabChange("PROJECT_DETAIL");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-medium tracking-tight">
          Welcome back, {currentClient?.name || "Visionary"}!
        </h1>
        <p className="text-muted-foreground">
          Your hub for everything creative. Track your active projects, view design concepts, and manage your invoices below.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Projects" 
          value={summary?.activeProjects} 
          icon={<FolderOpen className="h-4 w-4 text-primary" />} 
          isLoading={isLoadingSummary} 
        />
        <StatCard 
          title="Completed Projects" 
          value={summary?.completedProjects} 
          icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />} 
          isLoading={isLoadingSummary} 
        />
        <StatCard 
          title="Pending Invoices" 
          value={summary?.pendingInvoices} 
          icon={<Receipt className="h-4 w-4 text-destructive" />} 
          isLoading={isLoadingSummary} 
        />
        <StatCard 
          title="Total Messages" 
          value={summary?.totalMessages} 
          icon={<MessageSquare className="h-4 w-4 text-primary" />} 
          isLoading={isLoadingSummary} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-medium">Active Projects</h2>
            <button 
              onClick={() => onTabChange("PROJECTS")}
              className="text-sm text-primary hover:underline flex items-center gap-1 font-medium bg-transparent border-none cursor-pointer"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          
          <div className="space-y-4">
            {isLoadingProjects ? (
              Array(2).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : activeProjects.length === 0 ? (
              <Card className="border-dashed bg-transparent shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-3 text-muted-foreground">
                  <FolderOpen className="h-8 w-8 opacity-20" />
                  <p>No active projects at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              activeProjects.slice(0, 3).map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => handleProjectClick(project.id)}
                  className="block"
                >
                  <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h3 className="font-medium text-lg group-hover:text-primary transition-colors">{project.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {project.category && <span className="bg-secondary px-2 py-0.5 rounded-md text-xs">{project.category}</span>}
                            {project.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due {format(new Date(project.deadline), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{project.progressPercent}%</span>
                        </div>
                        <Progress value={project.progressPercent} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-medium">Recent Activity</h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              {isLoadingSummary ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : summary?.recentActivity && summary.recentActivity.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {summary.recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 flex gap-4 hover:bg-muted/50 transition-colors">
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</span>
                          {activity.projectTitle && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{activity.projectTitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No recent activity.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, isLoading }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-serif">{value || 0}</div>
        )}
      </CardContent>
    </Card>
  );
}

function getActivityIcon(type) {
  switch (type) {
    case 'message': return <MessageSquare className="h-4 w-4 text-primary" />;
    case 'milestone': return <CheckCircle2 className="h-4 w-4 text-primary" />;
    case 'asset': return <FolderOpen className="h-4 w-4 text-primary" />;
    case 'invoice': return <Receipt className="h-4 w-4 text-destructive" />;
    case 'status_change': return <FileText className="h-4 w-4 text-muted-foreground" />;
    default: return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
  }
}
