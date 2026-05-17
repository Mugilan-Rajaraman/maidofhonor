import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Memory cache for the loaded JSON data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geoData: any[] | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = q.toLowerCase();

  try {
    // Load data into memory if not already loaded
    if (!geoData) {
      const filePath = path.join(process.cwd(), 'public', 'countries+states+cities.json');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      geoData = JSON.parse(fileContents);

      // Prioritize major countries so they appear first when we break early
      const priorityIso = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN', 'IT', 'ES', 'BR', 'MX', 'JP'];
      geoData!.sort((a, b) => {
        const aIndex = priorityIso.indexOf(a.iso2);
        const bIndex = priorityIso.indexOf(b.iso2);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        // Fallback to population if exists, otherwise alphabetical
        const aPop = a.population || 0;
        const bPop = b.population || 0;
        if (aPop !== bPop) return bPop - aPop;
        return a.name.localeCompare(b.name);
      });
    }

    const results = [];
    const MAX_RESULTS = 50;

    // Search logic (Starts With)
    for (const country of geoData!) {
      if (country.name.toLowerCase().startsWith(query)) {
        results.push({ type: 'country', name: country.name, lat: parseFloat(country.latitude), lon: parseFloat(country.longitude) });
      }
      
      if (country.states) {
        for (const state of country.states) {
          if (state.name.toLowerCase().startsWith(query)) {
            results.push({ type: 'state', name: `${state.name}, ${country.name}`, lat: parseFloat(state.latitude), lon: parseFloat(state.longitude) });
          }
          
          if (state.cities) {
            for (const city of state.cities) {
              if (city.name.toLowerCase().startsWith(query)) {
                results.push({ type: 'city', name: `${city.name}, ${state.name}, ${country.name}`, lat: parseFloat(city.latitude), lon: parseFloat(city.longitude) });
              }
              if (results.length >= MAX_RESULTS) break;
            }
          }
          if (results.length >= MAX_RESULTS) break;
        }
      }
      if (results.length >= MAX_RESULTS) break;
    }

    // Fallback: If not enough results, do an "includes" search
    if (results.length < 10) {
      for (const country of geoData!) {
        if (!country.name.toLowerCase().startsWith(query) && country.name.toLowerCase().includes(query)) {
          results.push({ type: 'country', name: country.name, lat: parseFloat(country.latitude), lon: parseFloat(country.longitude) });
        }
        if (country.states) {
          for (const state of country.states) {
            if (!state.name.toLowerCase().startsWith(query) && state.name.toLowerCase().includes(query)) {
              results.push({ type: 'state', name: `${state.name}, ${country.name}`, lat: parseFloat(state.latitude), lon: parseFloat(state.longitude) });
            }
            if (state.cities) {
              for (const city of state.cities) {
                if (!city.name.toLowerCase().startsWith(query) && city.name.toLowerCase().includes(query)) {
                  results.push({ type: 'city', name: `${city.name}, ${state.name}, ${country.name}`, lat: parseFloat(city.latitude), lon: parseFloat(city.longitude) });
                }
                if (results.length >= MAX_RESULTS) break;
              }
            }
            if (results.length >= MAX_RESULTS) break;
          }
        }
        if (results.length >= MAX_RESULTS) break;
      }
    }

    // Sort to bring exact/shorter matches to the top
    results.sort((a, b) => a.name.length - b.name.length);

    // Filter to unique names
    const uniqueResults = [];
    const seen = new Set();
    for (const r of results) {
      if (!seen.has(r.name)) {
        seen.add(r.name);
        uniqueResults.push(r);
      }
    }

    return NextResponse.json({ results: uniqueResults.slice(0, 10) });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to search locations" }, { status: 500 });
  }
}
