import React from 'react';
import { MapToolId } from '@/hooks/useMapTools';
import { MousePointer2, MapPin, Lasso, Route, MessageSquare, Eraser } from 'lucide-react';

interface MapToolbarProps {
  activeTool: MapToolId;
  onSelectTool: (tool: MapToolId) => void;
}

const tools: { id: MapToolId; label: string; icon: React.ReactNode }[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2 size={20} /> },
  { id: 'waypoint', label: 'Waypoint', icon: <MapPin size={20} /> },
  { id: 'lasso', label: 'Lasso', icon: <Lasso size={20} /> },
  { id: 'path', label: 'Path', icon: <Route size={20} /> },
  { id: 'annotation', label: 'Note', icon: <MessageSquare size={20} /> },
  { id: 'eraser', label: 'Eraser', icon: <Eraser size={20} /> }
];

export function MapToolbar({ activeTool, onSelectTool }: MapToolbarProps) {
  return (
    <div className="absolute top-8 left-8 flex flex-col gap-2 z-10">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col gap-2 shadow-2xl">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`
              group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ease-out
              ${activeTool === tool.id 
                ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20'
              }
            `}
            title={tool.label}
          >
            <span className={`text-white ${activeTool === tool.id ? 'opacity-100 scale-110' : 'opacity-60'} transition-transform`}>
              {tool.icon}
            </span>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 border border-white/10 rounded-md text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {tool.label}
            </div>
          </button>
        ))}
      </div>
      
      {/* Help text for active tool */}
      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-lg max-w-[200px]">
        <p className="text-white/60 text-xs leading-relaxed">
          {activeTool === 'select' && "Click to select points. Shift+click for multi-select."}
          {activeTool === 'waypoint' && "Click anywhere on the globe to drop a geographic anchor."}
          {activeTool === 'lasso' && "Lasso tool coming soon (Phase 2)."}
          {activeTool === 'path' && "Smooth Path tool coming soon (Phase 3)."}
          {activeTool === 'annotation' && "Annotation tool coming soon (Phase 4)."}
          {activeTool === 'eraser' && "Click objects to delete them."}
        </p>
      </div>
    </div>
  );
}
