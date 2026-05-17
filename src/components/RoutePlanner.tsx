import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRightLeft, Search, Loader2 } from 'lucide-react';

export interface RouteCoordinates {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
}

export interface Location {
  name: string;
  lat: number;
  lon: number;
  type: string;
}

interface AutocompleteInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (loc: Location) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

function AutocompleteInput({ placeholder, value, onChange, onSelect, onKeyDown }: AutocompleteInputProps) {
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!value || value.length < 2 || !showDropdown) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [value, showDropdown]);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (value.length >= 2) setShowDropdown(true);
        }}
        className="w-full bg-black/50 text-white placeholder-white/40 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 pr-10"
        onKeyDown={onKeyDown}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 size={16} className="animate-spin text-white/50" />
        </div>
      )}
      
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((loc, i) => (
            <li 
              key={i}
              onClick={() => {
                onChange(loc.name);
                onSelect(loc);
                setShowDropdown(false);
              }}
              className="px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white cursor-pointer border-b border-white/5 last:border-0 transition-colors"
            >
              {loc.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface RoutePlannerProps {
  onDrawRoute: (coords: RouteCoordinates) => void;
  onClearRoutes: () => void;
}

export function RoutePlanner({ onDrawRoute, onClearRoutes }: RoutePlannerProps) {
  const [startQuery, setStartQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [startLoc, setStartLoc] = useState<Location | null>(null);
  const [destLoc, setDestLoc] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrawRoute = () => {
    if (!startLoc || !destLoc) {
      setError("Please select both start and destination locations from the suggestions.");
      return;
    }

    // Optional: Add simple validation to ensure the text hasn't been changed since selection
    if (startLoc.name !== startQuery || destLoc.name !== destQuery) {
        setError("Please re-select locations from the suggestions.");
        return;
    }

    setError(null);

    onDrawRoute({
      lat1: startLoc.lat,
      lon1: startLoc.lon,
      lat2: destLoc.lat,
      lon2: destLoc.lon,
    });
  };

  const swapLocations = () => {
    setStartQuery(destQuery);
    setDestQuery(startQuery);
    const tempLoc = startLoc;
    setStartLoc(destLoc);
    setDestLoc(tempLoc);
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl text-white border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-visible flex flex-col pointer-events-auto">
      {/* Input Section */}
      <div className="p-5 relative">
        <div className="flex items-start gap-4 relative">
          {/* Visual Track */}
          <div className="flex flex-col items-center mt-3 gap-1 z-10 w-6">
            <div className="w-4 h-4 rounded-full border-[3px] border-cyan-400 bg-black flex-shrink-0" />
            <div className="w-0.5 h-8 bg-white/20" />
            <MapPin className="text-red-500 flex-shrink-0" size={20} fill="currentColor" />
          </div>

          <div className="flex flex-col gap-3 flex-1 relative z-20">
            <AutocompleteInput
              placeholder="Choose starting point..."
              value={startQuery}
              onChange={setStartQuery}
              onSelect={setStartLoc}
              onKeyDown={e => e.key === 'Enter' && handleDrawRoute()}
            />
            
            <AutocompleteInput
              placeholder="Choose destination..."
              value={destQuery}
              onChange={setDestQuery}
              onSelect={setDestLoc}
              onKeyDown={e => e.key === 'Enter' && handleDrawRoute()}
            />
          </div>
          
          {/* Swap Button */}
          <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-30">
            <button 
              onClick={swapLocations}
              className="bg-black border border-white/20 p-1.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:bg-white/10 text-white/70 transition-colors"
            >
              <ArrowRightLeft size={14} className="rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="px-5 pb-5 flex flex-col gap-3">
        {error && (
          <div className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 py-2 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStartQuery('');
              setDestQuery('');
              setStartLoc(null);
              setDestLoc(null);
              onClearRoutes();
            }}
            className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-xl transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleDrawRoute}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-gray-200 disabled:bg-white/50 disabled:text-gray-500 text-sm font-semibold rounded-xl transition-colors"
          >
            <Search size={16} />
            Find Route
          </button>
        </div>
      </div>
    </div>
  );
}
