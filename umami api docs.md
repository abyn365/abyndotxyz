# Umami Analytics Integration

This documentation covers the Umami Analytics API endpoints and how this project uses them to display visitor statistics.

## What is Umami?

Umami is a simple, fast, privacy-focused alternative to Google Analytics. This project uses the Umami API to fetch and display real-time visitor statistics on your bio page.

## How This Project Uses Umami

The visitor stats widget (`components/Misc/VisitorStats.misc.tsx`) displays:
- **Active Users:** Number of visitors in the last 5 minutes
- **Pageviews:** Total page views today
- **Unique Visitors:** Unique visitors today

Data is fetched via `pages/api/visitor-stats.ts` and updates every 30 seconds.

## Setup

### Required Environment Variables

```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_website_id
NEXT_PUBLIC_UMAMI_API_KEY=your_api_key
```

### Getting Your Credentials

1. **Set up Umami:**
   - Sign up at [umami.is](https://umami.is) or self-host
   - Create a new website in your dashboard

2. **Get Website ID:**
   - Go to your website settings
   - Copy the Website ID

3. **Generate API Key:**
   - Go to **Settings** → **API Keys**
   - Create a new API key
   - Copy the key

## API Endpoints

### Base URL

```
https://api.umami.is/v1
```

If self-hosting, replace with your domain:
```
https://your-umami-domain.com/api
```

## Endpoints Reference

### 1. Active Users

Get the number of active users on a website.

**Endpoint:**
```
GET /api/websites/:websiteId/active
```

**Parameters:** None

**Example:**
```typescript
const response = await fetch(
  'https://api.umami.is/v1/websites/86d4095c-a2a8-4fc8-9521-103e858e2b41/active',
  {
    headers: {
      'Accept': 'application/json',
      'x-umami-api-key': 'your-api-key'
    }
  }
);
```

**Response:**
```json
{
  "x": 5
}
```

`x`: Number of unique visitors within the last 5 minutes

---

### 2. Website Statistics

Get summarized website statistics for a time range.

**Endpoint:**
```
GET /api/websites/:websiteId/stats
```

**Parameters:**
- `startAt` (required): Timestamp (ms) of start date
- `endAt` (required): Timestamp (ms) of end date
- `url` (optional): Filter by URL
- `referrer` (optional): Filter by referrer
- `title` (optional): Filter by page title
- `host` (optional): Filter by hostname
- `os` (optional): Filter by OS
- `browser` (optional): Filter by browser
- `device` (optional): Filter by device (e.g., "Mobile")
- `country` (optional): Filter by country
- `region` (optional): Filter by region/state/province
- `city` (optional): Filter by city

**Example:**
```typescript
const now = new Date();
const startAt = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  0, 0, 0, 0
).getTime();

const endAt = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  23, 59, 59, 999
).getTime();

const response = await fetch(
  `https://api.umami.is/v1/websites/86d4095c-a2a8-4fc8-9521-103e858e2b41/stats?startAt=${startAt}&endAt=${endAt}`,
  {
    headers: {
      'Accept': 'application/json',
      'x-umami-api-key': 'your-api-key'
    }
  }
);
```

**Response:**
```json
{
  "pageviews": { "value": 3018, "prev": 3508 },
  "visitors": { "value": 847, "prev": 910 },
  "visits": { "value": 984, "prev": 1080 },
  "bounces": { "value": 537, "prev": 628 },
  "totaltime": { "value": 150492, "prev": 164713 }
}
```

**Fields:**
- `pageviews`: Total page hits
- `visitors`: Number of unique visitors
- `visits`: Number of sessions
- `bounces`: Visitors who only viewed one page
- `totaltime`: Total time spent on website

---

### 3. Pageviews

Get pageview data over time for a specific time range.

**Endpoint:**
```
GET /api/websites/:websiteId/pageviews
```

**Parameters:**
- `startAt` (required): Timestamp (ms) of start date
- `endAt` (required): Timestamp (ms) of end date
- `unit` (required): Time unit (`year` | `month` | `hour` | `day`)
- `timezone` (optional): Timezone (e.g., "America/Los_Angeles")
- `url` (optional): Filter by URL
- `referrer` (optional): Filter by referrer
- `title` (optional): Filter by page title
- `host` (optional): Filter by hostname
- `os` (optional): Filter by OS
- `browser` (optional): Filter by browser
- `device` (optional): Filter by device
- `country` (optional): Filter by country
- `region` (optional): Filter by region
- `city` (optional): Filter by city

**Example:**
```typescript
const response = await fetch(
  `https://api.umami.is/v1/websites/86d4095c-a2a8-4fc8-9521-103e858e2b41/pageviews?startAt=${startAt}&endAt=${endAt}&unit=day`,
  {
    headers: {
      'Accept': 'application/json',
      'x-umami-api-key': 'your-api-key'
    }
  }
);
```

**Response:**
```json
{
  "pageviews": [
    { "x": "2020-04-20 01:00:00", "y": 3 },
    { "x": "2020-04-20 02:00:00", "y": 7 }
  ],
  "sessions": [
    { "x": "2020-04-20 01:00:00", "y": 2 },
    { "x": "2020-04-20 02:00:00", "y": 4 }
  ]
}
```

`x`: Timestamp
`y`: Number of visitors

---

### 4. Events

Get event data within a time range.

**Endpoint:**
```
GET /api/websites/:websiteId/events/series
```

**Parameters:**
- `startAt` (required): Timestamp (ms) of start date
- `endAt` (required): Timestamp (ms) of end date
- `unit` (required): Time unit (`year` | `month` | `hour` | `day`)
- `timezone` (optional): Timezone
- `url` (optional): Filter by URL
- `referrer` (optional): Filter by referrer
- `title` (optional): Filter by page title
- `host` (optional): Filter by hostname
- `os` (optional): Filter by OS
- `browser` (optional): Filter by browser
- `device` (optional): Filter by device
- `country` (optional): Filter by country
- `region` (optional): Filter by region
- `city` (optional): Filter by city

**Example:**
```typescript
const response = await fetch(
  `https://api.umami.is/v1/websites/86d4095c-a2a8-4fc8-9521-103e858e2b41/events/series?startAt=${startAt}&endAt=${endAt}&unit=hour&timezone=America/Los_Angeles`,
  {
    headers: {
      'Accept': 'application/json',
      'x-umami-api-key': 'your-api-key'
    }
  }
);
```

**Response:**
```json
[
  { "x": "live-demo-button", "t": "2023-04-12T22:00:00Z", "y": 1 },
  { "x": "get-started-button", "t": "2023-04-12T22:00:00Z", "y": 5 }
]
```

`x`: Event name
`t`: Timestamp
`y`: Number of events

---

### 5. Metrics

Get metrics data for various dimensions.

**Endpoint:**
```
GET /api/websites/:websiteId/metrics
```

**Parameters:**
- `type` (required): Metrics type (`url` | `referrer` | `browser` | `os` | `device` | `country` | `event`)
- `startAt` (required): Timestamp (ms) of start date
- `endAt` (required): Timestamp (ms) of end date
- `limit` (optional, default 500): Number of results
- `url` (optional): Filter by URL
- `referrer` (optional): Filter by referrer
- `title` (optional): Filter by page title
- `host` (optional): Filter by hostname
- `os` (optional): Filter by OS
- `browser` (optional): Filter by browser
- `device` (optional): Filter by device
- `country` (optional): Filter by country
- `region` (optional): Filter by region
- `city` (optional): Filter by city
- `language` (optional): Filter by language
- `event` (optional): Filter by event

**Example:**
```typescript
const response = await fetch(
  `https://api.umami.is/v1/websites/86d4095c-a2a8-4fc8-9521-103e858e2b41/metrics?type=url&startAt=${startAt}&endAt=${endAt}`,
  {
    headers: {
      'Accept': 'application/json',
      'x-umami-api-key': 'your-api-key'
    }
  }
);
```

**Response:**
```json
[
  { "x": "/", "y": 46 },
  { "x": "/docs", "y": 17 },
  { "x": "/download", "y": 14 }
]
```

`x`: Unique value (depends on metric type)
`y`: Number of visitors

---

## Unit Parameter

The `unit` parameter buckets data into time intervals:

| Unit   | Time Range    | Description |
|--------|---------------|-------------|
| `minute` | Up to 60 minutes | Per-minute data |
| `hour`   | Up to 48 hours   | Per-hour data |
| `day`    | Up to 12 months  | Per-day data |
| `month`  | No limit        | Per-month data |
| `year`   | No limit        | Per-year data |

The unit is automatically converted to the next largest applicable unit if the maximum is exceeded.

---

## Implementation in This Project

### API Route

`pages/api/visitor-stats.ts`:

```typescript
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const API_KEY = process.env.NEXT_PUBLIC_UMAMI_API_KEY;

export default async function handler(req, res) {
  // Get today's start and end timestamps
  const now = new Date();
  const startAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, 0, 0, 0
  ).getTime();

  const endAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23, 59, 59, 999
  ).getTime();

  // Fetch active users
  const activeResponse = await fetch(
    `https://api.umami.is/v1/websites/${WEBSITE_ID}/active`,
    {
      headers: {
        'Accept': 'application/json',
        'x-umami-api-key': API_KEY,
      },
    }
  );

  // Fetch today's stats
  const statsResponse = await fetch(
    `https://api.umami.is/v1/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`,
    {
      headers: {
        'Accept': 'application/json',
        'x-umami-api-key': API_KEY,
      },
    }
  );

  // Return combined data
  return res.status(200).json({
    active: activeData.visitors ?? activeData.active ?? 0,
    pageviews: statsData.pageviews.value ?? 0,
    uniques: statsData.visitors.value ?? 0,
  });
}
```

### Component

`components/Misc/VisitorStats.misc.tsx`:

```typescript
useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch('/api/visitor-stats');
    const data = await response.json();
    setStats(data);
  };

  fetchStats();
  const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
  return () => clearInterval(interval);
}, []);
```

### Display

The stats are displayed in a small widget with:
- Active users (green icon)
- Pageviews (eye icon)
- Unique visitors (user icon)

---

## Error Handling

The API route includes error handling to gracefully handle failures:

```typescript
try {
  // Fetch data...
} catch (error) {
  console.error("Visitor API Error:", error);
  return res.status(200).json({
    active: 0,
    pageviews: 0,
    uniques: 0,
  });
}
```

If the API fails, the widget simply hides (returns `null`) rather than showing errors.

---

## Best Practices

### 1. Caching

Consider caching API responses to reduce calls:

```typescript
// Cache for 60 seconds
res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate');
```

### 2. Rate Limiting

Umami may have rate limits. Handle them gracefully:

```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('retry-after');
  // Wait and retry...
}
```

### 3. Error Fallbacks

Always provide fallback values so your site doesn't break:

```typescript
const active = data?.x ?? 0;
const pageviews = data?.pageviews?.value ?? 0;
```

---

## Privacy

Umami is designed to be privacy-focused:

- No personal data is collected
- No cookies are used for tracking
- All data is anonymized
- GDPR compliant

---

## Resources

- [Umami Documentation](https://umami.is/docs)
- [Umami GitHub](https://github.com/umami-software/umami)
- [Umami Cloud](https://umami.is)
- [Self-hosting Guide](https://umami.is/docs/install)

---

## Support

- [Umami Discord](https://discord.gg/4heN39kDQK)
- [GitHub Issues](https://github.com/umami-software/umami/issues)
- [Documentation](https://umami.is/docs)

---

**Note:** This project uses the Umami API to fetch statistics. The actual tracking script should be added to your site's HTML for data collection. See the Umami documentation for integration details.
