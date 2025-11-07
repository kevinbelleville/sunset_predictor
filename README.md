# Sunset Quality Predictor

Real-time data pipeline that predicts sunset quality based on atmospheric conditions using meteorological and air quality data for any location worldwide.

## Overview
Combines weather forecasting data (cloud cover, humidity, visibility) with air quality metrics (PM2.5, PM10, aerosol optical depth) to generate daily sunset quality predictions. Uses atmospheric physics principles to score optimal conditions for vivid sunsets.

## Technologies
- **Python** - Core application logic
- **Next.js & TypeScript** - Interactive web demo
- **PostgreSQL** - Time-series data storage
- **Open-Meteo API** - Weather and air quality data ingestion
- **Requests** - HTTP API integration
- **Geolocation APIs** - Browser location & city search

## Features
- **Location-flexible**: Command-line parameters or web interface for any global location
- **Multiple input methods**: Auto-detect via browser, manual coordinates, or city search
- **Timeline view**: 7 days historical + 3 days forecast in a single visualization
- **API optimization**: Fetch 10 days of data using only 2 API calls (90% efficiency)
- Multi-source API data aggregation (weather + air quality)
- Physics-based scoring algorithm using Gaussian distributions and weighted factors
- Critical component gating (clouds, particulates) to prevent unrealistic scores
- Automated daily predictions via scheduled execution
- Historical prediction tracking in relational database
- Interactive web visualization with trend analysis

## Data Pipeline
1. Fetch real-time weather data (cloud layers, humidity, visibility, VPD)
2. Fetch air quality data (PM2.5, PM10, AOD)
3. Merge data sources at sunset timestamp
4. Calculate sunset quality score (0-100)
5. Store prediction with full atmospheric parameters

## Quick Start

### Python CLI - Single Day
```bash
# Default location (San Jose, CA)
python3 sunset_predictor/weather.py

# Any location
python3 sunset_predictor/weather.py --lat 40.7128 --lon -74.0060 --location "New York City"
```

### Python CLI - Timeline (NEW!)
```bash
# 7 days historical + 3 days forecast (only 2 API calls!)
python3 sunset_predictor/timeline.py --lat 40.7128 --lon -74.0060 --location "New York City"

# Custom range
python3 sunset_predictor/timeline.py --past-days 14 --forecast-days 7
```

### Web Demo
```bash
cd sunset-demo
npm install
npm run dev
# Open http://localhost:3000
```

The web interface provides:
- **Two view modes**: Single day or 7-day timeline
- Auto-detect location using browser geolocation
- Manual coordinate input
- City name search
- Interactive timeline chart with trend analysis
- Real-time visualization

See **[TIMELINE_FEATURE.md](TIMELINE_FEATURE.md)** for detailed timeline documentation.

## Skills Demonstrated
- ETL pipeline design with batch optimization
- RESTful API integration and rate limit management
- Time-series data handling and trend analysis
- Database schema design with unique constraints
- Domain-specific algorithm development (atmospheric physics)
- Full-stack web development (Next.js, React, TypeScript)
- Geolocation integration (browser + geocoding APIs)
- Data visualization (interactive charts with Recharts)
- API efficiency optimization (90% reduction in calls)
