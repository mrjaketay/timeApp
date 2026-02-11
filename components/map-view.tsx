"use client";

import { useEffect, useRef } from "react";

interface MapViewProps {
  lat: number;
  lng: number;
  address?: string;
  multiplePoints?: Array<{ lat: number; lng: number; label?: string }>;
}

export function MapView({ lat, lng, address, multiplePoints }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Using Mapbox GL JS
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (mapboxToken && typeof window !== "undefined" && (window as any).mapboxgl) {
      (window as any).mapboxgl.accessToken = mapboxToken;

      const map = new (window as any).mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 15,
      });

      // Add marker
      new (window as any).mapboxgl.Marker({ color: "#3b82f6" })
        .setLngLat([lng, lat])
        .setPopup(
          new (window as any).mapboxgl.Popup().setHTML(
            address || `${lat}, ${lng}`
          )
        )
        .addTo(map);

      // Add multiple points if provided
      if (multiplePoints) {
        multiplePoints.forEach((point) => {
          new (window as any).mapboxgl.Marker({ color: "#ef4444" })
            .setLngLat([point.lng, point.lat])
            .setPopup(
              new (window as any).mapboxgl.Popup().setHTML(
                point.label || `${point.lat}, ${point.lng}`
              )
            )
            .addTo(map);
        });
      }

      return () => map.remove();
    } else {
      // Fallback to static map or OpenStreetMap
      const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
      
      const iframe = document.createElement("iframe");
      iframe.src = staticMapUrl;
      iframe.width = "100%";
      iframe.height = "100%";
      iframe.frameBorder = "0";
      iframe.style.border = "0";
      
      mapRef.current.appendChild(iframe);

      return () => {
        if (mapRef.current && mapRef.current.contains(iframe)) {
          mapRef.current.removeChild(iframe);
        }
      };
    }
  }, [lat, lng, address, multiplePoints]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full bg-gray-100 rounded-lg"
      style={{ minHeight: "300px" }}
    />
  );
}
