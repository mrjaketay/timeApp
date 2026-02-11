"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { FeatureModal } from "@/components/feature-modal";
import { 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone,
  Zap,
  Sparkles,
  Star,
  Clock,
  ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      return;
    }
    
    setIsLoading(true);
    // Redirect to register with prefilled email
    router.push(`/register?email=${encodeURIComponent(email)}`);
  };

  const handleSignIn = () => {
    if (email) {
      router.push(`/login?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/login");
    }
  };

  const features = [
    {
      id: "realtime-tracking",
      icon: Clock,
      title: "Real-Time Tracking",
      description: "Monitor employee attendance in real-time with instant clock-in/out notifications.",
      details: [
        "Instant notifications when employees clock in or out",
        "GPS location tracking for accurate attendance records",
        "Break time tracking with automatic calculations",
        "Web and mobile app support for seamless access",
        "NFC card support for quick check-ins",
      ],
      benefits: [
        "Eliminate time theft and buddy punching",
        "Accurate payroll calculations with real-time data",
        "Reduce administrative overhead by 80%",
        "Get instant visibility into who's working when",
      ],
    },
    {
      id: "team-management",
      icon: Users,
      title: "Team Management",
      description: "Easily manage your entire workforce with intuitive employee profiles and settings.",
      details: [
        "Comprehensive employee profiles with photos and details",
        "Role-based access control and permissions",
        "Employee invitation system with email notifications",
        "Bulk employee management and imports",
        "Employment history and tenure tracking",
      ],
      benefits: [
        "Centralized employee database",
        "Streamlined onboarding process",
        "Better organization and team oversight",
        "Easy employee status management",
      ],
    },
    {
      id: "analytics",
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get powerful insights with detailed reports and analytics on attendance patterns.",
      details: [
        "Customizable reports by date range, employee, or location",
        "Hours worked analysis with break time calculations",
        "Attendance trends and pattern recognition",
        "Export to CSV and Excel formats",
        "Visual charts and graphs for better understanding",
      ],
      benefits: [
        "Data-driven decision making",
        "Identify attendance patterns and issues early",
        "Optimize workforce scheduling",
        "Compliance reporting made easy",
      ],
    },
    {
      id: "security",
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security to keep your data safe and your operations running smoothly.",
      details: [
        "End-to-end encryption for all data transmission",
        "Role-based access control (RBAC)",
        "Regular automated backups",
        "GDPR and SOC 2 compliant",
        "99.9% uptime SLA guarantee",
      ],
      benefits: [
        "Protect sensitive employee data",
        "Maintain compliance with regulations",
        "Peace of mind with enterprise security",
        "Never lose data with automatic backups",
      ],
    },
    {
      id: "mobile",
      icon: Smartphone,
      title: "Mobile Access",
      description: "Access TimeTrack anywhere, anytime with our responsive web app and mobile support.",
      details: [
        "Fully responsive web app works on all devices",
        "Progressive Web App (PWA) support",
        "Offline mode for clocking in/out",
        "Push notifications for important updates",
        "Biometric authentication support",
      ],
      benefits: [
        "Clock in from anywhere with mobile devices",
        "No app installation required",
        "Works seamlessly across all platforms",
        "Always accessible, even offline",
      ],
    },
    {
      id: "performance",
      icon: Zap,
      title: "Lightning Fast",
      description: "Experience blazing-fast performance with instant updates and seamless navigation.",
      details: [
        "Sub-second page load times",
        "Real-time data synchronization",
        "Optimized database queries",
        "CDN-powered asset delivery",
        "Smart caching for instant responses",
      ],
      benefits: [
        "Save time with instant access",
        "Smooth, lag-free user experience",
        "Handle thousands of employees effortlessly",
        "Productivity boost with fast workflows",
      ],
    },
  ];

  const benefits = [
    "Save hours on manual time tracking",
    "Reduce payroll errors by up to 95%",
    "Improve compliance with automated records",
    "Get insights that drive better decisions",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background Image - Modern workspace with time tracking */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 dark:opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3')",
            backgroundPosition: "center center",
            backgroundSize: "cover",
            backgroundAttachment: "fixed",
            minHeight: "100vh",
            height: "100vh",
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 via-purple-600/30 to-pink-600/20 dark:from-blue-900/60 dark:via-purple-900/50 dark:to-pink-900/40"></div>
        
        {/* Animated Blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 dark:opacity-40 animate-blob"></div>
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 dark:opacity-40 animate-blob animation-delay-[2s]"></div>
        <div className="absolute bottom-0 right-1/3 w-[450px] h-[450px] bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-60 dark:opacity-40 animate-blob animation-delay-[4s]"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-pink-500/15 dark:bg-pink-500/8 rounded-full mix-blend-multiply filter blur-3xl opacity-40 dark:opacity-25 animate-blob animation-delay-[3s]"></div>
        
        {/* Geometric Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f608_1px,transparent_1px),linear-gradient(to_bottom,#3b82f608_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:60px_60px] opacity-30 dark:opacity-20"></div>
        
        {/* Animated Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/3 animate-[shimmer_8s_infinite]"></div>
        
        {/* Floating Particles Effect */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-blue-400/40 dark:bg-blue-400/25 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 px-4 lg:px-8 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <Logo showText size="lg" variant="dark" />
          
          <div className="flex items-center gap-4">
            <Link 
              href="/pricing" 
              className="text-gray-700 dark:text-white/80 hover:text-blue-600 dark:hover:text-white transition-all duration-200 text-sm font-semibold hidden md:flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-white/10 group"
            >
              Pricing
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
            <Button 
              variant="outline" 
              onClick={handleSignIn}
              className="text-gray-700 dark:text-white border-gray-300 dark:border-white/20 hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
            >
              Sign In
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-4 lg:px-8 py-12 lg:py-20">
        <div className="container mx-auto max-w-5xl">
          {/* Hero Content */}
          <div className="text-center space-y-6 lg:space-y-8 mb-12 lg:mb-16">
            <h1 className="text-5xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-white leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Track Time.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                Build Success.
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-700 dark:text-white/90 max-w-2xl mx-auto font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              The modern workforce management platform that helps you save time, reduce errors, and grow your business.
            </p>

            {/* Email Capture Form */}
            <form onSubmit={handleGetStarted} className="max-w-lg mx-auto mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 text-base bg-white/95 dark:bg-white/10 backdrop-blur-md border-2 border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/60 focus:bg-white dark:focus:bg-white/15 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl shadow-lg hover:shadow-xl transition-all"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="h-14 px-8 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 rounded-xl group"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/70 mt-3 font-medium">
                Start your free trial • No credit card required • Cancel anytime
              </p>
            </form>
          </div>

          {/* Quick Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 lg:mb-20">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-gray-700 dark:text-white/80 text-sm lg:text-base p-3 rounded-xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all"
              >
                <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="mb-16 lg:mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Everything you need to manage your workforce
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    onClick={() => setSelectedFeature(feature.id)}
                    className="p-6 rounded-xl bg-white/90 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/20 dark:to-purple-500/20 w-fit group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-gray-400 dark:text-white/40 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 translate-x-0 translate-y-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-white/70">{feature.description}</p>
                    <FeatureModal
                      feature={feature}
                      open={selectedFeature === feature.id}
                      onOpenChange={(open) => !open && setSelectedFeature(null)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing CTA */}
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-block p-8 lg:p-12 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/10 dark:via-purple-500/10 dark:to-pink-500/10 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-xl">
              <Sparkles className="h-12 w-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600 dark:text-white/70 mb-6 max-w-md mx-auto">
                Start free, scale as you grow. No credit card required.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/pricing">
                  View Pricing Plans
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center space-y-4 mb-12">
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-white/60 text-sm">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span>Rated 4.9/5 by teams worldwide</span>
            </div>
            <p className="text-gray-600 dark:text-white/60 text-sm">
              Trusted by 1,000+ companies • Join thousands of satisfied customers
            </p>
          </div>

          {/* Final CTA */}
          <div className="text-center space-y-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Ready to transform your workforce management?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => email ? router.push(`/register?email=${encodeURIComponent(email)}`) : router.push("/register")}
                className="h-14 px-8 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleSignIn}
              className="h-14 px-8 text-base border-gray-300 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-white/40 transition-all"
            >
              Sign In
            </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo showText size="md" variant="light" className="text-white/80" />
            <div className="flex items-center gap-6 text-sm text-white/60">
              <Link href="/pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors font-medium">
                Pricing
              </Link>
              <Link href="/login" className="hover:text-blue-600 dark:hover:text-white transition-colors font-medium">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-blue-600 dark:hover:text-white transition-colors font-medium">
                Sign Up
              </Link>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-white/40">
            <p>© {new Date().getFullYear()} TimeTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
