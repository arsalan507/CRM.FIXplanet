"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Target, Trophy, IndianRupee, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonMetric {
  current: number;
  previous: number;
  change: number;
}

interface ComparativeStatsProps {
  comparison: {
    totalOpportunities: ComparisonMetric;
    winRate: ComparisonMetric;
    avgDealValue: ComparisonMetric;
    revenue: ComparisonMetric;
  } | null;
  periodLabel: string;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 100000) {
    return `${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

function ChangeIndicator({ change, suffix = "%" }: { change: number; suffix?: string }) {
  if (change === 0) {
    return (
      <span className="flex items-center text-xs text-gray-500">
        <Minus className="h-3 w-3 mr-1" />
        No change
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <span
      className={cn(
        "flex items-center text-xs font-medium",
        isPositive ? "text-green-600" : "text-red-600"
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3 mr-1" />
      ) : (
        <TrendingDown className="h-3 w-3 mr-1" />
      )}
      {isPositive ? "+" : ""}
      {change}
      {suffix}
    </span>
  );
}

export function ComparativeStats({ comparison, periodLabel, isLoading }: ComparativeStatsProps) {
  if (!comparison) return null;

  const metrics = [
    {
      label: "Opportunities",
      icon: Users,
      value: comparison.totalOpportunities.current,
      change: comparison.totalOpportunities.change,
      suffix: "%",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Win Rate",
      icon: Trophy,
      value: `${comparison.winRate.current}%`,
      change: comparison.winRate.change,
      suffix: "pts",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Avg Deal Value",
      icon: Target,
      value: `₹${formatCurrency(comparison.avgDealValue.current)}`,
      change: comparison.avgDealValue.change,
      suffix: "%",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "Revenue",
      icon: IndianRupee,
      value: `₹${formatCurrency(comparison.revenue.current)}`,
      change: comparison.revenue.change,
      suffix: "%",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  return (
    <Card className="border-black">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">
            vs {periodLabel}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", metric.iconBg)}>
                  <metric.icon className={cn("h-4 w-4", metric.iconColor)} />
                </div>
                <div>
                  <p className="text-lg font-bold">{metric.value}</p>
                  <p className="text-xs text-gray-500">{metric.label}</p>
                </div>
              </div>
              <ChangeIndicator change={metric.change} suffix={metric.suffix} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
