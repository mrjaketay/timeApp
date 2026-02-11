import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Allow access only to authenticated users
  if (!session?.user) {
    redirect("/login");
  }

  // Only employers should access onboarding
  if (session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
