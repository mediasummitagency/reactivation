"use client";

import NumberFlow from "@number-flow/react";
import { Users, MessageSquare, Clock, UserX, TrendingUp, Reply, CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Stats } from "@/lib/types";

interface StatsBarProps {
  stats: Stats;
  overdueCount: number;
}

export function StatsBar({ stats, overdueCount }: StatsBarProps) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {/* Overdue */}
      <Card className={`flex items-center gap-3 p-4 transition-shadow hover:shadow-md ${
        overdueCount > 0 ? "border-amber-200 bg-amber-50" : ""
      }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          overdueCount > 0 ? "bg-amber-100" : "bg-muted"
        }`}>
          <TrendingUp className={`h-4 w-4 ${overdueCount > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className={`text-xs font-medium ${overdueCount > 0 ? "text-amber-700" : "text-muted-foreground"}`}>
            Overdue
          </p>
          <p className={`mt-0.5 text-xl font-bold tracking-tight ${overdueCount > 0 ? "text-amber-800" : ""}`}>
            <NumberFlow value={overdueCount} />
          </p>
        </div>
      </Card>

      {/* Total Clients */}
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
          <Users className="h-4 w-4 text-sky-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Total Clients</p>
          <p className="mt-0.5 text-xl font-bold tracking-tight">
            <NumberFlow value={stats.total_clients} />
          </p>
        </div>
      </Card>

      {/* Texts Today */}
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Texts Today</p>
          <p className="mt-0.5 text-xl font-bold tracking-tight">
            <NumberFlow value={stats.sent_today} />
          </p>
        </div>
      </Card>

      {/* All-Time Sent */}
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">All-Time Sent</p>
          <p className="mt-0.5 text-xl font-bold tracking-tight">
            <NumberFlow value={stats.total_sent} />
          </p>
        </div>
      </Card>

      {/* Replied */}
      <Card className={`flex items-center gap-3 p-4 transition-shadow hover:shadow-md ${
        stats.replies > 0 ? "border-violet-200 bg-violet-50" : ""
      }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          stats.replies > 0 ? "bg-violet-100" : "bg-muted"
        }`}>
          <Reply className={`h-4 w-4 ${stats.replies > 0 ? "text-violet-600" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className={`text-xs font-medium ${stats.replies > 0 ? "text-violet-700" : "text-muted-foreground"}`}>
            Replied
          </p>
          <p className={`mt-0.5 text-xl font-bold tracking-tight ${stats.replies > 0 ? "text-violet-800" : ""}`}>
            <NumberFlow value={stats.replies} />
          </p>
        </div>
      </Card>

      {/* Booked */}
      <Card className={`flex items-center gap-3 p-4 transition-shadow hover:shadow-md ${
        stats.booked > 0 ? "border-teal-200 bg-teal-50" : ""
      }`}>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          stats.booked > 0 ? "bg-teal-100" : "bg-muted"
        }`}>
          <CalendarCheck className={`h-4 w-4 ${stats.booked > 0 ? "text-teal-600" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className={`text-xs font-medium ${stats.booked > 0 ? "text-teal-700" : "text-muted-foreground"}`}>
            Booked
          </p>
          <p className={`mt-0.5 text-xl font-bold tracking-tight ${stats.booked > 0 ? "text-teal-800" : ""}`}>
            <NumberFlow value={stats.booked} />
          </p>
        </div>
      </Card>

      {/* Opt-outs */}
      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
          <UserX className="h-4 w-4 text-rose-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Opt-outs</p>
          <p className="mt-0.5 text-xl font-bold tracking-tight">
            <NumberFlow value={stats.opt_outs} />
          </p>
        </div>
      </Card>
    </div>
  );
}
