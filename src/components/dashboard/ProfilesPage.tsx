"use client";

import { useState } from "react";
import { Building2, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/types";

interface ProfilesPageProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSwitch: (profile: Profile) => void;
  onCreated: (profile: Profile) => void;
  onDeleted: (id: string) => void;
}

export function ProfilesPage({
  profiles,
  activeProfileId,
  onSwitch,
  onCreated,
  onDeleted,
}: ProfilesPageProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", provider_name: "", booking_link: "" });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openDialog = () => {
    setForm({ name: "", provider_name: "", booking_link: "" });
    setShowDialog(true);
  };

  const handleCreate = async () => {
    const name = form.name.trim() || "New Business";
    setCreating(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          provider_name: form.provider_name.trim(),
          booking_link: form.booking_link.trim(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const profile: Profile = await res.json();
      setShowDialog(false);
      onCreated(profile);
      toast.success(`"${profile.name}" created`);
    } catch {
      toast.error("Failed to create profile");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (profile: Profile) => {
    if (!confirm(`Delete "${profile.name}" and all its clients, messages, and drip jobs? This cannot be undone.`)) return;
    setDeletingId(profile.id);
    try {
      const res = await fetch(`/api/profiles/${profile.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onDeleted(profile.id);
      toast.success(`Profile "${profile.name}" deleted`);
    } catch {
      toast.error("Failed to delete profile");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mt-5 max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Business Profiles</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Each profile has its own clients, messages, and drip settings.
          </p>
        </div>
      </div>

      {/* Profile cards */}
      <div className="flex flex-col gap-3">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          return (
            <div
              key={profile.id}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                isActive ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden"
                style={{
                  background: profile.primary_color ?? (isActive ? "var(--primary)" : "var(--muted)"),
                  color: profile.primary_color ? "#fff" : isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{profile.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {profile.primary_color && profile.primary_color !== "#0F172A" && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-border"
                      style={{ background: profile.primary_color }}
                      title={`Primary: ${profile.primary_color}`}
                    />
                  )}
                  {profile.accent_color && profile.accent_color !== "#3B82F6" && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-border"
                      style={{ background: profile.accent_color }}
                      title={`Accent: ${profile.accent_color}`}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isActive ? (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Check className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onSwitch(profile)}
                  >
                    Switch
                  </Button>
                )}
                {profiles.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(profile)}
                    disabled={deletingId === profile.id}
                    title="Delete profile"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create new profile */}
      <div className="mt-4">
        <Button
          size="sm"
          className="h-9 gap-1.5"
          onClick={openDialog}
        >
          <Plus className="h-3.5 w-3.5" />
          New Business
        </Button>
      </div>

      {/* Setup dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new business</DialogTitle>
            <DialogDescription>
              Set up the basics — you can update everything later in Settings.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-profile-name">Business name</Label>
              <Input
                id="new-profile-name"
                placeholder="e.g. Downtown Cuts"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-provider-name">
                Your name / provider name{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="new-provider-name"
                placeholder="e.g. Marcus"
                value={form.provider_name}
                onChange={(e) => setForm((f) => ({ ...f, provider_name: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Used to personalize SMS messages.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-booking-link">
                Booking link{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="new-booking-link"
                placeholder="https://calendly.com/…"
                value={form.booking_link}
                onChange={(e) => setForm((f) => ({ ...f, booking_link: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create Business"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
