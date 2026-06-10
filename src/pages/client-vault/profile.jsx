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
      setFormData({
        name: currentClient.name || "",
        phone: currentClient.phone || "",
        address: currentClient.address || "",
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

  const isDirty = 
    formData.name !== (currentClient?.name || "") ||
    formData.phone !== (currentClient?.phone || "") ||
    formData.address !== (currentClient?.address || "");

  return (
    <div className="space-y-8 max-w-3xl animate-in fade-in duration-500 client-vault-theme">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-medium tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your personal information and contact details.</p>
      </div>

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
