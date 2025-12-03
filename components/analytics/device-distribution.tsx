"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Laptop, Watch, Tablet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DeviceData {
  device_type: string;
  total_count: number;
  completed_count: number;
  avg_repair_value: number;
}

interface DeviceDistributionProps {
  data: DeviceData[];
  daysBack?: number;
}

const deviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  iPhone: Smartphone,
  MacBook: Laptop,
  "Apple Watch": Watch,
  iPad: Tablet,
};

const deviceColors: Record<string, string> = {
  iPhone: "bg-blue-500",
  MacBook: "bg-purple-500",
  "Apple Watch": "bg-red-500",
  iPad: "bg-green-500",
};

export function DeviceDistribution({ data, daysBack = 30 }: DeviceDistributionProps) {
  const totalCount = data.reduce((sum, item) => sum + item.total_count, 0);
  const maxCount = Math.max(...data.map((item) => item.total_count));

  return (
    <Card className="border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Distribution ({daysBack}d)
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-black">{totalCount}</p>
            <p className="text-xs text-gray-500">Total Repairs</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No device data available</p>
            <p className="text-xs mt-1">Data will appear once repairs are completed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((device) => {
              const Icon = deviceIcons[device.device_type] || Smartphone;
              const colorClass = deviceColors[device.device_type] || "bg-gray-500";
              const percentage = totalCount > 0 ? (device.total_count / totalCount) * 100 : 0;
              const barWidth = maxCount > 0 ? (device.total_count / maxCount) * 100 : 0;
              const completionRate =
                device.total_count > 0 ? (device.completed_count / device.total_count) * 100 : 0;

              return (
                <div key={device.device_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{device.device_type}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{device.total_count} repairs</span>
                          <span>•</span>
                          <span>{device.completed_count} completed</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-black">{formatCurrency(device.avg_repair_value)}</p>
                      <p className="text-xs text-gray-500">Avg Value</p>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colorClass} transition-all`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(percentage)}% of total</span>
                      <span>{Math.round(completionRate)}% completion rate</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Most Popular</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const top = data[0];
                      if (!top) return <span className="text-sm">N/A</span>;
                      const Icon = deviceIcons[top.device_type] || Smartphone;
                      const colorClass = deviceColors[top.device_type] || "bg-gray-500";
                      return (
                        <>
                          <div className={`h-6 w-6 rounded ${colorClass} flex items-center justify-center`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-black">{top.device_type}</span>
                          <Badge variant="outline" className="text-xs">{top.total_count}</Badge>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Highest Value</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const highest = [...data].sort((a, b) => b.avg_repair_value - a.avg_repair_value)[0];
                      if (!highest) return <span className="text-sm">N/A</span>;
                      const Icon = deviceIcons[highest.device_type] || Smartphone;
                      const colorClass = deviceColors[highest.device_type] || "bg-gray-500";
                      return (
                        <>
                          <div className={`h-6 w-6 rounded ${colorClass} flex items-center justify-center`}>
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-black">{formatCurrency(highest.avg_repair_value)}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
