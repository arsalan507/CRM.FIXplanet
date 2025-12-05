"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatPhoneNumber, formatDateTime, formatCurrency } from "@/lib/utils";
import {
  updateOpportunityStage,
  updateQuotedAmount,
  getOpportunities,
  getOpportunityStats,
  getComparativeStats,
  getPreviousPeriod,
  exportOpportunitiesToCSV,
  type DateRange,
} from "@/app/actions/opportunities";
import { DateRangeFilter, type DateRangeValue } from "@/components/opportunities/date-range-filter";
import { ComparativeStats } from "@/components/opportunities/comparative-stats";
import type { Opportunity, OpportunityStage, UserRole } from "@/lib/types";
import {
  TrendingUp,
  Target,
  DollarSign,
  CheckCircle,
  XCircle,
  Phone,
  Smartphone,
  ArrowRight,
  IndianRupee,
  Loader2,
  Trophy,
  Download,
  Filter,
} from "lucide-react";

interface OpportunityStats {
  totalOpportunities: number;
  qualified: number;
  pickup: number;
  won: number;
  lost: number;
  expectedRevenue: number;
  actualRevenue: number;
  winRate: number;
  avgDealValue: number;
}

interface OpportunitiesPageClientProps {
  opportunities: Opportunity[];
  stats: OpportunityStats | null;
  currentUserRole: UserRole;
}

const STAGES: { key: OpportunityStage; label: string; color: string }[] = [
  { key: "qualified", label: "Qualified", color: "bg-blue-500" },
  { key: "pickup", label: "Pickup Scheduled", color: "bg-yellow-500" },
  { key: "in_repair", label: "In Repair", color: "bg-purple-500" },
  { key: "closed_won", label: "Closed Won", color: "bg-green-500" },
  { key: "closed_lost", label: "Closed Lost", color: "bg-red-500" },
];

export function OpportunitiesPageClient({
  opportunities: initialOpportunities,
  stats: initialStats,
  currentUserRole,
}: OpportunitiesPageClientProps) {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [quotedAmount, setQuotedAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Date filtering state
  const [dateRange, setDateRange] = useState<DateRangeValue | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [stats, setStats] = useState<OpportunityStats | null>(initialStats);
  const [comparison, setComparison] = useState<{
    totalOpportunities: { current: number; previous: number; change: number };
    winRate: { current: number; previous: number; change: number };
    avgDealValue: { current: number; previous: number; change: number };
    revenue: { current: number; previous: number; change: number };
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const totalFilteredCount = opportunities.length;
  const totalAllCount = initialOpportunities.length;

  // Fetch filtered data when date range changes
  const fetchFilteredData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const dateRangeParam: DateRange | undefined = dateRange
        ? { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() }
        : undefined;

      const [oppsResult, statsResult] = await Promise.all([
        getOpportunities(undefined, dateRangeParam),
        getOpportunityStats(dateRangeParam),
      ]);

      if (oppsResult.success) {
        setOpportunities(oppsResult.data || []);
      }
      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // Fetch comparative stats if date range is set
      if (dateRange) {
        const currentRange: DateRange = {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        };
        const previousRange = await getPreviousPeriod(currentRange);
        const compResult = await getComparativeStats(currentRange, previousRange);
        if (compResult.success && compResult.data) {
          setComparison(compResult.data);
        }
      } else {
        setComparison(null);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    if (dateRange !== null) {
      fetchFilteredData();
    } else {
      // Reset to initial data
      setOpportunities(initialOpportunities);
      setStats(initialStats);
      setComparison(null);
    }
  }, [dateRange, fetchFilteredData, initialOpportunities, initialStats]);

  const getOpportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities.filter((opp) => opp.stage === stage);
  };

  const handleStageChange = (oppId: string, newStage: OpportunityStage) => {
    startTransition(async () => {
      const result = await updateOpportunityStage(oppId, newStage);
      if (result.success) {
        toast({ title: "Success", description: "Stage updated" });
        fetchFilteredData();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleUpdateQuote = () => {
    if (!selectedOpp || !quotedAmount) return;

    startTransition(async () => {
      const result = await updateQuotedAmount(selectedOpp.id, parseInt(quotedAmount));
      if (result.success) {
        toast({ title: "Success", description: "Quote updated" });
        setSelectedOpp(null);
        setQuotedAmount("");
        fetchFilteredData();
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const dateRangeParam: DateRange | undefined = dateRange
        ? { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() }
        : undefined;

      const result = await exportOpportunitiesToCSV(dateRangeParam);

      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        // Generate filename with date range
        let filename = "opportunities";
        if (dateRange) {
          filename += `_${format(dateRange.from, "MMMd")}-${format(dateRange.to, "MMMd_yyyy")}`;
        }
        filename += ".csv";

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({ title: "Success", description: "Export completed" });
      } else {
        toast({ title: "Error", description: result.error || "Export failed", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Export failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const getPriorityBadge = (priority: number) => {
    const colors: Record<number, string> = {
      1: "bg-red-100 text-red-800",
      2: "bg-orange-100 text-orange-800",
      3: "bg-yellow-100 text-yellow-800",
      4: "bg-blue-100 text-blue-800",
      5: "bg-gray-100 text-gray-800",
    };
    const labels: Record<number, string> = {
      1: "Critical",
      2: "High",
      3: "Medium",
      4: "Low",
      5: "Lowest",
    };
    return (
      <Badge className={`${colors[priority] || colors[3]} border-0 text-xs`}>
        {labels[priority] || "Medium"}
      </Badge>
    );
  };

  const getPeriodLabel = () => {
    if (!dateRange) return "";
    const duration = dateRange.to.getTime() - dateRange.from.getTime();
    const days = Math.ceil(duration / (1000 * 60 * 60 * 24));
    if (days <= 1) return "Previous Day";
    if (days <= 7) return "Previous Week";
    if (days <= 31) return "Previous Month";
    return "Previous Period";
  };

  const canManage = ["super_admin", "operation_manager", "sell_executive"].includes(currentUserRole);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Sales Pipeline</h1>
          <p className="text-sm text-gray-500">
            Track opportunities from qualification to close
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-black gap-2"
          onClick={handleExportCSV}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="border-black">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter by Date</span>
          </div>
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
          />
          {dateRange && (
            <p className="text-xs text-gray-500 mt-2">
              Showing {totalFilteredCount} of {totalAllCount} opportunities
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparative Stats */}
      {comparison && (
        <ComparativeStats
          comparison={comparison}
          periodLabel={getPeriodLabel()}
          isLoading={isLoadingData}
        />
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border-black">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalOpportunities}</p>
                  <p className="text-xs text-gray-500">Total Pipeline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.won}</p>
                  <p className="text-xs text-gray-500">Won</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
                  <p className="text-xs text-gray-500">Lost</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.winRate}%</p>
                  <p className="text-xs text-gray-500">Win Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xl font-bold flex items-center">
                    <IndianRupee className="h-4 w-4" />
                    {formatCurrency(stats.expectedRevenue)}
                  </p>
                  <p className="text-xs text-gray-500">Pipeline Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold flex items-center text-green-600">
                    <IndianRupee className="h-4 w-4" />
                    {formatCurrency(stats.actualRevenue)}
                  </p>
                  <p className="text-xs text-gray-500">Revenue Won</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAGES.filter(s => s.key !== "closed_lost").map((stage) => {
          const stageOpps = getOpportunitiesByStage(stage.key);
          return (
            <Card key={stage.key} className="border-black">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                    {stage.label}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stageOpps.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {stageOpps.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No opportunities</p>
                ) : (
                  stageOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="p-3 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedOpp(opp);
                        setQuotedAmount(opp.expected_revenue?.toString() || "");
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm text-black truncate flex-1">
                          {opp.customer_name}
                        </p>
                        {getPriorityBadge(opp.priority)}
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {opp.device_info}
                        </p>
                        <p className="truncate">{opp.issue}</p>
                        {opp.expected_revenue > 0 && (
                          <p className="font-medium text-black flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {formatCurrency(opp.expected_revenue)}
                          </p>
                        )}
                      </div>
                      {canManage && stage.key !== "closed_won" && (
                        <div className="mt-2 pt-2 border-t flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStage = STAGES[STAGES.findIndex(s => s.key === stage.key) + 1];
                              if (nextStage) {
                                handleStageChange(opp.id, nextStage.key);
                              }
                            }}
                            disabled={isPending}
                          >
                            Move <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lost Opportunities */}
      {getOpportunitiesByStage("closed_lost").length > 0 && (
        <Card className="border-black border-red-200">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Lost Opportunities ({getOpportunitiesByStage("closed_lost").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {getOpportunitiesByStage("closed_lost").map((opp) => (
                <div
                  key={opp.id}
                  className="p-3 border border-red-200 rounded-lg bg-red-50"
                >
                  <p className="font-medium text-sm">{opp.customer_name}</p>
                  <p className="text-xs text-gray-500">{opp.device_info}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(opp.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Opportunity Detail Modal */}
      <Dialog open={!!selectedOpp} onOpenChange={() => setSelectedOpp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opportunity Details</DialogTitle>
          </DialogHeader>

          {selectedOpp && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold">
                  {selectedOpp.customer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-lg">{selectedOpp.customer_name}</p>
                  <a
                    href={`tel:${selectedOpp.contact_number}`}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {formatPhoneNumber(selectedOpp.contact_number)}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Device</p>
                  <p className="font-medium">{selectedOpp.device_info}</p>
                </div>
                <div>
                  <p className="text-gray-500">Issue</p>
                  <p className="font-medium">{selectedOpp.issue}</p>
                </div>
                <div>
                  <p className="text-gray-500">Stage</p>
                  <Badge className="capitalize">{selectedOpp.stage.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">Priority</p>
                  {getPriorityBadge(selectedOpp.priority)}
                </div>
              </div>

              {canManage && (
                <>
                  <div className="space-y-2">
                    <Label>Quoted Amount (INR)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={quotedAmount}
                      onChange={(e) => setQuotedAmount(e.target.value)}
                      className="border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Move to Stage</Label>
                    <Select
                      value={selectedOpp.stage}
                      onValueChange={(v) => handleStageChange(selectedOpp.id, v as OpportunityStage)}
                    >
                      <SelectTrigger className="border-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage.key} value={stage.key}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedOpp(null)} className="border-black">
                  Close
                </Button>
                {canManage && (
                  <Button onClick={handleUpdateQuote} disabled={isPending || !quotedAmount}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Update Quote
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
