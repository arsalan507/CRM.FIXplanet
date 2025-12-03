"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { LeadsByDevice } from "@/lib/types";

interface LeadsByDeviceChartProps {
  data: LeadsByDevice[];
}

const DEVICE_COLORS: Record<string, string> = {
  iPhone: "#000000",
  "Apple Watch": "#404040",
  MacBook: "#737373",
  iPad: "#A3A3A3",
};

export function LeadsByDeviceChart({ data }: LeadsByDeviceChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: item.device_type,
    value: item.count,
  }));

  const totalLeads = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">
            Leads by Device
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DEVICE_COLORS[entry.device_type] || "#000"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    border: "1px solid #000",
                    borderRadius: "6px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} (${((value / totalLeads) * 100).toFixed(1)}%)`,
                    name,
                  ]}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#000" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
