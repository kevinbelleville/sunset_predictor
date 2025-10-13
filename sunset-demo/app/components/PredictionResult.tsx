'use client';

import { SunsetPrediction, LocationData } from '../types';
import { Cloud, Eye, Droplets, Wind } from 'lucide-react';

interface PredictionResultProps {
  prediction: SunsetPrediction;
  location: LocationData;
}

export default function PredictionResult({ prediction, location }: PredictionResultProps) {
  const { score, rating, sunset_time, factors } = prediction;

  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 20) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-yellow-500 to-amber-600';
    if (score >= 20) return 'from-orange-500 to-red-600';
    return 'from-red-600 to-red-800';
  };

  const formatSunsetTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getFactorDescription = (key: string, value: number) => {
    switch (key) {
      case 'cloud_cover':
        if (value < 10) return 'Too clear - needs clouds for color';
        if (value < 30) return 'Minimal clouds';
        if (value < 70) return 'Optimal cloud coverage';
        return 'Heavy cloud cover';
      case 'pm2_5':
        if (value < 12) return 'Very clean air';
        if (value < 35) return 'Moderate particulates - good for color';
        if (value < 55) return 'Elevated particulates';
        return 'Poor air quality';
      case 'aod':
        if (value < 0.1) return 'Very clear atmosphere';
        if (value < 0.5) return 'Moderate aerosols - enhances color';
        if (value < 1.0) return 'High aerosol content';
        return 'Excessive aerosols - hazy';
      case 'visibility':
        if (value < 5000) return 'Poor visibility';
        if (value < 10000) return 'Moderate visibility';
        return 'Excellent visibility';
      case 'humidity':
        if (value < 40) return 'Dry air';
        if (value < 70) return 'Comfortable humidity';
        return 'High humidity';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Location info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Prediction for</p>
        <p className="text-lg font-semibold">{location.name || 'Selected Location'}</p>
        <p className="text-sm text-gray-500">
          {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
        </p>
      </div>

      {/* Main score display */}
      <div className={`p-8 rounded-lg border-2 ${getScoreColor(score)}`}>
        <div className="text-center">
          <div className="mb-4">
            <div
              className={`inline-block text-6xl font-bold bg-gradient-to-r ${getScoreGradient(
                score
              )} bg-clip-text text-transparent`}
            >
              {score}
            </div>
            <div className="text-2xl font-bold mt-2">{rating}</div>
          </div>
          <div className="text-lg">
            Sunset at <span className="font-bold">{formatSunsetTime(sunset_time)}</span>
          </div>
        </div>
      </div>

      {/* Factors breakdown */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Why this score?</h3>

        <div className="space-y-4">
          {/* Cloud coverage */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="text-blue-500" size={20} />
              <span className="font-semibold">Cloud Coverage</span>
              <span className="ml-auto text-lg font-bold">{factors.cloud_cover.toFixed(0)}%</span>
            </div>
            <p className="text-sm text-gray-600">
              {getFactorDescription('cloud_cover', factors.cloud_cover)}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Low: {factors.cloud_low.toFixed(0)}% | Mid: {factors.cloud_mid.toFixed(0)}% |
              High: {factors.cloud_high.toFixed(0)}%
            </div>
          </div>

          {/* Visibility */}
          <div className="border-l-4 border-purple-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="text-purple-500" size={20} />
              <span className="font-semibold">Visibility</span>
              <span className="ml-auto text-lg font-bold">
                {(factors.visibility / 1000).toFixed(1)} km
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {getFactorDescription('visibility', factors.visibility)}
            </p>
          </div>

          {/* Air Quality */}
          <div className="border-l-4 border-orange-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="text-orange-500" size={20} />
              <span className="font-semibold">Air Quality (PM2.5)</span>
              <span className="ml-auto text-lg font-bold">
                {factors.pm2_5.toFixed(1)} µg/m³
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {getFactorDescription('pm2_5', factors.pm2_5)}
            </p>
            <div className="mt-2 text-xs text-gray-500">
              PM10: {factors.pm10.toFixed(1)} µg/m³ | AOD: {factors.aod.toFixed(3)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getFactorDescription('aod', factors.aod)}
            </p>
          </div>

          {/* Humidity */}
          <div className="border-l-4 border-cyan-500 pl-4">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="text-cyan-500" size={20} />
              <span className="font-semibold">Humidity</span>
              <span className="ml-auto text-lg font-bold">{factors.humidity.toFixed(0)}%</span>
            </div>
            <p className="text-sm text-gray-600">
              {getFactorDescription('humidity', factors.humidity)}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-6 rounded-lg">
        <h4 className="font-bold mb-2">How is this calculated?</h4>
        <p className="text-sm text-gray-700 leading-relaxed">
          The sunset quality score combines multiple atmospheric factors using physics-based
          algorithms. Clouds (40% weight) scatter light for vivid colors, but too few or too many
          reduce the effect. Aerosols and particulates (30%) enhance colors through Rayleigh and
          Mie scattering. Visibility (20%) ensures you can actually see the sunset. Humidity (10%)
          plays a minor role in atmospheric refraction.
        </p>
      </div>
    </div>
  );
}
