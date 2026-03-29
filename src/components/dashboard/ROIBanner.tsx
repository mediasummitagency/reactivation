"use client";

import { useState, useRef, useEffect } from "react";
import { TrendingUp } from "lucide-react";

const STORAGE_KEY = "roi_avg_ticket";
const DEFAULT_TICKET = 45;

interface ROIBannerProps {
  overdueCount: number;
}

export function ROIBanner({ overdueCount }: ROIBannerProps) {
  const [avgTicket, setAvgTicket] = useState<number>(DEFAULT_TICKET);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (!isNaN(n) && n > 0) setAvgTicket(n);
    }
  }, []);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setInputVal(String(avgTicket));
    setEditing(true);
  };

  const commitEdit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n > 0) {
      setAvgTicket(n);
      localStorage.setItem(STORAGE_KEY, String(n));
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  };

  const revenue = overdueCount * avgTicket;

  if (overdueCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
        <TrendingUp className="h-4 w-4 text-amber-600" />
      </div>
      <p className="flex-1 text-sm font-medium text-amber-900">
        <span className="font-bold">{overdueCount}</span> overdue client{overdueCount !== 1 ? "s" : ""} —{" "}
        estimated{" "}
        <span className="font-bold">
          ${revenue.toLocaleString()}
        </span>{" "}
        in recoverable revenue this week
      </p>
      <div className="flex items-center gap-1.5 text-xs text-amber-700">
        <span>avg ticket</span>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-16 rounded border border-amber-300 bg-white px-1.5 py-0.5 text-center text-xs font-semibold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        ) : (
          <button
            onClick={startEdit}
            className="rounded border border-amber-300 bg-white px-1.5 py-0.5 font-semibold text-amber-900 transition-colors hover:bg-amber-100"
            title="Click to edit average ticket price"
          >
            ${avgTicket}
          </button>
        )}
      </div>
    </div>
  );
}
