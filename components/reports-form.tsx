"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

interface ReportsFormProps {
  defaultStartDate: string;
  defaultEndDate: string;
  defaultEmployeeId?: string;
  defaultReportType?: string;
}

export function ReportsForm({ 
  defaultStartDate, 
  defaultEndDate,
  defaultEmployeeId = "",
  defaultReportType = "TIMESHEET"
}: ReportsFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || "all");
  const [reportType, setReportType] = useState(defaultReportType);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const setDateRange = (preset: string) => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case "today":
        start = startOfToday();
        end = endOfToday();
        break;
      case "thisWeek":
        start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "thisMonth":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "thisYear":
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      default:
        return;
    }

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      startDate,
      endDate,
      reportType,
    });
    // Only add employeeId if it's not "all" (which represents all employees)
    if (employeeId && employeeId !== "all") {
      params.append("employeeId", employeeId);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reportType">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TIMESHEET">Timesheet (Detailed)</SelectItem>
              <SelectItem value="ATTENDANCE">Attendance Summary</SelectItem>
              <SelectItem value="EMPLOYEE_SUMMARY">Employee Summary</SelectItem>
              <SelectItem value="HOURS_WORKED">Hours Worked Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="employee">Employee (Optional)</Label>
          <Select value={employeeId || "all"} onValueChange={(value) => setEmployeeId(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {isLoadingEmployees ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name || emp.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-sm text-muted-foreground">Quick Select:</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDateRange("today")}
        >
          Today
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDateRange("thisWeek")}
        >
          This Week
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDateRange("thisMonth")}
        >
          This Month
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDateRange("lastMonth")}
        >
          Last Month
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setDateRange("thisYear")}
        >
          This Year
        </Button>
      </div>

      <div className="flex space-x-2">
        <Button type="submit">Generate Report</Button>
      </div>
    </form>
  );
}
