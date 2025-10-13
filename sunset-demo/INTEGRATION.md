# Sunset Predictor Demo Site

A Next.js React application for displaying sunset quality predictions based on atmospheric conditions.

## Features Implemented

✅ **Three Location Input Methods:**
- Browser geolocation (auto-detect)
- Manual lat/lng input
- City search with geocoding (OpenStreetMap Nominatim)

✅ **Real-time Predictions:**
- Fetches weather and air quality data from Open-Meteo APIs
- Calculates sunset scores using Gaussian distributions
- Shows sunset time and golden hour

✅ **Visualization:**
- Sun position arc throughout the day
- Current sun position indicator
- Golden hour time ranges

✅ **Factor Breakdown:**
- Cloud coverage (low/mid/high)
- Air quality (PM2.5, PM10, AOD)
- Visibility and humidity
- Score calculation explanation

## Current Implementation

The app currently uses:
- **Direct API calls** to Open-Meteo for weather/AQI data
- **Client-side scoring algorithm** (JavaScript port of your Python logic)
- **SunCalc library** for sun position calculations

## Connecting to Your Backend

You have 3 options to integrate your Python backend and PostgreSQL database:

### Option 1: PostgreSQL Direct Connection (Recommended)

Replace `app/api/predict/route.ts` with a direct database query:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();
    
    // Query your predictions table
    const result = await pool.query(
      `SELECT score, sunset_time, cloud_cover, aqi, visibility, 
              pm25, pm10, humidity, cloud_low, cloud_mid, cloud_high, aod
       FROM predictions 
       WHERE latitude = $1 AND longitude = $2 
         AND date = CURRENT_DATE
       ORDER BY created_at DESC 
       LIMIT 1`,
      [lat, lng]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No prediction available for this location' },
        { status: 404 }
      );
    }
    
    const data = result.rows[0];
    const ratings = ['Poor', 'Fair', 'Good', 'Great', 'Amazing'];
    const rating = ratings[Math.floor(data.score / 20)];
    
    return NextResponse.json({
      score: data.score,
      rating,
      sunset_time: data.sunset_time,
      factors: {
        cloud_cover: data.cloud_cover,
        cloud_low: data.cloud_low,
        cloud_mid: data.cloud_mid,
        cloud_high: data.cloud_high,
        humidity: data.humidity,
        visibility: data.visibility,
        pm2_5: data.pm25,
        pm10: data.pm10,
        aod: data.aod,
      },
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction' },
      { status: 500 }
    );
  }
}
```

Install pg: `npm install pg @types/pg`

Add to `.env.local`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/sunset_db
```

### Option 2: Python API Proxy

If you create a Flask/FastAPI endpoint, proxy through Next.js:

```typescript
// app/api/predict/route.ts
export async function POST(request: NextRequest) {
  const { lat, lng } = await request.json();
  
  const response = await fetch('http://localhost:5000/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng, date: new Date().toISOString().split('T')[0] }),
  });
  
  return NextResponse.json(await response.json());
}
```

### Option 3: Keep Current Implementation

The app works as-is! It:
- Fetches real Open-Meteo data
- Runs your scoring algorithm in JavaScript
- Returns predictions without needing your backend

**Pros:** No backend setup, works immediately
**Cons:** Doesn't use your historical data or PostgreSQL database

## Running the App

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Database Schema (for reference)

Your predictions table likely looks like:

```sql
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  score INTEGER NOT NULL,
  sunset_time TIMESTAMP NOT NULL,
  cloud_cover FLOAT,
  cloud_low FLOAT,
  cloud_mid FLOAT,
  cloud_high FLOAT,
  aqi INTEGER,
  pm25 FLOAT,
  pm10 FLOAT,
  visibility FLOAT,
  humidity FLOAT,
  aod FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Modifying the Scoring Algorithm

The JavaScript implementation in `app/api/predict/route.ts` matches your Python logic:

- Gaussian distributions for optimal ranges
- Weighted factors (clouds 40%, particles 30%, visibility 20%, humidity 10%)
- Critical component ceilings for extreme conditions

If you tweak your Python algorithm, update the `scoreSunset()` function to match.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **SunCalc** (sun position calculations)
- **Lucide React** (icons)
- **Open-Meteo API** (weather/AQI data)
- **Nominatim** (geocoding)

## File Structure

```
app/
├── api/
│   └── predict/
│       └── route.ts          # API endpoint (scoring logic)
├── components/
│   ├── LocationInput.tsx     # 3 input methods
│   ├── PredictionResult.tsx  # Score display & factors
│   └── SunVisualization.tsx  # Sun arc visualization
├── types.ts                  # TypeScript interfaces
├── page.tsx                  # Main page layout
└── layout.tsx                # Root layout

```

## Next Steps

1. Choose your backend integration option (1, 2, or 3)
2. Update `app/api/predict/route.ts` accordingly
3. Add environment variables if using database
4. Test with your actual PostgreSQL data
5. Deploy to Vercel or your preferred platform

## Questions?

- Does the response structure match your data?
- Do you want to modify the scoring weights?
- Need help setting up the PostgreSQL connection?
