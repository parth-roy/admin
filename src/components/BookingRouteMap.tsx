import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ExternalLink, MapPin, Navigation, Truck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_TOKEN as string) || "";

export interface BookingRouteMapProps {
  pickup: {
    lat: number;
    lng: number;
    address: string;
    otp?: string | null;
  };
  stops: Array<{
    lat: number;
    lng: number;
    address: string;
    receiverName?: string | null;
    receiverPhone?: string | null;
    sequence?: number;
  }>;
  driver?: {
    lat?: number | null;
    lng?: number | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  locationHistory?: Array<{
    latitude: number;
    longitude: number;
    recordedAt?: string;
  }>;
  estimatedDistance?: number | null;
  estimatedDuration?: number | null;
}

export function BookingRouteMap({
  pickup,
  stops,
  driver,
  locationHistory,
  estimatedDistance,
  estimatedDuration,
}: BookingRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Validate coordinates
  const validPickup =
    pickup &&
    typeof pickup.lat === "number" &&
    typeof pickup.lng === "number" &&
    !isNaN(pickup.lat) &&
    !isNaN(pickup.lng) &&
    (pickup.lat !== 0 || pickup.lng !== 0);

  const validStops = (stops || []).filter(
    (s) =>
      typeof s.lat === "number" &&
      typeof s.lng === "number" &&
      !isNaN(s.lat) &&
      !isNaN(s.lng) &&
      (s.lat !== 0 || s.lng !== 0)
  );

  const lastStop = validStops.length > 0 ? validStops[validStops.length - 1] : null;

  // Google Maps directions fallback URL
  const googleMapsUrl =
    validPickup && lastStop
      ? `https://www.google.com/maps/dir/?api=1&origin=${pickup.lat},${pickup.lng}&destination=${lastStop.lat},${lastStop.lng}`
      : validPickup
      ? `https://www.google.com/maps/search/?api=1&query=${pickup.lat},${pickup.lng}`
      : null;

  useEffect(() => {
    if (!mapContainer.current || !validPickup) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Center point
    const centerLng = pickup.lng;
    const centerLat = pickup.lat;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [centerLng, centerLat],
      zoom: 12,
      attributionControl: false,
      trackResize: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    mapRef.current = map;

    map.on("load", () => {
      setMapLoaded(true);

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([pickup.lng, pickup.lat]);

      // ── 1. PICKUP MARKER (Green) ──
      const pickupEl = document.createElement("div");
      pickupEl.className = "flex flex-col items-center cursor-pointer group";
      pickupEl.innerHTML = `
        <div style="background-color: #10B981; color: white; width: 28px; height: 28px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2); border: 2px solid white;">
          P
        </div>
        <div style="width: 2px; height: 6px; background-color: #10B981;"></div>
      `;

      const pickupPopupHtml = `
        <div style="padding: 4px; font-family: system-ui, -apple-system, sans-serif; max-width: 220px;">
          <div style="color: #059669; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Pickup Location</div>
          <div style="font-size: 12px; font-weight: 600; color: #1E293B; margin-top: 2px; line-height: 1.3;">${pickup.address || "Pickup Point"}</div>
          <div style="font-size: 10px; color: #64748B; margin-top: 2px;">${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}</div>
          ${
            pickup.otp
              ? `<div style="margin-top: 6px; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace; font-weight: 700; display: inline-block;">OTP: ${pickup.otp}</div>`
              : ""
          }
        </div>
      `;

      new mapboxgl.Marker({ element: pickupEl, anchor: "bottom" })
        .setLngLat([pickup.lng, pickup.lat])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(pickupPopupHtml))
        .addTo(map);

      // ── 2. DROPOFF MARKERS (Red) ──
      const routePoints: [number, number][] = [[pickup.lng, pickup.lat]];

      validStops.forEach((stop, idx) => {
        bounds.extend([stop.lng, stop.lat]);
        routePoints.push([stop.lng, stop.lat]);

        const isFinal = idx === validStops.length - 1;
        const stopEl = document.createElement("div");
        stopEl.className = "flex flex-col items-center cursor-pointer";
        stopEl.innerHTML = `
          <div style="background-color: ${isFinal ? "#EF4444" : "#F59E0B"}; color: white; width: 28px; height: 28px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 2px solid white;">
            ${isFinal ? "D" : idx + 1}
          </div>
          <div style="width: 2px; height: 6px; background-color: ${isFinal ? "#EF4444" : "#F59E0B"};"></div>
        `;

        const stopPopupHtml = `
          <div style="padding: 4px; font-family: system-ui, -apple-system, sans-serif; max-width: 220px;">
            <div style="color: ${isFinal ? "#DC2626" : "#D97706"}; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">${isFinal ? "Dropoff Destination" : `Stop ${idx + 1}`}</div>
            <div style="font-size: 12px; font-weight: 600; color: #1E293B; margin-top: 2px; line-height: 1.3;">${stop.address || "Dropoff Point"}</div>
            <div style="font-size: 10px; color: #64748B; margin-top: 2px;">${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}</div>
            ${
              stop.receiverName
                ? `<div style="margin-top: 4px; font-size: 11px; color: #334155;">Receiver: <strong>${stop.receiverName}</strong> ${stop.receiverPhone ? `(${stop.receiverPhone})` : ""}</div>`
                : ""
            }
          </div>
        `;

        new mapboxgl.Marker({ element: stopEl, anchor: "bottom" })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(stopPopupHtml))
          .addTo(map);
      });

      // ── 3. DRIVER LIVE LOCATION MARKER (Blue Truck) ──
      if (
        driver &&
        typeof driver.lat === "number" &&
        typeof driver.lng === "number" &&
        !isNaN(driver.lat) &&
        !isNaN(driver.lng) &&
        (driver.lat !== 0 || driver.lng !== 0)
      ) {
        bounds.extend([driver.lng, driver.lat]);

        const driverEl = document.createElement("div");
        driverEl.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="background-color: #2563EB; color: white; width: 32px; height: 32px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); border: 2px solid white; z-index: 10;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                <path d="M15 18H9"/>
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                <circle cx="17" cy="18" r="2"/>
                <circle cx="7" cy="18" r="2"/>
              </svg>
            </div>
          </div>
        `;

        const driverPopupHtml = `
          <div style="padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="color: #2563EB; font-size: 10px; font-weight: 800; text-transform: uppercase;">Driver Live GPS</div>
            <div style="font-size: 13px; font-weight: 700; color: #1E293B;">${driver.name || "Assigned Driver"}</div>
            ${driver.phone ? `<div style="font-size: 11px; color: #64748B;">${driver.phone}</div>` : ""}
          </div>
        `;

        new mapboxgl.Marker({ element: driverEl })
          .setLngLat([driver.lng, driver.lat])
          .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(driverPopupHtml))
          .addTo(map);
      }

      // ── 4. ROUTE LINE (Pickup to Drops) ──
      if (routePoints.length >= 2) {
        map.addSource("route-line-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routePoints,
            },
          },
        });

        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: "route-line-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#2563EB",
            "line-width": 4,
            "line-dasharray": [2, 1.5],
            "line-opacity": 0.85,
          },
        });
      }

      // ── 5. ACTUAL LOCATION HISTORY GPS TRAIL (if available) ──
      if (locationHistory && locationHistory.length >= 2) {
        const historyCoords: [number, number][] = locationHistory
          .filter((h) => typeof h.latitude === "number" && typeof h.longitude === "number")
          .map((h) => [h.longitude, h.latitude]);

        if (historyCoords.length >= 2) {
          historyCoords.forEach((c) => bounds.extend(c));

          map.addSource("gps-trail-source", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: historyCoords,
              },
            },
          });

          map.addLayer({
            id: "gps-trail-layer",
            type: "line",
            source: "gps-trail-source",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#10B981",
              "line-width": 3,
              "line-opacity": 0.9,
            },
          });
        }
      }

      // Fit map bounds comfortably
      if (routePoints.length > 1) {
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 15,
          duration: 1000,
        });
      }
    });

    const resizeTimer = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 400);

    return () => {
      clearTimeout(resizeTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pickup.lat, pickup.lng, stops.length, driver?.lat, driver?.lng]);

  if (!validPickup) {
    return (
      <div className="relative h-64 overflow-hidden rounded-lg border bg-muted/20 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <MapPin className="h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-medium text-foreground">No GPS coordinates recorded</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Addresses are stored as text. Once coordinates are resolved or driver tracking begins, the live map renders here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-lg border bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Floating Info Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        {estimatedDistance != null && (
          <div className="flex items-center gap-1.5 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-md border text-xs font-semibold shadow-xs">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            <span>{Number(estimatedDistance).toLocaleString("en-IN")} km</span>
          </div>
        )}
        {estimatedDuration != null && (
          <div className="flex items-center gap-1.5 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-md border text-xs font-semibold shadow-xs">
            <span>⏱️ {estimatedDuration} mins</span>
          </div>
        )}
        {driver?.lat && driver?.lng && (
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 text-xs font-semibold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>Live Driver GPS</span>
          </div>
        )}
      </div>

      {/* Open in Google Maps Button */}
      {googleMapsUrl && (
        <div className="absolute bottom-3 right-3 z-10">
          <Button
            size="sm"
            variant="secondary"
            asChild
            className="h-8 gap-1.5 text-xs bg-background/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm hover:bg-background border font-medium"
          >
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <span>Open in Google Maps</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-background/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-md border text-[11px] text-muted-foreground flex items-center gap-3 shadow-xs">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Pickup
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Dropoff
        </span>
        {driver?.lat && driver?.lng && (
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" /> Driver
          </span>
        )}
      </div>
    </div>
  );
}
