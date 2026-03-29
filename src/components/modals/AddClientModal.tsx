"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  techs?: string[];
  profileId: string;
}

export function AddClientModal({ open, onOpenChange, onAdded, techs = [], profileId }: AddClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    phone: "",
    last_visit: "",
    cadence_days: "21",
    tech: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, profile_id: profileId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${form.first_name} added`);
      setForm({ first_name: "", phone: "", last_visit: "", cadence_days: "21", tech: "" });
      onOpenChange(false);
      onAdded();
    } catch {
      toast.error("Failed to add client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
          <DialogDescription>Add a new client to the reactivation list.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                required
                autoComplete="off"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="Marcus"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                required
                autoComplete="off"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="last_visit">Last Visit</Label>
              <Input
                id="last_visit"
                type="date"
                value={form.last_visit}
                onChange={(e) => setForm((f) => ({ ...f, last_visit: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cadence_days">Cadence (days)</Label>
              <Input
                id="cadence_days"
                type="number"
                min="1"
                value={form.cadence_days}
                onChange={(e) => setForm((f) => ({ ...f, cadence_days: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tech">Assigned Tech</Label>
            {techs.length > 0 ? (
              <Select
                value={form.tech}
                onValueChange={(v) => setForm((f) => ({ ...f, tech: v }))}
              >
                <SelectTrigger id="tech">
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
                id="tech"
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
              {loading ? "Adding…" : "Add Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
