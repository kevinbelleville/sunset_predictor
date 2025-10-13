export interface SunsetPrediction {
  score: number;
  rating: 'Poor' | 'Fair' | 'Good' | 'Great' | 'Amazing';
  sunset_time: string;
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

export interface LocationData {
  lat: number;
  lng: number;
  name?: string;
}
