"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, TrendingUp, TrendingDown, Timer } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

interface TurnaroundMetricsProps {
  avgRepairTime: number; // hours
  avgResponseTime: number; // hours
  overdueRepairs: number;
  repairsCompleted: number;
  fastestRepairTime?: number | null;
  slowestRepairTime?: number | null;
}

export function TurnaroundMetrics({
  avgRepairTime,
  avgResponseTime,
  overdueRepairs,
  repairsCompleted,
  fastestRepairTime,
  slowestRepairTime,
}: TurnaroundMetricsProps) {
  const isOverdueAlert = overdueRepairs > 0;

  const formatHours = (hours: number) => {
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Avg Repair Time */}
      <Card className="border-black">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Avg Repair Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black">{formatHours(avgRepairTime)}</span>
              {avgRepairTime <= 24 && (
                <Badge className="bg-green-100 text-green-800 border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Fast
                </Badge>
              )}
              {avgRepairTime > 48 && (
                <Badge className="bg-red-100 text-red-800 border-0">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Slow
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Based on {repairsCompleted} completed repairs</p>
              {fastestRepairTime !== null && fastestRepairTime !== undefined && (
                <p className="text-green-600">Fastest: {formatHours(fastestRepairTime)}</p>
              )}
              {slowestRepairTime !== null && slowestRepairTime !== undefined && (
                <p className="text-red-600">Slowest: {formatHours(slowestRepairTime)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg Response Time */}
      <Card className="border-black">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Avg Response Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black">{formatHours(avgResponseTime)}</span>
              {avgResponseTime <= 2 && (
                <Badge className="bg-green-100 text-green-800 border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Excellent
                </Badge>
              )}
              {avgResponseTime > 4 && (
                <Badge className="bg-yellow-100 text-yellow-800 border-0">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Needs Improvement
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">
              <p>Time from lead created to first contact</p>
              <p className="mt-1 text-gray-400">Target: &lt;2 hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Repairs */}
      <Card className={`border-black ${isOverdueAlert ? "bg-red-50" : ""}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${isOverdueAlert ? "text-red-600" : ""}`} />
            Overdue Repairs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${isOverdueAlert ? "text-red-600" : "text-black"}`}>
                {overdueRepairs}
              </span>
              {isOverdueAlert && (
                <Badge className="bg-red-600 text-white border-0 animate-pulse">
                  Alert
                </Badge>
              )}
              {!isOverdueAlert && (
                <Badge className="bg-green-100 text-green-800 border-0">
                  On Track
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500">
              <p>Repairs taking &gt;48 hours</p>
              {isOverdueAlert && (
                <Link href="/leads?filter=in_repair">
                  <Button variant="link" className="h-auto p-0 text-xs text-red-600 hover:text-red-700">
                    View overdue repairs →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
