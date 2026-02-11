import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

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

    // For EMPLOYER role, companyMemberships should exist
    const companyId = session.user.companyMemberships?.[0]?.companyId;

    return (
      <div className="min-h-screen relative">
        {/* Subtle animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-400/5 dark:bg-blue-500/5 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-400/5 dark:bg-purple-500/5 rounded-full blur-3xl animate-blob animation-delay-[2s]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-indigo-400/5 dark:bg-indigo-500/5 rounded-full blur-3xl animate-blob animation-delay-[4s]"></div>
        </div>
        
        <Sidebar role={session.user.role} companyId={companyId} />
        <div className="md:pl-64 flex flex-col flex-1 relative z-10">
          <Topbar user={session.user} />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
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
