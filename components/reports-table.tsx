"use client";

import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Timesheet {
  id: string;
  date: Date;
  hoursWorked: number | null;
  clockIn: {
    id: string;
    capturedAt: Date;
    locationLat: number;
    locationLng: number;
    address: string | null;
  } | null;
  clockOut: {
    id: string;
    capturedAt: Date;
    locationLat: number;
    locationLng: number;
    address: string | null;
  } | null;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface ReportsTableProps {
  timesheets: Timesheet[];
  reportType?: string;
}

export function ReportsTable({ timesheets, reportType = "TIMESHEET" }: ReportsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 font-medium">Employee</th>
            <th className="text-left p-2 font-medium">Date</th>
            <th className="text-left p-2 font-medium">Clock In</th>
            <th className="text-left p-2 font-medium">Clock Out</th>
            <th className="text-left p-2 font-medium">Hours</th>
            <th className="text-left p-2 font-medium">Location</th>
            <th className="text-left p-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {timesheets.map((timesheet) => (
            <tr key={timesheet.id} className="border-b">
              <td className="p-2">
                {(timesheet.user.name || timesheet.user.email) ?? "—"}
              </td>
              <td className="p-2">{format(timesheet.date, "MMM d, yyyy")}</td>
              <td className="p-2">
                {timesheet.clockIn ? (
                  <div>
                    <p>{format(timesheet.clockIn.capturedAt, "HH:mm:ss")}</p>
                    {timesheet.clockIn.address && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {timesheet.clockIn.address}
                      </p>
                    )}
                  </div>
                ) : (
                  "-"
                )}
              </td>
              <td className="p-2">
                {timesheet.clockOut ? (
                  <div>
                    <p>{format(timesheet.clockOut.capturedAt, "HH:mm:ss")}</p>
                    {timesheet.clockOut.address && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {timesheet.clockOut.address}
                      </p>
                    )}
                  </div>
                ) : (
                  "-"
                )}
              </td>
              <td className="p-2">
                {timesheet.hoursWorked
                  ? `${timesheet.hoursWorked.toFixed(2)}h`
                  : "-"}
              </td>
              <td className="p-2">
                {timesheet.clockIn && (
                  <div className="text-xs text-muted-foreground">
                    <p>
                      {timesheet.clockIn.locationLat.toFixed(4)},{" "}
                      {timesheet.clockIn.locationLng.toFixed(4)}
                    </p>
                  </div>
                )}
              </td>
              <td className="p-2">
                {timesheet.clockIn && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/attendance/${timesheet.clockIn.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {timesheets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No timesheets found for the selected date range.
        </div>
      )}
    </div>
  );
}
