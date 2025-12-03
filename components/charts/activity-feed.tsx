"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { ActivityItem } from "@/lib/dashboard";
import {
  Phone,
  UserPlus,
  RefreshCw,
  UserCheck,
  Bell,
} from "lucide-react";

interface ActivityFeedProps {
  initialActivities: ActivityItem[];
  staffId?: string;
  role?: string;
}

const activityIcons = {
  lead_created: UserPlus,
  status_changed: RefreshCw,
  call_made: Phone,
  lead_assigned: UserCheck,
};

const activityColors = {
  lead_created: "bg-blue-100 text-blue-800",
  status_changed: "bg-yellow-100 text-yellow-800",
  call_made: "bg-green-100 text-green-800",
  lead_assigned: "bg-purple-100 text-purple-800",
};

export function ActivityFeed({
  initialActivities,
  staffId,
  role,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const supabase = createClient();

    // Subscribe to real-time changes on leads table
    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const newLead = payload.new as any;

          // Check if this lead is relevant to the current user
          if (role === "sell_executive" && staffId && newLead.assigned_to !== staffId) {
            return;
          }

          const newActivity: ActivityItem = {
            id: `lead-created-${newLead.id}-${Date.now()}`,
            type: "lead_created",
            description: `New lead: ${newLead.customer_name}`,
            timestamp: newLead.created_at,
            leadId: newLead.id,
          };

          setActivities((prev) => [newActivity, ...prev].slice(0, 10));

          toast({
            title: "New Lead!",
            description: `${newLead.customer_name} - ${newLead.device_type} ${newLead.device_model}`,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const updatedLead = payload.new as any;
          const oldLead = payload.old as any;

          // Check if this lead is relevant to the current user
          if (role === "sell_executive" && staffId && updatedLead.assigned_to !== staffId) {
            return;
          }

          // Only add activity if status changed
          if (updatedLead.status !== oldLead.status) {
            const newActivity: ActivityItem = {
              id: `status-${updatedLead.id}-${Date.now()}`,
              type: "status_changed",
              description: `${updatedLead.customer_name} → ${updatedLead.status.replace("_", " ")}`,
              timestamp: updatedLead.updated_at,
              leadId: updatedLead.id,
            };

            setActivities((prev) => [newActivity, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffId, role, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="border-black">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-black">
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-xs text-green-600"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">
                Activity will appear here as leads are created and updated
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
              <AnimatePresence mode="popLayout">
                {activities.map((activity, index) => {
                  const Icon = activityIcons[activity.type];
                  const colorClass = activityColors[activity.type];

                  return (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-full ${colorClass.split(" ")[0]}`}
                      >
                        <Icon className={`h-4 w-4 ${colorClass.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDateTime(activity.timestamp)}
                          </span>
                          {activity.staffName && (
                            <Badge variant="outline" className="text-xs py-0">
                              {activity.staffName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
