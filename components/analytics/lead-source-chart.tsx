"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LeadSourceData {
  source: string;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
  total_revenue: number;
}

interface LeadSourceChartProps {
  data: LeadSourceData[];
  daysBack?: number;
}

export function LeadSourceChart({ data, daysBack = 30 }: LeadSourceChartProps) {
  const totalLeads = data.reduce((sum, item) => sum + item.total_leads, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);

  // Calculate max for bar width
  const maxLeads = Math.max(...data.map((item) => item.total_leads));

  // Get top performer
  const topPerformer = data.length > 0 ? data[0] : null;

  return (
    <Card className="border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Lead Sources ({daysBack}d)
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-black">{totalLeads}</p>
            <p className="text-xs text-gray-500">Total Leads</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No lead source data available</p>
            <p className="text-xs mt-1">Data will appear once leads are created</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Performer Highlight */}
            {topPerformer && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-900">Top Performer</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">{topPerformer.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-900">{topPerformer.conversion_rate}%</p>
                    <p className="text-xs text-green-600">Conversion</p>
                  </div>
                </div>
              </div>
            )}

            {/* Source List */}
            <div className="space-y-3">
              {data.map((source) => {
                const percentage = maxLeads > 0 ? (source.total_leads / maxLeads) * 100 : 0;
                const isTopPerformer = source === topPerformer;

                return (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-black">{source.source}</span>
                        <Badge variant="outline" className="text-xs">
                          {source.total_leads} leads
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-600">
                          {source.conversion_rate}% conversion
                        </span>
                        <span className="font-medium text-black flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(source.total_revenue)}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isTopPerformer ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{source.converted_leads} converted</span>
                      <span>{Math.round(percentage)}% of total</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-black">{formatCurrency(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg per Lead</p>
                <p className="text-lg font-bold text-black">
                  {formatCurrency(totalLeads > 0 ? totalRevenue / totalLeads : 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
