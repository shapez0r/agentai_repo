import React, { useState, useEffect } from 'react';
import './App.css';

// Application version - updated during build process
const VERSION = "c6ad5a9981bed309253a1feca6b5c37cd93871e7";

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

const geoOptions = [
  { name: { en: 'Russia', ru: encodeNonLatinChars('Россия') }, url: 'https://yandex.ru', code: 'ru' },
  { name: { en: 'Europe', ru: encodeNonLatinChars('Европа') }, url: 'https://www.bbc.co.uk', code: 'eu' },
  { name: { en: 'US', ru: encodeNonLatinChars('США') }, url: 'https://www.google.com', code: 'us' },
  { name: { en: 'Singapore', ru: encodeNonLatinChars('Сингапур') }, url: 'https://www.singtel.com', code: 'sg' },
  { name: { en: 'Brazil', ru: encodeNonLatinChars('Бразилия') }, url: 'https://www.globo.com', code: 'br' },
  { name: { en: 'India', ru: encodeNonLatinChars('Индия') }, url: 'https://www.airtel.in', code: 'in' },
  { name: { en: 'Australia', ru: encodeNonLatinChars('Австралия') }, url: 'https://www.telstra.com.au', code: 'au' },
  { name: { en: 'South Africa', ru: encodeNonLatinChars('ЮАР') }, url: 'https://www.telkom.co.za', code: 'za' },
  { name: { en: 'Japan', ru: encodeNonLatinChars('Япония') }, url: 'https://www.yahoo.co.jp', code: 'jp' },
  { name: { en: 'Canada', ru: encodeNonLatinChars('Канада') }, url: 'https://www.cbc.ca', code: 'ca' },
];

const speedTestOptions = [
  { name: { en: 'Cloudflare (US)', ru: encodeNonLatinChars('Cloudflare (США)') }, url: 'https://speed.cloudflare.com/__down?bytes=10000000', code: 'us', cors: true },
  { name: { en: 'Singapore (SG)', ru: encodeNonLatinChars('Сингапур (SG)') }, url: 'https://speed.cloudflare.com/__down?bytes=10000000', code: 'sg', cors: true },
];

const translations = {
  en: {
    connectionTester: 'Conntester',
    latencyTargets: 'Latency Targets:',
    downloadFrom: 'Download From:',
    testMyConnection: 'Test My Connection',
    testing: 'Testing...',
    ipDetection: 'IP Detection',
    latency: 'Latency',
    downloadSpeed: 'Download Speed',
    designed: 'Designed for 2025',
  },
  ru: {
    connectionTester: 'КоннТестер',
    latencyTargets: 'Цели для задержки:',
    downloadFrom: 'Скачать из:',
    testMyConnection: 'Проверить моё соединение',
    testing: 'Тестирование...',
    ipDetection: 'Определение IP',
    latency: 'Задержка',
    downloadSpeed: 'Скорость загрузки',
    designed: 'Дизайн 2025',
  },
  es: {
    connectionTester: 'Conntester',
    latencyTargets: 'Objetivos de latencia:',
    downloadFrom: 'Descargar de:',
    testMyConnection: 'Probar mi conexión',
    testing: 'Probando...',
    ipDetection: 'Detección de IP',
    latency: 'Latencia',
    downloadSpeed: 'Velocidad de descarga',
    designed: 'Diseñado para 2025',
  },
  de: {
    connectionTester: 'Conntester',
    latencyTargets: 'Latenzziele:',
    downloadFrom: 'Herunterladen von:',
    testMyConnection: 'Verbindung testen',
    testing: 'Teste...',
    ipDetection: 'IP-Erkennung',
    latency: 'Latenz',
    downloadSpeed: 'Download-Geschwindigkeit',
    designed: 'Entworfen für 2025',
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
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [testingPing, setTestingPing] = useState(false);
  const [testingSpeed, setTestingSpeed] = useState(false);
  const [selectedSpeedTest, setSelectedSpeedTest] = useState(speedTestOptions[0]);
  const [lang, setLang] = useState(getSavedLang());
  const t = translations[lang] || translations['en'];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setIp(data.ip);
      } catch {
        setIp('Error');
      }
    })();
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
      <h1 style={{
        fontWeight: 800,
        fontSize: 48,
        letterSpacing: -2,
        margin: '48px 0 16px 0',
        background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      }}>{t.connectionTester}</h1>
      
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
          <div style={{ width: '100%' }}>
            {geoOptions.map(target => (
              <div key={target.code} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px', alignItems: 'center', fontSize: 22, fontWeight: 500, margin: '10px 0', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', letterSpacing: 0.5 }}>
                <img src={`https://flagcdn.com/32x24/${target.code}.png`} alt={target.name[lang]} style={{ width: 32, height: 24, borderRadius: 4, boxShadow: '0 1px 4px #0002', flexShrink: 0, justifySelf: 'start' }} />
                <span style={{ color: '#00c6ff', fontWeight: 700, minWidth: 120, textAlign: 'left', flexShrink: 0 }}>{target.name[lang]}</span>
                <span style={{ fontWeight: 600, color: '#fff', minWidth: 70, textAlign: 'left', justifySelf: 'start' }}>{latency[target.name.en] || latency[target.name.ru] || '-'}</span>
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
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
            }}
            disabled={testingPing}
            style={{
              marginTop: 24,
              padding: '12px 32px',
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 32,
              border: 'none',
              background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)',
              color: '#fff',
              boxShadow: '0 4px 24px 0 rgba(0,114,255,0.15)',
              cursor: testingPing ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              width: '100%',
            }}
          >
            {testingPing ? t.testing : (lang === 'ru' ? 'Обновить пинг' : 'Refresh Ping')}
          </button>
        </div>
        {/* Download Speed */}
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
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, letterSpacing: -1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{t.downloadSpeed}</h2>
          <div style={{ fontSize: 22, marginBottom: 8, fontFamily: 'Inter, Segoe UI, Arial, sans-serif', display: 'flex', alignItems: 'center' }}>
            <img src={`https://flagcdn.com/32x24/${selectedSpeedTest.code}.png`} alt={selectedSpeedTest.name[lang]} style={{ width: 32, height: 24, marginRight: 8, borderRadius: 4, boxShadow: '0 1px 4px #0002' }} />
            <span style={{ color: '#00c6ff', fontWeight: 700 }}>{selectedSpeedTest.name[lang]}</span>
          </div>
          <select
            value={selectedSpeedTest.name[lang]}
            onChange={e => setSelectedSpeedTest(speedTestOptions.find(s => s.name[lang] === e.target.value))}
            style={{ fontSize: 20, borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontFamily: 'Inter, Segoe UI, Arial, sans-serif', marginRight: 16 }}
            aria-label={t.downloadFrom}
          >
            {speedTestOptions.map(s => (
              <option key={s.name.en} value={s.name[lang]}>{s.name[lang]}</option>
            ))}
          </select>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>{downloadSpeed ? downloadSpeed : '-'}</div>
          <button
            onClick={async () => {
              setTestingSpeed(true);
              setDownloadSpeed(null);
              setDownloadSpeed('-'); // reset
              let speedError = '';
              try {
                if (selectedSpeedTest.cors) {
                  const fileUrl = selectedSpeedTest.url + (selectedSpeedTest.url.includes('?') ? '&' : '?') + 'cacheBust=' + Date.now();
                  const start = performance.now();
                  const response = await fetch(fileUrl, { cache: 'no-store' });
                  if (!response.ok || !response.body) throw new Error('Speed test fetch failed');
                  const reader = response.body.getReader();
                  let receivedLength = 0;
                  let firstChunk = true;
                  let firstChunkTime = 0;
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (firstChunk) {
                      firstChunk = false;
                      firstChunkTime = performance.now();
                    }
                    receivedLength += value.length;
                  }
                  const end = performance.now();
                  const effectiveStart = firstChunkTime || start;
                  const sizeMB = receivedLength / (1024 * 1024);
                  const timeSec = (end - effectiveStart) / 1000;
                  const speedMbps = ((sizeMB * 8) / timeSec).toFixed(2);
                  setDownloadSpeed(speedMbps + ' Mbps');
                } else {
                  setDownloadSpeed('N/A: CORS not supported');
                }
              } catch (err) {
                speedError = err.message;
                setDownloadSpeed('N/A: ' + speedError);
                console.error('Download speed test failed:', speedError);
              }
              setTestingSpeed(false);
            }}
            disabled={testingSpeed}
            style={{
              marginTop: 24,
              padding: '12px 32px',
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 32,
              border: 'none',
              background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)',
              color: '#fff',
              boxShadow: '0 4px 24px 0 rgba(0,114,255,0.15)',
              cursor: testingSpeed ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s',
              width: '100%',
            }}
          >
            {testingSpeed ? t.testing : (lang === 'ru' ? 'Скорость загрузки' : 'Download Speed')}
          </button>
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
        &copy; {new Date().getFullYear()} Conntester &mdash; {t.designed}
      </footer>
    </div>
  );
}

export default App;






