import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/login");
    }

    // Handle role-based redirects
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    }

    if (session.user.role === "EMPLOYEE") {
      redirect("/clock");
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    return (
      <div className="min-h-screen relative min-h-[100dvh]">
        {/* Subtle animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-400/5 dark:bg-purple-500/5 rounded-full blur-3xl animate-blob animation-delay-[2s]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-indigo-400/5 dark:bg-indigo-500/5 rounded-full blur-3xl animate-blob animation-delay-[4s]"></div>
        </div>

        <DashboardShell
          role={session.user.role}
          companyId={companyId}
          user={session.user}
        >
          {children}
        </DashboardShell>
      </div>
    );
  } catch (error) {
    // Log the error but don't redirect to health check for auth errors
    console.error("Dashboard layout error:", error);
    
    // If it's an auth configuration error, redirect to login
    // Otherwise, redirect to login as a safe fallback
    redirect("/login");
  }
}
