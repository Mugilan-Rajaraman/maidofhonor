"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ConicPolygonGeometry from 'three-conic-polygon-geometry';

interface GeoJSONFeature {
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any; // handles both Polygon and MultiPolygon
  };
}

interface Dot {
  id: string;
  lat: number;
  lon: number;
  state: 'initial' | 'attention' | 'partial' | 'ignore';
}

interface GlobeRoute {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
}

interface GlobeProps {
  routes?: GlobeRoute[];
  arcHeightMultiplier?: number;
  routeThickness?: number;
}

const COLOR_MAP = {
  initial: '#666666',
  attention: '#00ff00',
  partial: '#ffff00',
  ignore: '#ff0000',
};

const SIZE_MAP = {
  initial: 4,
  attention: 8,
  partial: 8,
  ignore: 8,
};

export default function ThreeJSGlobeWithDots({
  routes = [],
  arcHeightMultiplier = 0.4,
  routeThickness = 0.005
}: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dotElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const globeGroupRef = useRef<THREE.Group | null>(null);

  const [dots, setDots] = useState<Dot[]>([]);

  // To keep track of the dots' corresponding 3D meshes without re-running useEffect
  const dotMeshesRef = useRef<Record<string, THREE.Mesh>>({});

  useEffect(() => {
    if (!mountRef.current || !overlayRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene bootstrapping
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 3.5;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 2;
    controls.maxDistance = 6;

    let isDragging = false;
    let resumeRotationTimeout: NodeJS.Timeout;
    let autoRotate = true;

    controls.addEventListener('start', () => {
      isDragging = true;
      autoRotate = false;
      clearTimeout(resumeRotationTimeout);
    });

    controls.addEventListener('end', () => {
      isDragging = false;
      resumeRotationTimeout = setTimeout(() => {
        if (!isDragging) {
          autoRotate = true;
        }
      }, 3000);
    });

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 2. Wireframe sphere (using Icosahedron for the triangular geodesic look)
    const R = 1.3;
    const sphereGeo = new THREE.IcosahedronGeometry(R, 40);
    const sphereMat = new THREE.MeshBasicMaterial({
      wireframe: true,
      opacity: 0.15,
      color: '#ffffff',
      transparent: true
    });
    const wireframeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(wireframeSphere);

    // 4. Continent / Country geometry
    fetch('/countries.geojson')
      .then(res => res.json())
      .then(geoJson => {
        const continentMat = new THREE.LineBasicMaterial({ color: '#ffffff', opacity: 0.85, transparent: true });
        const fillMat = new THREE.MeshBasicMaterial({ 
          color: '#1a1a1a', // Dark opaque color
          opacity: 1, 
          transparent: false, 
          depthWrite: true, 
          side: THREE.DoubleSide 
        });

        geoJson.features.forEach((feature: GeoJSONFeature) => {
          const polygons = feature.geometry.type === 'Polygon'
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

          polygons.forEach((polygon: number[][][]) => {
            // Fill using ConicPolygonGeometry
            // (polygonGeoJson, bottomHeight, topHeight, closedBottom, closedTop, includeSides, curvatureResolution)
            const conicGeo = new ConicPolygonGeometry(polygon, R, R + 0.015, false, true, false, 5);
            const fillMesh = new THREE.Mesh(conicGeo, fillMat);
            globeGroup.add(fillMesh);

            // Outlines
            polygon.forEach((ring: number[][]) => {
              const points: THREE.Vector3[] = [];
              ring.forEach((coord: number[]) => {
                const [lon, lat] = coord;
                const phi = (90 - lat) * Math.PI / 180;
                const theta = (90 - lon) * Math.PI / 180;

                const rOutline = R + 0.016;
                const x = rOutline * Math.sin(phi) * Math.cos(theta);
                const y = rOutline * Math.cos(phi);
                const z = rOutline * Math.sin(phi) * Math.sin(theta);
                points.push(new THREE.Vector3(x, y, z));
              });

              const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
              const line = new THREE.Line(lineGeo, continentMat);
              globeGroup.add(line);
            });
          });
        });
      })
      .catch(err => console.error("Error loading continents:", err));

    // 5. Persona dots setup
    const initialDots: Dot[] = Array.from({ length: 40 }).map((_, i) => ({
      id: `dot-${i}`,
      lat: (Math.random() - 0.5) * 140, // Avoid poles
      lon: (Math.random() - 0.5) * 360,
      state: 'initial'
    }));

    setDots(initialDots);

    const dotGeo = new THREE.SphereGeometry(0.015, 8, 8);

    initialDots.forEach(dot => {
      const phi = (90 - dot.lat) * Math.PI / 180;
      const theta = (90 - dot.lon) * Math.PI / 180;
      const r = R + 0.02;

      const mat = new THREE.MeshBasicMaterial({ color: COLOR_MAP[dot.state] });
      const mesh = new THREE.Mesh(dotGeo, mat);

      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );

      globeGroup.add(mesh);
      dotMeshesRef.current[dot.id] = mesh;
    });

    // 7. Globe group rotation & animate loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      controls.update();

      if (autoRotate) {
        globeGroup.rotation.y += 0.003;
      }

      // 6. Dot visibility & screen positioning
      const globeCenter = new THREE.Vector3(0, 0, 0);
      globeCenter.applyMatrix4(globeGroup.matrixWorld);

      Object.keys(dotMeshesRef.current).forEach(id => {
        const mesh = dotMeshesRef.current[id];
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);

        const distToCenter = camera.position.distanceTo(globeCenter);
        const distToDot = camera.position.distanceTo(worldPos);

        // Hide if further than center
        const isVisible = distToDot <= distToCenter;

        const el = dotElementsRef.current[id];
        if (el) {
          if (isVisible) {
            const screenPos = worldPos.clone().project(camera);

            // Need bounding rect of the container to position correctly
            if (mountRef.current) {
              const rect = mountRef.current.getBoundingClientRect();
              const x = (screenPos.x * 0.5 + 0.5) * rect.width;
              const y = (-(screenPos.y * 0.5) + 0.5) * rect.height;

              el.style.display = 'block';
              el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
            }
          } else {
            el.style.display = 'none';
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Store ref values to clean up properly
    const currentMount = mountRef.current;

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      clearTimeout(resumeRotationTimeout);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle Route Drawing
  const routeMeshesRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!globeGroupRef.current) return;
    const group = globeGroupRef.current;

    // Cleanup previous routes
    routeMeshesRef.current.forEach(mesh => {
      group.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    routeMeshesRef.current = [];

    if (!routes || routes.length === 0) return;

    const R = 1.3;
    const getCartesian = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (90 - lon) * Math.PI / 180;
      return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    routes.forEach(route => {
      const p1 = getCartesian(route.lat1, route.lon1, R);
      const p2 = getCartesian(route.lat2, route.lon2, R);

      const distance = p1.distanceTo(p2);
      const arcHeight = distance * arcHeightMultiplier;

      const points: THREE.Vector3[] = [];
      const numPoints = 64;

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const pt = new THREE.Vector3().copy(p1).lerp(p2, t);
        pt.normalize();

        const currentHeight = R + 0.01 + arcHeight * (4 * t * (1 - t));
        pt.multiplyScalar(currentHeight);

        points.push(pt);
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 64, routeThickness, 8, false);
      const material = new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.9,
      });

      const routeMesh = new THREE.Mesh(geometry, material);
      group.add(routeMesh);
      routeMeshesRef.current.push(routeMesh);
    });

  }, [routes, arcHeightMultiplier, routeThickness]);

  // Simulate reactions arriving
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        const newDots = [...prev];
        const randomIdx = Math.floor(Math.random() * newDots.length);
        const states: Dot['state'][] = ['attention', 'partial', 'ignore'];
        const newState = states[Math.floor(Math.random() * states.length)];

        newDots[randomIdx] = { ...newDots[randomIdx], state: newState };

        // Also update 3D mesh material
        const mesh = dotMeshesRef.current[newDots[randomIdx].id];
        if (mesh) {
          (mesh.material as THREE.MeshBasicMaterial).color.set(COLOR_MAP[newState]);
        }

        return newDots;
      });
    }, 2000); // Simulate an update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[600px] flex items-center justify-center bg-[#0a0a0a] rounded-3xl overflow-hidden shadow-2xl">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
        {dots.map(dot => {
          const size = SIZE_MAP[dot.state];
          const color = COLOR_MAP[dot.state];
          const isPulsing = dot.state !== 'initial';

          return (
            <div
              key={dot.id}
              ref={el => { dotElementsRef.current[dot.id] = el; }}
              className="absolute top-0 left-0 hidden"
              style={{ width: size, height: size }}
            >
              {/* Outer pulsing ring */}
              {isPulsing && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: color }}
                />
              )}
              {/* Inner core dot */}
              <div
                className="absolute inset-0 rounded-full transition-colors duration-500"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
