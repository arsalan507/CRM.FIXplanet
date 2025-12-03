"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getNewLeadsCount } from "@/app/actions/leads";
import type { Staff } from "@/lib/types";

interface NotificationContextType {
  newLeadsCount: number;
  refreshCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({
  children,
  staff,
}: {
  children: ReactNode;
  staff: Staff;
}) {
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const supabase = createClient();

  const refreshCount = useCallback(async () => {
    const result = await getNewLeadsCount(staff.id, staff.role);
    if (result.success) {
      setNewLeadsCount(result.count);
    }
  }, [staff.id, staff.role]);

  useEffect(() => {
    // Initial fetch
    refreshCount();

    // Set up real-time subscription for leads table
    const channel = supabase
      .channel("leads-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          // New lead inserted - check if status is "new"
          if (payload.new && (payload.new as { status: string }).status === "new") {
            // For sell executives and technicians, only count if assigned to them
            if (staff.role === "sell_executive" || staff.role === "technician") {
              if ((payload.new as { assigned_to: string | null }).assigned_to === staff.id) {
                setNewLeadsCount((prev) => prev + 1);
              }
            } else {
              setNewLeadsCount((prev) => prev + 1);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const oldStatus = (payload.old as { status: string })?.status;
          const newStatus = (payload.new as { status: string })?.status;
          const assignedTo = (payload.new as { assigned_to: string | null })?.assigned_to;

          // Status changed from "new" to something else - decrement
          if (oldStatus === "new" && newStatus !== "new") {
            if (staff.role === "sell_executive" || staff.role === "technician") {
              if (assignedTo === staff.id) {
                setNewLeadsCount((prev) => Math.max(0, prev - 1));
              }
            } else {
              setNewLeadsCount((prev) => Math.max(0, prev - 1));
            }
          }

          // Status changed to "new" from something else - increment
          if (oldStatus !== "new" && newStatus === "new") {
            if (staff.role === "sell_executive" || staff.role === "technician") {
              if (assignedTo === staff.id) {
                setNewLeadsCount((prev) => prev + 1);
              }
            } else {
              setNewLeadsCount((prev) => prev + 1);
            }
          }

          // Assignment changed for sell executives and technicians
          if (staff.role === "sell_executive" || staff.role === "technician") {
            const oldAssignedTo = (payload.old as { assigned_to: string | null })?.assigned_to;
            const newAssignedTo = assignedTo;

            // Lead assigned to this staff member
            if (oldAssignedTo !== staff.id && newAssignedTo === staff.id && newStatus === "new") {
              setNewLeadsCount((prev) => prev + 1);
            }

            // Lead unassigned from this staff member
            if (oldAssignedTo === staff.id && newAssignedTo !== staff.id && oldStatus === "new") {
              setNewLeadsCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          // Lead deleted - if it was "new", decrement
          if ((payload.old as { status: string })?.status === "new") {
            if (staff.role === "sell_executive" || staff.role === "technician") {
              if ((payload.old as { assigned_to: string | null })?.assigned_to === staff.id) {
                setNewLeadsCount((prev) => Math.max(0, prev - 1));
              }
            } else {
              setNewLeadsCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, staff.id, staff.role, refreshCount]);

  return (
    <NotificationContext.Provider value={{ newLeadsCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
