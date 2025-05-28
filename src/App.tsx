import React, { useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Container, Grid, Paper, CircularProgress } from '@mui/material';
import WeatherDashboard from './components/WeatherDashboard';
import CurrencyRates from './components/CurrencyRates';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#0a1929',
      paper: '#132f4c',
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          height: '100vh',
          paddingTop: '2rem',
          paddingBottom: '2rem',
        },
      },
    },
  },
});

function App() {
  useEffect(() => {
    console.log('App component mounted');
    return () => {
      console.log('App component unmounted');
    };
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <React.Suspense fallback={
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Container>
      }>
        <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={3} sx={{ flexGrow: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <WeatherDashboard />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <CurrencyRates />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </React.Suspense>
    </ThemeProvider>
  );
}

export default App; 