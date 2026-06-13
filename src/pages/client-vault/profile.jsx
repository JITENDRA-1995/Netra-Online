import React, { useState, useEffect } from "react";
import { updateClientVaultProfile } from "../../supabase/database/clientVault";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";

export function ClientProfile({ currentClient, setCurrentClient }) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    company: "Client Account",
    website: "",
    bio: ""
  });

  useEffect(() => {
    if (currentClient) {
      const pending = currentClient.pending_profile_update;
      setFormData({
        name: pending?.name || currentClient.name || "",
        phone: pending?.phone || currentClient.phone || "",
        address: pending?.address || currentClient.address || "",
        company: "Client Account",
        website: "",
        bio: ""
      });
    }
  }, [currentClient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name is required.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = await updateClientVaultProfile(currentClient.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim()
      });

      // Update the parent state
      setCurrentClient(prev => ({
        ...prev,
        ...updatedData
      }));

      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully.",
      });
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const pending = currentClient?.pending_profile_update;
  const isDirty = 
    formData.name !== (pending?.name || currentClient?.name || "") ||
    formData.phone !== (pending?.phone || currentClient?.phone || "") ||
    formData.address !== (pending?.address || currentClient?.address || "");

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500 client-vault-theme">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-medium tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your personal information and contact details.</p>
      </div>

      {currentClient?.pending_profile_update && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>Profile changes are pending admin approval. You can still modify your request or cancel it.</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSaving}
            className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 text-2xs py-1 px-3 h-7 rounded-lg font-bold border border-amber-500/20 w-fit cursor-pointer transition-all self-end sm:self-auto"
            onClick={async () => {
              setIsSaving(true);
              try {
                await updateClientVaultProfile(currentClient.id, null);
                setCurrentClient(prev => ({
                  ...prev,
                  pending_profile_update: null
                }));
                toast({
                  title: "Request Cancelled",
                  description: "Your pending profile updates have been discarded successfully.",
                });
              } catch (err) {
                console.error(err);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to discard pending changes.",
                });
              } finally {
                setIsSaving(false);
              }
            }}
          >
            Cancel Request
          </Button>
        </div>
      )}

      <div className="grid gap-8">
        <Card className="border-border/50 bg-card overflow-hidden">
          <div className="h-32 bg-secondary/50 border-b border-border/50 relative">
            <div className="absolute -bottom-10 left-8">
              <Avatar className="h-24 w-24 border-4 border-card bg-card shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-serif">
                  {currentClient?.name?.charAt(0).toUpperCase() || "C"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardHeader className="pt-16 pb-4">
            <CardTitle className="text-xl">{currentClient?.name}</CardTitle>
            <CardDescription>{currentClient?.email}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <CardDescription>This information is used for invoices and communication.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Full Name</label>
                  <Input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="bg-background border-border/60" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Company Name</label>
                  <Input 
                    name="company" 
                    value={formData.company} 
                    disabled
                    className="bg-background border-border/60 opacity-60" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Phone Number</label>
                  <Input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className="bg-background border-border/60" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Website</label>
                  <Input 
                    name="website" 
                    value={formData.website} 
                    onChange={handleChange} 
                    placeholder="https://" 
                    className="bg-background border-border/60" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Billing Address</label>
                <Textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  className="bg-background border-border/60 resize-none" 
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Company Bio / Notes</label>
                <Textarea 
                  name="bio" 
                  value={formData.bio} 
                  onChange={handleChange} 
                  className="bg-background border-border/60 resize-none" 
                  rows={4}
                  placeholder="Tell us a bit about your brand..."
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isSaving || !isDirty}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
