"use client";

import { useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Settings, TemplateName } from "@/lib/types";
import { TEMPLATES, TEMPLATE_LABELS } from "@/lib/config";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  profileId: string;
  onSaved: (settings: Settings) => void;
}

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  profileId,
  onSaved,
}: SettingsModalProps) {
  const [form, setForm] = useState({
    business_name: "",
    provider_name: "",
    booking_link: "",
    logo_url: "",
    primary_color: "#0F172A",
    accent_color: "#3B82F6",
    demo_mode: false,
  });
  const [techList, setTechList] = useState<string[]>([]);
  const [newTech, setNewTech] = useState("");
  const [templateForm, setTemplateForm] = useState<Record<string, string>>({ ...TEMPLATES });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      business_name: settings.business_name,
      provider_name: settings.provider_name,
      booking_link: settings.booking_link,
      logo_url: settings.logo_url ?? "",
      primary_color: settings.primary_color ?? "#0F172A",
      accent_color: settings.accent_color ?? "#3B82F6",
      demo_mode: settings.demo_mode ?? false,
    });
    setTechList(settings.techs ?? []);
    setTemplateForm(settings.templates ?? { ...TEMPLATES });
  }, [settings]);

  const addTech = () => {
    const name = newTech.trim();
    if (name && !techList.includes(name)) {
      setTechList((prev) => [...prev, name]);
      setNewTech("");
    }
  };

  const removeTech = (tech: string) => {
    setTechList((prev) => prev.filter((t) => t !== tech));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("profile_id", profileId);
      const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      setForm((f) => ({ ...f, logo_url: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { ...form, techs: techList, templates: templateForm };
      const res = await fetch(`/api/settings?profile=${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Settings saved");
      onSaved({ ...settings, ...body });
      onOpenChange(false);
    } catch (err) {
      console.error("[SettingsModal] save failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Update your business info. These values appear in SMS messages.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
              placeholder="Cuts by Carlos"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="provider_name">Default Provider Name</Label>
            <Input
              id="provider_name"
              value={form.provider_name}
              onChange={(e) => setForm((f) => ({ ...f, provider_name: e.target.value }))}
              placeholder="Carlos"
            />
            <p className="text-xs text-muted-foreground">
              Used in messages when a client has no assigned tech.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="booking_link">Booking Link</Label>
            <Input
              id="booking_link"
              type="url"
              value={form.booking_link}
              onChange={(e) => setForm((f) => ({ ...f, booking_link: e.target.value }))}
              placeholder="https://calendly.com/..."
            />
          </div>

          <Separator />

          {/* Techs */}
          <div className="flex flex-col gap-2">
            <div>
              <Label>Team Members</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your techs — used for filtering clients and message blasts.
              </p>
            </div>

            {/* Chip list */}
            <div className="flex min-h-[28px] flex-wrap gap-1.5">
              {techList.length === 0 ? (
                <span className="text-xs italic text-muted-foreground">No techs added yet.</span>
              ) : (
                techList.map((tech) => (
                  <span
                    key={tech}
                    className="flex items-center gap-1 rounded-full bg-muted py-1 pl-2.5 pr-1.5 text-xs font-medium"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20"
                      aria-label={`Remove ${tech}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add input */}
            <div className="flex gap-2">
              <Input
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add tech name…"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                onClick={addTech}
              >
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Branding */}
          <div className="flex flex-col gap-3">
            <div>
              <Label>Branding</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Logo and colors shown in the sidebar and profile cards.
              </p>
            </div>

            {/* Logo upload */}
            <div className="flex flex-col gap-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-3">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="h-10 w-10 rounded-lg object-cover ring-1 ring-border shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-border">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <label className="cursor-pointer">
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      {uploading ? "Uploading…" : "Choose image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading}
                      onChange={handleLogoUpload}
                    />
                  </label>
                  {form.logo_url && (
                    <button
                      type="button"
                      className="text-left text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setForm((f) => ({ ...f, logo_url: "" }))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Color pickers */}
            <div className="flex gap-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="primary_color">Primary</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primary_color"
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value }))}
                    className="h-8 w-8 cursor-pointer rounded border border-input p-0.5"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{form.primary_color}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="accent_color">Accent</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="accent_color"
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                    className="h-8 w-8 cursor-pointer rounded border border-input p-0.5"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{form.accent_color}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Demo mode */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="demo_mode"
              checked={form.demo_mode}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, demo_mode: checked === true }))}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="demo_mode" className="cursor-pointer">Demo mode</Label>
              <p className="text-xs text-muted-foreground">
                Fire drip messages in minutes instead of days. Turn off before going live.
              </p>
            </div>
          </div>

          <Separator />

          {/* Message Templates */}
          <div className="flex flex-col gap-3">
            <div>
              <Label>Message Templates</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Customize each SMS. Use{" "}
                <code className="rounded bg-muted px-1 text-xs">{"{first_name}"}</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">{"{tech_name}"}</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">{"{booking_link}"}</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">{"{business_name}"}</code>.
              </p>
            </div>

            {(Object.keys(TEMPLATE_LABELS) as TemplateName[]).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={`tpl-${key}`}>{TEMPLATE_LABELS[key]}</Label>
                <textarea
                  id={`tpl-${key}`}
                  rows={3}
                  value={templateForm[key] ?? TEMPLATES[key]}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={TEMPLATES[key]}
                  className="flex min-h-[72px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start text-xs text-muted-foreground"
              onClick={() => setTemplateForm({ ...TEMPLATES })}
            >
              Reset to defaults
            </Button>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? "Saving…" : "Save Settings"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
