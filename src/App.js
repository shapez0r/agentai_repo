import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Create a custom marker icon function based on ping color
function createMarkerIcon(pingValue) {
  const color = getPingColor(pingValue || 'N/A');
  
  return L.divIcon({
    className: 'custom-ping-marker',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

// Application version - updated during build process
const VERSION = "36b0a7fb1571245dac78af4604c4cdf93f275a88";

// Added text encoding function to ensure proper character handling
function encodeNonLatinChars(text) {
  // Text is properly handled by React and modern browsers with UTF-8
  // However, we need to ensure localStorage and data transfers handle it correctly
  if (!text) return '';
  
  try {
    // For localStorage and data transfers, ensure proper encoding
    // This preserves all Unicode characters including Cyrillic, Asian scripts, etc.
    return String(text);
  } catch (e) {
    console.error('Error handling text encoding:', e);
    return text || '';
  }
}

// Function to determine color based on ping value
function getPingColor(pingText) {
  // Extract ping value from the string (e.g. '120 ms' -> 120)
  const pingValue = parseInt(pingText);
  
  // Return a neutral color if ping is not a valid number
  if (isNaN(pingValue) || pingText === 'N/A') {
    return '#999'; // Gray for invalid or N/A ping
  }
  
  // Define minimum and maximum ping thresholds
  const minPing = 10;    // Below this is excellent (green)
  const maxPing = 1000;  // Above this is terrible (red)
  
  // Calculate color based on ping value
  if (pingValue <= minPing) {
    return '#00ff00'; // Pure green for excellent ping
  } else if (pingValue >= maxPing) {
    return '#ff0000'; // Pure red for terrible ping
  } else {
    // Create a gradient between green-yellow-red
    // Normalize ping value between 0 and 1
    const normalizedPing = (pingValue - minPing) / (maxPing - minPing);
    
    // Calculate RGB values for gradient
    let r, g;
    
    if (normalizedPing < 0.5) {
      // Green to Yellow gradient for first half (0 to 0.5)
      r = Math.round(255 * (normalizedPing * 2));
      g = 255;
    } else {
      // Yellow to Red gradient for second half (0.5 to 1)
      r = 255;
      g = Math.round(255 * (1 - (normalizedPing - 0.5) * 2));
    }
    
    // Convert RGB to hex color code
    return `rgb(${r}, ${g}, 0)`;
  }
}

const geoOptions = [
  { name: { en: 'Moscow', ru: encodeNonLatinChars('Москва') }, url: 'https://yandex.ru', code: 'ru', coords: [55.7558, 37.6173] },
  { name: { en: 'London', ru: encodeNonLatinChars('Лондон') }, url: 'https://www.bbc.co.uk', code: 'eu', coords: [51.5074, -0.1278] },
  { name: { en: 'New York', ru: encodeNonLatinChars('Нью-Йорк') }, url: 'https://www.google.com', code: 'us', coords: [40.7128, -74.0060] },
  { name: { en: 'Singapore', ru: encodeNonLatinChars('Сингапур') }, url: 'https://www.singtel.com', code: 'sg', coords: [1.3521, 103.8198] },
  { name: { en: 'Sao Paulo', ru: encodeNonLatinChars('Сан-Паулу') }, url: 'https://www.globo.com', code: 'br', coords: [-23.5505, -46.6333] },
  { name: { en: 'Mumbai', ru: encodeNonLatinChars('Мумбаи') }, url: 'https://www.airtel.in', code: 'in', coords: [19.0760, 72.8777] },
  { name: { en: 'Sydney', ru: encodeNonLatinChars('Сидней') }, url: 'https://www.telstra.com.au', code: 'au', coords: [-33.8688, 151.2093] },
  { name: { en: 'Johannesburg', ru: encodeNonLatinChars('Йоханнесбург') }, url: 'https://www.telkom.co.za', code: 'za', coords: [-26.2041, 28.0473] },
  { name: { en: 'Tokyo', ru: encodeNonLatinChars('Токио') }, url: 'https://www.yahoo.co.jp', code: 'jp', coords: [35.6762, 139.6503] },
  { name: { en: 'Toronto', ru: encodeNonLatinChars('Торонто') }, url: 'https://www.cbc.ca', code: 'ca', coords: [43.6532, -79.3832] },
];

const speedTestOptions = [
  { name: { en: 'New York', ru: 'Нью-Йорк', es: 'Nueva York', de: 'New York' }, url: 'https://speed.cloudflare.com/__down?bytes=10000000', code: 'us', cors: true },
  { name: { en: 'Singapore', ru: 'Сингапур', es: 'Singapur', de: 'Singapur' }, url: 'https://speed.cloudflare.com/__down?bytes=10000000', code: 'sg', cors: true },
];

const translations = {
  en: {
    connectionTester: 'Supertester',
    latencyTargets: 'Latency Targets:',
    downloadFrom: 'Download From:',
    testMyConnection: 'Test My Connection',
    testing: 'Testing...',
    ipDetection: 'IP Detection',
    latency: 'Latency',
    downloadSpeed: 'Download Speed',
    designed: 'Designed for 2025',
    worldLatencyMap: 'World Latency Map',
  },
  ru: {
    connectionTester: 'СуперТестер',
    latencyTargets: 'Цели для задержки:',
    downloadFrom: 'Скачать из:',
    testMyConnection: 'Проверить моё соединение',
    testing: 'Тестирование...',
    ipDetection: 'Определение IP',
    latency: 'Задержка',
    downloadSpeed: 'Скорость загрузки',
    designed: 'Дизайн 2025',
    worldLatencyMap: 'Карта задержек в мире',
  },
  es: {
    connectionTester: 'Supertester',
    latencyTargets: 'Objetivos de latencia:',
    downloadFrom: 'Descargar de:',
    testMyConnection: 'Probar mi conexión',
    testing: 'Probando...',
    ipDetection: 'Detección de IP',
    latency: 'Latencia',
    downloadSpeed: 'Velocidad de descarga',
    designed: 'Diseñado para 2025',
    worldLatencyMap: 'Mapa de latencia mundial',
  },
  de: {
    connectionTester: 'Supertester',
    latencyTargets: 'Latenzziele:',
    downloadFrom: 'Herunterladen von:',
    testMyConnection: 'Verbindung testen',
    testing: 'Teste...',
    ipDetection: 'IP-Erkennung',
    latency: 'Latenz',
    downloadSpeed: 'Download-Geschwindigkeit',
    designed: 'Entworfen für 2025',
    worldLatencyMap: 'Weltkarte der Latenzzeiten',
  }
};

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
];

function getSavedLang() {
  return localStorage.getItem('lang') || 'en';
}

// Function to test ping to all destinations
async function testPing(setIp, setLatency, setTestingPing) {
  setTestingPing(true);
  setLatency({});
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    setIp(data.ip);
  } catch {
    setIp('Error');
  }
  const latencyResults = {};
  for (const target of geoOptions) {
    const start = performance.now();
    try {
      await fetch(target.url, { mode: 'no-cors' });
      latencyResults[target.name.en] = Math.round(performance.now() - start) + ' ms';
    } catch {
      latencyResults[target.name.en] = 'N/A';
    }
  }
  setLatency(latencyResults);
  setTestingPing(false);
  return latencyResults;
}

// Function to test ping to a single destination
async function testSinglePing(target, setLatency, latency) {
  const start = performance.now();
  try {
    await fetch(target.url, { mode: 'no-cors' });
    const pingResult = Math.round(performance.now() - start) + ' ms';
    setLatency(prev => ({
      ...prev,
      [target.name.en]: pingResult
    }));
    return pingResult;
  } catch {
    setLatency(prev => ({
      ...prev,
      [target.name.en]: 'N/A'
    }));
    return 'N/A';
  }
}

function App() {
  const [ip, setIp] = useState('');
  const [latency, setLatency] = useState({});
  const [testingPing, setTestingPing] = useState(false);
  const [lang, setLang] = useState(getSavedLang());
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    // Test ping automatically when app loads
    testPing(setIp, setLatency, setTestingPing);
  }, []);

  return (
    <div className="App" style={{
      minHeight: '100vh',
      color: '#fff',
      padding: 0,
      margin: 0,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <h1 className="rainbow-title">{t.connectionTester}</h1>
      
      {/* Version tag under the main title */}
      <div style={{ 
        fontSize: '12px', 
        marginBottom: '20px', 
        color: '#00c6ff70',
        fontFamily: 'monospace'
      }}>
        v.{VERSION}
      </div>
      
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center', justifyContent: 'flex-end', width: '100%', maxWidth: 1100 }}>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <label htmlFor="lang-select" style={{ fontWeight: 600, fontSize: 18, color: '#00c6ff', marginRight: 8 }}>
            {lang === 'ru' ? 'Язык:' : 'Language:'}
          </label>
          <select
            id="lang-select"
            value={lang}
            onChange={e => setLang(e.target.value)}
            style={{ fontSize: 18, borderRadius: 8, padding: '4px 12px', fontWeight: 600 }}
            aria-label={lang === 'ru' ? 'Язык' : 'Language'}
          >
            {languageOptions.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: 40,
        justifyContent: 'center',
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto',
        flexWrap: 'wrap',
      }}>
        {/* IP Detection */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1.5px solid #00c6ff33',
          borderRadius: 24,
          padding: 32,
          minWidth: 260,
          boxShadow: '0 2px 16px 0 rgba(0,198,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, letterSpacing: -1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{t.ipDetection}</h2>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: 1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{ip ? ip : '-'}</div>
        </div>
        {/* Latency */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1.5px solid #00c6ff33',
          borderRadius: 24,
          padding: 32,
          minWidth: 260,
          boxShadow: '0 2px 16px 0 rgba(0,198,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, letterSpacing: -1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{t.latency}</h2>
          {/* Ping color legend */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '20px',
            marginBottom: '12px',
            padding: '8px',
            borderRadius: '10px',
            background: 'rgba(0,0,0,0.2)',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00ff00' }}></div>
              <span>&lt;10ms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#aaff00' }}></div>
              <span>&lt;100ms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffff00' }}></div>
              <span>&lt;250ms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff8800' }}></div>
              <span>&lt;500ms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff0000' }}></div>
              <span>&gt;1000ms</span>
            </div>
          </div>
          <div style={{ width: '100%' }}>
            {geoOptions.map(target => (
              <div key={target.code} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 110px', alignItems: 'center', fontSize: 22, fontWeight: 500, margin: '10px 0', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', letterSpacing: 0.5 }}>
                <img src={`https://flagcdn.com/32x24/${target.code}.png`} alt={target.name[lang]} style={{ width: 32, height: 24, borderRadius: 4, boxShadow: '0 1px 4px #0002', flexShrink: 0, justifySelf: 'start' }} />
                <span style={{ color: '#00c6ff', fontWeight: 700, minWidth: 120, textAlign: 'left', flexShrink: 0 }}>{target.name[lang]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: getPingColor(latency[target.name.en] || latency[target.name.ru] || '-'),
                    boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                  }}></div>
                  <span style={{ 
                    fontWeight: 600, 
                    color: getPingColor(latency[target.name.en] || latency[target.name.ru] || '-'), 
                    minWidth: 70, 
                    textAlign: 'left', 
                    justifySelf: 'start' 
                  }}>{testingPing ? t.testing : (latency[target.name.en] || latency[target.name.ru] || '-')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1.5px solid #00c6ff33',
        borderRadius: 24,
        padding: 32,
        marginTop: 40,
        width: '100%',
        maxWidth: 1100,
        boxShadow: '0 2px 16px 0 rgba(0,198,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, letterSpacing: -1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{t.worldLatencyMap}</h2>
        
        {/* Map container */}
        <div style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', marginTop: '16px' }}>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ width: '100%', height: '100%' }}
            minZoom={1}
            maxZoom={10}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoOptions.map((location) => (
              <Marker 
                key={location.code} 
                position={location.coords} 
                icon={createMarkerIcon(latency[location.name.en] || latency[location.name.ru] || '-')}
                eventHandlers={{
                  click: () => {
                    // Test ping for this location when clicking on the marker
                    testSinglePing(location, setLatency, latency);
                  },
                }}
              >
                <Popup>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{location.name[lang] || location.name.en}</div>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '16px',
                      color: getPingColor(latency[location.name.en] || latency[location.name.ru] || '-')
                    }}>
                      {testingPing && !latency[location.name.en] ? t.testing : (latency[location.name.en] || latency[location.name.ru] || '-')}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        testSinglePing(location, setLatency, latency);
                      }}
                      style={{
                        marginTop: '10px',
                        padding: '5px 10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '15px',
                        border: 'none',
                        background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'ru' ? 'Обновить пинг' : 'Update Ping'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
      
      <footer style={{
        marginTop: 64,
        color: '#00c6ff99',
        fontWeight: 500,
        fontSize: 16,
        letterSpacing: 1,
        textAlign: 'center',
        opacity: 0.7,
      }}>
        &copy; {new Date().getFullYear()} Supertester &mdash; {t.designed}
      </footer>
    </div>
  );
}

export default App;
