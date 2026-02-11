import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";

export default async function ClockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const allowedRoles = new Set(["EMPLOYEE", "EMPLOYER", "ADMIN"]);

  if (!allowedRoles.has(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {children}
    </div>
  );
}
