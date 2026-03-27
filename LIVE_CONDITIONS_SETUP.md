# Live Conditions Feed - Setup Guide

This guide explains how to set up the visitor-reported conditions feed for your hot springs directory with comprehensive error handling.

## Overview

The Live Conditions Feed displays real-time visitor reports for each hot spring with robust error handling and graceful degradation for all states:

- ✅ **Loading state** - Skeleton loader while fetching
- ✅ **Empty state** - "No recent reports" with friendly message
- ✅ **Error state** - "Conditions temporarily unavailable" with retry
- ✅ **Data state** - Beautiful report cards with all data
- ✅ **Partial data** - Hides missing fields, no placeholder text

## Prerequisites

1. **Teable Account** with API access
2. **Two tables** in Teable:
   - `springs` (your existing hot springs data)
   - `reports` (new table for visitor submissions)
3. **API Token** with read access to both tables

## Step 1: Create Reports Table in Teable

### Table Structure

Create a new table named `reports` with these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| `spring_slug` | Single line text | Link to spring (use the slug) |
| `visit_date` | Date | When they visited |
| `crowd_level` | Single select | 1-5 scale (see options below) |
| `water_temp` | Number | Optional: user-reported temp |
| `is_open` | Checkbox | Is the spring open? |
| `photo_url` | Single line text | Optional: photo URL |
| `notes` | Long text | Visitor notes/comments |
| `created_at` | Created time | Auto-filled by Teable |

### Crowd Level Options

Create a Single Select field with these options:
- **1** - Quiet
- **2** - Light
- **3** - Moderate
- **4** - Busy
- **5** - Packed

**Important**: Use the number as the option name. The JavaScript will parse these as integers.

## Step 2: Create Report Submission Form

### Option A: Teable Share Form (Recommended)

1. In Teable, go to your `reports` table
2. Click "Share" → "Create Form"
3. Configure the form:
   - **Title**: "Report Hot Spring Conditions"
   - **Description**: "Help others by sharing current conditions"
   - **Fields to include**: All fields except `created_at`
   - **Field settings**:
     - `spring_slug`: Hide field (we'll prefill it)
     - `crowd_level`: Required
     - `is_open`: Required, default to checked
     - `photo_url`: Optional, help text: "Upload to Imgur/etc and paste URL"

4. Get the share link (looks like: `https://teable-snickers-u27640.vm.elestio.app/share/form/{form-id}`)
5. Copy this URL for later use

### Option B: Custom Form

If you prefer a custom form, create an HTML form that POSTs to the Teable API:

```html
<form id="report-form">
  <input type="hidden" name="spring_slug" value="">
  <label>Visit Date: <input type="date" name="visit_date" required></label>
  <label>Crowd Level:
    <select name="crowd_level" required>
      <option value="1">Quiet</option>
      <option value="2">Light</option>
      <option value="3">Moderate</option>
      <option value="4">Busy</option>
      <option value="5">Packed</option>
    </select>
  </label>
  <label>Water Temp: <input type="number" name="water_temp"></label>
  <label>Open: <input type="checkbox" name="is_open" checked></label>
  <label>Photo URL: <input type="url" name="photo_url"></label>
  <label>Notes: <textarea name="notes"></textarea></label>
  <button type="submit">Submit Report</button>
</form>
```

## Step 3: Configure Error Handling

### Key Features of Error Handling

The integration includes:

1. **Try/catch around all API calls** - No unhandled exceptions
2. **Timeout protection** - 10-second timeout prevents hanging
3. **Null-safe data parsing** - Handles missing/invalid fields gracefully
4. **Network error detection** - Differentiates between network and API errors
5. **User-friendly error states** - Clear messages, no console errors visible
6. **Retry mechanism** - "Try Again" button for transient failures
7. **Partial data support** - Shows available data, hides missing fields

### Error States Handled

| State | UI Message | Console Behavior |
|-------|------------|------------------|
| **Loading** | Skeleton loader | Silent |
| **No API token** | "Conditions feed not configured" | Warning logged |
| **Network error** | "Conditions temporarily unavailable" | Error logged |
| **API timeout** | "Request timed out" | Error logged |
| **HTTP 401** | "Conditions temporarily unavailable" | Auth error logged |
| **HTTP 403** | "Conditions temporarily unavailable" | Permission error logged |
| **HTTP 404** | "Conditions temporarily unavailable" | Not found error logged |
| **No reports** | "No recent reports. Be the first!" | Silent |
| **Invalid data** | Shows available fields only | Warning logged |
| **JavaScript disabled** | "JavaScript required" | N/A (noscript) |

## Step 4: Configure the Integration

### Update layouts/springs/single.html

The template is already updated to include:

```html
<!-- Live Conditions Feed Widget (added near action buttons) -->
{{ partial "conditions-feed.html" . }}

<!-- At the bottom of the page, before </body> -->
<script src="/js/conditions-feed.js"></script>
<script>
  window.TEABLE_API_TOKEN = '{{ getenv "TEABLE_API_TOKEN" }}';
</script>
```

### Set Environment Variable

Make sure your `.env` file includes:

```bash
TEABLE_API_TOKEN=your_token_here
```

### Update JavaScript Configuration

In `static/js/conditions-feed.js`, update these values:

```javascript
// Line ~12: Set your reports table ID
this.config = {
  teableBaseUrl: 'https://teable-snickers-u27640.vm.elestio.app',
  tableId: 'YOUR_REPORTS_TABLE_ID', // Get from Teable URL when viewing table
  apiToken: config.apiToken || '',
  springSlug: config.springSlug || '',
  maxReports: config.maxReports || 5,
  ...config
};

// Line ~226: Update the report form URL
const reportFormUrl = `https://teable-snickers-u27640.vm.elestio.app/share/form/YOUR_FORM_ID?prefill_spring_slug=${encodeURIComponent(this.config.springSlug)}`;
```

### Field ID Configuration

**Important**: In `static/js/conditions-feed.js`, update field IDs to match your Teable table:

```javascript
// Lines ~81-88: Update these field IDs
filter: {
  conjunction: "and",
  filterSet: [
    {
      fieldId: "YOUR_SPRING_SLUG_FIELD_ID", // e.g., "fldXXXXXXX"
      operator: "is",
      value: this.config.springSlug
    }
  ]
}

// Lines ~92-95: Update orderBy field ID
orderBy: JSON.stringify([{
  fieldId: "YOUR_CREATED_AT_FIELD_ID", // e.g., "fldXXXXXXX"
  order: "desc"
}])
```

**To find field IDs:**
1. Go to your Teable table
2. Click on a field header
3. Copy the field ID from the field settings

## Step 5: Teable API Query Example with Error Handling

### Fetch Reports with Timeout

```javascript
async fetchReportsWithTimeout() {
  const timeoutMs = 10000; // 10 second timeout
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
  });
  
  const fetchPromise = this.fetchReports();
  return Promise.race([fetchPromise, timeoutPromise]);
}
```

### Safe Data Parsing

```javascript
// Handles null/undefined, validates ranges, logs warnings
transformTeableRecord(record) {
  const fields = record.fields || {};
  return {
    id: record.id || null,
    visitDate: fields.visit_date || null,
    crowdLevel: this.parseCrowdLevel(fields.crowd_level), // Returns null if invalid
    waterTemp: this.parseNumber(fields.water_temp),      // Returns null if NaN
    isOpen: this.parseBoolean(fields.is_open, true),    // Defaults to true
    photoUrl: fields.photo_url || null,
    notes: fields.notes || null,
    createdAt: fields.created_at || null
  };
}
```

### API Response Handling

```javascript
try {
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    // Different errors for different status codes
    if (response.status === 401) {
      throw new Error('Authentication failed');
    } else if (response.status === 403) {
      throw new Error('Access forbidden');
    } else if (response.status === 404) {
      throw new Error('Table not found');
    }
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  if (!data || !Array.isArray(data.records)) {
    console.warn('Unexpected API response:', data);
    return []; // Return empty array instead of crashing
  }
  
  return data.records.map(record => this.transformTeableRecord(record));
  
} catch (error) {
  // Network errors, timeouts, JSON parse errors
  if (error.message === 'Request timeout') {
    throw new Error('Request timed out');
  }
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    throw new Error('Network error');
  }
  throw error;
}
```

## Step 6: Testing Error States

### Test All States

1. **Loading State**
   - Open browser dev tools
   - Throttle network to "Slow 3G"
   - Reload page
   - Should see skeleton loaders

2. **No Reports State**
   - View a spring with no reports
   - Should see: "No recent reports. Be the first!"

3. **API Error State**
   - Temporarily set an invalid API token
   - Reload page
   - Should see: "Conditions temporarily unavailable" + retry button

4. **Timeout State**
   - Block Teable domain in dev tools network tab
   - Reload page
   - Should see: "Request timed out" + retry button

5. **Partial Data State**
   - Submit report with only crowd_level and is_open
   - Should show only those fields, hide water_temp, notes, photo

6. **No JavaScript**
   - Disable JavaScript in browser
   - Should see noscript fallback message

### Expected Behavior

| Scenario | Last Verified | Reports Section | Button |
|----------|--------------|-----------------|--------|
| **No reports** | "Not recently verified" | Empty state message | ✅ Enabled |
| **API error** | "Not recently verified" | Error + retry button | ✅ Enabled |
| **Loading** | "Loading..." | Skeleton loader | ❌ Disabled |
| **Has reports** | "3 hours ago" | Report cards | ✅ Enabled |
| **Timeout** | "Not recently verified" | Error + retry button | ✅ Enabled |

## Step 7: Error Handling Best Practices

### In Production

1. **Monitor console** in dev tools - only warnings/errors, not user-facing
2. **Test with ad blockers** - ensure Teable requests aren't blocked
3. **Test on slow networks** - skeleton loader should show quickly
4. **Check mobile** - responsive design works on all screen sizes
5. **Verify retry button** - clicking it reloads data successfully

### Graceful Degradation

If Teable is down or misconfigured:
- ✅ Page still loads
- ✅ Other widgets (weather, map) still work
- ✅ Report button still clickable
- ✅ Users see "Conditions temporarily unavailable"
- ✅ No JS errors break the page

### Null Safety Examples

```javascript
// Safe property access
const waterTemp = fields.water_temp || null;
const hasPhoto = fields.photo_url && fields.photo_url.trim() !== '';

// Safe parsing
parseCrowdLevel(value) {
  if (!value) return null;
  const num = parseInt(value, 10);
  return (isNaN(num) || num < 1 || num > 5) ? null : num;
}

// Safe date formatting
formatTimeAgo(dateString) {
  try {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    // ... rest of logic
  } catch {
    return 'Unknown';
  }
}

// Safe HTML creation
createReportHTML(report) {
  try {
    // All operations wrapped in try/catch
    return htmlString;
  } catch (error) {
    console.warn('Error creating HTML:', error);
    return ''; // Return empty string instead of crashing
  }
}
```

## Customization

### Change Error Messages

Edit `static/js/conditions-feed.js`:

```javascript
// Line ~154-180: Update error messages
const messages = {
  'api-error': {
    title: 'Conditions temporarily unavailable',
    message: 'Unable to load recent reports. Please try refreshing the page.',
    showFallback: true
  },
  'timeout': {
    title: 'Request timed out',
    message: 'The server is taking too long to respond.',
    showFallback: true
  }
};
```

### Customize Loading Skeleton

```css
/* In conditions-feed.html */
.skeleton-loader {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  /* Add more skeleton styles as needed */
}
```

### Show More/Fewer Reports

```javascript
// Line ~14: Change max reports
maxReports: config.maxReports || 10, // Show 10 instead of 5
```

## Security & Privacy

⚠️ **Important**:
- Never commit `.env` to git (already in `.gitignore`)
- Use read-only API token for public-facing pages
- Consider rate limiting on the Teable API
- Photo URLs should be from trusted sources
- Validate and sanitize all user input server-side
- Test for XSS vulnerabilities in notes/fields

## Performance

- **10-second timeout** prevents page hang
- **Skeleton loader** shows immediately
- **Error states** render on failure
- **No blocking** - async/await doesn't block page load
- **Lazy loading** - widget initializes after DOM ready
- **Efficient** - only fetches last 5 reports, sorted by date

## Browser Compatibility

Works in all modern browsers:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Samsung Internet 14+

**Note**: Requires `fetch` API and arrow functions (no IE11 support without polyfills)

## Final Checklist

Before going live:

- [ ] Reports table created in Teable
- [ ] All field types configured correctly
- [ ] Crowd level options set (1-5)
- [ ] Share form created and tested
- [ ] Form URL added to conditions-feed.js
- [ ] Reports table ID added to conditions-feed.js
- [ ] Field IDs updated in conditions-feed.js
- [ ] API token configured in .env
- [ ] Tested all 6 error states
- [ ] Verified responsive on mobile
- [ ] Tested report submission flow
- [ ] Checked console for warnings
- [ ] Verified fallback UI shows when appropriate

## Support

- Teable API Docs: https://help.teable.io/en/articles/9356083-api
- JavaScript fetch: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- Error handling: https://javascript.info/try-catch
- Null safety: https://developer.mozilla.org/en-US/docs/Glossary/Nullish

**The Live Conditions Feed is now production-ready with full error handling!** 🎉
