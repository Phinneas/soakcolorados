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
  { id: '1', slug: 'strawberry-hot-springs',      name: 'Strawberry Hot Springs',      lat: 40.7440,  lng: -106.7400, temp_f: 102,  fee: 20, access_type: 'drive-up', season: 'year-round', description: 'Five mineral soaking pools with mountain views near Steamboat Springs.' },
  { id: '2', slug: 'iron-mountain-hot-springs',  name: 'Iron Mountain Hot Springs',  lat: 38.5300,  lng: -106.3200, temp_f: 110,  fee: 12, access_type: 'hike-in',  season: 'year-round', description: 'Natural rock pools with stunning views of the Collegiate Peaks.' },
  { id: '3', slug: 'mountain-princess',          name: 'Mount Princeton Hot Springs',   lat: 38.7300,  lng: -106.2200, temp_f: 105,  fee: 18, access_type: 'resort',  season: 'year-round', description: 'Historic resort with naturally hot soak pools and spa services.' },
  { id: '4', slug: 'glade-park',                name: 'Glenwood Hot Springs',         lat: 39.5500,  lng: -107.3300, temp_f: 104,  fee: 20, access_type: 'resort',  season: 'year-round', description: 'World\'s largest mineral hot springs pool with two temperature zones.' },
  { id: '5', slug: 'hartsel-hot-springs',        name: 'Hartsel Hot Springs',         lat: 38.7800,  lng: -105.7900, temp_f: 103,  fee: 8,  access_type: 'drive-up', season: 'seasonal',   description: 'Soaking pools near South Park with fishing and camping nearby.' },
  { id: '6', slug: 'poncha-hot-springs',         name: 'Poncha Hot Springs',          lat: 38.5000,  lng: -105.9000, temp_f: 108,  fee: 15, access_type: 'resort',  season: 'year-round', description: 'Family-friendly resort near Monarch Pass with swimming pools.' },
  { id: '7', slug: 'wiesbaden-hot-springs',      name: 'Wiesbaden Hot Springs',        lat: 37.8600,  lng: -107.3300, temp_f: 112,  fee: 25, access_type: 'resort',  season: 'year-round', description: 'Historic hotel with vapor caves and private soaking tubs.' },
  { id: '8', slug: 'ouray-hot-springs',          name: 'Ouray Hot Springs',           lat: 38.0200,  lng: -107.6700, temp_f: 96,  fee: 18,  access_type: 'drive-up', season: 'year-round', description: 'Naturally hot swimming pool in the "Switzerland of America" with stunning mountain views.' },
];
