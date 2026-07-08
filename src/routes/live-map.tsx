import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { MapPin, Truck, Loader2, RefreshCw } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { PageHeader } from "@/components/admin/AdminTopbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useDrivers } from "@/hooks/useDrivers";
import type { DriverListItem } from "@/lib/api/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/live-map")({
  head: () => ({ meta: [{ title: "Live Map — Parther Admin" }] }),
  component: LiveMapPage,
});

const CITIES = [
  { name: "All Cities", lat: 20.5937, lng: 78.9629, zoom: 4 },
  { name: "Delhi", lat: 28.6139, lng: 77.2090, zoom: 10 },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, zoom: 10 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, zoom: 10 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, zoom: 10 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, zoom: 10 },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, zoom: 10 },
];

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

function LiveMapPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string>("All Cities");
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});

  const { data, isLoading, isFetching, refetch } = useDrivers({
    status: "AVAILABLE", limit: 100, page: 1,
  });

  const drivers = data?.data ?? [];
  
  const selectedCity = CITIES.find(c => c.name === selectedCityName) || CITIES[0];
  
  const filteredDrivers = drivers.filter((d: any) => {
    if (selectedCityName === "All Cities") return true;
    if (!d.currentLat || !d.currentLng) return false;
    const dist = getDistanceFromLatLonInKm(
      selectedCity.lat, 
      selectedCity.lng, 
      Number(d.currentLat), 
      Number(d.currentLng)
    );
    return dist <= 100; // within 100km
  });

  const activeCount = filteredDrivers.length;

  useEffect(() => {
    if (map.current) return; 
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [selectedCity.lng, selectedCity.lat],
      zoom: selectedCity.zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    map.current.flyTo({
      center: [selectedCity.lng, selectedCity.lat],
      zoom: selectedCity.zoom,
      essential: true
    });
    setSelected(null); // Clear selection on city change
  }, [selectedCity]);

  useEffect(() => {
    if (!map.current) return;

    const currentDriverIds = new Set(filteredDrivers.map((d: any) => d.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentDriverIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    filteredDrivers.forEach((d: any) => {
      if (!d.currentLat || !d.currentLng) return;
      
      const lng = Number(d.currentLng);
      const lat = Number(d.currentLat);

      let marker = markersRef.current[d.id];

      if (marker) {
        marker.setLngLat([lng, lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform';
        el.style.backgroundColor = d.status === 'AVAILABLE' ? '#10b981' : '#f59e0b';
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelected(d.id);
        });

        marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current!);
        markersRef.current[d.id] = marker;
      }
      
      const el = marker.getElement();
      if (selected === d.id) {
        el.style.transform = 'scale(1.5)';
        el.style.zIndex = '10';
        map.current?.flyTo({ center: [lng, lat], zoom: 14 });
      } else {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      }
    });
  }, [filteredDrivers, selected]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <PageHeader
        title="Live Map"
        description="Real-time driver location tracking."
        actions={
          <div className="flex items-center gap-3">
            <Select value={selectedCityName} onValueChange={setSelectedCityName}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => (
                  <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFetching && !isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh
            </Button>
          </div>
        }
      />

      <div className="grid flex-1 grid-cols-[320px_1fr] overflow-hidden">
        {/* Driver list */}
        <div className="flex flex-col border-r bg-card h-full">
          <div className="border-b p-3 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isLoading ? "Loading..." : `${activeCount} drivers in ${selectedCityName}`}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
              </div>
            ) : filteredDrivers.length ? (
              filteredDrivers.map((d: DriverListItem) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d.id === selected ? null : d.id)}
                  className={`w-full border-b p-3 text-left transition-colors hover:bg-muted/40 ${selected === d.id ? "bg-muted/60" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{d.user?.name ?? "Driver"}</p>
                        <p className="text-xs text-muted-foreground">{d.user?.phone}</p>
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  {d.vehicle && (
                    <p className="mt-1.5 pl-10 text-xs text-muted-foreground">
                      {d.vehicle.registrationNo} · {d.vehicle.type?.replace(/_/g, " ")}
                    </p>
                  )}
                  {((d as any).currentLat && (d as any).currentLng) && (
                    <p className="pl-10 mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {Number((d as any).currentLat).toFixed(4)}, {Number((d as any).currentLng).toFixed(4)}
                      {(d as any).lastLocationAt && (
                        <span className="ml-1 opacity-70">
                          ({new Date((d as any).lastLocationAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="py-16 text-center text-muted-foreground text-sm">
                No drivers in this region
              </div>
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="relative h-full w-full bg-muted/20">
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

          {/* Legend */}
          <div className="absolute bottom-6 left-4 rounded-lg border bg-card/90 p-3 shadow-sm backdrop-blur space-y-1.5 text-xs z-10">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-success" /><span>Available driver</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-warning" /><span>On trip</span></div>
          </div>

          {/* Selected driver info */}
          {selected && filteredDrivers.find((d: any) => d.id === selected) && (() => {
            const d = filteredDrivers.find((d: any) => d.id === selected) as any;
            return (
              <Card className="absolute top-4 right-4 w-64 shadow-lg z-10 animate-in fade-in zoom-in-95 duration-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{d.user?.name ?? "Unknown Driver"}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{d.user?.phone}</p>
                  {d.vehicle && <p className="text-xs text-muted-foreground border-t pt-2 mt-2">{d.vehicle.registrationNo} · {d.vehicle.type}</p>}
                  <p className="text-xs text-muted-foreground">⭐ {Number(d.rating ?? 0).toFixed(1)} · {d.totalTrips ?? 0} trips</p>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
