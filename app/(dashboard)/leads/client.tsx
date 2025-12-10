"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedLeadsTable } from "@/components/tables/enhanced-leads-table";
import { CreateLeadModal } from "@/components/leads/create-lead-modal";
import type { Lead, Staff, UserRole } from "@/lib/types";
import { Plus } from "lucide-react";

interface LeadsPageClientProps {
  leads: Lead[];
  staffList: Staff[];
  currentUserRole: UserRole;
  pageTitle?: string;
  pageDescription?: string;
  showNewLeadButton?: boolean;
}

export function LeadsPageClient({
  leads,
  staffList,
  currentUserRole,
  pageTitle,
  pageDescription,
  showNewLeadButton = true,
}: LeadsPageClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canCreate = ["super_admin", "manager", "sales_executive"].includes(currentUserRole);

  return (
    <div className="space-y-6">
      {(pageTitle || pageDescription || showNewLeadButton) && (
        <div className="flex items-center justify-between">
          {(pageTitle || pageDescription) && (
            <div>
              {pageTitle && <h1 className="text-2xl font-bold text-black">{pageTitle}</h1>}
              {pageDescription && <p className="text-sm text-gray-500">{pageDescription}</p>}
            </div>
          )}
          {showNewLeadButton && canCreate && (
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          )}
        </div>
      )}

      <EnhancedLeadsTable
        leads={leads}
        staffList={staffList}
        currentUserRole={currentUserRole}
      />

      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        staffList={staffList}
      />
    </div>
  );
}
