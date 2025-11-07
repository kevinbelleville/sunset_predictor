"""
Sunset Quality Timeline Fetcher

Fetches historical and forecast sunset quality data for a location.
Optimized to use minimal API calls by combining past_days and forecast_days.

Usage:
    python3 timeline.py --lat 37.3394 --lon -121.895 --location "San Jose, CA"
    python3 timeline.py --past-days 7 --forecast-days 3
"""

import json
import requests
from datetime import datetime, timedelta
import sunset_score
import psycopg2
import argparse

# Parse command line arguments
parser = argparse.ArgumentParser(description='Fetch sunset quality timeline for a location')
parser.add_argument('--lat', '--latitude', type=float, default=37.3394,
                    help='Latitude (default: 37.3394 - San Jose, CA)')
parser.add_argument('--lon', '--lng', '--longitude', type=float, default=-121.895,
                    help='Longitude (default: -121.895 - San Jose, CA)')
parser.add_argument('--location', type=str, default='San Jose, CA',
                    help='Location name for display purposes')
parser.add_argument('--past-days', type=int, default=7,
                    help='Number of historical days to fetch (default: 7, max: 92)')
parser.add_argument('--forecast-days', type=int, default=3,
                    help='Number of forecast days to fetch (default: 3, max: 16)')
parser.add_argument('--skip-db', action='store_true',
                    help='Skip database storage (just print results)')
args = parser.parse_args()

def fetch_timeline_data(lat, lon, past_days=7, forecast_days=3):
    """
    Fetch weather and air quality data for multiple days in a single API call.

    This is optimized to minimize API calls by using past_days and forecast_days
    parameters, which allows fetching historical and forecast data in one request.

    Returns:
        dict: Combined weather and air quality data with sunset times
    """

    # Build API URLs with past_days and forecast_days parameters
    # This fetches: [past_days ago] ... [yesterday] [today] [tomorrow] ... [forecast_days from now]
    weather_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&daily=sunrise,sunset"
        f"&hourly=relative_humidity_2m,visibility,cloud_cover_low,cloud_cover_mid,"
        f"cloud_cover_high,cloud_cover,vapour_pressure_deficit"
        f"&timezone=auto"
        f"&past_days={past_days}"
        f"&forecast_days={forecast_days}"
    )

    air_quality_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?"
        f"latitude={lat}&longitude={lon}"
        f"&hourly=pm10,pm2_5,dust,aerosol_optical_depth"
        f"&timezone=auto"
        f"&past_days={past_days}"
        f"&forecast_days={forecast_days}"
    )

    print(f"Fetching {past_days} days historical + {forecast_days} days forecast...")
    print(f"Total days: {past_days + forecast_days + 1}")
    print(f"API calls: 2 (weather + air quality)\n")

    # Make API calls
    weather_response = requests.get(weather_url)
    air_quality_response = requests.get(air_quality_url)

    weather_data = weather_response.json()
    air_quality_data = air_quality_response.json()

    return weather_data, air_quality_data


def calculate_sunset_scores(weather_data, air_quality_data):
    """
    Calculate sunset quality scores for each day in the timeline.

    Returns:
        list: List of dicts with date, sunset_time, score, and atmospheric factors
    """

    sunset_times_str = weather_data["daily"]["sunset"]
    hourly_times = [datetime.fromisoformat(t) for t in weather_data["hourly"]["time"]]

    timeline_results = []

    for day_idx, sunset_str in enumerate(sunset_times_str):
        sunset_time = datetime.fromisoformat(sunset_str)
        sunset_hour = sunset_time.hour

        # Find the hourly index closest to sunset time
        # We need to find the right day's sunset hour
        day_start_idx = day_idx * 24
        day_hourly_times = hourly_times[day_start_idx:day_start_idx + 24]

        # Find sunset hour within this day's hours
        sunset_index = None
        for i, t in enumerate(day_hourly_times):
            if t.hour == sunset_hour:
                sunset_index = day_start_idx + i
                break

        if sunset_index is None:
            # Fallback: use the last hour of the day
            sunset_index = day_start_idx + len(day_hourly_times) - 1

        # Extract atmospheric data at sunset time
        cloud_cover = weather_data["hourly"]["cloud_cover"][sunset_index] or 0
        cloud_low = weather_data["hourly"]["cloud_cover_low"][sunset_index] or 0
        cloud_mid = weather_data["hourly"]["cloud_cover_mid"][sunset_index] or 0
        cloud_high = weather_data["hourly"]["cloud_cover_high"][sunset_index] or 0
        humidity = weather_data["hourly"]["relative_humidity_2m"][sunset_index] or 0
        visibility = weather_data["hourly"]["visibility"][sunset_index] or 0
        vpd = weather_data["hourly"]["vapour_pressure_deficit"][sunset_index] or 0

        pm2_5 = air_quality_data["hourly"]["pm2_5"][sunset_index] or 0
        pm10 = air_quality_data["hourly"]["pm10"][sunset_index] or 0
        aod = air_quality_data["hourly"]["aerosol_optical_depth"][sunset_index] or 0

        # Calculate score
        score = sunset_score.score_sunset(
            cloud_cover, cloud_low, cloud_mid, cloud_high,
            humidity, visibility, pm2_5, pm10, aod
        )

        # Determine if this is historical, today, or forecast
        today = datetime.now().date()
        sunset_date = sunset_time.date()

        if sunset_date < today:
            data_type = 'historical'
        elif sunset_date == today:
            data_type = 'current'
        else:
            data_type = 'forecast'

        timeline_results.append({
            'date': sunset_time.date(),
            'sunset_time': sunset_time,
            'score': score,
            'data_type': data_type,
            'factors': {
                'cloud_cover': cloud_cover,
                'cloud_low': cloud_low,
                'cloud_mid': cloud_mid,
                'cloud_high': cloud_high,
                'humidity': humidity,
                'visibility': visibility,
                'vpd': vpd,
                'pm2_5': pm2_5,
                'pm10': pm10,
                'aod': aod,
            }
        })

    return timeline_results


def store_timeline_to_db(timeline_results, latitude, longitude):
    """
    Store timeline data to PostgreSQL database.
    Uses UPSERT to avoid duplicates for the same date/location.
    """
    conn = psycopg2.connect(
        dbname="sunset_predictions",
        user="sunset_user",
        password="sunrise",
        host="localhost",
    )
    cur = conn.cursor()

    for result in timeline_results:
        cur.execute("""
            INSERT INTO predictions (
                timestamp, latitude, longitude, sunset_time,
                cloud_cover, cloud_low, cloud_mid, cloud_high,
                humidity, visibility, vpd, pm2_5, pm10, aod,
                predicted_score
            ) VALUES (NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            latitude, longitude, result['sunset_time'],
            result['factors']['cloud_cover'],
            result['factors']['cloud_low'],
            result['factors']['cloud_mid'],
            result['factors']['cloud_high'],
            result['factors']['humidity'],
            result['factors']['visibility'],
            result['factors']['vpd'],
            result['factors']['pm2_5'],
            result['factors']['pm10'],
            result['factors']['aod'],
            result['score']
        ))

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✓ Stored {len(timeline_results)} predictions to database")


def print_timeline(timeline_results, location_name):
    """Print timeline results in a formatted table."""

    ratings = ["Poor", "Fair", "Good", "Great", "Amazing"]

    print(f"\n{'='*80}")
    print(f"Sunset Quality Timeline: {location_name}")
    print(f"{'='*80}")
    print(f"{'Date':<12} {'Type':<12} {'Sunset':<8} {'Score':<6} {'Rating':<8} {'Clouds':<7} {'PM2.5':<7} {'Vis(km)'}")
    print(f"{'-'*80}")

    for result in timeline_results:
        date_str = result['date'].strftime('%Y-%m-%d')
        sunset_str = result['sunset_time'].strftime('%H:%M')
        score = result['score']
        rating = ratings[int(score // 20)]
        data_type = result['data_type'].capitalize()

        cloud = result['factors']['cloud_cover']
        pm = result['factors']['pm2_5']
        vis = result['factors']['visibility'] / 1000

        print(f"{date_str:<12} {data_type:<12} {sunset_str:<8} {score:>5.1f} {rating:<8} {cloud:>6.1f}% {pm:>6.1f} {vis:>7.1f}")

    print(f"{'='*80}\n")


if __name__ == "__main__":
    # Fetch timeline data (just 2 API calls!)
    weather_data, air_quality_data = fetch_timeline_data(
        args.lat, args.lon, args.past_days, args.forecast_days
    )

    # Calculate scores for all days
    timeline_results = calculate_sunset_scores(weather_data, air_quality_data)

    # Print results
    print_timeline(timeline_results, args.location)

    # Store to database (optional)
    if not args.skip_db:
        try:
            store_timeline_to_db(timeline_results, args.lat, args.lon)
        except Exception as e:
            print(f"⚠ Database storage failed: {e}")
            print("(Use --skip-db to skip database storage)")
