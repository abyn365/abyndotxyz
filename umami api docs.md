# Umami Analytics Integration Guide

This guide explains how to integrate Umami Analytics into your personal bio website to track visitor statistics.

## 📋 What is Umami?

Umami is a simple, fast, privacy-focused alternative to Google Analytics. It provides:
- Website analytics without cookies
- GDPR and CCPA compliant
- Open source and self-hostable
- Simple, clean interface
- Custom event tracking

## 🚀 Setup Instructions

### Option 1: Use a Hosted Umami Instance

1. Sign up for a hosted Umami service (e.g., [Umami Cloud](https://umami.is/pricing))
2. Create a website in your dashboard
3. Copy the **Website ID**

### Option 2: Self-Host Umami (Recommended)

#### Step 1: Deploy Umami

Choose one of these deployment methods:

**Vercel:**
```bash
# Clone the Umami repository
git clone https://github.com/umami-software/umami.git
cd umami

# Install dependencies
npm install

# Set up database (use Vercel Postgres or your own)
# See https://umami.is/docs/install for details

# Deploy to Vercel
vercel deploy
```

**Docker:**
```bash
docker run -d \
  --name umami \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:port/database \
  ghcr.io/umami-software/umami:postgresql-latest
```

**Railway/Render/Other:**
Follow the [official Umami installation guide](https://umami.is/docs/install)

#### Step 2: Configure Umami

1. Access your Umami dashboard (usually `http://your-domain.com`)
2. Log in with the default credentials (check installation guide)
3. Create a new website
4. Copy the **Website ID**

## ⚙️ Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_URL=https://your-umami-instance.com
```

### Update Tracking Code

The tracking code should be added in `pages/_document.tsx` or `pages/_app.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://your-umami-instance.com/script.js"
          data-website-id="your-website-id"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## 📊 Using Umami API

This project includes an API route to fetch visitor statistics from Umami.

### API Endpoint: `/api/visitor-stats`

This endpoint fetches:
- Active users (last 5 minutes)
- Page views
- Unique visitors

### Implementation

The code is in `pages/api/visitor-stats.ts`:

```typescript
export default async function handler(req, res) {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
  const authToken = process.env.UMAMI_AUTH_TOKEN; // Optional, if your instance requires auth

  // Fetch active users
  const activeResponse = await fetch(
    `${umamiUrl}/api/websites/${websiteId}/active`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );
  const activeData = await activeResponse.json();

  // Fetch page views
  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000; // Last 30 days

  const statsResponse = await fetch(
    `${umamiUrl}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );
  const statsData = await statsResponse.json();

  return res.status(200).json({
    active: activeData.x || 0,
    pageviews: statsData.pageviews?.value || 0,
    uniques: statsData.visitors?.value || 0,
  });
}
```

### Displaying Stats in Your Website

The `components/Misc/VisitorStats.misc.tsx` component displays visitor statistics:

```typescript
const VisitorStats = () => {
  const [stats, setStats] = useState({ active: 0, pageviews: 0, uniques: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/visitor-stats');
      const data = await response.json();
      setStats(data);
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="bg-zinc-900/90 rounded-full px-2 py-1">
        <span className="text-xs text-zinc-300">
          👁️ {stats.active} online
        </span>
      </div>
    </div>
  );
};
```

## 📚 Umami API Documentation

### Base URL

```
https://your-umami-instance.com/api
```

### Authentication

Most endpoints require authentication. Add an Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${authToken}`,
}
```

### Endpoints

#### 1. Get Active Users

```
GET /api/websites/:websiteId/active
```

Returns the number of active users in the last 5 minutes.

**Response:**
```json
{
  "x": 5
}
```

#### 2. Get Website Stats

```
GET /api/websites/:websiteId/stats
```

Returns summarized statistics.

**Parameters:**
- `startAt` (required): Start timestamp in milliseconds
- `endAt` (required): End timestamp in milliseconds

**Example:**
```
GET /api/websites/abc123/stats?startAt=1656679719687&endAt=1656766119687
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

#### 3. Get Page Views

```
GET /api/websites/:websiteId/pageviews
```

Returns page views over time.

**Parameters:**
- `startAt` (required): Start timestamp
- `endAt` (required): End timestamp
- `unit` (optional): Time unit (year | month | hour | day)
- `timezone` (optional): Timezone (e.g., America/Los_Angeles)

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

#### 4. Get Metrics

```
GET /api/websites/:websiteId/metrics
```

Returns specific metrics.

**Parameters:**
- `startAt` (required): Start timestamp
- `endAt` (required): End timestamp
- `type` (required): Metric type (url | referrer | browser | os | device | country | event)
- `limit` (optional): Maximum results (default: 500)

**Response:**
```json
[
  { "x": "/", "y": 46 },
  { "x": "/docs", "y": 17 },
  { "x": "/music", "y": 14 }
]
```

#### 5. Get Events

```
GET /api/websites/:websiteId/events/series
```

Returns custom events.

**Parameters:**
- `startAt` (required): Start timestamp
- `endAt` (required): End timestamp
- `unit` (optional): Time unit
- `timezone` (optional): Timezone

**Response:**
```json
[
  { "x": "live-demo-button", "t": "2023-04-12T22:00:00Z", "y": 1 },
  { "x": "get-started-button", "t": "2023-04-12T22:00:00Z", "y": 5 }
]
```

## 🎨 Customizing the Stats Display

### Change Position

The stats are displayed in `pages/index.tsx` around line 162. You can move it:

```tsx
{/* Move this to different location */}
<VisitorStats />
```

### Add More Metrics

Update `pages/api/visitor-stats.ts` to fetch more data:

```typescript
// Fetch bounces, sessions, etc.
return res.status(200).json({
  active: activeData.x || 0,
  pageviews: statsData.pageviews?.value || 0,
  uniques: statsData.visitors?.value || 0,
  bounces: statsData.bounces?.value || 0,
  sessions: statsData.visits?.value || 0,
});
```

### Custom Styling

Update `components/Misc/VisitorStats.misc.tsx` to change the appearance.

## 🐛 Troubleshooting

### Stats Not Showing

**Problem:** The visitor statistics aren't displaying.

**Solutions:**
1. Check if your environment variables are set correctly
2. Verify your Umami URL is accessible
3. Check if your website ID is correct
4. Look for errors in the browser console
5. Ensure your Umami instance is running

### API Authentication Errors

**Problem:** You're getting 401 Unauthorized errors.

**Solutions:**
1. Check if your auth token is valid
2. Verify the token has the correct permissions
3. Ensure the Authorization header is formatted correctly

### CORS Errors

**Problem:** Browser blocks requests to Umami API.

**Solutions:**
1. Configure CORS on your Umami instance
2. Use Next.js API routes as a proxy (as this project does)
3. Ensure your Umami URL allows cross-origin requests

### No Data in Dashboard

**Problem:** Umami isn't tracking visitors.

**Solutions:**
1. Verify the tracking script is installed correctly
2. Check if your website URL matches the one in Umami
3. Ensure you're not using an ad blocker
4. Check browser console for script errors

## 📊 Best Practices

1. **Refresh Rate**: Don't fetch stats too frequently (30 seconds is reasonable)
2. **Caching**: Consider caching API responses to reduce load
3. **Error Handling**: Always handle API errors gracefully
4. **Privacy**: Don't display sensitive visitor information
5. **GDPR/CCPA**: Ensure you comply with privacy regulations

## 🔒 Privacy Considerations

Umami is designed to be privacy-focused:
- No cookies are used
- No personal data is collected
- IP addresses are anonymized
- GDPR and CCPA compliant

However, you should still:
- Add a privacy policy to your website
- Inform visitors about analytics
- Provide an opt-out option if needed

## 📚 Additional Resources

- [Umami Documentation](https://umami.is/docs)
- [Umami GitHub Repository](https://github.com/umami-software/umami)
- [Umami Cloud](https://umami.is/pricing)
- [Installation Guide](https://umami.is/docs/install)

## 🤝 Support

If you need help:
1. Check the [Umami Documentation](https://umami.is/docs)
2. Visit the [Umami Discord Server](https://discord.gg/4dkCQkzJhG)
3. Create an issue on [GitHub](https://github.com/abyn365/abyndotxyz/issues)

## 📝 Credits

- [Umami](https://umami.is) by Umami Software
- Template based on [personal-bio](https://github.com/lrmn7/personal-bio) by lrmn7
- Integration by [abyn](https://abyn.xyz)

---

**This integration is part of the [abyndotxyz](https://github.com/abyn365/abyndotxyz) personal bio template.**
