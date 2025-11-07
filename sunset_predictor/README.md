# Sunset Quality Predictor

Real-time data pipeline that predicts sunset quality based on atmospheric conditions using meteorological and air quality data.

## Overview
Combines weather forecasting data (cloud cover, humidity, visibility) with air quality metrics (PM2.5, PM10, aerosol optical depth) to generate daily sunset quality predictions. Uses atmospheric physics principles to score optimal conditions for vivid sunsets.

## Technologies
- **Python** - Core application logic
- **PostgreSQL** - Time-series data storage
- **Open-Meteo API** - Weather and air quality data ingestion
- **Requests** - HTTP API integration
- **Datetime** - Temporal data processing

## Features
- Multi-source API data aggregation (weather + air quality)
- Physics-based scoring algorithm using Gaussian distributions and weighted factors
- Critical component gating (clouds, particulates) to prevent unrealistic scores
- Automated daily predictions via scheduled execution
- Historical prediction tracking in relational database

## Data Pipeline
1. Fetch real-time weather data (cloud layers, humidity, visibility, VPD)
2. Fetch air quality data (PM2.5, PM10, AOD)
3. Merge data sources at sunset timestamp
4. Calculate sunset quality score (0-100)
5. Store prediction with full atmospheric parameters

## Skills Demonstrated
- ETL pipeline design
- RESTful API integration
- Time-series data handling
- Database schema design
- Domain-specific algorithm development

## Usage

### Run for any location

The script accepts command-line arguments to predict sunset quality for any location:

```bash
# Default location (San Jose, CA)
python3 weather.py

# Specify coordinates
python3 weather.py --lat 40.7128 --lon -74.0060 --location "New York City"

# Alternative argument names
python3 weather.py --latitude 51.5074 --longitude -0.1278 --location "London, UK"

# View help
python3 weather.py --help
```

### Parameters
- `--lat` / `--latitude`: Latitude coordinate (default: 37.3394)
- `--lon` / `--lng` / `--longitude`: Longitude coordinate (default: -121.895)
- `--location`: Location name for display (default: "San Jose, CA")

## Deployment

### Database Setup
```bash
# Install PostgreSQL
sudo yum install postgresql15-server -y
sudo postgresql-setup --initdb
sudo systemctl start postgresql

# Create database
sudo -u postgres psql < schema.sql
