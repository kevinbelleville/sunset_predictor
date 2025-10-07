import math

def gaussian_score(distance, sigma=1.0):
    """Returns 0-1 factor based on distance from optimal"""
    return math.exp(-(distance**2) / (2 * sigma**2))

def score_sunset(cloud_cover, cloud_low, cloud_mid, cloud_high, 
                        humidity, visibility, pm2_5, pm10, aod) -> float:
    
    # === COMPONENT SCORES (each 0-100) ===
    
    # Cloud score (combination of coverage + type)
    cloud_coverage_score = gaussian_score(abs(cloud_cover - 50), sigma=20) * 100
    cloud_quality = (cloud_mid + cloud_high) / 2 - cloud_low
    cloud_type_score = (1.0 / (1.0 + math.exp(-cloud_quality / 20))) * 100
    cloud_score = (cloud_coverage_score + cloud_type_score) / 2
    
    # Particle score (PM2.5 + AOD + size ratio)
    pm_score = gaussian_score(abs(pm2_5 - 15), sigma=35) * 100
    if aod < 0.05:
        aod_score = 30
    else:
        aod_score = gaussian_score(abs(aod - 0.3), sigma=0.4) * 100
    
    if pm2_5 > 0:
        size_ratio = pm10 / pm2_5
        size_score = 100 if 2.0 <= size_ratio <= 3.5 else 70
    else:
        size_score = 50
    
    particle_score = (pm_score * 0.5 + aod_score * 0.4 + size_score * 0.1)
    
    # Humidity score
    humidity_score = gaussian_score(abs(humidity - 60), sigma=20) * 100
    
    # Visibility score
    if visibility < 5000:
        visibility_score = (visibility / 5000) * 100
    else:
        visibility_score = min(100, (visibility / 10000) * 100)
    
    # === WEIGHTED AVERAGE ===
    base_score = (
        cloud_score * 0.40 +        # Clouds most important
        particle_score * 0.30 +     # Aerosols second
        visibility_score * 0.20 +   # Visibility third
        humidity_score * 0.10       # Humidity least
    )
    
    # === CRITICAL COMPONENT CEILING ===
    # No clouds? Can't score above 50
    # Bad particles? Can't score above 60
    if cloud_cover < 10:  # Less than 10% cloud cover
        cloud_ceiling = 30
    elif cloud_cover < 25:
        cloud_ceiling = 50
    else:
        cloud_ceiling = 100
    
    # Excessive pollution caps score
    if pm2_5 > 75 or aod > 1.5:
        particle_ceiling = 40
    elif pm2_5 > 55 or aod > 1.0:
        particle_ceiling = 60
    else:
        particle_ceiling = 100
    
    # Final score can't exceed worst critical ceiling
    ceiling = min(cloud_ceiling, particle_ceiling)
    
    final_score = min(base_score, ceiling)
    
    return max(0, min(100, final_score))

# Good sunset
print(score_sunset(
    cloud_cover=50,    # 50%
    cloud_low=10,      # 10%
    cloud_mid=30,      # 30%
    cloud_high=40,     # 40%
    humidity=65,       # 65%
    visibility=15000,  # 15km
    pm2_5=18,
    pm10=45,
    aod=0.35
))
# Should be ~75-85

# Bad sunset (too hazy)
print(score_sunset(
    cloud_cover=0,
    cloud_low=0,
    cloud_mid=0,
    cloud_high=0,
    humidity=30,
    visibility=3000,   # 3km
    pm2_5=80,
    pm10=150,
    aod=1.8
))
# Should be <15

# Clear sky, perfect aerosols
score = score_sunset(
    cloud_cover=5,      # Almost no clouds
    cloud_low=5,
    cloud_mid=0,
    cloud_high=0,
    humidity=60,
    visibility=20000,
    pm2_5=15,          # Perfect PM
    pm10=37.5,
    aod=0.3            # Perfect AOD
)
print(score)  # Should be capped at 50