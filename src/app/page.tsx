"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const ThreeJSGlobeWithDots = dynamic(() => import('@/components/ThreeJSGlobeWithDots'), {
  ssr: false,
});

export default function Home() {
  const [inputs, setInputs] = useState({ lat1: '40.71', lon1: '-74.00', lat2: '51.50', lon2: '-0.12' });
  const [route, setRoute] = useState<{ lat1: number, lon1: number, lat2: number, lon2: number } | null>(null);
  const [arcHeight, setArcHeight] = useState(0.4);
  const [routeThickness, setRouteThickness] = useState(0.005);

  const handleDrawRoute = () => {
    setRoute({
      lat1: parseFloat(inputs.lat1),
      lon1: parseFloat(inputs.lon1),
      lat2: parseFloat(inputs.lat2),
      lon2: parseFloat(inputs.lon2)
    });
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
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 max-w-fit mx-auto">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Lat 1" 
              className="bg-black/50 text-white border border-white/20 rounded px-3 py-2 w-24 text-sm focus:outline-none focus:border-white/50"
              value={inputs.lat1}
              onChange={e => setInputs({...inputs, lat1: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Lon 1" 
              className="bg-black/50 text-white border border-white/20 rounded px-3 py-2 w-24 text-sm focus:outline-none focus:border-white/50"
              value={inputs.lon1}
              onChange={e => setInputs({...inputs, lon1: e.target.value})}
            />
          </div>
          <div className="text-white/50 text-sm font-medium">TO</div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Lat 2" 
              className="bg-black/50 text-white border border-white/20 rounded px-3 py-2 w-24 text-sm focus:outline-none focus:border-white/50"
              value={inputs.lat2}
              onChange={e => setInputs({...inputs, lat2: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Lon 2" 
              className="bg-black/50 text-white border border-white/20 rounded px-3 py-2 w-24 text-sm focus:outline-none focus:border-white/50"
              value={inputs.lon2}
              onChange={e => setInputs({...inputs, lon2: e.target.value})}
            />
          </div>
          <button 
            onClick={handleDrawRoute}
            className="bg-white text-black font-semibold px-6 py-2 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            Draw Route
          </button>
        </div>

        {/* Sliders */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 bg-white/5 p-4 rounded-xl border border-white/10 max-w-fit mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">Arc Height:</span>
            <input 
              type="range" 
              min="0.01" 
              max="1.5" 
              step="0.05"
              value={arcHeight}
              onChange={(e) => setArcHeight(parseFloat(e.target.value))}
              className="w-32 accent-cyan-400"
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
              className="w-32 accent-cyan-400"
            />
            <span className="text-white/70 text-sm w-8">{routeThickness.toFixed(3)}</span>
          </div>
        </div>
        
        <div className="w-full relative mt-4 p-[1px] rounded-[1.5rem] bg-gradient-to-b from-white/10 to-transparent">
          <ThreeJSGlobeWithDots route={route} arcHeightMultiplier={arcHeight} routeThickness={routeThickness} />
        </div>
      </div>
    </main>
  );
}
