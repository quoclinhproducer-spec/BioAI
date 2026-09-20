'use client';

import { useEffect, useMemo, useState } from 'react';

const translations = {
  en: {
    title: 'BioAI Composting Console',
    login: 'Login',
    email: 'Email',
    password: 'Password',
    devices: 'Devices',
    telemetry: 'Telemetry',
    temperature: 'Temperature',
    quality: 'Data quality',
    online: 'Online',
    offline: 'Offline',
    switchLanguage: 'Vietnamese',
    loading: 'Loading device data...',
    notConnected: 'No realtime connection available'
  },
  vi: {
    title: 'Bảng điều khiển BioAI',
    login: 'Đăng nhập',
    email: 'Email',
    password: 'Mật khẩu',
    devices: 'Thiết bị',
    telemetry: 'Dữ liệu cảm biến',
    temperature: 'Nhiệt độ',
    quality: 'Chất lượng dữ liệu',
    online: 'Trực tuyến',
    offline: 'Ngoại tuyến',
    switchLanguage: 'English',
    loading: 'Đang tải dữ liệu thiết bị...',
    notConnected: 'Không có kết nối thời gian thực'
  }
} as const;

export default function Page() {
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [devices, setDevices] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const t = useMemo(() => translations[language], [language]);

  useEffect(() => {
    async function loadDevices() {
      try {
        const response = await fetch('http://localhost:4000/api/devices');
        const data = await response.json();
        setDevices(data);
        const sample = data[0] ? await fetch(`http://localhost:4000/api/devices/${data[0].id}/telemetry`) : null;
        if (sample) {
          const sampleData = await sample.json();
          setTelemetry(sampleData);
        }
      } catch (_error) {
        setDevices([
          { id: 'dev-1', name: 'Compost Cell 1', status: 'ONLINE', location: 'North Bay' },
          { id: 'dev-2', name: 'Compost Cell 2', status: 'OFFLINE', location: 'South Bay' }
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadDevices();
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? 'admin@bioai.local');
    const password = String(formData.get('password') ?? 'password123');

    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      setAuthenticated(true);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <button
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            {t.switchLanguage}
          </button>
        </div>

        {!authenticated ? (
          <section className="mb-8 rounded border bg-white p-6 shadow-sm">
            <form className="grid max-w-md gap-4" onSubmit={handleLogin}>
              <h2 className="text-xl font-semibold">{t.login}</h2>
              <label className="grid gap-2">
                <span>{t.email}</span>
                <input name="email" defaultValue="admin@bioai.local" className="rounded border px-3 py-2" />
              </label>
              <label className="grid gap-2">
                <span>{t.password}</span>
                <input type="password" name="password" defaultValue="password123" className="rounded border px-3 py-2" />
              </label>
              <button type="submit" className="rounded bg-green-700 px-4 py-2 font-medium text-white">
                {t.login}
              </button>
            </form>
          </section>
        ) : null}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">{t.devices}</h2>
            {loading ? <p>{t.loading}</p> : devices.map((device) => (
              <div key={device.id} className="mb-3 rounded border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{device.name}</span>
                  <span className={`rounded px-2 py-1 text-xs ${device.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {device.status === 'ONLINE' ? t.online : t.offline}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{device.location}</p>
              </div>
            ))}
          </div>

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">{t.telemetry}</h2>
            {telemetry.length === 0 ? <p>{t.notConnected}</p> : telemetry.slice(-5).map((item, index) => (
              <div key={`${item.sensorKey}-${index}`} className="mb-2 rounded bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span>{item.sensorKey}</span>
                  <span>{item.quality}</span>
                </div>
                <div className="mt-1 text-lg font-semibold">{item.value} °C</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
