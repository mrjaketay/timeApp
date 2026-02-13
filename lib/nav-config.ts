import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  MapPin,
  Settings,
  Building2,
  CreditCard,
  UserCheck,
  Wallet,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavItem[];
}

export const employerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Employees", href: "/dashboard/employees", icon: Users },
  {
    title: "Attendance",
    href: "/dashboard/attendance",
    icon: Clock,
    subItems: [
      { title: "Manage Attendance", href: "/dashboard/attendance/manage", icon: UserCheck },
    ],
  },
  { title: "NFC Cards", href: "/dashboard/nfc-cards", icon: CreditCard },
  { title: "Reports", href: "/dashboard/reports", icon: FileText },
  { title: "Locations", href: "/dashboard/locations", icon: MapPin },
  { title: "Billing", href: "/dashboard/billing", icon: Wallet },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Companies", href: "/admin/companies", icon: Building2 },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export const employeeNavItems: NavItem[] = [
  { title: "Clock In/Out", href: "/clock", icon: Clock },
  { title: "My Timesheets", href: "/my-timesheets", icon: FileText },
];

export function getNavItems(role: string): NavItem[] {
  if (role === "ADMIN") return adminNavItems;
  if (role === "EMPLOYER") return employerNavItems;
  return employeeNavItems;
}
