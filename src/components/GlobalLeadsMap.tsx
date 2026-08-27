import React, { useEffect, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from '@tanstack/react-router';
import { MapPin, Navigation } from 'lucide-react';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoicGFydGhyb3k0ODAiLCJhIjoi' +
  'Y21wZ3ZjdTJzMDB6ZzJwc2R0MW0zajZwayJ9' +
  '.EeQV2fucMtGp-bM8tuf-dg';
mapboxgl.accessToken = MAPBOX_TOKEN;

// India bounding box: SW [67.0, 6.0] → NE [98.5, 37.5]
const INDIA_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [67.0, 6.0],
  [98.5, 37.5],
];

/** Haversine distance in km between two lat/lng points */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Lead {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  area?: string;
  givenDistrict?: string;
  givenState?: string;
  state?: string;
  vehicleType?: string;
  jobType?: string;
  status?: string;
  givenLat?: number | null;
  givenLng?: number | null;
}

interface GlobalLeadsMapProps {
  /** Already-filtered leads from the parent (state + city + district + vehicle/job + status). */
  leads: Lead[];
  /** Search term for proximity search. When non-empty the map adds a nearby-leads tier. */
  searchTerm: string;
  /** Radius in km for proximity search */
  nearbyRadiusKm?: number;
  type?: 'driver' | 'gig';
}

export default function GlobalLeadsMap({
  leads,
  searchTerm,
  nearbyRadiusKm = 75,
  type = 'driver',
}: GlobalLeadsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const navigate = useNavigate();

  /** Split leads into primary (direct match) and nearby (proximity) */
  const { primaryLeads, nearbyLeads, centroid } = useMemo(() => {
    const withCoords = leads.filter((l) => l.givenLat && l.givenLng);

    if (!searchTerm.trim()) {
      return { primaryLeads: withCoords, nearbyLeads: [], centroid: null };
    }

    const q = searchTerm.toLowerCase().trim();

    const primary = withCoords.filter((l) => {
      const fields = [
        l.name,
        l.firstName,
        l.lastName,
        l.city,
        l.area,
        l.givenDistrict,
        l.givenState,
        l.state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fields.includes(q);
    });

    if (primary.length === 0) {
      // No primary matches: show all leads with coords (already filtered by dropdowns)
      return { primaryLeads: withCoords, nearbyLeads: [], centroid: null };
    }

    // Compute centroid of primary matches
    const avgLat =
      primary.reduce((s, l) => s + (l.givenLat ?? 0), 0) / primary.length;
    const avgLng =
      primary.reduce((s, l) => s + (l.givenLng ?? 0), 0) / primary.length;

    const primaryIds = new Set(primary.map((l) => l.id));

    const nearby = withCoords
      .filter((l) => !primaryIds.has(l.id))
      .map((l) => ({
        ...l,
        _dist: haversineKm(avgLat, avgLng, l.givenLat!, l.givenLng!),
      }))
      .filter((l) => l._dist <= nearbyRadiusKm)
      .sort((a, b) => a._dist - b._dist);

    return {
      primaryLeads: primary,
      nearbyLeads: nearby as (Lead & { _dist: number })[],
      centroid: { lat: avgLat, lng: avgLng },
    };
  }, [leads, searchTerm, nearbyRadiusKm]);

  /** Init map once */
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [82.0, 22.5], // center of India
      zoom: 4.2,
      minZoom: 3.8,
      maxZoom: 18,
      maxBounds: INDIA_BOUNDS,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  /** Re-render markers whenever filtered leads change */
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const all = [...primaryLeads, ...nearbyLeads];
    if (all.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    const renderMarker = (
      lead: Lead & { _dist?: number },
      isPrimary: boolean
    ) => {
      const el = document.createElement('div');

      if (isPrimary) {
        el.className = [
          'w-7 h-7 rounded-full border-2 border-white shadow-lg',
          'flex items-center justify-center cursor-pointer',
          'transform transition-transform hover:scale-125',
          type === 'gig'
            ? 'bg-violet-500 hover:bg-violet-600'
            : 'bg-emerald-500 hover:bg-emerald-600',
        ].join(' ');
        el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      } else {
        // Nearby lead — amber with dashed ring
        el.className = [
          'w-6 h-6 rounded-full border-2 border-dashed shadow-md',
          'flex items-center justify-center cursor-pointer',
          'transform transition-transform hover:scale-125',
          'bg-amber-400 border-amber-600 hover:bg-amber-500',
        ].join(' ');
        el.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      }

      const displayName =
        lead.name ||
        (lead.firstName ? `${lead.firstName} ${lead.lastName ?? ''}`.trim() : 'Unknown');
      const displayRole =
        type === 'gig'
          ? lead.jobType?.replace(/-/g, ' ') ?? 'Worker'
          : lead.vehicleType?.replace(/_/g, ' ') ?? 'Driver';
      const locLine = [lead.area || lead.city, lead.givenDistrict, lead.givenState || lead.state]
        .filter(Boolean)
        .join(', ');
      const distNote =
        !isPrimary && (lead as any)._dist
          ? `<p class="text-[10px] mt-0.5 text-amber-600 font-medium">~${Math.round((lead as any)._dist)} km away</p>`
          : '';
      const tierBadge = isPrimary
        ? `<span class="inline-block text-[9px] font-semibold px-1 rounded ${type === 'gig' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}">Match</span>`
        : `<span class="inline-block text-[9px] font-semibold px-1 rounded bg-amber-100 text-amber-700">Nearby</span>`;

      const popup = new mapboxgl.Popup({
        offset: 28,
        closeButton: false,
        closeOnClick: false,
        maxWidth: '220px',
      }).setHTML(`
        <div class="p-2 space-y-1">
          <div class="flex items-center justify-between gap-2">
            <p class="font-bold text-sm text-slate-800 capitalize">${displayName}</p>
            ${tierBadge}
          </div>
          <p class="text-xs text-slate-500 capitalize">${displayRole}</p>
          <p class="text-[10px] text-slate-400">${locLine}</p>
          ${distNote}
          <p class="text-[9px] text-slate-300 mt-1">Click to view details</p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lead.givenLng!, lead.givenLat!])
        .addTo(map.current!);

      marker.setPopup(popup);
      el.addEventListener('mouseenter', () => popup.addTo(map.current!));
      el.addEventListener('mouseleave', () => popup.remove());
      el.addEventListener('click', () => {
        const route =
          type === 'gig'
            ? '/platform/form-gig-onboard-leads/$id'
            : '/platform/form-driver-leads/$id';
        navigate({ to: route, params: { id: lead.id } });
      });

      markersRef.current[lead.id] = marker;
      bounds.extend([lead.givenLng!, lead.givenLat!]);
    };

    primaryLeads.forEach((l) => renderMarker(l, true));
    nearbyLeads.forEach((l) => renderMarker(l as Lead & { _dist: number }, false));

    // Fit map to all visible leads
    if (all.length === 1) {
      map.current.flyTo({
        center: [all[0].givenLng!, all[0].givenLat!],
        zoom: 13,
        duration: 1000,
      });
    } else {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 1000 });
    }
  }, [primaryLeads, nearbyLeads, navigate, type]);

  const hasNearby = nearbyLeads.length > 0;

  return (
    <div className="space-y-3">
      {/* Nearby Leads Panel */}
      {hasNearby && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              {nearbyLeads.length} nearby {type === 'gig' ? 'worker' : 'driver'}
              {nearbyLeads.length !== 1 ? 's' : ''} found within {nearbyRadiusKm} km
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(nearbyLeads as (Lead & { _dist: number })[]).slice(0, 12).map((l) => {
              const displayName =
                l.name ||
                (l.firstName ? `${l.firstName} ${l.lastName ?? ''}`.trim() : 'Unknown');
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs cursor-pointer hover:bg-amber-50 transition-colors"
                  onClick={() => {
                    const route =
                      type === 'gig'
                        ? '/platform/form-gig-onboard-leads/$id'
                        : '/platform/form-driver-leads/$id';
                    navigate({ to: route, params: { id: l.id } });
                  }}
                >
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="font-medium text-slate-700">{displayName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-amber-700">{l.city}</span>
                  <span className="text-slate-400 text-[10px]">~{Math.round(l._dist)}km</span>
                </div>
              );
            })}
            {nearbyLeads.length > 12 && (
              <span className="text-xs text-amber-600 self-center">
                +{nearbyLeads.length - 12} more on map
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className={`w-3 h-3 rounded-full ${type === 'gig' ? 'bg-violet-500' : 'bg-emerald-500'}`} />
          <span>
            {primaryLeads.length} direct match{primaryLeads.length !== 1 ? 'es' : ''}
          </span>
        </div>
        {hasNearby && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-full bg-amber-400 border border-dashed border-amber-600" />
            <span>{nearbyLeads.length} nearby</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative h-[580px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <div
          ref={mapContainer}
          style={{ width: '100%', height: '100%' }}
        />
        {primaryLeads.length === 0 && nearbyLeads.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No leads match current filters</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
