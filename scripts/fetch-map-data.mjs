#!/usr/bin/env node
/**
 * Fetch POI (restaurants + campgrounds), gas stations, and EV charging stations
 * from OpenstreetMap's Overpass API for Colorado and New Mexico.
 *
 * Uses a single combined query per data type (3 API calls total) to minimize
 * rate-limiting.
 *
 * Usage: node scripts/fetch-map-data.mjs
 */

import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

const STATE_AREAS = '^(US-CO|US-NM)$';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchOverpass(query, retries = 3) {
  const body = new URLSearchParams();
  body.set('data', query);

  for (let attempt = 0; attempt < retries; attempt++) {
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        if (attempt > 0) {
          const wait = 15000 * (attempt + 1);
          console.log(`  Retry ${attempt + 1}: waiting ${wait / 1000}s...`);
          await sleep(wait);
        }
        console.log(`  Trying ${endpoint}...`);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'SoakColorado-DataFetcher/1.0 (contact@soakcolorado.com)',
          },
          body: body.toString(),
          signal: AbortSignal.timeout(180000),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 150)}`);
        }
        const data = await res.json();
        console.log(`  Success: ${data.elements?.length || 0} elements`);
        return data.elements || [];
      } catch (e) {
        console.warn(`  ${endpoint} failed: ${e.message}`);
        await sleep(3000);
      }
    }
  }
  throw new Error('All Overpass endpoints failed after retries');
}

function elementsToGeoJSON(elements, typeFilter = null) {
  const features = [];
  for (const el of elements) {
    if (el.type !== 'node' || !el.lat || !el.lon) continue;
    const tags = el.tags || {};
    const name = tags.name || tags.brand || tags.operator || 'Unknown';
    const props = { name, id: el.id };

    if (typeFilter === 'poi') {
      if (tags.amenity === 'restaurant') {
        props.type = 'restaurant';
      } else if (tags.tourism === 'camp_site' || tags.tourism === 'caravan_site') {
        props.type = 'camp_site';
      } else {
        continue;
      }
    } else if (typeFilter === 'ev') {
      props.capacity = tags.capacity || '';
      props.socket_type = tags['socket:type_2'] || tags['socket:type2'] || tags['socket:type1'] || '';
    }

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
      properties: props,
    });
  }
  return { type: 'FeatureCollection', features };
}

function buildQuery(filterClause) {
  return `
    [out:json][timeout:180];
    area["ISO3166-2"~"${STATE_AREAS}"] ->.states;
    (
      ${filterClause}
    );
    out;
  `.trim();
}

async function main() {
  // 1. POI: restaurants + campgrounds
  console.log('\n=== Fetching POI (restaurants + campgrounds) for CO/NM ===');
  const poiQuery = buildQuery(`
      node["amenity"="restaurant"](area.states);
      node["tourism"="camp_site"](area.states);
      node["tourism"="caravan_site"](area.states);
  `);
  const poiElements = await fetchOverpass(poiQuery);
  const poiGeoJSON = elementsToGeoJSON(poiElements, 'poi');
  writeFileSync(join(DATA_DIR, 'poi.json'), JSON.stringify(poiGeoJSON));
  console.log(`POI: wrote ${poiGeoJSON.features.length} features`);

  await sleep(15000);

  // 2. Gas stations
  console.log('\n=== Fetching gas stations for CO/NM ===');
  const gasQuery = buildQuery('node["amenity"="fuel"](area.states);');
  const gasElements = await fetchOverpass(gasQuery);
  const gasGeoJSON = elementsToGeoJSON(gasElements, 'gas');
  writeFileSync(join(DATA_DIR, 'gas-stations.json'), JSON.stringify(gasGeoJSON));
  console.log(`Gas: wrote ${gasGeoJSON.features.length} features`);

  await sleep(15000);

  // 3. EV charging stations
  console.log('\n=== Fetching EV charging stations for CO/NM ===');
  const evQuery = buildQuery('node["amenity"="charging_station"](area.states);');
  const evElements = await fetchOverpass(evQuery);
  const evGeoJSON = elementsToGeoJSON(evElements, 'ev');
  writeFileSync(join(DATA_DIR, 'ev-stations.json'), JSON.stringify(evGeoJSON));
  console.log(`EV: wrote ${evGeoJSON.features.length} features`);

  // Summary
  console.log('\n=== Summary ===');
  for (const [name, data] of [['POI', poiGeoJSON], ['Gas', gasGeoJSON], ['EV', evGeoJSON]]) {
    if (data.features.length === 0) {
      console.log(`${name}: 0 features`);
      continue;
    }
    const lngs = data.features.map(f => f.geometry.coordinates[0]);
    const lats = data.features.map(f => f.geometry.coordinates[1]);
    console.log(`${name}: ${data.features.length} features | lng: ${Math.min(...lngs).toFixed(2)} to ${Math.max(...lngs).toFixed(2)}, lat: ${Math.min(...lats).toFixed(2)} to ${Math.max(...lats).toFixed(2)}`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
