"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/utils";
import type { Lead, Staff, UserRole } from "@/lib/types";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Phone,
  Smartphone,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { deleteLead } from "@/app/actions/leads";
import { toast } from "sonner";

interface OpportunitiesPageClientProps {
  leads: Lead[];
  stats: {
    totalPipeline: number;
    won: number;
    lost: number;
    winRate: number;
    pipelineValue: number;
    revenueWon: number;
  };
  staffList: Staff[];
  currentUserRole: UserRole;
}

export function OpportunitiesPageClient({
  leads,
  stats,
  staffList,
  currentUserRole,
}: OpportunitiesPageClientProps) {
  const router = useRouter();
  const [loadingLeadId, setLoadingLeadId] = useState<string | null>(null);

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setLoadingLeadId(leadId);
    const result = await deleteLead(leadId);
    if (result.success) {
      toast.success("Lead deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete lead");
    }
    setLoadingLeadId(null);
  };

  const canEdit = ["super_admin", "manager"].includes(currentUserRole);
  const canDelete = ["super_admin"].includes(currentUserRole);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Order":
        return "bg-green-100 text-green-800 border-green-200";
      case "Follow Up":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Not Interested":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRowColor = (status: string) => {
    switch (status) {
      case "Order":
        return "bg-green-50 hover:bg-green-100";
      case "Follow Up":
        return "bg-yellow-50 hover:bg-yellow-100";
      case "Not Interested":
        return "bg-red-50 hover:bg-red-100";
      default:
        return "hover:bg-gray-50";
    }
  };

  const getLastRemark = (lead: Lead) => {
    if (lead.remarks && lead.remarks.length > 0) {
      const sorted = [...lead.remarks].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return sorted[0].remark;
    }
    return "-";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Sales Pipeline</h1>
        <p className="text-sm text-gray-500">Track opportunities from qualification to close</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.totalPipeline}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Won</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.won}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Lost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{stats.lost}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.winRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">₹{stats.pipelineValue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Revenue Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">₹{stats.revenueWon.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Last Remark</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No opportunities found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={`cursor-pointer ${getRowColor(lead.workflow_status || "")}`}
                      onDoubleClick={() => router.push(`/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <Badge className={`${getStatusColor(lead.workflow_status || "")} border`}>
                          {lead.workflow_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-black">{lead.customer_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a
                            href={`tel:${lead.contact_number}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.contact_number}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{lead.device_type}</div>
                            <div className="text-xs text-gray-500">{lead.device_model}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm text-gray-600">
                          {getLastRemark(lead)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm">{lead.issue_reported}</div>
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
                            {canEdit && (
                              <DropdownMenuItem onClick={() => router.push(`/leads/${lead.id}`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(lead.id)}
                                  className="text-red-600"
                                  disabled={loadingLeadId === lead.id}
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
        </CardContent>
      </Card>
    </div>
  );
}
