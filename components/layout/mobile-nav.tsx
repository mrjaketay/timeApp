"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";
import { getNavItems, type NavItem } from "@/lib/nav-config";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: string;
}

export function MobileNav({ open, onOpenChange, role }: MobileNavProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role);

  const isActive = (item: NavItem, isSub?: boolean) => {
    if (isSub) return pathname === item.href;
    const hasActiveSub = item.subItems?.some((s) => pathname === s.href);
    return pathname === item.href || hasActiveSub;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed left-0 top-0 z-50 h-full w-[min(280px,85vw)] max-w-[280px] translate-x-0 translate-y-0 gap-0 rounded-none border-r border-border bg-background p-0 pt-[env(safe-area-inset-top)] shadow-xl data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
      >
        <DialogHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">TimeTrack</DialogTitle>
          </div>
        </DialogHeader>
        <nav className="flex flex-col gap-0.5 overflow-y-auto py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                    isActive(item)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.title}
                </Link>
                {item.subItems?.map((sub) => {
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-3 py-2.5 pl-12 pr-4 text-sm font-medium transition-colors",
                        isActive(sub, true)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <SubIcon className="h-4 w-4 shrink-0" />
                      {sub.title}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
