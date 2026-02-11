"use client";

import { useEffect, useState } from "react";

interface WelcomeMessageProps {
  userName?: string | null;
}

export function WelcomeMessage({ userName }: WelcomeMessageProps) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let timeGreeting = "";

      if (hour >= 5 && hour < 12) {
        timeGreeting = "Good Morning";
      } else if (hour >= 12 && hour < 17) {
        timeGreeting = "Good Afternoon";
      } else if (hour >= 17 && hour < 22) {
        timeGreeting = "Good Evening";
      } else {
        timeGreeting = "Good Night";
      }

      setGreeting(timeGreeting);
    };

    // Set initial greeting
    updateGreeting();

    // Update greeting every minute (in case user stays on page for a long time)
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  // Extract first name from full name
  const getFirstName = () => {
    if (!userName) return "";
    const nameParts = userName.trim().split(" ");
    return nameParts[0];
  };

  const firstName = getFirstName();

  if (!firstName) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground font-medium">
      {greeting}, {firstName}!
    </p>
  );
}
