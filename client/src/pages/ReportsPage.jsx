import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  plugins: {
    legend: { labels: { color: '#334155', font: { size: 12 } } },
    tooltip: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, titleColor: '#0F172A', bodyColor: '#334155' }
  },
  scales: {
    x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
    y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(0, 0, 0, 0.05)' } }
  }
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ReportsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [aRes, dRes] = await Promise.all([
        api.get('/reports/analytics'),
        api.get('/reports/dashboard')
      ]);
      setAnalytics(aRes.data);
      setDashboard(dRes.data);
    } catch {
      toast.error('Failed to load analytics', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) { toast.warning('No data to export', { theme: 'dark' }); return; }
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename}.csv exported!`, { theme: 'dark' });
  };

  const fmt = (n, d = 0) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: d }).format(n || 0);

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="loading-spinner"><div className="spinner"></div><p className="loading-text">Loading analytics...</p></div>
      </div>
    </div>
  );

  // Monthly trip chart
  const monthlyData = analytics?.monthlyTrips || [];
  const monthlyLabels = monthlyData.map(d => `${months[d._id.month - 1]} ${d._id.year}`);

  const tripTrendChart = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Total Trips',
        data: monthlyData.map(d => d.total),
        backgroundColor: 'rgba(189, 178, 255, 0.7)',
        borderColor: '#BDB2FF',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Completed',
        data: monthlyData.map(d => d.completed),
        backgroundColor: 'rgba(202, 255, 191, 0.7)',
        borderColor: '#CAFFBF',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const vehicleTypeChart = {
    labels: analytics?.vehicleTypeDistribution.map(d => d._id) || [],
    datasets: [{
      data: analytics?.vehicleTypeDistribution.map(d => d.count) || [],
      backgroundColor: ['#BDB2FF', '#9BF6FF', '#FDFFB6', '#FFADAD', '#FFC6FF', '#CAFFBF'],
      borderWidth: 0,
    }]
  };

  // Monthly fuel chart
  const monthlyFuelData = analytics?.monthlyFuel || [];
  const fuelTrendChart = {
    labels: monthlyFuelData.map(d => `${months[d._id.month - 1]} ${d._id.year}`),
    datasets: [
      {
        label: 'Fuel Cost (₹)',
        data: monthlyFuelData.map(d => d.totalCost),
        borderColor: '#FFD6A5',
        backgroundColor: 'rgba(255, 214, 165, 0.25)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Liters',
        data: monthlyFuelData.map(d => d.totalLiters),
        borderColor: '#9BF6FF',
        backgroundColor: 'rgba(155, 246, 255, 0.25)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const fuelTrendOptions = {
    ...chartDefaults,
    scales: {
      ...chartDefaults.scales,
      y1: { type: 'linear', position: 'right', ticks: { color: '#64748B' }, grid: { drawOnChartArea: false } }
    }
  };

  // Fuel efficiency chart
  const fuelEffData = analytics?.fuelEfficiency || [];
  const fuelEffChart = {
    labels: fuelEffData.map(d => d.registrationNumber),
    datasets: [{
      label: 'Km/L',
      data: fuelEffData.map(d => parseFloat(d.efficiency?.toFixed(2))),
      backgroundColor: fuelEffData.map((_, i) => `hsl(${200 + i * 30}, 75%, 75%)`),
      borderWidth: 0,
      borderRadius: 4,
    }]
  };

  const roiData = analytics?.vehicleROI || [];
  const costData = analytics?.vehicleCosts || [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>📈 Reports & Analytics</h1>
            <p>Operational insights and performance metrics</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-secondary" onClick={() => exportCSV(fuelEffData.map(d => ({ vehicle: d.registrationNumber, efficiency_kmL: d.efficiency?.toFixed(2), total_distance: d.totalDistance, total_fuel: d.totalFuel, trips: d.tripCount })), 'fuel_efficiency')}>
              📊 Export Efficiency CSV
            </button>
            <button className="topbar-btn btn-secondary" onClick={() => exportCSV(roiData.map(r => ({ vehicle: r.registrationNumber, revenue: r.totalRevenue, fuel_cost: r.totalFuelCost, maintenance_cost: r.totalMaintenanceCost, roi_percent: r.roi?.toFixed(2) })), 'vehicle_roi')}>
              💰 Export ROI CSV
            </button>
            <button className="topbar-btn btn-primary" onClick={() => exportCSV(costData.map(c => ({ vehicle: c.registrationNumber, name: c.name, fuel_cost: c.totalFuelCost, maintenance_cost: c.totalMaintenanceCost, other_expenses: c.totalExpenses, total_cost: c.totalOperationalCost })), 'operational_costs')}>
              📥 Export All Costs
            </button>
          </div>
        </div>

        <div className="page-container">
          {/* KPI Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Fleet Utilization', value: `${dashboard?.fleetUtilization}%`, icon: '📊', color: 'var(--primary-light)' },
              { label: 'Avg Fuel Efficiency', value: fuelEffData.length > 0 ? `${(fuelEffData.reduce((s, d) => s + d.efficiency, 0) / fuelEffData.length).toFixed(1)} km/L` : '—', icon: '⛽', color: 'var(--secondary)' },
              { label: 'Total Revenue', value: `₹${fmt(dashboard?.financials.totalRevenue)}`, icon: '💰', color: 'var(--success)' },
              { label: 'Total Op. Cost', value: `₹${fmt((dashboard?.financials.totalFuelCost || 0) + (dashboard?.financials.totalMaintenanceCost || 0))}`, icon: '💸', color: 'var(--danger)' },
            ].map(s => (
              <div key={s.label} className="kpi-card" style={{ '--kpi-color': s.color }}>
                <div className="kpi-icon">{s.icon}</div>
                <div className="kpi-value" style={{ fontSize: '22px' }}>{s.value}</div>
                <div className="kpi-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="charts-grid" style={{ marginBottom: '24px' }}>
            <div className="chart-card">
              <div className="chart-title">📅 Monthly Trip Trends</div>
              {monthlyData.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}><div className="empty-text">No trip data yet</div></div>
              ) : (
                <Bar data={tripTrendChart} options={chartDefaults} height={250} />
              )}
            </div>

            <div className="chart-card">
              <div className="chart-title">🚛 Fleet Composition</div>
              {vehicleTypeChart.labels.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}><div className="empty-text">No vehicles added yet</div></div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Doughnut data={vehicleTypeChart} options={{ ...chartDefaults, scales: undefined, maintainAspectRatio: true }} style={{ maxHeight: '250px' }} />
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="charts-grid" style={{ marginBottom: '24px' }}>
            <div className="chart-card">
              <div className="chart-title">⛽ Fuel Efficiency by Vehicle (km/L)</div>
              {fuelEffData.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}><div className="empty-text">Complete trips to see fuel efficiency</div></div>
              ) : (
                <Bar data={fuelEffChart} options={chartDefaults} height={250} />
              )}
            </div>

            <div className="chart-card">
              <div className="chart-title">📈 Monthly Fuel Costs & Consumption</div>
              {monthlyFuelData.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}><div className="empty-text">No fuel logs recorded yet</div></div>
              ) : (
                <Line data={fuelTrendChart} options={fuelTrendOptions} height={250} />
              )}
            </div>
          </div>

          {/* Vehicle ROI Table */}
          <div className="table-container" style={{ marginBottom: '24px' }}>
            <div className="table-header">
              <div className="table-title">💰 Vehicle ROI Analysis</div>
              <div className="table-toolbar">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ROI = (Revenue - Fuel - Maintenance) / Acquisition Cost × 100</span>
              </div>
            </div>
            {roiData.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💰</div><div className="empty-title">No completed trips yet</div></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Revenue</th>
                    <th>Fuel Cost</th>
                    <th>Maintenance Cost</th>
                    <th>Net Profit</th>
                    <th>ROI %</th>
                  </tr>
                </thead>
                <tbody>
                  {roiData.map(r => {
                    const net = r.totalRevenue - r.totalFuelCost - r.totalMaintenanceCost;
                    const roi = r.roi || 0;
                    return (
                      <tr key={r._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '12px' }}>{r.registrationNumber}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.vehicleName}</div>
                        </td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{fmt(r.totalRevenue)}</td>
                        <td style={{ color: 'var(--warning)' }}>₹{fmt(r.totalFuelCost)}</td>
                        <td style={{ color: 'var(--accent)' }}>₹{fmt(r.totalMaintenanceCost)}</td>
                        <td style={{ fontWeight: 700, color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {net >= 0 ? '+' : ''}₹{fmt(net)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: roi >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '14px' }}>
                              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Operational Costs Table */}
          <div className="table-container">
            <div className="table-header">
              <div className="table-title">💸 Operational Costs Per Vehicle</div>
            </div>
            {costData.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">💸</div><div className="empty-title">No cost data yet</div></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Fuel Cost</th>
                    <th>Maintenance Cost</th>
                    <th>Other Expenses</th>
                    <th>Total Op. Cost</th>
                    <th>Cost/Km (if available)</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.map(c => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '12px' }}>{c.registrationNumber}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.name}</div>
                      </td>
                      <td style={{ color: 'var(--warning)' }}>₹{fmt(c.totalFuelCost)}</td>
                      <td style={{ color: 'var(--accent)' }}>₹{fmt(c.totalMaintenanceCost)}</td>
                      <td>₹{fmt(c.totalExpenses)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{fmt(c.totalOperationalCost)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
