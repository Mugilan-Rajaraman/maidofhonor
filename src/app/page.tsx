"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const ThreeJSGlobeWithDots = dynamic(() => import('@/components/ThreeJSGlobeWithDots'), {
  ssr: false,
});

import { RoutePlanner, RouteCoordinates } from '@/components/RoutePlanner';

export default function Home() {
  const [routes, setRoutes] = useState<RouteCoordinates[]>([]);
  const [arcHeight, setArcHeight] = useState(0.4);
  const [routeThickness, setRouteThickness] = useState(0.005);

  const handleDrawRoute = (coords: RouteCoordinates) => {
    setRoutes(prev => [...prev, coords]);
  };

  const handleClearRoutes = () => {
    setRoutes([]);
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-6xl text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          Active Global Network
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Monitoring persona reactions in real-time across all active zones.
        </p>

        {/* Route Controls */}
        <div className="flex flex-col items-center justify-center gap-4 max-w-fit mx-auto relative z-20">
          <RoutePlanner onDrawRoute={handleDrawRoute} onClearRoutes={handleClearRoutes} />
        </div>

        {/* Sliders */}
        <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-6 bg-white/5 p-4 rounded-xl border border-white/10 max-w-fit mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">Arc Height:</span>
            <input 
              type="range" 
              min="0.01" 
              max="1.5" 
              step="0.05"
              value={arcHeight}
              onChange={(e) => setArcHeight(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400"
            />
            <span className="text-white/70 text-sm w-8">{arcHeight.toFixed(2)}x</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">Thickness:</span>
            <input 
              type="range" 
              min="0.001" 
              max="0.03" 
              step="0.001"
              value={routeThickness}
              onChange={(e) => setRouteThickness(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400"
            />
            <span className="text-white/70 text-sm w-10">{routeThickness.toFixed(3)}</span>
          </div>
        </div>
        
        <div className="w-full relative mt-4 p-[1px] rounded-[1.5rem] bg-gradient-to-b from-white/10 to-transparent">
          <ThreeJSGlobeWithDots 
            routes={routes} 
            arcHeightMultiplier={arcHeight} 
            routeThickness={routeThickness} 
          />
        </div>
      </div>
    </main>
  );
}
