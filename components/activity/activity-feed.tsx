"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatActionType, getActionColor, type ActivityAction } from "@/lib/activity-logger";
import { getRecentActivity, type ActivityLog } from "@/app/actions/activity";
import {
  Activity,
  UserPlus,
  Edit,
  RefreshCw,
  UserCheck,
  Trash2,
  Target,
  ArrowRight,
  Trophy,
  XCircle,
  Phone,
  MessageSquare,
  Shield,
  UserX,
  FileText,
  DollarSign,
  LogIn,
  AlertCircle,
  Layers,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface ActivityFeedProps {
  limit?: number;
  entityType?: string;
  entityId?: string;
  showFilters?: boolean;
  title?: string;
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  Edit,
  RefreshCw,
  UserCheck,
  Trash2,
  Target,
  ArrowRight,
  Trophy,
  XCircle,
  Phone,
  MessageSquare,
  Shield,
  UserX,
  FileText,
  DollarSign,
  LogIn,
  AlertCircle,
  Layers,
  Activity,
};

function getIconComponent(action: ActivityAction): React.ComponentType<{ className?: string }> {
  const iconName = getActionIconName(action);
  return iconMap[iconName] || Activity;
}

function getActionIconName(action: ActivityAction): string {
  const actionIcons: Record<ActivityAction, string> = {
    lead_created: "UserPlus",
    lead_updated: "Edit",
    lead_status_changed: "RefreshCw",
    lead_assigned: "UserCheck",
    lead_deleted: "Trash2",
    customer_created: "UserPlus",
    customer_updated: "Edit",
    customer_deleted: "Trash2",
    opportunity_created: "Target",
    opportunity_moved: "ArrowRight",
    opportunity_won: "Trophy",
    opportunity_lost: "XCircle",
    call_made: "Phone",
    note_added: "MessageSquare",
    staff_added: "UserPlus",
    staff_updated: "Edit",
    staff_role_changed: "Shield",
    staff_deactivated: "UserX",
    invoice_generated: "FileText",
    invoice_created: "FileText",
    invoice_updated: "Edit",
    invoice_deleted: "Trash2",
    payment_received: "DollarSign",
    payment_recorded: "DollarSign",
    repair_started: "Wrench",
    repair_completed: "CheckCircle",
    repair_updated: "Edit",
    login_success: "LogIn",
    login_failed: "AlertCircle",
    bulk_operation: "Layers",
  };
  return actionIcons[action] || "Activity";
}

export function ActivityFeed({
  limit = 10,
  entityType,
  entityId,
  showFilters = false,
  title = "Recent Activity",
  compact = false,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    const result = await getRecentActivity(limit);
    if (result.success && result.data) {
      setActivities(result.data);
    }
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const filteredActivities = filter === "all"
    ? activities
    : activities.filter((a) => a.action_type.includes(filter));

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const getStatusChangeDetails = (log: ActivityLog) => {
    if (log.action_type === "lead_status_changed" && log.old_value && log.new_value) {
      return `${log.old_value.status} → ${log.new_value.status}`;
    }
    if (log.action_type === "opportunity_moved" && log.old_value && log.new_value) {
      return `${log.old_value.stage} → ${log.new_value.stage}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="border-black">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-black">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
          {showFilters && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="opportunity">Opportunities</SelectItem>
                <SelectItem value="call">Calls</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity recorded yet</p>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[300px]" : "h-[400px]"}>
            <div className="space-y-3">
              {filteredActivities.map((log) => {
                const IconComponent = getIconComponent(log.action_type);
                const colorClass = getActionColor(log.action_type);
                const statusChange = getStatusChangeDetails(log);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium text-black">
                          {(log.user as { full_name: string } | null)?.full_name || "System"}
                        </span>{" "}
                        <span className="text-gray-600">{formatActionType(log.action_type)}</span>
                        {log.entity_name && (
                          <>
                            {" "}
                            <span className="font-medium text-black">{log.entity_name}</span>
                          </>
                        )}
                      </p>
                      {statusChange && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {statusChange}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{formatTime(log.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        {!compact && activities.length >= limit && (
          <Button
            variant="ghost"
            className="w-full mt-3 text-sm text-gray-500"
            onClick={() => window.location.href = "/activity"}
          >
            View All Activity
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for entity detail views
export function ActivityTimeline({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    // Import dynamically to avoid circular dependency
    const { getEntityActivity } = await import("@/app/actions/activity");
    const result = await getEntityActivity(entityType as "lead" | "customer" | "opportunity", entityId);
    if (result.success && result.data) {
      setActivities(result.data);
    }
    setIsLoading(false);
  }, [entityType, entityId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        No activity recorded
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {activities.map((log, index) => {
          const IconComponent = getIconComponent(log.action_type);
          const colorClass = getActionColor(log.action_type);

          return (
            <div key={log.id} className="relative flex items-start gap-4 pl-10">
              {/* Timeline dot */}
              <div className={`absolute left-2 h-5 w-5 rounded-full flex items-center justify-center ${colorClass}`}>
                <IconComponent className="h-3 w-3" />
              </div>

              <div className="flex-1 min-w-0 pb-4">
                <p className="text-sm">
                  <span className="font-medium">
                    {(log.user as { full_name: string } | null)?.full_name || "System"}
                  </span>{" "}
                  <span className="text-gray-600">{formatActionType(log.action_type)}</span>
                </p>
                {log.new_value && log.action_type.includes("status") && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Status changed to: {(log.new_value as { status?: string }).status}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{formatTime(log.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
