"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { format } from "date-fns";

interface ReportsExportButtonsProps {
  startDate: Date;
  endDate: Date;
  employeeId?: string;
  reportType?: string;
}

export function ReportsExportButtons({ 
  startDate, 
  endDate,
  employeeId,
  reportType = "TIMESHEET"
}: ReportsExportButtonsProps) {
  const handleExportCSV = async () => {
    try {
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDateStr,
        format: "CSV",
        reportType,
      });
      if (employeeId) {
        params.append("employeeId", employeeId);
      }

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${startDateStr}-${endDateStr}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export CSV");
    }
  };

  const handleExportExcel = async () => {
    try {
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDateStr,
        format: "EXCEL",
        reportType,
      });
      if (employeeId) {
        params.append("employeeId", employeeId);
      }

      const response = await fetch(`/api/reports/export?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${startDateStr}-${endDateStr}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export Excel");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex space-x-2">
      <Button variant="outline" onClick={handlePrint}>
        <Printer className="mr-2 h-4 w-4" />
        Print
      </Button>
      <Button variant="outline" onClick={handleExportCSV}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={handleExportExcel}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Export Excel
      </Button>
    </div>
  );
}
