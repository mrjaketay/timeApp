"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserX, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toggleEmployeeStatus } from "@/app/actions/employee";
import { useRouter } from "next/navigation";

interface EmployeeStatusButtonProps {
  employeeId: string;
  isActive: boolean;
}

export function EmployeeStatusButton({ employeeId, isActive }: EmployeeStatusButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await toggleEmployeeStatus(employeeId, isActive);
      
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isActive ? (
        <>
          <UserX className="mr-2 h-4 w-4" />
          {isLoading ? "Deactivating..." : "Deactivate"}
        </>
      ) : (
        <>
          <UserCheck className="mr-2 h-4 w-4" />
          {isLoading ? "Activating..." : "Activate"}
        </>
      )}
    </Button>
  );
}
