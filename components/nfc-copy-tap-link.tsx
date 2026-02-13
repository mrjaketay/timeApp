"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NFCCopyTapLink({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const tapUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/tap?card=${encodeURIComponent(uid)}`
      : "";

  const copy = async () => {
    if (!tapUrl) return;
    try {
      await navigator.clipboard.writeText(tapUrl);
      setCopied(true);
      toast({ title: "Copied", description: "Tap URL copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
      {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy tap link"}
    </Button>
  );
}
