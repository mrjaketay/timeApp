"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { register } from "@/app/actions/auth";
import { Clock, Mail, Lock, User, Building2, Eye, EyeOff, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { ReCaptcha } from "@/components/recaptcha";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Prefill email from query params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  // Validate password strength
  useEffect(() => {
    const errors: string[] = [];
    if (formData.password) {
      if (formData.password.length < 8) {
        errors.push("At least 8 characters");
      }
      if (!/[A-Z]/.test(formData.password)) {
        errors.push("One uppercase letter");
      }
      if (!/[a-z]/.test(formData.password)) {
        errors.push("One lowercase letter");
      }
      if (!/[0-9]/.test(formData.password)) {
        errors.push("One number");
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        errors.push("One special character");
      }
    }
    setPasswordErrors(errors);
  }, [formData.password]);

  const validatePassword = (): boolean => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    if (passwordErrors.length > 0) {
      toast({
        title: "Weak Password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (!validatePassword()) {
      return;
    }

    // Check CAPTCHA (unless in development)
    if (!captchaToken && process.env.NODE_ENV === "production") {
      toast({
        title: "Security Verification",
        description: "Please complete the security verification.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify CAPTCHA on server
      if (captchaToken && captchaToken !== "dev-token") {
        const captchaResponse = await fetch("/api/recaptcha/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: captchaToken }),
        });

        const captchaData = await captchaResponse.json();
        if (!captchaData.success) {
          toast({
            title: "Security Verification Failed",
            description: "Please try again or refresh the page.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        role: "EMPLOYER",
      });

      if (result.error) {
        toast({
          title: "Registration failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account created successfully! Let's complete your profile.",
        });
        // Redirect to onboarding after successful registration
        router.push("/onboarding");
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
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[2s]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[4s]"></div>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left Side - Branding & Benefits */}
          <div className="hidden lg:block space-y-6 text-center lg:text-left py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl icon-3d">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gradient">TimeTrack</h1>
              </div>
              <p className="text-xl font-semibold text-foreground">
                Start Your Journey Today
              </p>
              <p className="text-base text-muted-foreground max-w-md">
                Join thousands of companies using TimeTrack to streamline their workforce management. Get started in minutes.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4 mt-8">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border card-hover">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Free to Start</h3>
                  <p className="text-sm text-muted-foreground">No credit card required. Start tracking time today.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border card-hover">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Set Up in Minutes</h3>
                  <p className="text-sm text-muted-foreground">Get your team onboarded and tracking in no time.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border card-hover">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Built for Scale</h3>
                  <p className="text-sm text-muted-foreground">From startups to enterprises, we've got you covered.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 py-4 px-2 lg:px-0">
            <Card className="border-2 shadow-2xl bg-card/95 dark:bg-card/90 backdrop-blur-xl card-hover animate-in fade-in slide-in-from-right duration-700">
              <CardHeader className="space-y-2 text-center pb-6 px-6 pt-6">
                <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-50 group-hover:opacity-70 transition-opacity"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg icon-3d">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gradient">TimeTrack</CardTitle>
                </div>
                <div className="hidden lg:block">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Create Your Account
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Join thousands of companies transforming their workforce management
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-3 px-6 pb-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-10 border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-10 border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Acme Inc."
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      className="h-10 border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                        className="h-10 pr-10 border-2 focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all hover:scale-110"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {formData.password && passwordErrors.length > 0 && (
                      <div className="text-xs space-y-1 animate-in fade-in slide-in-from-top-2">
                        <ul className="flex flex-wrap gap-2">
                          {passwordErrors.map((error, index) => (
                            <li key={index} className="text-red-600 dark:text-red-400 px-2 py-0.5 bg-red-50 dark:bg-red-950/30 rounded">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {formData.password && passwordErrors.length === 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="h-3 w-3" />
                        Password meets all requirements
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="h-10 pr-10 border-2 focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all hover:scale-110"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 animate-in fade-in">Passwords do not match</p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>

                  {/* CAPTCHA */}
                  <div className="pt-1">
                    <ReCaptcha
                      onVerify={(token) => {
                        setCaptchaToken(token);
                      }}
                      onError={(error) => {
                        console.error("CAPTCHA error:", error);
                        toast({
                          title: "Security Verification",
                          description: "Please refresh the page if this persists.",
                          variant: "destructive",
                        });
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Protected by reCAPTCHA. Your information is secure.
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-3 pt-2 pb-6 px-6">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating account...
                      </span>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  
                  <div className="text-sm text-center">
                    <div className="text-muted-foreground">
                      Already have an account?{" "}
                      <Link href="/login" className="text-primary hover:underline font-medium transition-colors">
                        Sign in
                      </Link>
                    </div>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
