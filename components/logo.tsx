"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "gradient";
}

export function Logo({ 
  className, 
  showText = true, 
  size = "md",
  variant = "gradient"
}: LogoProps) {
  const sizeClasses = {
    sm: "h-4 w-4 text-sm",
    md: "h-6 w-6 text-xl",
    lg: "h-8 w-8 text-2xl",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const variantClasses = {
    light: "text-white",
    dark: "text-gray-900 dark:text-white",
    gradient: "bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent",
  };

  return (
    <Link href="/" className={cn("flex items-center gap-2 font-bold", className)}>
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
        <div className={cn(
          "relative bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 rounded-lg",
          variant === "light" && "bg-white/10",
          variant === "dark" && "bg-gray-900 dark:bg-white"
        )}>
          <Clock className={cn(iconSizes[size], variant === "light" ? "text-white" : variant === "dark" ? "text-gray-900 dark:text-white" : "text-white")} />
        </div>
      </div>
      {showText && (
        <span className={cn(sizeClasses[size], variantClasses[variant])}>
          TimeTrack
        </span>
      )}
    </Link>
  );
}
