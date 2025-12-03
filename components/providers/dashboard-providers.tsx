"use client";

import { ReactNode } from "react";
import { NotificationProvider } from "@/contexts/notification-context";
import type { Staff } from "@/lib/types";

interface DashboardProvidersProps {
  children: ReactNode;
  staff: Staff;
}

export function DashboardProviders({ children, staff }: DashboardProvidersProps) {
  return (
    <NotificationProvider staff={staff}>
      {children}
    </NotificationProvider>
  );
}
