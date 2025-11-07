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
- Multi-source API data aggregation (weather + air quality)
- Physics-based scoring algorithm using Gaussian distributions and weighted factors
- Critical component gating (clouds, particulates) to prevent unrealistic scores
- Automated daily predictions via scheduled execution
- Historical prediction tracking in relational database
- Interactive web visualization

## Data Pipeline
1. Fetch real-time weather data (cloud layers, humidity, visibility, VPD)
2. Fetch air quality data (PM2.5, PM10, AOD)
3. Merge data sources at sunset timestamp
4. Calculate sunset quality score (0-100)
5. Store prediction with full atmospheric parameters

## Quick Start

### Python CLI
```bash
# Default location (San Jose, CA)
python3 sunset_predictor/weather.py

# Any location
python3 sunset_predictor/weather.py --lat 40.7128 --lon -74.0060 --location "New York City"
```

### Web Demo
```bash
cd sunset-demo
npm install
npm run dev
# Open http://localhost:3000
```

The web interface provides:
- Auto-detect location using browser geolocation
- Manual coordinate input
- City name search
- Real-time visualization

## Skills Demonstrated
- ETL pipeline design
- RESTful API integration
- Time-series data handling
- Database schema design
- Domain-specific algorithm development
- Full-stack web development
- Geolocation integration
