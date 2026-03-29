"use client";

import { useState } from "react";
import { Search, ArrowDownLeft } from "lucide-react";
import { TEMPLATE_LABELS } from "@/lib/config";
import { formatDateTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Message } from "@/lib/types";

interface MessageLogProps {
  messages: Message[];
}

function StatusDot({ status, direction }: { status: string; direction?: string }) {
  if (direction === "inbound") {
    return (
      <div className="mt-1.5 shrink-0">
        <span className="block h-2 w-2 rounded-full bg-violet-400" title="received" />
      </div>
    );
  }
  const cls =
    status === "delivered"
      ? "bg-emerald-500"
      : status === "failed"
      ? "bg-red-500"
      : "bg-amber-400";
  return (
    <div className="mt-1.5 shrink-0">
      <span className={`block h-2 w-2 rounded-full ${cls}`} title={status} />
    </div>
  );
}

export function MessageLog({ messages }: MessageLogProps) {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? messages.filter((m) =>
        m.first_name?.toLowerCase().includes(filter.toLowerCase())
      )
    : messages;

  return (
    <div className="flex flex-col">
      {/* Filter bar */}
      <div className="relative border-b px-5 py-2.5">
        <Search className="absolute left-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by client…"
          className="h-8 pl-8 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {filter ? "No messages match that name." : "No messages sent yet."}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filtered.map((msg) => {
            const isInbound = msg.direction === "inbound";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30 ${
                  isInbound ? "bg-violet-50/50" : ""
                }`}
              >
                <StatusDot status={msg.status} direction={msg.direction} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{msg.first_name}</span>
                    {isInbound ? (
                      <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                        <ArrowDownLeft className="h-2.5 w-2.5" />
                        Reply
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {TEMPLATE_LABELS[msg.template as keyof typeof TEMPLATE_LABELS] ?? msg.template}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{msg.body}</p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(msg.sent_at)}
                </time>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
