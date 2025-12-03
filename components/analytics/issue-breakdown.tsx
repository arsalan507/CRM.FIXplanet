"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Clock, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface IssueData {
  issue: string;
  total_count: number;
  avg_quoted_amount: number;
  avg_repair_time_hours: number | null;
}

interface IssueBreakdownProps {
  data: IssueData[];
  daysBack?: number;
}

export function IssueBreakdown({ data, daysBack = 30 }: IssueBreakdownProps) {
  const totalIssues = data.reduce((sum, item) => sum + item.total_count, 0);
  const maxCount = Math.max(...data.map((item) => item.total_count));

  // Take top 10
  const topIssues = data.slice(0, 10);

  const formatHours = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  return (
    <Card className="border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Common Issues ({daysBack}d)
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-black">{totalIssues}</p>
            <p className="text-xs text-gray-500">Total Repairs</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {topIssues.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No issue data available</p>
            <p className="text-xs mt-1">Data will appear once repairs are completed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top Issue Highlight */}
            {topIssues[0] && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">#1 Most Common</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">{topIssues[0].issue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-900">{topIssues[0].total_count}</p>
                    <p className="text-xs text-blue-600">Repairs</p>
                  </div>
                </div>
              </div>
            )}

            {/* Issue List */}
            <div className="space-y-3">
              {topIssues.map((issue, index) => {
                const percentage = totalIssues > 0 ? (issue.total_count / totalIssues) * 100 : 0;
                const barWidth = maxCount > 0 ? (issue.total_count / maxCount) * 100 : 0;
                const isTopIssue = index === 0;

                return (
                  <div key={issue.issue} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium text-black text-sm">{issue.issue}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(issue.avg_quoted_amount)} avg
                          </span>
                          {issue.avg_repair_time_hours !== null && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatHours(issue.avg_repair_time_hours)} avg time
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-black">{issue.total_count}</p>
                        <p className="text-xs text-gray-500">{Math.round(percentage)}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isTopIssue ? "bg-blue-500" : "bg-gray-400"
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Unique Issues</p>
                <p className="text-lg font-bold text-black">{data.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Repair Value</p>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(
                    data.length > 0
                      ? data.reduce((sum, item) => sum + item.avg_quoted_amount * item.total_count, 0) / totalIssues
                      : 0
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Repair Time</p>
                <p className="text-lg font-bold text-black">
                  {(() => {
                    const validTimes = data.filter((item) => item.avg_repair_time_hours !== null);
                    if (validTimes.length === 0) return "N/A";
                    const avgTime =
                      validTimes.reduce(
                        (sum, item) => sum + (item.avg_repair_time_hours || 0) * item.total_count,
                        0
                      ) / validTimes.reduce((sum, item) => sum + item.total_count, 0);
                    return formatHours(avgTime);
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
