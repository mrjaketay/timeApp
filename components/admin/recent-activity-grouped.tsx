"use client";

import { useState } from "react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AttendanceEvent {
  id: string;
  eventType: string;
  capturedAt: Date;
  employeeProfile: {
    name: string | null;
    email: string | null;
    employeeId: string | null;
  };
  company: {
    id: string;
    name: string;
  };
}

interface GroupedActivity {
  companyId: string;
  companyName: string;
  events: AttendanceEvent[];
}

interface RecentActivityGroupedProps {
  activities: AttendanceEvent[];
}

export function RecentActivityGrouped({ activities }: RecentActivityGroupedProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group by company, then by date
  const groupedByCompany = activities.reduce((acc, event) => {
    const companyId = event.company.id;
    if (!acc[companyId]) {
      acc[companyId] = {
        companyId,
        companyName: event.company.name,
        events: [],
      };
    }
    acc[companyId].events.push(event);
    return acc;
  }, {} as Record<string, GroupedActivity>);

  // Sort companies by most recent activity
  const sortedCompanies = Object.values(groupedByCompany).sort((a, b) => {
    const aLatest = new Date(Math.max(...a.events.map(e => new Date(e.capturedAt).getTime())));
    const bLatest = new Date(Math.max(...b.events.map(e => new Date(e.capturedAt).getTime())));
    return bLatest.getTime() - aLatest.getTime();
  });

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const toggleDate = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d, yyyy");
  };

  const groupEventsByDate = (events: AttendanceEvent[]) => {
    const grouped: Record<string, AttendanceEvent[]> = {};
    events.forEach((event) => {
      const date = new Date(event.capturedAt);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  return (
    <div className="space-y-2">
      {sortedCompanies.map((group) => {
        const isExpanded = expandedCompanies.has(group.companyId);
        const dateGroups = groupEventsByDate(group.events);
        const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        return (
          <Card key={group.companyId} className="overflow-hidden">
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto hover:bg-muted/50"
              onClick={() => toggleCompany(group.companyId)}
            >
              <div className="flex items-center space-x-3 flex-1 text-left">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{group.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.events.length} {group.events.length === 1 ? "event" : "events"}
                  </p>
                </div>
              </div>
            </Button>

            {isExpanded && (
              <CardContent className="pt-0 pb-4">
                <div className="space-y-3">
                  {sortedDates.map((dateKey) => {
                    const date = new Date(dateKey);
                    const events = dateGroups[dateKey].sort(
                      (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
                    );
                    const dateHeaderKey = `${group.companyId}-${dateKey}`;
                    const isDateExpanded = expandedDates.has(dateHeaderKey);

                    return (
                      <div key={dateKey} className="border-l-2 border-muted pl-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between h-auto p-2 hover:bg-muted/30"
                          onClick={() => toggleDate(dateHeaderKey)}
                        >
                          <div className="flex items-center space-x-2 flex-1 text-left">
                            {isDateExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">{formatDateHeader(date)}</span>
                            <span className="text-xs text-muted-foreground">
                              ({events.length} {events.length === 1 ? "event" : "events"})
                            </span>
                          </div>
                        </Button>

                        {isDateExpanded && (
                          <div className="mt-2 space-y-2 pl-5">
                            {events.map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
                              >
                                <div className="flex items-center space-x-3 flex-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {event.employeeProfile.name || event.employeeProfile.email || event.employeeProfile.employeeId || "Unknown Employee"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {event.eventType === "CLOCK_IN" ? "Clocked In" : "Clocked Out"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {format(new Date(event.capturedAt), "HH:mm")}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(event.capturedAt), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
