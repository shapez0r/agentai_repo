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
        
        // Получаем текущую погоду от MeteoService
        const currentResponse = await axios.get(
          `https://meteoservice.ru/api/weather/current?lat=${MOSCOW_COORDS.lat}&lon=${MOSCOW_COORDS.lon}`
        );

        // Получаем прогноз на 7 дней
        const forecastResponse = await axios.get(
          `https://meteoservice.ru/api/weather/forecast?lat=${MOSCOW_COORDS.lat}&lon=${MOSCOW_COORDS.lon}&days=7`
        );

        // Получаем карту облачности от EUMETSAT (бесплатный сервис)
        const cloudLayerUrl = `https://view.eumetsat.int/geoserver/wms/msg_fci_clouds_rgb/index.html?lat=${MOSCOW_COORDS.lat}&lon=${MOSCOW_COORDS.lon}&zoom=8`;
        setCloudOverlayUrl(cloudLayerUrl);

        const weatherData: WeatherData = {
          current: {
            temp: currentResponse.data.temperature,
            feels_like: currentResponse.data.feels_like,
            humidity: currentResponse.data.humidity,
            wind_speed: currentResponse.data.wind_speed,
            clouds: currentResponse.data.clouds,
            weather: [{ description: currentResponse.data.description }]
          },
          daily: forecastResponse.data.forecast.map((day: any) => ({
            dt: new Date(day.date).getTime(),
            temp: {
              day: day.temperature.day,
              min: day.temperature.min,
              max: day.temperature.max
            },
            humidity: day.humidity,
            wind_speed: day.wind_speed,
            clouds: day.clouds,
            weather: [{ description: day.description }],
            precipitation: day.precipitation
          }))
        };

        setWeatherData(weatherData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        
        // Если API недоступен, используем данные от другого бесплатного сервиса
        try {
          const backupResponse = await axios.get(
            `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${MOSCOW_COORDS.lat}&lon=${MOSCOW_COORDS.lon}`
          );
          
          const current = backupResponse.data.properties.timeseries[0];
          const weatherData: WeatherData = {
            current: {
              temp: current.data.instant.details.air_temperature,
              feels_like: current.data.instant.details.air_temperature - 2,
              humidity: current.data.instant.details.relative_humidity,
              wind_speed: current.data.instant.details.wind_speed,
              clouds: current.data.instant.details.cloud_area_fraction,
              weather: [{ description: current.data.next_1_hours.summary.symbol_code }]
            },
            daily: backupResponse.data.properties.timeseries
              .filter((entry: any, index: number) => index % 24 === 0)
              .slice(0, 7)
              .map((day: any) => ({
                dt: new Date(day.time).getTime(),
                temp: {
                  day: day.data.instant.details.air_temperature,
                  min: day.data.instant.details.air_temperature - 3,
                  max: day.data.instant.details.air_temperature + 3
                },
                humidity: day.data.instant.details.relative_humidity,
                wind_speed: day.data.instant.details.wind_speed,
                clouds: day.data.instant.details.cloud_area_fraction,
                weather: [{ description: day.data.next_1_hours?.summary.symbol_code || 'переменная облачность' }],
                precipitation: day.data.next_1_hours?.details.precipitation_amount || 0
              }))
          };
          
          setWeatherData(weatherData);
          setLoading(false);
        } catch (backupError) {
          console.error('Backup weather service also failed:', backupError);
          setError('Не удалось загрузить данные о погоде. Пожалуйста, попробуйте позже.');
          setLoading(false);
        }
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
        label: 'Температура (°C)',
        data: weatherData.daily
          .slice(0, timeRange)
          .map(day => day.temp.day),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Облачность (%)',
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
        text: 'Прогноз погоды в Москве',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Температура (°C)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Облачность (%)'
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
                  Москва<br />
                  Температура: {weatherData.current.temp.toFixed(1)}°C<br />
                  {weatherData.current.weather[0].description}<br />
                  Облачность: {weatherData.current.clouds}%
                </Popup>
              </Marker>
            </MapContainer>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Текущая погода
            </Typography>
            <Typography>
              Температура: {weatherData.current.temp.toFixed(1)}°C
            </Typography>
            <Typography>
              Ощущается как: {weatherData.current.feels_like.toFixed(1)}°C
            </Typography>
            <Typography>
              Влажность: {weatherData.current.humidity}%
            </Typography>
            <Typography>
              Ветер: {weatherData.current.wind_speed.toFixed(1)} м/с
            </Typography>
            <Typography>
              Облачность: {weatherData.current.clouds}%
            </Typography>
            <Typography>
              Условия: {weatherData.current.weather[0].description}
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