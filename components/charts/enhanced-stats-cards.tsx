"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  TrendingUp,
  TrendingDown,
  Wrench,
  BarChart3,
  Sparkles,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/dashboard";

interface EnhancedStatsCardsProps {
  metrics: DashboardMetrics;
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
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return null;

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const bgClass = isPositive ? "bg-green-50" : "bg-red-50";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} ${bgClass}`}
    >
      <Icon className="h-3 w-3" />
      <span>{Math.abs(value)}%</span>
    </motion.div>
  );
}

export function EnhancedStatsCards({ metrics }: EnhancedStatsCardsProps) {
  const cards = [
    {
      title: "Total Leads",
      value: metrics.totalLeads,
      trend: metrics.totalLeadsTrend,
      icon: Phone,
      description: "All time leads",
      gradient: "from-blue-500/10 to-blue-500/5",
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate}%`,
      trend: metrics.conversionRateTrend,
      icon: BarChart3,
      description: "Leads to customers",
      gradient: "from-green-500/10 to-green-500/5",
    },
    {
      title: "Active Repairs",
      value: metrics.activeRepairs,
      trend: metrics.activeRepairsTrend,
      icon: Wrench,
      description: "Currently in progress",
      gradient: "from-orange-500/10 to-orange-500/5",
    },
    {
      title: "New Today",
      value: metrics.newLeadsToday,
      trend: metrics.newLeadsTodayTrend,
      icon: Sparkles,
      description: "Leads received today",
      gradient: "from-purple-500/10 to-purple-500/5",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((card, index) => (
        <motion.div key={card.title} variants={item}>
          <Card className="border-black overflow-hidden">
            <CardContent className="p-6 relative">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                  <TrendIndicator value={card.trend} />
                </div>
                <div className="flex items-center justify-between">
                  <motion.p
                    className="text-3xl font-bold text-black"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.2 + index * 0.1,
                      type: "spring",
                      stiffness: 100,
                    }}
                  >
                    {card.value}
                  </motion.p>
                  <motion.div
                    className="p-3 bg-black/5 rounded-full"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <card.icon className="h-5 w-5 text-black" />
                  </motion.div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
