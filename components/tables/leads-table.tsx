"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatPhoneNumber } from "@/lib/utils";
import { STATUS_COLORS, LEAD_STATUSES, DEVICE_TYPES } from "@/lib/config";
import type { Lead, LeadStatus, DeviceType } from "@/lib/types";
import { Search, Phone, Smartphone } from "lucide-react";

interface LeadsTableProps {
  leads: Lead[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.contact_number.includes(search) ||
      lead.device_model.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;

    const matchesDevice =
      deviceFilter === "all" || lead.device_type === deviceFilter;

    return matchesSearch && matchesStatus && matchesDevice;
  });

  const getStatusBadge = (status: LeadStatus) => {
    const colors = STATUS_COLORS[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
    };
    return (
      <Badge className={`${colors.bg} ${colors.text} capitalize border-0`}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType: DeviceType) => {
    switch (deviceType) {
      case "iPhone":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-black"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] border-black">
            <SelectValue placeholder="Filter by status" />
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
        <Select value={deviceFilter} onValueChange={setDeviceFilter}>
          <SelectTrigger className="w-full sm:w-[180px] border-black">
            <SelectValue placeholder="Filter by device" />
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
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          Showing {filteredLeads.length} of {leads.length} leads
        </span>
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
              <TableHead className="font-semibold text-black">Status</TableHead>
              <TableHead className="font-semibold text-black">Assigned To</TableHead>
              <TableHead className="font-semibold text-black">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-gray-500"
                >
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer">
                  <TableCell>
                    <div className="font-medium text-black">
                      {lead.customer_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {lead.lead_source}
                    </div>
                  </TableCell>
                  <TableCell>
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
                      {getDeviceIcon(lead.device_type)}
                      <div>
                        <div className="font-medium text-black">
                          {lead.device_type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.device_model}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-black">
                      {lead.issue_reported}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>
                    {lead.staff ? (
                      <span className="text-sm text-black">
                        {lead.staff.full_name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(lead.created_at)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
