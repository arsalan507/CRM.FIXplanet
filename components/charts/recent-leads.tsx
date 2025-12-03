"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/config";
import type { Lead, LeadStatus } from "@/lib/types";
import { ArrowRight, Phone } from "lucide-react";

interface RecentLeadsProps {
  leads: Lead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-black">
            Recent Leads
          </CardTitle>
          <Link href="/leads">
            <Button variant="ghost" size="sm" className="gap-2">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              No leads yet. They will appear here once created.
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Phone className="h-4 w-4 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-black">
                        {lead.customer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lead.device_type} {lead.device_model} -{" "}
                        {lead.issue_reported}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(lead.status)}
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {formatDateTime(lead.created_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
