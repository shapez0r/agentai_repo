import React, { useState, useEffect } from 'react';
import { Typography, Box, Grid, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay } from 'react-leaflet';
import { Line } from 'react-chartjs-2';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { format } from 'date-fns';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import TimeRangeSlider from './TimeRangeSlider';

// Fix for Leaflet marker icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    clouds: number;
    weather: Array<{ description: string }>;
  };
  daily: Array<{
    dt: number;
    temp: {
      day: number;
      min: number;
      max: number;
    };
    humidity: number;
    wind_speed: number;
    clouds: number;
    weather: Array<{ description: string }>;
    precipitation: number;
  }>;
}

const MOSCOW_COORDS = { lat: 55.7558, lon: 37.6173 };
const OPENWEATHER_API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || 'YOUR_API_KEY'; // Replace with actual API key

const WeatherDashboard: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(7);
  const [cloudOverlayUrl, setCloudOverlayUrl] = useState<string>('');

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        
        // Fetch current weather and forecast
        const response = await axios.get(
          `https://api.openweathermap.org/data/3.0/onecall?lat=${MOSCOW_COORDS.lat}&lon=${MOSCOW_COORDS.lon}&exclude=minutely,hourly&units=metric&appid=${OPENWEATHER_API_KEY}`
        );

        // Fetch cloud layer
        const cloudLayerUrl = `https://tile.openweathermap.org/map/clouds_new/0/0/0.png?appid=${OPENWEATHER_API_KEY}`;
        setCloudOverlayUrl(cloudLayerUrl);

        const weatherData: WeatherData = {
          current: {
            temp: response.data.current.temp,
            feels_like: response.data.current.feels_like,
            humidity: response.data.current.humidity,
            wind_speed: response.data.current.wind_speed,
            clouds: response.data.current.clouds,
            weather: response.data.current.weather
          },
          daily: response.data.daily.map((day: any) => ({
            dt: day.dt * 1000,
            temp: {
              day: day.temp.day,
              min: day.temp.min,
              max: day.temp.max
            },
            humidity: day.humidity,
            wind_speed: day.wind_speed,
            clouds: day.clouds,
            weather: day.weather,
            precipitation: (day.rain || 0) + (day.snow || 0)
          }))
        };

        setWeatherData(weatherData);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 900000); // Update every 15 minutes
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (loading || !weatherData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const chartData = {
    labels: weatherData.daily
      .slice(0, timeRange)
      .map(day => format(new Date(day.dt), 'dd MMM')),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: weatherData.daily
          .slice(0, timeRange)
          .map(day => day.temp.day),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Cloud Cover (%)',
        data: weatherData.daily
          .slice(0, timeRange)
          .map(day => day.clouds),
        borderColor: 'rgb(128, 128, 128)',
        backgroundColor: 'rgba(128, 128, 128, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Moscow Weather Forecast',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Cloud Cover (%)'
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const bounds = [
    [MOSCOW_COORDS.lat - 5, MOSCOW_COORDS.lon - 5],
    [MOSCOW_COORDS.lat + 5, MOSCOW_COORDS.lon + 5]
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 300, mb: 2 }}>
            <MapContainer
              center={[MOSCOW_COORDS.lat, MOSCOW_COORDS.lon]}
              zoom={8}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {cloudOverlayUrl && (
                <ImageOverlay
                  url={cloudOverlayUrl}
                  bounds={bounds as L.LatLngBoundsExpression}
                  opacity={0.6}
                />
              )}
              <Marker position={[MOSCOW_COORDS.lat, MOSCOW_COORDS.lon]}>
                <Popup>
                  Moscow<br />
                  Temperature: {weatherData.current.temp.toFixed(1)}°C<br />
                  {weatherData.current.weather[0].description}<br />
                  Cloud cover: {weatherData.current.clouds}%
                </Popup>
              </Marker>
            </MapContainer>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Current Weather
            </Typography>
            <Typography>
              Temperature: {weatherData.current.temp.toFixed(1)}°C
            </Typography>
            <Typography>
              Feels like: {weatherData.current.feels_like.toFixed(1)}°C
            </Typography>
            <Typography>
              Humidity: {weatherData.current.humidity}%
            </Typography>
            <Typography>
              Wind: {weatherData.current.wind_speed.toFixed(1)} m/s
            </Typography>
            <Typography>
              Cloud cover: {weatherData.current.clouds}%
            </Typography>
            <Typography>
              Conditions: {weatherData.current.weather[0].description}
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <TimeRangeSlider
        value={timeRange}
        onChange={setTimeRange}
        min={1}
        max={Math.min(7, weatherData.daily.length)}
      />

      <Box sx={{ flexGrow: 1, position: 'relative', mt: 2 }}>
        <Line options={chartOptions} data={chartData} />
      </Box>
    </Box>
  );
};

export default WeatherDashboard; 