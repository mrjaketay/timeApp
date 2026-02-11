"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Clock, Mail, Lock, Sparkles, TrendingUp, Users, Shield, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Prefill email from query params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Login failed",
          description: result.error || "Invalid email or password",
          variant: "destructive",
        });
      } else if (result?.ok) {
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        
        // Wait for session to be properly set
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Try to get role with retries
        let role = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!role && attempts < maxAttempts) {
          try {
            const roleResponse = await fetch("/api/auth/me", { 
              cache: "no-store",
              credentials: "include",
              headers: {
                "Cache-Control": "no-cache",
              }
            });
            
            if (roleResponse.ok) {
              const data = await roleResponse.json();
              role = data.role;
              break;
            }
          } catch (error) {
            console.error(`Attempt ${attempts + 1} failed:`, error);
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Redirect based on role
        if (role === "ADMIN") {
          window.location.href = "/admin";
        } else if (role === "EMPLOYEE") {
          window.location.href = "/clock";
        } else {
          // Default to dashboard - it will handle role-based redirect
          window.location.href = "/dashboard";
        }
      } else {
        toast({
          title: "Login failed",
          description: "Unable to complete login",
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
          {/* Left Side - Branding & Features */}
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
                Modern Time Tracking Solution
              </p>
              <p className="text-base text-muted-foreground max-w-md">
                Track employee attendance effortlessly with NFC technology, location verification, and real-time insights.
              </p>
            </div>

            {/* Feature Icons Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border card-hover">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Real-time Analytics</h3>
                <p className="text-xs text-muted-foreground">Track performance with live insights</p>
              </div>
              
              <div className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border card-hover">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Team Management</h3>
                <p className="text-xs text-muted-foreground">Manage your workforce efficiently</p>
              </div>
              
              <div className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border card-hover">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                  <Shield className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Secure & Reliable</h3>
                <p className="text-xs text-muted-foreground">Enterprise-grade security</p>
              </div>
              
              <div className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border card-hover">
                <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-pink-500/20 transition-colors">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                </div>
                <h3 className="text-sm font-semibold mb-1">Smart Features</h3>
                <p className="text-xs text-muted-foreground">AI-powered insights</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 py-4">
            <Card className="border-2 shadow-2xl bg-card/80 backdrop-blur-xl card-hover">
              <CardHeader className="space-y-2 text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg icon-3d">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gradient">TimeTrack</CardTitle>
                </div>
                <div className="hidden lg:block">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-3 pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  
                  <div className="text-sm text-center space-y-2">
                    <div className="text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <Link href="/register" className="text-primary hover:underline font-medium">
                        Sign up
                      </Link>
                    </div>
                    <div className="text-muted-foreground">
                      Interested in our pricing?{" "}
                      <Link href="/pricing" className="text-primary hover:underline font-medium">
                        View Plans
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
