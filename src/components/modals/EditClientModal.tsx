"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client } from "@/lib/types";

interface EditClientModalProps {
  client: Client | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  techs?: string[];
}

export function EditClientModal({ client, onOpenChange, onSaved, techs = [] }: EditClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    phone: "",
    last_visit: "",
    cadence_days: "21",
    tech: "",
  });

  useEffect(() => {
    if (client) {
      setForm({
        first_name: client.first_name,
        phone: client.phone,
        last_visit: client.last_visit ?? "",
        cadence_days: String(client.cadence_days),
        tech: client.tech ?? "",
      });
    }
  }, [client]);

  if (!client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${form.first_name} updated`);
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {client.first_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>First Name</Label>
              <Input
                required
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Phone</Label>
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Last Visit</Label>
              <Input
                type="date"
                value={form.last_visit}
                onChange={(e) => setForm((f) => ({ ...f, last_visit: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cadence (days)</Label>
              <Input
                type="number"
                min="1"
                value={form.cadence_days}
                onChange={(e) => setForm((f) => ({ ...f, cadence_days: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Assigned Tech</Label>
            {techs.length > 0 ? (
              <Select
                value={form.tech}
                onValueChange={(v) => setForm((f) => ({ ...f, tech: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tech…" />
                </SelectTrigger>
                <SelectContent>
                  {techs.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.tech}
                onChange={(e) => setForm((f) => ({ ...f, tech: e.target.value }))}
                placeholder="Jaylen"
              />
            )}
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
