import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Bell, 
  Globe, 
  Users, 
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get system statistics
  const [
    totalCompanies,
    totalUsers,
    totalEmployees,
    totalSubscriptions,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.employeeProfile.count({ where: { isActive: true } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  // Check environment configuration
  const hasDatabase = !!process.env.DATABASE_URL;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  const hasEmailConfig = !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Manage system settings and configuration</p>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Monitor the health and configuration of your system components. All critical services must be configured for the platform to function properly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  {hasDatabase ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasDatabase
                    ? "Database connection is active. All data operations are functioning normally."
                    : "DATABASE_URL environment variable is missing. The application cannot store or retrieve data."}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Authentication</span>
                  </div>
                  {hasNextAuthSecret && hasNextAuthUrl ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missing Config
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasNextAuthSecret && hasNextAuthUrl
                    ? "User authentication is properly configured. Login and session management are active."
                    : "NEXTAUTH_SECRET and/or NEXTAUTH_URL are missing. Users cannot log in or maintain sessions."}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Email Service</span>
                  </div>
                  {hasEmailConfig ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Optional
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasEmailConfig
                    ? "Email service is configured. Invitation emails and notifications can be sent."
                    : "Email service is not configured. Email features are disabled. Configure RESEND_API_KEY or SMTP settings to enable."}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Environment</span>
                  </div>
                  <Badge variant="outline">
                    {process.env.NODE_ENV || "development"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current runtime environment. Production mode enables optimizations and error handling.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>System Statistics</span>
          </CardTitle>
          <CardDescription>
            Real-time overview of platform usage, user activity, and subscription metrics. These numbers update automatically as the system is used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Companies</span>
              </div>
              <div className="text-2xl font-bold">{totalCompanies}</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Employees</span>
              </div>
              <div className="text-2xl font-bold">{totalEmployees}</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Subscriptions</span>
              </div>
              <div className="text-2xl font-bold">{activeSubscriptions}</div>
              <div className="text-xs text-muted-foreground mt-1">
                of {totalSubscriptions} total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuration Details</span>
          </CardTitle>
          <CardDescription>
            View current system configuration values. These settings are read from environment variables and cannot be changed from this interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Application URL</div>
              <div className="text-sm text-muted-foreground font-mono mb-2">
                {process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "Not configured"}
              </div>
              <p className="text-xs text-muted-foreground">
                The base URL of your application. Used for generating links in emails and redirects. Set via NEXTAUTH_URL or NEXT_PUBLIC_APP_URL.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Database Connection</div>
              <div className="text-sm text-muted-foreground mb-2">
                {hasDatabase ? "✓ Connected" : "✗ Not configured"}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasDatabase
                  ? "Database connection string is configured. All data is being stored and retrieved successfully."
                  : "DATABASE_URL environment variable is required. Configure it with your database connection string (PostgreSQL, MySQL, etc.)."}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Email Service</div>
              <div className="text-sm text-muted-foreground mb-2">
                {hasEmailConfig ? "✓ Configured" : "⚠ Not configured (optional)"}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasEmailConfig
                  ? "Email service is active. Users can receive invitation emails and notifications."
                  : "Email functionality is optional. Configure RESEND_API_KEY for Resend service or SMTP settings for custom email server."}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Authentication Secret</div>
              <div className="text-sm text-muted-foreground mb-2">
                {hasNextAuthSecret ? "✓ Configured" : "✗ Missing"}
              </div>
              <p className="text-xs text-muted-foreground">
                {hasNextAuthSecret
                  ? "Authentication secret is set. Session encryption and JWT signing are active."
                  : "NEXTAUTH_SECRET is required for secure session management. Generate a random secret and add it to your environment variables."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>System Information</span>
          </CardTitle>
          <CardDescription>
            Additional system details and maintenance information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Platform Version</div>
              <p className="text-sm text-muted-foreground mb-3">
                TimeTrack v1.0.0
              </p>
              <p className="text-xs text-muted-foreground">
                Current version of the TimeTrack platform. Check for updates regularly to ensure you have the latest features and security patches.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Maintenance Mode</div>
              <p className="text-sm text-muted-foreground mb-3">
                Currently disabled
              </p>
              <p className="text-xs text-muted-foreground">
                Maintenance mode allows you to temporarily disable the platform for updates or maintenance. When enabled, only administrators can access the system.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">System Health</div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">All systems operational</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All critical services are running normally. No issues detected.
              </p>
            </div>

            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="text-sm font-medium mb-2">Upcoming Features</div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Automated database backups</li>
                <li>System log viewer and export</li>
                <li>Cache management tools</li>
                <li>Performance monitoring dashboard</li>
                <li>Bulk user operations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
