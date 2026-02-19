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
          const data = await res.json();
          if (!res.ok) {
            setStatus("error");
            setMessage(data.error || "Something went wrong.");
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Something went wrong.");
          return;
        }
        setResult({
          type: data.eventType,
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
    const raw = new TextDecoder().decode(record.data);
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

  const scanNFC = useCallback(() => {
    if (!nfcSupported) {
      setError("NFC is not supported on this device. Use the code field instead.");
      return;
    }
    if (!location) {
      setError("Please allow location first.");
      return;
    }
    setError(null);
    setIsScanning(true);
    try {
      // @ts-expect-error NDEFReader not in types
      const reader = new NDEFReader();
      reader.scan();
      reader.addEventListener("reading", async ({ message }: { message: { records: Array<{ data: BufferSource; recordType?: string }> } }) => {
        const record = message.records[0];
        if (!record?.data) {
          setError("No data on card. Use a card with the tap URL or clock code written.");
          setIsScanning(false);
          return;
        }
        const nfcId = nfcPayloadToCardId(record);
        if (!nfcId) {
          setError("Could not read card ID. Use a card with the tap URL or enter your code.");
          setIsScanning(false);
          return;
        }
        await clock(nfcId);
        setIsScanning(false);
      });
      reader.addEventListener("error", () => {
        setError("Could not read NFC card. Try again.");
        setIsScanning(false);
      });
    } catch {
      setError("Failed to start NFC. Use the code field instead.");
      setIsScanning(false);
    }
  }, [nfcSupported, location, clock, nfcPayloadToCardId]);

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
          <p className="text-sm text-muted-foreground">Tap your card or enter your code. Anyone can use this page.</p>
          <p className="text-xs text-muted-foreground">
            On iPhone: write the tap URL to your card with NFC Tools, then tap the card — the link opens and clocks you in/out. The &quot;Tap NFC card&quot; button does not work on iPhone.
          </p>
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

        {/* Success / Error result */}
        {result && (
          <div className="rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 text-center">
            <p className="font-medium text-green-800 dark:text-green-200">
              {result.type === "CLOCK_IN" ? "Clocked in" : "Clocked out"} — {result.name}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Next person can tap or enter code.</p>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* NFC */}
        {nfcSupported && (
          <Button
            className="w-full"
            size="lg"
            onClick={scanNFC}
            disabled={!location || isScanning || isClocking}
          >
            <Radio className="mr-2 h-4 w-4" />
            {isScanning ? "Hold your card…" : "Tap NFC card"}
          </Button>
        )}

        {/* Manual code */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <Label htmlFor="tap-code">Or enter your clock code</Label>
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
