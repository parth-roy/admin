import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from '@tanstack/react-router';
import apiClient from '@/lib/api/client';
import { Layers, MapPin } from 'lucide-react';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

interface ClusteredLeadsMapProps {
  type: 'driver' | 'gig';
  searchTerm?: string;
  state?: string;
  district?: string;
  city?: string;
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

/** Indian state centroids for smooth state-level auto-zoom */
const STATE_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'west bengal': { lat: 23.5, lng: 88.0, zoom: 7.2 },
  'maharashtra': { lat: 19.5, lng: 75.5, zoom: 6.8 },
  'karnataka': { lat: 15.0, lng: 76.0, zoom: 7.0 },
  'tamil nadu': { lat: 11.0, lng: 78.5, zoom: 7.2 },
  'telangana': { lat: 17.8, lng: 79.0, zoom: 7.2 },
  'andhra pradesh': { lat: 15.9, lng: 80.0, zoom: 7.0 },
  'delhi': { lat: 28.6139, lng: 77.2090, zoom: 11.0 },
  'gujarat': { lat: 22.5, lng: 71.5, zoom: 7.0 },
  'rajasthan': { lat: 26.8, lng: 73.5, zoom: 6.5 },
  'uttar pradesh': { lat: 27.0, lng: 80.5, zoom: 6.8 },
  'kerala': { lat: 10.5, lng: 76.5, zoom: 7.5 },
  'madhya pradesh': { lat: 23.5, lng: 77.5, zoom: 6.8 },
  'bihar': { lat: 25.6, lng: 85.5, zoom: 7.2 },
  'punjab': { lat: 31.0, lng: 75.5, zoom: 7.8 },
  'haryana': { lat: 29.0, lng: 76.5, zoom: 7.8 },
  'jharkhand': { lat: 23.6, lng: 85.5, zoom: 7.5 },
  'odisha': { lat: 20.5, lng: 84.5, zoom: 7.2 },
  'assam': { lat: 26.2, lng: 92.5, zoom: 7.2 },
  'uttarakhand': { lat: 30.1, lng: 79.2, zoom: 7.8 },
  'chhattisgarh': { lat: 21.3, lng: 81.8, zoom: 7.0 },
  'goa': { lat: 15.3, lng: 74.0, zoom: 10.0 },
};

/** 100+ Indian city and corridor coordinates for instant auto-zoom pinpointing */
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // West Bengal
  'barrackpore': { lat: 22.7600, lng: 88.3700 },
  'titagarh': { lat: 22.7400, lng: 88.3750 },
  'sodepur': { lat: 22.6980, lng: 88.3890 },
  'belghoria': { lat: 22.6620, lng: 88.3850 },
  'dum dum': { lat: 22.6420, lng: 88.4310 },
  'barasat': { lat: 22.7230, lng: 88.4800 },
  'naihati': { lat: 22.8900, lng: 88.4250 },
  'chinsurah': { lat: 22.9000, lng: 88.3900 },
  'hooghly': { lat: 22.9000, lng: 88.3900 },
  'serampore': { lat: 22.7500, lng: 88.3400 },
  'rishra': { lat: 22.7100, lng: 88.3500 },
  'dankuni': { lat: 22.6850, lng: 88.2950 },
  'dhulagarh': { lat: 22.5700, lng: 88.2500 },
  'howrah': { lat: 22.5958, lng: 88.2636 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'burrabazar': { lat: 22.5850, lng: 88.3550 },
  'salt lake': { lat: 22.5867, lng: 88.4178 },
  'new town': { lat: 22.5958, lng: 88.4795 },
  'sankrail': { lat: 22.5600, lng: 88.2400 },
  'uluberia': { lat: 22.4700, lng: 87.9800 },
  'bagnan': { lat: 22.4670, lng: 87.9670 },
  'haldia': { lat: 22.0667, lng: 88.0698 },
  'kharagpur': { lat: 22.3400, lng: 87.3200 },
  'durgapur': { lat: 23.5204, lng: 87.3119 },
  'asansol': { lat: 23.6889, lng: 86.9661 },
  'raniganj': { lat: 23.6210, lng: 87.1270 },
  'kalyani': { lat: 22.9760, lng: 88.4340 },
  'malda': { lat: 25.0085, lng: 88.1432 },
  'siliguri': { lat: 26.7271, lng: 88.3953 },

  // Maharashtra
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'andheri': { lat: 19.1197, lng: 72.8464 },
  'bandra': { lat: 19.0596, lng: 72.8295 },
  'borivali': { lat: 19.2300, lng: 72.8580 },
  'thane': { lat: 19.2183, lng: 72.9781 },
  'navi mumbai': { lat: 19.0330, lng: 73.0297 },
  'vashi': { lat: 19.0771, lng: 72.9986 },
  'panvel': { lat: 18.9894, lng: 73.1175 },
  'bhiwandi': { lat: 19.2967, lng: 73.0631 },
  'kalyan': { lat: 19.2403, lng: 73.1305 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'chakan': { lat: 18.7606, lng: 73.8587 },
  'bhosari': { lat: 18.6298, lng: 73.8443 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'aurangabad': { lat: 19.8762, lng: 75.3433 },
  'solapur': { lat: 17.6599, lng: 75.9064 },
  'kolhapur': { lat: 16.7050, lng: 74.2433 },

  // Karnataka
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'peenya': { lat: 13.0289, lng: 77.5174 },
  'whitefield': { lat: 12.9799, lng: 77.7480 },
  'electronic city': { lat: 12.8399, lng: 77.6770 },
  'hoskote': { lat: 13.0712, lng: 77.8007 },
  'nelamangala': { lat: 13.0984, lng: 77.3934 },
  'tumakuru': { lat: 13.3379, lng: 77.1173 },
  'mysuru': { lat: 12.2958, lng: 76.6394 },

  // Tamil Nadu
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'sriperumbudur': { lat: 12.9699, lng: 79.9400 },
  'oragadam': { lat: 12.8333, lng: 79.9333 },
  'ambattur': { lat: 13.1143, lng: 80.1548 },
  'hosur': { lat: 12.7409, lng: 77.8253 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
  'tiruppur': { lat: 11.1085, lng: 77.3411 },
  'madurai': { lat: 9.9252, lng: 78.1198 },

  // Telangana & Andhra Pradesh
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'jeedimetla': { lat: 17.5180, lng: 78.4380 },
  'kukatpally': { lat: 17.4947, lng: 78.3996 },
  'madhapur': { lat: 17.4483, lng: 78.3742 },
  'gachibowli': { lat: 17.4401, lng: 78.3489 },
  'shamshabad': { lat: 17.2403, lng: 78.4294 },
  'medchal': { lat: 17.6297, lng: 78.4814 },
  'patancheru': { lat: 17.5284, lng: 78.2660 },
  'secunderabad': { lat: 17.4399, lng: 78.4983 },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'vijayawada': { lat: 16.5062, lng: 80.6480 },
  'guntur': { lat: 16.3067, lng: 80.4365 },

  // Delhi NCR & North
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'greater noida': { lat: 28.4744, lng: 77.5040 },
  'ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'faridabad': { lat: 28.4089, lng: 77.3178 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'ludhiana': { lat: 30.9010, lng: 75.8573 },
  'amritsar': { lat: 31.6340, lng: 74.8723 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'agra': { lat: 27.1767, lng: 78.0081 },

  // Gujarat
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'vadodara': { lat: 22.3072, lng: 73.1812 },
  'rajkot': { lat: 22.3039, lng: 70.8022 },

  // Central & East
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'ranchi': { lat: 23.3441, lng: 85.3096 },
  'jamshedpur': { lat: 22.8046, lng: 86.2029 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'cuttack': { lat: 20.4625, lng: 85.8828 },
  'raipur': { lat: 21.2514, lng: 81.6296 },
  'guwahati': { lat: 26.1445, lng: 91.7362 },
};

function resolveCoords(str?: string): { lat: number; lng: number } | null {
  if (!str) return null;
  const q = str.toLowerCase().trim();
  if (CITY_COORDINATES[q]) return CITY_COORDINATES[q];
  for (const [k, v] of Object.entries(CITY_COORDINATES)) {
    if (q.includes(k) || k.includes(q)) return v;
  }
  return null;
}

/**
 * ClusteredLeadsMap — WebGL Cluster Map with full color Streets styling,
 * prominent place names, highway & district labels, viewport streaming,
 * and smart auto-zoom pinpointing on search / city selection.
 */
export default function ClusteredLeadsMap({
  type,
  searchTerm,
  state,
  district,
  city,
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
      if (searchTerm?.trim()) params.search = searchTerm.trim();
      if (state) params.state = state;
      if (district) params.district = district;
      if (city) params.city = city;
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
  }, [endpoint, searchTerm, state, district, city, vehicleType, jobType, status]);

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

  /**
   * Auto-Zoom & Pinpoint Engine
   * Smoothly navigates to the city, district, state, or search location whenever changed.
   */
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // 1. Direct city selection or search match for city
    const targetCity = city || resolveCoords(searchTerm) ? (city || searchTerm) : null;
    const cityCoords = resolveCoords(targetCity || undefined);

    if (cityCoords) {
      map.current.flyTo({
        center: [cityCoords.lng, cityCoords.lat],
        zoom: 12.5,
        essential: true,
        duration: 1200,
      });
      scheduleFetch();
      return;
    }

    // 2. District selection
    if (district) {
      const districtCoords = resolveCoords(district);
      if (districtCoords) {
        map.current.flyTo({
          center: [districtCoords.lng, districtCoords.lat],
          zoom: 11.5,
          essential: true,
          duration: 1200,
        });
        scheduleFetch();
        return;
      }
    }

    // 3. State selection
    if (state) {
      const stateKey = state.toLowerCase().trim();
      const stateMeta = STATE_COORDINATES[stateKey];
      if (stateMeta) {
        map.current.flyTo({
          center: [stateMeta.lng, stateMeta.lat],
          zoom: stateMeta.zoom,
          essential: true,
          duration: 1200,
        });
        scheduleFetch();
        return;
      }
    }

    // 4. If all filters cleared, zoom back to India overview
    if (!searchTerm && !city && !district && !state) {
      map.current.flyTo({
        center: [80.0, 22.0],
        zoom: 4.8,
        essential: true,
        duration: 1000,
      });
    }

    scheduleFetch();
  }, [searchTerm, city, district, state, vehicleType, jobType, status, scheduleFetch]);

  /** Style Switch Handler */
  const handleSwitchStyle = (url: string) => {
    setCurrentStyle(url);
    setShowStyleMenu(false);
    if (map.current) {
      map.current.setStyle(url);
    }
  };

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
