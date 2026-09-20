import { Activity, Bell, ShieldCheck, Smartphone, ThermometerSun, Users } from 'lucide-react';

const devices = [
  { id: 'dev-1', name: 'Bioreactor A1', status: 'ONLINE', quality: 'VALID', temp: '24.1°C' },
  { id: 'dev-2', name: 'Dryer D3', status: 'OFFLINE', quality: 'STALE', temp: '—' },
  { id: 'dev-3', name: 'Pump Station P9', status: 'ONLINE', quality: 'VALID', temp: '18.7°C' },
];

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white/80 p-4 shadow-card dark:border-slate-700 dark:bg-slate-950/70">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">BioAI</p>
            <h1 className="mt-1 text-2xl font-semibold">Operations overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
              <ShieldCheck size={16} />
              Admin
            </button>
            <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">Language: VI</button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700">
              <Bell size={16} />
            </button>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-card dark:border-slate-700 dark:bg-slate-950/70">
            <nav className="space-y-2 text-sm">
              {['Overview', 'Devices', 'Alerts', 'Commands', 'Admin'].map((item) => (
                <button
                  key={item}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left ${item === 'Overview' ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {item}
                  {item === 'Admin' && <Users size={14} />}
                </button>
              ))}
            </nav>
          </aside>

          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Connected devices', value: '27 / 30', icon: Activity },
                { label: 'Warnings', value: '3 active', icon: ThermometerSun },
                { label: 'Mobile sync', value: 'Healthy', icon: Smartphone },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-950">
                  <div className="mb-3 flex items-center justify-between text-sm text-muted">
                    <span>{label}</span>
                    <Icon size={16} />
                  </div>
                  <div className="text-2xl font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Device list</h2>
                <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">Valid network</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                      <th className="pb-3">Device</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Data quality</th>
                      <th className="pb-3">Temperature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.id} className="border-b border-slate-200 last:border-0 dark:border-slate-700">
                        <td className="py-3 font-medium">{device.name}</td>
                        <td className="py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${device.status === 'ONLINE' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {device.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${device.quality === 'VALID' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {device.quality}
                          </span>
                        </td>
                        <td className="py-3 text-muted">{device.temp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
