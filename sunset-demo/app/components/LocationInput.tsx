'use client';

import { useState } from 'react';
import { MapPin, Crosshair, Search } from 'lucide-react';
import { LocationData } from '../types';

interface LocationInputProps {
  onLocationSelect: (location: LocationData) => void;
  loading: boolean;
}

export default function LocationInput({ onLocationSelect, loading }: LocationInputProps) {
  const [mode, setMode] = useState<'auto' | 'manual' | 'search'>('auto');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [geoError, setGeoError] = useState('');

  const handleBrowserLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSelect({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location',
        });
      },
      (error) => {
        setGeoError(`Location access denied: ${error.message}`);
      }
    );
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      setGeoError('Invalid coordinates');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setGeoError('Coordinates out of range');
      return;
    }

    setGeoError('');
    onLocationSelect({
      lat: latitude,
      lng: longitude,
      name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    });
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeoError('');

    try {
      // Using Nominatim (OpenStreetMap) geocoding - free, no API key
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          cityQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) {
        setGeoError('City not found');
        return;
      }

      const result = data[0];
      onLocationSelect({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        name: result.display_name,
      });
    } catch (error) {
      setGeoError('Failed to search for city');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Enter Your Location</h2>

      {/* Mode selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('auto')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'auto'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          disabled={loading}
        >
          <Crosshair size={18} />
          Auto-detect
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'manual'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          disabled={loading}
        >
          <MapPin size={18} />
          Coordinates
        </button>
        <button
          onClick={() => setMode('search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            mode === 'search'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          disabled={loading}
        >
          <Search size={18} />
          Search City
        </button>
      </div>

      {/* Auto-detect mode */}
      {mode === 'auto' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Click the button below to use your browser&apos;s location
          </p>
          <button
            onClick={handleBrowserLocation}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Use My Location'}
          </button>
        </div>
      )}

      {/* Manual coordinates mode */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="37.7749"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-122.4194"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Get Prediction'}
          </button>
        </form>
      )}

      {/* City search mode */}
      {mode === 'search' && (
        <form onSubmit={handleCitySearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">City Name</label>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="San Francisco, CA"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Search & Predict'}
          </button>
        </form>
      )}

      {geoError && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">{geoError}</div>
      )}
    </div>
  );
}
