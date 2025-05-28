import React, { useState, useEffect } from 'react';
import { Typography, Box, Grid, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
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
import TimeRangeSlider from './TimeRangeSlider';

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

interface RatesData {
  timestamp: number;
  rates: {
    EUR: number;
    USD: number;
    URALS: number;
  };
  history: Array<{
    timestamp: number;
    EUR: number;
    USD: number;
    URALS: number;
  }>;
}

interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

const CurrencyRates: React.FC = () => {
  console.log('CurrencyRates rendering');

  const [rates, setRates] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(7);

  useEffect(() => {
    console.log('CurrencyRates useEffect running');
    const fetchRates = async () => {
      try {
        // Получаем текущие курсы валют от ЦБ РФ
        const response = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
        const currentRates = {
          EUR: response.data.Valute.EUR.Value,
          USD: response.data.Valute.USD.Value,
          URALS: 0 // Will be updated below
        };

        // Получаем цену на нефть Urals
        const uralsResponse = await axios.get('https://api.oilpriceapi.com/v1/prices/latest', {
          headers: {
            'Authorization': 'Bearer YOUR_API_KEY' // Replace with actual API key
          },
          params: {
            by_type: 'urals'
          }
        });
        currentRates.URALS = uralsResponse.data.price;

        // Получаем исторические данные за последние 7 дней
        const historyData = [];
        for (let i = 1; i <= 7; i++) {
          const date = subDays(new Date(), i);
          const formattedDate = format(date, 'yyyy/MM/dd');
          try {
            const historyResponse = await axios.get(`https://www.cbr-xml-daily.ru/archive/${formattedDate}/daily_json.js`);
            const uralsHistoryResponse = await axios.get('https://api.oilpriceapi.com/v1/prices/historical', {
              headers: {
                'Authorization': 'Bearer YOUR_API_KEY' // Replace with actual API key
              },
              params: {
                by_type: 'urals',
                date: formattedDate
              }
            });
            
            historyData.push({
              timestamp: date.getTime(),
              EUR: historyResponse.data.Valute.EUR.Value,
              USD: historyResponse.data.Valute.USD.Value,
              URALS: uralsHistoryResponse.data.price
            });
          } catch (err) {
            console.warn(`Failed to fetch data for ${formattedDate}`, err);
          }
        }

        // Добавляем текущие данные в начало массива
        historyData.unshift({
          timestamp: Date.now(),
          EUR: currentRates.EUR,
          USD: currentRates.USD,
          URALS: currentRates.URALS
        });

        const ratesData: RatesData = {
          timestamp: Date.now(),
          rates: currentRates,
          history: historyData
        };

        console.log('Real data fetched:', ratesData);
        setRates(ratesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching currency rates:', error);
        setError('Failed to load currency rates');
        setLoading(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (loading || !rates) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const chartData = {
    labels: rates.history
      .slice(0, timeRange)
      .map(entry => format(new Date(entry.timestamp), 'dd.MM HH:mm')),
    datasets: [
      {
        label: 'EUR/RUB',
        data: rates.history
          .slice(0, timeRange)
          .map(entry => entry.EUR),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'USD/RUB',
        data: rates.history
          .slice(0, timeRange)
          .map(entry => entry.USD),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Urals (USD)',
        data: rates.history
          .slice(0, timeRange)
          .map(entry => entry.URALS),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  console.log('Chart data prepared:', chartData);

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
        text: 'Currency Rates & Urals Oil Price',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Exchange Rate (RUB)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Oil Price (USD)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Typography variant="h6" color="primary">
            EUR/RUB: {rates.rates.EUR.toFixed(2)}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h6" color="secondary">
            USD/RUB: {rates.rates.USD.toFixed(2)}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h6" sx={{ color: 'rgb(255, 159, 64)' }}>
            Urals: ${rates.rates.URALS.toFixed(2)}
          </Typography>
        </Grid>
      </Grid>

      <TimeRangeSlider
        value={timeRange}
        onChange={setTimeRange}
        min={1}
        max={Math.min(30, rates.history.length)}
      />

      <Box sx={{ flexGrow: 1, position: 'relative', mt: 2 }}>
        <Line options={chartOptions} data={chartData} />
      </Box>
    </Box>
  );
};

export default CurrencyRates; 