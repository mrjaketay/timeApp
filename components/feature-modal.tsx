"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Users, BarChart3, Shield, Smartphone, Zap } from "lucide-react";

interface FeatureModalProps {
  feature: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    details?: string[];
    benefits?: string[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureModal({ feature, open, onOpenChange }: FeatureModalProps) {
  const Icon = feature.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {feature.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground">
            {feature.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {feature.details && feature.details.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3">Key Features</h4>
              <ul className="space-y-2">
                {feature.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feature.benefits && feature.benefits.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-3">Benefits</h4>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
