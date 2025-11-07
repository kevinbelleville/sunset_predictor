import { NextRequest, NextResponse } from 'next/server';
import SunCalc from 'suncalc';

// Import the scoring algorithm from predict route
function gaussianScore(distance: number, sigma: number = 1.0): number {
  return Math.exp(-(distance ** 2) / (2 * sigma ** 2));
}

function scoreSunset(
  cloud_cover: number,
  cloud_low: number,
  cloud_mid: number,
  cloud_high: number,
  humidity: number,
  visibility: number,
  pm2_5: number,
  pm10: number,
  aod: number
): number {
  // Cloud score
  const cloud_coverage_score = gaussianScore(Math.abs(cloud_cover - 50), 20) * 100;
  const cloud_quality = (cloud_mid + cloud_high) / 2 - cloud_low;
  const cloud_type_score = (1.0 / (1.0 + Math.exp(-cloud_quality / 20))) * 100;
  const cloud_score = (cloud_coverage_score + cloud_type_score) / 2;

  // Particle score
  const pm_score = gaussianScore(Math.abs(pm2_5 - 15), 35) * 100;
  const aod_score = aod < 0.05 ? 30 : gaussianScore(Math.abs(aod - 0.3), 0.4) * 100;
  const size_ratio = pm2_5 > 0 ? pm10 / pm2_5 : 0;
  const size_score = 2.0 <= size_ratio && size_ratio <= 3.5 ? 100 : pm2_5 > 0 ? 70 : 50;
  const particle_score = pm_score * 0.5 + aod_score * 0.4 + size_score * 0.1;

  // Humidity score
  const humidity_score = gaussianScore(Math.abs(humidity - 60), 20) * 100;

  // Visibility score
  const visibility_score =
    visibility < 5000
      ? (visibility / 5000) * 100
      : Math.min(100, (visibility / 10000) * 100);

  // Weighted average
  const base_score =
    cloud_score * 0.4 +
    particle_score * 0.3 +
    visibility_score * 0.2 +
    humidity_score * 0.1;

  // Critical component ceiling
  let cloud_ceiling = 100;
  if (cloud_cover < 10) cloud_ceiling = 30;
  else if (cloud_cover < 25) cloud_ceiling = 50;

  let particle_ceiling = 100;
  if (pm2_5 > 75 || aod > 1.5) particle_ceiling = 40;
  else if (pm2_5 > 55 || aod > 1.0) particle_ceiling = 60;

  const ceiling = Math.min(cloud_ceiling, particle_ceiling);
  const final_score = Math.min(base_score, ceiling);

  return Math.max(0, Math.min(100, final_score));
}

interface TimelineDataPoint {
  date: string;
  sunset_time: string;
  score: number;
  rating: string;
  data_type: 'historical' | 'current' | 'forecast';
  factors: {
    cloud_cover: number;
    cloud_low: number;
    cloud_mid: number;
    cloud_high: number;
    humidity: number;
    visibility: number;
    pm2_5: number;
    pm10: number;
    aod: number;
  };
}

async function fetchTimelineData(
  lat: number,
  lng: number,
  pastDays: number = 7,
  forecastDays: number = 3
): Promise<TimelineDataPoint[]> {
  // OPTIMIZED: Single API call with past_days and forecast_days parameters
  // This fetches historical + current + forecast data in ONE request per API
  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
  weatherUrl.searchParams.set('latitude', lat.toString());
  weatherUrl.searchParams.set('longitude', lng.toString());
  weatherUrl.searchParams.set('daily', 'sunrise,sunset');
  weatherUrl.searchParams.set('hourly', 'relative_humidity_2m,visibility,cloud_cover_low,cloud_cover_mid,cloud_cover_high,cloud_cover');
  weatherUrl.searchParams.set('timezone', 'auto');
  weatherUrl.searchParams.set('past_days', pastDays.toString());
  weatherUrl.searchParams.set('forecast_days', forecastDays.toString());

  const airQualityUrl = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  airQualityUrl.searchParams.set('latitude', lat.toString());
  airQualityUrl.searchParams.set('longitude', lng.toString());
  airQualityUrl.searchParams.set('hourly', 'pm10,pm2_5,aerosol_optical_depth');
  airQualityUrl.searchParams.set('timezone', 'auto');
  airQualityUrl.searchParams.set('past_days', pastDays.toString());
  airQualityUrl.searchParams.set('forecast_days', forecastDays.toString());

  // Only 2 API calls for entire timeline!
  const [weatherRes, airRes] = await Promise.all([
    fetch(weatherUrl.toString()),
    fetch(airQualityUrl.toString()),
  ]);

  if (!weatherRes.ok || !airRes.ok) {
    throw new Error('Failed to fetch timeline data from APIs');
  }

  const weatherData = await weatherRes.json();
  const airData = await airRes.json();

  // Process each day's data
  const timeline: TimelineDataPoint[] = [];
  const ratings = ['Poor', 'Fair', 'Good', 'Great', 'Amazing'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sunsetTimes = weatherData.daily.sunset;
  const hourlyTimes = weatherData.hourly.time.map((t: string) => new Date(t));

  for (let dayIdx = 0; dayIdx < sunsetTimes.length; dayIdx++) {
    const sunsetTime = new Date(sunsetTimes[dayIdx]);
    const sunsetHour = sunsetTime.getHours();

    // Find the hourly index for this day's sunset
    const dayStartIdx = dayIdx * 24;
    let sunsetIndex = dayStartIdx;

    // Find the hour closest to sunset time
    for (let i = 0; i < 24 && dayStartIdx + i < hourlyTimes.length; i++) {
      if (hourlyTimes[dayStartIdx + i].getHours() === sunsetHour) {
        sunsetIndex = dayStartIdx + i;
        break;
      }
    }

    // Extract data at sunset time
    const cloud_cover = weatherData.hourly.cloud_cover[sunsetIndex] ?? 0;
    const cloud_low = weatherData.hourly.cloud_cover_low[sunsetIndex] ?? 0;
    const cloud_mid = weatherData.hourly.cloud_cover_mid[sunsetIndex] ?? 0;
    const cloud_high = weatherData.hourly.cloud_cover_high[sunsetIndex] ?? 0;
    const humidity = weatherData.hourly.relative_humidity_2m[sunsetIndex] ?? 0;
    const visibility = weatherData.hourly.visibility[sunsetIndex] ?? 0;
    const pm2_5 = airData.hourly.pm2_5[sunsetIndex] ?? 0;
    const pm10 = airData.hourly.pm10[sunsetIndex] ?? 0;
    const aod = airData.hourly.aerosol_optical_depth[sunsetIndex] ?? 0;

    // Calculate score
    const score = scoreSunset(
      cloud_cover,
      cloud_low,
      cloud_mid,
      cloud_high,
      humidity,
      visibility,
      pm2_5,
      pm10,
      aod
    );

    const rating = ratings[Math.floor(score / 20)];

    // Determine data type
    const sunsetDate = new Date(sunsetTime);
    sunsetDate.setHours(0, 0, 0, 0);

    let data_type: 'historical' | 'current' | 'forecast';
    if (sunsetDate < today) {
      data_type = 'historical';
    } else if (sunsetDate.getTime() === today.getTime()) {
      data_type = 'current';
    } else {
      data_type = 'forecast';
    }

    timeline.push({
      date: sunsetDate.toISOString().split('T')[0],
      sunset_time: sunsetTime.toISOString(),
      score: Math.round(score),
      rating,
      data_type,
      factors: {
        cloud_cover,
        cloud_low,
        cloud_mid,
        cloud_high,
        humidity,
        visibility,
        pm2_5,
        pm10,
        aod,
      },
    });
  }

  return timeline;
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng, past_days, forecast_days } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      );
    }

    const pastDays = past_days ?? 7;
    const forecastDays = forecast_days ?? 3;

    // Validate parameters
    if (pastDays < 0 || pastDays > 92) {
      return NextResponse.json(
        { error: 'past_days must be between 0 and 92' },
        { status: 400 }
      );
    }

    if (forecastDays < 0 || forecastDays > 16) {
      return NextResponse.json(
        { error: 'forecast_days must be between 0 and 16' },
        { status: 400 }
      );
    }

    // Fetch timeline (only 2 API calls!)
    const timeline = await fetchTimelineData(lat, lng, pastDays, forecastDays);

    return NextResponse.json({
      timeline,
      meta: {
        total_days: timeline.length,
        api_calls_used: 2, // Only 2 calls for entire timeline!
        past_days: pastDays,
        forecast_days: forecastDays,
      },
    });
  } catch (error) {
    console.error('Timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to generate timeline' },
      { status: 500 }
    );
  }
}
