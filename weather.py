import json
import requests
from datetime import datetime
import sunset_score

api_url = "https://api.open-meteo.com/v1/forecast?latitude=37.3394&longitude=-121.895&daily=sunrise,sunset&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,showers,visibility,cloud_cover_low,cloud_cover_mid,cloud_cover_high,cloud_cover,vapour_pressure_deficit,uv_index,is_day,sunshine_duration&timezone=America%2FLos_Angeles&forecast_days=1"

air_quality_api_url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=37.3394&longitude=-121.895&hourly=pm10,pm2_5,dust,aerosol_optical_depth&current=dust,us_aqi,pm10,pm2_5&timezone=America%2FLos_Angeles&forecast_days=1"

air_quality_response = requests.get(air_quality_api_url)
air_quality_data = air_quality_response.json()

response = requests.get(api_url)
data = response.json()

# data = json.loads(json_string)

sunset_str = data["daily"]["sunset"][0]
sunset_time = datetime.fromisoformat(sunset_str)
sunset_hour = sunset_time.hour

hourly_times = [datetime.fromisoformat(t) for t in data["hourly"]["time"]]
sunset_index = next(i for i, t in enumerate(hourly_times) if t.hour == sunset_hour)

# sunset_time = data["daily"]["sunset"][0][-5:]
# sunset_time_hour = sunset_time[0:2]

cloud_cover = data["hourly"]["cloud_cover"][sunset_index]
cloud_low = data["hourly"]["cloud_cover_low"][sunset_index]
cloud_mid = data["hourly"]["cloud_cover_mid"][sunset_index]
cloud_high = data["hourly"]["cloud_cover_high"][sunset_index]
humidity = data["hourly"]["relative_humidity_2m"][sunset_index]
visibility = data["hourly"]["visibility"][sunset_index]
vpd = data["hourly"]["vapour_pressure_deficit"][sunset_index]
dust = air_quality_data["hourly"]["dust"][sunset_index]
pm2_5 = air_quality_data["hourly"]["pm2_5"][sunset_index]
pm10 = air_quality_data["hourly"]["pm10"][sunset_index]
aod = air_quality_data["hourly"]["aerosol_optical_depth"][sunset_index]

sunset_score_today = sunset_score.score_sunset(cloud_cover, cloud_low, cloud_mid, cloud_high, 
                          humidity, visibility, pm2_5, pm10, aod)

ratings = ["Poor", "Fair", "Good", "Great", "Amazing"]
sunset_score_today_rating = ratings[int(sunset_score_today//20)]

print(f"Sunset at {sunset_time.hour}:{sunset_time.minute}\nCloud cover: {cloud_cover}%\nHumidity: {humidity}%\nVisibility: {visibility}m\nVPD: {vpd} kPa\nPM2.5: {pm2_5} µg/m³\nPM10: {pm10} µg/m³\nAOD: {aod}\nSunset Quality Score: {sunset_score_today}/100\n Rating: {sunset_score_today_rating}")
