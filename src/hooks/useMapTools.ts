import { useState } from 'react';
import { Waypoint } from '@/lib/geo/geomantis';

export type MapToolId = 'select' | 'waypoint' | 'lasso' | 'path' | 'eraser' | 'annotation';

export interface MapToolsState {
  activeTool: MapToolId;
  selectedIds: string[];
  waypoints: Waypoint[];
  hoveredId: string | null;
}

export function useMapTools() {
  const [activeTool, setActiveTool] = useState<MapToolId>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return {
    activeTool,
    setActiveTool,
    selectedIds,
    setSelectedIds,
    waypoints,
    setWaypoints,
    hoveredId,
    setHoveredId
  };
}
