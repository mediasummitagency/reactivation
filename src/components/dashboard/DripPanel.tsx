"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TEMPLATE_LABELS } from "@/lib/config";
import type { DripStep } from "@/lib/types";

interface DripPanelProps {
  sequence: DripStep[];
  demoMode: boolean;
  onSave: (sequence: DripStep[]) => void;
}

export function DripPanel({ sequence: initialSequence, demoMode, onSave }: DripPanelProps) {
  const [steps, setSteps] = useState<DripStep[]>(initialSequence);
  const [saving, setSaving] = useState(false);

  // Sync when profile switches (initialSequence changes from parent)
  useEffect(() => {
    setSteps(initialSequence);
  }, [initialSequence]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(steps);
      toast.success("Drip sequence saved");
    } catch {
      toast.error("Failed to save drip sequence");
    } finally {
      setSaving(false);
    }
  };

  const defaultUnit = demoMode ? "minutes" : "days";

  const addStep = () => {
    setSteps((prev) => [...prev, { delay: 1, unit: defaultUnit, template: "slot_fill" }]);
  };

  const removeStep = (i: number) => {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateStep = (i: number, field: keyof DripStep, value: string | number) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Drip Sequence</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-2.5"
          >
            {/* Row 1: step number + delay + delete */}
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <Input
                type="number"
                min={1}
                value={step.delay}
                onChange={(e) => updateStep(i, "delay", parseInt(e.target.value, 10) || 1)}
                className="h-7 w-16 text-center text-xs"
              />
              <Select
                value={step.unit ?? defaultUnit}
                onValueChange={(v) => updateStep(i, "unit", v)}
              >
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes" className="text-xs">minutes</SelectItem>
                  <SelectItem value="hours" className="text-xs">hours</SelectItem>
                  <SelectItem value="days" className="text-xs">days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeStep(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Row 2: template select — full width */}
            <Select
              value={step.template}
              onValueChange={(v) => updateStep(i, "template", v)}
            >
              <SelectTrigger className="h-7 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addStep} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add Step
      </Button>
    </div>
  );
}
