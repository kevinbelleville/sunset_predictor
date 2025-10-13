import { NextRequest, NextResponse } from 'next/server';
import SunCalc from 'suncalc';

// This is a mock implementation - you'll replace this with:
// 1. Direct PostgreSQL query to your predictions table
// 2. OR a call to a Python Flask/FastAPI endpoint
// 3. OR call Open-Meteo APIs directly and run your scoring algorithm

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

async function fetchWeatherData(lat: number, lng: number) {
  // Call Open-Meteo APIs
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunrise,sunset&hourly=relative_humidity_2m,visibility,cloud_cover_low,cloud_cover_mid,cloud_cover_high,cloud_cover&timezone=auto&forecast_days=1`;
  
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm10,pm2_5,aerosol_optical_depth&timezone=auto&forecast_days=1`;

  const [weatherRes, airRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(airQualityUrl)
  ]);

  const weatherData = await weatherRes.json();
  const airData = await airRes.json();

  // Get sunset time using SunCalc
  const today = new Date();
  const sunTimes = SunCalc.getTimes(today, lat, lng);
  const sunsetHour = sunTimes.sunset.getHours();

  // Find the index for sunset hour
  const hourlyTimes = weatherData.hourly.time.map((t: string) => new Date(t));
  const sunsetIndex = hourlyTimes.findIndex((t: Date) => t.getHours() === sunsetHour);

  if (sunsetIndex === -1) {
    throw new Error('Could not find sunset time in forecast data');
  }

  return {
    sunset_time: sunTimes.sunset,
    cloud_cover: weatherData.hourly.cloud_cover[sunsetIndex] || 0,
    cloud_low: weatherData.hourly.cloud_cover_low[sunsetIndex] || 0,
    cloud_mid: weatherData.hourly.cloud_cover_mid[sunsetIndex] || 0,
    cloud_high: weatherData.hourly.cloud_cover_high[sunsetIndex] || 0,
    humidity: weatherData.hourly.relative_humidity_2m[sunsetIndex] || 0,
    visibility: weatherData.hourly.visibility[sunsetIndex] || 0,
    pm2_5: airData.hourly.pm2_5[sunsetIndex] || 0,
    pm10: airData.hourly.pm10[sunsetIndex] || 0,
    aod: airData.hourly.aerosol_optical_depth[sunsetIndex] || 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      );
    }

    // Fetch real weather data
    const data = await fetchWeatherData(lat, lng);

    // Calculate score
    const score = scoreSunset(
      data.cloud_cover,
      data.cloud_low,
      data.cloud_mid,
      data.cloud_high,
      data.humidity,
      data.visibility,
      data.pm2_5,
      data.pm10,
      data.aod
    );

    const ratings = ['Poor', 'Fair', 'Good', 'Great', 'Amazing'];
    const rating = ratings[Math.floor(score / 20)];

    return NextResponse.json({
      score: Math.round(score),
      rating,
      sunset_time: data.sunset_time.toISOString(),
      factors: {
        cloud_cover: data.cloud_cover,
        cloud_low: data.cloud_low,
        cloud_mid: data.cloud_mid,
        cloud_high: data.cloud_high,
        humidity: data.humidity,
        visibility: data.visibility,
        pm2_5: data.pm2_5,
        pm10: data.pm10,
        aod: data.aod,
      },
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}
