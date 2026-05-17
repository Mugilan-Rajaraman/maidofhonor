import * as THREE from 'three';
import RBush from 'rbush';

// ==========================================
// 1. Core Interfaces & Primitives
// ==========================================

export interface TerrainPoint {
  lat: number;
  lon: number;
  elevation: number; // meters
}

export interface Waypoint {
  id: string;
  lat: number;
  lon: number;
  elevation?: number;
  xyz?: THREE.Vector3;
  label?: string;
}

export interface GeoMantisObject {
  id: string;
  lat: number;
  lon: number;
  elevation?: number;
  xyz: THREE.Vector3;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

export interface Edge {
  from: string;
  to: string;
  cost: number;
}

export interface Route {
  id: string;
  waypoints: Waypoint[];
  curve?: THREE.CatmullRomCurve3;
}

export interface Selection {
  id: string;
  selectedIds: string[];
  polygonPoints: [number, number][]; // Screen points
}

export interface GeoMantis3DState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  terrain: any; // e.g., TerrainTileSet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  regions: any; // e.g., FeatureCollection
  objects: GeoMantisObject[];
  waypoints: Waypoint[];
  routes: Route[];
  selections: Selection[];
  spatialIndex: RBush<SpatialItem>;
}

// ==========================================
// 2. Spatial Indexing Setup (RBush)
// ==========================================

export interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  object: GeoMantisObject | Waypoint;
}

// Custom RBush class for spatial queries
export class GeoSpatialIndex extends RBush<SpatialItem> {}

// ==========================================
// 3. Mathematical Conversions
// ==========================================

/**
 * Converts Geographic coordinates (Lat/Lon) to a Cartesian Vector3 on a sphere.
 */
export function latLonToXYZ(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lon) * (Math.PI / 180);

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Inverse operation: Converts Cartesian Vector3 back to Geographic Lat/Lon.
 */
export function xyzToLatLon(vec: THREE.Vector3, radius: number): { lat: number; lon: number } {
  const normalized = vec.clone().normalize();
  const lat = 90 - (Math.acos(normalized.y) * 180) / Math.PI;
  const lon = 90 - (Math.atan2(normalized.z, normalized.x) * 180) / Math.PI;
  return { lat, lon };
}

// ==========================================
// 4. Utility Functions
// ==========================================

/**
 * Generates a smooth Catmull-Rom curve from a set of Waypoints.
 */
export function smoothPath(waypoints: Waypoint[], radius: number): THREE.CatmullRomCurve3 {
  const points = waypoints.map(wp => {
    // If XYZ isn't cached on the waypoint, calculate it
    const r = radius + (wp.elevation || 0) * 0.001; // scale elevation
    return wp.xyz || latLonToXYZ(wp.lat, wp.lon, r);
  });
  return new THREE.CatmullRomCurve3(points);
}

/**
 * Basic Point-in-Polygon implementation (Ray-casting algorithm).
 * @param point [x, y] screen coordinate
 * @param vs Polygon vertices [[x, y], ...]
 */
export function pointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];

    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Lasso selection: filters all globe objects within a screen-space polygon.
 */
export function lassoSelect(
  screenPolygon: [number, number][],
  globePoints: GeoMantisObject[],
  projectToScreen: (xyz: THREE.Vector3) => [number, number] | null
): string[] {
  const selectedIds: string[] = [];
  
  for (const obj of globePoints) {
    const screenCoord = projectToScreen(obj.xyz);
    if (screenCoord && pointInPolygon(screenCoord, screenPolygon)) {
      selectedIds.push(obj.id);
    }
  }
  
  return selectedIds;
}

/**
 * Finds the nearest waypoint to a target Geographic coordinate.
 * Uses naive calculation (Harvesine distance could be used for true globe distance).
 */
export function nearestWaypoint(lat: number, lon: number, waypoints: Waypoint[]): Waypoint | null {
  if (waypoints.length === 0) return null;

  let nearest = waypoints[0];
  let minDistance = Number.MAX_VALUE;

  for (const wp of waypoints) {
    // Simple squared Euclidean distance on lat/lon (fast approximation for small distances)
    const distSq = Math.pow(wp.lat - lat, 2) + Math.pow(wp.lon - lon, 2);
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = wp;
    }
  }

  return nearest;
}

/**
 * Stub for graph-based shortest path (e.g., Dijkstra / A*).
 */
export function shortestPath(startId: string, endId: string, graph: Edge[]): string[] {
  console.warn("shortestPath is a stub. Implement A* or Dijkstra using the Edge graph.");
  return [startId, endId];
}
