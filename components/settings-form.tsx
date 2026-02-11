"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateCompanySettings } from "@/app/actions/settings";
import { Loader2 } from "lucide-react";

interface SettingsFormProps {
  defaultInvitationMessage: string;
}

const defaultTemplate = `You've been invited to join {{companyName}} on TimeTrack. We're excited to have you on our team!

Please click the link below to accept the invitation and set up your account. Once you accept, you'll be able to start tracking your time with NFC cards and manage your attendance.

Looking forward to working with you!`;

export function SettingsForm({ defaultInvitationMessage }: SettingsFormProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState(defaultInvitationMessage || defaultTemplate);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateCompanySettings({
        invitationMessage: message,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: result.message || "Settings updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessage(defaultTemplate);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="invitationMessage">Invitation Message</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset to Default
          </Button>
        </div>
        <Textarea
          id="invitationMessage"
          placeholder={defaultTemplate}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          You can use <code className="px-1 py-0.5 bg-gray-100 rounded">{"{{companyName}}"}</code> as a placeholder for the company name.
          The message will be sent to employees when they receive an invitation.
        </p>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </form>
  );
}
