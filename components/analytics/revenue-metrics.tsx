"use client";

import { Card } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RevenueMetricsProps {
  totalRevenue: number;
  pendingAmount: number;
  paidInvoices: number;
  pendingInvoices: number;
  avgInvoiceValue: number;
  daysBack?: number;
}

export function RevenueMetrics({
  totalRevenue,
  pendingAmount,
  paidInvoices,
  pendingInvoices,
  avgInvoiceValue,
  daysBack = 30,
}: RevenueMetricsProps) {
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      description: `Last ${daysBack} days`,
    },
    {
      title: "Pending Amount",
      value: formatCurrency(pendingAmount),
      icon: Clock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      description: "Outstanding invoices",
    },
    {
      title: "Paid Invoices",
      value: paidInvoices.toString(),
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      description: `Last ${daysBack} days`,
    },
    {
      title: "Pending Invoices",
      value: pendingInvoices.toString(),
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      description: "Awaiting payment",
    },
    {
      title: "Avg Invoice Value",
      value: formatCurrency(avgInvoiceValue),
      icon: TrendingUp,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      description: `Last ${daysBack} days`,
    },
  ];

  return (
    <div className="bg-white border border-black p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Revenue Metrics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Financial overview for the last {daysBack} days
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`h-10 w-10 ${metric.iconBg} rounded-full flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{metric.title}</p>
                <p className="text-xl font-bold text-black mb-1">
                  {metric.value}
                </p>
                <p className="text-xs text-gray-400">{metric.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
