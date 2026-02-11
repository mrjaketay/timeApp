"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, Radio } from "lucide-react";
import { format } from "date-fns";
import { WelcomeMessage } from "@/components/welcome-message";

export default function ClockPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isClocking, setIsClocking] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; time: Date } | null>(null);

  // Fetch last event on mount
  useEffect(() => {
    fetchLastEvent();
  }, [session]);

  const fetchLastEvent = async () => {
    try {
      const response = await fetch("/api/attendance/last-event");
      if (response.ok) {
        const data = await response.json();
        if (data.event) {
          setLastEvent({
            type: data.event.eventType,
            time: new Date(data.event.capturedAt),
          });
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Check NFC support
    if ("NDEFReader" in window) {
      setNfcSupported(true);
    }

    // Get initial location
    getLocation();

    return () => clearInterval(timer);
  }, []);

  const getLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMsg = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timeout.";
            break;
        }
        setLocationError(errorMsg);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const scanNFC = async () => {
    if (!nfcSupported) {
      toast({
        title: "NFC not supported",
        description: "Your device does not support NFC. Please use manual code entry.",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "Location required",
        description: "Please enable location access before clocking in/out.",
        variant: "destructive",
      });
      await getLocation();
      return;
    }

    setIsScanning(true);

    try {
      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const reader = new NDEFReader();
      await reader.scan();

      reader.addEventListener("reading", async ({ message }: any) => {
        const record = message.records[0];
        const nfcId = new TextDecoder().decode(record.data);
        
        // Determine event type based on last event
        const eventType = canClockIn ? "CLOCK_IN" : "CLOCK_OUT";
        await clockInOut(nfcId, eventType);
        setIsScanning(false);
      });

      reader.addEventListener("error", () => {
        toast({
          title: "NFC scan failed",
          description: "Could not read NFC card. Please try again.",
          variant: "destructive",
        });
        setIsScanning(false);
      });
    } catch (error) {
      toast({
        title: "NFC error",
        description: "Failed to start NFC scan. Please use manual code entry.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const clockInOut = async (nfcCardId?: string, eventType?: "CLOCK_IN" | "CLOCK_OUT") => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please enable location access before clocking in/out.",
        variant: "destructive",
      });
      return;
    }

    setIsClocking(true);

    try {
      // Reverse geocode to get address
      const address = await reverseGeocode(location.coords.latitude, location.coords.longitude);

      const response = await fetch("/api/attendance/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nfcCardId: nfcCardId || manualCode || undefined,
          locationLat: location.coords.latitude,
          locationLng: location.coords.longitude,
          accuracyMeters: location.coords.accuracy,
          address: address,
          deviceInfo: navigator.userAgent,
          eventType: eventType, // Pass explicit event type if provided
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clock in/out");
      }

      setLastEvent({ type: data.eventType, time: new Date() });
      setManualCode("");
      
      toast({
        title: "Success",
        description: `Successfully ${data.eventType === "CLOCK_IN" ? "clocked in" : "clocked out"}`,
      });

      // Refresh location for next clock
      await getLocation();
      
      // Refresh last event
      await fetchLastEvent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clock in/out",
        variant: "destructive",
      });
    } finally {
      setIsClocking(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using Mapbox Geocoding API
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (mapboxToken) {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        }
      }

      // Fallback to OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `${lat}, ${lng}`;
    } catch (error) {
      return `${lat}, ${lng}`;
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast({
        title: "Code required",
        description: "Please enter a clock code",
        variant: "destructive",
      });
      return;
    }
    await clockInOut();
  };

  const canClockIn = !lastEvent || lastEvent.type === "CLOCK_OUT";
  const canClockOut = lastEvent?.type === "CLOCK_IN";

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center mb-4">
        <WelcomeMessage userName={session?.user?.name || null} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Clock In/Out</span>
          </CardTitle>
          <CardDescription>
            {format(currentTime, "EEEE, MMMM d, yyyy • HH:mm:ss")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Location Status</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={getLocation}
                disabled={isGettingLocation}
              >
                Refresh
              </Button>
            </div>
            {isGettingLocation ? (
              <p className="text-sm text-muted-foreground">Getting location...</p>
            ) : location ? (
              <div className="flex items-start space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Location captured</p>
                  <p className="text-muted-foreground">
                    Accuracy: {location.coords.accuracy.toFixed(0)}m
                  </p>
                </div>
              </div>
            ) : locationError ? (
              <div className="text-sm text-red-600">
                <p>{locationError}</p>
                <p className="mt-1 text-xs">
                  Location is required to clock in/out. Please enable location access in your browser settings.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No location data</p>
            )}
          </div>

          {/* NFC Scan */}
          {nfcSupported && (
            <div className="space-y-2">
              <Button
                onClick={scanNFC}
                disabled={!location || isScanning || isClocking}
                className="w-full"
                size="lg"
              >
                <Radio className="mr-2 h-4 w-4" />
                {isScanning ? "Scanning NFC Card..." : "Scan NFC Card to Clock In/Out"}
              </Button>
            </div>
          )}

          {/* Manual Code Entry */}
          <div className="space-y-2">
            <Label>Or enter clock code manually</Label>
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <Input
                placeholder="Enter clock code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={isClocking}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!canClockIn || !location) return;
                    await clockInOut(manualCode, "CLOCK_IN");
                  }}
                  disabled={!location || isClocking || !canClockIn}
                  className="w-full"
                  variant={canClockIn ? "default" : "outline"}
                >
                  Clock In
                </Button>
                <Button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!canClockOut || !location) return;
                    await clockInOut(manualCode, "CLOCK_OUT");
                  }}
                  disabled={!location || isClocking || !canClockOut}
                  className="w-full"
                  variant={canClockOut ? "default" : "outline"}
                >
                  Clock Out
                </Button>
              </div>
            </form>
          </div>

          {/* Last Event */}
          {lastEvent && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Last action:</p>
              <p className="text-sm font-medium">
                {lastEvent.type === "CLOCK_IN" ? "Clocked In" : "Clocked Out"} at{" "}
                {format(lastEvent.time, "HH:mm:ss")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
