"use client";

import { useEffect, useState } from "react";
import { X, Phone, Scissors, Calendar, Clock, CalendarCheck, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TEMPLATE_LABELS } from "@/lib/config";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Client, Message } from "@/lib/types";

interface ClientDetailPanelProps {
  client: Client | null;
  messages: Message[];
  onClose: () => void;
  onClientUpdated?: (client: Client) => void;
}

function StatusDot({ status, direction }: { status: string; direction?: string }) {
  if (direction === "inbound") {
    return <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />;
  }
  const cls =
    status === "delivered"
      ? "bg-emerald-500"
      : status === "failed"
      ? "bg-red-500"
      : "bg-amber-400";
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

export function ClientDetailPanel({ client, messages, onClose, onClientUpdated }: ClientDetailPanelProps) {
  const [markingBooked, setMarkingBooked] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!client) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [client, onClose]);

  const handleMarkBooked = async () => {
    if (!client) return;
    setMarkingBooked(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booked_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: Client = await res.json();
      toast.success(`${client.first_name} marked as booked`);
      onClientUpdated?.(updated);
    } catch {
      toast.error("Failed to mark as booked");
    } finally {
      setMarkingBooked(false);
    }
  };

  const handleUnmarkBooked = async () => {
    if (!client) return;
    setMarkingBooked(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booked_at: null }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: Client = await res.json();
      toast.success("Booking cleared");
      onClientUpdated?.(updated);
    } catch {
      toast.error("Failed to clear booking");
    } finally {
      setMarkingBooked(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/20 transition-opacity duration-300 ${
          client ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed right-0 top-0 z-40 flex h-full w-[380px] flex-col bg-background shadow-2xl transition-transform duration-300 ${
          client ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {client && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{client.first_name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {client.booked_at && (
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 text-xs border-0">
                      <CalendarCheck className="mr-1 h-3 w-3" />
                      Booked
                    </Badge>
                  )}
                  {client.opted_out ? (
                    <Badge variant="overdue" className="text-xs">Opted out</Badge>
                  ) : client.visit_status === "overdue" ? (
                    <Badge variant="overdue" className="text-xs">
                      {client.days_since}d overdue
                    </Badge>
                  ) : client.visit_status === "due" ? (
                    <Badge variant="due" className="text-xs">Due soon</Badge>
                  ) : client.visit_status === "ok" ? (
                    <Badge variant="ok" className="text-xs">{client.days_since}d ago</Badge>
                  ) : null}
                </div>
              </div>
              <button
                onClick={onClose}
                className="mt-0.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info rows */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono text-xs">{client.phone}</span>
              </div>
              {client.tech && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Scissors className="h-3.5 w-3.5 shrink-0" />
                  <span>{client.tech}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Last: {formatDate(client.last_visit)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Every {client.cadence_days}d</span>
              </div>
            </div>

            {/* Mark as booked action */}
            {!client.opted_out && (
              <div className="px-5 pb-4">
                {client.booked_at ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Booked {formatDate(client.booked_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={handleUnmarkBooked}
                      disabled={markingBooked}
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleMarkBooked}
                    disabled={markingBooked}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                    {markingBooked ? "Saving…" : "Mark as booked"}
                  </Button>
                )}
              </div>
            )}

            <Separator />

            {/* Message history */}
            <div className="flex min-h-0 flex-1 flex-col">
              <p className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Message History ({messages.length})
              </p>
              {messages.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No messages sent yet.</p>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {messages.map((msg) => {
                    const isInbound = msg.direction === "inbound";
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 border-b px-5 py-3 last:border-0 ${
                          isInbound ? "bg-violet-50/60" : ""
                        }`}
                      >
                        <StatusDot status={msg.status} direction={msg.direction} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {isInbound ? (
                              <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                                <ArrowDownLeft className="h-2.5 w-2.5" />
                                Reply
                              </span>
                            ) : (
                              <>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                  {TEMPLATE_LABELS[msg.template as keyof typeof TEMPLATE_LABELS] ?? msg.template}
                                </span>
                                <span className="text-xs capitalize text-muted-foreground/70">
                                  {msg.status}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {msg.body}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs text-muted-foreground/60">
                          {formatDateTime(msg.sent_at)}
                        </time>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
