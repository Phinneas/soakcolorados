// Mapbox public access token (pk.* tokens are safe for client-side use)
// Falls back to encoded value when env var is not set (e.g. Cloudflare static builds)
const _encoded = 'cGsuZXlKMUlqb2lZMkpsWVhKa0lpd2lZU0k2SW1OdGJuaHBjV2R3TXpBeWVERXljWEUxZWpCMU9UTnBZMmtpZlEuWmIyaUN0eWp5Ylh2UmZhR2JvZzFvUQ==';
export const mapboxAccessToken = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN || atob(_encoded);
