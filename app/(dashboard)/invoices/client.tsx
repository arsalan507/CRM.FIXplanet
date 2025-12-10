"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Invoice, Staff } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteInvoice } from "@/app/actions/invoices";
import { toast } from "sonner";

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  revenueMetrics: any;
  currentStaff: Staff | null;
}

export function InvoicesClient({
  initialInvoices,
  revenueMetrics,
  currentStaff,
}: InvoicesClientProps) {
  const router = useRouter();
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // Status filter
      if (statusFilter !== "all" && invoice.payment_status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          invoice.customer_name.toLowerCase().includes(query) ||
          invoice.invoice_number.toLowerCase().includes(query) ||
          invoice.customer_phone.includes(query)
        );
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleDelete = async (invoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      return;
    }

    setDeleteLoading(invoiceId);
    const result = await deleteInvoice(invoiceId);

    if (result.success) {
      toast.success("Invoice deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete invoice");
    }
    setDeleteLoading(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case "pending":
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Invoices</h1>
          <p className="text-sm text-gray-500">
            Manage invoices and track payments
          </p>
        </div>
        <Button
          onClick={() => router.push("/invoices/new")}
          className="bg-black hover:bg-gray-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Revenue Metrics */}
      {revenueMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-black mt-1">
                  {formatCurrency(revenueMetrics.totalRevenue || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Amount</p>
                <p className="text-2xl font-bold text-black mt-1">
                  {formatCurrency(revenueMetrics.pendingAmount || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid Invoices</p>
                <p className="text-2xl font-bold text-black mt-1">
                  {revenueMetrics.paidInvoices || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-black p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Invoice Value</p>
                <p className="text-2xl font-bold text-black mt-1">
                  {formatCurrency(revenueMetrics.avgInvoiceValue || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-black p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-black"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-48 border-black">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-black">
        <Table>
          <TableHeader>
            <TableRow className="border-black hover:bg-gray-50">
              <TableHead className="font-bold text-black">Invoice #</TableHead>
              <TableHead className="font-bold text-black">Customer</TableHead>
              <TableHead className="font-bold text-black">Date</TableHead>
              <TableHead className="font-bold text-black">Amount</TableHead>
              <TableHead className="font-bold text-black">Paid</TableHead>
              <TableHead className="font-bold text-black">Due</TableHead>
              <TableHead className="font-bold text-black">Status</TableHead>
              <TableHead className="font-bold text-black text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== "all"
                      ? "No invoices match your filters"
                      : "No invoices yet"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button
                      onClick={() => router.push("/invoices/new")}
                      variant="outline"
                      className="mt-4 border-black"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Invoice
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="border-black hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {invoice.customer_phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(invoice.total_amount)}
                  </TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(invoice.payment_status === 'paid' ? invoice.total_amount : (invoice.amount_paid || 0))}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {formatCurrency(invoice.payment_status === 'paid' ? 0 : (invoice.amount_due || invoice.total_amount))}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoices/${invoice.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoices/${invoice.id}/edit`);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement SMS sending
                            toast.info("SMS sending coming soon");
                          }}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send SMS
                        </DropdownMenuItem>
                        {currentStaff?.role === "super_admin" && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(invoice.id, invoice.invoice_number);
                              }}
                              className="text-red-600"
                              disabled={deleteLoading === invoice.id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deleteLoading === invoice.id
                                ? "Deleting..."
                                : "Delete"}
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
    </div>
  );
}
