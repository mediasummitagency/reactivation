"use client";

import { useState } from "react";
import { Zap, Timer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEMPLATE_LABELS } from "@/lib/config";

interface ActionBarProps {
  selectedCount: number;
  onBlast: (template: string) => void;
  onDrip: () => void;
  blasting: boolean;
  dripping: boolean;
}

export function ActionBar({ selectedCount, onBlast, onDrip, blasting, dripping }: ActionBarProps) {
  const [template, setTemplate] = useState("slot_fill");

  return (
    <div className="flex items-center gap-3 rounded-b-xl rounded-t-none border border-border bg-muted/30 px-4 py-3">
      <Select value={template} onValueChange={setTemplate}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="destructive"
        onClick={() => onBlast(template)}
        disabled={selectedCount === 0 || blasting}
        className="gap-2"
      >
        {blasting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {blasting ? "Sending…" : "Send Now"}
        {selectedCount > 0 && !blasting && (
          <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs font-bold">
            {selectedCount}
          </span>
        )}
      </Button>

      <Button
        variant="default"
        onClick={onDrip}
        disabled={selectedCount === 0 || dripping}
        className="gap-2"
      >
        {dripping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Timer className="h-4 w-4" />
        )}
        {dripping ? "Queuing…" : "Start Drip"}
        {selectedCount > 0 && !dripping && (
          <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs font-bold">
            {selectedCount}
          </span>
        )}
      </Button>

      {selectedCount === 0 && (
        <p className="ml-2 text-xs text-muted-foreground">
          Select clients above to send
        </p>
      )}
    </div>
  );
}
