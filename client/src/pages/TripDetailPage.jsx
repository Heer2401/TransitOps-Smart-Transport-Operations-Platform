import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // IoT Telemetry State
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    rpm: 0,
    temp: 0,
    fuelRate: 0,
    tirePressure: 32,
    gps: { lat: 0, lng: 0 },
    lastUpdated: new Date()
  });

  // Fetch initial trip data
  useEffect(() => {
    api.get(`/trips/${id}`)
      .then(res => {
        setTrip(res.data);
        // Initialize base telemetry
        if (res.data.status === 'Dispatched') {
          setTelemetry({
            speed: 62,
            rpm: 1750,
            temp: 84,
            fuelRate: 6.8,
            tirePressure: 32.5,
            gps: { lat: 19.0760, lng: 72.8777 },
            lastUpdated: new Date()
          });
        }
      })
      .catch(() => navigate('/trips'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Simulate Live IoT Telemetry Updates
  useEffect(() => {
    if (!trip || trip.status !== 'Dispatched') return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const speedDelta = (Math.random() - 0.5) * 6;
        const rpmDelta = (Math.random() - 0.5) * 200;
        const tempDelta = (Math.random() - 0.5) * 2;
        const fuelRateDelta = (Math.random() - 0.5) * 0.8;

        const nextSpeed = Math.min(Math.max(Math.round(prev.speed + speedDelta), 45), 85);
        const nextRpm = Math.min(Math.max(Math.round(prev.rpm + rpmDelta), 1300), 2200);
        const nextTemp = Math.min(Math.max(Math.round(prev.temp + tempDelta), 80), 92);
        const nextFuelRate = Math.min(Math.max(parseFloat((prev.fuelRate + fuelRateDelta).toFixed(1)), 4.5), 9.0);

        return {
          speed: nextSpeed,
          rpm: nextRpm,
          temp: nextTemp,
          fuelRate: nextFuelRate,
          tirePressure: parseFloat((32 + (Math.random() - 0.5) * 0.6).toFixed(1)),
          gps: {
            lat: parseFloat((prev.gps.lat + (Math.random() - 0.5) * 0.002).toFixed(5)),
            lng: parseFloat((prev.gps.lng + (Math.random() - 0.5) * 0.002).toFixed(5))
          },
          lastUpdated: new Date()
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [trip]);

  const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

  if (loading) return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <div className="loading-spinner"><div className="spinner"></div></div>
      </div>
    </div>
  );

  const fuelEfficiency = trip.actualDistance && trip.fuelConsumed && trip.fuelConsumed > 0
    ? (trip.actualDistance / trip.fuelConsumed).toFixed(2) : '—';

  return (
    <div className="app-layout">
      <Navbar />
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
          {/* Trip Header Alert Card */}
          <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(196,181,253,0.12), rgba(110,231,183,0.08))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                  {trip.source} to {trip.destination}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Trip Registered on {new Date(trip.createdAt).toLocaleDateString('en-IN')} at {new Date(trip.createdAt).toLocaleTimeString('en-IN')}
                </div>
              </div>
              <StatusBadge status={trip.status} />
            </div>
          </div>

          {/* Map & Telemetry Dashboard Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Interactive Animated Route Tracker */}
            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                  📍 Animated Route Progress Tracker
                </h3>
                {trip.status === 'Dispatched' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--lavender-dark)', fontWeight: 600 }}>
                    <span className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--lavender-dark)' }}></span>
                    LIVE TRANSMITTING
                  </span>
                )}
              </div>

              {/* SVG Map Simulation */}
              <div style={{ background: '#FAF9FF', borderRadius: 'var(--radius-md)', padding: '40px 20px', border: '1.5px dashed var(--border)', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                
                {/* Simulated Nodes/Checkpoints */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 5 }}>
                  
                  {/* Origin */}
                  <div style={{ textAlign: 'center', width: '90px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', border: '2.5px solid var(--lavender-dark)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, margin: '0 auto 8px', boxShadow: 'var(--shadow-sm)' }}>
                      A
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{trip.source}</span>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Origin</span>
                  </div>

                  {/* Waypoint 1 (Toll Plaza) */}
                  <div style={{ textAlign: 'center', width: '90px', opacity: trip.status === 'Draft' ? 0.4 : 1 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', border: '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '10px', margin: '2px auto 10px', color: 'var(--text-secondary)' }}>
                      🎫
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Toll Plaza</span>
                    <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-light)' }}>Checkpoint</span>
                  </div>

                  {/* Waypoint 2 (Rest Stop) */}
                  <div style={{ textAlign: 'center', width: '90px', opacity: trip.status === 'Draft' ? 0.4 : 1 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', border: '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '10px', margin: '2px auto 10px', color: 'var(--text-secondary)' }}>
                      ⛽
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Rest Station</span>
                    <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-light)' }}>Midpoint</span>
                  </div>

                  {/* Destination */}
                  <div style={{ textAlign: 'center', width: '90px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', border: `2.5px solid ${trip.status === 'Completed' ? 'var(--mint-dark)' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, margin: '0 auto 8px', boxShadow: 'var(--shadow-sm)' }}>
                      B
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{trip.destination}</span>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>Destination</span>
                  </div>

                </div>

                {/* SVG Connecting Track Line */}
                <svg style={{ position: 'absolute', top: '54px', left: '10%', width: '80%', height: '30px', zIndex: 1, pointerEvents: 'none' }}>
                  <line 
                    x1="0%" y1="50%" x2="100%" y2="50%" 
                    stroke="var(--border-strong)" strokeWidth="3" 
                    strokeDasharray="6 4"
                  />
                  {trip.status === 'Dispatched' && (
                    <line 
                      x1="0%" y1="50%" x2="100%" y2="50%" 
                      stroke="var(--lavender-dark)" strokeWidth="3.5" 
                      strokeDasharray="6 4"
                      style={{
                        animation: 'dashOffset 30s linear infinite',
                        strokeDashoffset: 1000
                      }}
                    />
                  )}
                </svg>

                {/* Animated Truck Icon Indicator */}
                {trip.status === 'Dispatched' && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '10%',
                    width: '80%',
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: '32px',
                      transform: 'translateX(-16px)',
                      animation: 'driveTruck 15s ease-in-out infinite alternate',
                    }}>
                      <div style={{ fontSize: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transform: 'scaleX(-1)' }}>
                        🚛
                      </div>
                      <span style={{ fontSize: '9px', background: 'var(--lavender-dark)', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 700, marginTop: '2px', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)' }}>
                        ON THE ROAD
                      </span>
                    </div>
                  </div>
                )}

                {/* Status-based truck states */}
                {trip.status === 'Draft' && (
                  <div style={{ position: 'absolute', top: '40px', left: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px' }}>
                    <div style={{ fontSize: '24px' }}>🚛</div>
                    <span style={{ fontSize: '9px', background: 'var(--text-muted)', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap' }}>
                      DOCKED
                    </span>
                  </div>
                )}

                {trip.status === 'Completed' && (
                  <div style={{ position: 'absolute', top: '40px', right: '8%', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px' }}>
                    <div style={{ fontSize: '24px' }}>🚛</div>
                    <span style={{ fontSize: '9px', background: 'var(--mint-dark)', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: 600, marginTop: '2px', whiteSpace: 'nowrap' }}>
                      ARRIVED
                    </span>
                  </div>
                )}

                <style>{`
                  @keyframes dashOffset {
                    to { stroke-dashoffset: 0; }
                  }
                  @keyframes driveTruck {
                    0% { margin-left: 5%; }
                    100% { margin-left: 95%; }
                  }
                `}</style>

                {/* Progress bar / Timeline description */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  {trip.status === 'Dispatched' ? (
                    <span>Estimated Remaining Time: <strong>~2 hrs 14 mins</strong> | Current Telemetry Speed: <strong>{telemetry.speed} km/h</strong></span>
                  ) : trip.status === 'Completed' ? (
                    <span style={{ color: 'var(--mint-dark)', fontWeight: 600 }}>✅ Trip Completed. Vehicle and driver returned safely to terminal.</span>
                  ) : (
                    <span>Trip scheduled. Awaiting dispatcher execution to activate live telematics.</span>
                  )}
                </div>

              </div>
            </div>

            {/* IoT Telemetry Panel Card */}
            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                📡 Live IoT Telematics Feed
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                
                {/* Speed sensor */}
                <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>VEHICLE SPEED</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Space Grotesk', margin: '4px 0 2px' }}>
                    {trip.status === 'Dispatched' ? `${telemetry.speed} km/h` : '0 km/h'}
                  </div>
                  <span style={{ fontSize: '10px', color: trip.status === 'Dispatched' ? 'var(--mint-dark)' : 'var(--text-light)', fontWeight: 600 }}>
                    {trip.status === 'Dispatched' ? '● Real-time GPS' : 'Inactive'}
                  </span>
                </div>

                {/* Engine Temp */}
                <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>COOLANT TEMP</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: telemetry.temp > 90 ? '#E11D48' : 'var(--text-primary)', fontFamily: 'Space Grotesk', margin: '4px 0 2px' }}>
                    {trip.status === 'Dispatched' ? `${telemetry.temp} °C` : '—'}
                  </div>
                  <span style={{ fontSize: '10px', color: telemetry.temp > 90 ? '#E11D48' : 'var(--mint-dark)', fontWeight: 600 }}>
                    {trip.status === 'Dispatched' ? (telemetry.temp > 90 ? '⚠️ High Temp Alert' : '● Normal Operating') : 'Inactive'}
                  </span>
                </div>

                {/* RPM gauge */}
                <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ENGINE RPM</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Space Grotesk', margin: '4px 0 2px' }}>
                    {trip.status === 'Dispatched' ? `${fmt(telemetry.rpm)}` : '0'}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 600 }}>
                    {trip.status === 'Dispatched' ? '● Tachometer Sensor' : 'Inactive'}
                  </span>
                </div>

                {/* Fuel rate */}
                <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>FUEL INJECTION</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Space Grotesk', margin: '4px 0 2px' }}>
                    {trip.status === 'Dispatched' ? `${telemetry.fuelRate} L/hr` : '—'}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: 600 }}>
                    {trip.status === 'Dispatched' ? '● Flowmeter sensor' : 'Inactive'}
                  </span>
                </div>

                {/* Tire Pressure */}
                <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TIRE PRESSURE STATUS</span>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Space Grotesk', marginTop: '2px' }}>
                        {trip.status === 'Dispatched' ? `${telemetry.tirePressure} PSI (Average)` : '32.0 PSI'}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(52,211,153,0.15)', color: '#065F46', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      ✅ SAFE
                    </span>
                  </div>
                </div>

              </div>

              {/* GPS Coordinates footer */}
              {trip.status === 'Dispatched' && (
                <div style={{ marginTop: '16px', background: '#F5F3FF', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                  <span>🛰️ GPS: <strong>{telemetry.gps.lat}, {telemetry.gps.lng}</strong></span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Updated {new Date(telemetry.lastUpdated).toLocaleTimeString('en-IN')}</span>
                </div>
              )}
            </div>

          </div>

          {/* Details Tables Grid */}
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
