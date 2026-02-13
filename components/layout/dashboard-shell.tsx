"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

interface DashboardShellProps {
  role: string;
  companyId?: string;
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function DashboardShell({ role, companyId, user, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <Sidebar role={role} companyId={companyId} />
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        role={role}
      />
      <div className="md:pl-64 flex flex-col flex-1 relative z-10 min-w-0">
        <Topbar
          user={user}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-0">{children}</main>
      </div>
    </>
  );
}
