'use client';

import { useState } from 'react';
import LocationInput from './components/LocationInput';
import PredictionResult from './components/PredictionResult';
import SunVisualization from './components/SunVisualization';
import { SunsetPrediction, LocationData } from './types';
import { Sun } from 'lucide-react';

export default function Home() {
  const [prediction, setPrediction] = useState<SunsetPrediction | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLocationSelect = async (locationData: LocationData) => {
    setLoading(true);
    setError('');
    setLocation(locationData);

    try {
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
    } catch (err) {
      setError('Failed to get sunset prediction. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
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
          {/* Location input */}
          {!prediction && (
            <div>
              <LocationInput onLocationSelect={handleLocationSelect} loading={loading} />
              {error && (
                <div className="mt-4 max-w-2xl mx-auto p-4 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {prediction && location && (
            <>
              <PredictionResult prediction={prediction} location={location} />
              <SunVisualization
                lat={location.lat}
                lng={location.lng}
                sunsetTime={new Date(prediction.sunset_time)}
              />

              {/* Try another location button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setPrediction(null);
                    setLocation(null);
                    setError('');
                  }}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Try Another Location
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info footer */}
        {!prediction && (
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
