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
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface SidebarProps {
  staff: Staff;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, showBadge: false },
  { name: "Enquiry", href: "/leads", icon: Phone, showBadge: true },
  { name: "Follow Up", href: "/followup", icon: Clock, showBadge: false },
  { name: "Order", href: "/orders", icon: CheckCircle, showBadge: false },
  { name: "Not Interested", href: "/not-interested", icon: XCircle, showBadge: false },
  { name: "Customers", href: "/customers", icon: Users, showBadge: false },
  { name: "Invoice", href: "/invoices", icon: FileText, showBadge: false },
  { name: "Team", href: "/team", icon: UsersRound, showBadge: false },
  { name: "Users", href: "/staff", icon: UserCircle, showBadge: false },
  { name: "Opportunities", href: "/opportunities", icon: TrendingUp, showBadge: false },
];

export function Sidebar({ staff }: SidebarProps) {
  const pathname = usePathname();
  const { newLeadsCount } = useNotifications();

  // Filter navigation based on role
  const filteredNav = navigation.filter((item) => {
    if (staff.role === "sales_executive") {
      return ["Dashboard", "Enquiry", "Follow Up", "Order", "Not Interested"].includes(item.name);
    }
    if (staff.role === "technician") {
      return ["Dashboard", "Enquiry", "Follow Up", "Order", "Not Interested", "Customers", "Invoice"].includes(item.name);
    }
    if (staff.role === "field_executive") {
      return ["Dashboard", "Enquiry", "Follow Up", "Order", "Not Interested", "Customers", "Invoice"].includes(item.name);
    }
    if (staff.role === "manager") {
      return ["Dashboard", "Enquiry", "Follow Up", "Order", "Not Interested", "Customers", "Invoice", "Team", "Opportunities"].includes(item.name);
    }
    return true; // super_admin can see all
  });

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-black bg-white">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-black">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">FP</span>
            </div>
            <span className="text-xl font-bold text-black">Fixplanet</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
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
        <div className="px-4 py-4 border-t border-black">
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
