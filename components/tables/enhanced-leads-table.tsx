"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, formatPhoneNumber } from "@/lib/utils";
import { STATUS_COLORS, LEAD_STATUSES, DEVICE_TYPES } from "@/lib/config";
import { updateLeadStatus, deleteLead } from "@/app/actions/leads";
import { useToast } from "@/components/ui/use-toast";
import type { Lead, LeadStatus, Staff, UserRole } from "@/lib/types";
import {
  Search,
  Phone,
  Smartphone,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCheck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface EnhancedLeadsTableProps {
  leads: Lead[];
  staffList: Staff[];
  currentUserRole: UserRole;
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
}

const ITEMS_PER_PAGE = 20;

export function EnhancedLeadsTable({
  leads,
  staffList,
  currentUserRole,
  onViewLead,
  onEditLead,
}: EnhancedLeadsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [, startTransition] = useTransition();
  const [loadingLeadId, setLoadingLeadId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.contact_number.includes(search) ||
      lead.device_model.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;

    const matchesDevice =
      deviceFilter === "all" || lead.device_type === deviceFilter;

    const matchesStaff =
      staffFilter === "all" ||
      (staffFilter === "unassigned" && !lead.assigned_to) ||
      lead.assigned_to === staffFilter;

    return matchesSearch && matchesStatus && matchesDevice && matchesStaff;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setLoadingLeadId(leadId);
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, newStatus);
      if (result.success) {
        toast({ title: "Status updated", description: `Lead status changed to ${newStatus.replace("_", " ")}` });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setLoadingLeadId(null);
    });
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setLoadingLeadId(leadId);
    startTransition(async () => {
      const result = await deleteLead(leadId);
      if (result.success) {
        toast({ title: "Lead deleted", description: "The lead has been removed" });
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setLoadingLeadId(null);
    });
  };

  const getStatusBadge = (status: LeadStatus) => {
    const colors = STATUS_COLORS[status] || { bg: "bg-gray-100", text: "text-gray-800" };
    return (
      <Badge className={`${colors.bg} ${colors.text} capitalize border-0`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    const config = {
      1: { label: "Critical", class: "bg-red-100 text-red-800" },
      2: { label: "High", class: "bg-orange-100 text-orange-800" },
      3: { label: "Medium", class: "bg-yellow-100 text-yellow-800" },
      4: { label: "Low", class: "bg-blue-100 text-blue-800" },
      5: { label: "Lowest", class: "bg-gray-100 text-gray-800" },
    }[priority] || { label: "Medium", class: "bg-yellow-100 text-yellow-800" };

    return (
      <Badge className={`${config.class} border-0 text-xs`}>{config.label}</Badge>
    );
  };

  const canDelete = currentUserRole === "super_admin";
  const canEdit = ["super_admin", "manager"].includes(currentUserRole);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or model..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 border-black"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-[160px] border-black">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={deviceFilter}
          onValueChange={(v) => {
            setDeviceFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-[160px] border-black">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            {DEVICE_TYPES.map((device) => (
              <SelectItem key={device} value={device}>
                {device}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={staffFilter}
          onValueChange={(v) => {
            setStaffFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full lg:w-[180px] border-black">
            <SelectValue placeholder="Assigned To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {staffList.map((staff) => (
              <SelectItem key={staff.id} value={staff.id}>
                {staff.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Showing {paginatedLeads.length} of {filteredLeads.length} leads
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="border border-black rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-black">Customer</TableHead>
              <TableHead className="font-semibold text-black">Contact</TableHead>
              <TableHead className="font-semibold text-black">Device</TableHead>
              <TableHead className="font-semibold text-black">Issue</TableHead>
              <TableHead className="font-semibold text-black">Priority</TableHead>
              <TableHead className="font-semibold text-black">Status</TableHead>
              <TableHead className="font-semibold text-black">Assigned To</TableHead>
              <TableHead className="font-semibold text-black">Created</TableHead>
              <TableHead className="font-semibold text-black w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-gray-500">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-black">{lead.customer_name}</div>
                        <div className="text-xs text-gray-500">{lead.lead_source}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${lead.contact_number}`}
                      className="flex items-center gap-2 text-black hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {formatPhoneNumber(lead.contact_number)}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-black text-sm">{lead.device_type}</div>
                        <div className="text-xs text-gray-500">{lead.device_model}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-black">{lead.issue_reported}</span>
                  </TableCell>
                  <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {loadingLeadId === lead.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Select
                        value={lead.status}
                        onValueChange={(v) => handleStatusChange(lead.id, v as LeadStatus)}
                      >
                        <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent p-0">
                          {getStatusBadge(lead.status)}
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.staff ? (
                      <span className="text-sm text-black">{lead.staff.full_name}</span>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(lead.created_at)}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewLead(lead)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEditLead(lead)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Lead
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(lead.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Lead
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="border-black"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "" : "border-black"}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-black"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
