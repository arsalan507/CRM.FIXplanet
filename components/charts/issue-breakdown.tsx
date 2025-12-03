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
import type { IssueBreakdown } from "@/lib/dashboard";

interface IssueBreakdownChartProps {
  data: IssueBreakdown[];
}

const COLORS = [
  "#000000",
  "#1a1a1a",
  "#333333",
  "#4d4d4d",
  "#666666",
  "#808080",
  "#999999",
  "#b3b3b3",
  "#cccccc",
  "#e6e6e6",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-3 rounded-lg shadow-lg border border-gray-800">
        <p className="font-medium">{payload[0].payload.issue}</p>
        <p className="text-sm text-gray-300">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export function IssueBreakdownChart({ data }: IssueBreakdownChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-black">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-black">
            Top Issues Reported
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" horizontal={false} />
                <XAxis type="number" stroke="#737373" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="issue"
                  stroke="#737373"
                  fontSize={11}
                  width={80}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
                <Bar
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
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
