"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Building2, User, Users, Mail, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompanyUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  companyId: string;
  companyName: string;
}

interface EmployeeUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  companyId: string;
  companyName: string;
  employerId: string;
  employerName: string;
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

interface UsersHierarchicalProps {
  companies: Array<{
    id: string;
    name: string;
    employers: CompanyUser[];
    employees: EmployeeUser[];
  }>;
  admins: AdminUser[];
}

export function UsersHierarchical({ companies, admins }: UsersHierarchicalProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedEmployers, setExpandedEmployers] = useState<Set<string>>(new Set());

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const toggleEmployer = (employerId: string) => {
    const newExpanded = new Set(expandedEmployers);
    if (newExpanded.has(employerId)) {
      newExpanded.delete(employerId);
    } else {
      newExpanded.add(employerId);
    }
    setExpandedEmployers(newExpanded);
  };

  return (
    <div className="space-y-2">
      {/* Admins */}
      {admins.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Administrators</p>
                <p className="text-xs text-muted-foreground">
                  {admins.length} {admins.length === 1 ? "admin" : "admins"}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{admin.name || "No name"}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">ADMIN</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(admin.createdAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies */}
      {companies.map((company) => {
        const isExpanded = expandedCompanies.has(company.id);
        const totalUsers = company.employers.length + company.employees.length;

        return (
          <Card key={company.id} className="overflow-hidden">
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto hover:bg-muted/50"
              onClick={() => toggleCompany(company.id)}
            >
              <div className="flex items-center space-x-3 flex-1 text-left">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{company.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {company.employers.length} {company.employers.length === 1 ? "employer" : "employers"} •{" "}
                    {company.employees.length} {company.employees.length === 1 ? "employee" : "employees"}
                  </p>
                </div>
              </div>
            </Button>

            {isExpanded && (
              <CardContent className="pt-0 pb-4">
                <div className="space-y-3 pl-7">
                  {/* Employers */}
                  {company.employers.map((employer) => {
                    const isEmployerExpanded = expandedEmployers.has(employer.id);
                    const employerEmployees = company.employees.filter(
                      (emp) => emp.employerId === employer.id
                    );

                    return (
                      <div key={employer.id} className="border-l-2 border-muted pl-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between h-auto p-2 hover:bg-muted/30"
                          onClick={() => toggleEmployer(employer.id)}
                        >
                          <div className="flex items-center space-x-2 flex-1 text-left">
                            {employerEmployees.length > 0 ? (
                              isEmployerExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )
                            ) : (
                              <div className="w-3" />
                            )}
                            <User className="h-3 w-3 text-muted-foreground" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{employer.name || "No name"}</span>
                                <Badge variant="default" className="text-xs">EMPLOYER</Badge>
                              </div>
                              <div className="flex items-center space-x-1 mt-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">{employer.email}</p>
                              </div>
                            </div>
                            {employerEmployees.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({employerEmployees.length} {employerEmployees.length === 1 ? "employee" : "employees"})
                              </span>
                            )}
                          </div>
                        </Button>

                        {/* Note: Employees are shown at company level, not under individual employers */}
                      </div>
                    );
                  })}

                  {/* All Employees (shown at company level) */}
                  {company.employees.length > 0 && (
                    <div className="border-l-2 border-muted pl-3">
                      <div className="p-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">
                            All Employees ({company.employees.length})
                          </p>
                        </div>
                        <div className="space-y-2">
                          {company.employees.map((employee) => (
                            <div
                              key={employee.id}
                              className="flex items-center justify-between p-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{employee.name || "No name"}</p>
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">{employee.email}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-xs">EMPLOYEE</Badge>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {format(employee.createdAt, "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
