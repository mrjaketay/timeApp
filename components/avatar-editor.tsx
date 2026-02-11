"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateEmployeePhoto } from "@/app/actions/employee";
import { useRouter } from "next/navigation";

interface AvatarEditorProps {
  employeeId: string;
  currentPhoto?: string | null;
  employeeName?: string | null;
  employeeEmail: string;
}

export function AvatarEditor({
  employeeId,
  currentPhoto,
  employeeName,
  employeeEmail,
}: AvatarEditorProps) {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setIsUploading(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update employee photo
      const result = await updateEmployeePhoto(employeeId, base64);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        // Revert preview on error
        setPreview(currentPhoto || null);
      } else {
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setPreview(currentPhoto || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      const result = await updateEmployeePhoto(employeeId, null);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile picture removed successfully",
        });
        setPreview(null);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const getInitials = () => {
    if (employeeName) {
      return employeeName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return employeeEmail[0].toUpperCase();
  };

  return (
    <div className="relative inline-block">
      <div className="relative group">
        <Avatar className="h-20 w-20 cursor-pointer" onClick={handleClick}>
          <AvatarImage src={preview || undefined} />
          <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
        {!isUploading && (
          <div
            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            <Pencil className="h-4 w-4" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {preview && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
          disabled={isUploading}
        >
          <X className="h-3 w-3 mr-1" />
          Remove
        </Button>
      )}
    </div>
  );
}
