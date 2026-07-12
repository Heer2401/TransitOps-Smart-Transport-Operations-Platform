import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/trips/${id}`)
      .then(res => setTrip(res.data))
      .catch(() => navigate('/trips'))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    </div>
  );

  const fuelEfficiency = trip.actualDistance && trip.fuelConsumed && trip.fuelConsumed > 0
    ? (trip.actualDistance / trip.fuelConsumed).toFixed(2) : '—';

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>🗺️ Trip {trip.tripNumber}</h1>
            <p>{trip.source} → {trip.destination}</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-secondary" onClick={() => navigate('/trips')}>← Back</button>
          </div>
        </div>

        <div className="page-container">
          {/* Trip header */}
          <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,217,196,0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                  {trip.source} → {trip.destination}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Created {new Date(trip.createdAt).toLocaleDateString('en-IN')} by {trip.createdBy?.name || 'System'}
                </div>
              </div>
              <StatusBadge status={trip.status} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Vehicle info */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>🚛 Vehicle</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  ['Registration', trip.vehicle?.registrationNumber],
                  ['Name', trip.vehicle?.name],
                  ['Model', trip.vehicle?.model],
                  ['Type', trip.vehicle?.type],
                  ['Max Capacity', `${fmt(trip.vehicle?.maxLoadCapacity)} kg`],
                  ['Status', <StatusBadge key="vs" status={trip.vehicle?.status} />],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver info */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>👤 Driver</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  ['Name', trip.driver?.name],
                  ['License No.', trip.driver?.licenseNumber],
                  ['Category', trip.driver?.licenseCategory],
                  ['Expiry', new Date(trip.driver?.licenseExpiryDate).toLocaleDateString('en-IN')],
                  ['Safety Score', `${trip.driver?.safetyScore}/100`],
                  ['Status', <StatusBadge key="ds" status={trip.driver?.status} />],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trip details */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>📋 Trip Details</h3>
            <div className="detail-grid">
              {[
                ['Cargo Weight', `${fmt(trip.cargoWeight)} kg`],
                ['Planned Distance', `${fmt(trip.plannedDistance)} km`],
                ['Actual Distance', trip.actualDistance ? `${fmt(trip.actualDistance)} km` : '—'],
                ['Start Odometer', trip.startOdometer ? `${fmt(trip.startOdometer)} km` : '—'],
                ['End Odometer', trip.endOdometer ? `${fmt(trip.endOdometer)} km` : '—'],
                ['Fuel Consumed', trip.fuelConsumed ? `${trip.fuelConsumed} L` : '—'],
                ['Fuel Efficiency', trip.status === 'Completed' ? `${fuelEfficiency} km/L` : '—'],
                ['Revenue', `₹${fmt(trip.revenue)}`],
                ['Scheduled', new Date(trip.scheduledDate).toLocaleDateString('en-IN')],
                ['Dispatched', trip.dispatchedAt ? new Date(trip.dispatchedAt).toLocaleString('en-IN') : '—'],
                ['Completed', trip.completedAt ? new Date(trip.completedAt).toLocaleString('en-IN') : '—'],
              ].map(([label, value]) => (
                <div key={label} className="detail-item">
                  <label>{label}</label>
                  <div className="value">{value}</div>
                </div>
              ))}
            </div>
            {trip.notes && (
              <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Notes:</strong> {trip.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripDetailPage;
