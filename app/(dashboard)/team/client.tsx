"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/utils";
import type { Staff, UserRole } from "@/lib/types";
import {
  Trophy,
  TrendingUp,
  Users,
  Phone,
  Target,
  Award,
  Medal,
} from "lucide-react";

interface StaffWithMetrics extends Staff {
  metrics?: {
    totalLeads: number;
    wonLeads: number;
    lostLeads: number;
    conversionRate: number;
    totalCalls: number;
    avgCallDuration: number;
  };
}

interface LeaderboardEntry {
  id: string;
  name: string;
  role: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
}

interface TeamPageClientProps {
  staffWithMetrics: StaffWithMetrics[];
  leaderboard: LeaderboardEntry[];
  currentUserRole: UserRole;
}

export function TeamPageClient({
  staffWithMetrics,
  leaderboard,
}: TeamPageClientProps) {
  const [selectedPeriod] = useState<"today" | "week" | "month" | "all">("month");

  // Calculate team totals
  const teamStats = staffWithMetrics.reduce(
    (acc, staff) => {
      if (staff.metrics) {
        acc.totalLeads += staff.metrics.totalLeads;
        acc.wonLeads += staff.metrics.wonLeads;
        acc.lostLeads += staff.metrics.lostLeads;
        acc.totalCalls += staff.metrics.totalCalls;
      }
      return acc;
    },
    { totalLeads: 0, wonLeads: 0, lostLeads: 0, totalCalls: 0 }
  );

  const teamConversionRate = teamStats.totalLeads > 0
    ? Math.round((teamStats.wonLeads / teamStats.totalLeads) * 1000) / 10
    : 0;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold text-gray-400">{index + 1}</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-800",
      manager: "bg-blue-100 text-blue-800",
      telecaller: "bg-green-100 text-green-800",
      pickup_agent: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge className={`${colors[role] || "bg-gray-100 text-gray-800"} capitalize border-0`}>
        {role.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Team Performance</h1>
        <p className="text-sm text-gray-500">
          Track your team&apos;s performance metrics and leaderboard
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-black">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-3xl font-bold text-black">{teamStats.totalLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Conversions</p>
                <p className="text-3xl font-bold text-green-600">{teamStats.wonLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-3xl font-bold text-black">{teamConversionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Calls</p>
                <p className="text-3xl font-bold text-black">{teamStats.totalCalls}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Phone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <Card className="border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Performers ({selectedPeriod === "month" ? "This Month" : selectedPeriod})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No performance data available yet
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0
                          ? "bg-yellow-50 border-2 border-yellow-200"
                          : index === 1
                          ? "bg-gray-50 border-2 border-gray-200"
                          : index === 2
                          ? "bg-amber-50 border-2 border-amber-200"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(index)}
                        </div>
                        <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-black">{entry.name}</p>
                          {getRoleBadge(entry.role)}
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-right">
                        <div>
                          <p className="text-2xl font-bold text-black">{entry.totalLeads}</p>
                          <p className="text-xs text-gray-500">Leads</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{entry.wonLeads}</p>
                          <p className="text-xs text-gray-500">Won</p>
                        </div>
                        <div className="w-20">
                          <p className={`text-2xl font-bold ${
                            entry.conversionRate >= 50 ? "text-green-600" :
                            entry.conversionRate >= 25 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {entry.conversionRate}%
                          </p>
                          <p className="text-xs text-gray-500">Conv. Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Metrics Tab */}
        <TabsContent value="details" className="mt-4">
          <Card className="border-black">
            <CardHeader>
              <CardTitle>Staff Performance Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-black bg-gray-50">
                    <TableHead className="font-semibold">Staff Member</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold text-center">Leads</TableHead>
                    <TableHead className="font-semibold text-center">Won</TableHead>
                    <TableHead className="font-semibold text-center">Lost</TableHead>
                    <TableHead className="font-semibold text-center">Conv. Rate</TableHead>
                    <TableHead className="font-semibold text-center">Calls</TableHead>
                    <TableHead className="font-semibold text-center">Avg. Duration</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffWithMetrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                        No staff members found
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffWithMetrics.map((staff) => (
                      <TableRow key={staff.id} className="border-black">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
                              {staff.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{staff.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(staff.role)}</TableCell>
                        <TableCell className="text-center font-medium">
                          {staff.metrics?.totalLeads || 0}
                        </TableCell>
                        <TableCell className="text-center font-medium text-green-600">
                          {staff.metrics?.wonLeads || 0}
                        </TableCell>
                        <TableCell className="text-center font-medium text-red-600">
                          {staff.metrics?.lostLeads || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${
                            (staff.metrics?.conversionRate || 0) >= 50 ? "text-green-600" :
                            (staff.metrics?.conversionRate || 0) >= 25 ? "text-yellow-600" : "text-gray-600"
                          }`}>
                            {staff.metrics?.conversionRate || 0}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {staff.metrics?.totalCalls || 0}
                        </TableCell>
                        <TableCell className="text-center text-gray-500">
                          {staff.metrics?.avgCallDuration
                            ? formatDuration(staff.metrics.avgCallDuration)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={staff.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {staff.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
