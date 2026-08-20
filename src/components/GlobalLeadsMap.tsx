import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function GlobalLeadsMap({ leads }: { leads: any[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const navigate = useNavigate();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');

  // Extract unique states and cities
  const uniqueStates = Array.from(new Set(leads.map(l => l.givenState || l.state).filter(Boolean)));
  const uniqueCities = Array.from(new Set(leads.map(l => l.givenDistrict || l.city).filter(Boolean)));

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const s = lead.givenState || lead.state;
    const c = lead.givenDistrict || lead.city;
    const n = lead.name || '';
    
    if (stateFilter !== 'ALL' && s !== stateFilter) return false;
    if (cityFilter !== 'ALL' && c !== cityFilter) return false;
    if (searchTerm && !n.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Must have coordinates
    return lead.givenLat && lead.givenLng;
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [78.9629, 20.5937], // Center of India
        zoom: 4
      });
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (filteredLeads.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    filteredLeads.forEach(lead => {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transform transition-transform hover:scale-110';
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lead.givenLng, lead.givenLat])
        .addTo(map.current!);

      // Click to view details
      el.addEventListener('click', () => {
        navigate({ to: '/platform/form-driver-leads/$id', params: { id: lead.id } });
      });

      // Hover popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
        .setHTML(`
          <div class="p-2">
            <p class="font-bold text-sm text-slate-800">${lead.name}</p>
            <p class="text-xs text-slate-500">${lead.vehicleType.replace(/_/g, ' ')}</p>
            <p class="text-[10px] mt-1 text-slate-400">${lead.givenDistrict || lead.city}, ${lead.givenState || lead.state}</p>
          </div>
        `);
        
      marker.setPopup(popup);

      el.addEventListener('mouseenter', () => popup.addTo(map.current!));
      el.addEventListener('mouseleave', () => popup.remove());

      markersRef.current[lead.id] = marker;
      bounds.extend([lead.givenLng, lead.givenLat]);
    });

    if (filteredLeads.length > 0) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }

  }, [filteredLeads, navigate]);

  return (
    <div className="relative h-[600px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
      {/* Floating Filter Bar */}
      <div className="absolute top-4 left-4 right-14 z-10">
        <Card className="p-3 bg-white/95 backdrop-blur shadow-lg border-slate-200/60">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search driver name..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All States</SelectItem>
                {uniqueStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Cities</SelectItem>
                {uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="flex-1 w-full h-full" />
    </div>
  );
}
