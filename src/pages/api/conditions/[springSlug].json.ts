export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const { springSlug } = params;
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { results } = await db
      .prepare(
        `SELECT id, spring_slug, visit_date, crowd_level, water_temp,
                is_open, photo_url, notes, created_at
         FROM conditions
         WHERE spring_slug = ?
         ORDER BY created_at DESC
         LIMIT 10`
      )
      .bind(springSlug)
      .all();

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60',
      },
    });
  } catch (err) {
    console.error('Conditions API error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load conditions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
  const { springSlug } = params;
  const db = (locals as any).runtime?.env?.DB as D1Database | undefined;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as {
      visit_date?: string;
      crowd_level?: number;
      water_temp?: number;
      is_open?: boolean;
      notes?: string;
      photo_url?: string;
    };

    // Basic validation
    if (body.crowd_level && (body.crowd_level < 1 || body.crowd_level > 5)) {
      return new Response(JSON.stringify({ error: 'crowd_level must be 1-5' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get spring id
    const spring = await db
      .prepare('SELECT id FROM springs WHERE slug = ?')
      .bind(springSlug)
      .first<{ id: string }>();

    if (!spring) {
      return new Response(JSON.stringify({ error: 'Spring not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO conditions (id, spring_id, spring_slug, visit_date, crowd_level,
          water_temp, is_open, photo_url, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id, spring.id, springSlug,
        body.visit_date ?? null,
        body.crowd_level ?? null,
        body.water_temp ?? null,
        body.is_open !== false ? 1 : 0,
        body.photo_url ?? null,
        body.notes ?? null
      )
      .run();

    return new Response(JSON.stringify({ id, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Conditions POST error:', err);
    return new Response(JSON.stringify({ error: 'Failed to save report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
