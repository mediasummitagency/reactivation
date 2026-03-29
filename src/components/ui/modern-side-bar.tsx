"use client";

import { useState, useEffect } from "react";
import {
  Users2,
  MessageSquare,
  Workflow,
  Building2,
  Settings2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Scissors,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DashboardSection = "clients" | "automation" | "messages" | "profiles" | "settings";

interface NavItem {
  id: DashboardSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "clients", label: "Clients", icon: Users2 },
  { id: "automation", label: "Automation", icon: Workflow },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "profiles", label: "Profiles", icon: Building2 },
  { id: "settings", label: "Settings", icon: Settings2 },
];

interface DashboardSidebarProps {
  businessName: string;
  logoUrl?: string;
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
}

export function DashboardSidebar({
  businessName,
  logoUrl,
  activeSection,
  onSectionChange,
}: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNav = (section: DashboardSection) => {
    onSectionChange(section);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F172A] shadow-md md:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <X className="h-4.5 w-4.5 text-white" />
        ) : (
          <Menu className="h-4.5 w-4.5 text-white" />
        )}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 flex h-full flex-col bg-[#0F172A] border-r border-white/10 transition-all duration-300 ease-in-out",
          "md:static md:z-auto md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-56",
        )}
      >
        {/* Logo / business name */}
        <div
          className={cn(
            "flex items-center border-b border-white/10 p-4",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!isCollapsed && (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Scissors className="h-4 w-4 text-primary-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{businessName}</p>
                <Badge variant="demo" className="mt-0.5 px-1.5 py-0 text-[10px]">
                  DEMO
                </Badge>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Scissors className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
          )}

          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white md:flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                title={isCollapsed ? label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150",
                  isCollapsed && "justify-center px-0",
                  active
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/55 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
