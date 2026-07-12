import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const kpiConfig = [
  { key: 'totalVehicles', label: 'Total Vehicles', icon: '🚛', color: 'var(--primary)', sub: null },
  { key: 'availableVehicles', label: 'Available Vehicles', icon: '✅', color: 'var(--success)', sub: 'vehicles.available' },
  { key: 'onTripVehicles', label: 'On Trip', icon: '🛣️', color: 'var(--warning)', sub: 'vehicles.onTrip' },
  { key: 'inShopVehicles', label: 'In Shop', icon: '🔧', color: 'var(--accent)', sub: 'vehicles.inShop' },
  { key: 'activeTrips', label: 'Active Trips', icon: '🗺️', color: 'var(--primary)', sub: 'trips.active' },
  { key: 'pendingTrips', label: 'Pending Trips', icon: '⏳', color: 'var(--warning)', sub: 'trips.pending' },
  { key: 'driversOnDuty', label: 'Drivers On Duty', icon: '👤', color: 'var(--secondary-dark)', sub: 'drivers.onDuty' },
  { key: 'fleetUtil', label: 'Fleet Utilization', icon: '📊', color: 'var(--primary)', sub: null, suffix: '%' },
];

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTripsList, setActiveTripsList] = useState([]);
  const [telemetrySim, setTelemetrySim] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
    fetchActiveTrips();
    const interval = setInterval(() => {
      fetchDashboard();
      fetchActiveTrips();
    }, 30000); // refresh API data every 30s
    return () => clearInterval(interval);
  }, []);

  // Telemetry sensor simulator loop
  useEffect(() => {
    if (activeTripsList.length === 0) return;

    const interval = setInterval(() => {
      setTelemetrySim(prev => {
        const next = { ...prev };
        activeTripsList.forEach(t => {
          const current = prev[t._id] || {
            speed: 60 + Math.floor(Math.random() * 15),
            progress: 10 + Math.floor(Math.random() * 50),
            temp: 82 + Math.floor(Math.random() * 6),
            fuel: 75
          };

          const speedDelta = (Math.random() - 0.5) * 8;
          const progressDelta = Math.random() * 0.4; // advance route slowly
          const tempDelta = (Math.random() - 0.5) * 2;

          next[t._id] = {
            speed: Math.min(Math.max(Math.round(current.speed + speedDelta), 40), 85),
            progress: Math.min(parseFloat((current.progress + progressDelta).toFixed(2)), 99.9),
            temp: Math.min(Math.max(Math.round(current.temp + tempDelta), 78), 92),
            fuel: Math.max(parseFloat((current.fuel - 0.05).toFixed(1)), 15)
          };
        });
        return next;
      });
    }, 2000); // update telemetry indicators every 2s

    return () => clearInterval(interval);
  }, [activeTripsList]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTrips = async () => {
    try {
      const res = await api.get('/trips', { params: { status: 'Dispatched' } });
      setActiveTripsList(res.data);
    } catch (err) {
      console.error('Error fetching active trips:', err);
    }
  };

  if (loading) return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <div className="loading-spinner"><div className="spinner"></div><p className="loading-text">Loading dashboard...</p></div>
      </div>
    </div>
  );

  const kpiValues = data ? {
    totalVehicles: data.vehicles.total,
    availableVehicles: data.vehicles.available,
    onTripVehicles: data.vehicles.onTrip,
    inShopVehicles: data.vehicles.inShop,
    activeTrips: data.trips.active,
    pendingTrips: data.trips.pending,
    driversOnDuty: data.drivers.onDuty,
    fleetUtil: data.fleetUtilization,
  } : {};

  const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n || 0));

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>Dashboard</h1>
            <p>Real-time fleet operations overview</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-secondary" onClick={fetchDashboard}>🔄 Refresh</button>
          </div>
        </div>

        <div className="page-container">
          {/* KPI Grid */}
          <div className="kpi-grid">
            {kpiConfig.map(k => (
              <div key={k.key} className="kpi-card" style={{ '--kpi-color': k.color }}>
                <div className="kpi-icon">{k.icon}</div>
                <div className="kpi-value">{kpiValues[k.key] ?? 0}{k.suffix || ''}</div>
                <div className="kpi-label">{k.label}</div>
              </div>
            ))}
          </div>

          {/* IoT Active Fleet Monitor */}
          <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--lavender-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                📡 Live Active Fleet Telemetry Monitor
              </h3>
              <span style={{ fontSize: '11px', background: 'var(--lavender-soft)', color: 'var(--lavender-dark)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                ● Real-time Sensor simulation active
              </span>
            </div>

            {activeTripsList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No vehicles are currently dispatched on trips. Move to <strong>Trips</strong> and dispatch a trip to activate.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeTripsList.map(t => {
                  const sim = telemetrySim[t._id] || { speed: 65, progress: 35, temp: 82, fuel: 80 };
                  return (
                    <div key={t._id} style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
                      
                      {/* Trip info */}
                      <div style={{ minWidth: '180px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }}>
                          {t.tripNumber} — {t.vehicle?.registrationNumber}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {t.source} → {t.destination}
                        </div>
                      </div>

                      {/* Driver info */}
                      <div style={{ minWidth: '120px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DRIVER</span>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t.driver?.name}</div>
                      </div>

                      {/* Live Indicators */}
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>SPEED</span>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sim.speed} km/h</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>TEMP</span>
                          <strong style={{ fontSize: '13px', color: sim.temp > 89 ? 'var(--danger)' : 'var(--text-primary)' }}>{sim.temp}°C</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>FUEL</span>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{sim.fuel}%</strong>
                        </div>
                      </div>

                      {/* Route Progress bar */}
                      <div style={{ minWidth: '160px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Route Progress</span>
                          <strong style={{ color: 'var(--lavender-dark)' }}>{sim.progress.toFixed(1)}%</strong>
                        </div>
                        <div className="progress-bar" style={{ height: '5px' }}>
                          <div className="progress-fill" style={{ width: `${sim.progress}%`, background: 'var(--lavender-dark)' }}></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <button className="topbar-btn btn-secondary btn-sm" onClick={() => navigate(`/trips/${t._id}`)}>
                          🛰️ Track Live
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Financial Summary */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>💰 Financial Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Total Revenue', value: `₹${fmt(data?.financials.totalRevenue)}`, color: 'var(--success)' },
                  { label: 'Fuel Costs', value: `₹${fmt(data?.financials.totalFuelCost)}`, color: 'var(--warning)' },
                  { label: 'Maintenance Costs', value: `₹${fmt(data?.financials.totalMaintenanceCost)}`, color: 'var(--accent)' },
                  { label: 'Other Expenses', value: `₹${fmt(data?.financials.totalExpenses)}`, color: 'var(--text-secondary)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Net Profit</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: (data?.financials.totalRevenue - data?.financials.totalFuelCost - data?.financials.totalMaintenanceCost - data?.financials.totalExpenses) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    ₹{fmt(data?.financials.totalRevenue - data?.financials.totalFuelCost - data?.financials.totalMaintenanceCost - data?.financials.totalExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* Driver Status */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>👤 Driver Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Total Drivers', value: data?.drivers.total, color: 'var(--text-primary)' },
                  { label: 'On Duty', value: data?.drivers.onDuty, color: 'var(--warning)' },
                  { label: 'Licenses Expiring (30 days)', value: data?.drivers.expiringLicenses, color: 'var(--accent)' },
                  { label: 'Expired Licenses', value: data?.drivers.expiredLicenses, color: 'var(--danger)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: item.color }}>{item.value ?? 0}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Completed Trips</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>{data?.trips.completed ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Utilization Bar */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>📊 Fleet Utilization</h3>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary-light)' }}>{data?.fleetUtilization}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${data?.fleetUtilization}%` }}></div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              {[
                { label: 'Available', count: data?.vehicles.available, color: 'var(--success)' },
                { label: 'On Trip', count: data?.vehicles.onTrip, color: 'var(--warning)' },
                { label: 'In Shop', count: data?.vehicles.inShop, color: 'var(--accent)' },
                { label: 'Retired', count: data?.vehicles.retired, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }}></div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.label}: <strong>{s.count ?? 0}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
