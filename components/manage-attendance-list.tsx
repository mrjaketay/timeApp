"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock, Coffee, LogOut, Loader2 } from "lucide-react";
import { putEmployeeOnBreak, endEmployeeBreak, clockOutEmployee } from "@/app/actions/attendance";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmployeeStatus {
  employee: {
    id: string;
    name: string | null;
    email: string | null;
    employeeId: string | null;
  };
  lastEvent: {
    id: string;
    eventType: string;
    capturedAt: Date;
  } | null;
  isClockedIn: boolean;
  clockInTime: Date | null;
  isOnBreak: boolean;
  breakStartTime: Date | null;
}

interface ManageAttendanceListProps {
  employees: EmployeeStatus[];
}

export function ManageAttendanceList({ employees }: ManageAttendanceListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePutOnBreak = async (employeeId: string, employeeName: string) => {
    startTransition(async () => {
      const result = await putEmployeeOnBreak({ employeeId });
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result.message,
        });
        router.refresh();
      }
    });
  };

  const handleEndBreak = async (employeeId: string, employeeName: string) => {
    startTransition(async () => {
      const result = await endEmployeeBreak({ employeeId });
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result.message,
        });
        router.refresh();
      }
    });
  };

  const handleClockOut = async (employeeId: string, employeeName: string) => {
    startTransition(async () => {
      const result = await clockOutEmployee({ employeeId });
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result.message,
        });
        router.refresh();
      }
    });
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No employees currently clocked in.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {employees.map((status) => {
        const employeeName = status.employee.name || status.employee.email || "Unknown Employee";
        const hoursClockedIn = status.clockInTime
          ? ((Date.now() - status.clockInTime.getTime()) / (1000 * 60 * 60)).toFixed(1)
          : "0";

        return (
          <div
            key={status.employee.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium">{employeeName}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={status.isOnBreak ? "secondary" : "default"}>
                      {status.isOnBreak ? (
                        <>
                          <Coffee className="mr-1 h-3 w-3" />
                          On Break
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Clocked In
                        </>
                      )}
                    </Badge>
                    {status.clockInTime && (
                      <span className="text-sm text-muted-foreground">
                        Since {format(status.clockInTime, "HH:mm")} ({hoursClockedIn}h)
                      </span>
                    )}
                  </div>
                  {status.isOnBreak && status.breakStartTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Break started at {format(status.breakStartTime, "HH:mm")}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {status.isOnBreak ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEndBreak(status.employee.id, employeeName)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Coffee className="mr-2 h-4 w-4" />
                  )}
                  End Break
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePutOnBreak(status.employee.id, employeeName)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Coffee className="mr-2 h-4 w-4" />
                  )}
                  Put on Break
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Clock Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clock Out {employeeName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will manually clock out {employeeName}. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleClockOut(status.employee.id, employeeName)}
                      disabled={isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isPending ? "Clocking Out..." : "Clock Out"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
