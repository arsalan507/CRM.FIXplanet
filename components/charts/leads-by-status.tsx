"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { LeadsByStatus } from "@/lib/types";

interface LeadsByStatusChartProps {
  data: LeadsByStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#3B82F6",
  contacted: "#F59E0B",
  qualified: "#8B5CF6",
  pickup_scheduled: "#F97316",
  in_repair: "#06B6D4",
  completed: "#10B981",
  delivered: "#059669",
  cancelled: "#EF4444",
};

export function LeadsByStatusChart({ data }: LeadsByStatusChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: item.status.replace("_", " "),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">
            Leads by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis type="number" stroke="#737373" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#737373"
                  fontSize={12}
                  width={100}
                  tickFormatter={(value) =>
                    value.charAt(0).toUpperCase() + value.slice(1)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    border: "1px solid #000",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number) => [value, "Leads"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || "#000"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
