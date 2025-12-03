"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { TeamPerformance } from "@/lib/dashboard";

interface TeamPerformanceTableProps {
  data: TeamPerformance[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

function ProgressBar({ value, delay }: { value: number; delay: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
        style={{
          background:
            value >= 70
              ? "#10B981"
              : value >= 40
              ? "#F59E0B"
              : "#EF4444",
        }}
      />
    </div>
  );
}

export function TeamPerformanceTable({ data }: TeamPerformanceTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="border-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">
            Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              No team members to display
            </div>
          ) : (
            <motion.div
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 pb-2 border-b border-gray-200">
                <div className="col-span-4">Team Member</div>
                <div className="col-span-2 text-center">Assigned</div>
                <div className="col-span-2 text-center">Converted</div>
                <div className="col-span-4">Conversion Rate</div>
              </div>

              {/* Rows */}
              {data.map((member, index) => (
                <motion.div
                  key={member.id}
                  variants={item}
                  className="grid grid-cols-12 gap-4 items-center py-2"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-black">
                      <AvatarFallback className="bg-black text-white text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm text-black truncate">
                      {member.name}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <motion.span
                      className="text-sm font-semibold text-black"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      {member.assignedLeads}
                    </motion.span>
                  </div>
                  <div className="col-span-2 text-center">
                    <motion.span
                      className="text-sm font-semibold text-green-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      {member.convertedLeads}
                    </motion.span>
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar
                        value={member.conversionRate}
                        delay={0.5 + index * 0.1}
                      />
                    </div>
                    <motion.span
                      className="text-sm font-semibold text-black w-10 text-right"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      {member.conversionRate}%
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
