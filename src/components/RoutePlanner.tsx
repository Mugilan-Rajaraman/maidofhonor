import React, { useState } from 'react';
import { MapPin, ArrowRightLeft, Search, Loader2 } from 'lucide-react';

export interface RouteCoordinates {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
}

interface RoutePlannerProps {
  onDrawRoute: (coords: RouteCoordinates) => void;
  onClearRoutes: () => void;
}

export function RoutePlanner({ onDrawRoute, onClearRoutes }: RoutePlannerProps) {
  const [startAddress, setStartAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = async (address: string) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    throw new Error(`Could not find location: ${address}`);
  };

  const handleDrawRoute = async () => {
    if (!startAddress.trim() || !destAddress.trim()) {
      setError("Please enter both start and destination locations.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [startCoords, destCoords] = await Promise.all([
        geocode(startAddress),
        geocode(destAddress)
      ]);

      onDrawRoute({
        lat1: startCoords.lat,
        lon1: startCoords.lon,
        lat2: destCoords.lat,
        lon2: destCoords.lon,
      });
    } catch (err: any) {
      setError(err.message || "Failed to geocode one or both addresses.");
    } finally {
      setLoading(false);
    }
  };

  const swapLocations = () => {
    setStartAddress(destAddress);
    setDestAddress(startAddress);
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl text-white border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
      {/* Input Section */}
      <div className="p-5 relative">
        <div className="flex items-start gap-4 relative">
          {/* Visual Track */}
          <div className="flex flex-col items-center mt-3 gap-1 z-10 w-6">
            <div className="w-4 h-4 rounded-full border-[3px] border-cyan-400 bg-black flex-shrink-0" />
            <div className="w-0.5 h-8 bg-white/20" />
            <MapPin className="text-red-500 flex-shrink-0" size={20} fill="currentColor" />
          </div>

          <div className="flex flex-col gap-3 flex-1 relative z-10">
            <div className="relative">
              <input
                type="text"
                placeholder="Choose starting point..."
                value={startAddress}
                onChange={e => setStartAddress(e.target.value)}
                className="w-full bg-black/50 text-white placeholder-white/40 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 pr-10"
                onKeyDown={e => e.key === 'Enter' && handleDrawRoute()}
              />
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Choose destination..."
                value={destAddress}
                onChange={e => setDestAddress(e.target.value)}
                className="w-full bg-black/50 text-white placeholder-white/40 border border-white/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50 pr-10"
                onKeyDown={e => e.key === 'Enter' && handleDrawRoute()}
              />
            </div>
          </div>
          
          {/* Swap Button */}
          <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-20">
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
            onClick={onClearRoutes}
            className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 text-red-400 text-sm font-semibold rounded-xl transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleDrawRoute}
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-gray-200 disabled:bg-white/50 disabled:text-gray-500 text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-black" />
            ) : (
              <>
                <Search size={16} />
                Find Route
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
