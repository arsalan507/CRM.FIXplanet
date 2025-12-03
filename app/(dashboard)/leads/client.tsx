"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedLeadsTable } from "@/components/tables/enhanced-leads-table";
import { LeadDetailModal } from "@/components/leads/lead-detail-modal";
import { CreateLeadModal } from "@/components/leads/create-lead-modal";
import type { Lead, Staff, UserRole } from "@/lib/types";
import { Plus } from "lucide-react";

interface LeadsPageClientProps {
  leads: Lead[];
  staffList: Staff[];
  currentUserRole: UserRole;
}

export function LeadsPageClient({
  leads,
  staffList,
  currentUserRole,
}: LeadsPageClientProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setModalMode("view");
    setIsDetailOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setModalMode("edit");
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedLead(null);
  };

  const canCreate = ["super_admin", "manager", "telecaller"].includes(currentUserRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Leads</h1>
          <p className="text-sm text-gray-500">
            {currentUserRole === "telecaller"
              ? "Manage your assigned leads"
              : "Manage and track all incoming repair requests"}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        )}
      </div>

      <EnhancedLeadsTable
        leads={leads}
        staffList={staffList}
        currentUserRole={currentUserRole}
        onViewLead={handleViewLead}
        onEditLead={handleEditLead}
      />

      <LeadDetailModal
        lead={selectedLead}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        staffList={staffList}
        currentUserRole={currentUserRole}
        mode={modalMode}
      />

      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        staffList={staffList}
      />
    </div>
  );
}
