"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DashboardSidebar, type DashboardSection } from "@/components/ui/modern-side-bar";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { ROIBanner } from "@/components/dashboard/ROIBanner";
import { ClientTable } from "@/components/dashboard/ClientTable";
import { ClientDetailPanel } from "@/components/dashboard/ClientDetailPanel";
import { ActionBar } from "@/components/dashboard/ActionBar";
import { DripPanel } from "@/components/dashboard/DripPanel";
import { MessageLog } from "@/components/dashboard/MessageLog";
import { ProfilesPage } from "@/components/dashboard/ProfilesPage";
import { AddClientModal } from "@/components/modals/AddClientModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import { ImportModal } from "@/components/modals/ImportModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { SettingsPage } from "@/components/dashboard/SettingsPage";
import { withComputedFields } from "@/lib/utils";
import type { Client, Message, Settings, Stats, DripStep, Profile } from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  business_name: "My Business",
  provider_name: "",
  booking_link: "",
  drip_sequence: [],
  techs: [],
};

const DEFAULT_STATS: Stats = { total_clients: 0, total_sent: 0, sent_today: 0, opt_outs: 0, response_rate: 0, replies: 0, booked: 0 };

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [blasting, setBlasting] = useState(false);
  const [dripping, setDripping] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSection>("clients");
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearMode, setClearMode] = useState<"messages" | "all">("all");

  // Derived early so it's available to useEffects below
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  // ── Profiles ───────────────────────────────────────────────────────────────

  const fetchProfiles = useCallback(async () => {
    const res = await fetch("/api/profiles");
    const data: Profile[] = await res.json();
    setProfiles(data);
    if (data.length > 0) {
      const stored = localStorage.getItem("activeProfileId");
      const valid = stored && data.some((p) => p.id === stored);
      setActiveProfileId((prev) => prev ?? (valid ? stored : data[0].id));
    } else {
      setActiveSection("profiles");
    }
    setProfilesLoaded(true);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ── Data fetching (all scoped by activeProfileId) ──────────────────────────

  const fetchClients = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/clients?profile=${profileId}`);
    const data = await res.json();
    setClients(withComputedFields(Array.isArray(data) ? data : []));
  }, []);

  const fetchMessages = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/messages?profile=${profileId}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }, []);

  const fetchStats = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/stats?profile=${profileId}`);
    const data = await res.json();
    setStats(data);
  }, []);

  const fetchSettings = useCallback(async (profileId: string) => {
    const res = await fetch(`/api/settings?profile=${profileId}`);
    const data = await res.json();
    setSettings(data);
  }, []);

  // Persist active profile across page refreshes
  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem("activeProfileId", activeProfileId);
    }
  }, [activeProfileId]);

  // Reload all data whenever active profile changes
  useEffect(() => {
    if (!activeProfileId) return;
    fetchClients(activeProfileId);
    fetchMessages(activeProfileId);
    fetchStats(activeProfileId);
    fetchSettings(activeProfileId);
    setSelectedIds(new Set());
  }, [activeProfileId, fetchClients, fetchMessages, fetchStats, fetchSettings]);

  // Poll stats every 5 seconds
  useEffect(() => {
    if (!activeProfileId) return;
    const id = setInterval(() => fetchStats(activeProfileId), 5000);
    return () => clearInterval(id);
  }, [activeProfileId, fetchStats]);

  // In demo mode, drive the cron locally — process pending drip jobs every 30s
  useEffect(() => {
    if (!activeProfile?.demo_mode || !activeProfileId) return;
    const id = setInterval(async () => {
      await fetch("/api/drip/process", { method: "POST" });
      await Promise.all([fetchMessages(activeProfileId), fetchStats(activeProfileId)]);
    }, 30_000);
    return () => clearInterval(id);
  }, [activeProfile?.demo_mode, activeProfileId, fetchMessages, fetchStats]);

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleClient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(clients.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleBlast = async (template: string) => {
    if (!selectedIds.size || !activeProfileId) return;
    setBlasting(true);
    try {
      const res = await fetch("/api/blast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_ids: [...selectedIds], template, profile_id: activeProfileId }),
      });
      const data = await res.json();
      if (data.sent > 0) {
        toast.success(`💥 ${data.sent}/${data.total} texts sent!`);
      } else {
        const firstError = data.results?.[0]?.error ?? "Unknown error";
        toast.error(`Send failed: ${firstError}`);
      }
      setSelectedIds(new Set());
      await Promise.all([fetchMessages(activeProfileId), fetchStats(activeProfileId)]);
    } catch {
      toast.error("Blast failed");
    } finally {
      setBlasting(false);
    }
  };

  const handleDrip = async () => {
    if (!selectedIds.size || !activeProfileId) return;
    setDripping(true);
    try {
      const res = await fetch("/api/drip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_ids: [...selectedIds], profile_id: activeProfileId }),
      });
      const data = await res.json();
      toast.success(
        `⏱ Drip started for ${selectedIds.size} client${selectedIds.size > 1 ? "s" : ""}. ${data.scheduled} messages queued.`
      );
      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to start drip");
    } finally {
      setDripping(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!activeProfileId) return;
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await Promise.all([fetchClients(activeProfileId), fetchStats(activeProfileId)]);
    } catch {
      toast.error("Failed to delete client");
    }
  };

  const handleMarkReturned = async (id: string) => {
    if (!activeProfileId) return;
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: client.first_name,
          phone: client.phone,
          last_visit: today,
          cadence_days: client.cadence_days,
          tech: client.tech,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Marked as returned today");
      await fetchClients(activeProfileId);
    } catch {
      toast.error("Failed to update last visit");
    }
  };

  const handleSaveDrip = async (sequence: DripStep[]) => {
    if (!activeProfileId) return;
    const res = await fetch(`/api/settings?profile=${activeProfileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drip_sequence: sequence }),
    });
    if (!res.ok) throw new Error("Save failed");
    setSettings((s) => ({ ...s, drip_sequence: sequence }));
  };

  const openClearMessages = () => { setClearMode("messages"); setClearModalOpen(true); };
  const openClearAll = () => { setClearMode("all"); setClearModalOpen(true); };

  const handleClearConfirm = async () => {
    if (!activeProfileId) return;
    setClearModalOpen(false);
    await fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: activeProfileId, mode: clearMode }),
    });
    await Promise.all([fetchClients(activeProfileId), fetchMessages(activeProfileId), fetchStats(activeProfileId)]);
    setSelectedIds(new Set());
    toast.success(clearMode === "all" ? "All data cleared" : "Messages cleared");
  };

  // ── Profile switching ──────────────────────────────────────────────────────

  const handleSwitchProfile = (profile: Profile) => {
    setActiveProfileId(profile.id);
    setActiveSection("clients");
    toast.success(`Switched to "${profile.name}"`);
  };

  const handleProfileCreated = (profile: Profile) => {
    setProfiles((prev) => [...prev, profile]);
    setActiveProfileId(profile.id);
    setActiveSection("clients");
  };

  const handleProfileDeleted = (id: string) => {
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (activeProfileId === id && next.length > 0) {
        setActiveProfileId(next[0].id);
      }
      return next;
    });
  };

  // ── Apply per-profile branding via CSS variables ───────────────────────────

  useEffect(() => {
    if (!activeProfile) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", activeProfile.primary_color ?? "#0F172A");
    root.style.setProperty("--ring", activeProfile.primary_color ?? "#0F172A");
  }, [activeProfile?.primary_color, activeProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived data ───────────────────────────────────────────────────────────

  const clientTechs = [...new Set(clients.map((c) => c.tech).filter(Boolean) as string[])].sort();
  const baseTechs = settings.techs?.length > 0 ? settings.techs : clientTechs;
  const providerName = settings.provider_name?.trim();
  const techs = providerName && !baseTechs.includes(providerName)
    ? [providerName, ...baseTechs]
    : baseTechs;
  const overdueCount = clients.filter((c) => c.visit_status === "overdue").length;
  const repliedClientIds = new Set(
    messages.filter((m) => m.direction === "inbound").map((m) => m.client_id)
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        businessName={activeProfile?.name ?? ""}
        logoUrl={activeProfile?.logo_url}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <main className="px-6 py-6 animate-fade-in">
          {!profilesLoaded ? null : (<>
          {/* Topbar */}
          <div className="flex items-center justify-between pb-4">
            <h1 className="text-xl font-semibold">{activeProfile?.name ?? ""}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
                <Upload className="mr-1.5 h-4 w-4" />
                Import
              </Button>
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>

          {/* ROI banner — sticky, only visible when overdue clients exist */}
          <div className="sticky top-0 z-10 bg-background pb-3 pt-0">
            <ROIBanner overdueCount={overdueCount} />
          </div>

          {/* Stats always visible */}
          <StatsBar stats={stats} overdueCount={overdueCount} />

          {/* Clients section */}
          {activeSection === "clients" && (
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col">
                <ClientTable
                  clients={clients}
                  techs={techs}
                  selectedIds={selectedIds}
                  repliedClientIds={repliedClientIds}
                  onToggle={toggleClient}
                  onToggleAll={toggleAll}
                  onEdit={setEditingClient}
                  onDelete={handleDeleteClient}
                  onMarkReturned={handleMarkReturned}
                  onClientClick={setDetailClient}
                />
                <ActionBar
                  selectedCount={selectedIds.size}
                  onBlast={handleBlast}
                  onDrip={handleDrip}
                  blasting={blasting}
                  dripping={dripping}
                />
              </div>
            </div>
          )}

          {/* Automation section */}
          {activeSection === "automation" && (
            <div className="mt-5">
              <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
                <DripPanel
                  sequence={settings.drip_sequence}
                  demoMode={activeProfile?.demo_mode ?? false}
                  onSave={handleSaveDrip}
                />
              </div>
            </div>
          )}

          {/* Messages section */}
          {activeSection === "messages" && (
            <Card className="mt-5">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Message Log</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                      onClick={openClearMessages}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear messages
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={openClearAll}
                    >
                      Reset all
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <MessageLog messages={messages} />
            </Card>
          )}

          {/* Profiles section */}
          {activeSection === "profiles" && (
            <ProfilesPage
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSwitch={handleSwitchProfile}
              onCreated={handleProfileCreated}
              onDeleted={handleProfileDeleted}
            />
          )}

          {/* Settings section */}
          {activeSection === "settings" && (
            <div className="mt-5">
              <SettingsPage
                settings={settings}
                profileId={activeProfileId ?? ""}
                onSaved={(s) => {
                  setSettings(s);
                  setProfiles((prev) =>
                    prev.map((p) =>
                      p.id === activeProfileId
                        ? { ...p, name: s.business_name, logo_url: s.logo_url, primary_color: s.primary_color, accent_color: s.accent_color, demo_mode: s.demo_mode }
                        : p
                    )
                  );
                }}
              />
            </div>
          )}
          </>)}
        </main>
      </div>

      {/* Client detail slide-over */}
      <ClientDetailPanel
        client={detailClient}
        messages={messages.filter((m) => m.client_id === detailClient?.id)}
        onClose={() => setDetailClient(null)}
        onClientUpdated={(updated) => {
          setClients((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c));
          setDetailClient((prev) => prev?.id === updated.id ? { ...prev, ...updated } : prev);
          if (activeProfileId) fetchStats(activeProfileId);
        }}
      />

      {/* Modals */}
      <AddClientModal
        open={showAdd}
        onOpenChange={setShowAdd}
        techs={techs}
        profileId={activeProfileId ?? ""}
        onAdded={async () => {
          if (activeProfileId) await Promise.all([fetchClients(activeProfileId), fetchStats(activeProfileId)]);
        }}
      />
      <EditClientModal
        client={editingClient}
        techs={techs}
        onOpenChange={(open) => { if (!open) setEditingClient(null); }}
        onSaved={() => { if (activeProfileId) fetchClients(activeProfileId); }}
      />
      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        profileId={activeProfileId ?? ""}
        onImported={async () => {
          if (activeProfileId) await Promise.all([fetchClients(activeProfileId), fetchStats(activeProfileId)]);
        }}
      />

      {/* Confirm clear dialog */}
      <Dialog open={clearModalOpen} onOpenChange={setClearModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {clearMode === "all" ? "Reset everything?" : "Clear messages?"}
            </DialogTitle>
            <DialogDescription>
              {clearMode === "all"
                ? "This will permanently delete all clients, messages, and drip jobs for this profile. This cannot be undone."
                : "This will permanently delete all messages and drip jobs for this profile. Clients will be kept."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setClearModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearConfirm}>
              {clearMode === "all" ? "Reset everything" : "Clear messages"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
