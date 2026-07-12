import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

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
