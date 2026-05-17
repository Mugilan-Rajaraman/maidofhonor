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
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0a] font-[family-name:var(--font-geist-sans)] text-white">
      {/* 3D Map Background */}
      <div className="absolute inset-0 z-0">
        <ThreeJSGlobeWithDots 
          routes={routes} 
          arcHeightMultiplier={arcHeight} 
          routeThickness={routeThickness} 
        />
      </div>

      {/* Foreground UI Layer */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
        
        {/* Top Header & Route Planner Area */}
        <div className="flex justify-between items-start">
          {/* Route Planner */}
          <div className="pointer-events-auto">
            <RoutePlanner onDrawRoute={handleDrawRoute} onClearRoutes={handleClearRoutes} />
          </div>

          {/* Title Area */}
          <div className="text-right pointer-events-auto bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <h1 className="text-3xl font-bold tracking-tight">Active Global Network</h1>
            <p className="text-white/50 text-sm mt-1">Real-time geospatial route monitoring</p>
          </div>
        </div>

        {/* Bottom Area (Sliders) */}
        <div className="flex justify-end pointer-events-auto">
          <div className="flex items-center gap-6 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-xs uppercase tracking-wider font-semibold">Arc Height</span>
              <input 
                type="range" 
                min="0.01" 
                max="1.5" 
                step="0.05"
                value={arcHeight}
                onChange={(e) => setArcHeight(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400"
              />
              <span className="text-cyan-400 text-xs font-mono w-8">{arcHeight.toFixed(2)}x</span>
            </div>

            <div className="w-px h-6 bg-white/10" />

            <div className="flex items-center gap-3">
              <span className="text-white/70 text-xs uppercase tracking-wider font-semibold">Thickness</span>
              <input 
                type="range" 
                min="0.001" 
                max="0.03" 
                step="0.001"
                value={routeThickness}
                onChange={(e) => setRouteThickness(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400"
              />
              <span className="text-cyan-400 text-xs font-mono w-10">{routeThickness.toFixed(3)}</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
