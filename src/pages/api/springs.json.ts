export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    // Dev fallback — return placeholder data when D1 isn't bound locally
    return new Response(JSON.stringify(DEV_SPRINGS), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT id, slug, name, lat, lng, gps, temp_f, fee, fee_notes,
                description, access_type, hours, season, clothing,
                cell_coverage, road_condition, parking,
                best_time, avoid_when, insider_tips, nearby_gems,
                last_verified, maintenance_day, alerts
         FROM springs
         WHERE lat IS NOT NULL AND lng IS NOT NULL
         ORDER BY name ASC`
      )
      .all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300', // 5-min edge cache
      },
    });
  } catch (err) {
    console.error('Springs API error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load springs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// ─── Dev fallback (matches D1 column names exactly) ──────────────────────────
const DEV_SPRINGS = [
  { id: '1', slug: 'sol-duc-hot-springs',     name: 'Sol Duc Hot Springs',     lat: 47.9689,  lng: -123.8631, temp_f: 98,  fee: 18, access_type: 'drive-up', season: 'seasonal',   description: 'Three mineral soaking pools in Olympic National Park.' },
  { id: '2', slug: 'olympic-hot-springs',     name: 'Olympic Hot Springs',     lat: 47.9742,  lng: -123.7383, temp_f: 95,  fee: 0,  access_type: 'hike-in',  season: 'year-round', description: 'Remote wilderness hot springs in Olympic National Park.' },
  { id: '3', slug: 'goldmyer-hot-springs',    name: 'Goldmyer Hot Springs',    lat: 47.4833,  lng: -121.4194, temp_f: 113, fee: 15, access_type: 'hike-in',  season: 'year-round', description: 'Secluded hot springs in the Cascade Mountains, permit required.' },
  { id: '4', slug: 'baker-hot-springs',       name: 'Baker Hot Springs',       lat: 48.7280,  lng: -121.6830, temp_f: 105, fee: 0,  access_type: 'drive-up', season: 'year-round', description: 'Free hot springs near Mt. Baker with easy trail access.' },
  { id: '5', slug: 'gamma-hot-springs',       name: 'Gamma Hot Springs',       lat: 48.1330,  lng: -121.1450, temp_f: 100, fee: 0,  access_type: 'hike-in',  season: 'summer',     description: 'Remote springs in the Glacier Peak Wilderness.' },
  { id: '6', slug: 'ohanapecosh-hot-springs', name: 'Ohanapecosh Hot Springs', lat: 46.7302,  lng: -121.5678, temp_f: 84,  fee: 0,  access_type: 'hike-in',  season: 'year-round', description: 'Historic hot springs in Mt. Rainier National Park.' },
  { id: '7', slug: 'doe-bay-hot-spring',      name: 'Doe Bay Hot Spring',      lat: 48.6530,  lng: -122.7970, temp_f: 104, fee: 12, access_type: 'drive-up', season: 'year-round', description: 'Mineral soaking tubs with ocean views on Orcas Island.' },
  { id: '8', slug: 'carson-hot-springs',      name: 'Carson Hot Springs',      lat: 45.7232,  lng: -121.8241, temp_f: 126, fee: 22, access_type: 'drive-up', season: 'year-round', description: 'Historic spa resort on the Columbia River Gorge.' },
];
