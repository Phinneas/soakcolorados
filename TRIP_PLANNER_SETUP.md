# Trip Planner - Setup & Configuration Guide

## Overview

The Trip Planner allows users to plan multi-stop hot springs road trips with:
- Interactive spring selection (list or map)
- Route optimization using Google Routes API or Mapbox
- Turn-by-turn directions
- Nearby POI recommendations (restaurants, gas, camping)
- Save to localStorage and share via URL
- Export to Google Maps

## Architecture

```
trip-planner/single.html (Page template)
    └── TripPlanner class (Main controller)
        ├── Spring Selection (List + Map)
        ├── Route Optimization (Google/Mapbox)
        ├── Route Visualization (Leaflet)
        ├── POI Recommendations (Overpass API)
        ├── localStorage (Save/Load)
        └── URL Share (Params encoding)
```

## Features

### ✅ Spring Selection
- **List View**: Searchable list with checkboxes
- **Map View**: Click markers to add/remove
- **Visual Feedback**: Selected springs highlighted in blue
- **Order Management**: Drag or auto-reorder after optimization

### ✅ Route Optimization
- **Google Routes API**: Primary (requires API key)
- **Mapbox Directions**: Fallback (free, 50k/month)
- **Optimization**: Minimizes total driving time
- **Multi-stop**: Handles 2-50 waypoints

### ✅ Route Display
- **Leaflet Map**: Interactive route visualization
- **Numbered Markers**: 1, 2, 3... for stop order
- **Route Line**: Blue polyline connecting stops
- **Zoom to Fit**: Auto-zoom to show entire route

### ✅ POI Recommendations
- **Overpass API**: Free, no API key needed
- **Categories**:
  - 🍽️ Restaurants (amenity=restaurant|café)
  - ⛽ Gas Stations (amenity=fuel)
  - 🏕️ Campgrounds (tourism=camp_site)
- **Route Buffer**: 5km buffer along route
- **Smart Display**: Shows nearest POI per category

### ✅ Save & Share
- **localStorage**: Save trips to browser
- **URL Params**: Encode springs + start location
- **Share Link**: Copy to clipboard
- **Google Maps**: One-click export

## Setup

### 1. API Configuration

#### Google Routes API (Optional but Recommended)

1. Get a Google API Key: https://console.cloud.google.com/
2. Enable "Routes API"
3. Set API key in `.env`:

```bash
GOOGLE_API_KEY=your_google_api_key_here
```

4. Update `trip-planner.js`:

```javascript
// Line ~15
this.config.googleApiKey = window.GOOGLE_API_KEY || '';
```

**Note**: Without Google API key, route optimization falls back to Mapbox (which is still good but less accurate).

#### Mapbox Fallback (Built-in)

No setup needed! Already integrated as fallback.
- Free: 100,000 directions requests/month
- No API key required for basic usage
- Works out of the box

#### Overpass API (Built-in)

No setup needed! Completely free.
- Queries OpenStreetMap directly
- No API key or rate limits
- Already integrated in trip-planner.js

### 2. Teable Integration

Update spring data source in `trip-planner.js`:

```javascript
// Lines ~10-13
this.config = {
    teableBaseUrl: 'https://teable-snickers-u27640.vm.elestio.app',
    teableTableId: 'tbl0ZdZarej0x4Pv7lG', // Your springs table ID
    apiToken: window.TEABLE_API_TOKEN || '', // From .env
    
    // ... rest of config
};
```

Make sure your `.env` has:

```bash
TEABLE_API_TOKEN=your_teable_token_here
```

### 3. GPS Coordinate Parsing

The parser expects GPS format: `"47.9689° N, 123.8631° W"`

If your data is different, update `parseGPS()` in trip-planner.js:

```javascript
parseGPS(gpsString) {
    // Modify this regex to match your format
    const match = gpsString.match(/([\d.-]+).*N.*([\d.-]+).*W/i);
    if (match) {
        return {
            lat: parseFloat(match[1]),
            lng: -parseFloat(match[2])
        };
    }
    return { lat: null, lng: null };
}
```

## Usage

### User Flow

1. **Select Springs**
   - Browse list or click map markers
   - Checkboxes show selection status
   - Selected springs appear in sidebar

2. **Set Starting Point**
   - Type address OR
   - Click "Use My Location" OR
   - Click map to set start point

3. **Optimize Route**
   - Click "🚀 Optimize Route" button
   - Waits for API response (2-5 seconds)
   - Shows loading spinner

4. **View Results**
   - Map updates with numbered markers
   - Route line drawn
   - Stats show: total miles, drive time
   - POI recommendations appear

5. **Get Directions** (Optional)
   - Click "📋 Show Turn-by-Turn"
   - See step-by-step instructions

6. **Save/Share**
   - **Save**: Stores to browser localStorage
   - **Share**: Copies URL with encoded trip
   - **Export**: Opens Google Maps with waypoints

### URL Sharing Format

```
/trip-planner/?springs=sol-duc,baker-hot-springs,alpine-hot-springs&start=47.6062,-120.7401
```

- `springs`: Comma-separated spring slugs
- `start`: Lat,lng of starting location
- **Bookmark**: Save trips as browser bookmarks
- **Share**: Send link to friends

## Configuration

### Customize Max Springs

```javascript
// In trip-planner.js, line ~18
maxSprings: 10, // Change to limit/maximum
```

### Customize POI Radius

```javascript
// Line ~21
poiRadius: 5000, // 5km from route
```

### Customize Map Center

```javascript
// Line ~25
mapCenter: [47.6062, -120.7401], // Washington state
mapZoom: 7,
```

## Debugging

### Common Issues

**Problem**: Springs not loading
- **Check**: API token in `.env`
- **Check**: Table ID is correct
- **Check**: Network tab for 401/403 errors

**Problem**: Route optimization fails
- **Check**: Google API key (if using Google)
- **Fallback**: Should auto-switch to Mapbox
- **Check**: CORS errors in console

**Problem**: No POI recommendations
- **Check**: Overpass API is free and reliable
- **Debug**: Check network tab for Overpass query
- **Verify**: Route line exists before POI query

**Problem**: localStorage not working
- **Check**: Browser supports localStorage
- **Check**: Not in private/incognito mode
- **Check**: Site has not exceeded quota (5MB)

**Problem**: Share URL not loading trip
- **Check**: Spring slugs match exactly
- **Check**: URL params are not URL-encoded twice
- **Check**: Console for parse errors

### Browser Console Commands

```javascript
// Get current trip state
tripPlanner.config.selectedSprings

// Manually add spring
tripPlanner.addSpringToTrip({slug: 'test', name: 'Test', lat: 47, lng: -120})

// Force route optimization
tripPlanner.optimizeRoute()

// Clear saved trips
localStorage.removeItem('hotSpringsTrip')

// See route stats
tripPlanner.config.optimizedRoute
```

## Performance

### Optimizations

- ✅ Springs cached in memory (no redundant API calls)
- ✅ Route optimization in background (async)
- ✅ Overpass queries batched (single request)
- ✅ Marker reuse (no recreation on selection)
- ✅ localStorage is sync (fast)
- ✅ URL params parsed once (on load)

### Size Considerations

- **Max Springs**: 50 waypoints (Google limit)
- **localStorage**: 5MB limit (approx 10-20 trips)
- **URL Length**: 2000 chars max (approx 30 springs)
- **Mapbox API**: 100k directions/month (free tier)

## Security

⚠️ **Important**:
- Never commit `.env` with API keys
- Use server-side proxy for API calls in production
- Rate limit route optimization (prevent abuse)
- Sanitize user inputs (start location)
- Recaptcha on forms to prevent spam

## Browser Support

✅ All modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+

**Requires**:
- `fetch()` API
- `Promise`
- Arrow functions
- `localStorage`
- Geolocation API (optional)

## API Rate Limits

| API | Free Tier | Limit |
|-----|-----------|-------|
| Google Routes | $200/month credit | ~10,000 optimizations |
| Mapbox Directions | 100k/month | 3,333/day |
| Overpass API | Unlimited | Be nice (fair use) |
| Teable API | Your plan | Check your subscription |

## Production Checklist

Before launching:

- [ ] Add your Google API key
- [ ] Configure Teable credentials
- [ ] Test with 2-50 springs
- [ ] Verify route optimization works
- [ ] Check mobile responsiveness
- [ ] Test localStorage save/load
- [ ] Test URL sharing
- [ ] Check Overpass POIs load
- [ ] Add loading/error states
- [ ] Set up error tracking (Sentry/etc)
- [ ] Add analytics (page views, trip saves)
- [ ] Test on slow network (3G)
- [ ] Check accessibility (keyboard nav)
- [ ] SEO meta tags
- [ ] Add "beta" badge if needed

## Advanced Features (Future)

Consider adding:

1. **Multiple Days**
   - Split trip into 2-3 day segments
   - Overnight stops based on drive time

2. **Weather Integration**
   - Show forecast for each spring
   - Recommend best days to visit

3. **Accommodation**
   - Hotels/motels along route
   - Campgrounds with booking links

4. **Cost Calculator**
   - Gas costs based on current prices
   - Entry fees total
   - Accommodation estimates

5. **Printable Itinerary**
   - PDF export with directions
   - Checklist of what to bring
   - Emergency contacts

6. **Offline Mode**
   - Cache springs data
   - Download maps for offline use
   - Works without cell service

## Support

- Google Routes API: https://developers.google.com/maps/documentation/routes
- Mapbox Directions: https://docs.mapbox.com/api/navigation/directions/
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- Leaflet: https://leafletjs.com/
- Teable API: https://help.teable.io/en/articles/9356083-api

**Happy trip planning!** 🗺️✨