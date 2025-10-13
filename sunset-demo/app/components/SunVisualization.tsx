'use client';

import { useEffect, useState } from 'react';
import SunCalc from 'suncalc';
import { Sun, Sunrise, Sunset } from 'lucide-react';

interface SunVisualizationProps {
  lat: number;
  lng: number;
  sunsetTime: Date;
}

interface SunData {
  times: SunCalc.GetTimesResult;
  position: SunCalc.GetSunPositionResult;
  currentAltitude: number;
}

export default function SunVisualization({ lat, lng }: SunVisualizationProps) {
  const [sunData, setSunData] = useState<SunData | null>(null);

  useEffect(() => {
    const today = new Date();
    const times = SunCalc.getTimes(today, lat, lng);
    const position = SunCalc.getPosition(today, lat, lng);

    setSunData({
      times,
      position,
      currentAltitude: (position.altitude * 180) / Math.PI, // Convert to degrees
    });
  }, [lat, lng]);

  if (!sunData) return null;

  const { times, currentAltitude } = sunData;
  const now = new Date();

  // Calculate sun position on arc (0-180 degrees, 0 = horizon)
  const arcProgress = Math.max(0, Math.min(180, currentAltitude + 90));

  // Calculate position on SVG arc
  const radius = 120;
  const centerX = 150;
  const centerY = 150;
  const angle = (arcProgress * Math.PI) / 180;
  const sunX = centerX + radius * Math.cos(Math.PI - angle);
  const sunY = centerY - radius * Math.sin(Math.PI - angle);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Sun Position & Golden Hour</h3>

      {/* SVG Visualization */}
      <div className="flex justify-center mb-6">
        <svg width="300" height="200" className="overflow-visible">
          {/* Horizon line */}
          <line
            x1="30"
            y1="150"
            x2="270"
            y2="150"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Sun path arc */}
          <path
            d={`M 30 150 A ${radius} ${radius} 0 0 1 270 150`}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeDasharray="5,5"
            opacity="0.5"
          />

          {/* Current sun position */}
          {now < times.sunset && now > times.sunrise && (
            <>
              <circle cx={sunX} cy={sunY} r="20" fill="#fbbf24" opacity="0.3" />
              <circle cx={sunX} cy={sunY} r="12" fill="#f59e0b" />
            </>
          )}

          {/* Sunrise marker */}
          <circle cx="30" cy="150" r="6" fill="#fb923c" />
          <text x="30" y="175" textAnchor="middle" fontSize="12" fill="#64748b">
            Sunrise
          </text>

          {/* Sunset marker */}
          <circle cx="270" cy="150" r="6" fill="#ea580c" />
          <text x="270" y="175" textAnchor="middle" fontSize="12" fill="#64748b">
            Sunset
          </text>
        </svg>
      </div>

      {/* Time details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
          <Sunrise className="text-orange-500 flex-shrink-0 mt-1" size={24} />
          <div>
            <p className="text-sm font-medium text-gray-600">Sunrise</p>
            <p className="text-lg font-bold">{formatTime(times.sunrise)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
          <Sun className="text-amber-500 flex-shrink-0 mt-1" size={24} />
          <div>
            <p className="text-sm font-medium text-gray-600">Golden Hour Start</p>
            <p className="text-lg font-bold">{formatTime(times.goldenHour)}</p>
            <p className="text-xs text-gray-500 mt-1">
              ~1 hour before sunset
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
          <Sunset className="text-red-500 flex-shrink-0 mt-1" size={24} />
          <div>
            <p className="text-sm font-medium text-gray-600">Sunset</p>
            <p className="text-lg font-bold">{formatTime(times.sunset)}</p>
          </div>
        </div>
      </div>

      {/* Additional golden hour info */}
      <div className="mt-4 p-4 bg-gradient-to-r from-orange-100 to-pink-100 rounded-lg">
        <p className="text-sm font-medium text-gray-800 mb-2">
          ✨ Golden Hour Window
        </p>
        <p className="text-sm text-gray-700">
          The golden hour occurs from{' '}
          <span className="font-bold">{formatTime(times.goldenHour)}</span> to{' '}
          <span className="font-bold">{formatTime(times.sunset)}</span> - perfect for
          photography and spectacular sunsets!
        </p>
      </div>
    </div>
  );
}
