"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateCompanyProfile } from "@/app/actions/onboarding";
import { Loader2, Building2, Phone, Globe, MapPin, Briefcase, Users, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const companyProfileSchema = z.object({
  phone: z.string().optional(),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "Invalid URL",
    }),
  address: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  timezone: z.string().optional(),
});

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

interface CompanyProfileFormProps {
  defaultPhone?: string | null;
  defaultWebsite?: string | null;
  defaultAddress?: string | null;
  defaultIndustry?: string | null;
  defaultCompanySize?: string | null;
  defaultTimezone?: string | null;
}

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Construction",
  "Hospitality",
  "Transportation",
  "Other",
];

const companySizes = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export function CompanyProfileForm({
  defaultPhone,
  defaultWebsite,
  defaultAddress,
  defaultIndustry,
  defaultCompanySize,
  defaultTimezone,
}: CompanyProfileFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      phone: defaultPhone || "",
      website: defaultWebsite || "",
      address: defaultAddress || "",
      industry: defaultIndustry || "",
      companySize: defaultCompanySize || "",
      timezone: defaultTimezone || "UTC",
    },
  });

  const onSubmit = async (data: CompanyProfileFormData) => {
    setIsLoading(true);
    try {
      const result = await updateCompanyProfile({
        phone: data.phone || undefined,
        website: data.website || undefined,
        address: data.address || undefined,
        industry: data.industry || undefined,
        companySize: data.companySize || undefined,
        timezone: data.timezone || undefined,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Company profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update company profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            {...register("website")}
            placeholder="https://example.com"
            className={errors.website ? "border-destructive" : ""}
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Address
        </Label>
        <Input
          id="address"
          {...register("address")}
          placeholder="123 Main St, City, State, ZIP"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="industry" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Industry
          </Label>
          <Select
            value={watch("industry") || ""}
            onValueChange={(value) => setValue("industry", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companySize" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Company Size
          </Label>
          <Select
            value={watch("companySize") || ""}
            onValueChange={(value) => setValue("companySize", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              {companySizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size} employees
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Timezone
        </Label>
        <Select
          value={watch("timezone") || "UTC"}
          onValueChange={(value) => setValue("timezone", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Company Profile"
        )}
      </Button>
    </form>
  );
}
