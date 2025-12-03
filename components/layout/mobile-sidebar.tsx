"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/contexts/notification-context";
import { NotificationBadge } from "@/components/ui/notification-badge";
import type { Staff } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  UsersRound,
  Phone,
  TrendingUp,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileSidebarProps {
  staff: Staff;
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, showBadge: false },
  { name: "Leads", href: "/leads", icon: Phone, showBadge: true },
  { name: "Customers", href: "/customers", icon: Users, showBadge: false },
  { name: "Invoices", href: "/invoices", icon: FileText, showBadge: false },
  { name: "Team", href: "/team", icon: UsersRound, showBadge: false },
  { name: "Staff", href: "/staff", icon: UserCircle, showBadge: false },
  { name: "Opportunities", href: "/opportunities", icon: TrendingUp, showBadge: false },
];

export function MobileSidebar({ staff, open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { newLeadsCount } = useNotifications();

  const filteredNav = navigation.filter((item) => {
    if (staff.role === "sell_executive") {
      return ["Dashboard", "Leads"].includes(item.name);
    }
    if (staff.role === "technician") {
      return ["Dashboard", "Leads", "Customers", "Invoices"].includes(item.name);
    }
    return true;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-black">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-black">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">FP</span>
            </div>
            <span className="text-xl font-bold text-black">Fixplanet</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.showBadge && newLeadsCount > 0 && (
                    <NotificationBadge count={newLeadsCount} className="top-[-6px] right-[-8px]" />
                  )}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-black">
          <div className="px-3 py-2">
            <p className="text-xs text-gray-500">Logged in as</p>
            <p className="text-sm font-medium text-black truncate">
              {staff.full_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {staff.role.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
