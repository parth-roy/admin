import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicGFydGhyb3k0ODAiLCJhIjoi' + 'Y21wZ3ZjdTJzMDB6ZzJwc2R0MW0zajZwayJ9' + '.EeQV2fucMtGp-bM8tuf-dg';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Helper component to render a single standalone map
function SingleMap({ lat, lng, color, popupText }: { lat: number, lng: number, color: string, popupText: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 14,
      trackResize: true
    });

    new mapboxgl.Marker({ color })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${popupText}</strong>`))
      .addTo(map.current);
      
    setTimeout(() => {
      if (map.current) map.current.resize();
    }, 500);
  }, [lat, lng, color, popupText]);

  return (
    <div className="relative border rounded-lg overflow-hidden h-[300px]" style={{ minHeight: '300px' }}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function LeadLocationMap({ lead }: { lead: any }) {
  const hasGiven = lead.givenLat && lead.givenLng;
  const hasAuto = lead.autoLat && lead.autoLng;

  if (!hasGiven && !hasAuto) {
    return (
      <Card>
        <CardHeader className="bg-slate-50/50 pb-4">
          <CardTitle>Location Data</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-center text-slate-500">
          No location data provided for this lead.
        </CardContent>
      </Card>
    );
  }

  // If verified match, just show one map.
  // If mismatch, show two maps.
  const isMismatch = !lead.isLocationVerified && hasGiven && hasAuto;

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

        {isMismatch ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Map 1: Claimed */}
            <div className="space-y-3">
              <div className="border rounded-md p-3 bg-yellow-50/30 border-yellow-200">
                <div className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 text-yellow-500 mr-2" /> Claimed Location
                </div>
                <p className="text-xs text-slate-600 mb-1">{lead.givenAddress || 'Not provided'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{lead.givenLat}, {lead.givenLng}</p>
              </div>
              <SingleMap lat={lead.givenLat} lng={lead.givenLng} color="#eab308" popupText="Claimed Location" />
            </div>

            {/* Map 2: Actual */}
            <div className="space-y-3">
              <div className="border rounded-md p-3 bg-red-50/30 border-red-200">
                <div className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 text-red-500 mr-2" /> Actual Device Location
                </div>
                <p className="text-xs text-slate-600 mb-1">{lead.autoAddress || 'Permission Denied'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{lead.autoLat}, {lead.autoLng}</p>
              </div>
              <SingleMap lat={lead.autoLat} lng={lead.autoLng} color="#ef4444" popupText="Actual Physical Location" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border rounded-md p-3 bg-emerald-50/30 border-emerald-200">
              <div className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-emerald-500 mr-2" /> Verified Location
              </div>
              <p className="text-xs text-slate-600 mb-1">{lead.givenAddress || lead.autoAddress || 'Location recorded'}</p>
              <p className="text-[10px] text-slate-400 font-mono">{lead.givenLat || lead.autoLat}, {lead.givenLng || lead.autoLng}</p>
            </div>
            {hasGiven ? (
              <SingleMap lat={lead.givenLat} lng={lead.givenLng} color="#10b981" popupText="Verified Location" />
            ) : hasAuto ? (
              <SingleMap lat={lead.autoLat} lng={lead.autoLng} color="#10b981" popupText="Verified Location" />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
