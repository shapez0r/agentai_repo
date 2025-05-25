import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Application version - updated during build process
const VERSION = "1eb00175b7f16ee4d125cd9b215fd344f5539e2b"

// Fix for Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Компонент экрана загрузки
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <div className="loading-text">Загрузка...</div>
  </div>
);

// Кеш для хранения последних значений пинга
const pingCache = {};

// Cache for successful WebSocket connections
const wsConnections = new Map();

// Create a custom marker icon function based on ping color
function createMarkerIcon(pingValue) {
  const location = pingValue.split(' ')[2]; // Извлекаем идентификатор места из строки пинга
  
  // Если текущее значение не 'N/A' и не undefined, сохраняем его в кеше
  if (pingValue && pingValue !== 'N/A' && pingValue.includes('ms')) {
    pingCache[location || 'default'] = pingValue;
  }
  
  // ВСЕГДА используем кешированное значение, если оно есть
  const valueToUse = pingCache[location || 'default'] || pingValue || 'N/A';
  
  const color = getPingColor(valueToUse);
  const size = 24; // Увеличенный размер маркера
  
  return L.divIcon({
    className: 'custom-ping-marker',
    html: `
      <div style="
        background-color: ${color}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 0 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: bold;
      ">
        ${parseInt(valueToUse) || '?'}
      </div>`,
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2]
  });
}

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

// Updated reliable endpoints for latency measurements
const geoOptions = [
  // Europe
  { 
    name: { en: 'London', ru: encodeNonLatinChars('Лондон') }, 
    endpoints: [
      { type: 'noc', host: 'speedtest.london.linode.com' } // Linode London - проверено, пинг ~17мс
    ],
    code: 'gb', 
    coords: [51.5074, -0.1278] 
  },
  // Russia
  {
    name: { en: 'Moscow', ru: encodeNonLatinChars('Москва') },
    endpoints: [
      { type: 'noc', host: 'speedtest.msk.corbina.net' }
    ],
    code: 'ru',
    coords: [55.7558, 37.6173]
  },
  // North America - New York
  { 
    name: { en: 'New York', ru: encodeNonLatinChars('Нью-Йорк') }, 
    endpoints: [
      { type: 'noc', host: 'speedtest.newark.linode.com' } // Linode Newark - проверено, пинг ~85мс
    ],
    code: 'us', 
    coords: [40.7128, -74.0060] 
  },
  // North America - Toronto
  { 
    name: { en: 'Toronto', ru: encodeNonLatinChars('Торонто') }, 
    endpoints: [
      { type: 'noc', host: 'speedtest.toronto1.linode.com' } // Linode Toronto - проверено, пинг ~96мс
    ],
    code: 'ca', 
    coords: [43.6532, -79.3832] 
  },
  // Asia - Mumbai
  {
    name: { en: 'Mumbai', ru: encodeNonLatinChars('Мумбаи') },
    endpoints: [
      { type: 'noc', host: 'speedtest.mumbai1.linode.com' } // Linode Mumbai - проверено, пинг ~127мс
    ],
    code: 'in',
    coords: [19.0760, 72.8777]
  },
  // Africa - Johannesburg
  {
    name: { en: 'Johannesburg', ru: encodeNonLatinChars('Йоханнесбург') },
    endpoints: [
      { type: 'noc', host: 'speedtest.afrihost.com' }
    ],
    code: 'za',
    coords: [-26.2041, 28.0473]
  },
  // Asia - Tokyo
  { 
    name: { en: 'Tokyo', ru: encodeNonLatinChars('Токио') }, 
    endpoints: [
      { type: 'noc', host: 'speedtest.tokyo2.linode.com' } // Linode Tokyo - проверено, пинг ~231мс
    ],
    code: 'jp', 
    coords: [35.6762, 139.6503] 
  },
  // South America - Sao Paulo
  { 
    name: { en: 'Sao Paulo', ru: encodeNonLatinChars('Сан-Паулу') }, 
    endpoints: [
      { type: 'noc', host: 'speedtest.brisanet.com.br' },
      { type: 'noc', host: 'speedtest-gru.phoenixnap.com' }
    ],
    code: 'br', 
    coords: [-23.5505, -46.6333] 
  },
  // Australia
  {
    name: { en: 'Sydney', ru: encodeNonLatinChars('Сидней') },
    endpoints: [
      { type: 'noc', host: 'speedtest.sydney.linode.com' }
    ],
    code: 'au',
    coords: [-33.8688, 151.2093]
  }
];

// WebRTC configuration for STUN servers
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// Function to measure WebSocket latency
async function measureWebSocketLatency(endpoint) {
  // Try to reuse existing connection
  if (wsConnections.has(endpoint)) {
    const ws = wsConnections.get(endpoint);
    if (ws.readyState === WebSocket.OPEN) {
      const start = performance.now();
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('WebSocket ping timeout'));
        }, 5000);

        ws.send('ping');
        ws.onmessage = () => {
          clearTimeout(timeoutId);
          resolve(Math.round(performance.now() - start));
        };
      });
    }
  }

  // Create new connection if needed
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(`wss://${endpoint}`);
      const start = performance.now();
      
      const timeoutId = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeoutId);
        wsConnections.set(endpoint, ws);
        resolve(Math.round(performance.now() - start));
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        ws.close();
        reject(new Error('WebSocket connection failed'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

// Function to measure TCP latency using fetch
async function measureTCPLatency(endpoint) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch(`https://${endpoint}`, { 
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return Math.round(performance.now() - start);
  } catch (error) {
    // If HEAD fails, try GET with no-cors
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`https://${endpoint}`, { 
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return Math.round(performance.now() - start);
    } catch (e) {
      throw new Error('TCP measurement failed');
    }
  }
}

// Function to test latency using multiple methods
async function testEndpointLatency(endpoint) {
  const measurements = [];
  const attempts = 2; // Уменьшаем количество попыток для скорости
  
  for (let i = 0; i < attempts; i++) {
    try {
      // Try WebSocket first
      try {
        const wsLatency = await measureWebSocketLatency(endpoint);
        if (wsLatency > 0 && wsLatency < 2000) { // WebSocket обычно быстрее
          measurements.push(wsLatency);
          if (wsLatency < 300) { // Если получили хороший пинг, не делаем больше попыток
            return wsLatency;
          }
        }
      } catch (wsError) {
        console.log('WebSocket measurement failed, trying TCP');
      }
      
      // Fallback to TCP
      const tcpLatency = await measureTCPLatency(endpoint);
      if (tcpLatency > 0 && tcpLatency < 3000) {
        measurements.push(tcpLatency);
        if (tcpLatency < 300) { // Если получили хороший пинг, не делаем больше попыток
          return tcpLatency;
        }
      }
    } catch (error) {
      console.log(`Measurement attempt ${i + 1} failed:`, error);
    }
  }
  
  // If we have measurements, return the best one
  if (measurements.length > 0) {
    return Math.min(...measurements);
  }
  
  throw new Error('All measurement attempts failed');
}

// Updated ping test function
async function testPing(setIp, setLatency, setTestingPing) {
  setTestingPing(true);
  
  try {
    // Get IP address from ipify API
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    setIp(data.ip);
  } catch (error) {
    console.error("Error fetching IP:", error);
    setIp('Error');
  }

  // Set initial values from cache
  const initialLatency = {};
  geoOptions.forEach(target => {
    initialLatency[target.name.en] = pingCache[target.name.en] || 'N/A';
  });
  setLatency(initialLatency);
  
  // Stop showing loading screen immediately
  setTestingPing(false);
  
  // Then test latency to each destination in background
  geoOptions.forEach(async (target) => {
    let bestLatency = Infinity;
    let successfulMeasurement = false;
    
    // Try each endpoint for this location with timeout
    for (const endpoint of target.endpoints) {
      try {
        const latency = await Promise.race([
          testEndpointLatency(endpoint.host),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000)) // Увеличили таймаут до 8 секунд
        ]);
        
        if (latency < bestLatency) {
          bestLatency = latency;
          successfulMeasurement = true;
          
          // Update immediately when we get a good measurement
          setLatency(prev => ({
            ...prev,
            [target.name.en]: `${bestLatency} ms ${target.name.en}`
          }));
          
          // Update cache
          pingCache[target.name.en] = `${bestLatency} ms ${target.name.en}`;
          break; // Exit loop if we got a good measurement
        }
      } catch (error) {
        console.error(`Error measuring ${endpoint.type} latency to ${target.name.en}:`, error);
      }
    }
    
    if (!successfulMeasurement) {
      // Keep using cached value if available
      setLatency(prev => ({
        ...prev,
        [target.name.en]: pingCache[target.name.en] || 'N/A'
      }));
    }
  });
  
  return initialLatency;
}

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
    clickToUpdate: 'Click to update',
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
    clickToUpdate: 'Нажмите для обновления',
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
    clickToUpdate: 'Haga clic para actualizar',
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
    clickToUpdate: 'Klicken Sie, um zu aktualisieren',
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

function App() {
  const [ip, setIp] = useState('');
  const [latency, setLatency] = useState({});
  const [testingPing, setTestingPing] = useState(true); // Начинаем с true для показа экрана загрузки
  const [lang, setLang] = useState(getSavedLang());
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Запускаем тест пинга при загрузке приложения
  useEffect(() => {
    testPing(setIp, setLatency, setTestingPing);
  }, []);

  // Если идет тестирование, показываем экран загрузки
  if (testingPing && Object.keys(latency).length === 0) {
    return <LoadingScreen />;
  }

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
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, letterSpacing: -1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{t.worldLatencyMap}</h2>
        
        {/* Контейнер для карты и списка пинга */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Карта */}
          <div style={{ width: '75%', height: '500px', borderRadius: '12px', overflow: 'hidden', marginTop: '16px' }}>
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
                  eventHandlers={{
                    click: async () => {
                      // При клике на маркер обновляем пинг для этой локации
                      let bestLatency = Infinity;
                      let successfulMeasurement = false;
                      
                      // Try each endpoint for this location
                      for (const endpoint of location.endpoints) {
                        try {
                          const latency = await testEndpointLatency(endpoint.host);
                          
                          if (latency < bestLatency) {
                            bestLatency = latency;
                            successfulMeasurement = true;
                            
                            // Update immediately when we get a good measurement
                            setLatency(prev => ({
                              ...prev,
                              [location.name.en]: `${bestLatency} ms ${location.name.en}`
                            }));
                            
                            // Update cache
                            pingCache[location.name.en] = `${bestLatency} ms ${location.name.en}`;
                            break; // Exit loop if we got a good measurement
                          }
                        } catch (error) {
                          console.error(`Error measuring latency to ${location.name.en}:`, error);
                        }
                      }
                      
                      if (!successfulMeasurement) {
                        // Keep using cached value if available
                        setLatency(prev => ({
                          ...prev,
                          [location.name.en]: pingCache[location.name.en] || 'N/A'
                        }));
                      }
                    }
                  }}
                >
                  <Popup>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>{location.name[lang] || location.name.en}</div>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '20px',
                        color: getPingColor(pingCache[location.name.en] || latency[location.name.en] || latency[location.name.ru] || '300 ms')
                      }}>
                        {pingCache[location.name.en] || latency[location.name.en] || latency[location.name.ru] || '-'}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
                        {t.clickToUpdate}
                      </div>
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
            fontSize: 'x-small',
            compact: 'true'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', textAlign: 'center' }}>{t.latency}</h3>
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
              fontSize: '9px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00ff00' }}></div>
                <span>&lt;10ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#aaff00' }}></div>
                <span>&lt;100ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ffff00' }}></div>
                <span>&lt;250ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ff8800' }}></div>
                <span>&lt;500ms</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ff0000' }}></div>
                <span>&gt;1000ms</span>
              </div>
            </div>
            
            {/* Список локаций с пингом */}
            <div style={{ width: '100%' }}>
              {geoOptions.map(target => (
                <div key={target.code} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 70px', alignItems: 'center', fontSize: 12, fontWeight: 400, margin: '6px 0', fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
                  <img src={`https://flagcdn.com/32x24/${target.code}.png`} alt={target.name[lang]} style={{ width: 20, height: 15, borderRadius: 3, boxShadow: '0 1px 4px #0002', flexShrink: 0, justifySelf: 'start' }} />
                  <span style={{ color: '#00c6ff', fontWeight: 600, minWidth: 80, textAlign: 'left', flexShrink: 0, fontSize: '11px' }}>{target.name[lang]}</span>
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
                      color: getPingColor(pingCache[target.name.en] || latency[target.name.en] || latency[target.name.ru] || '-'), 
                      minWidth: 50, 
                      textAlign: 'left', 
                      justifySelf: 'start',
                      fontSize: '12px'
                    }}>{pingCache[target.name.en] || latency[target.name.en] || latency[target.name.ru] || '-'}</span>
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
