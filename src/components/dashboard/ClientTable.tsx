"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, Reply, Link2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import type { Client } from "@/lib/types";

interface ClientTableProps {
  clients: Client[];
  techs: string[];
  selectedIds: Set<string>;
  repliedClientIds?: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onMarkReturned?: (clientId: string) => void;
  onClientClick?: (client: Client) => void;
}

const allColumns = ["Name", "Phone", "Tech", "Last Visit", "Cadence", "Status"] as const;
type Column = (typeof allColumns)[number];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Deterministic hue from a string for avatar background variety
function nameToHue(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export function ClientTable({
  clients,
  techs,
  selectedIds,
  repliedClientIds,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  onMarkReturned,
  onClientClick,
}: ClientTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<Column[]>([...allColumns]);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [techFilter, setTechFilter] = useState("all");

  const filtered = clients.filter((c) => {
    if (showOverdueOnly && c.visit_status !== "overdue") return false;
    if (techFilter !== "all" && c.tech !== techFilter) return false;
    return true;
  });

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

  const toggleColumn = (col: Column) => {
    setVisibleColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col],
    );
  };

  const statusBadgeVariant = (status: Client["visit_status"]) => {
    switch (status) {
      case "overdue": return "overdue";
      case "due":     return "due";
      case "ok":      return "ok";
      default:        return "unknown";
    }
  };

  const statusLabel = (status: Client["visit_status"], days: number) => {
    if (status === "unknown") return "—";
    if (status === "overdue") return `${days}d overdue`;
    if (status === "due")     return "Due soon";
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filter + column toggle bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={showOverdueOnly}
            onCheckedChange={(v) => setShowOverdueOnly(!!v)}
          />
          <span className="font-medium">Overdue only</span>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tech:</span>
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All techs</SelectItem>
              {techs.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            {allColumns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                checked={visibleColumns.includes(col)}
                onCheckedChange={() => toggleColumn(col)}
              >
                {col}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground">
          {selectedIds.size > 0 ? (
            <span className="font-semibold text-primary">{selectedIds.size} selected</span>
          ) : (
            `${filtered.length} shown`
          )}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-t-xl rounded-b-none border border-b-0 border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 px-4">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(v) => onToggleAll(!!v)}
                  aria-label="Select all"
                />
              </TableHead>
              {visibleColumns.includes("Name") && (
                <TableHead className="px-4 font-semibold">Name</TableHead>
              )}
              {visibleColumns.includes("Phone") && (
                <TableHead className="px-4 font-semibold">Phone</TableHead>
              )}
              {visibleColumns.includes("Tech") && (
                <TableHead className="px-4 font-semibold">Tech</TableHead>
              )}
              {visibleColumns.includes("Last Visit") && (
                <TableHead className="px-4 font-semibold">Last Visit</TableHead>
              )}
              {visibleColumns.includes("Cadence") && (
                <TableHead className="px-4 font-semibold">Cadence</TableHead>
              )}
              {visibleColumns.includes("Status") && (
                <TableHead className="px-4 font-semibold">Status</TableHead>
              )}
              <TableHead className="w-20 px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + 2}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No clients match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((client, i) => {
                const hue = nameToHue(client.first_name);
                return (
                  <TableRow
                    key={client.id}
                    className={cn(
                      i % 2 === 0 ? "bg-card" : "bg-muted/20",
                      selectedIds.has(client.id) && "bg-sky-50/50",
                    )}
                  >
                    <TableCell className="px-4">
                      <Checkbox
                        checked={selectedIds.has(client.id)}
                        onCheckedChange={() => onToggle(client.id)}
                      />
                    </TableCell>

                    {visibleColumns.includes("Name") && (
                      <TableCell className="px-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-default">
                                <Avatar
                                  className="h-7 w-7 ring-1 ring-border"
                                  style={{ background: `hsl(${hue} 55% 88%)` }}
                                >
                                  <AvatarFallback
                                    className="text-[10px] font-semibold"
                                    style={{ background: `hsl(${hue} 55% 88%)`, color: `hsl(${hue} 55% 35%)` }}
                                  >
                                    {getInitials(client.first_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onClientClick?.(client); }}
                                  className="font-medium whitespace-nowrap hover:underline focus:outline-none"
                                >
                                  {client.first_name}
                                </button>
                                {repliedClientIds?.has(client.id) && (
                                  <span className="flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                                    <Reply className="h-2.5 w-2.5" />
                                    Replied
                                  </span>
                                )}
                                {client.link_clicked_at && (
                                  <span className="flex items-center gap-0.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-600" title="Clicked booking link">
                                    <Link2 className="h-2.5 w-2.5" />
                                    Clicked
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="font-semibold">{client.first_name}</p>
                              <p className="text-xs text-muted-foreground">{client.phone}</p>
                              {client.tech && (
                                <p className="text-xs italic">Tech: {client.tech}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    )}

                    {visibleColumns.includes("Phone") && (
                      <TableCell className="px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {client.phone}
                      </TableCell>
                    )}

                    {visibleColumns.includes("Tech") && (
                      <TableCell className="px-4 text-muted-foreground whitespace-nowrap">
                        {client.tech ?? "—"}
                      </TableCell>
                    )}

                    {visibleColumns.includes("Last Visit") && (
                      <TableCell className="px-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(client.last_visit)}
                      </TableCell>
                    )}

                    {visibleColumns.includes("Cadence") && (
                      <TableCell className="px-4 text-muted-foreground whitespace-nowrap">
                        {client.cadence_days}d
                      </TableCell>
                    )}

                    {visibleColumns.includes("Status") && (
                      <TableCell className="px-4 whitespace-nowrap">
                        {client.opted_out ? (
                          <Badge variant="overdue" className="text-xs">
                            Opted out
                          </Badge>
                        ) : (
                          <Badge
                            variant={statusBadgeVariant(client.visit_status)}
                            className={cn(
                              client.visit_status === "overdue" && "badge-overdue-pulse",
                            )}
                          >
                            {statusLabel(client.visit_status, client.days_since ?? 0)}
                          </Badge>
                        )}
                      </TableCell>
                    )}

                    <TableCell className="px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEdit(client)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {onMarkReturned && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => onMarkReturned(client.id)}
                            title="Mark as returned today"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-red-50 hover:text-destructive"
                          onClick={() => onDelete(client.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
