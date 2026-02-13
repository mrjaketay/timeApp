"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function TapContent() {
  const searchParams = useSearchParams();
  const cardUid = searchParams.get("card");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-card" | "no-location">("loading");
  const [message, setMessage] = useState("");
  const [eventType, setEventType] = useState<string | null>(null);

  useEffect(() => {
    if (!cardUid || !cardUid.trim()) {
      setStatus("no-card");
      setMessage("Invalid tap link. No card specified.");
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!navigator.geolocation) {
        if (!cancelled) {
          setStatus("no-location");
          setMessage("Location access is required to clock in/out. Please enable it in your browser settings.");
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled) return;
          const { latitude, longitude, accuracy } = position.coords;
          try {
            const res = await fetch("/api/attendance/clock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nfcCardId: cardUid.trim(),
                locationLat: latitude,
                locationLng: longitude,
                accuracyMeters: accuracy ?? 50,
                deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setStatus("error");
              setMessage(data.error || "Something went wrong.");
              return;
            }
            setStatus("success");
            setEventType(data.eventType === "CLOCK_IN" ? "Clocked in" : "Clocked out");
            setMessage(data.employeeName ? `${data.employeeName} – ${data.eventType === "CLOCK_IN" ? "Clocked in" : "Clocked out"}!` : (data.eventType === "CLOCK_IN" ? "Clocked in!" : "Clocked out!"));
          } catch (err) {
            setStatus("error");
            setMessage("Network error. Please try again.");
          }
        },
        () => {
          if (!cancelled) {
            setStatus("no-location");
            setMessage("Location access is required. Please allow location and try again.");
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    run();
    return () => { cancelled = true; };
  }, [cardUid]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="animate-pulse text-muted-foreground">Getting location and clocking you in/out…</div>
        <p className="text-sm text-muted-foreground mt-2">Please allow location access if prompted.</p>
      </div>
    );
  }

  if (status === "no-card") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4 mb-4">
          <svg className="h-12 w-12 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-center">Invalid link</h1>
        <p className="text-muted-foreground text-center mt-2">{message}</p>
      </div>
    );
  }

  if (status === "no-location" || status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
          <svg className="h-12 w-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-center">{status === "no-location" ? "Location required" : "Something went wrong"}</h1>
        <p className="text-muted-foreground text-center mt-2 max-w-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-emerald-950">
      <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
        <svg className="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-center text-green-800 dark:text-green-200">{eventType}!</h1>
      <p className="text-muted-foreground text-center mt-2">{message}</p>
    </div>
  );
}

export default function TapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    }>
      <TapContent />
    </Suspense>
  );
}
