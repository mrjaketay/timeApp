"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { MapPin, CreditCard, ExternalLink, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** User-friendly message when Web NFC (NDEFReader) is not available. */
function getNfcNotSupportedMessage(): string {
  if (typeof navigator === "undefined") return "NFC not supported — use code below";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "NFC not supported on iPhone in this browser — use code below";
  if (/Android/i.test(ua)) return "NFC not supported in this browser — try Chrome or use code below";
  if (/Safari/i.test(ua) && !/Chrome|Android/i.test(ua)) return "NFC not supported in Safari — use code below";
  return "NFC scanning is only available on Android (Chrome). Use the code below on this device.";
}

/** When ?card= is present: auto clock that card (backward compatibility). */
function TapWithCard({ cardUid }: { cardUid: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-location">("loading");
  const [message, setMessage] = useState("");
  const [eventType, setEventType] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setStatus("no-location");
      setMessage("Location access is required to clock in/out. Please enable it in your browser settings.");
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
          let data: { error?: string; code?: string; employeeName?: string | null; waitMinutesRemaining?: number; eventType?: string } = {};
          try {
            data = await res.json();
          } catch {
            setStatus("error");
            setMessage(res.ok ? "Invalid response." : "Server error. Please try again.");
            return;
          }
          if (!res.ok) {
            setStatus("error");
            if (data.code === "ALREADY_CLOCKED_IN") {
              const name = data.employeeName ?? "This user";
              const mins = data.waitMinutesRemaining ?? 2;
              setMessage(`${name} is already clocked in. Please wait ${mins} ${mins === 1 ? "minute" : "minutes"} before scanning again.`);
            } else {
              setMessage(typeof data.error === "string" ? data.error : "Could not clock in/out. Please try again.");
            }
            return;
          }
          setStatus("success");
          setEventType(data.eventType === "CLOCK_IN" ? "Clocked in" : "Clocked out");
          setMessage(
            data.employeeName
              ? `${data.employeeName} – ${data.eventType === "CLOCK_IN" ? "Clocked in" : "Clocked out"}!`
              : data.eventType === "CLOCK_IN"
                ? "Clocked in!"
                : "Clocked out!"
          );
        } catch {
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
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    return () => {
      cancelled = true;
    };
  }, [cardUid]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
        <div className="animate-pulse text-muted-foreground">Getting location and clocking you in/out…</div>
        <p className="text-sm text-muted-foreground mt-2">Please allow location access if prompted.</p>
        <p className="text-xs text-muted-foreground mt-4 max-w-xs text-center">Using a recent location when possible so this stays quick.</p>
      </div>
    );
  }

  // After success, redirect back to /tap so the next person can clock in/out
  useEffect(() => {
    if (status !== "success") return;
    const id = setTimeout(() => router.replace("/tap"), 3500);
    return () => clearTimeout(id);
  }, [status, router]);

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
      <p className="text-sm text-muted-foreground mt-4">Returning to tap page…</p>
      <button
        type="button"
        onClick={() => router.replace("/tap")}
        className="mt-4 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
      >
        Tap again
      </button>
    </div>
  );
}

/** Dedicated clock-in page: tap NFC or enter code — clocks whoever taps. */
function TapDedicatedPage() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isClocking, setIsClocking] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{
    type: "CLOCK_IN" | "CLOCK_OUT";
    name: string;
    eventId?: string;
    clockedInAt?: string;
  } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Debounce: ignore NFC reads within this ms of the last processed read (avoids triple-tap). */
  const lastNfcReadAt = useRef(0);
  const NFC_READ_COOLDOWN_MS = 3000;

  const getLocation = useCallback(() => {
    setIsGettingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported.");
      setIsGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setIsGettingLocation(false);
      },
      (err) => {
        setLocationError(
          err.code === 1 ? "Location permission denied. Please enable location access." : "Could not get location."
        );
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => {
    getLocation();
    if ("NDEFReader" in window) setNfcSupported(true);
  }, [getLocation]);

  const clock = useCallback(
    async (nfcCardId: string) => {
      if (!location) {
        setError("Location required. Please enable location and try again.");
        getLocation();
        return;
      }
      setError(null);
      setResult(null);
      setIsClocking(true);
      try {
        const res = await fetch("/api/attendance/clock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nfcCardId: nfcCardId.trim(),
            locationLat: location.coords.latitude,
            locationLng: location.coords.longitude,
            accuracyMeters: location.coords.accuracy ?? 50,
            deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          }),
        });
        let data: {
          error?: string;
          code?: string;
          employeeName?: string | null;
          waitMinutesRemaining?: number;
          eventType?: string;
          attendanceEvent?: { id: string; capturedAt: string };
        } = {};
        try {
          data = await res.json();
        } catch {
          setError(res.ok ? "Invalid response." : "Server error. Please try again.");
          return;
        }
        if (!res.ok) {
          if (data.code === "ALREADY_CLOCKED_IN") {
            const name = data.employeeName ?? "This user";
            const mins = data.waitMinutesRemaining ?? 2;
            setError(
              `${name} is already clocked in. Please wait ${mins} ${mins === 1 ? "minute" : "minutes"} before scanning again.`
            );
          } else {
            setError(typeof data.error === "string" ? data.error : "Could not clock in/out. Please try again.");
          }
          return;
        }
        const eventType = data.eventType === "CLOCK_OUT" ? "CLOCK_OUT" : "CLOCK_IN";
        const ev = data.attendanceEvent;
        setResult({
          type: eventType,
          name: data.employeeName || "You",
          eventId: ev?.id,
          clockedInAt: eventType === "CLOCK_IN" && ev?.capturedAt ? ev.capturedAt : undefined,
        });
        if (eventType === "CLOCK_IN" && ev?.capturedAt) {
          setElapsedSeconds(0);
        }
        setManualCode("");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsClocking(false);
      }
    },
    [location, getLocation]
  );

  /** Extract card UID from NFC payload: if it's a tap URL (?card=...), use the param; else use raw payload. */
  const nfcPayloadToCardId = useCallback((record: { data: BufferSource; recordType?: string }): string => {
    let raw = new TextDecoder().decode(record.data);
    // NDEF URI records may have a leading prefix byte (0x00-0x24); strip non-printable leading chars
    raw = raw.replace(/^[\x00-\x1f\x7f]+/, "");
    // Card may have the tap URL written on it (e.g. https://domain.com/tap?card=UID)
    const cardMatch = raw.match(/[?&]card=([^&\s#]+)/i) ?? raw.match(/card=([^&\s#]+)/i);
    if (cardMatch) {
      try {
        return decodeURIComponent(cardMatch[1].trim());
      } catch {
        return cardMatch[1].trim();
      }
    }
    return raw.trim();
  }, []);

  const startNfcScan = useCallback(async () => {
    if (!nfcSupported || !location) return;
    setError(null);
    setResult(null);
    setIsScanning(true);
    try {
      // @ts-expect-error NDEFReader not in types
      const reader = new NDEFReader();
      // Timeout if scan never starts (e.g. NFC off, permission dismissed)
      const scanPromise = reader.scan();
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("NFC didn't start. Check NFC is on in phone settings and allow permission, then tap the circle again.")), 15000)
      );
      await Promise.race([scanPromise, timeout]);
      reader.addEventListener("reading", async ({ message }: { message: { records: Array<{ data: BufferSource; recordType?: string }> } }) => {
        const now = Date.now();
        if (now - lastNfcReadAt.current < NFC_READ_COOLDOWN_MS) return;
        lastNfcReadAt.current = now;
        try {
          const record = message.records[0];
          if (!record?.data) {
            setError("No data on card. Use a card with the tap URL or clock code written.");
            return;
          }
          const nfcId = nfcPayloadToCardId(record);
          if (!nfcId) {
            setError("Could not read card ID. Use a card with the tap URL or enter your code.");
            return;
          }
          setError(null);
          await clock(nfcId);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not read card. Try again or use the code below.");
        }
      });
      reader.addEventListener("error", () => {
        setError("Could not read NFC card. Hold card to the back of the phone again.");
        setIsScanning(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start NFC. Use the code field or allow NFC permission.");
      setIsScanning(false);
    }
  }, [nfcSupported, location, clock, nfcPayloadToCardId]);

  const stopNfcScan = useCallback(() => {
    setIsScanning(false);
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setResult(null);
    setElapsedSeconds(0);
    setDetailsOpen(false);
  }, []);

  // Auto-return to tap interface after success so another clock can take place
  useEffect(() => {
    if (!result) return;
    const id = setTimeout(clearSuccess, 4000);
    return () => clearTimeout(id);
  }, [result, clearSuccess]);

  // Running timer when clocked in
  useEffect(() => {
    if (!result || result.type !== "CLOCK_IN" || !result.clockedInAt) return;
    const start = new Date(result.clockedInAt).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [result?.type, result?.clockedInAt]);

  function formatElapsed(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // Chrome requires a user gesture to start NFC; we can't auto-start in useEffect

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) {
      setError("Enter your clock code.");
      return;
    }
    clock(code);
  };

  const canTapNfc = nfcSupported && location && !isClocking;
  const showNfcPrompt = canTapNfc && !isScanning;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-4 py-4 sm:py-5 safe-area-inset-top shadow-md">
        <div className="flex justify-center max-w-lg mx-auto">
          <Logo showText={true} size="md" variant="light" />
        </div>
      </header>

      {/* Main: centered card-style content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-md flex flex-col items-center">
          {isGettingLocation && !location && !locationError && (
            <p className="text-sm text-muted-foreground text-center mb-4">Getting location… Allow location access to continue.</p>
          )}
          {locationError && (
            <div className="w-full mb-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
              <p className="text-sm text-destructive">{locationError}</p>
              <Button variant="outline" size="sm" onClick={getLocation} className="mt-3">Retry location</Button>
            </div>
          )}

          {!location && !locationError && !isGettingLocation && (
            <Button variant="outline" size="sm" onClick={getLocation} className="mb-4">Enable location</Button>
          )}

          <h1 className="text-center text-xl sm:text-2xl font-semibold text-foreground mb-6 sm:mb-10 max-w-[280px] sm:max-w-none">
            Tap your NFC card to continue
          </h1>

          {/* Tappable NFC graphic */}
          <button
            type="button"
            onClick={() => canTapNfc && startNfcScan()}
            disabled={!canTapNfc}
            className="relative touch-manipulation select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950 rounded-full disabled:opacity-60 disabled:cursor-not-allowed min-w-[11rem] min-h-[11rem] sm:min-w-[12rem] sm:min-h-[12rem] flex items-center justify-center"
            aria-label={showNfcPrompt ? "Tap to start NFC, then hold your card" : isScanning ? "Hold your NFC card to the back of the phone" : "Enable location to tap"}
          >
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-blue-400/40 animate-pulse" />
                <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-blue-300/30 animate-pulse" style={{ animationDelay: "0.3s" }} />
              </div>
              <div className="relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-xl shadow-blue-900/20">
                <CreditCard className="w-12 h-12 sm:w-14 sm:h-14 text-white" strokeWidth={2} />
              </div>
            </div>
          </button>

          <p className="text-sm text-muted-foreground text-center mt-6 sm:mt-8 max-w-[280px] sm:max-w-sm">
            {isScanning
              ? "Hold your NFC card to the back of your phone now."
              : showNfcPrompt
                ? "Tap the circle above, then hold your card to the phone"
                : !location
                  ? "Location required first"
                  : !nfcSupported
                    ? getNfcNotSupportedMessage()
                    : null}
          </p>
          {isScanning && (
            <button
              type="button"
              onClick={stopNfcScan}
              className="mt-3 text-sm text-muted-foreground underline hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Success */}
          {result && (
            <>
              <button
                type="button"
                onClick={() => result.eventId && setDetailsOpen(true)}
                className="mt-6 sm:mt-8 w-full rounded-2xl bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 p-5 sm:p-6 text-center shadow-md hover:bg-green-200/50 dark:hover:bg-green-900/50 hover:border-green-300 dark:hover:border-green-700 transition-colors active:scale-[0.99]"
              >
                {result.type === "CLOCK_IN" && result.clockedInAt ? (
                  <>
                    <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                      <span className="text-3xl sm:text-4xl font-mono font-bold tabular-nums">
                        {formatElapsed(elapsedSeconds)}
                      </span>
                    </div>
                    <p className="font-semibold text-green-800 dark:text-green-200 text-base sm:text-lg mt-2">
                      {result.name} — Clocked in
                    </p>
                    <p className="text-sm text-green-700/80 dark:text-green-300/80 mt-1">
                      Tap for details
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-green-800 dark:text-green-200 text-base sm:text-lg">
                      {result.type === "CLOCK_IN" ? "Clocked in" : "Clocked out"} — {result.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Hold your card again to clock in/out next time.</p>
                    {result.eventId && (
                      <p className="text-xs text-muted-foreground mt-2">Tap for details</p>
                    )}
                  </>
                )}
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearSuccess}
                className="mt-3 w-full sm:w-auto"
              >
                Tap again
              </Button>

              <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Shift details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {result && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Employee</p>
                          <p className="font-medium">{result.name}</p>
                        </div>
                        {result.clockedInAt && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Clock-in time</p>
                              <p className="font-medium">
                                {new Date(result.clockedInAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "medium",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Time running</p>
                              <p className="font-mono font-semibold text-lg">{formatElapsed(elapsedSeconds)}</p>
                            </div>
                          </>
                        )}
                        {result.eventId && (
                          <a
                            href={`/dashboard/attendance/${result.eventId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                          >
                            View in dashboard
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 sm:mt-8 w-full rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-sm text-destructive text-center">
              <p>{error}</p>
              {canTapNfc && (
                <button type="button" className="mt-2 text-primary font-medium underline text-xs sm:text-sm" onClick={() => startNfcScan()}>
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-4 sm:py-5 bg-white dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 safe-area-inset-bottom">
        <div className="max-w-md mx-auto">
          <details className="group rounded-lg">
            <summary className="text-sm text-muted-foreground cursor-pointer list-none flex items-center justify-between py-2 px-1">
              <span>{location ? `Location ready · ~${Math.round(location.coords.accuracy ?? 0)}m` : "Location"}</span>
              <span className="group-open:rotate-180 transition-transform text-muted-foreground">▼</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <Button variant="ghost" size="sm" onClick={getLocation} disabled={isGettingLocation} className="w-full sm:w-auto">
                <MapPin className="h-3.5 w-3.5 mr-2" /> {isGettingLocation ? "Getting…" : "Refresh location"}
              </Button>
              <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="tap-code"
                  placeholder="Or enter clock code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={isClocking}
                  className="flex-1 text-sm min-w-0"
                />
                <Button type="submit" size="sm" disabled={!location || isClocking || !manualCode.trim()} className="sm:shrink-0">
                  Go
                </Button>
              </form>
            </div>
          </details>
        </div>
      </footer>
    </div>
  );
}

function TapContent() {
  const searchParams = useSearchParams();
  const cardUid = searchParams.get("card");

  if (cardUid?.trim()) {
    return <TapWithCard cardUid={cardUid.trim()} />;
  }

  return <TapDedicatedPage />;
}

export default function TapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
          <div className="animate-pulse text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <TapContent />
    </Suspense>
  );
}
