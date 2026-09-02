import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from '@tanstack/react-router';
import apiClient from '@/lib/api/client';
import { Layers, MapPin } from 'lucide-react';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface ClusteredLeadsMapProps {
  type: 'driver' | 'gig';
  vehicleType?: string;
  jobType?: string;
  status?: string;
}

const COLOR = {
  driver: '#059669',   // emerald-600
  gig: '#7c3aed',      // violet-600
  cluster: '#1e293b',  // slate-800
};

const MAP_STYLES = [
  { id: 'streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'outdoors', name: 'Terrain', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'light', name: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
];

/**
 * ClusteredLeadsMap — WebGL Cluster Map with full color Streets styling,
 * prominent place names, highway & district labels, and viewport streaming.
 */
export default function ClusteredLeadsMap({
  type,
  vehicleType,
  jobType,
  status,
}: ClusteredLeadsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentStyle, setCurrentStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const navigate = useNavigate();

  const endpoint = type === 'driver' ? '/form-driver-leads/map-pins' : '/form-gig-leads/map-pins';
  const primaryColor = COLOR[type];

  /** Fetch pins for the current viewport bounds and update the GeoJSON source */
  const fetchPinsForViewport = useCallback(async () => {
    if (!map.current) return;
    const source = map.current.getSource('leads') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    const bounds = map.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    try {
      const params: Record<string, string> = {
        swLat: sw.lat.toFixed(6),
        swLng: sw.lng.toFixed(6),
        neLat: ne.lat.toFixed(6),
        neLng: ne.lng.toFixed(6),
      };
      if (vehicleType && vehicleType !== 'ALL') params.vehicleType = vehicleType;
      if (jobType && jobType !== 'ALL') params.jobType = jobType;
      if (status && status !== 'ALL') params.status = status;

      const { data: res } = await apiClient.get(endpoint, { params });
      const pins: any[] = res?.data || [];

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: pins
          .filter((p: any) => p.givenLat && p.givenLng)
          .map((p: any) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.givenLng, p.givenLat] },
            properties: {
              id: p.id,
              name: p.name || (p.firstName ? `${p.firstName} ${p.lastName ?? ''}`.trim() : 'Unknown'),
              city: p.city || '',
              vehicleType: p.vehicleType || p.jobType || '',
              status: p.status || 'PENDING',
            },
          })),
      };

      source.setData(geojson);
    } catch {
      // Ignore viewport fetch errors gracefully
    }
  }, [endpoint, vehicleType, jobType, status]);

  /** Debounced trigger for map move/zoom end */
  const scheduleFetch = useCallback(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(fetchPinsForViewport, 300);
  }, [fetchPinsForViewport]);

  /** Add or recreate source and cluster layers on style load */
  const setupLayers = useCallback(() => {
    if (!map.current) return;

    if (map.current.getSource('leads')) {
      return;
    }

    map.current.addSource('leads', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // ── Layer 1: Cluster Circles ──
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'leads',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          primaryColor,      // 1-9: brand color
          10, '#f59e0b',     // 10-49: amber
          50, '#ef4444',     // 50+: red
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          20,    // < 10
          10, 26,  // 10-49
          50, 34,  // 50+
        ],
        'circle-opacity': 0.92,
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
      },
    });

    // ── Layer 2: Cluster Count Labels ──
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'leads',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': 13,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    // ── Layer 3: Individual Unclustered Pins ──
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'leads',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match', ['get', 'status'],
          'APPROVED', '#10b981',
          'CONVERTED', '#059669',
          'REJECTED', '#ef4444',
          'SUITABLE', '#3b82f6',
          primaryColor,
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.95,
      },
    });

    // ── Layer 4: Pulse ring on unclustered points ──
    map.current.addLayer({
      id: 'unclustered-pulse',
      type: 'circle',
      source: 'leads',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': primaryColor,
        'circle-radius': 14,
        'circle-opacity': 0.25,
      },
    }, 'unclustered-point');

    fetchPinsForViewport();
  }, [primaryColor, fetchPinsForViewport]);

  /** Init Mapbox Map once */
  useEffect(() => {
    if (map.current || !mapContainer.current || !TOKEN) return;

    mapboxgl.accessToken = TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: currentStyle,
      center: [80.0, 22.0],
      zoom: 4.8,
      minZoom: 3.5,
      maxZoom: 19,
      trackResize: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 120 }), 'bottom-left');

    map.current.on('load', () => {
      setupLayers();

      // Cluster click → zoom in
      map.current?.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (clusterId == null) return;
        (map.current.getSource('leads') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err || !map.current) return;
            map.current.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom: Math.min(zoom!, 17),
              duration: 400,
            });
          }
        );
      });

      // Individual pin click → popup (supports multiple leads at the exact same location)
      map.current?.on('click', 'unclustered-point', (e) => {
        if (!map.current || !e.features?.length) return;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        const allItems = e.features.map((f) => f.properties!);

        if (popup.current) popup.current.remove();

        const isMultiple = allItems.length > 1;
        const headerText = isMultiple
          ? `<div style="font-weight:700;font-size:12px;color:#0f172a;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">
              ${allItems.length} ${type === 'driver' ? 'Drivers' : 'Workers'} at this location
             </div>`
          : '';

        const itemsHtml = allItems.slice(0, 5).map((props) => `
          <div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #f1f5f9">
            <div style="font-weight:700;font-size:13px;color:#0f172a">${props.name}</div>
            <div style="font-size:11px;color:#64748b;margin:1px 0">${props.vehicleType?.replace(/_/g, ' ') || ''}</div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">${props.city || 'N/A'}</div>
            <button
              onclick="window.__navigateToLead('${props.id}','${type}')"
              style="background:${primaryColor};color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;width:100%"
            >View Lead Details</button>
          </div>
        `).join('');

        const moreNote = allItems.length > 5
          ? `<div style="font-size:10px;color:#94a3b8;text-align:center">+${allItems.length - 5} more</div>`
          : '';

        popup.current = new mapboxgl.Popup({ offset: 14, maxWidth: '260px', closeButton: true })
          .setLngLat(coords)
          .setHTML(`
            <div style="padding:8px 4px;font-family:system-ui,sans-serif;max-height:280px;overflow-y:auto">
              ${headerText}
              ${itemsHtml}
              ${moreNote}
            </div>
          `)
          .addTo(map.current);
      });

      // Cursor styles
      map.current?.on('mouseenter', 'clusters', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
      map.current?.on('mouseleave', 'clusters', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });
      map.current?.on('mouseenter', 'unclustered-point', () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; });
      map.current?.on('mouseleave', 'unclustered-point', () => { if (map.current) map.current.getCanvas().style.cursor = ''; });

      // Viewport movement triggers fetch
      map.current?.on('moveend', scheduleFetch);
      map.current?.on('zoomend', scheduleFetch);
    });

    // Re-bind layers when style reloads (e.g. style switcher)
    map.current.on('style.load', () => {
      setupLayers();
    });

    (window as any).__navigateToLead = (id: string, t: string) => {
      navigate({
        to: t === 'gig'
          ? '/platform/form-gig-onboard-leads/$id'
          : '/platform/form-driver-leads/$id',
        params: { id },
      });
    };

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      if (popup.current) { popup.current.remove(); popup.current = null; }
      if (map.current) { map.current.remove(); map.current = null; }
      delete (window as any).__navigateToLead;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Style Switch Handler */
  const handleSwitchStyle = (url: string) => {
    setCurrentStyle(url);
    setShowStyleMenu(false);
    if (map.current) {
      map.current.setStyle(url);
    }
  };

  /** Re-fetch when filters change */
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    scheduleFetch();
  }, [vehicleType, jobType, status, scheduleFetch]);

  return (
    <div className="relative h-[620px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Map Style Switcher (Top Left) */}
      <div className="absolute top-3 left-3 z-10">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Map Layers</span>
          </button>

          {showStyleMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-lg border border-slate-200 shadow-xl py-1 z-20">
              {MAP_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSwitchStyle(s.url)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                    currentStyle === s.url
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.name}
                  {currentStyle === s.url && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend (Bottom Right) */}
      <div className="absolute bottom-8 right-3 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 shadow-md px-3.5 py-2.5 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1 mb-1">
          <MapPin className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
            {type === 'driver' ? 'Driver Clusters' : 'Gig Worker Clusters'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: primaryColor }} />
          <span className="text-slate-700 font-medium">1–9 leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0 bg-amber-500" />
          <span className="text-slate-700 font-medium">10–49 leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0 bg-red-500" />
          <span className="text-slate-700 font-medium">50+ leads</span>
        </div>
        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">Click any cluster to zoom in</p>
      </div>
    </div>
  );
}
