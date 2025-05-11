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
const VERSION = "fcb884bd1930af3fca0a31e95c28c267d548d15c";

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

// Updated with CDN endpoints that are actually hosted in the specified cities
// Using Cloudflare and other global CDN networks for more accurate measurements from Ireland
const geoOptions = [
  // Moscow - Using Yandex CDN
  { name: { en: 'Moscow', ru: encodeNonLatinChars('Москва') }, url: 'https://yastatic.net/s3/home/ru/touch/ru_logo.svg', code: 'ru', coords: [55.7558, 37.6173] },
  // London - Using UK-based Fastly CDN endpoint
  { name: { en: 'London', ru: encodeNonLatinChars('Лондон') }, url: 'https://www.bbc.co.uk/favicon.ico', code: 'gb', coords: [51.5074, -0.1278] },
  // New York - Using Cloudflare CDN with New York datacenter
  { name: { en: 'New York', ru: encodeNonLatinChars('Нью-Йорк') }, url: 'https://speed-ewr.cloudflare.com/__down?bytes=1000', code: 'us', coords: [40.7128, -74.0060] },
  // Singapore - Using Cloudflare CDN with Singapore datacenter
  { name: { en: 'Singapore', ru: encodeNonLatinChars('Сингапур') }, url: 'https://speed-sin.cloudflare.com/__down?bytes=1000', code: 'sg', coords: [1.3521, 103.8198] },
  // Sao Paulo - Using Cloudflare CDN with Sao Paulo datacenter
  { name: { en: 'Sao Paulo', ru: encodeNonLatinChars('Сан-Паулу') }, url: 'https://speed-gru.cloudflare.com/__down?bytes=1000', code: 'br', coords: [-23.5505, -46.6333] },
  // Mumbai - Using Cloudflare CDN with Mumbai datacenter
  { name: { en: 'Mumbai', ru: encodeNonLatinChars('Мумбаи') }, url: 'https://speed-bom.cloudflare.com/__down?bytes=1000', code: 'in', coords: [19.0760, 72.8777] },
  // Sydney - Using Cloudflare CDN with Sydney datacenter
  { name: { en: 'Sydney', ru: encodeNonLatinChars('Сидней') }, url: 'https://speed-syd.cloudflare.com/__down?bytes=1000', code: 'au', coords: [-33.8688, 151.2093] },
  // Johannesburg - Using Cloudflare CDN with Johannesburg datacenter
  { name: { en: 'Johannesburg', ru: encodeNonLatinChars('Йоханнесбург') }, url: 'https://speed-jnb.cloudflare.com/__down?bytes=1000', code: 'za', coords: [-26.2041, 28.0473] },
  // Tokyo - Using Cloudflare CDN with Tokyo datacenter
  { name: { en: 'Tokyo', ru: encodeNonLatinChars('Токио') }, url: 'https://speed-nrt.cloudflare.com/__down?bytes=1000', code: 'jp', coords: [35.6762, 139.6503] },
  // Toronto - Using Cloudflare CDN with Toronto datacenter  
  { name: { en: 'Toronto', ru: encodeNonLatinChars('Торонто') }, url: 'https://speed-yyz.cloudflare.com/__down?bytes=1000', code: 'ca', coords: [43.6532, -79.3832] },
];

// Updated speed test options to use Cloudflare's regional endpoints
const speedTestOptions = [
  // New York - Using Cloudflare's EWR data center (Newark, NJ - close to NYC)
  { name: { en: 'New York', ru: 'Нью-Йорк', es: 'Nueva York', de: 'New York' }, 
    url: 'https://speed-ewr.cloudflare.com/__down?bytes=10000000', 
    code: 'us', cors: true },
  // Singapore - Using Cloudflare's SIN data center (Singapore)
  { name: { en: 'Singapore', ru: 'Сингапур', es: 'Singapur', de: 'Singapur' }, 
    url: 'https://speed-sin.cloudflare.com/__down?bytes=10000000', 
    code: 'sg', cors: true },
];

const translations = {
  en: {
    connectionTester: 'Supertester',
    latencyTargets: 'Latency Targets:',
    downloadFrom: 'Download From:',
    testMyConnection: 'Test My Connection',
    updating: '...',
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
    updating: 'обновление...',
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
    updating: '...',
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
    updating: '...',
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
    // Get IP address from ipify API
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    setIp(data.ip);
  } catch (error) {
    console.error("Error fetching IP:", error);
    setIp('Error');
  }
  
  // Test latency to each destination
  const latencyResults = {};
  for (const target of geoOptions) {
    const start = performance.now();
    try {
      // Use no-cors mode to avoid CORS issues with different sites
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
      
      const response = await fetch(target.url, { 
        mode: 'no-cors',
        cache: 'no-store', // Don't use cache for accurate measurements
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Calculate and format latency
      const pingTime = Math.round(performance.now() - start);
      latencyResults[target.name.en] = pingTime + ' ms';
      console.log(`Ping to ${target.name.en} (${target.url}): ${pingTime}ms`);
    } catch (error) {
      console.error(`Error pinging ${target.name.en} (${target.url}):`, error);
      latencyResults[target.name.en] = 'N/A';
    }
  }
  
  setLatency(latencyResults);
  setTestingPing(false);
  return latencyResults;
}

// Function to test ping to a single destination
async function testSinglePing(target, setLatency) {
  const start = performance.now();
  try {
    // Use no-cors mode to avoid CORS issues with different sites
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    
    const response = await fetch(target.url, { 
      mode: 'no-cors',
      cache: 'no-store', // Don't use cache for accurate measurements
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Calculate and format latency
    const pingResult = Math.round(performance.now() - start) + ' ms';
    console.log(`Single ping to ${target.name.en} (${target.url}): ${pingResult}`);
    
    setLatency(prev => ({
      ...prev,
      [target.name.en]: pingResult
    }));
    return pingResult;
  } catch (error) {
    console.error(`Error with single ping to ${target.name.en} (${target.url}):`, error);
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

  // Запускаем тест пинга при загрузке приложения
  useEffect(() => {
    testPing(setIp, setLatency, setTestingPing);
    
    // Устанавливаем интервал обновления пинга каждые 5 секунд (pingTest каждые 5000 ms)
    const pingTestIntervalMs = 5000; // 5 секунд
    console.log("Настройка автообновления пинга каждые " + pingTestIntervalMs/1000 + " секунд");
    const intervalId = setInterval(() => {
      testPing(setIp, setLatency, setTestingPing);
    }, pingTestIntervalMs);
    
    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(intervalId);
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
      
      {/* Версия и IP в одной строке */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '30px',
        marginBottom: '20px',
        fontSize: '12px',
        color: '#00c6ff70',
        fontFamily: 'monospace'
      }}>
        <span>v.{VERSION}</span>
        <span>IP: {ip ? ip : '-'}</span>
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

      {/* Карта на верхней части сайта */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1.5px solid #00c6ff33',
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 1100,
        boxShadow: '0 2px 16px 0 rgba(0,198,255,0.07)',
        marginBottom: '30px',
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, letterSpacing: -1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{t.worldLatencyMap}</h2>
        
        {/* Контейнер для карты и списка пинга */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Карта */}
          <div style={{ width: '75%', height: '400px', borderRadius: '12px', overflow: 'hidden', marginTop: '16px' }}>
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
                  icon={createMarkerIcon(latency[location.name.en] || latency[location.name.ru] || '300 ms')}
                >
                  <Popup>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{location.name[lang] || location.name.en}</div>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '16px',
                        color: getPingColor(latency[location.name.en] || latency[location.name.ru] || '300 ms')
                      }}>
                        {testingPing && !latency[location.name.en] ? t.updating : (latency[location.name.en] || latency[location.name.ru] || '-')}
                      </div>
                      {/* Удалены кнопки обновления */}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          
          {/* Компактный список пинга справа от карты */}
          <div style={{
            width: '25%', 
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '15px',
            height: '400px',
            overflowY: 'auto',
            marginTop: '16px',
            /* Компактный размер для списка пинга */
            fontSize: 'small',
            compact: 'true'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', textAlign: 'center' }}>{t.latency}</h3>
            {/* Легенда цветов пинга */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '12px',
              padding: '8px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.2)',
              fontSize: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00ff00' }}></div>
                <span>&lt;10ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#aaff00' }}></div>
                <span>&lt;100ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffff00' }}></div>
                <span>&lt;250ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff8800' }}></div>
                <span>&lt;500ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff0000' }}></div>
                <span>&gt;1000ms</span>
              </div>
            </div>
            
            {/* Список локаций с пингом */}
            <div style={{ width: '100%' }}>
              {geoOptions.map(target => (
                <div key={target.code} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 70px', alignItems: 'center', fontSize: 14, fontWeight: 400, margin: '8px 0', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
                  <img src={`https://flagcdn.com/32x24/${target.code}.png`} alt={target.name[lang]} style={{ width: 24, height: 18, borderRadius: 3, boxShadow: '0 1px 4px #0002', flexShrink: 0, justifySelf: 'start' }} />
                  <span style={{ color: '#00c6ff', fontWeight: 600, minWidth: 80, textAlign: 'left', flexShrink: 0 }}>{target.name[lang]}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-start' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: getPingColor(latency[target.name.en] || latency[target.name.ru] || '-'),
                      boxShadow: '0 0 3px rgba(0,0,0,0.3)'
                    }}></div>
                    <span style={{ 
                      fontWeight: 600, 
                      color: getPingColor(latency[target.name.en] || latency[target.name.ru] || '-'), 
                      minWidth: 50, 
                      textAlign: 'left', 
                      justifySelf: 'start',
                      fontSize: '12px'
                    }}>{testingPing && !latency[target.name.en] ? t.updating : (latency[target.name.en] || latency[target.name.ru] || '-')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
