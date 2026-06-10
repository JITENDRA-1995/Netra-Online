import React, { useState, useEffect } from "react";
import { fetchClientProjectDetail, fetchClientProjectMedia } from "../../supabase/database/clientVault";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { ArrowLeft, Download, FileImage, Lock, FileText, File } from "lucide-react";

export function ClientProjectAssets({ projectId, onTabChange }) {
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const loadAssetsData = async () => {
      try {
        setIsLoading(true);
        const pDetail = await fetchClientProjectDetail(projectId);
        setProject(pDetail);

        const mediaList = await fetchClientProjectMedia(projectId);
        setAssets(mediaList);
      } catch (err) {
        console.error("Error loading project assets:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssetsData();
  }, [projectId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 client-vault-theme">
      <div>
        <button 
          onClick={() => onTabChange("PROJECT_DETAIL")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </button>
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-medium tracking-tight">Project Assets</h1>
          <p className="text-muted-foreground">View and download deliverables for {project?.title || "..."}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <div className="aspect-square bg-muted/50 animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : assets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
            <FileImage className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No assets have been uploaded for this project yet.</p>
          </div>
        ) : (
          assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset }) {
  const isImage = (asset.fileType || '').toLowerCase().startsWith('image/');
  
  const handleDownload = () => {
    if (asset.downloadUrl) {
      window.open(asset.downloadUrl, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 group flex flex-col bg-card">
      <div className="aspect-square relative bg-secondary/50 flex items-center justify-center p-4">
        {asset.previewUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url(${asset.previewUrl})` }} 
          />
        ) : isImage ? (
          <FileImage className="h-16 w-16 text-muted-foreground/30" />
        ) : (asset.fileType || '').includes('pdf') ? (
          <FileText className="h-16 w-16 text-muted-foreground/30" />
        ) : (
          <File className="h-16 w-16 text-muted-foreground/30" />
        )}

        {!asset.canDownload && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center transition-opacity">
            <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center shadow-sm mb-3 text-muted-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-foreground">Locked Deliverable</p>
            <p className="text-[10px] text-muted-foreground mt-1">Available after completion & payment</p>
          </div>
        )}
        
        {asset.isOriginal && (
          <Badge variant="secondary" className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm border-none">
            Final File
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="font-medium text-sm truncate" title={asset.name}>{asset.name}</h3>
        <div className="flex justify-between items-center mt-1 mb-4 text-xs text-muted-foreground">
          <span>{asset.fileType.split('/')[1]?.toUpperCase() || asset.fileType}</span>
          {asset.fileSizeMb && <span>{asset.fileSizeMb.toFixed(1)} MB</span>}
        </div>
        
        <div className="mt-auto">
          {asset.canDownload ? (
            <Button 
              variant="outline" 
              className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer" 
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          ) : (
            <Button variant="secondary" className="w-full" disabled>
              <Lock className="h-3 w-3 mr-2" /> Locked
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
