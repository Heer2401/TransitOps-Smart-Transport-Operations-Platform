import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { toast } from 'react-toastify';

const emptyForm = {
  source: '', destination: '', vehicle: '', driver: '',
  cargoWeight: '', plannedDistance: '', scheduledDate: new Date().toISOString().slice(0, 10),
  revenue: 0, notes: ''
};

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', fuelConsumed: '', actualDistance: '', revenue: '', fuelCostPerLiter: '' });
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchTrips(); }, [filterStatus, search]);

  const fetchTrips = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const res = await api.get('/trips', { params });
      setTrips(res.data);
    } catch { toast.error('Failed to load trips', { theme: 'dark' }); }
    finally { setLoading(false); }
  };

  const openAdd = async () => {
    setError('');
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles/available'),
        api.get('/drivers/available')
      ]);
      setAvailableVehicles(vRes.data);
      setAvailableDrivers(dRes.data);
    } catch { toast.error('Failed to load available resources', { theme: 'dark' }); return; }
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/trips', form);
      toast.success('Trip created!', { theme: 'dark' });
      setShowModal(false);
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating trip');
    } finally { setSubmitting(false); }
  };

  const handleDispatch = async (trip) => {
    if (!confirm(`Dispatch trip ${trip.tripNumber}?\nVehicle: ${trip.vehicle?.registrationNumber}\nDriver: ${trip.driver?.name}`)) return;
    try {
      await api.patch(`/trips/${trip._id}/dispatch`);
      toast.success(`Trip ${trip.tripNumber} dispatched! Vehicle & Driver are now On Trip.`, { theme: 'dark' });
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dispatch failed', { theme: 'dark' });
    }
  };

  const openComplete = (trip) => {
    setSelectedTrip(trip);
    setCompleteForm({ endOdometer: '', fuelConsumed: '', actualDistance: '', revenue: trip.revenue || '', fuelCostPerLiter: '' });
    setShowCompleteModal(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/trips/${selectedTrip._id}/complete`, completeForm);
      toast.success(`Trip ${selectedTrip.tripNumber} completed! Vehicle & Driver now Available.`, { theme: 'dark' });
      setShowCompleteModal(false);
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Complete failed', { theme: 'dark' });
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (trip) => {
    if (!confirm(`Cancel trip ${trip.tripNumber}?`)) return;
    try {
      await api.patch(`/trips/${trip._id}/cancel`);
      toast.success(`Trip ${trip.tripNumber} cancelled.`, { theme: 'dark' });
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed', { theme: 'dark' });
    }
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getSelectedVehicle = () => availableVehicles.find(v => v._id === form.vehicle);

  const statusColors = { Draft: 'var(--text-secondary)', Dispatched: 'var(--primary-light)', Completed: 'var(--success)', Cancelled: 'var(--danger)' };

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>🗺️ Trip Management</h1>
            <p>{trips.length} trips total</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-primary" onClick={openAdd}>+ New Trip</button>
          </div>
        </div>

        <div className="page-container">
          <div className="table-container">
            <div className="table-header">
              <div className="table-title">All Trips</div>
              <div className="table-toolbar">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input className="search-input" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : trips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🗺️</div>
                <div className="empty-title">No trips found</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Trip #</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Cargo</th>
                    <th>Distance</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map(t => (
                    <tr key={t._id}>
                      <td>
                        <button onClick={() => navigate(`/trips/${t._id}`)} style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px' }}>
                          {t.tripNumber}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {t.source} → {t.destination}
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{t.vehicle?.registrationNumber}</span></td>
                      <td>{t.driver?.name}</td>
                      <td>{t.cargoWeight} kg</td>
                      <td>{t.plannedDistance} km</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td style={{ fontSize: '12px' }}>{new Date(t.scheduledDate).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="action-btns">
                          {t.status === 'Draft' && (
                            <button className="topbar-btn btn-primary btn-sm" onClick={() => handleDispatch(t)}>🚀 Dispatch</button>
                          )}
                          {t.status === 'Dispatched' && (
                            <button className="topbar-btn btn-success btn-sm" onClick={() => openComplete(t)}>✅ Complete</button>
                          )}
                          {['Draft', 'Dispatched'].includes(t.status) && (
                            <button className="topbar-btn btn-danger btn-sm" onClick={() => handleCancel(t)}>✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Trip Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">🗺️ Create New Trip</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {error && <div className="alert alert-error">⚠️ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Source *</label>
                    <input name="source" value={form.source} onChange={onChange} placeholder="From city/location" required />
                  </div>
                  <div className="form-group">
                    <label>Destination *</label>
                    <input name="destination" value={form.destination} onChange={onChange} placeholder="To city/location" required />
                  </div>
                  <div className="form-group">
                    <label>Vehicle *</label>
                    <select name="vehicle" value={form.vehicle} onChange={onChange} required>
                      <option value="">Select available vehicle</option>
                      {availableVehicles.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} — {v.name} ({v.maxLoadCapacity} kg cap)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Driver *</label>
                    <select name="driver" value={form.driver} onChange={onChange} required>
                      <option value="">Select available driver</option>
                      {availableDrivers.map(d => (
                        <option key={d._id} value={d._id}>
                          {d.name} — {d.licenseCategory} (Score: {d.safetyScore})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cargo Weight (kg) *</label>
                    <input type="number" name="cargoWeight" value={form.cargoWeight} onChange={onChange} placeholder="e.g. 450" required min="0" />
                    {getSelectedVehicle() && form.cargoWeight && (
                      <span style={{ fontSize: '11px', color: parseFloat(form.cargoWeight) > getSelectedVehicle().maxLoadCapacity ? 'var(--danger)' : 'var(--success)', marginTop: '4px' }}>
                        {parseFloat(form.cargoWeight) > getSelectedVehicle().maxLoadCapacity
                          ? `⚠️ Exceeds max capacity (${getSelectedVehicle().maxLoadCapacity} kg)!`
                          : `✅ Within capacity (${getSelectedVehicle().maxLoadCapacity} kg)`}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Planned Distance (km) *</label>
                    <input type="number" name="plannedDistance" value={form.plannedDistance} onChange={onChange} placeholder="e.g. 250" required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Scheduled Date</label>
                    <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={onChange} />
                  </div>
                  <div className="form-group">
                    <label>Expected Revenue (₹)</label>
                    <input type="number" name="revenue" value={form.revenue} onChange={onChange} placeholder="0" min="0" />
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea name="notes" value={form.notes} onChange={onChange} placeholder="Special instructions..." />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-primary" disabled={submitting}>
                    {submitting ? '⏳ Creating...' : '✅ Create Trip'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete Trip Modal */}
        {showCompleteModal && (
          <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
            <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">✅ Complete Trip — {selectedTrip?.tripNumber}</div>
                <button className="modal-close" onClick={() => setShowCompleteModal(false)}>✕</button>
              </div>

              <div style={{ background: 'rgba(6,214,160,0.07)', border: '1px solid rgba(6,214,160,0.15)', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {selectedTrip?.source} → {selectedTrip?.destination} · {selectedTrip?.driver?.name} · {selectedTrip?.vehicle?.registrationNumber}
              </div>

              <form onSubmit={handleComplete}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label>End Odometer (km) *</label>
                    <input type="number" value={completeForm.endOdometer} onChange={e => setCompleteForm({ ...completeForm, endOdometer: e.target.value })} placeholder="e.g. 50250" required />
                  </div>
                  <div className="form-group">
                    <label>Fuel Consumed (liters) *</label>
                    <input type="number" value={completeForm.fuelConsumed} onChange={e => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} placeholder="e.g. 45" required step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>Fuel Price per Liter (₹)</label>
                    <input type="number" value={completeForm.fuelCostPerLiter} onChange={e => setCompleteForm({ ...completeForm, fuelCostPerLiter: e.target.value })} placeholder="e.g. 95" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Actual Distance (km)</label>
                    <input type="number" value={completeForm.actualDistance} onChange={e => setCompleteForm({ ...completeForm, actualDistance: e.target.value })} placeholder="Leave blank to auto-calculate" />
                  </div>
                  <div className="form-group">
                    <label>Actual Revenue (₹)</label>
                    <input type="number" value={completeForm.revenue} onChange={e => setCompleteForm({ ...completeForm, revenue: e.target.value })} placeholder="0" />
                  </div>
                </div>

                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-success" disabled={submitting}>
                    {submitting ? '⏳...' : '✅ Mark Completed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsPage;
