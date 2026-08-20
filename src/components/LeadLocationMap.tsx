import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function LeadLocationMap({ lead }: { lead: any }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const hasGiven = lead.givenLat && lead.givenLng;
  const hasAuto = lead.autoLat && lead.autoLng;

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!hasGiven && !hasAuto) return;

    const centerLng = hasGiven ? lead.givenLng : lead.autoLng;
    const centerLat = hasGiven ? lead.givenLat : lead.autoLat;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 12
    });

    const bounds = new mapboxgl.LngLatBounds();

    if (hasGiven) {
      new mapboxgl.Marker({ color: '#eab308' })
        .setLngLat([lead.givenLng, lead.givenLat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Claimed Location</strong>'))
        .addTo(map.current);
      bounds.extend([lead.givenLng, lead.givenLat]);
    }

    if (hasAuto) {
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lead.autoLng, lead.autoLat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Actual Physical Location</strong>'))
        .addTo(map.current);
      bounds.extend([lead.autoLng, lead.autoLat]);
    }

    if (hasGiven && hasAuto && !lead.isLocationVerified) {
      map.current.on('load', () => {
        if (!map.current) return;
        map.current.addSource('route', {
          'type': 'geojson',
          'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [
                [lead.givenLng, lead.givenLat],
                [lead.autoLng, lead.autoLat]
              ]
            }
          }
        });
        map.current.addLayer({
          'id': 'route',
          'type': 'line',
          'source': 'route',
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          'paint': {
            'line-color': '#94a3b8',
            'line-width': 2,
            'line-dasharray': [2, 4]
          }
        });
      });
    }

    if (hasGiven && hasAuto) {
      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [lead, hasGiven, hasAuto]);

  if (!hasGiven && !hasAuto) {
    return (
      <Card>
        <CardHeader className="bg-slate-50/50 pb-4">
          <CardTitle>Location Data</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-center text-slate-500">
          No location data provided by the driver.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Location Verification</CardTitle>
        </div>
        {lead.isLocationVerified ? (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1 inline" /> Verified Match
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1 inline" /> Location Mismatch
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        {lead.locationDistance && !lead.isLocationVerified && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-md text-sm text-red-800 flex items-start">
            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
            <p>
              <strong>Warning:</strong> The driver's actual physical device location is 
              <strong> {(lead.locationDistance / 1000).toFixed(2)} km</strong> away from their claimed onboarding address.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="border rounded-md p-3">
            <div className="flex items-center text-sm font-semibold text-slate-700 mb-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" /> Claimed Location
            </div>
            <p className="text-xs text-slate-600 mb-1">{lead.givenAddress || 'Not provided'}</p>
            {hasGiven && <p className="text-[10px] text-slate-400 font-mono">{lead.givenLat}, {lead.givenLng}</p>}
          </div>
          
          <div className="border rounded-md p-3">
            <div className="flex items-center text-sm font-semibold text-slate-700 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2" /> Actual Device Location
            </div>
            <p className="text-xs text-slate-600 mb-1">{lead.autoAddress || 'Permission Denied'}</p>
            {hasAuto && <p className="text-[10px] text-slate-400 font-mono">{lead.autoLat}, {lead.autoLng}</p>}
          </div>
        </div>

        <div className="relative border rounded-lg overflow-hidden h-[300px]" style={{ minHeight: '300px' }}>
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ width: '100%', height: '100%' }} />
        </div>
      </CardContent>
    </Card>
  );
}
