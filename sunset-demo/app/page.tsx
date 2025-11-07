'use client';

import { useState } from 'react';
import LocationInput from './components/LocationInput';
import PredictionResult from './components/PredictionResult';
import SunVisualization from './components/SunVisualization';
import TimelineChart from './components/TimelineChart';
import { SunsetPrediction, LocationData } from './types';
import { Sun, Calendar, Clock } from 'lucide-react';

interface TimelineData {
  timeline: any[];
  meta: {
    total_days: number;
    api_calls_used: number;
    past_days: number;
    forecast_days: number;
  };
}

export default function Home() {
  const [prediction, setPrediction] = useState<SunsetPrediction | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'timeline'>('single');

  const handleLocationSelect = async (locationData: LocationData, mode: 'single' | 'timeline' = viewMode) => {
    setLoading(true);
    setError('');
    setLocation(locationData);

    try {
      if (mode === 'timeline') {
        // Fetch timeline data (7 days historical + 3 days forecast)
        const response = await fetch('/api/timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: locationData.lat,
            lng: locationData.lng,
            past_days: 7,
            forecast_days: 3,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch timeline');
        }

        const data = await response.json();
        setTimeline(data);
        setPrediction(null);
      } else {
        // Fetch single day prediction
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: locationData.lat,
            lng: locationData.lng,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch prediction');
        }

        const data = await response.json();
        setPrediction(data);
        setTimeline(null);
      }
    } catch (err) {
      setError(`Failed to get sunset ${mode === 'timeline' ? 'timeline' : 'prediction'}. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const switchViewMode = (mode: 'single' | 'timeline') => {
    setViewMode(mode);
    if (location) {
      handleLocationSelect(location, mode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-orange-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Sun className="text-orange-500" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sunset Predictor</h1>
              <p className="text-sm text-gray-600">
                Physics-based sunset quality predictions using real atmospheric data
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Location input with view mode toggle */}
          {!prediction && !timeline && (
            <div>
              {/* View mode selector */}
              <div className="max-w-2xl mx-auto mb-4">
                <div className="flex justify-center gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                      viewMode === 'single'
                        ? 'bg-white shadow-sm font-semibold text-orange-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Clock size={18} />
                    Today's Sunset
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                      viewMode === 'timeline'
                        ? 'bg-white shadow-sm font-semibold text-orange-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Calendar size={18} />
                    7-Day Timeline
                  </button>
                </div>
              </div>

              <LocationInput onLocationSelect={handleLocationSelect} loading={loading} />
              {error && (
                <div className="mt-4 max-w-2xl mx-auto p-4 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Single day results */}
          {prediction && location && (
            <>
              {/* View mode switcher */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => switchViewMode('timeline')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Calendar size={18} />
                  View 7-Day Timeline
                </button>
                <button
                  onClick={() => {
                    setPrediction(null);
                    setTimeline(null);
                    setLocation(null);
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Try Another Location
                </button>
              </div>

              <PredictionResult prediction={prediction} location={location} />
              <SunVisualization
                lat={location.lat}
                lng={location.lng}
                sunsetTime={new Date(prediction.sunset_time)}
              />
            </>
          )}

          {/* Timeline results */}
          {timeline && location && (
            <>
              {/* View mode switcher */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => switchViewMode('single')}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <Clock size={18} />
                  View Today Only
                </button>
                <button
                  onClick={() => {
                    setPrediction(null);
                    setTimeline(null);
                    setLocation(null);
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Try Another Location
                </button>
              </div>

              <TimelineChart
                timeline={timeline.timeline}
                locationName={location.name}
              />

              {/* API efficiency badge */}
              <div className="max-w-4xl mx-auto bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-sm text-green-900 text-center">
                  ✓ Fetched {timeline.meta.total_days} days of data using only{' '}
                  <strong>{timeline.meta.api_calls_used} API calls</strong>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Info footer */}
        {!prediction && !timeline && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold mb-3">How it works</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Real-time data:</span> Fetches current weather
                  and air quality data from Open-Meteo APIs
                </p>
                <p>
                  <span className="font-semibold">Physics-based scoring:</span> Analyzes cloud
                  layers, aerosol optical depth, particulate matter, humidity, and visibility
                </p>
                <p>
                  <span className="font-semibold">Gaussian distributions:</span> Uses optimal
                  ranges for each atmospheric parameter to calculate quality
                </p>
                <p>
                  <span className="font-semibold">Critical gating:</span> Applies ceilings when
                  key factors (clouds, pollution) are outside viable ranges
                </p>
                <p>
                  <span className="font-semibold">Timeline view:</span> View 7 days of historical
                  data plus 3 days forecast - all fetched in just 2 API calls using efficient
                  batching
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>
            Data from{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              Open-Meteo
            </a>{' '}
            | Built with Next.js & TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}
