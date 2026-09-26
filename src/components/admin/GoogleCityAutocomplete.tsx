import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: any;
    __googleMapsLoadingPromise?: Promise<any>;
  }
}

const GOOGLE_MAPS_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_KEY ||
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyCuSqK7NVexVBKrJwq11ovC0axS2_UpG1M";

function getGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window not defined"));
  }

  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve(window.google.maps);
  }

  if (!window.__googleMapsLoadingPromise) {
    window.__googleMapsLoadingPromise = new Promise((resolve, reject) => {
      // Check if script already exists in document
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      ) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.google?.maps?.places) {
            resolve(window.google.maps);
          } else {
            reject(new Error("Google Maps places library failed to load"));
          }
        });
        existingScript.addEventListener("error", (e) => reject(e));
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps?.places) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps places library failed to load"));
        }
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  return window.__googleMapsLoadingPromise;
}

export interface CitySelectionDetails {
  city: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
}

export interface GoogleCityAutocompleteProps {
  id?: string;
  value: string;
  onChange: (city: string) => void;
  onCitySelect?: (details: CitySelectionDetails) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

interface PredictionItem {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export function GoogleCityAutocomplete({
  id = "city-autocomplete",
  value,
  onChange,
  onCitySelect,
  placeholder = "e.g. Kolkata, Raipur, Mumbai, Jaipur",
  required = false,
  disabled = false,
  className,
}: GoogleCityAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTokenRef = useRef<any>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    try {
      const maps = await getGoogleMaps();
      const service = new maps.places.AutocompleteService();

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new maps.places.AutocompleteSessionToken();
      }

      // First try with (cities) type filter restricted to India
      service.getPlacePredictions(
        {
          input: text.trim(),
          sessionToken: sessionTokenRef.current,
          types: ["(cities)"],
          componentRestrictions: { country: "in" },
        },
        (results: any[], status: string) => {
          if (status === maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            setPredictions(
              results.map((p: any) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting?.main_text || p.description,
                secondaryText: p.structured_formatting?.secondary_text || "",
              }))
            );
            setLoading(false);
          } else {
            // Fallback: If no strict cities found, search without strict types so any Indian hub/town appears
            service.getPlacePredictions(
              {
                input: text.trim(),
                sessionToken: sessionTokenRef.current,
                componentRestrictions: { country: "in" },
              },
              (fallbackResults: any[], fallbackStatus: string) => {
                if (
                  fallbackStatus === maps.places.PlacesServiceStatus.OK &&
                  fallbackResults &&
                  fallbackResults.length > 0
                ) {
                  setPredictions(
                    fallbackResults.map((p: any) => ({
                      placeId: p.place_id,
                      description: p.description,
                      mainText: p.structured_formatting?.main_text || p.description,
                      secondaryText: p.structured_formatting?.secondary_text || "",
                    }))
                  );
                } else {
                  setPredictions([]);
                }
                setLoading(false);
              }
            );
          }
        }
      );
    } catch (err) {
      console.warn("Google Maps Places Autocomplete error:", err);
      setPredictions([]);
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setHighlightedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!val.trim()) {
      setPredictions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    debounceRef.current = setTimeout(() => {
      fetchPredictions(val);
    }, 280);
  };

  const handleSelectPrediction = async (prediction: PredictionItem) => {
    const fallbackCity = prediction.mainText || prediction.description.split(",")[0].trim();
    setQuery(fallbackCity);
    onChange(fallbackCity);
    setIsOpen(false);
    setPredictions([]);

    try {
      const maps = await getGoogleMaps();
      const placesService = new maps.places.PlacesService(document.createElement("div"));

      placesService.getDetails(
        {
          placeId: prediction.placeId,
          fields: ["name", "address_components", "formatted_address", "geometry"],
          sessionToken: sessionTokenRef.current,
        },
        (place: any, status: string) => {
          // Reset session token on selection completion
          sessionTokenRef.current = null;

          if (status === maps.places.PlacesServiceStatus.OK && place) {
            let extractedCity = "";
            let extractedState = "";
            let extractedCountry = "";

            if (Array.isArray(place.address_components)) {
              for (const comp of place.address_components) {
                const types = comp.types || [];
                if (types.includes("locality")) {
                  extractedCity = comp.long_name;
                } else if (
                  !extractedCity &&
                  (types.includes("administrative_area_level_2") ||
                    types.includes("administrative_area_level_3") ||
                    types.includes("postal_town"))
                ) {
                  extractedCity = comp.long_name;
                }

                if (types.includes("administrative_area_level_1")) {
                  extractedState = comp.long_name;
                }

                if (types.includes("country")) {
                  extractedCountry = comp.long_name;
                }
              }
            }

            const finalCity = extractedCity || fallbackCity;
            setQuery(finalCity);
            onChange(finalCity);

            if (onCitySelect) {
              onCitySelect({
                city: finalCity,
                state: extractedState,
                country: extractedCountry,
                formattedAddress: place.formatted_address,
                lat: place.geometry?.location?.lat?.(),
                lng: place.geometry?.location?.lng?.(),
              });
            }
          } else {
            // Use fallback if details call fails
            if (onCitySelect) {
              onCitySelect({ city: fallbackCity });
            }
          }
        }
      );
    } catch (err) {
      console.warn("Could not retrieve place details:", err);
      if (onCitySelect) {
        onCitySelect({ city: fallbackCity });
      }
    }
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setPredictions([]);
    setIsOpen(false);
    sessionTokenRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
        e.preventDefault();
        handleSelectPrediction(predictions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500 pointer-events-none" />
        <Input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="pl-9 pr-8"
        />

        {loading ? (
          <div className="absolute right-2.5 top-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Clear city"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-xl">
          <div className="p-1">
            <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Google Places City Results</span>
              <span className="text-[9px] lowercase font-normal opacity-70">Pan-India</span>
            </div>

            {predictions.map((p, index) => {
              const isHighlighted = index === highlightedIndex;
              const isSelected = query.toLowerCase() === p.mainText.toLowerCase();

              return (
                <button
                  key={p.placeId || index}
                  type="button"
                  onClick={() => handleSelectPrediction(p)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "flex items-start gap-2.5 w-full rounded-md px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                    isHighlighted ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                  )}
                >
                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="truncate">{p.mainText}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    {p.secondaryText && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {p.secondaryText}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/50 px-3 py-1 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Powered by Google Maps</span>
            <span className="font-mono text-[9px]">Real-time Autocomplete</span>
          </div>
        </div>
      )}
    </div>
  );
}
