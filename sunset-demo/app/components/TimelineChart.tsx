'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface TimelineDataPoint {
  date: string;
  sunset_time: string;
  score: number;
  rating: string;
  data_type: 'historical' | 'current' | 'forecast';
  factors: {
    cloud_cover: number;
    cloud_low: number;
    cloud_mid: number;
    cloud_high: number;
    humidity: number;
    visibility: number;
    pm2_5: number;
    pm10: number;
    aod: number;
  };
}

interface TimelineChartProps {
  timeline: TimelineDataPoint[];
  locationName?: string;
}

export default function TimelineChart({ timeline, locationName }: TimelineChartProps) {
  // Format data for chart
  const chartData = timeline.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: point.date,
    score: point.score,
    rating: point.rating,
    type: point.data_type,
    isCurrent: point.data_type === 'current',
  }));

  // Find current day index
  const currentDayIndex = chartData.findIndex((d) => d.isCurrent);
  const currentScore = currentDayIndex >= 0 ? chartData[currentDayIndex].score : null;

  // Calculate trend
  const historicalData = chartData.filter((d) => d.type === 'historical');
  const avgHistorical = historicalData.length > 0
    ? historicalData.reduce((sum, d) => sum + d.score, 0) / historicalData.length
    : null;

  const forecastData = chartData.filter((d) => d.type === 'forecast');
  const avgForecast = forecastData.length > 0
    ? forecastData.reduce((sum, d) => sum + d.score, 0) / forecastData.length
    : null;

  const trend = avgHistorical && avgForecast
    ? avgForecast > avgHistorical
      ? 'improving'
      : avgForecast < avgHistorical
      ? 'declining'
      : 'stable'
    : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold">{data.date}</p>
          <p className="text-sm text-gray-600">{data.type.charAt(0).toUpperCase() + data.type.slice(1)}</p>
          <div className="mt-2">
            <p className="text-2xl font-bold text-orange-600">{data.score}</p>
            <p className="text-sm font-semibold">{data.rating}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Color for score line based on data type
  const getLineColor = (dataType: string) => {
    if (dataType === 'forecast') return '#94a3b8'; // Gray for forecast
    return '#ea580c'; // Orange for historical/current
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-orange-500" size={24} />
              <h3 className="text-2xl font-bold">Sunset Quality Timeline</h3>
            </div>
            {locationName && (
              <p className="text-gray-600">{locationName}</p>
            )}
          </div>

          {/* Trend indicator */}
          {trend && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              trend === 'improving' ? 'bg-green-50 text-green-700' :
              trend === 'declining' ? 'bg-red-50 text-red-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {trend === 'improving' && <TrendingUp size={20} />}
              {trend === 'declining' && <TrendingDown size={20} />}
              <span className="font-semibold capitalize">{trend}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Past 7 Days Avg</p>
            <p className="text-xl font-bold">
              {avgHistorical !== null ? avgHistorical.toFixed(0) : 'N/A'}
            </p>
          </div>
          {currentScore !== null && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="text-xs text-orange-700 font-semibold">Today</p>
              <p className="text-xl font-bold text-orange-600">{currentScore}</p>
            </div>
          )}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600">Next 3 Days Avg</p>
            <p className="text-xl font-bold text-blue-700">
              {avgForecast !== null ? avgForecast.toFixed(0) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Quality Score', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />

            {/* Reference line for "today" */}
            {currentDayIndex >= 0 && (
              <ReferenceLine
                x={chartData[currentDayIndex].date}
                stroke="#ea580c"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'Today', position: 'top', fill: '#ea580c', fontSize: 12 }}
              />
            )}

            {/* Score line */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#ea580c"
              strokeWidth={3}
              dot={{ fill: '#ea580c', r: 4 }}
              activeDot={{ r: 6 }}
              name="Sunset Quality"
            />

            {/* Shaded areas for different sections */}
            <Area
              type="monotone"
              dataKey={(d) => (d.type === 'forecast' ? 100 : 0)}
              fill="#dbeafe"
              fillOpacity={0.3}
              stroke="none"
              name="Forecast Period"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend explanation */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Historical/Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-3 bg-blue-100 border border-blue-200"></div>
            <span>Forecast Period</span>
          </div>
        </div>
      </div>

      {/* Data quality note */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">📊 Efficient API Usage:</span> This entire timeline
          (7 days historical + today + 3 days forecast) was fetched using only <strong>2 API calls</strong> by
          combining <code className="bg-blue-100 px-1 rounded">past_days</code> and{' '}
          <code className="bg-blue-100 px-1 rounded">forecast_days</code> parameters.
        </p>
      </div>
    </div>
  );
}
