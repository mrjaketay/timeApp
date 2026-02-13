"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ChevronRight } from "lucide-react";
import { useState } from "react";
import { employerNavItems, adminNavItems, employeeNavItems, type NavItem } from "@/lib/nav-config";

interface SidebarProps {
  role: string;
  companyId?: string;
}

export function Sidebar({ role, companyId }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand items that have active sub-items
    const items: string[] = [];
    const navItems = role === "ADMIN" ? adminNavItems : role === "EMPLOYER" ? employerNavItems : employeeNavItems;
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some((subItem) => pathname === subItem.href);
        if (hasActiveSubItem || pathname.startsWith(item.href + "/")) {
          items.push(item.href);
        }
      }
    });
    return items;
  });

  const navItems =
    role === "ADMIN" ? adminNavItems :
    role === "EMPLOYER" ? employerNavItems :
    employeeNavItems;

  const toggleExpand = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const isItemActive = (item: NavItem, isSubItem: boolean = false) => {
    if (isSubItem) {
      // For sub-items, only check exact match
      return pathname === item.href;
    }
    // For parent items, check if it's the exact path or if a sub-item is active
    const hasActiveSubItem = item.subItems?.some((subItem) => pathname === subItem.href);
    return pathname === item.href || hasActiveSubItem;
  };

  const isParentActive = (item: NavItem) => {
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
      <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-950 dark:to-indigo-950 overflow-y-auto shadow-2xl backdrop-blur-xl">
        <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-blue-500/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-white text-xl font-bold">TimeTrack</h1>
          </div>
        </div>
        <div className="mt-5 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.href);
              const isActive = isItemActive(item);
              const isParent = isParentActive(item);

              return (
                <div key={item.href}>
                  {hasSubItems ? (
                    <>
                      <div className="flex items-center w-full gap-1">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative z-10",
                            isParent && !isExpanded
                              ? "bg-white/10 text-white shadow-lg backdrop-blur-sm"
                              : "text-blue-100 hover:bg-white/5 hover:text-white hover:shadow-md"
                          )}
                        >
                          <Icon
                            className={cn(
                              "mr-3 flex-shrink-0 h-5 w-5 transition-transform group-hover:scale-110",
                              isParent ? "text-white" : "text-blue-300"
                            )}
                          />
                          {item.title}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(item.href);
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all duration-200 hover:bg-white/10 relative z-10",
                            isParent ? "text-white" : "text-blue-300 hover:text-white"
                          )}
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isExpanded ? "rotate-90" : ""
                            )}
                          />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems!.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = isItemActive(subItem, true);
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 pl-10 ml-2 group",
                                  isSubActive
                                    ? "bg-white/10 text-white shadow-md backdrop-blur-sm"
                                    : "text-blue-200 hover:bg-white/5 hover:text-white hover:shadow-sm"
                                )}
                              >
                                <SubIcon
                                  className={cn(
                                    "mr-3 flex-shrink-0 h-4 w-4 transition-transform group-hover:scale-110",
                                    isSubActive ? "text-white" : "text-blue-300"
                                  )}
                                />
                                {subItem.title}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-white/10 text-white shadow-lg backdrop-blur-sm"
                          : "text-blue-100 hover:bg-white/5 hover:text-white hover:shadow-md"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5 transition-transform group-hover:scale-110",
                          isActive ? "text-white" : "text-blue-300"
                        )}
                      />
                      {item.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
