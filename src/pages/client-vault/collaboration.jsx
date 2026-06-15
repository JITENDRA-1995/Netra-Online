import React, { useState, useEffect, useRef } from "react";
import { 
  fetchClientProjects, 
  fetchClientProjectDetail,
  fetchClientProjectChats, 
  sendClientChatMessage, 
  subscribeToClientChats,
  clearClientProjectChats,
  fetchClientProjectMedia
} from "../../supabase/database/clientVault";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Download, 
  FileImage, 
  FileText, 
  File, 
  Lock, 
  FolderOpen, 
  Clock, 
  Menu, 
  Paperclip,
  CheckCircle,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { format } from "date-fns";

export function ClientCollaboration({ 
  currentClient, 
  selectedProjectId, 
  setSelectedProjectId 
}) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // Loading states
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isChatsLoading, setIsChatsLoading] = useState(false);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  
  // Chat input
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Responsive sidebar toggles
  const [showMobileProjects, setShowMobileProjects] = useState(false);
  const [showMobileAssets, setShowMobileAssets] = useState(false);
  
  const messagesEndRef = useRef(null);

  // 1. Fetch all client projects on mount
  useEffect(() => {
    if (!currentClient?.id) return;

    const loadProjects = async () => {
      try {
        setIsProjectsLoading(true);
        const data = await fetchClientProjects(currentClient.id);
        setProjects(data);
        
        // Select initial project
        if (data.length > 0) {
          const defaultSelect = selectedProjectId 
            ? data.find(p => p.id === selectedProjectId) || data[0]
            : data[0];
          setSelectedProject(defaultSelect);
          if (!selectedProjectId) {
            setSelectedProjectId(defaultSelect.id);
          }
        }
      } catch (err) {
        console.error("Error loading client projects for collaboration:", err);
      } finally {
        setIsProjectsLoading(false);
      }
    };

    loadProjects();
  }, [currentClient, selectedProjectId, setSelectedProjectId]);

  // Sync selectedProject when selectedProjectId changes from parent component
  useEffect(() => {
    if (projects.length > 0 && selectedProjectId) {
      const match = projects.find(p => p.id === selectedProjectId);
      if (match && match.id !== selectedProject?.id) {
        setSelectedProject(match);
      }
    }
  }, [selectedProjectId, projects]);

  // 2. Fetch chats and assets when selected project changes
  useEffect(() => {
    if (!selectedProject?.id) {
      setMessages([]);
      setAssets([]);
      return;
    }

    const loadChatsAndAssets = async () => {
      // Load Chats
      try {
        setIsChatsLoading(true);
        const chatData = await fetchClientProjectChats(selectedProject.id, currentClient?.name);
        setMessages(chatData);
      } catch (err) {
        console.error("Error loading chats:", err);
      } finally {
        setIsChatsLoading(false);
      }

      // Load Assets
      try {
        setIsAssetsLoading(true);
        const assetData = await fetchClientProjectMedia(selectedProject.id);
        setAssets(assetData);
      } catch (err) {
        console.error("Error loading assets:", err);
      } finally {
        setIsAssetsLoading(false);
      }
    };

    loadChatsAndAssets();
    
    // Auto-close drawers on project switch
    setShowMobileProjects(false);
    setShowMobileAssets(false);
  }, [selectedProject, currentClient]);

  // 3. Real-time chat subscriptions
  useEffect(() => {
    if (!selectedProject?.id) return;

    const subscription = subscribeToClientChats(selectedProject.id, currentClient?.name, (newMsg) => {
      if (newMsg.eventType === 'DELETE') {
        setMessages(prev => prev.filter(m => m.id !== newMsg.id));
        return;
      }
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedProject, currentClient]);

  // Scroll to chat bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || isSending || !selectedProject?.id) return;

    setIsSending(true);
    try {
      const data = await sendClientChatMessage(selectedProject.id, currentClient?.name, content.trim());
      setContent("");
      if (data) {
        setMessages(prev => {
          const isClient = (data.sender || '').toLowerCase() === 'client' || 
                           (currentClient?.name && (data.sender || '').toLowerCase() === currentClient.name.toLowerCase());
          const newMsg = {
            id: data.id,
            senderName: data.sender,
            senderType: isClient ? 'client' : 'admin',
            content: data.message,
            createdAt: data.created_at,
            attachmentUrl: null,
            attachmentName: null
          };
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (!selectedProject?.id) return;
    const confirmClear = window.confirm("Are you sure you want to permanently clear the chat history for this project?");
    if (!confirmClear) return;
    
    try {
      await clearClientProjectChats(selectedProject.id, currentClient?.name);
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    }
  };

  const handleProjectSelect = (proj) => {
    setSelectedProject(proj);
    setSelectedProjectId(proj.id);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 client-vault-theme relative overflow-hidden">
      
      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-3 bg-card border border-border/50 rounded-2xl mb-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowMobileProjects(prev => !prev)}
          className="gap-2 cursor-pointer text-xs"
        >
          <Menu className="h-4 w-4" />
          <span>Projects ({projects.length})</span>
        </Button>
        
        <div className="text-center max-w-[150px] truncate">
          <span className="font-semibold text-sm block truncate">
            {selectedProject ? selectedProject.title : "No Project Selected"}
          </span>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowMobileAssets(prev => !prev)}
          className="gap-2 cursor-pointer text-xs"
          disabled={!selectedProject}
        >
          <span>Assets ({assets.length})</span>
          <Paperclip className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex gap-4 overflow-hidden h-full relative">
        
        {/* Pane 1: Projects List Sidebar (Desktop) */}
        <div className={`
          ${showMobileProjects ? 'absolute inset-0 z-20 bg-background/95 p-4' : 'hidden'}
          md:flex md:relative md:bg-transparent md:p-0 md:inset-auto md:z-auto
          flex-col w-full md:w-64 shrink-0 overflow-hidden border border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-4 space-y-4
        `}>
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4" /> Projects
            </h2>
            {showMobileProjects && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMobileProjects(false)}
                className="md:hidden text-xs"
              >
                Close
              </Button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isProjectsLoading ? (
              Array(3).fill(0).map((_, idx) => (
                <div key={idx} className="p-3 bg-secondary/20 rounded-xl animate-pulse space-y-2">
                  <div className="h-4 bg-muted w-2/3 rounded" />
                  <div className="h-3 bg-muted w-1/2 rounded" />
                </div>
              ))
            ) : projects.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                No active projects found.
              </div>
            ) : (
              projects.map(proj => {
                const isActive = proj.id === selectedProject?.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleProjectSelect(proj)}
                    className={`w-full text-left p-3 rounded-xl transition-all border outline-none cursor-pointer flex flex-col gap-2 ${
                      isActive 
                        ? "bg-primary/10 border-primary/30 text-primary shadow-sm" 
                        : "bg-secondary/10 border-transparent hover:bg-secondary/35 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full gap-2">
                      <span className="font-medium text-xs md:text-sm line-clamp-1 flex-1">{proj.title}</span>
                      <Badge variant="outline" className="text-[9px] uppercase px-1 py-0.2 shrink-0 border-border/50">
                        {proj.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{proj.progressPercent}%</span>
                      </div>
                      <Progress value={proj.progressPercent} className="h-1" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Pane 2: Conversation Box (Center) */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border/40 bg-card/65 backdrop-blur-md rounded-2xl">
          {selectedProject ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-border/50 bg-secondary/5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="capitalize text-[11px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                      {selectedProject.category || "design"}
                    </span>
                    {selectedProject.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {format(new Date(selectedProject.deadline), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleClearChat}
                    title="Clear Chat History"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/15 rounded-xl h-8 w-8 p-0 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages Panel */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-background/20">
                {isChatsLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 py-10">
                    <MessageSquare className="h-10 w-10 opacity-20 text-primary" />
                    <p className="text-sm font-medium">No messages in this chat stream yet.</p>
                    <p className="text-xs opacity-70">Type a message below to start collaboration.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isClient = message.senderType === 'client';
                    return (
                      <div 
                        key={message.id} 
                        className={`flex gap-3 max-w-[85%] ${isClient ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <Avatar className="h-8 w-8 mt-1 border border-border shrink-0">
                          <AvatarFallback className={isClient ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground"}>
                            {message.senderName?.charAt(0).toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`space-y-1 ${isClient ? 'items-end' : ''}`}>
                          <div className={`flex items-baseline gap-2 ${isClient ? 'justify-end' : ''}`}>
                            <span className="text-xs font-semibold text-foreground">{message.senderName}</span>
                            <span className="text-[9px] text-muted-foreground">
                              {message.createdAt ? format(new Date(message.createdAt), 'MMM d, h:mm a') : ''}
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                            isClient 
                              ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-sm' 
                              : 'bg-secondary/40 border border-border/30 text-foreground rounded-tl-sm'
                          }`}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-card border-t border-border/50">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                  <Textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
                    className="min-h-[50px] max-h-[150px] resize-none border-border/50 focus-visible:ring-primary rounded-xl text-sm"
                    disabled={isSending}
                  />
                  <Button 
                    size="icon" 
                    className="h-[50px] w-[50px] shrink-0 rounded-xl cursor-pointer"
                    onClick={handleSend}
                    disabled={!content.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
              <FolderOpen className="h-12 w-12 opacity-25 mb-3" />
              <p className="text-sm font-semibold">No active project selected</p>
              <p className="text-xs mt-1">Please select or start a project to initiate collaboration.</p>
            </div>
          )}
        </Card>

        {/* Pane 3: Assets Bar (Right Panel) */}
        <div className={`
          ${showMobileAssets ? 'absolute inset-0 z-20 bg-background/95 p-4' : 'hidden'}
          lg:flex lg:relative lg:bg-transparent lg:p-0 lg:inset-auto lg:z-auto
          flex-col w-full lg:w-72 shrink-0 overflow-hidden border border-border/40 bg-card/45 backdrop-blur-md rounded-2xl p-4 space-y-4
        `}>
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Paperclip className="h-4 w-4" /> Project Assets
            </h2>
            {showMobileAssets && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMobileAssets(false)}
                className="lg:hidden text-xs"
              >
                Close
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isAssetsLoading ? (
              Array(2).fill(0).map((_, idx) => (
                <div key={idx} className="border border-border/40 rounded-xl p-3 animate-pulse space-y-3">
                  <div className="aspect-video bg-muted rounded-lg" />
                  <div className="h-4 bg-muted w-3/4 rounded" />
                </div>
              ))
            ) : !selectedProject ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                Select a project to view deliverables.
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-12 flex flex-col items-center justify-center space-y-2">
                <FileImage className="h-8 w-8 opacity-20" />
                <p>No deliverables uploaded yet.</p>
              </div>
            ) : (
              assets.map(asset => (
                <CollaborationAssetCard key={asset.id} asset={asset} />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function CollaborationAssetCard({ asset }) {
  const isImage = (asset.fileType || '').toLowerCase().startsWith('image/') || 
                  (asset.name || '').match(/\.(jpg|jpeg|png|webp|gif)$/i);
  
  const handleDownload = () => {
    if (asset.downloadUrl) {
      window.open(asset.downloadUrl, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden border border-border/50 flex flex-col bg-background/55 hover:border-primary/20 transition-all">
      <div className="aspect-[4/3] relative bg-secondary/35 flex items-center justify-center p-2 overflow-hidden border-b border-border/30">
        {asset.previewUrl ? (
          <img 
            src={asset.previewUrl} 
            alt={asset.name}
            className="w-full h-full object-cover rounded" 
          />
        ) : isImage ? (
          <FileImage className="h-10 w-10 text-muted-foreground/30" />
        ) : (asset.fileType || '').includes('pdf') ? (
          <FileText className="h-10 w-10 text-muted-foreground/30" />
        ) : (
          <File className="h-10 w-10 text-muted-foreground/30" />
        )}

        {!asset.canDownload && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center">
            <Lock className="h-4 w-4 text-muted-foreground mb-1" />
            <span className="text-[10px] font-semibold text-foreground block">Locked Deliverable</span>
            <span className="text-[8px] text-muted-foreground block mt-0.5">Available after full payment</span>
          </div>
        )}
      </div>
      
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="space-y-0.5">
          <h4 className="font-semibold text-xs text-foreground truncate" title={asset.name}>
            {asset.name}
          </h4>
          <span className="text-[9px] text-muted-foreground block uppercase font-medium">
            {asset.fileType.split('/')[1] || asset.fileType}
          </span>
        </div>
        
        <div>
          {asset.canDownload ? (
            <Button 
              variant="outline" 
              size="sm"
              className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors text-[11px] h-8 cursor-pointer gap-1" 
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" /> Download
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="w-full text-[11px] h-8" disabled>
              <Lock className="h-3 w-3 mr-1" /> Locked
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
