import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { PasswordChangeForm } from "@/components/password-change-form";
import { CompanyProfileForm } from "@/components/company-profile-form";
import { getCompanySettings } from "@/app/actions/settings";
import { prisma } from "@/lib/prisma";
import { Settings, Mail, User, Lock, Building2 } from "lucide-react";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;

  // Fetch user and company data in parallel
  const [settingsResult, user, company] = await Promise.all([
    getCompanySettings(),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    }),
    companyId
      ? prisma.company.findUnique({
          where: { id: companyId },
          select: {
            phone: true,
            website: true,
            address: true,
            industry: true,
            companySize: true,
            timezone: true,
          },
        })
      : null,
  ]);

  const settings = settingsResult.success ? settingsResult.settings : null;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account and company settings</p>
      </div>

      {/* Account Settings */}
      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            Account Settings
          </CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AccountSettingsForm
            defaultName={user?.name}
            defaultEmail={user?.email}
            defaultImage={user?.image}
          />
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <PasswordChangeForm />
        </CardContent>
      </Card>

      {/* Company Profile */}
      {company && (
        <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              Company Profile
            </CardTitle>
            <CardDescription>
              Manage your company information and details
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <CompanyProfileForm
              defaultPhone={company.phone}
              defaultWebsite={company.website}
              defaultAddress={company.address}
              defaultIndustry={company.industry}
              defaultCompanySize={company.companySize}
              defaultTimezone={company.timezone}
            />
          </CardContent>
        </Card>
      )}

      {/* Invitation Settings */}
      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            Invitation Settings
          </CardTitle>
          <CardDescription>
            Customize the email message sent to employees when they receive an invitation
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <SettingsForm 
            defaultInvitationMessage={settings?.invitationMessage || ""}
          />
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure email service for sending invitations
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email Service Status</p>
              <p className="text-sm text-muted-foreground">
                {process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY || process.env.SMTP_HOST
                  ? "✅ Email service configured"
                  : "⚠️ No email service configured. Emails will be logged to console in development mode."}
              </p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>To enable email sending, configure one of the following in your .env file:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Resend:</strong> RESEND_API_KEY and RESEND_FROM_EMAIL</li>
                <li><strong>SendGrid:</strong> SENDGRID_API_KEY and SENDGRID_FROM_EMAIL</li>
                <li><strong>SMTP:</strong> SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
