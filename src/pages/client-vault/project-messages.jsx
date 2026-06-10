import React, { useState, useEffect, useRef } from "react";
import { 
  fetchClientProjectDetail, 
  fetchClientProjectChats, 
  sendClientChatMessage, 
  subscribeToClientChats 
} from "../../supabase/database/clientVault";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export function ClientProjectMessages({ 
  projectId, 
  currentClient, 
  onTabChange 
}) {
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    // 1. Load project details
    fetchClientProjectDetail(projectId).then(setProject).catch(console.error);

    // 2. Load initial chat messages
    const loadChats = async () => {
      try {
        setIsLoading(true);
        const data = await fetchClientProjectChats(projectId, currentClient?.name);
        setMessages(data);
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [projectId, currentClient]);

  useEffect(() => {
    if (!projectId) return;

    // 3. Subscribe to real-time chat updates
    const subscription = subscribeToClientChats(projectId, currentClient?.name, (newMsg) => {
      setMessages(prev => {
        // Prevent duplicate messages in the UI list
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [projectId, currentClient]);

  useEffect(() => {
    // Scroll to bottom when messages load or change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await sendClientChatMessage(projectId, currentClient?.name, content.trim());
      setContent("");
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 client-vault-theme">
      <div className="mb-4">
        <button 
          onClick={() => onTabChange("PROJECT_DETAIL")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2 transition-colors bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </button>
        <h1 className="text-2xl font-serif font-medium tracking-tight">Messages</h1>
        <p className="text-muted-foreground text-sm">{project?.title || "..."}</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border/50 bg-card">
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <MessageSquare className="h-10 w-10 opacity-20" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isClient = message.senderType === 'client';
              return (
                <div key={message.id} className={`flex gap-3 max-w-[85%] ${isClient ? 'ml-auto flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className={isClient ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                      {message.senderName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`space-y-1 ${isClient ? 'items-end' : ''}`}>
                    <div className={`flex items-baseline gap-2 ${isClient ? 'justify-end' : ''}`}>
                      <span className="text-xs font-medium">{message.senderName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {message.createdAt ? format(new Date(message.createdAt), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      isClient 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                        : 'bg-secondary text-secondary-foreground rounded-tl-sm'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <div className="p-4 bg-background border-t border-border/50">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none border-border/60 focus-visible:ring-primary"
              disabled={isSending}
            />
            <Button 
              size="icon" 
              className="h-[60px] w-[60px] shrink-0 rounded-xl cursor-pointer"
              onClick={handleSend}
              disabled={!content.trim() || isSending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
