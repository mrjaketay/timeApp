"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, MapPin, Clock } from "lucide-react";

/** When ?card= is present: auto clock that card (backward compatibility). */
function TapWithCard({ cardUid }: { cardUid: string }) {
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

/** Dedicated clock-in page: tap NFC or enter code — clocks whoever taps. */
function TapDedicatedPage() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isClocking, setIsClocking] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ type: "CLOCK_IN" | "CLOCK_OUT"; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        let data: { error?: string; code?: string; employeeName?: string | null; waitMinutesRemaining?: number; eventType?: string } = {};
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
        setResult({
          type: data.eventType ?? "CLOCK_IN",
          name: data.employeeName || "You",
        });
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
      await reader.scan();
      reader.addEventListener("reading", async ({ message }: { message: { records: Array<{ data: BufferSource; recordType?: string }> } }) => {
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
        // Reader keeps listening; next scan will clock the next person
      });
      reader.addEventListener("error", () => {
        setError("Could not read NFC card. Hold card again.");
        setIsScanning(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start NFC. Use the code field or allow NFC permission.");
      setIsScanning(false);
    }
  }, [nfcSupported, location, clock, nfcPayloadToCardId]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-slate-900">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Clock className="h-7 w-7" />
            Clock In / Out
          </h1>
          <p className="text-sm text-muted-foreground">
            {nfcSupported
              ? "Tap once to start, then hold your card to the phone to clock in or out."
              : "Enter your clock code below, or open the tap link from your card (iPhone)."}
          </p>
          {nfcSupported && (
            <p className="text-xs text-muted-foreground">
              Your card must have the tap URL or serial written to it (NFC Tools → Write → URL or Text). Get the URL from Dashboard → NFC Cards after registering the card.
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Button variant="ghost" size="sm" onClick={getLocation} disabled={isGettingLocation}>
              {isGettingLocation ? "Getting…" : "Refresh"}
            </Button>
          </div>
          {isGettingLocation && <p className="text-sm text-muted-foreground">Getting location…</p>}
          {location && (
            <p className="text-sm text-green-600 dark:text-green-400">Ready (accuracy ~{Math.round(location.coords.accuracy ?? 0)}m)</p>
          )}
          {locationError && <p className="text-sm text-destructive">{locationError}</p>}
        </div>

        {/* NFC: one tap to start (Chrome requires user gesture), then hold card */}
        {nfcSupported && location && (
          <>
            {!isScanning ? (
              <Button
                className="w-full h-12"
                size="lg"
                onClick={() => startNfcScan()}
                disabled={isClocking}
              >
                <Radio className="mr-2 h-4 w-4" />
                Tap to start, then hold card to phone
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Radio className="h-4 w-4 animate-pulse" />
                Hold card to phone to clock in/out
              </p>
            )}
          </>
        )}

        {/* Success / Error result */}
        {result && (
          <div className="rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 text-center">
            <p className="font-medium text-green-800 dark:text-green-200">
              {result.type === "CLOCK_IN" ? "Clocked in" : "Clocked out"} — {result.name}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Next person can scan a card or enter a code.</p>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive space-y-2">
            <p>{error}</p>
            {nfcSupported && location && !isScanning && (
              <button
                type="button"
                className="text-primary underline text-xs"
                onClick={() => startNfcScan()}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Manual code fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <Label htmlFor="tap-code">{nfcSupported ? "Or enter your clock code" : "Enter your clock code"}</Label>
          <div className="flex gap-2">
            <Input
              id="tap-code"
              placeholder="Clock code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              disabled={isClocking}
              className="flex-1"
            />
            <Button type="submit" disabled={!location || isClocking || !manualCode.trim()}>
              {isClocking ? "…" : "Go"}
            </Button>
          </div>
        </form>
      </div>
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
