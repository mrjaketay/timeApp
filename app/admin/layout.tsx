import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/login");
    }

    // Check if user is ADMIN
    if (session.user.role !== "ADMIN") {
      // If not admin, redirect based on their role
      if (session.user.role === "EMPLOYEE") {
        redirect("/clock");
      } else {
        redirect("/dashboard");
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar role={session.user.role} />
        <div className="md:pl-64 flex flex-col flex-1">
          <Topbar user={session.user} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Admin layout error:", error);
    redirect("/login");
  }
}
